import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /// Pooled Supabase URL — include `pgbouncer=true&connection_limit=1` (see `prisma/schema.prisma`).
  DATABASE_URL: z.string().min(1),
  /// Direct (non-pooled) URL for Prisma Migrate; same DB as `DATABASE_URL`.
  /// Optional at runtime; strongly recommended for `prisma migrate dev` to avoid PgBouncer hangs.
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  /// Resend API key; when unset, booking emails are logged as SKIPPED.
  RESEND_API_KEY: z.string().min(1).optional(),
  /// From address for Resend (e.g. `Bliq <bookings@yourdomain.com>`).
  NOTIFICATION_EMAIL_FROM: z.string().min(1).optional(),
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  /// `mailto:you@example.com` or `https://your-site.example` per Web Push spec.
  VAPID_SUBJECT: z.string().min(1).optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((i) => `${i.path.join(".") || "env"}: ${i.message}`)
    .join("\n");

  throw new Error(`Invalid environment variables:\n${message}`);
}

export const env = parsed.data;
