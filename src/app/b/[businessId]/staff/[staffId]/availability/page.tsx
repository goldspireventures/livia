import { addDays, subDays } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppError } from "@/lib/errors";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getMembershipRoleForUser } from "@/services/business/membershipService";
import { listAvailabilityRulesForStaff } from "@/services/availability/availabilityRuleService";
import { listTimeOffsForStaff } from "@/services/availability/timeOffService";
import { getStaffById } from "@/services/staff/staffService";

import {
  createAvailabilityRuleAction,
  createTimeOffAction,
  deleteAvailabilityRuleAction,
  deleteTimeOffAction,
  toggleAvailabilityRuleAction,
  updateTimeOffAction,
} from "./actions";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function clock(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default async function StaffAvailabilityPage({
  params,
}: {
  params: Promise<{ businessId: string; staffId: string }>;
}) {
  const { businessId, staffId } = await params;
  const userId = await requireOwnerUserId();

  let staff;
  try {
    staff = await getStaffById({ businessId, staffId });
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") {
      notFound();
    }
    throw e;
  }
  const membershipRole = await getMembershipRoleForUser({ userId, businessId });
  const canManage = membershipRole === "OWNER" || membershipRole === "ADMIN";

  const rules = await listAvailabilityRulesForStaff({ businessId, staffId, includeInactive: true });
  const from = subDays(new Date(), 7);
  const to = addDays(new Date(), 120);
  const timeOffs = await listTimeOffsForStaff({ businessId, staffId, from, to });

  return (
    <main className="min-h-0 flex-1">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/b/${businessId}/availability`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          ← All staff
        </Link>
        <Link
          href={`/b/${businessId}/staff/${staffId}/edit`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Edit profile
        </Link>
        <Link
          href={`/b/${businessId}/staff/${staffId}/services`}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Services
        </Link>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{staff.displayName}</h2>
      <p className="text-xs text-zinc-500">Weekly rules use minutes from midnight in the rule&apos;s timezone (0=Sun … 6=Sat).</p>

      <section className="mt-8">
        <h3 className="text-sm font-semibold">Weekly availability</h3>
        {rules.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No rules yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">
                    {WEEKDAY[r.weekday]} · {clock(r.startMinutes)}–{clock(r.endMinutes)}
                  </span>
                  <span className="ml-2 text-xs text-zinc-500">{r.timezone}</span>
                  {!r.active ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                      Inactive
                    </span>
                  ) : null}
                </div>
                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={toggleAvailabilityRuleAction}>
                      <input type="hidden" name="businessId" value={businessId} />
                      <input type="hidden" name="staffId" value={staffId} />
                      <input type="hidden" name="ruleId" value={r.id} />
                      <input type="hidden" name="nextActive" value={r.active ? "false" : "true"} />
                      <button type="submit" className="text-xs font-medium text-zinc-700 underline dark:text-zinc-300">
                        {r.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteAvailabilityRuleAction}>
                      <input type="hidden" name="businessId" value={businessId} />
                      <input type="hidden" name="staffId" value={staffId} />
                      <input type="hidden" name="ruleId" value={r.id} />
                      <button type="submit" className="text-xs font-medium text-red-700 underline dark:text-red-400">
                        Delete
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canManage ? (
          <form action={createAvailabilityRuleAction} className="mt-4 max-w-md space-y-3 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-600">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Add weekly rule</p>
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="staffId" value={staffId} />
            <label className="block text-xs">
              Weekday
              <select name="weekday" className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-950">
                {WEEKDAY.map((label, i) => (
                  <option key={label} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs">
                Start (HH:MM)
                <input
                  name="startTime"
                  required
                  defaultValue="09:00"
                  pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </label>
              <label className="block text-xs">
                End (HH:MM)
                <input
                  name="endTime"
                  required
                  defaultValue="17:00"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </label>
            </div>
            <label className="block text-xs">
              Timezone
              <input
                name="timezone"
                defaultValue="UTC"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              Add rule
            </button>
          </form>
        ) : null}
      </section>

      <section className="mt-10">
        <h3 className="text-sm font-semibold">Time off</h3>
        {timeOffs.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No time off in this window.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {timeOffs.map((t) => (
              <li key={t.id} className="rounded border border-zinc-100 px-2 py-2 dark:border-zinc-800">
                <div>
                  {t.startsAt.toISOString().slice(0, 16)} → {t.endsAt.toISOString().slice(0, 16)} UTC
                  {t.reason ? <span className="text-zinc-500"> — {t.reason}</span> : null}
                </div>
                {canManage ? (
                  <div className="mt-2 flex flex-col gap-3 border-t border-zinc-100 pt-2 dark:border-zinc-800 sm:flex-row sm:items-start">
                    <form action={updateTimeOffAction} className="flex-1 space-y-2">
                      <input type="hidden" name="businessId" value={businessId} />
                      <input type="hidden" name="staffId" value={staffId} />
                      <input type="hidden" name="timeOffId" value={t.id} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block text-xs">
                          Starts
                          <input
                            name="startsAt"
                            type="datetime-local"
                            required
                            defaultValue={t.startsAt.toISOString().slice(0, 16)}
                            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-950"
                          />
                        </label>
                        <label className="block text-xs">
                          Ends
                          <input
                            name="endsAt"
                            type="datetime-local"
                            required
                            defaultValue={t.endsAt.toISOString().slice(0, 16)}
                            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-950"
                          />
                        </label>
                      </div>
                      <label className="block text-xs">
                        Reason
                        <input
                          name="reason"
                          defaultValue={t.reason ?? ""}
                          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </label>
                      <button type="submit" className="text-xs font-medium text-zinc-700 underline dark:text-zinc-300">
                        Save changes
                      </button>
                    </form>
                    <form action={deleteTimeOffAction} className="shrink-0">
                      <input type="hidden" name="businessId" value={businessId} />
                      <input type="hidden" name="staffId" value={staffId} />
                      <input type="hidden" name="timeOffId" value={t.id} />
                      <button type="submit" className="text-xs font-medium text-red-700 underline dark:text-red-400">
                        Delete
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canManage ? (
          <form action={createTimeOffAction} className="mt-4 max-w-md space-y-3 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-600">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Add time off</p>
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="staffId" value={staffId} />
            <label className="block text-xs">
              Starts (datetime local)
              <input
                name="startsAt"
                type="datetime-local"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-xs">
              Ends (datetime local)
              <input
                name="endsAt"
                type="datetime-local"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-xs">
              Reason (optional)
              <input name="reason" className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950" />
            </label>
            <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              Add time off
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
