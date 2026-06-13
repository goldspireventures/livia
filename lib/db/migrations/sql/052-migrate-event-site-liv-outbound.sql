-- Lift legacy event_vendor_site Liv templates into businesses.liv_outbound_overrides (one-time).
UPDATE businesses b
SET liv_outbound_overrides = COALESCE(b.liv_outbound_overrides, '{}'::jsonb)
  || jsonb_strip_nulls(jsonb_build_object(
    'decline_reply', NULLIF(TRIM(s.decline_reply_template), ''),
    'enquiry_thanks', NULLIF(TRIM(s.enquiry_thanks_template), ''),
    'quote_whatsapp', NULLIF(TRIM(s.quote_whatsapp_template), '')
  ))
FROM event_vendor_site s
WHERE s.business_id = b.id
  AND b.vertical = 'event-vendors'
  AND (
    NULLIF(TRIM(s.decline_reply_template), '') IS NOT NULL
    OR NULLIF(TRIM(s.enquiry_thanks_template), '') IS NOT NULL
    OR NULLIF(TRIM(s.quote_whatsapp_template), '') IS NOT NULL
  )
  AND (
    COALESCE(b.liv_outbound_overrides, '{}'::jsonb)->>'decline_reply' IS NULL
    OR COALESCE(b.liv_outbound_overrides, '{}'::jsonb)->>'enquiry_thanks' IS NULL
    OR COALESCE(b.liv_outbound_overrides, '{}'::jsonb)->>'quote_whatsapp' IS NULL
  );

UPDATE event_vendor_site
SET
  decline_reply_template = NULL,
  enquiry_thanks_template = NULL,
  quote_whatsapp_template = NULL,
  updated_at = NOW()
WHERE business_id IN (
  SELECT b.id
  FROM businesses b
  WHERE b.vertical = 'event-vendors'
);
