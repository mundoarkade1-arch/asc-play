# ASC Play

Aplicativo Android baseado em Capacitor. O APK e gerado pelo GitHub Actions.

## Estrutura do projeto

- `www/` — interface e logica web do aplicativo.
- `android-custom/` — plugins Java e ajustes de seguranca copiados durante o build.
- `assets/` — icone e banner.
- `scripts/setup.sh` — prepara o projeto Android gerado.
- `.github/workflows/apk.yml` — compila e, quando configurada a assinatura de producao, publica o APK.
- `capacitor.config.json`, `package.json` e `package-lock.json` — configuracao e dependencias.

A pasta `android/` e gerada pelo workflow. Nao precisa ser enviada ao repositorio.

## Build

O workflow pode ser iniciado pela aba **Actions** do GitHub, selecionando **Gerar APK** e **Run workflow**. Tambem roda ao enviar alteracoes para `main` ou `master`.

O APK e disponibilizado como artefato da execucao. Uma Release oficial so deve ser publicada quando os secrets de assinatura estiverem configurados.

## Secrets de assinatura

Configure em **Settings → Secrets and variables → Actions**:

- `KEYSTORE_B64` — arquivo keystore codificado em Base64.
- `KEYSTORE_PASSWORD` — senha da keystore.
- `KEY_ALIAS` — alias da chave de assinatura.
- `KEY_PASSWORD` — senha da chave.

Nao envie a keystore nem as senhas ao repositorio ou a conversas. Preserve a mesma chave de assinatura utilizada nas versoes instaladas anteriormente. Se perder a chave, nao sera possivel atualizar normalmente uma instalacao assinada com ela.

Sem uma keystore fixa, o workflow gera apenas um APK de teste e nao publica uma Release oficial.

## Atualizacoes

O workflow publica `version.json` com numero da versao, URL do APK e SHA-256. O aplicativo valida o formato do hash antes de oferecer a atualizacao, e o plugin nativo exige o hash e verifica a assinatura e o pacote antes de abrir o instalador.

O hash protege a integridade do arquivo em relacao ao manifesto recebido; a autenticidade tambem depende da origem confiavel do manifesto e da verificacao da assinatura do APK.

## Compatibilidade e seguranca

O projeto permite conexoes HTTP para manter compatibilidade com servidores antigos. HTTP nao criptografa credenciais nem o conteudo da conexao; prefira HTTPS sempre que o servidor oferecer suporte.

## Testes locais

- Verifique a sintaxe JavaScript com `node --check www/app.js`.
- O build Android completo precisa das dependencias do projeto e do Android SDK, normalmente fornecidos pelo GitHub Actions.
- Teste atualizacao sobre uma instalacao anterior em aparelho de teste antes de publicar uma nova versao.
