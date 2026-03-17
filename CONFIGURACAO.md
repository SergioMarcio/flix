# FLIX — Configuração do Supabase

## Passo 1: Criar o projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Nome do projeto: `flix`
4. Escolha uma senha para o banco de dados
5. Selecione a região mais próxima (ex: South America - São Paulo)
6. Clique em **"Create new project"** e aguarde

## Passo 2: Criar a tabela

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **"New query"**
3. Cole e execute o conteúdo do arquivo `SUPABASE_SETUP.sql`

## Passo 3: Obter as credenciais

1. No painel do Supabase, vá em **Settings > API**
2. Copie:
   - **Project URL** (ex: `https://xyzabc.supabase.co`)
   - **anon/public key** (começa com `eyJ...`)

## Passo 4: Configurar o projeto Angular

Abra o arquivo `src/environments/environment.ts` e substitua:

```typescript
supabaseUrl: 'https://xxzdgdriysalpqqnxsrf.supabase.co',        // <- cole o Project URL aqui
supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4emRnZHJpeXNhbHBxcW54c3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzM5NzMsImV4cCI6MjA4OTAwOTk3M30.9EGnb5TIF-DcQ3Uc1T1jCuDd3cPsTWxoHXfxtB1ubHM' // <- cole a anon key aqui
```

## Passo 5: Executar o projeto

```bash
npm start
# ou
ng serve
```

Acesse: http://localhost:4200

---

## Status dos filmes

| Status | Label | Significado |
|--------|-------|-------------|
| `watched` | ✅ Vi | Filme já assistido |
| `not_watched` | ❌ Não Vi | Filme não assistido |
| `want_to_watch` | ⭐ Quero Ver | Filme na lista de desejos |
