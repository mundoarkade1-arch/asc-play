# ASC play

App Android (Capacitor) gerado pelo GitHub Actions.

## Estrutura

- `www/` – o app web (index.html, app.js, hls.min.js). É o `webDir` do Capacitor.
- `android-custom/` – classes Java e script que são copiados para o projeto Android durante o build.
- `assets/` – icon.png e banner.png.
- `scripts/setup.sh` – ajusta o projeto Android gerado (chamado pelo workflow).
- `.github/workflows/apk.yml` – workflow que gera o APK.
- `capacitor.config.json`, `package.json` – precisam ficar na raiz.

Não crie uma pasta `android/` na raiz: ela é gerada no build (`npx cap add android`).
