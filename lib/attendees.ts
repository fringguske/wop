import { cleanBoardingSchedule } from "./boarding";
import type { AttendeeInsert, Child } from "./supabase";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function cleanAge(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const age = Number(value);
  return Number.isInteger(age) && age >= 0 ? age : null;
}

function cleanChildren(value: unknown): Child[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((child) => {
    const name = cleanText(child?.name);
    return name ? [{ name, age: cleanAge(child.age), gender: cleanText(child.gender) }] : [];
  });
}

// Checks and tidies the details sent from the attendee form, for both new and edited attendees.
export function cleanAttendee(body: Record<string, unknown>): { attendee: AttendeeInsert } | { error: string } {
  const fullName = cleanText(body.full_name);

  if (!fullName) {
    return { error: "Full name is required" };
  }

  const boarding = body.boarding === true;
  const boardingSchedule = boarding ? cleanBoardingSchedule(body.boarding_schedule) : [];

  if (boarding && !boardingSchedule.length) {
    return { error: "Select at least one boarding day" };
  }

  return {
    attendee: {
      full_name: fullName,
      phone_number: cleanText(body.phone_number),
      address: cleanText(body.address),
      church: cleanText(body.church),
      gender: cleanText(body.gender),
      category: cleanText(body.category),
      registration_amount: cleanText(body.registration_amount),
      boarding,
      boarding_days: boarding ? boardingSchedule.length : null,
      boarding_schedule: boardingSchedule,
      children: cleanChildren(body.children),
    },
  };
}

export function countChildren(attendees: { children: Child[] | null }[]) {
  return attendees.reduce((sum, attendee) => sum + (attendee.children?.length ?? 0), 0);
}

export function formatChildren(children: Child[] | null | undefined) {
  return (children ?? [])
    .map((child) => {
      const details = [child.age ?? null, child.gender].filter((detail) => detail !== null && detail !== "");
      return details.length ? `${child.name} (${details.join(", ")})` : child.name;
    })
    .join(", ");
}
