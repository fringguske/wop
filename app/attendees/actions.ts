"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function deleteAttendee(id: string): Promise<{ error?: string }> {
  const role = await verifyAuthToken((await cookies()).get(AUTH_COOKIE_NAME)?.value);

  if (role !== "admin") {
    return { error: "Only admins can delete attendees." };
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
