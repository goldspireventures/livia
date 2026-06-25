import assert from "node:assert/strict";
import {
  GATEWAY_PASSWORD_HINT,
  humanizeGatewayAuthError,
} from "../gateway-auth-copy.ts";

assert.match(GATEWAY_PASSWORD_HINT, /8 characters/);

assert.match(
  humanizeGatewayAuthError("form_password_pwned", ""),
  /data breach/i,
);

assert.match(
  humanizeGatewayAuthError("form_identifier_exists", ""),
  /already has an account/i,
);

console.log("gateway-auth-copy.test.ts OK");
