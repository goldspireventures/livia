export type QuoteMilestoneDeposit = {
  label: string;
  percent: number;
  amountMinor: number;
  dueDate?: string | null;
};

export type QuoteMilestonePaymentView = {
  milestones: Array<
    QuoteMilestoneDeposit & {
      paidMinor: number;
      status: "paid" | "due" | "upcoming";
    }
  >;
  nextDueMinor: number;
  nextLabel: string;
  nextDueDate?: string;
  nextIndex: number;
  /** First milestone / securing deposit satisfied */
  dateSecured: boolean;
  /** All schedule items collected */
  scheduleFullyPaid: boolean;
};

function milestoneSchedule(quote: {
  milestoneDeposits?: QuoteMilestoneDeposit[] | null;
  depositAmountMinor: number;
  subtotalMinor: number;
}): QuoteMilestoneDeposit[] {
  const rows = quote.milestoneDeposits ?? [];
  if (rows.length > 0) return rows;
  return [
    {
      label: "Deposit",
      percent: quote.subtotalMinor
        ? Math.round((quote.depositAmountMinor / quote.subtotalMinor) * 100)
        : 0,
      amountMinor: quote.depositAmountMinor,
    },
  ];
}

/** Walk cumulative milestone amounts against depositPaidMinor. */
export function resolveQuoteMilestonePayment(quote: {
  milestoneDeposits?: QuoteMilestoneDeposit[] | null;
  depositAmountMinor: number;
  depositPaidMinor: number;
  subtotalMinor: number;
}): QuoteMilestonePaymentView {
  const schedule = milestoneSchedule(quote);
  const today = new Date().toISOString().slice(0, 10);
  let allocated = 0;
  let nextDueMinor = 0;
  let nextLabel = schedule[0]?.label ?? "Deposit";
  let nextDueDate: string | undefined;
  let nextIndex = 0;
  let foundNext = false;

  const milestones = schedule.map((m, index) => {
    const milestoneEnd = allocated + m.amountMinor;
    const paidMinor = Math.max(
      0,
      Math.min(m.amountMinor, quote.depositPaidMinor - allocated),
    );
    allocated = milestoneEnd;

    let status: "paid" | "due" | "upcoming" = "paid";
    if (paidMinor < m.amountMinor) {
      const dueDate = m.dueDate?.slice(0, 10);
      status = dueDate && dueDate > today ? "upcoming" : "due";
      if (!foundNext && status === "due") {
        foundNext = true;
        nextDueMinor = m.amountMinor - paidMinor;
        nextLabel = m.label;
        nextDueDate = dueDate;
        nextIndex = index;
      }
    }

    return { ...m, paidMinor, status };
  });

  if (!foundNext) {
    nextDueMinor = 0;
    nextIndex = schedule.length;
  }

  const dateSecured = quote.depositPaidMinor >= quote.depositAmountMinor;
  const scheduleFullyPaid = quote.depositPaidMinor >= quote.subtotalMinor;

  return {
    milestones,
    nextDueMinor,
    nextLabel,
    nextDueDate,
    nextIndex,
    dateSecured,
    scheduleFullyPaid,
  };
}
