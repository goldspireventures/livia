import pg from "pg";

const { Client } = pg;

function id() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

const SLUG = "luxe-salon-spa";
const OWNER_ID = process.env.SEED_DEMO_OWNER_ID ?? "seed-demo-user";
const OWNER_EMAIL = process.env.SEED_DEMO_OWNER_EMAIL ?? "seed-demo@livia.local";

const connectionString = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL or DATABASE_URL must be set");
  process.exit(1);
}

const client = new Client({ connectionString });
await client.connect();

const messagingChannels = JSON.stringify({
  whatsapp: { phoneNumberId: "demo_wa_luxe", displayPhone: "+44 7700 900123" },
  instagram: { pageId: "demo_ig_luxe_page" },
  messenger: { pageId: "demo_ig_luxe_page" },
});

async function ensureSocialInbox(bizId) {
  const hasWa = await client.query(
    `SELECT 1 FROM conversations WHERE business_id = $1 AND channel = 'WHATSAPP' LIMIT 1`,
    [bizId],
  );
  if (hasWa.rows.length > 0) return;
  const convWa = id();
  const convIg = id();
  const ts = new Date().toISOString();
  await client.query(
    `INSERT INTO conversations (id, business_id, channel, status, customer_name, customer_phone, ai_handled, last_message_at, created_at, updated_at)
     VALUES ($1,$2,'WHATSAPP','OPEN','Emma Walsh','447700900456',true,$3,$3,$3)`,
    [convWa, bizId, ts],
  );
  await client.query(
    `INSERT INTO conversations (id, business_id, channel, status, customer_name, customer_phone, ai_handled, last_message_at, created_at, updated_at)
     VALUES ($1,$2,'INSTAGRAM','OPEN','@sophie_styles','meta:ig_demo_sophie',true,$3,$3,$3)`,
    [convIg, bizId, ts],
  );
  for (const [convoId, msgs] of [
    [convWa, [
      ["USER", "Hi can I book a blowdry Saturday?"],
      ["ASSISTANT", "Hi Emma! I'm Liv, the AI assistant for Luxe Salon & Spa. Saturday looks good — what time works?"],
    ]],
    [convIg, [
      ["USER", "Do you have balayage slots next week?"],
      ["ASSISTANT", "Hi! I'm Liv, the AI assistant for Luxe Salon & Spa. Yes — I can suggest times with Maya. Which day suits you?"],
    ]],
  ]) {
    for (const [role, content] of msgs) {
      await client.query(
        `INSERT INTO conversation_messages (id, conversation_id, role, content, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [id(), convoId, role, content, ts],
      );
    }
  }
  console.log("  Patched: WhatsApp + Instagram demo inbox threads");
}

async function hasMessagingChannelsColumn() {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = 'businesses' AND column_name = 'messaging_channels' LIMIT 1`,
  );
  return r.rows.length > 0;
}

// Check if already seeded
const existing = await client.query("SELECT id FROM businesses WHERE slug = $1", [SLUG]);
if (existing.rows.length > 0) {
  const bizId = existing.rows[0].id;
  if (await hasMessagingChannelsColumn()) {
    await client.query(
      `UPDATE businesses SET messaging_channels = $1::jsonb, instagram_handle = COALESCE(instagram_handle, 'luxesalonspa')
       WHERE id = $2`,
      [messagingChannels, bizId],
    );
  } else {
    console.warn(
      "  ⚠ Column messaging_channels missing — run: node --env-file=.env scripts/apply-sql-migrations.mjs",
    );
  }
  await ensureSocialInbox(bizId);
  console.log(`Already seeded — patched social channels for "${SLUG}" (id: ${bizId})`);
  await client.end();
  process.exit(0);
}

console.log("Seeding demo workspace…");

// 0. Placeholder owner (businesses.owner_id FK)
await client.query(
  `INSERT INTO users (id, email, full_name, role)
   VALUES ($1, $2, $3, 'OWNER')
   ON CONFLICT (id) DO NOTHING`,
  [OWNER_ID, OWNER_EMAIL, "Demo Seed Owner"],
);

// 1. Business
const bizId = id();
const aiGreeting =
  "Hi! I'm Liv, the AI assistant for Luxe Salon & Spa. I can help you book appointments.";
const bizBase = [
  bizId,
  OWNER_ID,
  "Luxe Salon & Spa",
  SLUG,
  "Premium hair, beauty and wellness services in the heart of the city.",
  "hair_salon",
  "hello@luxesalon.co",
  "+44 20 7946 0958",
  "Europe/London",
  "London",
  "GB",
  "luxesalonspa",
];

if (await hasMessagingChannelsColumn()) {
  await client.query(
    `INSERT INTO businesses (id, owner_id, name, slug, description, category, email, phone, timezone, city, country, instagram_handle, messaging_channels, ai_greeting)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)`,
    [...bizBase, messagingChannels, aiGreeting],
  );
} else {
  console.warn("  ⚠ Skipping messaging_channels on insert — apply SQL migrations first");
  await client.query(
    `INSERT INTO businesses (id, owner_id, name, slug, description, category, email, phone, timezone, city, country, instagram_handle, ai_greeting)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [...bizBase, aiGreeting],
  );
}

await client.query(
  `INSERT INTO business_memberships (id, business_id, user_id, role, role_v2, status)
   VALUES ($1, $2, $3, 'OWNER', 'OWN', 'ACTIVE')
   ON CONFLICT (business_id, user_id) DO NOTHING`,
  [id(), bizId, OWNER_ID],
);

// 2. Staff
const staffDefs = [
  { firstName: "Maya",  lastName: "Patel", displayName: "Maya Patel",  email: "maya@luxesalon.co",  color: "#8B5CF6" },
  { firstName: "James", lastName: "Chen",  displayName: "James Chen",  email: "james@luxesalon.co", color: "#3B82F6" },
  { firstName: "Sofia", lastName: "Russo", displayName: "Sofia Russo", email: "sofia@luxesalon.co", color: "#EC4899" },
];
const staffIds = staffDefs.map(() => id());
for (let i = 0; i < staffDefs.length; i++) {
  const s = staffDefs[i];
  await client.query(
    `INSERT INTO staff (id, business_id, first_name, last_name, display_name, email, color, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
    [staffIds[i], bizId, s.firstName, s.lastName, s.displayName, s.email, s.color]
  );
}
const [mayaId, jamesId, sofiaId] = staffIds;

// 3. Services
const svcDefs = [
  { name: "Haircut & Style",    description: "Precision cut and blow-dry finish",        duration: 60,  price: 6500 },
  { name: "Colour Treatment",   description: "Full colour, highlights or balayage",       duration: 120, price: 12000 },
  { name: "Blowout",            description: "Shampoo, condition and blowout",             duration: 45,  price: 4500 },
  { name: "Deep Tissue Massage",description: "60-minute targeted muscle relief",           duration: 60,  price: 8500 },
  { name: "Signature Facial",   description: "Cleanse, exfoliate and hydrate",             duration: 75,  price: 9500 },
];
const svcIds = svcDefs.map(() => id());
for (let i = 0; i < svcDefs.length; i++) {
  const s = svcDefs[i];
  await client.query(
    `INSERT INTO services (id, business_id, name, description, duration_minutes, price_minor, currency, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,'GBP',true)`,
    [svcIds[i], bizId, s.name, s.description, s.duration, s.price]
  );
}
const [cutId, colorId, blowoutId, massageId, facialId] = svcIds;

// 4. Staff-Services
const ssRows = [
  [mayaId, cutId], [mayaId, colorId], [mayaId, blowoutId],
  [jamesId, cutId], [jamesId, blowoutId], [jamesId, massageId],
  [sofiaId, facialId], [sofiaId, massageId], [sofiaId, blowoutId],
];
for (const [sid, svcId] of ssRows) {
  await client.query(
    `INSERT INTO staff_services (staff_id, service_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [sid, svcId]
  );
}

// 5. Availability (Mon-Sat 9-18)
for (const sid of staffIds) {
  for (const day of [1,2,3,4,5,6]) {
    await client.query(
      `INSERT INTO availability_rules (id, business_id, staff_id, day_of_week, start_time, end_time)
       VALUES ($1,$2,$3,$4,'09:00','18:00')`,
      [id(), bizId, sid, day]
    );
  }
}

// 6. Customers
const custDefs = [
  { firstName: "Alice",  lastName: "Thompson", email: "alice.t@email.com",  phone: "+44 7700 900001" },
  { firstName: "Ben",    lastName: "Okafor",   email: "ben.o@email.com",    phone: "+44 7700 900002" },
  { firstName: "Chloe",  lastName: "Marsh",    email: "chloe.m@email.com",  phone: "+44 7700 900003" },
  { firstName: "David",  lastName: "Kim",      email: "david.k@email.com",  phone: "+44 7700 900004" },
  { firstName: "Emma",   lastName: "Silva",    email: "emma.s@email.com",   phone: "+44 7700 900005" },
  { firstName: "Finn",   lastName: "Larsen",   email: "finn.l@email.com",   phone: "+44 7700 900006" },
  { firstName: "Grace",  lastName: "Yuen",     email: "grace.y@email.com",  phone: "+44 7700 900007" },
  { firstName: "Hassan", lastName: "Ali",      email: "hassan.a@email.com", phone: "+44 7700 900008" },
];
const custIds = custDefs.map(() => id());
for (let i = 0; i < custDefs.length; i++) {
  const c = custDefs[i];
  await client.query(
    `INSERT INTO customers (id, business_id, first_name, last_name, display_name, email, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [custIds[i], bizId, c.firstName, c.lastName, `${c.firstName} ${c.lastName}`, c.email, c.phone]
  );
}

// 7. Bookings
const now = new Date();
function dt(offsetDays, hour, min = 0) {
  const t = new Date(now);
  t.setDate(t.getDate() + offsetDays);
  t.setHours(hour, min, 0, 0);
  return t.toISOString();
}

const bookings = [
  { ci: 0, sid: mayaId,  svcId: cutId,     status: "CONFIRMED", off: 0,  hr: 10, dur: 60 },
  { ci: 1, sid: jamesId, svcId: blowoutId, status: "CONFIRMED", off: 0,  hr: 11, dur: 45 },
  { ci: 2, sid: sofiaId, svcId: facialId,  status: "PENDING",   off: 0,  hr: 14, dur: 75 },
  { ci: 3, sid: mayaId,  svcId: colorId,   status: "PENDING",   off: 1,  hr: 9,  dur: 120 },
  { ci: 4, sid: jamesId, svcId: massageId, status: "CONFIRMED", off: 1,  hr: 13, dur: 60 },
  { ci: 5, sid: sofiaId, svcId: blowoutId, status: "CONFIRMED", off: 2,  hr: 10, dur: 45 },
  { ci: 6, sid: mayaId,  svcId: cutId,     status: "CONFIRMED", off: 3,  hr: 15, dur: 60 },
  { ci: 7, sid: jamesId, svcId: massageId, status: "PENDING",   off: 4,  hr: 11, dur: 60 },
  { ci: 0, sid: sofiaId, svcId: facialId,  status: "CONFIRMED", off: 5,  hr: 9,  dur: 75 },
  { ci: 1, sid: mayaId,  svcId: blowoutId, status: "COMPLETED", off: -1, hr: 14, dur: 45 },
  { ci: 2, sid: jamesId, svcId: cutId,     status: "COMPLETED", off: -2, hr: 10, dur: 60, notes: "Client loved the layered finish" },
  { ci: 3, sid: sofiaId, svcId: massageId, status: "COMPLETED", off: -3, hr: 11, dur: 60 },
  { ci: 4, sid: mayaId,  svcId: colorId,   status: "COMPLETED", off: -5, hr: 9,  dur: 120 },
  { ci: 5, sid: jamesId, svcId: blowoutId, status: "NO_SHOW",   off: -4, hr: 16, dur: 45 },
  { ci: 6, sid: sofiaId, svcId: facialId,  status: "CANCELLED", off: -6, hr: 13, dur: 75, notes: "Client cancelled same day" },
];

for (const b of bookings) {
  const startAt = dt(b.off, b.hr);
  const endAt = new Date(new Date(startAt).getTime() + b.dur * 60000).toISOString();
  await client.query(
    `INSERT INTO bookings (id, business_id, customer_id, staff_id, service_id, status, start_at, end_at, notes, channel_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'WEB')`,
    [id(), bizId, custIds[b.ci], b.sid, b.svcId, b.status, startAt, endAt, b.notes ?? null]
  );
}

// 8. Demo inbox threads (WhatsApp + Instagram)
await ensureSocialInbox(bizId);

await client.end();
console.log("✓ Seeded successfully:");
console.log(`  Business: Luxe Salon & Spa (slug: ${SLUG})`);
console.log(`  Staff: 3 | Services: 5 | Customers: 8 | Bookings: ${bookings.length} | Inbox: WA + IG demos`);
console.log(`  Public booking URL: /b/${SLUG}`);
