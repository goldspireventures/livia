import { useEffect, useState } from "react";
import { Link } from "wouter";
import { marketingDemoHandoffUrlFromBrowser } from "@/lib/marketing-demo-handoff";

type Props = {
  vertical?: string;
  className?: string;
  children: React.ReactNode;
  testId?: string;
};

/** Book-demo when cold; app wedge when gate key already stored. */
export function MarketingDemoEntryLink({ vertical, className, children, testId }: Props) {
  const [href, setHref] = useState(() => marketingDemoHandoffUrlFromBrowser(vertical));

  useEffect(() => {
    setHref(marketingDemoHandoffUrlFromBrowser(vertical));
  }, [vertical]);

  const external = href.startsWith("http");

  if (external) {
    return (
      <a href={href} className={className} data-testid={testId}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} data-testid={testId}>
      {children}
    </Link>
  );
}
