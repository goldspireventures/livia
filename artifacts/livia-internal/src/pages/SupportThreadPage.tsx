import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SupportQueueView } from "../views/SupportQueueView";

/** Thread / inbox mode inside Support workspace. */
export function SupportThreadPage() {
  const navigate = useNavigate();
  const params = useParams();
  const ticketId = useMemo(() => (params.ticketId ? String(params.ticketId) : undefined), [params.ticketId]);

  return (
    <SupportQueueView
      selectedTicketId={ticketId}
      onTicketSelected={(id) => navigate(`/support/${encodeURIComponent(id)}`)}
      onOpenTenant={(businessId) => navigate(`/tenants/${encodeURIComponent(businessId)}`)}
      onOpenKnowledgeDoc={(docPath) => navigate(`/knowledge?doc=${encodeURIComponent(docPath)}`)}
    />
  );
}
