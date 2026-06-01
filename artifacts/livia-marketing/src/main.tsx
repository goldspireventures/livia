import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initMarketingAnalytics } from "@/lib/analytics";
import { applyMarketingPlatformTheme } from "@/lib/marketing-platform-theme";

applyMarketingPlatformTheme();
initMarketingAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
