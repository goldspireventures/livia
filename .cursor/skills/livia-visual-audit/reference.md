# Visual audit — Windows Maestro

Maestro is often installed at:

```text
%USERPROFILE%\.maestro\bin\maestro.bat
```

**Prerequisites:** JDK (`JAVA_HOME`), Android SDK `platform-tools` (`adb`), emulator running, Expo app foreground.

```powershell
pnpm maestro:visual-capture
```

If Maestro unavailable in agent environment: note gap in `VISUAL-AUDIT-LOG.md` and give user exact command to run locally.

## Capture folders

| Folder | Contents |
|--------|----------|
| `e2e/visual-captures/web/` | Persona dashboards |
| `e2e/visual-captures/full-audit/` | Verticals + public `/b` |
| `e2e/visual-captures/marketing/` | livia.io routes |
| `e2e/visual-captures/internal/` | Ops tabs |
| `e2e/visual-captures/mobile/` | Maestro native |

## Full runbook

[`docs/testing/FULL-VISUAL-AUDIT-WEB-MOBILE.md`](../../docs/testing/FULL-VISUAL-AUDIT-WEB-MOBILE.md)
