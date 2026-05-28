import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initMarketingAnalytics } from "@/lib/analytics";

initMarketingAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
