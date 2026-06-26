/** Open Graph / Twitter — compact link previews (iMessage, Slack, etc.). */

export const MARKETING_SOCIAL_DEFAULT = {
  siteName: "Livia",
  title: "Livia",
  description: "Software for appointment businesses. Ireland, UK & EU.",
} as const;

function upsertMeta(
  selector: string,
  attr: "name" | "property",
  key: string,
  content: string,
) {
  let tag = document.querySelector(`${selector}[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function removeMeta(selector: string, attr: "name" | "property", key: string) {
  document.querySelector(`${selector}[${attr}="${key}"]`)?.remove();
}

/** Compact preview — no hero banner (matches studio parent link style in iMessage). */
export function applyMarketingSocialMeta(args: {
  title: string;
  description?: string;
}) {
  const title = args.title.includes("—") ? args.title : `${args.title} — Livia`;
  const description = args.description ?? MARKETING_SOCIAL_DEFAULT.description;

  document.title = title;
  upsertMeta("meta", "name", "description", description);
  upsertMeta("meta", "property", "og:site_name", MARKETING_SOCIAL_DEFAULT.siteName);
  upsertMeta("meta", "property", "og:type", "website");
  upsertMeta("meta", "property", "og:title", MARKETING_SOCIAL_DEFAULT.siteName);
  upsertMeta("meta", "property", "og:description", description);
  upsertMeta("meta", "name", "twitter:card", "summary");
  upsertMeta("meta", "name", "twitter:title", MARKETING_SOCIAL_DEFAULT.siteName);
  upsertMeta("meta", "name", "twitter:description", description);
  removeMeta("meta", "property", "og:image");
  removeMeta("meta", "property", "og:image:width");
  removeMeta("meta", "property", "og:image:height");
  removeMeta("meta", "name", "twitter:image");
}
