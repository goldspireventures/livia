-- Operator-configured Liv outbound copy (enquiry thanks + quote WhatsApp assist)
ALTER TABLE event_vendor_site ADD COLUMN IF NOT EXISTS enquiry_thanks_template text;
ALTER TABLE event_vendor_site ADD COLUMN IF NOT EXISTS quote_whatsapp_template text;
