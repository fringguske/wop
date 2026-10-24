"use client";

import { useTransition } from "react";
import { deleteAttendee } from "./actions";

export default function DeleteAttendeeButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Delete ${name}? A backup copy will be kept.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAttendee(id);

      if (result.error) {
        window.alert(result.error);
      }
    });
  }

  return (
    <button className="delete-button" type="button" onClick={handleClick} disabled={pending}>
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
