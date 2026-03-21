import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

console.log("🔑 SUPABASE URL:", env.SUPABASE_URL);
console.log("🔑 SERVICE ROLE KEY EXISTS:", !!env.SUPABASE_SERVICE_ROLE_KEY);

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);