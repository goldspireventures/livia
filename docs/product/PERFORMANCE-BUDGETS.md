# Performance budgets — platform specification

**Status:** canonical (2026-05-31)  
**Audience:** engineering, design  
**Purpose:** Quantified UX performance targets — especially P7 `/b` on 3G (gap from MULTI-HAT-GAP-REVIEW).

---

## 1. Targets (R1)

| Surface | Metric | Target | Measurement |
|---------|--------|--------|-------------|
| **W5 `/b/{slug}`** | LCP | < 2.5s p75 on Fast 3G | Lighthouse CI |
| **W5 `/b`** | TTI | < 4.0s p75 Fast 3G | Lighthouse |
| **W5 book wizard** | Interaction | slot pick < 300ms p95 | OpenTelemetry |
| **W4 dashboard home** | LCP | < 2.0s desktop | Lighthouse |
| **W4 mobile My Day** | Cold start | < 3s to interactive | Expo benchmark |
| **W1 marketing home** | LCP | < 2.5s | Lighthouse |
| **API public /b** | p95 latency | < 400ms | Grafana |

---

## 2. Bundle budgets

| Artifact | Max JS (gzip) initial | Notes |
|----------|---------------------|-------|
| Public `/b` route | 180 KB | No Clerk on guest path |
| Dashboard authenticated | 350 KB | Code-split vertical routes |
| Marketing home | 200 KB | Framer motion lazy |

---

## 3. CI enforcement (target)

```yaml
# .github/workflows/perf-budget.yml (doc sprint → build)
- lighthouse /b/clarity-medspa-dublin --throttling=3G
- fail if LCP > 2.5s
```

---

## 4. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial performance budgets |
