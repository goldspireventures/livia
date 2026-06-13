import { Link } from "wouter";
import type { ReactNode } from "react";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  "data-testid"?: string;
};

/** Wouter `Link` is for in-app paths; marketing demo gate is cross-origin in local dev. */
export function GatewayBackLink({ href, className, children, "data-testid": testId }: Props) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
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
