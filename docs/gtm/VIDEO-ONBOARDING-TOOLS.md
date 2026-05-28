# Onboarding videos — what AI can do vs what you should record

## Can the AI (Cursor) record the videos for you?

**No — not in a useful way.** I can:

- Write **beat-by-beat scripts** (see [`loom-onboarding-1.md`](./loom-onboarding-1.md))
- Place **Loom/YouTube URLs** in the app (`VITE_ONBOARDING_VIDEO_*` in dashboard `.env`)
- Improve the **in-app platform tour** and welcome panel (no video file needed)
- Generate **static thumbnails** or slide copy — not a screen recording with your voice and real clicks

A convincing product walkthrough needs **your screen, your voice, and real latency** — tools below.

---

## Recommended tools (fastest → most polished)

| Tool | Best for | Cost | Notes |
|------|----------|------|-------|
| **[Loom](https://www.loom.com)** | Founder async demos | Free tier | One-click record + share link; paste link into `VITE_ONBOARDING_VIDEO_WELCOME` |
| **[Tella](https://tella.tv)** | Short chapters, re-record one section | Paid | Good for re-cutting onboarding acts |
| **[Screen Studio](https://screen.studio)** (Mac) | Polished cursor zoom | Paid | Makes rough takes look premium |
| **OBS Studio** | Full control, local files | Free | More setup; host on YouTube unlisted |
| **CapCut / DaVinci** | Edit multiple takes | Free | If you stumble mid-script |

**Workflow (≈2 hours total):**

1. Run demo: `pnpm demo:provision` → sign in `demo-owner@livia.io`.
2. Open script: `docs/gtm/loom-onboarding-1.md`.
3. Record **4 short clips** (30–90s each): Welcome → Channels → Liv → Tour pointer.
4. Upload to Loom → copy share URLs into `artifacts/livia-dashboard/.env`:

```env
VITE_ONBOARDING_VIDEO_WELCOME=https://www.loom.com/share/...
VITE_ONBOARDING_VIDEO_CHANNELS=https://www.loom.com/share/...
VITE_ONBOARDING_VIDEO_LIV=https://www.loom.com/share/...
VITE_ONBOARDING_VIDEO_TOUR=https://www.loom.com/share/...
```

5. Restart dashboard dev server — videos appear on `/onboarding` and in the platform tour.

---

## If you skip video for beta

The product already has:

- **Platform tour** (dashboard, dismissible)
- **Onboarding wizard** A1–A12 with inline forms
- **Channel setup wizard** in Settings
- **Welcome panel** with text fallback when URLs are empty

That is enough for a closed beta if you personally onboard each shop. Videos matter for **self-serve PLG** later.

---

## Optional: AI-assisted (not AI-recorded)

- **ElevenLabs / similar** — voiceover from script if you don’t want to speak on camera (still need screen capture).
- **Descript** — edit ums, generate captions for EU accessibility.
- **Notion → Loom** — script in Notion, record side-by-side.

Do **not** rely on generic “AI video generators” for UI walkthroughs — they mis-render product chrome and fall out of date after one deploy.
