import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { KnowledgeView } from "../views/KnowledgeView";

export function KnowledgePage() {
  const [sp] = useSearchParams();
  const doc = useMemo(() => sp.get("doc") ?? undefined, [sp]);
  return <KnowledgeView initialDocPath={doc} />;
}

