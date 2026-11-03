# Arquitetura

## Tecnologia ativa

- App híbrido Android com Capacitor 6. A interface e as funções ficam em `www/`; o Android hospeda essa interface em uma WebView.
- `android-custom/` contém os plugins Java usados pela interface para orientação, tela imersiva, armazenamento seguro, proxy de rede e atualização.
- `package.json` e `package-lock.json` fixam as dependências. `capacitor.config.json` define `com.ascplay.app`, o nome e a pasta `www`.
- A seleção de dispositivo é salva no aparelho. Smartphone usa a interface vertical; Smart TV/TV Box usa a interface horizontal. Ajustes permite trocar o modo.
- Os arquivos Gradle do app nativo anterior continuam no repositório como referência, mas não são usados pelo workflow ativo.

## Como o APK é gerado

- `.github/workflows/apk.yml` ("Gerar APK") roda em qualquer push para `main` ou `master` e também pode ser iniciado manualmente.
- O workflow usa Node.js 22 e Java 17, instala as dependências com `npm ci`, verifica os arquivos web, instala o leitor MPEG-TS, prepara o Android pelo Capacitor e compila com Gradle.
- `scripts/setup.sh` copia e registra os plugins Java, aplica a versão, prepara os ícones e o banner, configura o Manifest e executa as verificações de segurança.
- `VERSION_CODE` é `10000 + número da execução`; `VERSION_NAME` é `2.0.N`. Isso mantém o código acima do app antigo.
- A assinatura usa `KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` e `KEY_PASSWORD`. Nunca pedir ou registrar esses valores. Sem eles, o workflow gera somente um APK de teste.
- Com os Secrets, o Actions publica `ASC-play.apk` e `version.json` em uma Release do próprio repositório.

## Atualização automática

`UpdaterPlugin.java` consulta as Releases do próprio repositório, valida o SHA-256 e a assinatura antes de oferecer a atualização.

## Mapa dos arquivos e regras

Veja `docs/ARQUIVOS.md`. A descrição detalhada das telas Android nativas nesse arquivo é do código anterior e está mantida como referência; o APK atual usa a interface híbrida em `www/`.
