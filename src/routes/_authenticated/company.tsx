import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  GraduationCap,
  Repeat,
  Settings,
  ShoppingBag,
  Tags,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { companyQueryKey, fetchMyCompany } from "@/lib/company";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/company")({
  component: CompanyLayout,
});

const NAV = [
  { to: "/company/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/company/products", label: "Meu Marketplace", icon: Package },
  { to: "/company/categories", label: "Minhas categorias", icon: Tags },
  { to: "/company/curriculum", label: "Currículo e treinamento", icon: GraduationCap },
  { to: "/company/leads", label: "Leads", icon: Users },
  { to: "/company/cash", label: "Caixa da loja", icon: ShoppingBag },
  { to: "/company/remarketing", label: "Remarketing", icon: Repeat },
  { to: "/company/reports", label: "Relatórios", icon: BarChart3 },
  { to: "/company/finance", label: "Financeiro", icon: Wallet },
  { to: "/company/settings", label: "Configurações", icon: Settings },
] as const;

function CompanyLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: company } = useQuery({ queryKey: companyQueryKey, queryFn: fetchMyCompany });

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
          <Building2 className="size-5 text-primary" />
          <span className="truncate font-semibold">{company?.name ?? "IndicaPro"}</span>
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
          <span className="font-semibold">{company?.name ?? "IndicaPro"}</span>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
