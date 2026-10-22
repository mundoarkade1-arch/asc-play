set -e
M=android/app/src/main/AndroidManifest.xml
sed -i 's#<application#<uses-feature android:name="android.software.leanback" android:required="false"/><uses-feature android:name="android.hardware.touchscreen" android:required="false"/><application android:usesCleartextTraffic="true"#' $M
sed -i 's#<category android:name="android.intent.category.LAUNCHER" />#&<category android:name="android.intent.category.LEANBACK_LAUNCHER" />#' $M
cp MainActivity.java ImmersivePlugin.java android/app/src/main/java/com/ascplay/app/
mkdir -p ~/.android && cp debug.keystore ~/.android/debug.keystore
