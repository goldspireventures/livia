export function getHealthPayload() {
  return {
    ok: true,
    service: "bliq",
    time: new Date().toISOString(),
  };
}
