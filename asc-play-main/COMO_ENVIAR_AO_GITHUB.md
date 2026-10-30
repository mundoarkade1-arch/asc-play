# Como enviar o ASC Play corrigido ao GitHub

1. Baixe e descompacte `asc-play-corrigido.zip` no computador.
2. Abra a pasta `asc-play-corrigido`.
3. No GitHub, abra o repositorio `mundoarkade1-arch/asc-play`.
4. Antes de substituir arquivos, confirme que consegue voltar a um commit anterior pela aba **Commits**. Se preferir, crie uma branch para testar.
5. Para enviar os arquivos pela interface web, abra **Add file → Upload files** e arraste os arquivos e pastas do projeto descompactado para a pagina. O navegador pode nao aceitar pastas/arquivos demais de uma vez; nesse caso, use GitHub Desktop ou envie em lotes.
6. Confirme que `package.json`, `package-lock.json`, `capacitor.config.json`, `www/`, `android-custom/`, `scripts/`, `.github/` e `assets/` ficam na raiz do repositorio. Nao envie uma pasta externa extra contendo o projeto inteiro.
7. Faça o commit das alteracoes.
8. Abra **Actions → Gerar APK → Run workflow** ou aguarde o workflow disparar pelo push.
9. Confira os logs. Sem os quatro secrets de assinatura, o workflow gera apenas um APK de teste e nao publica uma Release oficial.

## Cuidado com a assinatura

Nao altere nem substitua a keystore usada para assinar a versao instalada no seu aparelho. Este ZIP nao inclui chaves privadas. Se os secrets ja estavam configurados no GitHub, mantenha-os intactos.

## Validacao realizada neste pacote

- Sintaxe JavaScript de `www/app.js`: aprovada com `node --check`.
- Sintaxe do script `android-custom/harden-android.js`: aprovada com `node --check`.
- YAML do workflow: lido com parser YAML.
- O build Android completo nao foi executado nesta sessao; confirme a compilacao no GitHub Actions e teste o APK num aparelho antes de distribuir.
