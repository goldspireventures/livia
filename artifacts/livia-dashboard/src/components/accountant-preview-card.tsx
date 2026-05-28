import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";

type Report = {
  sections: Array<{ heading: string; body?: string; bullets?: string[] }>;
};

export function AccountantPreviewCard() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["accountant-preview", bid],
    queryFn: () => customFetch<Report>(`/api/businesses/${bid}/reports/accountant_preview`),
    enabled: !!bid,
  });

  if (isLoading || !data) return null;

  return (
    <Card data-testid="accountant-preview-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Accountant preview
        </CardTitle>
        <CardDescription>Read-only tease for your bookkeeper — revenue + payroll hours.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {data.sections.map((s) => (
          <div key={s.heading}>
            <p className="font-medium">{s.heading}</p>
            {s.body ? <p className="text-muted-foreground text-xs">{s.body}</p> : null}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            void customFetch<{ csv: string }>(
              `/api/businesses/${bid}/reports/accountant_preview/export`,
            ).then(({ csv }) => {
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "livia-accountant-preview.csv";
              a.click();
            });
          }}
        >
          Download CSV tease
        </Button>
      </CardContent>
    </Card>
  );
}
