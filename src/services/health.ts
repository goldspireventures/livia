export function getHealthPayload() {
  return {
    ok: true,
    service: "livia",
    time: new Date().toISOString(),
  };
}
