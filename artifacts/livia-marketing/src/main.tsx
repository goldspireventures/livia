import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./index.css";
import { initMarketingAnalytics } from "@/lib/analytics";
import { applyMarketingPlatformTheme } from "@/lib/marketing-platform-theme";
import { initMarketingApiClient } from "@/lib/marketing-api-client";

applyMarketingPlatformTheme();
initMarketingApiClient();
initMarketingAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
