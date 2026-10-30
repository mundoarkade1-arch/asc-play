# Identidade visual oficial do ASC Play

Arquivos oficiais usados pela compilação:
- `assets/icon.png`: ícone quadrado do aplicativo (fonte para gerar os mipmaps Android).
- `assets/banner.png`: banner panorâmico 16:9 usado como banner Android TV.
- `assets/ASC-icon-original.png`: arte original do ícone em alta resolução.
- `assets/ASC-banner-original.png`: arte original panorâmica em alta resolução.

O `scripts/setup.sh` agora usa exclusivamente `assets/icon.png`. Isso evita que um `icon.png` antigo na raiz do repositório tenha prioridade. A compilação recria os recursos Android a partir desses arquivos.

Depois de publicar, execute um novo workflow e instale o APK novo. Se o ícone antigo continuar aparecendo, desinstale a versão antiga apenas se aceitar perder os dados locais; primeiro teste instalar o APK atualizado por cima. Alguns launchers mantêm cache do ícone por algum tempo.
