import assert from "node:assert/strict";
import {
  EVENT_CATALOG,
  getEventCatalogEntryByAnalyticsType,
  getEventCatalogEntryByName,
  listV1RequiredEvents,
} from "../event-catalog";

assert.ok(EVENT_CATALOG.length >= 10, "catalog should cover core V1 events");

const activated = getEventCatalogEntryByName("BusinessActivated");
assert.equal(activated?.analyticsType, "BUSINESS_ACTIVATED");
assert.equal(activated?.v1Required, true);

const booking = getEventCatalogEntryByAnalyticsType("BOOKING_CREATED");
assert.equal(booking?.domainBusKey, "booking.created");

const v1 = listV1RequiredEvents();
assert.ok(v1.some((e) => e.name === "BusinessActivated"));
assert.ok(v1.some((e) => e.name === "BookingCreated"));
assert.ok(v1.some((e) => e.name === "BookingRescheduled"));

const review = getEventCatalogEntryByName("ReviewReceived");
assert.equal(review?.analyticsType, "REVIEW_RECEIVED");

const portfolio = getEventCatalogEntryByAnalyticsType("PORTFOLIO_ITEM_ATTACHED");
assert.equal(portfolio?.name, "PortfolioItemAttached");

console.log("event-catalog.test.ts OK");
