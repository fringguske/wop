"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { Attendee } from "@/lib/supabase";
import AttendeeFields, { readAttendeeForm } from "../../../components/AttendeeFields";
import { updateAttendee } from "../../actions";

export default function EditAttendeeForm({ attendee }: { attendee: Attendee }) {
  const router = useRouter();
  const [boardingDaysError, setBoardingDaysError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const changes = readAttendeeForm(new FormData(event.currentTarget));

    if (changes.boarding && !changes.boarding_schedule?.length) {
      setBoardingDaysError(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateAttendee(attendee.id, changes);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/attendees");
    });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <AttendeeFields
        attendee={attendee}
        boardingDaysError={boardingDaysError}
        onBoardingDaysChange={() => setBoardingDaysError(false)}
      />

      {error && <p className="status status--error span-2">{error}</p>}

      <button className="primary-button span-2" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
