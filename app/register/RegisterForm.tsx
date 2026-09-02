"use client";

import { useState } from "react";
import { registerAttendee } from "./actions";

const categories = ["Delegate", "Worker", "Clergy", "Guest", "Usher", "Choir", "Protocol", "Media", "Security"];

export default function RegisterForm() {
  const [boarding, setBoarding] = useState("no");

  return (
    <form action={registerAttendee} className="form-grid">
      <label>
        Full name
        <input name="full_name" autoComplete="name" required />
      </label>

      <label>
        Phone number
        <input name="phone_number" autoComplete="tel" required />
      </label>

      <label className="span-2">
        Address
        <input name="address" autoComplete="street-address" />
      </label>

      <label>
        Church
        <input name="church" />
      </label>

      <label>
        Category
        <select name="category" defaultValue="" required>
          <option value="" disabled>
            Select category
          </option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        Gender
        <select name="gender" defaultValue="" required>
          <option value="" disabled>
            Select gender
          </option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
      </label>

      <label>
        Boarding
        <select name="boarding" value={boarding} onChange={(event) => setBoarding(event.target.value)} required>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>

      {boarding === "yes" && (
        <label>
          Boarding days
          <input name="boarding_days" type="number" min="1" step="1" required />
        </label>
      )}

      <button className="primary-button span-2" type="submit">
        Save attendee
      </button>
    </form>
  );
}
