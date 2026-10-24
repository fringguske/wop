import Link from "next/link";
import { BOARDING_DAYS } from "@/lib/boarding";
import { getSupabase, isSupabaseConfigured, Attendee } from "@/lib/supabase";
import LogoutButton from "../components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const { data, error } = isSupabaseConfigured()
    ? await getSupabase().from("attendees").select("id, gender, boarding, boarding_schedule")
    : { data: [], error: new Error("Supabase is not configured.") };

  const attendees = (data ?? []) as Pick<Attendee, "id" | "gender" | "boarding" | "boarding_schedule">[];

  const total = attendees.length;
  const men = attendees.filter((attendee) => attendee.gender === "Male").length;
  const women = attendees.filter((attendee) => attendee.gender === "Female").length;
  const boarding = attendees.filter((attendee) => attendee.boarding).length;
  const boardingMen = attendees.filter((attendee) => attendee.gender === "Male" && attendee.boarding).length;
  const boardingWomen = attendees.filter((attendee) => attendee.gender === "Female" && attendee.boarding).length;

  const dailyBoarding = BOARDING_DAYS.map((day) => {
    const boarders = attendees.filter((attendee) => attendee.boarding && attendee.boarding_schedule?.includes(day));

    return {
      day,
      men: boarders.filter((attendee) => attendee.gender === "Male").length,
      women: boarders.filter((attendee) => attendee.gender === "Female").length,
      total: boarders.length,
    };
  });

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
      </div>

      <h2 className="section-title">Expected boarding per day</h2>
      <div className="table-wrap table-wrap--compact">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Men</th>
              <th>Women</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {dailyBoarding.map((row) => (
              <tr key={row.day}>
                <td>{row.day}</td>
                <td>{row.men}</td>
                <td>{row.women}</td>
                <td>
                  <strong>{row.total}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
