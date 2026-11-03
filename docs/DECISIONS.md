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


## D10. Correção de velocidade e travadas (canal, filme e série)
Problema: canal ao vivo demorava muito para abrir e travava; filmes e séries também.
Causas achadas: (1) no app web (www/app.js) o vigia reiniciava o canal depois de 8 s (ao vivo) ou 4 s parado, e alternava entre hls.js, leitor nativo e .ts sem dar tempo de nenhum abrir; o leitor .ts (mpegts.js) cortava a reserva de vídeo para 1,5 s; filme e série eram recarregados do zero depois de 6 s parados; (2) no app nativo, o SearchIndex.prebuildAsync baixava a lista inteira de canais, filmes e séries em segundo plano e disputava internet e processador com o vídeo; a reserva de 60 s em filme 4K podia encher a memória.
Decisões:
- Canal ao vivo do servidor: tenta .ts primeiro (abre em poucos segundos) e cai para .m3u8 se falhar; o formato que funcionou por último é lembrado (web: localStorage asc_pfh; nativo: SharedPreferences asc_player/live_ts).
- Vigia do web mais paciente: ao vivo abrindo 10 s (.ts) ou 18 s (.m3u8), ao vivo tocando 12 s, filme abrindo 40 s, filme tocando 25 s. Ao vivo que não abre passa para o outro formato.
- Web: reserva do hls.js ao vivo de 30 a 60 s; mpegts.js sem cortar a reserva (máx. 16 s, sobra 6 s); no .ts, se a reserva cai abaixo de 1,5 s toca a 0,93x até juntar 4 s; hls.js e mpegts.js carregam em segundo plano 5 s depois de abrir o app; filme e série em arquivo tocam direto.
- Nativo: SearchIndex.prebuildAsync DESLIGADO (o índice só é montado na primeira pesquisa). Não religar. Reserva limitada em bytes pela memória do aparelho; depois de travar espera 5 s (ao vivo) ou 6 s (filme); aparelho fraco (memória de app até 128 MB ou RAM abaixo de 1,6 GB) limita o vídeo a 1080p; erro 4xx no .ts vai direto para o .m3u8; a fila de troca de canal só começa depois que o canal abre (ou 8 s depois).

## D11. Smartphone em retrato na versão nativa
Motivo: restaurar a escolha inicial Smartphone/TV do app anterior sem trocar a identidade visual. `DeviceMode` e `DeviceActivity` fazem parte do módulo Android compilado; Ajustes permite escolher de novo. No Smartphone, telas de navegação ficam em retrato com menu inferior; o player permanece em paisagem. TV continua em paisagem com menu lateral. `AscApplication` oculta status e navegação do Android com reaparecimento temporário por gesto.
