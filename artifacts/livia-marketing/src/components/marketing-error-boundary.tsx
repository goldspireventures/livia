import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "wouter";
import { LiviaWordmark } from "@/components/brand/LiviaMark";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Last-resort shell if a page throws during render. */
export class MarketingErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[marketing]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="marketing-w1-shell min-h-screen bg-background text-foreground px-4 py-16">
          <LiviaWordmark size="md" />
          <h1 className="mt-8 font-serif text-2xl">Something went wrong loading this page</h1>
          <p className="mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
            Your connection or our deploy may have hiccuped. Refresh, or head home and try again.
          </p>
          <Link href="/" className="cst-page-link mt-6 inline-flex">
            Back to home
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}
