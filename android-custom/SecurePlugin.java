package com.ascplay.app;

import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import android.os.Debug;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedReader;
import java.io.FileReader;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Set;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

// Camadas nativas de seguranca:
//  - wrap/unwrap: protege a chave do cofre do app com uma chave que nunca sai do Android Keystore
//  - screen: bloqueia captura de tela nas telas de login/listas e esconde o app nos "recentes"
//  - check: detecta depurador, Frida/Xposed e APK reassinado (se EXPECTED_CERT estiver preenchido)
@CapacitorPlugin(name = "Secure")
public class SecurePlugin extends Plugin {
    private static final String ALIAS = "asc_kek";
    // SHA-256 (hex, sem ":") do certificado com que voce assina o APK de producao.
    // Vazio = nao verifica. Preencha SOMENTE depois de criar a keystore de producao.
    private static final String EXPECTED_CERT = "";

    private SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (!ks.containsAlias(ALIAS)) {
            KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                    .build());
            g.generateKey();
        }
        return (SecretKey) ks.getKey(ALIAS, null);
    }

    @PluginMethod
    public void wrap(PluginCall call) {
        try {
            String d = call.getString("data");
            if (d == null) { call.reject("data"); return; }
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, key());
            byte[] iv = c.getIV();
            byte[] ct = c.doFinal(Base64.decode(d, Base64.NO_WRAP));
            byte[] o = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, o, 0, iv.length);
            System.arraycopy(ct, 0, o, iv.length, ct.length);
            JSObject r = new JSObject();
            r.put("data", Base64.encodeToString(o, Base64.NO_WRAP));
            call.resolve(r);
        } catch (Throwable e) {
            call.reject("wrap");
        }
    }

    @PluginMethod
    public void unwrap(PluginCall call) {
        try {
            String d = call.getString("data");
            if (d == null) { call.reject("data"); return; }
            byte[] all = Base64.decode(d, Base64.NO_WRAP);
            if (all.length < 29) { call.reject("data"); return; }
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, all, 0, 12));
            byte[] pt = c.doFinal(all, 12, all.length - 12);
            JSObject r = new JSObject();
            r.put("data", Base64.encodeToString(pt, Base64.NO_WRAP));
            call.resolve(r);
        } catch (Throwable e) {
            call.reject("unwrap");
        }
    }

    @PluginMethod
    public void reset(PluginCall call) {
        try {
            KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
            ks.load(null);
            if (ks.containsAlias(ALIAS)) ks.deleteEntry(ALIAS);
        } catch (Exception ignored) { }
        call.resolve();
    }

    @PluginMethod
    public void screen(final PluginCall call) {
        final boolean sec = Boolean.TRUE.equals(call.getBoolean("secure", false));
        final boolean hide = Boolean.TRUE.equals(call.getBoolean("hideRecents", false));
        getActivity().runOnUiThread(() -> {
            Activity a = getActivity();
            if (sec) a.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
            else a.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
            if (Build.VERSION.SDK_INT >= 33) a.setRecentsScreenshotEnabled(!hide);
            call.resolve();
        });
    }

    @SuppressWarnings("deprecation")
    static int sigFlags() {
        return Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
    }

    // SHA-256 dos certificados que assinam o APK (instalado ou arquivo baixado)
    @SuppressWarnings("deprecation")
    static Set<String> certs(PackageInfo pi) {
        Set<String> out = new HashSet<>();
        try {
            Signature[] sg = null;
            if (Build.VERSION.SDK_INT >= 28) {
                if (pi.signingInfo != null) sg = pi.signingInfo.getApkContentsSigners();
            } else {
                sg = pi.signatures;
            }
            if (sg == null) return out;
            for (Signature s : sg) {
                byte[] h = MessageDigest.getInstance("SHA-256").digest(s.toByteArray());
                StringBuilder b = new StringBuilder();
                for (byte x : h) b.append(String.format("%02X", x));
                out.add(b.toString());
            }
        } catch (Exception ignored) { }
        return out;
    }

    private boolean hooked() {
        try { Class.forName("de.robv.android.xposed.XposedBridge"); return true; } catch (Throwable ignored) { }
        try (BufferedReader r = new BufferedReader(new FileReader("/proc/self/maps"))) {
            String l;
            while ((l = r.readLine()) != null) {
                String s = l.toLowerCase();
                if (s.contains("frida") || s.contains("gum-js-loop") || s.contains("xposed")) return true;
            }
        } catch (Exception ignored) { }
        try (Socket s = new Socket()) {
            s.connect(new InetSocketAddress("127.0.0.1", 27042), 150);
            return true;
        } catch (Exception ignored) { }
        return false;
    }

    @PluginMethod
    public void check(final PluginCall call) {
        new Thread(() -> {
            JSObject r = new JSObject();
            boolean dbg = false, hk = false, sigOk = true;
            try {
                boolean debuggable = (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
                dbg = !debuggable && (Debug.isDebuggerConnected() || Debug.waitingForDebugger());
            } catch (Throwable ignored) { }
            try {
                if (!EXPECTED_CERT.isEmpty()) {
                    PackageInfo pi = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), sigFlags());
                    sigOk = certs(pi).contains(EXPECTED_CERT.replace(":", "").toUpperCase());
                }
            } catch (Throwable e) { sigOk = false; }
            try { hk = hooked(); } catch (Throwable ignored) { }
            try {
                r.put("debugger", dbg);
                r.put("hook", hk);
                r.put("sig", sigOk);
                call.resolve(r);
            } catch (Throwable e) {
                call.resolve();
            }
        }).start();
    }
}
