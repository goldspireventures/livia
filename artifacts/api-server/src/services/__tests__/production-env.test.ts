import assert from "node:assert/strict";
import { assertProductionEnvAtBoot } from "../../lib/production-env.js";

const prevNodeEnv = process.env.NODE_ENV;
const prevSkip = process.env.LIVIA_SKIP_PRODUCTION_ENV_CHECK;
const prevDashboard = process.env.DASHBOARD_URL;
const prevMarketing = process.env.MARKETING_URL;
const prevApi = process.env.API_PUBLIC_URL;

function restore() {
  if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = prevNodeEnv;
  if (prevSkip === undefined) delete process.env.LIVIA_SKIP_PRODUCTION_ENV_CHECK;
  else process.env.LIVIA_SKIP_PRODUCTION_ENV_CHECK = prevSkip;
  if (prevDashboard === undefined) delete process.env.DASHBOARD_URL;
  else process.env.DASHBOARD_URL = prevDashboard;
  if (prevMarketing === undefined) delete process.env.MARKETING_URL;
  else process.env.MARKETING_URL = prevMarketing;
  if (prevApi === undefined) delete process.env.API_PUBLIC_URL;
  else process.env.API_PUBLIC_URL = prevApi;
}

try {
  process.env.NODE_ENV = "development";
  assert.doesNotThrow(() => assertProductionEnvAtBoot());

  process.env.NODE_ENV = "production";
  delete process.env.LIVIA_SKIP_PRODUCTION_ENV_CHECK;
  delete process.env.DASHBOARD_URL;
  delete process.env.MARKETING_URL;
  delete process.env.API_PUBLIC_URL;
  assert.throws(() => assertProductionEnvAtBoot(), /Production boot blocked/);

  process.env.DASHBOARD_URL = "https://app.livia-hq.com";
  process.env.MARKETING_URL = "https://livia-hq.com";
  process.env.API_PUBLIC_URL = "https://api.livia-hq.com";
  assert.doesNotThrow(() => assertProductionEnvAtBoot());

  process.env.DASHBOARD_URL = "http://localhost:5173";
  assert.throws(() => assertProductionEnvAtBoot(), /localhost/);

  process.env.LIVIA_SKIP_PRODUCTION_ENV_CHECK = "true";
  assert.doesNotThrow(() => assertProductionEnvAtBoot());

  console.log("production-env.test.ts: ok");
} finally {
  restore();
}
