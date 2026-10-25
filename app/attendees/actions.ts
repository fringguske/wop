"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { cleanAttendee } from "@/lib/attendees";
import { AUTH_COOKIE_NAME, canDelete, canEdit, verifyAuthToken } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured, type AttendeeInsert } from "@/lib/supabase";

export async function deleteAttendee(id: string): Promise<{ error?: string }> {
  const role = await verifyAuthToken((await cookies()).get(AUTH_COOKIE_NAME)?.value);

  if (!canDelete(role)) {
    return { error: "Only the superuser can delete attendees." };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const { data, error } = await getSupabase().rpc("delete_attendee", { attendee_id: id });

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Attendee was not deleted. It may already be gone, or the database does not allow deleting." };
  }

  revalidatePath("/attendees");
  revalidatePath("/statistics");
  return {};
}

export async function updateAttendee(id: string, changes: AttendeeInsert): Promise<{ error?: string }> {
  const role = await verifyAuthToken((await cookies()).get(AUTH_COOKIE_NAME)?.value);

  if (!canEdit(role)) {
    return { error: "Only the superuser can edit attendees." };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const result = cleanAttendee(changes);

  if ("error" in result) {
    return { error: result.error };
  }

  const { data, error } = await getSupabase().from("attendees").update(result.attendee).eq("id", id).select("id");

  if (error) {
    return { error: error.message };
  }

  if (!data?.length) {
    return { error: "Attendee was not updated. It may have been deleted, or the database does not allow editing." };
  }

  revalidatePath("/attendees");
  revalidatePath("/statistics");
  return {};
}
