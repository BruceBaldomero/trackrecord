"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CURRENT_USER_ID, userById } from "@/lib/data";
import { Avatar } from "./ui";

const LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/back", label: "Back an artist" },
];

export function Nav() {
  const pathname = usePathname();
  const me = userById(CURRENT_USER_ID)!;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-md bg-accent font-bold text-black">
            T
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Track Record</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-white/8 text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href={`/u/${me.username}`}
            className={`ml-1 rounded-full ring-2 transition-colors ${
              pathname === `/u/${me.username}` ? "ring-accent" : "ring-transparent hover:ring-line"
            }`}
            title="My Track Record"
          >
            <Avatar name={me.name} size={30} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
