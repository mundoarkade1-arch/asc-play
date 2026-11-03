# Status do projeto

Última atualização: 03/11/2026 (interface híbrida restaurada; preparação do Android passou, APK ainda não compilado)
Regras: `AGENTS.md`. Arquitetura: `docs/ARCHITECTURE.md`. Decisões: `docs/DECISIONS.md`.

## Fase atual
Retomada do app híbrido Android com Capacitor. O mesmo APK oferece modo Smartphone vertical e modo Smart TV/TV Box horizontal.

## Feito
- Restaurados os arquivos web, configuração Capacitor, dependências, plugins e recursos necessários para gerar o APK híbrido.
- A tela inicial pergunta o dispositivo; a preferência é salva e pode ser trocada em Ajustes.
- No Smartphone, a busca fica em cima e a navegação embaixo; no modo TV, a interface muda para uso horizontal com controle remoto.
- A lista de episódios é exibida em grupos de 50, permitindo percorrer 200 episódios em quatro grupos ou mais quando existirem.
- O workflow foi ligado novamente ao build Capacitor e dispara em qualquer push para `main`/`master`.
- A preparação Android e a sincronização do Capacitor passaram localmente. A compilação local não passou porque o ambiente usa Java 25 e não tem Android SDK; o workflow configura Java 17.
- O código Android nativo anterior foi mantido no repositório, sem ser removido.

## Falta
- Enviar estas alterações ao GitHub e confirmar que o Actions compila o APK.
- Instalar e testar em smartphone retrato e TV/TV Box: seleção inicial, busca, categorias, navegação, troca em Ajustes e séries longas.
- Corrigir qualquer erro que apareça no Actions ou nos testes nos aparelhos.

## Observação
As alterações ainda precisam de build e teste em aparelhos reais. O código nativo anterior não é a base do workflow atual.
