import { bookingReminderT24 } from "./booking-reminder";
import { weeklyDigest } from "./weekly-digest";
import { noShowRecovery } from "./no-show-recovery";
import { timeOffApproval } from "./time-off-approval";
import { livWasWrong } from "./liv-was-wrong";
import { morningBriefingCron } from "./morning-briefing";
import { hostRentCollect } from "./host-rent-collect";
import { staffBorrowWorkflow } from "./staff-borrow";
import { multiBrandBriefing } from "./multi-brand-briefing";
import { partnerVoteWorkflow } from "./partner-vote";
import { classSessionReminder } from "./class-session-reminder";
import { tattooDesignProofWorkflow } from "./tattoo-design-proof";
import { platformNotificationDeliver } from "./platform-notification-deliver";
import { platformOutboundDeliver } from "./platform-outbound-deliver";
import { platformInboundReply } from "./platform-inbound-reply";
import { bookingContinuityBridge } from "./booking-continuity";
import { waitlistOfferOnCancel } from "./waitlist-offer";
import { runningLateBroadcast } from "./running-late-broadcast";
import { livBriefingRefresh } from "./liv-briefing-refresh";
import { postVisitFeedback } from "./post-visit-feedback";
import { aftercareFollowup } from "./aftercare-followup";
import { refundLadderWorkflow } from "./refund-ladder";
import { commerceIntelligenceDaily } from "./commerce-intelligence-daily";
import { commerceWeeklyDigest } from "./commerce-weekly-digest";
import { twinObservationsDaily } from "./twin-observations-daily";

export const workflowFunctions = [
  bookingReminderT24,
  weeklyDigest,
  noShowRecovery,
  timeOffApproval,
  livWasWrong,
  morningBriefingCron,
  hostRentCollect,
  staffBorrowWorkflow,
  multiBrandBriefing,
  partnerVoteWorkflow,
  classSessionReminder,
  tattooDesignProofWorkflow,
  platformNotificationDeliver,
  platformOutboundDeliver,
  platformInboundReply,
  bookingContinuityBridge,
  waitlistOfferOnCancel,
  runningLateBroadcast,
  livBriefingRefresh,
  postVisitFeedback,
  aftercareFollowup,
  refundLadderWorkflow,
  commerceIntelligenceDaily,
  commerceWeeklyDigest,
  twinObservationsDaily,
];
