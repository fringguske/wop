import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!client) {
    client = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return client;
}

export type Child = {
  name: string;
  age: number | null;
  gender: string | null;
};

export type Attendee = {
  id: string;
  full_name: string;
  phone_number: string | null;
  address: string | null;
  church: string | null;
  gender: string | null;
  category: string | null;
  registration_amount: string | null;
  boarding: boolean;
  boarding_days: number | null;
  boarding_schedule: string[] | null;
  children: Child[] | null;
  created_at: string;
};

export type AttendeeInsert = {
  full_name: string;
  phone_number?: string | null;
  address?: string | null;
  church?: string | null;
  gender?: string | null;
  category?: string | null;
  registration_amount?: string | null;
  boarding?: boolean;
  boarding_days?: number | null;
  boarding_schedule?: string[];
  children?: Child[];
};

type Database = {
  public: {
    Tables: {
      attendees: {
        Row: Attendee;
        Insert: AttendeeInsert;
        Update: Partial<AttendeeInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_attendee: {
        Args: { attendee_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
