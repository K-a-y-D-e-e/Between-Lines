"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: { id: string; display_name: string } | null;
}

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/poems", label: "Poems" },
  { href: "/letters", label: "Letters" },
];

export function Navbar({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="border-b border-line">
      <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="font-serif text-lg tracking-[0.22em]">
          BETWEEN LINES
        </Link>

        {user ? (
          <>
            <ul className="hidden items-center gap-8 text-sm md:flex">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active(l.href) ? "page" : undefined}
                    className={cn("pb-1 hover:text-accent", active(l.href) ? "border-b border-ink" : "text-muted")}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/write" className="btn inline-flex items-center gap-1.5">
                  <Plus size={14} aria-hidden /> Write
                </Link>
              </li>
              <li>
                <Link href={`/profile/${user.id}`} className="text-muted hover:text-accent">
                  Profile
                </Link>
              </li>
            </ul>
            <button
              type="button"
              className="p-2 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm text-muted hover:text-accent">
            Login
          </Link>
        )}
      </nav>

      <AnimatePresence>
        {user && open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-line px-5 md:hidden"
          >
            {[...LINKS, { href: "/write", label: "+ Write" }, { href: `/profile/${user.id}`, label: "Profile" }, { href: "/settings", label: "Settings" }].map(
              (l) => (
                <li key={l.href} className="border-b border-line/60 last:border-0">
                  <Link href={l.href} className="block py-4 font-serif text-xl">
                    {l.label}
                  </Link>
                </li>
              ),
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}
