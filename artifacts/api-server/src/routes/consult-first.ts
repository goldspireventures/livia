import { Router, type IRouter } from "express";
import { withBusinessFeature } from "../lib/wedge-api-gate";
import { sendError } from "../lib/http-errors";
import {
  addMoodBoardItem,
  deleteMoodBoardItem,
  generateQuoteFromEnquiry,
  createManualQuote,
  deleteDraftQuote,
  getConsultFirstDashboard,
  getEnquiry,
  getEnquiryQuoteBrief,
  getEventVendorSite,
  getLivDraftForEnquiry,
  getLivDraftForQuote,
  getLivDeclineDraft,
  getLivDraftForStaleQuote,
  declineEnquiryWithLivReply,
  getQuoteWithLines,
  listEnquiries,
  listMoodBoardItems,
  listQuoteTemplates,
  listQuotesWithEnquiry,
  requestPostEventReview,
  reviseSentQuote,
  sendMoodBoardForApproval,
  sendQuote,
  updateEnquiry,
  updateEventVendorSite,
  updateMoodBoardItem,
  updateQuote,
  upsertQuoteTemplate,
} from "../services/consult-first.service";
import {
  completePrepTask,
  getEventPrepView,
  getOperatorPrepNudgeDraft,
  onQuoteAccepted,
} from "../services/event-vendor-lifecycle.service";

const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/event-vendor/dashboard",
  ...withBusinessFeature("event-vendor", "STAFF", async (req, res) => {
    res.json(await getConsultFirstDashboard(bizId(req.params.businessId)));
  }),
);

router.get(
  "/businesses/:businessId/event-vendor/site",
  ...withBusinessFeature("event-vendor", "STAFF", async (req, res) => {
    res.json(await getEventVendorSite(bizId(req.params.businessId)));
  }),
);

router.patch(
  "/businesses/:businessId/event-vendor/site",
  ...withBusinessFeature("event-vendor", "ADMIN", async (req, res) => {
    res.json(await updateEventVendorSite(bizId(req.params.businessId), req.body ?? {}));
  }),
);

router.get(
  "/businesses/:businessId/enquiries",
  ...withBusinessFeature("enquiries", "STAFF", async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const customerId =
      typeof req.query.customerId === "string" ? req.query.customerId : undefined;
    res.json(await listEnquiries(bizId(req.params.businessId), status, customerId));
  }),
);

