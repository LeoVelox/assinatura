# Landing do Nexo (sarmtech.com.br)

Página estática: HTML, CSS e JS puro, sem build. Serve só para captar o cadastro do teste de 30 dias.
O cadastro cria a conta no Supabase (a mesma do app). O banco libera os 30 dias no momento do cadastro.

## Antes de publicar
1. Abra `config.js` e cole a chave **anon/publishable** em `SUPABASE_KEY` (a mesma `VITE_SUPABASE_ANON_KEY` do app).
   Nunca use a service_role nem a secret key.
2. `SUPABASE_URL` aponta para o projeto de desenvolvimento. Ao criar o projeto de produção, troque aqui.
3. `APP_URL` é o endereço do app (`https://app.sarmtech.com.br`). Para testar no computador, use `http://localhost:3100`.
4. `LEGAL_VERSION` deve ser igual a `LEGAL_VERSION` em `app/src/lib/legal.ts`.

## Supabase (Authentication > URL Configuration)
- Site URL: `https://app.sarmtech.com.br`
- Redirect URLs: inclua `https://app.sarmtech.com.br/**`

## Netlify
- Novo site a partir do mesmo repositório do GitHub.
- Base directory: `landing`. Build command: vazio. Publish directory: `landing`.
- Domínio: `sarmtech.com.br` (e `www`) neste site. O app vai em `app.sarmtech.com.br`, no site do app.

## Testar no computador
`npx serve landing` (ou `python -m http.server 3200 -d landing`) e abra http://localhost:3200.
