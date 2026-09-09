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

const STATUS_DOT: Record<string, string> = {
  planejamento: "bg-slate-400",
  em_andamento: "bg-indigo-400",
  concluido: "bg-emerald-400",
  arquivado: "bg-muted-foreground/40",
};

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
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        {/* Marca */}
        <div className="flex h-16 items-center gap-2.5 px-4">
          <div className="brand-gradient flex size-9 items-center justify-center rounded-xl shadow-sm shadow-primary/20">
            <RocketIcon className="size-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">launchapp</p>
            <p className="text-[11px] text-muted-foreground">Gestão de lançamentos</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <NavItem href="/" active={pathname === "/"} icon={<LayoutDashboardIcon className="size-4" />}>
            Dashboard
          </NavItem>

          <p className="mt-5 mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Lançamentos
          </p>
          <div className="flex flex-col gap-0.5">
            {projetos.length === 0 && (
              <span className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum ainda.</span>
            )}
            {projetos.map((p) => {
              const href = `/projetos/${p.id}`;
              return (
                <NavItem key={p.id} href={href} active={pathname === href}>
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      STATUS_DOT[p.status] ?? "bg-muted-foreground/40",
                    )}
                  />
                  <span className="truncate">{p.nome}</span>
                </NavItem>
              );
            })}
          </div>
        </nav>

        {/* Rodapé do usuário */}
        <div className="flex items-center gap-2.5 border-t border-sidebar-border p-3">
          <Avatar className="size-9">
            <AvatarFallback className="brand-gradient text-xs font-semibold text-white">
              {iniciais(nome)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{nome}</p>
            <p className="truncate text-[11px] text-muted-foreground">Equipe interna</p>
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

function NavItem({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
