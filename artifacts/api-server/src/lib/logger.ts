import pino from "pino";
import { buildLoggerOptions } from "./log-transport";

const isProduction = process.env.NODE_ENV === "production";
const lokiOpts = buildLoggerOptions();

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "info"),
  base: {
    service: "api-server",
    env: process.env.NODE_ENV ?? "development",
  },
  ...lokiOpts,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    "authorization",
    "password",
    "email",
    "phone",
    "Body",
    "body",
    "params",
    "signature",
    "x-twilio-signature",
    "guestToken",
  ],
  ...(!("stream" in lokiOpts && lokiOpts.stream) && !isProduction
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});
