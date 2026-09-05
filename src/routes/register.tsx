import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Building2, Loader2, MailCheck, UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatCnpj, formatCpf, onlyDigits, resolveHomePath, type AccountType } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Criar conta — IndicaPro" },
      {
        name: "description",
        content:
          "Cadastre a sua empresa para lançar um programa de indicações ou torne-se um indicador e ganhe comissões.",
      },
      { property: "og:title", content: "Criar conta — IndicaPro" },
      {
        property: "og:description",
        content:
          "Cadastre a sua empresa para lançar um programa de indicações ou torne-se um indicador e ganhe comissões.",
      },
    ],
  }),
  component: RegisterPage,
});

const baseSchema = {
  email: z.string().trim().email({ message: "Informe um e-mail válido" }).max(255),
  password: z.string().min(6, { message: "A senha precisa ter ao menos 6 caracteres" }).max(72),
};

const companySchema = z.object({
  ...baseSchema,
  companyName: z
    .string()
    .trim()
    .min(2, { message: "Informe a razão social" })
    .max(120, { message: "Razão social muito longa" }),
  cnpj: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 14, { message: "O CNPJ deve ter 14 dígitos" }),
});

const indicatorSchema = z.object({
  ...baseSchema,
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Informe o seu nome completo" })
    .max(120, { message: "Nome muito longo" }),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 11, { message: "O CPF deve ter 11 dígitos" }),
});

function RegisterPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>("company");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsed =
      accountType === "company"
        ? companySchema.safeParse({ email, password, companyName, cnpj })
        : indicatorSchema.safeParse({ email, password, fullName, cpf });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os dados informados");
      return;
    }

    const metadata =
      accountType === "company"
        ? {
            account_type: "company",
            company_name: companyName.trim(),
            cnpj: onlyDigits(cnpj),
            full_name: companyName.trim(),
          }
        : {
            account_type: "indicator",
            full_name: fullName.trim(),
            cpf: onlyDigits(cpf),
          };

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: metadata,
      },
    });
    setLoading(false);

    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Este e-mail já possui uma conta"
          : error.message,
      );
      return;
    }

    if (!data.session) {
      setAwaitingConfirmation(true);
      return;
    }

    const to = await resolveHomePath(data.user!.id);
    toast.success("Conta criada com sucesso!");
    navigate({ to, replace: true });
  }

  if (awaitingConfirmation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 py-16">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <MailCheck className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold">Confirme o seu e-mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar,
            é só entrar com a sua senha.
          </p>
          <Button asChild variant="hero" size="lg" className="mt-6 w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 py-16">
      <div className="w-full max-w-xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar ao site
        </Link>

        <div className="surface-card p-8">
          <h1 className="text-2xl font-semibold">Criar conta no IndicaPro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha como você quer usar a plataforma.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <AccountOption
              active={accountType === "company"}
              icon={<Building2 className="size-5" />}
              title="Cadastrar Empresa"
              description="Crie campanhas e reduza o seu CAC"
              onClick={() => setAccountType("company")}
            />
            <AccountOption
              active={accountType === "indicator"}
              icon={<UserRound className="size-5" />}
              title="Quero ser Indicador"
              description="Indique e receba comissões"
              onClick={() => setAccountType("indicator")}
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {accountType === "company" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Razão Social</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    maxLength={120}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Minha Empresa LTDA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    inputMode="numeric"
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    maxLength={120}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Maria Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    inputMode="numeric"
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Seu código de indicador (ex.: IND-12345) é gerado automaticamente.
                  </p>
                </div>
              </>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {accountType === "company" ? "Cadastrar empresa" : "Criar conta de indicador"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function AccountOption({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "cursor-pointer rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-accent/60 shadow-[var(--shadow-glow)]"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
        )}
      >
        {icon}
      </span>
      <span className="mt-3 block font-semibold">{title}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
    </button>
  );
}
