import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`❌ Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v : undefined;
}

export const env = {
  NODE_ENV: (process.env.NODE_ENV || "development") as
    | "development"
    | "test"
    | "production",

  PORT: Number(process.env.PORT || 10000),

  JWT_SECRET: required("JWT_SECRET"),

  ADMIN_EMAIL: optional("ADMIN_EMAIL"),
  ADMIN_PASSWORD: optional("ADMIN_PASSWORD"),

  CORS_ORIGIN: optional("CORS_ORIGIN"),
  ADMIN_CORS_ORIGIN: optional("ADMIN_CORS_ORIGIN"),

  REDIS_URL: optional("REDIS_URL"),

  FRONTEND_URL: optional("FRONTEND_URL"),

  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  
  RESEND_API_KEY: required("RESEND_API_KEY"),
  EMAIL_FROM: required("EMAIL_FROM"),
};
