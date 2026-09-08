"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, RocketIcon, LogOutIcon } from "lucide-react";
import { sair } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/app/theme-toggle";

type ProjetoNav = { id: string; nome: string; status: string };
type Perfil = { full_name: string } | null;

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  projetos,
  profile,
  children,
}: {
  projetos: ProjetoNav[];
  profile: Perfil;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nome = profile?.full_name ?? "Usuário";

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/20 md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <RocketIcon className="size-5 text-primary" />
          <span className="font-semibold">launchapp</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <LayoutDashboardIcon className="size-4" />
            Dashboard
          </Link>

          <div className="mt-4 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Lançamentos
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            {projetos.length === 0 && (
              <span className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum ainda.
              </span>
            )}
            {projetos.map((p) => {
              const href = `/projetos/${p.id}`;
              const ativo = pathname === href;
              return (
                <Link
                  key={p.id}
                  href={href}
                  className={cn(
                    "truncate rounded-md px-3 py-2 text-sm transition-colors",
                    ativo
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {p.nome}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center gap-2 border-t p-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{iniciais(nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{nome}</p>
          </div>
          <ThemeToggle />
          <form action={sair}>
            <Button variant="ghost" size="icon" aria-label="Sair" type="submit">
              <LogOutIcon className="size-4" />
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
