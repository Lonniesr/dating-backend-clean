import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`❌ Missing required env var: ${name}`);
  }
  return v.trim();
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function numberEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;

  const parsed = Number(v);
  if (Number.isNaN(parsed)) {
    throw new Error(`❌ Env var ${name} must be a number`);
  }

  return parsed;
}

const NODE_ENV = (process.env.NODE_ENV || "development") as
  | "development"
  | "test"
  | "production";

const env = {
  NODE_ENV,

  PORT: numberEnv("PORT", 10000),

  JWT_SECRET: required("JWT_SECRET"),

  // Admin credentials (optional unless you explicitly use them)
  ADMIN_EMAIL: optional("ADMIN_EMAIL"),
  ADMIN_PASSWORD: optional("ADMIN_PASSWORD"),

  // Public frontend origins (comma-separated)
  CORS_ORIGIN: optional("CORS_ORIGIN"),

  // ✅ Admin-only frontend origins (comma-separated)
  ADMIN_CORS_ORIGIN: optional("ADMIN_CORS_ORIGIN"),

  // Optional Redis
  REDIS_URL: optional("REDIS_URL"),
};

/* =========================
   PRODUCTION VALIDATION
========================= */

if (NODE_ENV === "production") {
  if (!env.CORS_ORIGIN) {
    throw new Error("❌ CORS_ORIGIN must be set in production");
  }

  if (!env.ADMIN_CORS_ORIGIN) {
    console.warn(
      "⚠️ ADMIN_CORS_ORIGIN not set in production. Admin routes will not be origin-restricted."
    );
  }

  if (env.JWT_SECRET.length < 32) {
    throw new Error("❌ JWT_SECRET must be at least 32 characters in production");
  }
}

export { env };