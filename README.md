# ASC play (nativo)

Player IPTV para Android TV, TV boxes e Smart TVs (login por servidor ou lista M3U), 100% nativo (Java + Media3/ExoPlayer, sem WebView). O visual e as telas vêm do asc-tvbox: início com "Continue assistindo", canais com guia de programação, filmes, séries, busca, controle parental e ajustes.

Para entender o projeto, comece por `AGENTS.md` e `docs/STATUS.md`.

## Como gerar o APK

**Actions → Gerar APK → Run workflow** para iniciar manualmente. O workflow também compila automaticamente a cada push para as branches `main` e `master`. O APK fica como artefato da execução; na branch `main`, com os Secrets de assinatura configurados, também é publicado em Releases.

### Secrets de assinatura (Settings → Secrets and variables → Actions)

`KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

Use a mesma chave das versões já instaladas para permitir a atualização por cima. Nunca envie a keystore ao repositório. Sem os Secrets, o workflow gera somente um APK de teste e não publica uma Release.

## O que mudou em relação ao ASC play web
- Nativo: sem WebView, sem Capacitor, sem hls.js/mpegts.js. Player Media3 1.8 (HLS, DASH, MPEG-TS e arquivos diretos).
- Mesmo visual vermelho e preto do TV Box, feito para controle remoto.
- Os dados (login, favoritos) do app antigo ficavam dentro do WebView e não passam para o app novo: é preciso entrar de novo uma vez.

Detalhes: `docs/ARQUIVOS.md` (seção "Só no ASC play").

## Referência histórica do app web

As informações abaixo descrevem a versão web/Capacitor anterior, não o build Android nativo atual. São mantidas como referência do trabalho anterior.

### Trocar ícone ou banner

Na versão web, os arquivos em `assets/` eram substituídos mantendo nome e tamanho; o build recriava os recursos Android a partir deles.

| Arquivo | Uso | Tamanho |
|---|---|---|
| `assets/icon.png` | ícone (Android antigo e redondo) | 512×512 |
| `assets/icon-foreground.png` | camada frontal do ícone adaptativo (fundo preto) | 432×432, logo dentro dos 66% centrais |
| `assets/banner.png` | banner da Android TV | 640×360 |
| `www/icon.png`, `www/banner.jpg` | usados dentro do app (telas de entrada e cabeçalho) | 192×192 e 960×540 |

Se o ícone antigo continuar aparecendo depois de instalar, pode ser cache do launcher: reinicie o aparelho ou desinstale e instale de novo.

### Build e assinatura da versão web

Na versão web, o workflow também gerava APK por **Actions → Gerar APK → Run workflow**, em pushes para `main`/`master`, com cache nos builds seguintes. O APK era disponibilizado como artefato; com os Secrets de assinatura (`KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`), podia ser publicado em Releases. A chave precisava ser a mesma das versões instaladas; sem ela, era gerado apenas um APK de teste.

### Canais e login da versão web

- Canais Xtream ao vivo: o app tenta `.m3u8` e `.ts` e passa para o outro formato se o servidor responder 404/403. Canais `.ts` puros são lidos pelo `mpegts.js`, que o workflow baixa no build (o Android não toca TS direto).
- Login com servidor: tenta `get.php` em vários formatos (`output=m3u8`, `ts`, sem `output`). Se o painel não tiver `get.php`, monta a lista pela `player_api.php` (canais e filmes).

### Interface da versão web

Na primeira abertura, escolha Smartphone ou Smart TV / TV Box. A escolha pode ser alterada depois em Ajustes → Trocar dispositivo. O modo Smartphone usa a interface vertical; a reprodução abre em tela cheia na horizontal. No Android, as barras do sistema ficam ocultas e podem ser reveladas temporariamente com um gesto.

### Segurança da versão web

- Listas, logins, favoritos e PIN ficam criptografados (AES-GCM) com chave protegida pelo Android Keystore.
- Proxy de rede nativo só aceita GET http/https e bloqueia o próprio aparelho e a rede local.
- Atualização só de Releases do próprio repositório, com SHA-256 obrigatório e conferência de assinatura e pacote.
- Sem backup do Android, sem depuração, WebView sem acesso a arquivos, CSP restritiva.
- HTTP puro continuava liberado porque muitos servidores IPTV só funcionavam assim. Use HTTPS quando o servidor tiver.

### Teste local da versão web

`node --check www/app.js` e abra `www/index.html` por um servidor estático. O build completo do Android roda no GitHub Actions.
