# ASC play

Aplicativo híbrido para Android, Smartphone e Android TV/TV Box. A interface é feita em HTML, CSS e JavaScript e empacotada no Android com Capacitor; plugins Java cuidam de recursos do aparelho.

## Escolha do dispositivo

Na primeira abertura, escolha **Smartphone** ou **Smart TV / TV Box**. A escolha fica salva e pode ser alterada em **Ajustes → Trocar dispositivo**.

- **Smartphone:** interface vertical, com busca no alto, categorias abaixo e navegação na parte de baixo.
- **Smart TV / TV Box:** interface horizontal, organizada para controle remoto.

As categorias de canais, filmes e séries mostram a quantidade de itens. Os episódios são organizados em blocos de 50; uma série com 200 episódios pode ser percorrida em quatro blocos, e listas maiores também não são limitadas a 200.

Ao atualizar de uma instalação da versão Android nativa para esta versão híbrida, será necessário entrar novamente. Os dados anteriores permanecem no armazenamento privado do aparelho, mas não são importados para a interface híbrida.

## Gerar o APK

O workflow **Gerar APK** roda automaticamente a cada push para `main` ou `master`. Para iniciar manualmente, abra **Actions → Gerar APK → Run workflow**. O APK fica como artefato da execução; na branch `main`, também é publicado em Releases quando os Secrets de assinatura estão configurados.

### Secrets de assinatura

Em **Settings → Secrets and variables → Actions**, configure `KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` e `KEY_PASSWORD`. Use a mesma chave das versões já instaladas para permitir a atualização por cima. Nunca envie a keystore ao repositório. Sem os Secrets, o workflow gera somente um APK de teste.

## Arquivos principais

- `www/index.html`, `www/style.css`, `www/app.js`: telas e interface.
- `android-custom/`: plugins Java do Capacitor.
- `capacitor.config.json`, `package.json`, `package-lock.json`: configuração e dependências do app híbrido.
- `.github/workflows/apk.yml`: geração automática do APK.

O ícone e o banner do aplicativo ficam em `assets/`; os usados dentro da interface ficam em `www/`.

## Funções

O app aceita login por servidor ou lista M3U e inclui canais, filmes, séries, pesquisa, favoritos, controle parental, listas salvas, guia de programação e ajustes. O player suporta HLS, MPEG-TS e arquivos diretos.

O login por servidor tenta obter a lista por `get.php`; se o painel não oferecer esse arquivo, usa a `player_api.php` para montar canais e filmes. Em canais ao vivo, o player tenta os formatos `.ts` e `.m3u8` disponíveis.

## Ícone e segurança

Os ícones e o banner da Android TV são gerados no build a partir de `assets/icon.png` (512×512), `assets/icon-foreground.png` (432×432) e `assets/banner.png` (640×360). Os arquivos `www/icon.png` e `www/banner.jpg` são usados dentro da interface.

Logins, listas, favoritos e PIN são protegidos no aparelho pelo Android Keystore. O WebView não tem acesso a arquivos locais nem depuração remota; o proxy nativo limita as requisições ao uso previsto pelo app. HTTP continua disponível para servidores que não oferecem HTTPS; prefira HTTPS quando possível.

## Verificação local

Com Node.js instalado, rode `npm ci`, `node --check www/app.js` e `node --check www/recovery.js`. O APK completo é compilado pelo GitHub Actions.
