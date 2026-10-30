# ASC Play

Player IPTV para Android e Android TV (M3U e servidor com login), feito com Capacitor. O APK é gerado pelo GitHub Actions.

## Estrutura

```
.github/workflows/apk.yml   compila, assina e publica o APK
android-custom/             plugins Java e ajustes de segurança copiados no build
assets/                     identidade visual oficial (icon, icon-foreground, banner)
scripts/setup.sh            prepara o projeto Android (ícones, banner, manifest, segurança)
www/                        o app (index.html, style.css, app.js, hls.min.js, recovery.js, icon.png, banner.jpg)
capacitor.config.json  package.json  package-lock.json
```

A pasta `android/` é gerada no build e não vai para o repositório.

## Trocar ícone ou banner

Substitua os arquivos em `assets/` mantendo nome e tamanho e faça o commit. O build recria todos os recursos do Android a partir deles.

| Arquivo | Uso | Tamanho |
|---|---|---|
| `assets/icon.png` | ícone (Android antigo e redondo) | 512×512 |
| `assets/icon-foreground.png` | camada frontal do ícone adaptativo (fundo preto) | 432×432, logo dentro dos 66% centrais |
| `assets/banner.png` | banner da Android TV | 640×360 |
| `www/icon.png`, `www/banner.jpg` | usados dentro do app (telas de entrada e cabeçalho) | 192×192 e 960×540 |

Se o ícone antigo continuar aparecendo depois de instalar, é cache do launcher: reinicie o aparelho ou desinstale e instale de novo.

## Gerar o APK

**Actions → Gerar APK → Run workflow** (também roda a cada push em `main`/`master`). O APK fica como artefato da execução. Os builds seguintes usam cache e ficam bem mais rápidos.

### Secrets de assinatura (Settings → Secrets and variables → Actions)

`KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

Mantenha a mesma chave das versões já instaladas, senão o Android não atualiza por cima. Nunca envie a keystore ao repositório. Sem os secrets o workflow gera só um APK de teste e não publica Release.

## Canais e login

- Canais Xtream ao vivo: o app tenta `.m3u8` e `.ts` e passa para o outro formato se o servidor responder 404/403. Canais `.ts` puros são lidos pelo `mpegts.js`, que o workflow baixa no build (o Android não toca TS direto).
- Login com servidor: tenta `get.php` em vários formatos (`output=m3u8`, `ts`, sem `output`). Se o painel não tiver `get.php`, monta a lista pela `player_api.php` (canais e filmes).

## Segurança

- Listas, logins, favoritos e PIN ficam criptografados (AES-GCM) com chave protegida pelo Android Keystore.
- Proxy de rede nativo só aceita GET http/https e bloqueia o próprio aparelho e a rede local.
- Atualização só de Releases do próprio repositório, com SHA-256 obrigatório e conferência de assinatura e pacote.
- Sem backup do Android, sem depuração, WebView sem acesso a arquivos, CSP restritiva.
- HTTP puro continua liberado porque muitos servidores IPTV só funcionam assim. Use HTTPS quando o servidor tiver.

## Teste local rápido

`node --check www/app.js` e abra `www/index.html` por um servidor estático. O build completo do Android roda no GitHub Actions.
