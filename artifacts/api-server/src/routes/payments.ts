import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import { sendError } from "../lib/http-errors";
import { replyDomainError } from "../lib/domain-errors";
import {
  createBookingPaymentIntent,
  getPaymentLedgerForBooking,
  issueRefundForPayment,
  PaymentInvariantError,
} from "../services/payment.service";
import { getBookingById } from "../services/bookings.service";

const router: IRouter = Router();
const getBizId = (param: string | string[]) => (Array.isArray(param) ? param[0] : param);

router.get(
  "/businesses/:businessId/bookings/:bookingId/payments",
  requireAuth,
  requireRole("STAFF"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const booking = await getBookingById(businessId, bookingId);
    if (!booking) {
      sendError(res, req, 404, "Booking not found");
      return;
    }
    const ledger = await getPaymentLedgerForBooking(businessId, bookingId);
    res.json(ledger);
  },
);

router.post(
  "/businesses/:businessId/bookings/:bookingId/payment-intent",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const bookingId = getBizId(req.params.bookingId);
    const { amountMinor, currency, description } = req.body as {
      amountMinor?: number;
      currency?: string;
      description?: string;
    };

    const booking = await getBookingById(businessId, bookingId);
    if (!booking) {
      sendError(res, req, 404, "Booking not found");
      return;
    }
    if (!amountMinor || amountMinor <= 0) {
      sendError(res, req, 400, "amountMinor must be a positive integer");
      return;
    }

    try {
      const result = await createBookingPaymentIntent({
        businessId,
        bookingId,
        customerId: booking.customerId,
        amountMinor,
        currency,
        description,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof PaymentInvariantError) {
        sendError(res, req, 400, err.message);
        return;
      }
      replyDomainError(req, res, err);
    }
  },
);

router.post(
  "/businesses/:businessId/payments/:paymentId/refunds",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res): Promise<void> => {
    const businessId = getBizId(req.params.businessId);
    const paymentId = getBizId(req.params.paymentId);
    const { amountMinor, reason, bookingId } = req.body as {
      amountMinor?: number;
      reason?: string;
      bookingId?: string;
    };

    if (!amountMinor || amountMinor <= 0) {
      sendError(res, req, 400, "amountMinor must be a positive integer");
      return;
    }

    try {
      const result = await issueRefundForPayment({
        businessId,
        paymentId,
        amountMinor,
        reason,
        bookingId,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof PaymentInvariantError) {
        sendError(res, req, 400, err.message);
        return;
      }
      replyDomainError(req, res, err);
    }
  },
);

export default router;
