import { useEffect } from "react";
import { useLocation } from "wouter";

export function ScrollToTop() {
  const [path] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  return null;
}
