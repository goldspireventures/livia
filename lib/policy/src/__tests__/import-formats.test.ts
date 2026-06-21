import { describe, expect, it } from "vitest";
import {
  detectImportFormat,
  normalizeClientRow,
  normalizeServiceRow,
  parseCsvImport,
} from "../import-formats";

describe("import-formats", () => {
  it("detects client export columns", () => {
    const csv = `First Name,Last Name,Email,Phone
Jane,Doe,jane@example.com,+353871234567`;
    const { format, records } = parseCsvImport(csv);
    expect(format?.kind).toBe("clients");
    const client = normalizeClientRow(records[0]!, format!.columnMap);
    expect(client?.firstName).toBe("Jane");
    expect(client?.email).toBe("jane@example.com");
  });

  it("detects service menu columns", () => {
    const csv = `Appointment Type Name,Duration (minutes),Price
Lash fill,60,55`;
    const { format, records } = parseCsvImport(csv);
    expect(format?.kind).toBe("services");
    const svc = normalizeServiceRow(records[0]!, format!.columnMap);
    expect(svc?.name).toBe("Lash fill");
    expect(svc?.durationMinutes).toBe(60);
    expect(svc?.priceMinor).toBe(5500);
  });

  it("detects appointment export columns", () => {
    const headers = ["Date", "Time", "Appointment Type", "First Name", "Email"];
    const format = detectImportFormat(headers);
    expect(format?.kind).toBe("appointments");
  });
});
