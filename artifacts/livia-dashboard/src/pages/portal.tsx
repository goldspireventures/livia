import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Compass,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Users,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDemoStatus,
  provisionDemoWorld,
} from "@/lib/demo-portal";

export default function PortalPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchDemoStatus>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await fetchDemoStatus());
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setup() {
    setBusy(true);
    try {
      await provisionDemoWorld();
      toast({ title: "Full Livia demo world ready", description: "Six users · four businesses" });
      await load();
    } catch (e: unknown) {
      toast({
        title: "Setup failed",
        description: e instanceof Error ? e.message : "Check API + CLERK_SECRET_KEY",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      <header>
        <div className="flex items-center gap-2 text-primary mb-2">
          <Compass className="h-5 w-5" />
          <span className="text-xs font-mono uppercase tracking-wider">Livia portal</span>
        </div>
        <h1 className="font-serif text-3xl tracking-tight">Your map through the whole product</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          One setup loads real Clerk users, businesses, bookings, and roles. Then use the demo
          gateway, guides, or internal console — each POV is a separate login with the right nav.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1 · Load the demo world</CardTitle>
          <CardDescription>
            Creates <code>demo-*@livia.io</code> users in Clerk and seeds Aurora Studio, Mews,
            Galway, and Conor&apos;s Cut Co.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void setup()} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
            {status?.provisioned ? "Reset demo world" : "Set up full demo world"}
          </Button>
          {loading ? (
            <Skeleton className="h-6 w-32" />
          ) : status?.provisioned ? (
            <Badge variant="secondary">{status.businesses.length} businesses loaded</Badge>
          ) : (
            <Badge variant="outline">Not provisioned</Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/demo")}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Demo gateway
            </CardTitle>
            <CardDescription>Sign in as each persona (real Clerk session)</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-primary font-medium">Open /demo →</span>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/guides")}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              E2E playbook
            </CardTitle>
            <CardDescription>Public · business · internal tracks</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-primary font-medium">Open guides →</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Internal ops
            </CardTitle>
            <CardDescription>Tenant directory (Livia staff)</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={status?.internalBase ?? "http://localhost:5175"}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary font-medium inline-flex items-center gap-1"
            >
              Open console
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/40" onClick={() => navigate("/launch-status")}>
          <CardHeader>
            <CardTitle className="text-base">Launch readiness</CardTitle>
            <CardDescription>Paths 1–6 engineering snapshot</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-primary font-medium">Open checklist →</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Public booking</CardTitle>
            <CardDescription>Customer POV — no login</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/b/aurora-studio">
              <span className="text-sm text-primary font-medium">/b/aurora-studio →</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Legacy single-account seed (3 generic shops) still available in Settings → Demo &amp; Data.
        Prefer this portal for the Aurora narrative and per-user logins.
      </p>
    </div>
  );
}
