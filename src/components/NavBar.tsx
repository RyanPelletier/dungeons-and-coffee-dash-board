"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/", label: "Campaign" },
  { href: "/sessions", label: "Sessions" },
  { href: "/dashboard", label: "My Character", requiresAuth: true },
  { href: "/dm", label: "DM Tools", requiresDm: true },
];

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="border-b border-gold/20 bg-night/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-xl font-bold text-gold">
          🐉 Dungeons &amp; Coffee
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            if (link.requiresAuth && !session) return null;
            if (link.requiresDm && session?.user.role !== "DM") return null;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-ember text-parchment"
                    : "text-parchment/80 hover:bg-gold/10 hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="text-sm text-parchment/70">
                {session.user.name}
                {session.user.role === "DM" && (
                  <span className="ml-1 rounded bg-gold/20 px-1.5 py-0.5 text-xs text-gold">DM</span>
                )}
                {session.user.isScribe && (
                  <span className="ml-1 rounded bg-moss/40 px-1.5 py-0.5 text-xs text-parchment">
                    Scribe
                  </span>
                )}
              </span>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary !px-3 !py-1 text-sm">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary !px-3 !py-1 text-sm">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary !px-3 !py-1 text-sm">
                Join the Party
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
