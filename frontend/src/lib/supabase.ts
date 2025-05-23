import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../config";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Types
export interface Document {
  id: number;
  filename: string;
  upload_date: string;
  file_path: string;
  messages?: Message[];
}

export interface Message {
  id?: number;
  session_id?: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: number;
  document_id: number;
  created_at: string;
  messages?: Message[];
}
