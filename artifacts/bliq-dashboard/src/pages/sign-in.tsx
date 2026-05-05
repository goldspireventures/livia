import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { BliqMark } from "@/components/brand/BliqMark";

export default function SignInPage() {
  const { theme } = useTheme();

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient aurora glow */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-aurora-violet/20 blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-aurora-cyan/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <BliqMark className="h-10 w-10" />
            <span className="font-serif text-4xl font-normal tracking-tight text-foreground" style={{ letterSpacing: "0.01em" }}>
              Li
              <span
                style={{
                  fontStyle: "italic",
                  background: "linear-gradient(180deg, #f6f3ec 0%, #d9c39a 45%, #8a7549 60%, #d9c39a 78%, #f6f3ec 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                v
              </span>
              ia
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Your day,{" "}
            <span className="aurora-gradient-text">already handled.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Sign in to your command center.
          </p>
        </div>
        <SignIn
          appearance={{
            baseTheme: theme === "dark" ? dark : undefined,
            elements: {
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-primary-foreground",
              card: "bg-card/80 backdrop-blur-xl border border-border shadow-xl",
            },
          }}
          routing="path"
          path="/sign-in"
        />
        <p className="mt-5 text-center text-xs text-muted-foreground">
          New here? Use{" "}
          <span className="font-medium text-foreground">Continue with Google</span>{" "}
          for the fastest sign-up — or{" "}
          <a href="/sign-up" className="font-medium text-primary hover:underline">
            create a password account
          </a>
          .
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground/70">
          Tip: if you signed up with Google, sign in with Google — that account has no password.
        </p>
      </div>
    </div>
  );
}
