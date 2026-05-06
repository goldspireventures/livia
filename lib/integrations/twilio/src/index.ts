// Thin Twilio REST client (Programmable Messaging + IncomingPhoneNumbers +
// AvailablePhoneNumbers). Pure fetch — no Twilio SDK — so the api-server
// bundle stays small. Also exposes a self-contained webhook signature
// validator (HMAC-SHA1 over sorted form params) so we don't need the SDK to
// secure the inbound SMS route.

import { createHmac } from "node:crypto";

const TWILIO_BASE = "https://api.twilio.com/2010-04-01";

export interface TwilioCreds {
  accountSid: string;
  authToken: string;
}

export interface TwilioSendSmsArgs {
  from: string;
  to: string;
  body: string;
  statusCallback?: string;
}

export interface TwilioSendSmsResult {
  sid: string;
  status: string;
}

export interface TwilioPhoneNumberResource {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  smsUrl: string | null;
}

export class TwilioError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Twilio HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export interface TwilioClient {
  sendSms(args: TwilioSendSmsArgs): Promise<TwilioSendSmsResult>;
  searchAvailableLocalNumbers(args: {
    countryCode: string;
    areaCode?: string;
    smsEnabled?: boolean;
    limit?: number;
  }): Promise<Array<{ phoneNumber: string; friendlyName: string; isoCountry: string }>>;
  purchasePhoneNumber(args: {
    phoneNumber: string;
    smsUrl: string;
    friendlyName?: string;
  }): Promise<TwilioPhoneNumberResource>;
  releasePhoneNumber(sid: string): Promise<void>;
}

function authHeader(creds: TwilioCreds): string {
  return `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64")}`;
}

async function twilioFetch(creds: TwilioCreds, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${TWILIO_BASE}/Accounts/${creds.accountSid}${path}`, {
    ...init,
    headers: {
      authorization: authHeader(creds),
      accept: "application/json",
      ...(init.body ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const msg = (body as { message?: string }).message;
    throw new TwilioError(res.status, body, msg);
  }
  return body;
}

function form(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    usp.append(k, String(v));
  }
  return usp.toString();
}

export function createTwilioClient(creds: TwilioCreds): TwilioClient {
  return {
    async sendSms(args) {
      const body = form({
        From: args.from,
        To: args.to,
        Body: args.body,
        StatusCallback: args.statusCallback,
      });
      const res = (await twilioFetch(creds, "/Messages.json", {
        method: "POST",
        body,
      })) as { sid: string; status: string };
      return { sid: res.sid, status: res.status };
    },

    async searchAvailableLocalNumbers(args) {
      const params = form({
        AreaCode: args.areaCode,
        SmsEnabled: args.smsEnabled ?? true,
        PageSize: args.limit ?? 5,
      });
      const path = `/AvailablePhoneNumbers/${encodeURIComponent(args.countryCode)}/Local.json?${params}`;
      const res = (await twilioFetch(creds, path)) as {
        available_phone_numbers?: Array<{
          phone_number: string;
          friendly_name: string;
          iso_country: string;
        }>;
      };
      return (res.available_phone_numbers ?? []).map((n) => ({
        phoneNumber: n.phone_number,
        friendlyName: n.friendly_name,
        isoCountry: n.iso_country,
      }));
    },

    async purchasePhoneNumber(args) {
      const body = form({
        PhoneNumber: args.phoneNumber,
        SmsUrl: args.smsUrl,
        SmsMethod: "POST",
        FriendlyName: args.friendlyName,
      });
      const res = (await twilioFetch(creds, "/IncomingPhoneNumbers.json", {
        method: "POST",
        body,
      })) as {
        sid: string;
        phone_number: string;
        friendly_name: string;
        sms_url: string | null;
      };
      return {
        sid: res.sid,
        phoneNumber: res.phone_number,
        friendlyName: res.friendly_name,
        smsUrl: res.sms_url,
      };
    },

    async releasePhoneNumber(sid) {
      await twilioFetch(creds, `/IncomingPhoneNumbers/${encodeURIComponent(sid)}.json`, {
        method: "DELETE",
      });
    },
  };
}

// Twilio-style request signature: HMAC-SHA1 over (url + sorted-concat of
// form params). Implemented directly so we don't need the Twilio SDK just
// to validate webhooks. See:
// https://www.twilio.com/docs/usage/webhooks/webhooks-security
export function validateTwilioSignature(args: {
  authToken: string;
  signatureHeader: string | undefined;
  url: string; // full URL incl. scheme + host + path the webhook was POSTed to
  params: Record<string, string>; // x-www-form-urlencoded body parsed
}): boolean {
  if (!args.signatureHeader) return false;
  const sortedKeys = Object.keys(args.params).sort();
  const concat = sortedKeys.map((k) => k + args.params[k]).join("");
  const data = args.url + concat;
  const expected = createHmac("sha1", args.authToken).update(data).digest("base64");
  // Constant-time compare (length-aware) — both base64 strings of equal length.
  if (expected.length !== args.signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ args.signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}

// Minimal TwiML response for inbound webhook ACK — we don't reply via TwiML
// (we send the AI reply via a separate Messages.create call) so an empty
// <Response/> is the correct ACK.
export const TWIML_EMPTY_RESPONSE = '<?xml version="1.0" encoding="UTF-8"?><Response/>';
