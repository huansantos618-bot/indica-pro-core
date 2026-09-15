# IndicaPro Foundation

Objetivo: Criar a base do projeto, instalar dependências e montar a estrutura do banco (Supabase) com segurança Multi-tenant.

Aja como um Desenvolvedor Full-Stack Sênior. Quero construir uma plataforma SaaS B2B2C chamada 'IndicaPro' usando React, Tailwind CSS, Lucide Icons e Supabase.

​Passo 1: Crie a estrutura inicial do projeto com Vite e React.

Passo 2: Crie o arquivo de configuração e os tipos (TypeScript) do banco de dados para as seguintes entidades principais:

 ​users e profiles (com campo de role: 'super_admin', 'company_admin', 'indicator').

​companies (tenant isolado com company_id).

​indicators (com código único gerado, ex: IND-12345).

​campaigns (vinculadas a company_id).

​leads (rastreando indicator_id, company_id, campaign_id e status atual).

​lead_status_history (para rastrear a timeline de cada lead).

​commissions (vinculadas ao lead e indicator_id).

​Passo 3: Crie as políticas de RLS (Row Level Security) em SQL simulado ou arquivos de migração para garantir que:

​Empresa só vê dados do seu company_id.

​Indicador só vê dados do seu indicator_id.

​Não crie a interface ainda, apenas configure a estrutura, o roteamento (React Router) e os arquivos de banco de dados/Supabase."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://indica-pro-core.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e8eb2e96-05dd-465d-a0e5-67f6f506ea21).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
