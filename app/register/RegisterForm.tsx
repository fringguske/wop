"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { AttendeeInsert } from "@/lib/supabase";
import AttendeeFields, { readAttendeeForm } from "../components/AttendeeFields";

type UploadStatus = "pending" | "uploading" | "successful" | "failed";
type QueuedRegistration = AttendeeInsert & {
  id: string;
  status: UploadStatus;
  error?: string;
};

export default function RegisterForm() {
  // Changing the key clears the form fields, including the boarding days and children.
  const [formKey, setFormKey] = useState(0);
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
          children: registration.children,
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

    const registration: QueuedRegistration = {
      ...readAttendeeForm(new FormData(event.currentTarget)),
      id: crypto.randomUUID(),
      status: "pending",
    };

    if (registration.boarding && !registration.boarding_schedule?.length) {
      setBoardingDaysError(true);
      return;
    }

    setQueue((current) => [...current, registration]);
    setFormKey((current) => current + 1);
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
        <AttendeeFields
          key={formKey}
          boardingDaysError={boardingDaysError}
          onBoardingDaysChange={() => setBoardingDaysError(false)}
        />

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
