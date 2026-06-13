import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { KnowledgeView } from "../views/KnowledgeView";
import { INTERNAL_PAGES } from "../lib/internal-page-meta";
import { InternalPage } from "../components/InternalPage";

export function KnowledgePage() {
  const [sp] = useSearchParams();
  const doc = useMemo(() => sp.get("doc") ?? undefined, [sp]);
  return (
    <InternalPage wide title={INTERNAL_PAGES.docs.title} subtitle={INTERNAL_PAGES.docs.purpose}>
      <KnowledgeView initialDocPath={doc} />
    </InternalPage>
  );
}

