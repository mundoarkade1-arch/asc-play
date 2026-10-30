# Alteracoes aplicadas ao pacote

Este pacote parte do ZIP original enviado nesta conversa. Foram feitas alteracoes conservadoras para preservar a arquitetura atual.

## Arquivos modificados

- `android-custom/UpdaterPlugin.java`
  - A atualizacao agora exige um SHA-256 com exatamente 64 caracteres hexadecimais.
  - A comparacao do hash e feita apos o download; arquivos invalidos sao apagados.
  - Falhas iniciais de origem e tamanho tambem limpam o arquivo temporario.

- `www/app.js`
  - O aplicativo rejeita manifestos de atualizacao sem SHA-256 valido antes de apresentar a atualizacao.
  - O hash validado e enviado ao plugin nativo sem substituir valores ausentes por string vazia.

- `.github/workflows/apk.yml`
  - Adicionada validacao antecipada dos secrets de assinatura quando uma keystore de producao estiver configurada.
  - Se houver keystore mas faltarem senha/alias, a execucao falha antes da compilacao/publicacao.

- `README.md`
  - Documentacao de estrutura, build, secrets e limitacoes de seguranca atualizada.

## Importante

- Nenhuma chave privada ou senha foi adicionada ao pacote.
- A chave de assinatura e o certificado esperado existente foram preservados.
- O projeto nao foi compilado contra Android SDK nesta sessao; execute o workflow do GitHub e teste o APK em um dispositivo antes de distribuir.
- O suporte HTTP continua habilitado por compatibilidade com servidores antigos. Use HTTPS quando disponivel.
