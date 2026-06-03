# Bloom Beauty — G2 beauty thread crops

Founder screenshots (Bloom Beauty Dublin, noir-dusk / platform skin).

| Chapter | File | Design source |
|---------|------|---------------|
| Bookings | `inbox.png` | `w2-gateway/beauty/bloom-wedge/bookings.png` |
| `/b` | `book-mobile.png` | `bloom-wedge/public-book-mobile.png` |
| Today | `today.png` | `bloom-wedge/today.png` |

```bash
# Copy design sources → runtime (after updating bloom-wedge/)
node -e "const fs=require('fs'),p='artifacts/livia-dashboard/public/w2-gateway/platform-default',s='docs/design/assets/w2-gateway/beauty/bloom-wedge';[['bookings.png','inbox.png'],['public-book-mobile.png','book-mobile.png'],['today.png','today.png']].forEach(([a,b])=>fs.copyFileSync(s+'/'+a,p+'/'+b))"
```
