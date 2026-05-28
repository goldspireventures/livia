import { useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { downloadAuthenticatedBlob } from "@/lib/download-blob";

export function EnterpriseExportCard() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  async function download() {
    if (!bid) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: `${from}T00:00:00.000Z`, to: `${to}T23:59:59.999Z` });
      await downloadAuthenticatedBlob(
        `/businesses/${bid}/enterprise/audit-export?${params}`,
        `livia-audit-${from}-${to}.csv`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Enterprise audit export
        </CardTitle>
        <CardDescription>
          SOC2 evidence pack v1 — audit log + bookings CSV (chain / franchise tier).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={() => void download()} disabled={loading || !bid}>
          {loading ? "Exporting…" : "Download CSV"}
        </Button>
      </CardContent>
    </Card>
  );
}
