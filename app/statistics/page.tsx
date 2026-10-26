import Link from "next/link";
import { BOARDING_DAYS } from "@/lib/boarding";
import { getSupabase, isSupabaseConfigured, Attendee } from "@/lib/supabase";
import LogoutButton from "../components/LogoutButton";

export const dynamic = "force-dynamic";

const timeZone = "Africa/Nairobi";

// The calendar date (YYYY-MM-DD) someone registered on, in event time rather than UTC.
function registrationDate(createdAt: string) {
  return new Date(createdAt).toLocaleDateString("en-CA", { timeZone });
}

// Every date from first to last, so days with no registrations still show.
function datesBetween(first: string, last: string) {
  const dates: string[] = [];

  for (let date = new Date(`${first}T00:00:00Z`); date <= new Date(`${last}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) {
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", ...options });
}

export default async function StatisticsPage() {
  const { data, error } = isSupabaseConfigured()
    ? await getSupabase().from("attendees").select("id, gender, boarding, boarding_schedule, children, created_at")
    : { data: [], error: new Error("Supabase is not configured.") };

  const attendees = (data ?? []) as Pick<
    Attendee,
    "id" | "gender" | "boarding" | "boarding_schedule" | "children" | "created_at"
  >[];
  const countChildren = (list: typeof attendees) =>
    list.reduce((sum, attendee) => sum + (attendee.children?.length ?? 0), 0);

  const total = attendees.length;
  const men = attendees.filter((attendee) => attendee.gender === "Male").length;
  const women = attendees.filter((attendee) => attendee.gender === "Female").length;
  const boarding = attendees.filter((attendee) => attendee.boarding).length;
  const boardingMen = attendees.filter((attendee) => attendee.gender === "Male" && attendee.boarding).length;
  const boardingWomen = attendees.filter((attendee) => attendee.gender === "Female" && attendee.boarding).length;
  const children = countChildren(attendees);
  const boardingChildren = countChildren(attendees.filter((attendee) => attendee.boarding));

  const dailyBoarding = BOARDING_DAYS.map((day) => {
    const boarders = attendees.filter((attendee) => attendee.boarding && attendee.boarding_schedule?.includes(day));
    // Children board on the same days as their parent.
    const boardingChildren = countChildren(boarders);

    return {
      day,
      men: boarders.filter((attendee) => attendee.gender === "Male").length,
      women: boarders.filter((attendee) => attendee.gender === "Female").length,
      children: boardingChildren,
      total: boarders.length + boardingChildren,
    };
  });

  const registrationDates = attendees.map((attendee) => registrationDate(attendee.created_at)).sort();
  const dailyRegistrations = registrationDates.length
    ? datesBetween(registrationDates[0], registrationDates[registrationDates.length - 1]).map((date) => {
        const registered = attendees.filter((attendee) => registrationDate(attendee.created_at) === date);
        // Children are counted on the day their parent registered.
        const registeredChildren = countChildren(registered);

        return {
          date,
          men: registered.filter((attendee) => attendee.gender === "Male").length,
          women: registered.filter((attendee) => attendee.gender === "Female").length,
          children: registeredChildren,
          total: registered.length + registeredChildren,
        };
      })
    : [];
  const busiestDayTotal = Math.max(1, ...dailyRegistrations.map((row) => row.total));

  return (
    <main className="page-shell page-shell--narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Statistics</h1>
        </div>
        <div className="header-actions">
          <Link className="secondary-link" href="/attendees">
            Back
          </Link>
          <LogoutButton />
        </div>
      </div>

      {error && <p className="status status--error">Could not load statistics.</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <strong>{total}</strong>
          <span>Total people</span>
        </div>
        <div className="stat-card">
          <strong>{men}</strong>
          <span>Men</span>
        </div>
        <div className="stat-card">
          <strong>{women}</strong>
          <span>Women</span>
        </div>
        <div className="stat-card">
          <strong>{boarding}</strong>
          <span>Boarding people</span>
        </div>
        <div className="stat-card">
          <strong>{boardingMen}</strong>
          <span>Boarding men</span>
        </div>
        <div className="stat-card">
          <strong>{boardingWomen}</strong>
          <span>Boarding women</span>
        </div>
        <div className="stat-card">
          <strong>{children}</strong>
          <span>Children</span>
        </div>
        <div className="stat-card">
          <strong>{boardingChildren}</strong>
          <span>Boarding children</span>
        </div>
      </div>

      <h2 className="section-title">Expected boarding per day</h2>
      <div className="table-wrap table-wrap--compact">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Men</th>
              <th>Women</th>
              <th>Children</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {dailyBoarding.map((row) => (
              <tr key={row.day}>
                <td>{row.day}</td>
                <td>{row.men}</td>
                <td>{row.women}</td>
                <td>{row.children}</td>
                <td>
                  <strong>{row.total}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Registrations per day</h2>
      <div className="table-wrap table-wrap--compact">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Men</th>
              <th>Women</th>
              <th>Children</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {dailyRegistrations.map((row) => (
              <tr key={row.date}>
                {/* Keep day and month together, so on phones only the year wraps. */}
                <td>{formatDate(row.date, { dateStyle: "medium" }).replace(" ", " ")}</td>
                <td>{row.men}</td>
                <td>{row.women}</td>
                <td>{row.children}</td>
                <td>
                  <strong>{row.total}</strong>
                </td>
              </tr>
            ))}
            {!dailyRegistrations.length && (
              <tr>
                <td colSpan={5} className="empty-row">
                  No attendees registered yet.
                </td>
              </tr>
            )}
          </tbody>
          {dailyRegistrations.length > 0 && (
            <tfoot>
              <tr>
                <td>All&nbsp;days</td>
                <td>{men}</td>
                <td>{women}</td>
                <td>{children}</td>
                <td>{total + children}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {dailyRegistrations.length > 0 && (
        <>
          <h2 className="section-title">Total people registered per day</h2>
          <div className="bar-chart">
            {dailyRegistrations.map((row) => (
              <div
                className="bar-chart-column"
                key={row.date}
                title={`${formatDate(row.date, { dateStyle: "medium" })}: ${row.total} ${row.total === 1 ? "person" : "people"}`}
              >
                <div className="bar-chart-track">
                  <div className="bar-chart-bar" style={{ height: `${(row.total / busiestDayTotal) * 100}%` }}>
                    <span>{row.total}</span>
                  </div>
                </div>
                <span className="bar-chart-label">{formatDate(row.date, { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
