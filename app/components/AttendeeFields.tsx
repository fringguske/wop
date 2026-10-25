"use client";

import { useState } from "react";
import { BOARDING_DAYS } from "@/lib/boarding";
import type { Attendee, AttendeeInsert, Child } from "@/lib/supabase";

const categories = ["Delegate", "Worker", "Clergy", "Guest", "Usher", "Choir", "Protocol", "Media", "Security"];

type ChildRow = Child & { key: number };

let nextChildKey = 0;

function childRow(child: Child = { name: "", age: null, gender: null }): ChildRow {
  return { ...child, key: nextChildKey++ };
}

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function readAttendeeForm(formData: FormData): AttendeeInsert {
  const isBoarding = formValue(formData, "boarding") === "yes";
  const boardingSchedule = isBoarding ? formData.getAll("boarding_schedule").map(String) : [];

  // Every child row has all three inputs, so the lists line up by position.
  const childAges = formData.getAll("child_age").map(String);
  const childGenders = formData.getAll("child_gender").map(String);
  const children = formData.getAll("child_name").map((name, index) => ({
    name: String(name).trim(),
    age: childAges[index] ? Number(childAges[index]) : null,
    gender: childGenders[index] || null,
  }));

  return {
    full_name: formValue(formData, "full_name"),
    phone_number: formValue(formData, "phone_number") || null,
    address: formValue(formData, "address") || null,
    church: formValue(formData, "church") || null,
    category: formValue(formData, "category") || null,
    gender: formValue(formData, "gender") || null,
    registration_amount: formValue(formData, "registration_amount") || null,
    boarding: isBoarding,
    boarding_days: isBoarding ? boardingSchedule.length : null,
    boarding_schedule: boardingSchedule,
    children,
  };
}

export default function AttendeeFields({
  attendee,
  boardingDaysError,
  onBoardingDaysChange,
}: {
  attendee?: Attendee;
  boardingDaysError: boolean;
  onBoardingDaysChange: () => void;
}) {
  const [boarding, setBoarding] = useState(attendee?.boarding ? "yes" : "no");
  const [withChildren, setWithChildren] = useState(attendee?.children?.length ? "yes" : "no");
  const [children, setChildren] = useState(() => (attendee?.children ?? []).map((child) => childRow(child)));

  // Keep a category that is no longer in the list, so editing an older entry does not lose it.
  const categoryOptions =
    attendee?.category && !categories.includes(attendee.category) ? [...categories, attendee.category] : categories;

  function changeWithChildren(value: string) {
    setWithChildren(value);

    if (value === "yes" && !children.length) {
      setChildren([childRow()]);
    }
  }

  return (
    <>
      <label>
        Full name
        <input name="full_name" autoComplete="name" defaultValue={attendee?.full_name} required />
      </label>

      <label>
        Phone number
        <input name="phone_number" autoComplete="tel" defaultValue={attendee?.phone_number ?? ""} required />
      </label>

      <label className="span-2">
        Address
        <input name="address" autoComplete="street-address" defaultValue={attendee?.address ?? ""} />
      </label>

      <label>
        Church
        <input name="church" defaultValue={attendee?.church ?? ""} />
      </label>

      <label>
        Category
        <select name="category" defaultValue={attendee?.category ?? ""} required>
          <option value="" disabled>
            Select category
          </option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        Gender
        <select name="gender" defaultValue={attendee?.gender ?? ""} required>
          <option value="" disabled>
            Select gender
          </option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
      </label>

      <label>
        Registration amount
        <input name="registration_amount" inputMode="decimal" defaultValue={attendee?.registration_amount ?? ""} />
      </label>

      <label>
        Boarding
        <select name="boarding" value={boarding} onChange={(event) => setBoarding(event.target.value)} required>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>

      {boarding === "yes" && (
        <fieldset className="day-picker span-2" onChange={onBoardingDaysChange}>
          <legend>Boarding days</legend>
          <div className="day-options">
            {BOARDING_DAYS.map((day) => (
              <label className="day-option" key={day}>
                <input
                  name="boarding_schedule"
                  type="checkbox"
                  value={day}
                  defaultChecked={attendee?.boarding_schedule?.includes(day)}
                />
                {day}
              </label>
            ))}
          </div>
          {boardingDaysError && <small>Select at least one day.</small>}
        </fieldset>
      )}

      <label>
        Attending with children?
        <select value={withChildren} onChange={(event) => changeWithChildren(event.target.value)}>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </label>

      {withChildren === "yes" && (
        <fieldset className="day-picker span-2">
          <legend>Children (they board on the same days as the parent)</legend>
          {children.map((child) => (
            <div className="child-row" key={child.key}>
              <label>
                Name
                <input name="child_name" defaultValue={child.name} required />
              </label>
              <label>
                Age
                <input name="child_age" type="number" min={0} step={1} inputMode="numeric" defaultValue={child.age ?? ""} />
              </label>
              <label>
                Gender
                {/* No disabled placeholder here: a disabled choice is left out of the form data and would shift the rows. */}
                <select name="child_gender" defaultValue={child.gender ?? ""}>
                  <option value="">-</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </label>
              <button
                className="delete-button"
                type="button"
                onClick={() => setChildren((current) => current.filter((item) => item.key !== child.key))}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="retry-button add-child-button"
            type="button"
            onClick={() => setChildren((current) => [...current, childRow()])}
          >
            Add child
          </button>
        </fieldset>
      )}
    </>
  );
}
