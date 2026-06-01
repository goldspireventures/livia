import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";

export type SignInAppearanceHint = {
  businessName: string;
  cssPreset: string;
  presetLabel: string;
  brandAccentHex: string | null;
  logoUrl: string | null;
  colorMode: "light" | "dark" | "system";
};

export function useSignInAppearanceHint(email: string, debounceMs = 450) {
  const [hint, setHint] = useState<SignInAppearanceHint | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@") || normalized.length < 5) {
      setHint(null);
      setLoading(false);
      return;
    }

    const ticket = ++seq.current;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void apiFetch<SignInAppearanceHint | null>(
        `/public/sign-in-appearance-hint?email=${encodeURIComponent(normalized)}`,
      )
        .then((data) => {
          if (ticket !== seq.current) return;
          setHint(data);
        })
        .catch(() => {
          if (ticket !== seq.current) return;
          setHint(null);
        })
        .finally(() => {
          if (ticket === seq.current) setLoading(false);
        });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [email, debounceMs]);

  return { hint, loading };
}

/** Debounced email from Clerk identifier field or any controlled input. */
export function useDebouncedClerkIdentifierEmail(debounceMs = 300): string {
  const [email, setEmail] = useState("");

  useEffect(() => {
    let timer: number | undefined;
    const onInput = (ev: Event) => {
      const target = ev.target;
      if (!(target instanceof HTMLInputElement)) return;
      const isIdentifier =
        target.name === "identifier" ||
        target.autocomplete === "email" ||
        target.type === "email";
      if (!isIdentifier) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setEmail(target.value.trim()), debounceMs);
    };
    document.addEventListener("input", onInput, true);
    return () => {
      document.removeEventListener("input", onInput, true);
      if (timer) window.clearTimeout(timer);
    };
  }, [debounceMs]);

  return email;
}
