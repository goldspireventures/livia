import assert from "node:assert/strict";
import { parseMetaWebhookPayload } from "@workspace/integrations-meta";

const waPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA",
      changes: [
        {
          field: "messages",
          value: {
            metadata: { phone_number_id: "12345" },
            messages: [
              {
                from: "353871234567",
                id: "wamid.x",
                type: "text",
                text: { body: "Book tomorrow?" },
              },
            ],
          },
        },
      ],
    },
  ],
};

const msgs = parseMetaWebhookPayload(waPayload);
assert.equal(msgs.length, 1);
assert.equal(msgs[0]!.channel, "WHATSAPP");
assert.equal(msgs[0]!.businessLookup.whatsappPhoneNumberId, "12345");
assert.equal(msgs[0]!.text, "Book tomorrow?");

console.log("meta-parse.test.ts: ok");
