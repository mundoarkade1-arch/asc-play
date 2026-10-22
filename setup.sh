set -e
M=android/app/src/main/AndroidManifest.xml
R=android/app/src/main/res

# --- Java certo para a versao do Capacitor (7 ou mais pede Java 21; 6 pede Java 17)
CAPV=$(node -p "require('./node_modules/@capacitor/android/package.json').version" 2>/dev/null || echo 0)
CAPM=${CAPV%%.*}
if [ "$CAPM" -ge 7 ] 2>/dev/null; then J="$JAVA_HOME_21_X64"; else J="$JAVA_HOME_17_X64"; fi
echo "Capacitor versao: $CAPV"
if [ -n "$J" ] && [ -d "$J" ] && [ -n "$GITHUB_ENV" ]; then
  echo "JAVA_HOME=$J" >> "$GITHUB_ENV"
  echo "$J/bin" >> "$GITHUB_PATH"
  echo "Usando Java em: $J"
fi

# --- Copia as classes Java ajustando o package ao do projeto
F=$(find android/app/src/main/java -name MainActivity.java | head -n1)
[ -n "$F" ] || { echo "MainActivity.java nao encontrado"; exit 1; }
D=$(dirname "$F")
PK=$(sed -n 's/^package \(.*\);.*/\1/p' "$F" | head -n1)
cp MainActivity.java ImmersivePlugin.java UpdaterPlugin.java "$D/"
sed -i "s/^package .*;/package $PK;/" "$D/MainActivity.java" "$D/ImmersivePlugin.java" "$D/UpdaterPlugin.java"
echo "Package: $PK"

# --- Versao do app (o workflow passa VERSION_CODE e VERSION_NAME; cada build precisa de codigo maior)
G=android/app/build.gradle
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE:-1}/; s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME:-1.0}\"/" "$G"
echo "Versao: ${VERSION_NAME:-1.0} (${VERSION_CODE:-1})"

# --- Permissoes: instalar atualizacao e avisar vencimento (notificacao)
grep -q REQUEST_INSTALL_PACKAGES $M || sed -i 's#<application#<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES"/><uses-permission android:name="android.permission.POST_NOTIFICATIONS"/><application#' $M

# --- FileProvider: pasta de cache de onde o instalador le o APK baixado
mkdir -p $R/xml
cat > $R/xml/file_paths.xml <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <cache-path name="my_cache_images" path="." />
</paths>
XML

# --- Manifest (TV + trafego http)
grep -q usesCleartextTraffic $M || sed -i 's#<application#<uses-feature android:name="android.software.leanback" android:required="false"/><uses-feature android:name="android.hardware.touchscreen" android:required="false"/><application android:usesCleartextTraffic="true"#' $M
sed -i 's#<category android:name="android.intent.category.LAUNCHER" />#&<category android:name="android.intent.category.LEANBACK_LAUNCHER" />#' $M
[ -f debug.keystore ] && { mkdir -p ~/.android; cp debug.keystore ~/.android/debug.keystore; } || true

# --- Icones e banner
im() { if command -v magick >/dev/null 2>&1; then magick "$@"; else convert "$@"; fi; }

# Aceita icon.png, icone.png ou ícone.png (com acento) e normaliza o nome
ICON=""
for c in icon.png icone.png "ícone.png" Icon.png Icone.png; do
  [ -f "$c" ] && { ICON="$c"; break; }
done
[ -n "$ICON" ] || { echo "ERRO: icone nao encontrado (esperado icon.png na raiz do repositorio)"; ls -la; exit 1; }
cp "$ICON" /tmp/asc_icon.png
echo "Icone usado: $ICON"

rm -rf $R/mipmap-anydpi-v26
rm -f $R/mipmap-*/ic_launcher*.webp $R/mipmap-*/ic_launcher*.png
for d in "mdpi 48" "hdpi 72" "xhdpi 96" "xxhdpi 144" "xxxhdpi 192"; do
  set -- $d
  mkdir -p $R/mipmap-$1
  im /tmp/asc_icon.png -resize ${2}x${2} $R/mipmap-$1/ic_launcher.png
  # versao redonda: recorta em circulo
  im /tmp/asc_icon.png -resize ${2}x${2} \( -size ${2}x${2} xc:none -fill white -draw "circle $(( $2 / 2 )),$(( $2 / 2 )) $(( $2 / 2 )),0" \) -compose DstIn -composite $R/mipmap-$1/ic_launcher_round.png
  im /tmp/asc_icon.png -resize ${2}x${2} $R/mipmap-$1/ic_launcher_foreground.png
  [ -s $R/mipmap-$1/ic_launcher.png ] || { echo "ERRO: falha ao gerar icone $1"; exit 1; }
done
mkdir -p $R/drawable-xhdpi
cp banner.png $R/drawable-xhdpi/banner.png
grep -q 'android:banner=' $M || sed -i 's#<application#<application android:banner="@drawable/banner"#' $M
echo "Icones gerados:"; ls -la $R/mipmap-xxxhdpi
