"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { usePageTransition } from "./PageTransition";

type TransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

/**
 * Drop-in replacement for next/link that plays the wavy-curtain page
 * transition on internal navigations. Keeps next/link's prefetch, and lets
 * modifier / middle clicks open a new tab the normal way.
 */
export default function TransitionLink({
  href,
  children,
  onClick,
  ...rest
}: TransitionLinkProps) {
  const { navigate } = usePageTransition();
  const isInternal = typeof href === "string" && href.startsWith("/");

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !isInternal) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return; // let the browser open a new tab / window
        }
        e.preventDefault();
        navigate({ type: "route", href: href as string });
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
