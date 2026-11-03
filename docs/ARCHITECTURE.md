# Arquitetura

## Tecnologia
- Android nativo em Java 17, sem WebView. Pacote/applicationId com.ascplay.app. minSdk 24, compileSdk 35, targetSdk 34. Sem minificação.
- Dependências (app/build.gradle): androidx.media3 exoplayer, exoplayer-hls, exoplayer-dash e ui (versão 1.8.0) e androidx.core 1.15.0. Qualquer dependência nova precisa de justificativa em docs/DECISIONS.md.
- Telas em Activities, listas em ListView/GridView, imagens pelo ImageLoader próprio, rede com HttpURLConnection.

## Como o APK é gerado
- .github/workflows/apk.yml ("Gerar APK"). Roda a cada mudança em main/master e à mão (workflow_dispatch). Gradle 8.9, Java 17, AGP 8.7.3.
- VERSION_CODE = 10000 + número da execução; VERSION_NAME = 2.0.N. O app/build.gradle lê as duas variáveis. O 10000 garante versão maior que a do app web antigo.
- O workflow troca __REPO__ em Updater.java pelo repositório real.
- Assinatura: Secrets KEYSTORE_B64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD (os mesmos do app antigo, para atualizar por cima). NUNCA pedir esses valores ao dono. Sem a chave, o APK é só de teste e NÃO é publicado.
- Com a chave, o Actions cria a Release "vN" com ASC-play.apk e version.json (code, name, url, sha256, notes).

## Atualização automática
- Updater.java confere a versão publicada em Releases e, se for maior, oferece instalar (aviso na página inicial e opção em Ajustes). Só aceita APK do próprio repositório e com SHA-256.

## Mapa dos arquivos e regras
Veja docs/ARQUIVOS.md.
