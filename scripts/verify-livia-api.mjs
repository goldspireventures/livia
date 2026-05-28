#!/usr/bin/env node
import { verifyLiviaApi } from "./lib/verify-livia-api.mjs";

const baseUrl = process.env.LIVIA_API_BASE_URL || "http://127.0.0.1:3000";
const res = await verifyLiviaApi(baseUrl);
if (!res.ok) {
  console.error(res.reason);
  process.exit(1);
}
process.exit(0);

