# Patente Facile Italia

Esboço inicial de um SaaS estilo Duolingo para turistas estudarem para o exame
teórico da carta de motorista na Itália. Next.js 14 (App Router) + Supabase.

## Setup

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do Supabase, rode o conteúdo de `supabase/schema.sql`
   (cria tabelas, RLS, trigger de novo usuário e um seed de exemplo).
3. Copie `.env.local.example` para `.env.local` e preencha com a URL e a
   `anon key` do seu projeto Supabase.
4. Instale as dependências e rode em desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

5. Acesse `http://localhost:3000`, crie uma conta e comece a primeira lição.

## Estrutura

```
supabase/schema.sql        Schema SQL (tabelas, RLS, trigger, seed)
lib/supabase/              Clientes Supabase (browser, server, middleware)
lib/types.ts               Tipos compartilhados (Lesson, Question, etc.)
app/api/auth/              Callback de confirmação + signout
app/api/lessons/           Listagem de módulos/lições e detalhe de uma lição
app/api/quiz/submit/       Correção do quiz no servidor + atualização de XP/progresso
app/api/progress/          Stats do usuário + marcação de lição como "in_progress"
app/(auth)/login|signup    Telas de autenticação
app/(app)/dashboard        Painel com módulos e progresso
app/(app)/modules/[slug]   Lições de um módulo
app/(app)/lessons/[slug]        Conteúdo da lição + botão "Iniciar Quiz"
app/(app)/lessons/[slug]/quiz   Fluxo do quiz (perguntas → resultado)
app/(app)/profile               XP, streak, vidas e progresso por lição do usuário
app/(app)/leaderboard           Ranking dos 10 maiores XP (via view `public.leaderboard`)
app/(app)/admin                 Lista módulos/lições (só para profiles.is_admin = true)
components/LessonContent.tsx    Renderiza o `content` (jsonb) da lição
components/Quiz.tsx             Componente interativo do quiz (perguntas → resultado)
```

## Modelo de dados (resumo)

- **profiles** — 1:1 com `auth.users`, criado automaticamente no signup.
- **modules** → **lessons** → **questions** — conteúdo hierárquico.
- **user_progress** — status por lição (`not_started` / `in_progress` / `completed`), nota e tentativas.
- **user_answers** — histórico de cada resposta dada (auditoria/analytics).
- **user_stats** — XP total, vidas (hearts) e streak, no estilo Duolingo.
- **leaderboard** (view) — `user_id`, `full_name`, `xp_total`, para o ranking global sem
  expor e-mail/streak/hearts das outras pessoas.

O gabarito (`correct_option_id`) nunca é enviado ao cliente antes da correção:
a rota `POST /api/quiz/submit` valida as respostas no servidor e só então
retorna o resultado com as explicações.

## Próximos passos sugeridos

- Formulários de criação/edição em `/admin` (hoje é só leitura; RLS de admin já existe).
- Sistema de "vidas" (hearts) descontando ao errar e recarregando com o tempo.
- Suporte a múltiplos idiomas de interface (pt/en/es) além do conteúdo em italiano.
- Testes end-to-end do fluxo login → lição → quiz → progresso.

Para tornar um usuário admin (necessário para acessar `/admin`):

```sql
update public.profiles set is_admin = true where email = 'seuemail@exemplo.com';
```
