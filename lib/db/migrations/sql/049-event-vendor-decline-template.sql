-- Liv decline reply template (operator-configured; sent before enquiry closed as lost)
ALTER TABLE event_vendor_site ADD COLUMN IF NOT EXISTS decline_reply_template text;
