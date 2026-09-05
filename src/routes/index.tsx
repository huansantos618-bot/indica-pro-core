import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  Coins,
  Handshake,
  Megaphone,
  Rocket,
  Share2,
  Sprout,
  Target,
  UserRound,
  Wallet,
} from "lucide-react";

import heroImage from "@/assets/hero-indicapro.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IndicaPro — Indique. Conecte. Cresça." },
      {
        name: "description",
        content:
          "Programas de indicação para empresas: reduza o CAC, organize seus indicadores e pague comissões automaticamente. Comece grátis.",
      },
      { property: "og:title", content: "IndicaPro — Indique. Conecte. Cresça." },
      {
        property: "og:description",
        content:
          "Programas de indicação para empresas: reduza o CAC, organize seus indicadores e pague comissões automaticamente. Comece grátis.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <ForCompanies />
        <ForIndicators />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="section-shell flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="size-4" />
          </span>
          IndicaPro
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Como funciona
          </a>
          <a href="#empresas" className="transition-colors hover:text-foreground">
            Para empresas
          </a>
          <a href="#indicadores" className="transition-colors hover:text-foreground">
            Para indicadores
          </a>
          <a href="#precos" className="transition-colors hover:text-foreground">
            Preços
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/register">Começar grátis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="section-shell grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="eyebrow">Programa de indicação</span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] sm:text-6xl">
            Indique.
            <br />
            Conecte.
            <br />
            <span className="text-primary">Cresça.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            A plataforma que transforma clientes e parceiros em um canal de vendas previsível — com
            indicações rastreadas, status em tempo real e comissões sem planilha.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/register">
                Criar meu programa <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/register">Quero ser indicador</Link>
            </Button>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {[
              { value: "-42%", label: "no custo por cliente" },
              { value: "3x", label: "mais indicações ativas" },
              { value: "0", label: "planilhas de comissão" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-2xl font-bold text-foreground">{stat.value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent/50 blur-2xl" />
          <img
            src={heroImage}
            alt="Painel do IndicaPro mostrando indicações, gráficos de crescimento e comissões"
            width={1280}
            height={960}
            className="w-full rounded-3xl border border-border shadow-[var(--shadow-card)]"
          />
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    icon: Megaphone,
    title: "A empresa cria a campanha",
    text: "Defina a recompensa, o período e as regras. Cada campanha vive isolada dentro da sua conta.",
  },
  {
    icon: Share2,
    title: "O indicador compartilha",
    text: "Cada pessoa recebe um código exclusivo (IND-12345) e indica em poucos segundos.",
  },
  {
    icon: BadgeCheck,
    title: "Todo mundo acompanha",
    text: "Cada indicação tem uma linha do tempo. Quando vira venda, a comissão é calculada sozinha.",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-border bg-secondary/40 py-24">
      <div className="section-shell">
        <div className="max-w-2xl">
          <span className="eyebrow">Como funciona</span>
          <h2 className="mt-5 text-4xl font-bold">Do convite à comissão, em um só lugar</h2>
          <p className="mt-4 text-muted-foreground">
            Três passos simples para tirar o seu programa de indicação do WhatsApp e da planilha.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="surface-card p-7">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </span>
              <span className="mt-6 block font-display text-sm font-semibold text-muted-foreground">
                Passo {i + 1}
              </span>
              <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ForCompanies() {
  const items = [
    {
      icon: Target,
      title: "CAC menor de verdade",
      text: "Você paga pelo resultado, não pelo clique. A comissão só existe quando a indicação vira cliente.",
    },
    {
      icon: BarChart3,
      title: "Funil rastreado ponta a ponta",
      text: "Cada lead carrega o indicador, a campanha e o histórico completo de status.",
    },
    {
      icon: Building2,
      title: "Dados isolados por empresa",
      text: "Multi-tenant do primeiro dia: a sua base nunca se mistura com a de outra empresa.",
    },
  ];

  return (
    <section id="empresas" className="py-24">
      <div className="section-shell grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <span className="eyebrow">Para empresas</span>
          <h2 className="mt-5 text-4xl font-bold">
            Reduza o seu custo de aquisição com quem já confia em você
          </h2>
          <p className="mt-4 text-muted-foreground">
            Anúncio fica mais caro todo mês. Indicação, não. Estruture o boca a boca como um canal
            de aquisição com meta, custo previsível e pagamento atrelado à venda.
          </p>
          <Button asChild variant="hero" size="lg" className="mt-8">
            <Link to="/register">
              Cadastrar empresa <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.title} className="surface-card flex gap-4 p-6">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForIndicators() {
  const items = [
    {
      icon: Wallet,
      title: "Renda extra sem estoque",
      text: "Indique empresas em que você acredita e receba por cada negócio fechado.",
    },
    {
      icon: Coins,
      title: "Comissão transparente",
      text: "Veja quanto está pendente, aprovado e pago — sem precisar cobrar ninguém.",
    },
    {
      icon: Handshake,
      title: "Seu código, suas indicações",
      text: "Um código único garante que toda indicação sua seja creditada a você.",
    },
  ];

  return (
    <section id="indicadores" className="bg-ink py-24 text-ink-foreground">
      <div className="section-shell grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-xl border border-ink-foreground/12 bg-ink-foreground/6 p-6"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <item.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Para indicadores
          </span>
          <h2 className="mt-5 text-4xl font-bold">Sua rede vale dinheiro. Comece a receber.</h2>
          <p className="mt-4 text-ink-muted">
            Cadastro gratuito, sem mensalidade e sem meta obrigatória. Você indica quando quiser e
            acompanha cada comissão em tempo real.
          </p>
          <Button asChild variant="onInk" size="lg" className="mt-8">
            <Link to="/register">
              Quero ser indicador <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Start",
    price: "Grátis",
    period: "para sempre",
    description: "Para validar o seu primeiro programa de indicação.",
    features: [
      "1 campanha ativa",
      "Até 10 indicadores",
      "Indicações ilimitadas",
      "Painel de status dos leads",
      "Códigos únicos de indicação",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 299",
    period: "por mês",
    description: "Para escalar o canal de indicação como aquisição principal.",
    features: [
      "Campanhas ilimitadas",
      "Indicadores ilimitados",
      "Gestão completa de comissões",
      "Linha do tempo de cada indicação",
      "Múltiplos administradores",
      "Suporte prioritário",
    ],
    cta: "Assinar o Pro",
    highlighted: true,
  },
];

function Pricing() {
  return (
    <section id="precos" className="py-24">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Planos</span>
          <h2 className="mt-5 text-4xl font-bold">Preço simples, sem surpresa</h2>
          <p className="mt-4 text-muted-foreground">
            Comece grátis e mude para o Pro quando o seu programa começar a crescer.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative rounded-2xl border-2 border-primary bg-card p-8 shadow-[var(--shadow-glow)]"
                  : "surface-card p-8"
              }
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Mais popular
                </span>
              ) : null}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </p>
              <ul className="mt-7 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlighted ? "hero" : "outline"}
                size="lg"
                className="mt-8 w-full"
              >
                <Link to="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border bg-secondary/40 py-20">
      <div className="section-shell flex flex-col items-center gap-6 text-center">
        <Rocket className="size-9 text-primary" />
        <h2 className="max-w-2xl text-4xl font-bold">
          Comece hoje o programa de indicação da sua empresa
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Leva menos de dois minutos para criar a conta e lançar a primeira campanha.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="xl">
            <Link to="/register">
              <Building2 className="size-4" /> Cadastrar empresa
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link to="/register">
              <UserRound className="size-4" /> Quero ser indicador
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-ink py-12 text-ink-muted">
      <div className="section-shell flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="flex items-center gap-2 font-display font-bold text-ink-foreground">
          <Sprout className="size-4 text-primary" /> IndicaPro
        </span>
        <p className="text-sm">Indique. Conecte. Cresça.</p>
        <div className="flex gap-6 text-sm">
          <Link to="/login" className="transition-colors hover:text-ink-foreground">
            Entrar
          </Link>
          <Link to="/register" className="transition-colors hover:text-ink-foreground">
            Criar conta
          </Link>
        </div>
      </div>
    </footer>
  );
}
