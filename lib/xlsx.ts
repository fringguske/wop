import { deflateRawSync } from "node:zlib";

export type XlsxCell = string | number | null | undefined;

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let crc = n;
  for (let bit = 0; bit < 8; bit++) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  const bytes = Buffer.alloc(2);
  bytes.writeUInt16LE(value);
  return bytes;
}

function uint32(value: number) {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value);
  return bytes;
}

// An .xlsx file is a zip of XML files.
function zip(files: [path: string, content: string][]) {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const [path, content] of files) {
    const name = Buffer.from(path, "utf8");
    const data = Buffer.from(content, "utf8");
    const packed = deflateRawSync(data);

    // The header fields shared by the local entry and the central directory entry.
    const fields = Buffer.alloc(26);
    fields.writeUInt16LE(20, 0); // zip version needed
    fields.writeUInt16LE(8, 4); // deflate
    fields.writeUInt16LE(0x21, 8); // modified on 1 Jan 1980
    fields.writeUInt32LE(crc32(data), 10);
    fields.writeUInt32LE(packed.length, 14);
    fields.writeUInt32LE(data.length, 18);
    fields.writeUInt16LE(name.length, 22);

    local.push(uint32(0x04034b50), fields, name, packed);
    central.push(uint32(0x02014b50), uint16(20), fields, Buffer.alloc(10), uint32(offset), name);
    offset += 4 + fields.length + name.length + packed.length;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = [
    uint32(0x06054b50),
    Buffer.alloc(4),
    uint16(files.length),
    uint16(files.length),
    uint32(centralSize),
    uint32(offset),
    uint16(0),
  ];

  return Buffer.concat([...local, ...central, ...end]);
}

function escapeXml(text: string) {
  return text
    .replace(/[^\t\n\r -퟿-�\u{10000}-\u{10FFFF}]/gu, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index: number) {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

function cellXml(value: XlsxCell, ref: string, style: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${style}><v>${value}</v></c>`;
  }

  const text = value === null || value === undefined ? "" : String(value);
  // Stored as text, so Excel never runs it as a formula or drops a phone number's leading 0.
  return text ? `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>` : "";
}

const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const mainNamespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const relationshipNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const packageRelationshipNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";

// Builds a one-sheet Excel file. The first row is the bold header, and it stays in view while scrolling.
export function buildXlsx(sheetName: string, rows: XlsxCell[][]) {
  const columnCount = Math.max(0, ...rows.map((row) => row.length));
  const widths = Array.from({ length: columnCount }, (_, column) => {
    const longest = Math.max(0, ...rows.map((row) => String(row[column] ?? "").length));
    return Math.min(Math.max(longest + 2, 10), 50);
  });

  const sheetRows = rows
    .map((row, rowIndex) => {
      const style = rowIndex === 0 ? ' s="1"' : "";
      const cells = row.map((value, column) => cellXml(value, `${columnName(column)}${rowIndex + 1}`, style)).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  const sheet =
    `${xmlHeader}<worksheet xmlns="${mainNamespace}">` +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    (widths.length
      ? `<cols>${widths.map((width, column) => `<col min="${column + 1}" max="${column + 1}" width="${width}" customWidth="1"/>`).join("")}</cols>`
      : "") +
    `<sheetData>${sheetRows}</sheetData></worksheet>`;

  return zip([
    [
      "[Content_Types].xml",
      `${xmlHeader}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        "</Types>",
    ],
    [
      "_rels/.rels",
      `${xmlHeader}<Relationships xmlns="${packageRelationshipNamespace}">` +
        `<Relationship Id="rId1" Type="${relationshipNamespace}/officeDocument" Target="xl/workbook.xml"/>` +
        "</Relationships>",
    ],
    [
      "xl/workbook.xml",
      `${xmlHeader}<workbook xmlns="${mainNamespace}" xmlns:r="${relationshipNamespace}">` +
        `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
        "</workbook>",
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `${xmlHeader}<Relationships xmlns="${packageRelationshipNamespace}">` +
        `<Relationship Id="rId1" Type="${relationshipNamespace}/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="${relationshipNamespace}/styles" Target="styles.xml"/>` +
        "</Relationships>",
    ],
    ["xl/worksheets/sheet1.xml", sheet],
    [
      "xl/styles.xml",
      `${xmlHeader}<styleSheet xmlns="${mainNamespace}">` +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
        "</styleSheet>",
    ],
  ]);
}
