import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { LiviaWordmark } from "@/components/brand/LiviaMark";

export default function SignInPage() {
  const { theme } = useTheme();

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Single soft cyan halo — matches livia.io canvas treatment */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-cyan/10 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <LiviaWordmark size="md" />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight">
              Your day,
              <span className="block mt-1 italic text-muted-foreground/90">already handled.</span>
            </h1>
            <p className="mt-5 text-sm text-muted-foreground">
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
      </main>
    </div>
  );
}
