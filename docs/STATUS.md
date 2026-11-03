# Status do projeto

Última atualização: 03/11/2026 (adaptação à tela feita; ainda NÃO compilada nem testada)
Regras de trabalho: AGENTS.md. Mapa e limites: docs/ARQUIVOS.md. Montagem e versão: docs/ARCHITECTURE.md. Decisões: docs/DECISIONS.md.

## Fase atual
Migração do ASC play (web/Capacitor) para nativo, usando o código do asc-tvbox como base. Agora também adaptado a celular (paisagem) e TV.

## Feito
- Código do asc-tvbox copiado, pacote com.ascplay.app, nome "ASC play", ícones e banners do asc-play.
- Player Media3 1.8.0 (+DASH), buffer por tipo, decoder fallback, 4K limitado à tela, reconexão automática.
- TrackDialog: áudio e legendas pela tecla de menu em filme e episódio.
- Adaptação à tela (D7): tamanhos por altura em values*/dimens.xml, menu que rola, colunas calculadas (ScreenFit), teclados e janela da programação adaptados, player em tela cheia, paisagem nos dois sentidos.
- apk.yml trocado pelo do app nativo (D9).

## Falta
- Rodar o Actions e corrigir erro de compilação, se houver (nada foi compilado ainda).
- Testar numa TV e num celular em paisagem: menu inteiro visível, grades sem cartões sobrepostos, página da série e do filme inteiras, teclado de busca, login.
- Apagar do repositório as pastas e arquivos do app web antigo (www, android-custom, scripts, assets, capacitor.config.json, package.json, package-lock.json, app_full.js), como diz o README.
- Opcional, só se o dono pedir: modo retrato, favoritos, várias listas, PIN do app, aviso de vencimento, EPG por XMLTV, R8 (minificação) para APK menor.

## Perguntas abertas
- Confirmar que os Secrets de assinatura do repositório asc-play são os mesmos do app antigo (senão o Android pede para desinstalar o antigo).
