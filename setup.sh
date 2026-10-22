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
cp MainActivity.java ImmersivePlugin.java "$D/"
sed -i "s/^package .*;/package $PK;/" "$D/MainActivity.java" "$D/ImmersivePlugin.java"
echo "Package: $PK"

# --- Manifest (TV + trafego http)
grep -q usesCleartextTraffic $M || sed -i 's#<application#<uses-feature android:name="android.software.leanback" android:required="false"/><uses-feature android:name="android.hardware.touchscreen" android:required="false"/><application android:usesCleartextTraffic="true"#' $M
sed -i 's#<category android:name="android.intent.category.LAUNCHER" />#&<category android:name="android.intent.category.LEANBACK_LAUNCHER" />#' $M
[ -f debug.keystore ] && { mkdir -p ~/.android; cp debug.keystore ~/.android/debug.keystore; } || true

# --- Icones e banner
im() { if command -v magick >/dev/null 2>&1; then magick "$@"; else convert "$@"; fi; }
icons() {
  rm -rf $R/mipmap-anydpi-v26
  rm -f $R/mipmap-*/ic_launcher*.webp
  for d in "mdpi 48" "hdpi 72" "xhdpi 96" "xxhdpi 144" "xxxhdpi 192"; do
    set -- $d
    mkdir -p $R/mipmap-$1
    for n in ic_launcher ic_launcher_round ic_launcher_foreground; do im icon.png -resize ${2}x${2} $R/mipmap-$1/$n.png; done
  done
  mkdir -p $R/drawable-xhdpi
  cp banner.png $R/drawable-xhdpi/banner.png
  sed -i 's#<application#<application android:banner="@drawable/banner"#' $M
}
icons || echo "Nao foi possivel gerar o icone"
