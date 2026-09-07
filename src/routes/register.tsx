import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Building2, Loader2, MailCheck, UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatCnpj, formatCpf, onlyDigits, resolveHomePath, type AccountType } from "@/lib/auth";
import { AvatarCapture } from "@/components/avatar-capture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BR_STATES, BUSINESS_CATEGORIES, COUNTRIES, PLANS } from "@/lib/locations";
import { saveAvatar, storePendingAvatar } from "@/lib/profile";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    .min(2, { message: "Informe o nome do negócio" })
    .max(120, { message: "Nome muito longo" }),
  documentNumber: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 11 || v.length === 14, {
      message: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido",
    }),
  category: z.string().min(2, { message: "Escolha a categoria do negócio" }),
  country: z.string().min(2, { message: "Escolha o país" }),
  state: z.string().min(2, { message: "Informe o estado" }),
  city: z.string().trim().min(2, { message: "Informe a cidade" }).max(80),
});

const indicatorSchema = z.object({
  ...baseSchema,
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Informe o seu nome completo" })
    .max(120, { message: "Nome muito longo" }),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length >= 10, { message: "Informe o WhatsApp com DDD" }),
});

function RegisterPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>("company");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [documentType, setDocumentType] = useState<"CPF" | "CNPJ">("CNPJ");
  const [documentNumber, setDocumentNumber] = useState("");
  const [category, setCategory] = useState<string>("");
  const [country, setCountry] = useState<string>("Brasil");
  const [state, setState] = useState<string>("");
  const [city, setCity] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (accountType === "indicator" && !photo) {
      toast.error("Adicione a sua foto de rosto para concluir o cadastro.");
      return;
    }

    const parsed =
      accountType === "company"
        ? companySchema.safeParse({
            email,
            password,
            companyName,
            documentNumber,
            category,
            country,
            state,
            city,
          })
        : indicatorSchema.safeParse({ email, password, fullName, phone });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os dados informados");
      return;
    }

    const digits = onlyDigits(documentNumber);
    const metadata =
      accountType === "company"
        ? {
            account_type: "company",
            company_name: companyName.trim(),
            cnpj: documentType === "CNPJ" ? digits : "",
            document_type: documentType,
            document_number: digits,
            category_business: category,
            country,
            state,
            city: city.trim(),
            full_name: companyName.trim(),
          }
        : {
            account_type: "indicator",
            full_name: fullName.trim(),
            phone: onlyDigits(phone),
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

    if (error) {
      setLoading(false);
      toast.error(
        error.message.includes("already registered")
          ? "Este e-mail já possui uma conta"
          : error.message,
      );
      return;
    }

    if (accountType === "indicator" && photo) {
      if (data.session && data.user) {
        try {
          await saveAvatar(data.user.id, photo);
        } catch {
          storePendingAvatar(photo);
        }
      } else {
        storePendingAvatar(photo);
      }
    }

    setLoading(false);

    if (accountType === "indicator") {
      toast.success("Cadastro enviado para análise!");
      navigate({ to: "/pendente", replace: true });
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
            Enviamos um link de confirmação para <strong>{email}</strong>. Depois de confirmar, é só
            entrar com a sua senha.
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
              title="Empresa ou Autônomo"
              description="Crie campanhas e receba indicações"
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
                  <Label htmlFor="companyName">Nome do negócio ou do autônomo</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    maxLength={120}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Padaria Bom Dia"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <div className="flex gap-2">
                    {(["CPF", "CNPJ"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={documentType === type}
                        onClick={() => {
                          setDocumentType(type);
                          setDocumentNumber("");
                        }}
                        className={cn(
                          "flex-1 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                          documentType === type
                            ? "border-primary bg-accent/60 text-primary"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <Input
                    id="documentNumber"
                    value={documentNumber}
                    inputMode="numeric"
                    onChange={(e) =>
                      setDocumentNumber(
                        documentType === "CPF"
                          ? formatCpf(e.target.value)
                          : formatCnpj(e.target.value),
                      )
                    }
                    placeholder={documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria do negócio</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>País</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    {country === "Brasil" ? (
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {BR_STATES.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={state}
                        maxLength={60}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Região"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={city}
                      maxLength={80}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
                  <p className="font-medium">Você começa no {PLANS.free.label}</p>
                  <p className="mt-1 text-muted-foreground">
                    1 produto, 1 campanha e até 5 indicadores. Depois de entrar, é só pedir o
                    aumento de plano em Configurações. Seu código exclusivo (ex.: EMP-5891) é gerado
                    automaticamente.
                  </p>
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
                  <Label htmlFor="phone">Número do WhatsApp</Label>
                  <Input
                    id="phone"
                    value={phone}
                    inputMode="tel"
                    maxLength={20}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 90000-0000"
                    required
                  />
                </div>

                <AvatarCapture value={photo} onChange={setPhoto} />

                <p className="text-xs text-muted-foreground">
                  Seu código de indicador (ex.: IND-12345) é gerado automaticamente.
                </p>
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
              {accountType === "company" ? "Cadastrar negócio" : "Criar conta de indicador"}
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
