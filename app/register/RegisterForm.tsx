"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { BOARDING_DAYS } from "@/lib/boarding";
import type { AttendeeInsert } from "@/lib/supabase";

const categories = ["Delegate", "Worker", "Clergy", "Guest", "Usher", "Choir", "Protocol", "Media", "Security"];
type UploadStatus = "pending" | "uploading" | "successful" | "failed";
type QueuedRegistration = AttendeeInsert & {
  id: string;
  status: UploadStatus;
  error?: string;
};

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export default function RegisterForm() {
  const [boarding, setBoarding] = useState("no");
  const [boardingDaysError, setBoardingDaysError] = useState(false);
  const [queue, setQueue] = useState<QueuedRegistration[]>([]);
  const uploadingRef = useRef(false);

  const uploadRegistration = useCallback(async (registration: QueuedRegistration) => {
    setQueue((current) =>
      current.map((item) => (item.id === registration.id ? { ...item, status: "uploading", error: undefined } : item)),
    );

    try {
      const response = await fetch("/api/attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: registration.full_name,
          phone_number: registration.phone_number,
          address: registration.address,
          church: registration.church,
          category: registration.category,
          gender: registration.gender,
          registration_amount: registration.registration_amount,
          boarding: registration.boarding,
          boarding_schedule: registration.boarding_schedule,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Upload failed");
      }

      setQueue((current) =>
        current.map((item) => (item.id === registration.id ? { ...item, status: "successful" } : item)),
      );
    } catch (error) {
      setQueue((current) =>
        current.map((item) =>
          item.id === registration.id
            ? { ...item, status: "failed", error: error instanceof Error ? error.message : "Upload failed" }
            : item,
        ),
      );
    } finally {
      uploadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (uploadingRef.current) {
      return;
    }

    const nextRegistration = queue.find((item) => item.status === "pending");

    if (!nextRegistration) {
      return;
    }

    uploadingRef.current = true;
    void uploadRegistration(nextRegistration);
  }, [queue, uploadRegistration]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const isBoarding = formValue(formData, "boarding") === "yes";
    const boardingSchedule = isBoarding ? formData.getAll("boarding_schedule").map(String) : [];

    if (isBoarding && !boardingSchedule.length) {
      setBoardingDaysError(true);
      return;
    }

    const registration: QueuedRegistration = {
      id: crypto.randomUUID(),
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
      status: "pending",
    };

    setQueue((current) => [...current, registration]);
    form.reset();
    setBoarding("no");
    setBoardingDaysError(false);
  }

  function retryRegistration(id: string) {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "pending", error: undefined } : item)),
    );
  }

  return (
    <>
      <form className="form-grid" onSubmit={handleSubmit}>
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
          Registration amount
          <input name="registration_amount" inputMode="decimal" />
        </label>

        <label>
          Boarding
          <select name="boarding" value={boarding} onChange={(event) => setBoarding(event.target.value)} required>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>

        {boarding === "yes" && (
          <fieldset className="day-picker span-2" onChange={() => setBoardingDaysError(false)}>
            <legend>Boarding days</legend>
            <div className="day-options">
              {BOARDING_DAYS.map((day) => (
                <label className="day-option" key={day}>
                  <input name="boarding_schedule" type="checkbox" value={day} />
                  {day}
                </label>
              ))}
            </div>
            {boardingDaysError && <small>Select at least one day.</small>}
          </fieldset>
        )}

        <button className="primary-button span-2" type="submit">
          Save attendee
        </button>
      </form>

      {queue.length > 0 && (
        <div className="upload-queue">
          {queue
            .slice()
            .reverse()
            .map((item) => (
              <div className="upload-item" data-status={item.status} key={item.id}>
                <div>
                  <strong>{item.full_name}</strong>
                  <span>{item.status}</span>
                  {item.error && <small>{item.error}</small>}
                </div>
                {item.status === "failed" && (
                  <button className="retry-button" type="button" onClick={() => retryRegistration(item.id)}>
                    Retry
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </>
  );
}
