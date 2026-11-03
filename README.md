# ASC play (nativo)

Player IPTV nativo para Android e Android TV (login por servidor ou lista M3U), feito em Java + Media3/ExoPlayer, sem WebView. Na primeira abertura, escolha Smartphone ou Smart TV / TV Box; altere depois em Ajustes. O app mantém o visual ASC play, com início, canais, filmes, séries, busca, controle parental e ajustes.

Para entender o projeto, comece por `AGENTS.md` e `docs/STATUS.md`.

## Como gerar o APK
1. Coloque estes arquivos no repositório `asc-play` (apague as pastas antigas `www/`, `android-custom/`, `scripts/`, `assets/` e os arquivos `capacitor.config.json`, `package.json`, `package-lock.json`, `app_full.js`).
2. **Actions → Gerar APK → Run workflow** (também roda a cada mudança na branch `main`).
3. O APK sai em **Releases** (se os Secrets `KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` e `KEY_PASSWORD` existirem; use os MESMOS do app antigo para atualizar por cima) ou como artefato da execução (APK de teste).

## O que mudou em relação ao ASC play web
- Nativo: sem WebView, sem Capacitor, sem hls.js/mpegts.js. Player Media3 1.8 (HLS, DASH, MPEG-TS e arquivos diretos).
- No Smartphone, a interface fica em retrato com navegação inferior; o player abre em paisagem. Na TV, a interface e o controle remoto continuam em paisagem.
- As barras do Android ficam ocultas e aparecem temporariamente ao deslizar a partir da borda.
- Mesmo visual vermelho e preto do ASC play.
- Os dados (login, favoritos) do app antigo ficavam dentro do WebView e não passam para o app novo: é preciso entrar de novo uma vez.

Detalhes: `docs/ARQUIVOS.md` (seção "Só no ASC play").