router.get(
  "/businesses/:businessId/enquiries/:enquiryId",
  ...withBusinessFeature("enquiries", "STAFF", async (req, res) => {
    const row = await getEnquiry(bizId(req.params.businessId), bizId(req.params.enquiryId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.patch(
  "/businesses/:businessId/enquiries/:enquiryId",
  ...withBusinessFeature("enquiries", "ADMIN", async (req, res) => {
    if ((req.body as { status?: string } | undefined)?.status === "lost") {
      sendError(res, req, 409, "use_decline_with_liv");
      return;
    }
    const row = await updateEnquiry(bizId(req.params.businessId), bizId(req.params.enquiryId), req.body ?? {});
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.get(
  "/businesses/:businessId/enquiries/:enquiryId/decline-draft",
  ...withBusinessFeature("enquiries", "STAFF", async (req, res) => {
    const row = await getLivDeclineDraft(bizId(req.params.businessId), bizId(req.params.enquiryId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.post(
  "/businesses/:businessId/enquiries/:enquiryId/decline-with-liv",
  ...withBusinessFeature("enquiries", "ADMIN", async (req, res) => {
    const result = await declineEnquiryWithLivReply(
      bizId(req.params.businessId),
      bizId(req.params.enquiryId),
    );
    if (!result.ok) {
      if (result.reason === "send_failed") {
        sendError(res, req, 502, "liv_decline_send_failed");
        return;
      }
      sendError(res, req, result.reason === "already_closed" ? 409 : 404, result.reason);
      return;
    }
    res.json(result);
  }),
);

router.get(
  "/businesses/:businessId/enquiries/:enquiryId/quote-brief",
  ...withBusinessFeature("enquiries", "STAFF", async (req, res) => {
    const row = await getEnquiryQuoteBrief(bizId(req.params.businessId), bizId(req.params.enquiryId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.get(
  "/businesses/:businessId/quotes",
  ...withBusinessFeature("quotes", "STAFF", async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    res.json(await listQuotesWithEnquiry(bizId(req.params.businessId), status));
  }),
);

router.get(
  "/businesses/:businessId/quotes/:quoteId",
  ...withBusinessFeature("quotes", "STAFF", async (req, res) => {
    const row = await getQuoteWithLines(bizId(req.params.businessId), bizId(req.params.quoteId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.post(
  "/businesses/:businessId/quotes",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const enquiryId =
      typeof req.body?.enquiryId === "string" ? req.body.enquiryId : undefined;
    const customerId =
      typeof req.body?.customerId === "string" ? req.body.customerId : undefined;
    const forceNew = req.body?.forceNew === true;
    const row = await createManualQuote(bizId(req.params.businessId), {
      enquiryId,
      customerId,
      forceNew,
    });
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.status(201).json(row);
  }),
);

router.delete(
  "/businesses/:businessId/quotes/:quoteId",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const row = await deleteDraftQuote(
      bizId(req.params.businessId),
      bizId(req.params.quoteId),
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.post(
  "/businesses/:businessId/enquiries/:enquiryId/quotes",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const templateId = typeof req.body?.templateId === "string" ? req.body.templateId : undefined;
    const row = await generateQuoteFromEnquiry(
      bizId(req.params.businessId),
      bizId(req.params.enquiryId),
      templateId,
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.status(201).json(row);
  }),
);

router.patch(
  "/businesses/:businessId/quotes/:quoteId",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const row = await updateQuote(bizId(req.params.businessId), bizId(req.params.quoteId), req.body ?? {});
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.post(
  "/businesses/:businessId/quotes/:quoteId/send",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const via = req.body?.via === "whatsapp_assisted" ? "whatsapp_assisted" : "email";
    const row = await sendQuote(bizId(req.params.businessId), bizId(req.params.quoteId), via);
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.get(
  "/businesses/:businessId/quote-templates",
  ...withBusinessFeature("quotes", "STAFF", async (req, res) => {
    res.json(await listQuoteTemplates(bizId(req.params.businessId)));
  }),
);

router.post(
  "/businesses/:businessId/quote-templates",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const row = await upsertQuoteTemplate(bizId(req.params.businessId), req.body ?? {});
    res.status(201).json(row);
  }),
);

router.patch(
  "/businesses/:businessId/quote-templates/:templateId",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const row = await upsertQuoteTemplate(bizId(req.params.businessId), {
      ...req.body,
      id: bizId(req.params.templateId),
    });
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.get(
  "/businesses/:businessId/enquiries/:enquiryId/mood-board",
  ...withBusinessFeature("enquiries", "STAFF", async (req, res) => {
    res.json(
      await listMoodBoardItems(bizId(req.params.businessId), bizId(req.params.enquiryId)),
    );
  }),
);

router.post(
  "/businesses/:businessId/enquiries/:enquiryId/mood-board",
  ...withBusinessFeature("enquiries", "ADMIN", async (req, res) => {
    const row = await addMoodBoardItem(
      bizId(req.params.businessId),
      bizId(req.params.enquiryId),
      req.body ?? {},
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.status(201).json(row);
  }),
);

router.patch(
  "/businesses/:businessId/mood-board/:itemId",
  ...withBusinessFeature("enquiries", "ADMIN", async (req, res) => {
    const row = await updateMoodBoardItem(
      bizId(req.params.businessId),
      bizId(req.params.itemId),
      req.body ?? {},
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.delete(
  "/businesses/:businessId/mood-board/:itemId",
  ...withBusinessFeature("enquiries", "ADMIN", async (req, res) => {
    const row = await deleteMoodBoardItem(bizId(req.params.businessId), bizId(req.params.itemId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json({ ok: true });
  }),
);

router.get(
  "/businesses/:businessId/enquiries/:enquiryId/liv-draft",
  ...withBusinessFeature("enquiries", "STAFF", async (req, res) => {
    const row = await getLivDraftForEnquiry(bizId(req.params.businessId), bizId(req.params.enquiryId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.get(
  "/businesses/:businessId/quotes/:quoteId/liv-draft",
  ...withBusinessFeature("quotes", "STAFF", async (req, res) => {
    const row = await getLivDraftForQuote(bizId(req.params.businessId), bizId(req.params.quoteId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.get(
  "/businesses/:businessId/quotes/:quoteId/stale-liv-draft",
  ...withBusinessFeature("quotes", "STAFF", async (req, res) => {
    const row = await getLivDraftForStaleQuote(bizId(req.params.businessId), bizId(req.params.quoteId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.post(
  "/businesses/:businessId/enquiries/:enquiryId/request-review",
  ...withBusinessFeature("enquiries", "ADMIN", async (req, res) => {
    const row = await requestPostEventReview(bizId(req.params.businessId), bizId(req.params.enquiryId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.get(
  "/businesses/:businessId/quotes/:quoteId/event-prep",
  ...withBusinessFeature("quotes", "STAFF", async (req, res) => {
    const row = await getEventPrepView(bizId(req.params.businessId), bizId(req.params.quoteId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.patch(
  "/businesses/:businessId/quotes/:quoteId/event-prep/:taskId/complete",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const row = await completePrepTask(
      bizId(req.params.businessId),
      bizId(req.params.quoteId),
      bizId(req.params.taskId),
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.get(
  "/businesses/:businessId/quotes/:quoteId/event-prep/:taskId/liv-nudge",
  ...withBusinessFeature("quotes", "STAFF", async (req, res) => {
    const row = await getOperatorPrepNudgeDraft(
      bizId(req.params.businessId),
      bizId(req.params.quoteId),
      bizId(req.params.taskId),
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.post(
  "/businesses/:businessId/quotes/:quoteId/revise",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const row = await reviseSentQuote(bizId(req.params.businessId), bizId(req.params.quoteId));
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.post(
  "/businesses/:businessId/enquiries/:enquiryId/mood-board/send",
  ...withBusinessFeature("enquiries", "ADMIN", async (req, res) => {
    const row = await sendMoodBoardForApproval(
      bizId(req.params.businessId),
      bizId(req.params.enquiryId),
    );
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

router.post(
  "/businesses/:businessId/quotes/:quoteId/deposit-reminder",
  ...withBusinessFeature("quotes", "ADMIN", async (req, res) => {
    const row = await onQuoteAccepted(bizId(req.params.businessId), bizId(req.params.quoteId), {
      force: req.body?.force === true,
    });
    if (!row) {
      sendError(res, req, 404, "not_found");
      return;
    }
    res.json(row);
  }),
);

export default router;
