# Decisões (só se acrescenta no fim)

## D1. ASC play nativo parte do código do asc-tvbox
Motivo: o asc-tvbox já é nativo, testado e tem o visual e as funções pedidas (guia, filmes, séries, continuar, busca, parental). Reescrever do zero repetiria trabalho e erros. Os dois apps ficam como repositórios separados: o tvbox para aparelhos antigos, o play para TVs novas.

## D2. Mesmo applicationId do app antigo (com.ascplay.app)
Motivo: o APK nativo atualiza por cima do web, mantendo o ícone e o canal de atualização. Exige a MESMA chave de assinatura e versionCode maior (10000 + execução).

## D3. Media3 1.8.0 com módulo DASH
Motivo: player atual, mais formatos (DASH), decodificação MPEG-TS nativa (substitui mpegts.js) e melhor recuperação de erros. Justificativa da dependência nova: exoplayer-dash.

## D4. minSdk 24, targetSdk 34
Motivo: TVs novas (Android 7+). targetSdk 34 evita o modo tela-cheia forçado do Android 15 até testar nas TVs.

## D5. Buffer e qualidade
Ao vivo: 10 a 30 s. Filme e episódio: 20 a 60 s com 20 s para trás. Vídeo até 4K/60, limitado ao tamanho real da tela. O limite de 1080p do tvbox existia por causa do TX9 e foi removido.

## D6. Funções do app web ainda não portadas
Favoritos, várias listas, PIN do app, aviso de vencimento, canal do cliente, bloqueio de capturas e EPG por XMLTV ficaram de fora da primeira versão para manter o código igual ao do tvbox (já testado). Entram depois, uma por vez.
