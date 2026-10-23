package com.ascplay.app;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Set;

// Atualizacao do proprio app, com varias travas:
//  1) so baixa por HTTPS de hosts do GitHub (cada redirecionamento e conferido);
//  2) limite de tamanho; confere SHA-256 quando o version.json informa;
//  3) antes de abrir o instalador, confere que o APK e deste mesmo app, tem versao maior
//     e esta assinado com o MESMO certificado do app instalado.
// Se qualquer conferencia falhar, o arquivo e apagado e nada e instalado.
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {
    private static final String[] HOSTS = {
            "github.com", "objects.githubusercontent.com",
            "release-assets.githubusercontent.com", "github-releases.githubusercontent.com"};
    private static final long MAX_BYTES = 400L * 1024 * 1024;

    private static boolean allowed(URL u) {
        if (!"https".equals(u.getProtocol())) return false;
        String h = u.getHost() == null ? "" : u.getHost().toLowerCase();
        for (String x : HOSTS) if (h.equals(x)) return true;
        return false;
    }

    private static HttpURLConnection open(String url) throws Exception {
        URL u = new URL(url);
        for (int i = 0; i < 6; i++) {
            if (!allowed(u)) return null;
            HttpURLConnection c = (HttpURLConnection) u.openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            int rc = c.getResponseCode();
            if (rc >= 300 && rc < 400) {
                String loc = c.getHeaderField("Location");
                c.disconnect();
                if (loc == null) return null;
                u = new URL(u, loc);
                continue;
            }
            if (rc == 200) return c;
            c.disconnect();
            return null;
        }
        return null;
    }

    @PluginMethod
    public void info(PluginCall call) {
        try {
            PackageInfo pi = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
            JSObject r = new JSObject();
            r.put("code", code);
            r.put("name", pi.versionName == null ? "" : pi.versionName);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("info");
        }
    }

    private static long vcode(PackageInfo p) {
        return Build.VERSION.SDK_INT >= 28 ? p.getLongVersionCode() : p.versionCode;
    }

    private static String hex(byte[] b) {
        StringBuilder s = new StringBuilder();
        for (byte x : b) s.append(String.format("%02x", x));
        return s.toString();
    }

    @PluginMethod
    public void install(final PluginCall call) {
        final String url = call.getString("url");
        final String want = call.getString("sha256", "");
        if (url == null || url.isEmpty()) {
            call.reject("url");
            return;
        }
        // Android 8+: o app precisa ter a permissao "instalar apps desta fonte"
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            JSObject r = new JSObject();
            r.put("needPermission", true);
            call.resolve(r);
            return;
        }
        new Thread(() -> {
            HttpURLConnection c = null;
            File f = null;
            try {
                File dir = new File(getContext().getCacheDir(), "upd");
                dir.mkdirs();
                f = new File(dir, "ASC-play.apk");
                if (f.exists()) f.delete();
                c = open(url);
                if (c == null) { call.reject("origem"); return; }
                long total = c.getContentLengthLong();
                if (total > MAX_BYTES) { call.reject("tamanho"); return; }
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                try (InputStream in = c.getInputStream(); FileOutputStream out = new FileOutputStream(f)) {
                    byte[] buf = new byte[32768];
                    int n;
                    long done = 0;
                    int last = -1;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n);
                        md.update(buf, 0, n);
                        done += n;
                        if (done > MAX_BYTES) throw new Exception("tamanho");
                        if (total > 0) {
                            int p = (int) (done * 100 / total);
                            if (p != last) {
                                last = p;
                                JSObject e = new JSObject();
                                e.put("percent", p);
                                notifyListeners("progress", e);
                            }
                        }
                    }
                }
                if (want != null && !want.isEmpty() && !hex(md.digest()).equalsIgnoreCase(want.trim())) {
                    f.delete();
                    call.reject("hash");
                    return;
                }
                PackageManager pm = getContext().getPackageManager();
                String pkg = getContext().getPackageName();
                PackageInfo mine = pm.getPackageInfo(pkg, SecurePlugin.sigFlags());
                PackageInfo apk = pm.getPackageArchiveInfo(f.getAbsolutePath(), SecurePlugin.sigFlags());
                if (apk == null || !pkg.equals(apk.packageName)) { f.delete(); call.reject("pacote"); return; }
                if (vcode(apk) <= vcode(mine)) { f.delete(); call.reject("versao"); return; }
                Set<String> a = SecurePlugin.certs(apk), m = SecurePlugin.certs(mine);
                if (a.isEmpty() || !a.equals(m)) { f.delete(); call.reject("assinatura"); return; }

                Uri uri = FileProvider.getUriForFile(getContext(), pkg + ".fileprovider", f);
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(uri, "application/vnd.android.package-archive");
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                JSObject r = new JSObject();
                r.put("ok", true);
                call.resolve(r);
            } catch (Exception e) {
                if (f != null) f.delete();
                call.reject("download");
            } finally {
                if (c != null) c.disconnect();
            }
        }).start();
    }
}
