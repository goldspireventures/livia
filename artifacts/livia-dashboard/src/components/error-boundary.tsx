import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Livia] UI error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full">
            <CardContent className="py-10 text-center space-y-3">
              <p className="font-medium text-foreground">Something went wrong on this page</p>
              <p className="text-sm text-muted-foreground break-words">{this.state.error.message}</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Reload
                </Button>
                <Link href="/dashboard">
                  <Button type="button" size="sm">
                    Back to Today
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
