import { customFetch } from "@workspace/api-client-react";
import { Alert } from "react-native";

export async function notifyBookingRunningLate(
  businessId: string,
  bookingId: string,
  minutesLate: number,
): Promise<void> {
  const res = await customFetch<{ sent: boolean }>(
    `/api/businesses/${businessId}/bookings/${bookingId}/running-late`,
    {
      method: "POST",
      body: JSON.stringify({ minutesLate }),
    },
  );
  Alert.alert(
    res.sent ? "Customer notified" : "Queued",
    res.sent
      ? "SMS sent if your channels are configured."
      : "No SMS sent — check customer phone or Twilio in Settings on web.",
  );
}

export async function notifyTodayRunningLate(
  businessId: string,
  minutesLate: number,
): Promise<void> {
  await customFetch(`/api/businesses/${businessId}/bookings/running-late-broadcast`, {
    method: "POST",
    body: JSON.stringify({ minutesLate }),
  });
  Alert.alert("Queued", "Running-late messages queued for today's confirmed bookings.");
}

export function promptRunningLateMinutes(
  onConfirm: (minutes: number) => void,
): void {
  Alert.alert("Running late", "How many minutes late?", [
    { text: "10 min", onPress: () => onConfirm(10) },
    { text: "15 min", onPress: () => onConfirm(15) },
    { text: "30 min", onPress: () => onConfirm(30) },
    { text: "Cancel", style: "cancel" },
  ]);
}
