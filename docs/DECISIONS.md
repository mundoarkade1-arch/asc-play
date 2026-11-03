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

## D7. Adaptação à tela por tamanhos em dimens.xml (por altura)
Motivo: o app precisa caber em celular (paisagem) e TV sem esconder nada e sem mudar o visual. O app é só paisagem, então a altura é o menor lado; três faixas (menor que 400dp, 400 a 479dp, 480dp ou mais). A faixa grande guarda os valores originais, então a TV fica igual. Colunas das grades são calculadas no código (ScreenFit) porque o XML não limita o máximo. Sem dependência nova.

## D8. Paisagem nos dois sentidos, retrato fora
Motivo: sensorLandscape deixa girar o celular de cabeça para baixo sem perder o layout. Retrato pediria outro desenho (menu embaixo), o que mudaria a aparência. Fica como possível passo futuro, só se o dono pedir.

## D9. apk.yml trocado pelo do app nativo
Motivo: o apk.yml do repositório ainda era o do app web (Node, Capacitor, www/). Ele não compilava o código nativo. O novo segue docs/ARCHITECTURE.md (Gradle 8.9, Java 17, versão 10000+N, __REPO__ trocado em Updater.java, mesma assinatura e Release).

