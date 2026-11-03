# Status do projeto

Última atualização: 03/11/2026 (primeira versão nativa montada; ainda NÃO compilada nem testada)
Regras de trabalho: AGENTS.md. Mapa e limites: docs/ARQUIVOS.md. Montagem e versão: docs/ARCHITECTURE.md. Decisões: docs/DECISIONS.md.

## Fase atual
Migração do ASC play (web/Capacitor) para nativo, usando o código do asc-tvbox como base.

## Feito
- Código do asc-tvbox copiado, pacote trocado para com.ascplay.app, nome "ASC play", ícones e banners do asc-play.
- Player atualizado para Media3 1.8.0 (+DASH), buffer por tipo, decoder fallback, 4K limitado à tela, volta ao ao vivo, reconexão automática, HLS forçado quando o endereço não tem extensão.
- TrackDialog: áudio e legendas pela tecla de menu em filme e episódio.
- Workflow novo (Gradle 8.9, Java 17, versão 10000+N, REPO automático).

## Falta
- Rodar o Actions pela primeira vez e corrigir erro de compilação, se houver (o código não foi compilado onde foi escrito).
- Testar numa TV: login, canais, guia, filmes, séries, continuar, busca, parental, atualização.
- Opcional, só se o dono pedir: favoritos, várias listas, PIN do app, aviso de vencimento, EPG por link XMLTV.

## Perguntas abertas
- Confirmar que os Secrets de assinatura do repositório asc-play são os mesmos do app antigo (senão o Android pede para desinstalar o antigo).
