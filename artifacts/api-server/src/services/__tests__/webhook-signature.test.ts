import { createHmac } from "node:crypto";

function sign(secret: string, timestamp: number, body: string): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

function verify(secret: string, header: string, body: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    }),
  );
  const t = Number(parts.t);
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const expected = sign(secret, t, body).split("v1=")[1];
  return v1 === expected;
}

const secret = "whsec_test";
const body = JSON.stringify({ id: "evt_1", type: "booking.confirmed", data: {} });
const ts = 1_700_000_000;
const header = sign(secret, ts, body);

if (!verify(secret, header, body)) {
  console.error("webhook signature verify failed");
  process.exit(1);
}
if (verify(secret, header, body + "tampered")) {
  console.error("webhook signature should reject tampered body");
  process.exit(1);
}
console.log("webhook-signature.test.ts: ok");
