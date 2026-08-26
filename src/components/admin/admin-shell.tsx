"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { ADMIN_NAV } from "@/components/admin/nav";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/admin/theme-toggle";

type SearchHit = { id: string; name: string | null; slug: string };

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: { companies?: SearchHit[] }) => setHits(data.companies ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [query]);

  const nav = (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.24em] text-sidebar-primary uppercase">
            StudioForge
          </p>
          <h1 className="font-heading mt-2 text-2xl">Atelje</h1>
        </div>
        {nav}
        <div className="mt-auto text-xs text-sidebar-foreground/60">{adminName}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="bg-sidebar text-sidebar-foreground">
                <div className="mt-8">{nav}</div>
              </SheetContent>
            </Sheet>
            <span className="font-heading text-lg">StudioForge</span>
          </div>
          <Button
            variant="outline"
            className="hidden min-w-72 justify-between text-muted-foreground md:inline-flex"
            onClick={() => setOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Search className="size-4" />
              Pretraga firmi, kontakata i slugova
            </span>
            <kbd className="text-[10px]">⌘K</kbd>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setOpen(true)}>
              <Search className="size-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen} title="Komande" description="Pretraga">
        <CommandInput
          placeholder="Pretraži firme, kontakte, URL-ove..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Nema rezultata.</CommandEmpty>
          <CommandGroup heading="Navigacija">
            {ADMIN_NAV.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Firme">
            {hits.map((hit) => (
              <CommandItem
                key={hit.id}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/admin/companies/${hit.id}`);
                }}
              >
                {hit.name ?? hit.slug}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
