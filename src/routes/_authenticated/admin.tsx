import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/admin/companies", label: "Empresas", icon: Building2 },
  { to: "/admin/indicators", label: "Indicadores", icon: UsersRound },
  { to: "/admin/plans", label: "Planos e faturamento", icon: CreditCard },
  { to: "/admin/audit", label: "Auditoria", icon: ScrollText },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <ShieldCheck className="size-5 text-primary" />
          <span className="truncate font-semibold">IndicaPro Admin</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/10" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      {open ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </Button>
          <span className="font-semibold">IndicaPro Admin</span>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
