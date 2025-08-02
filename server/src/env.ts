import { type Static, type TObject, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

function parseEnv<T extends TObject>(
  schema: T,
  env: Record<string, string | undefined>,
): Static<T> {
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([key]) =>
      Object.keys(schema.properties).includes(key),
    ),
  );
  const converted = Value.Convert(schema, Value.Default(schema, cleaned));
  const isValid = Value.Check(schema, converted);
  if (!isValid) {
    const errors = Value.Errors(schema, converted);
    throw new Error(
      `Invalid environment variables: ${[...errors]
        .map((e) => `${e.path}: ${e.message}`)
        .join(", ")}`,
    );
  }

  return converted;
}

const EnvDTO = Type.Object({
  NODE_ENV: Type.Enum(
    {
      development: "development",
      production: "production",
    },
    { default: "development" },
  ),
  PORT: Type.Number({ default: 3000 }),
  HOSTNAME: Type.String({ default: "localhost" }),
  DATABASE_URL: Type.String({ default: "file:./local.db" }),
  DATABASE_AUTH_TOKEN: Type.Optional(Type.String()),

  // Better Auth variables
  AUTH_SECRET: Type.String(),
  AUTH_TRUSTED_ORIGINS: Type.String(),
  BASE_URL: Type.String(),

  // BulkGate
  BULKGATE_APPID: Type.String(),
  BULKGATE_TOKEN: Type.String(),
});

// Environment-aware helper that works in both server and client contexts
function getEnvSource(): Record<string, string | undefined> {
  // In server context (Node.js/Bun)
  if (typeof Bun !== "undefined" && Bun.env) {
    return Bun.env;
  }

  // Fallback for other server contexts
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }

  // In client context, return empty object (env vars should be injected at build time)
  // Client-side environment variables should be prefixed with VITE_ and handled by Vite
  return {};
}

export const isProd = getEnvSource().NODE_ENV === "production";
export const env = parseEnv(EnvDTO, getEnvSource());
