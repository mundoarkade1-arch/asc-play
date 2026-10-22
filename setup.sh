set -e
M=android/app/src/main/AndroidManifest.xml
R=android/app/src/main/res
sed -i 's#<application#<uses-feature android:name="android.software.leanback" android:required="false"/><uses-feature android:name="android.hardware.touchscreen" android:required="false"/><application android:usesCleartextTraffic="true"#' $M
sed -i 's#<category android:name="android.intent.category.LAUNCHER" />#&<category android:name="android.intent.category.LEANBACK_LAUNCHER" />#' $M
cp MainActivity.java ImmersivePlugin.java android/app/src/main/java/com/ascplay/app/
[ -f debug.keystore ] && { mkdir -p ~/.android; cp debug.keystore ~/.android/debug.keystore; } || true

im() { if command -v magick >/dev/null 2>&1; then magick "$@"; else convert "$@"; fi; }
icons() {
  rm -rf $R/mipmap-anydpi-v26
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
