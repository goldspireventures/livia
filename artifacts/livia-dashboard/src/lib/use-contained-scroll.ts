import type { WheelEvent } from "react";

/** Keep wheel events inside a scroll region instead of scrolling the app shell behind it. */
export function onContainedScrollWheel(e: WheelEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const delta = e.deltaY;
  const canScrollUp = scrollTop > 0;
  const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
  if ((delta < 0 && canScrollUp) || (delta > 0 && canScrollDown)) {
    e.stopPropagation();
  }
}
