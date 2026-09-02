"use server";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function registerAttendee(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/register?error=config");
  }

  const boarding = formData.get("boarding") === "yes";
  const boardingDaysValue = Number(formData.get("boarding_days"));
  const boardingDays = boarding && Number.isFinite(boardingDaysValue) ? boardingDaysValue : null;

  const { error } = await getSupabase().from("attendees").insert({
    full_name: formData.get("full_name") as string,
    phone_number: formData.get("phone_number") as string,
    address: formData.get("address") as string,
    church: formData.get("church") as string,
    gender: formData.get("gender") as string,
    category: formData.get("category") as string,
    boarding,
    boarding_days: boardingDays,
  });

  if (error) {
    console.error(error.message);
    redirect("/register?error=1");
  }

  redirect("/register?success=1");
}
