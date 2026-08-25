-- ============================================================
-- Patente Facile Italia — schema inicial (Supabase / Postgres)
-- Rode este arquivo no SQL editor do Supabase (ou via CLI/migrations).
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tipos
-- ------------------------------------------------------------
create type question_type as enum ('multiple_choice', 'true_false', 'image_choice');
create type progress_status as enum ('not_started', 'in_progress', 'completed');

-- ------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  native_language text not null default 'pt',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Módulos (ex.: "Sinalização", "Regras de prioridade")
-- ------------------------------------------------------------
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  icon text,
  order_index int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Lições (pertencem a um módulo)
-- ------------------------------------------------------------
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  slug text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb, -- blocos de conteúdo (texto/imagem) exibidos antes do quiz
  order_index int not null default 0,
  xp_reward int not null default 10,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (module_id, slug)
);

create index lessons_module_id_idx on public.lessons (module_id);

-- ------------------------------------------------------------
-- Perguntas do quiz (pertencem a uma lição)
-- ------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  type question_type not null default 'multiple_choice',
  prompt text not null,
  image_url text,
  options jsonb not null default '[]'::jsonb, -- [{ "id": "a", "text": "..." }, ...]
  correct_option_id text not null,
  explanation text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index questions_lesson_id_idx on public.questions (lesson_id);

-- ------------------------------------------------------------
-- Progresso do usuário por lição
-- ------------------------------------------------------------
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status progress_status not null default 'not_started',
  score int,
  attempts int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index user_progress_user_id_idx on public.user_progress (user_id);

-- ------------------------------------------------------------
-- Histórico de respostas individuais (auditoria / analytics)
-- ------------------------------------------------------------
create table public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  selected_option_id text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

create index user_answers_user_id_idx on public.user_answers (user_id);

-- ------------------------------------------------------------
-- Estatísticas agregadas (XP, streak, vidas) — estilo Duolingo
-- ------------------------------------------------------------
create table public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp_total int not null default 0,
  hearts int not null default 5,
  streak_current int not null default 0,
  streak_longest int not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Trigger: cria profile + stats automaticamente no signup
-- ------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  insert into public.user_stats (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_answers enable row level security;
alter table public.user_stats enable row level security;

-- profiles: cada usuário vê/edita apenas o próprio perfil
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- conteúdo (módulos/lições/perguntas): leitura livre (publicado) para autenticados
create policy "modules: read published" on public.modules
  for select to authenticated using (is_published = true);
create policy "lessons: read published" on public.lessons
  for select to authenticated using (is_published = true);
create policy "questions: read all" on public.questions
  for select to authenticated using (true);

-- admins (profiles.is_admin = true) podem criar/editar/apagar conteúdo,
-- incluindo módulos/lições ainda não publicados (a policy acima cobre a leitura pública)
create policy "modules: admin manage" on public.modules
  for all to authenticated
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

create policy "lessons: admin manage" on public.lessons
  for all to authenticated
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

create policy "questions: admin manage" on public.questions
  for all to authenticated
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- progresso/respostas/stats: cada usuário só acessa os próprios dados
create policy "user_progress: select own" on public.user_progress
  for select using (auth.uid() = user_id);
create policy "user_progress: upsert own" on public.user_progress
  for insert with check (auth.uid() = user_id);
create policy "user_progress: update own" on public.user_progress
  for update using (auth.uid() = user_id);

create policy "user_answers: select own" on public.user_answers
  for select using (auth.uid() = user_id);
create policy "user_answers: insert own" on public.user_answers
  for insert with check (auth.uid() = user_id);

create policy "user_stats: select own" on public.user_stats
  for select using (auth.uid() = user_id);
create policy "user_stats: update own" on public.user_stats
  for update using (auth.uid() = user_id);

-- ============================================================
-- Seed mínimo de exemplo
-- ============================================================
insert into public.modules (slug, title, description, icon, order_index) values
  ('sinalizacao', 'Sinalização', 'Placas e sinais de trânsito na Itália', '🚸', 1),
  ('prioridade', 'Regras de prioridade', 'Quem passa primeiro nos cruzamentos', '🚦', 2);

with m as (select id from public.modules where slug = 'sinalizacao')
insert into public.lessons (module_id, slug, title, content, order_index, xp_reward)
select m.id, 'placas-de-perigo', 'Placas de perigo', '{"blocks":[{"type":"text","value":"Na Itália, placas triangulares com borda vermelha indicam perigo à frente."}]}'::jsonb, 1, 10
from m;

with l as (select id from public.lessons where slug = 'placas-de-perigo')
insert into public.questions (lesson_id, type, prompt, options, correct_option_id, explanation, order_index)
select l.id, 'multiple_choice',
  'O que indica uma placa triangular com borda vermelha?',
  '[{"id":"a","text":"Perigo à frente"},{"id":"b","text":"Proibido estacionar"},{"id":"c","text":"Fim da via"}]'::jsonb,
  'a', 'Placas triangulares de borda vermelha são sempre placas de perigo (advertência).', 1
from l;
