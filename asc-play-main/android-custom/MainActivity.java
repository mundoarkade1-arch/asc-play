package com.ascplay.app;

import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ImmersivePlugin.class);
        registerPlugin(UpdaterPlugin.class);
        registerPlugin(SecurePlugin.class);
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams p = w.getAttributes();
            p.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            w.setAttributes(p);
        }
        int dark = 0xFF0C0A0B;
        w.getDecorView().setBackgroundColor(dark);
        w.setStatusBarColor(dark);
        w.setNavigationBarColor(dark);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, w.getDecorView());
        if (c != null) {
            c.setAppearanceLightStatusBars(false);
            c.setAppearanceLightNavigationBars(false);
        }
        if (getBridge() != null) {
            try { getBridge().setWebViewClient(new ProxyClient(getBridge())); } catch (Throwable ignored) { }
            ImmersivePlugin.installInsets(getBridge().getWebView());
            try { hardenWebView(getBridge().getWebView()); } catch (Throwable ignored) { }
        }
    }

    // Se o player estiver aberto, esconde as barras de novo ao voltar o foco
    // (depois de puxar a cortina de notificacoes, voltar de outro app, etc).
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && ImmersivePlugin.active) {
            ImmersivePlugin.apply(this, true);
        }
    }

    // WebView blindado: sem acesso a arquivos locais, sem depuracao remota, sem janelas extras
    private void hardenWebView(WebView wv) {
        if (wv == null) return;
        WebSettings st = wv.getSettings();
        st.setAllowFileAccess(false);
        st.setAllowFileAccessFromFileURLs(false);
        st.setAllowUniversalAccessFromFileURLs(false);
        st.setGeolocationEnabled(false);
        st.setSaveFormData(false);
        st.setSupportMultipleWindows(false);
        // Video ao vivo precisa tocar sozinho depois de carregar o manifesto (sem exigir novo toque)
        st.setMediaPlaybackRequiresUserGesture(false);
        st.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= 26) st.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled(false);
    }

    // Proxy de rede do app: a pagina pede http://localhost/__p?u=<endereco> e o Android busca o conteudo
    // direto (streaming, sem a ponte do plugin e sem bloqueio de CORS). Serve para lista, guia e video HLS.
    // Travas: so http/https, so GET, nunca o proprio aparelho nem a rede local.
    static class ProxyClient extends BridgeWebViewClient {
        ProxyClient(Bridge b) { super(b); }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            try {
                Uri u = request.getUrl();
                if ("localhost".equals(u.getHost()) && "/__p".equals(u.getPath()) && "GET".equalsIgnoreCase(request.getMethod())) {
                    String target = u.getQueryParameter("u");
                    String referer = u.getQueryParameter("r");
                    if (target != null) return fetch(target, referer, request.getRequestHeaders());
                }
            } catch (Throwable ignored) { }
            return super.shouldInterceptRequest(view, request);
        }

        private static String hv(Map<String, String> m, String name) {
            if (m == null) return null;
            for (Map.Entry<String, String> e : m.entrySet()) {
                if (e.getKey() != null && e.getKey().equalsIgnoreCase(name)) return e.getValue();
            }
            return null;
        }

        // Bloqueia o proprio aparelho e a rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x, IPv6 local).
        // Se o endereco nao puder ser verificado, tambem bloqueia.
        private static boolean blocked(String host) {
            try {
                if (host == null || host.isEmpty()) return true;
                InetAddress[] all = InetAddress.getAllByName(host);
                if (all == null || all.length == 0) return true;
                for (InetAddress a : all) {
                    if (a.isLoopbackAddress() || a.isAnyLocalAddress() || a.isLinkLocalAddress()
                            || a.isSiteLocalAddress() || a.isMulticastAddress()) return true;
                    byte[] b = a.getAddress();
                    if (b.length == 16 && (b[0] & 0xFE) == 0xFC) return true; // IPv6 local (fc00::/7)
                }
                return false;
            } catch (Throwable e) {
                return true;
            }
        }

        private static WebResourceResponse err(int code) {
            Map<String, String> h = new HashMap<>();
            h.put("Access-Control-Allow-Origin", "*");
            return new WebResourceResponse("text/plain", "utf-8", code, "Error", h, new ByteArrayInputStream(new byte[0]));
        }

        private static WebResourceResponse fetch(String target, String referer, Map<String, String> in) {
            HttpURLConnection c = null;
            try {
                URL url = new URL(target);
                for (int i = 0; i < 6; i++) {
                    String p = url.getProtocol();
                    if (!"http".equals(p) && !"https".equals(p)) return err(400);
                    if (blocked(url.getHost())) return err(403);
                    c = (HttpURLConnection) url.openConnection();
                    c.setInstanceFollowRedirects(false);
                    c.setConnectTimeout(15000);
                    c.setReadTimeout(30000);
                    String ua = hv(in, "User-Agent");
                    if (ua != null) c.setRequestProperty("User-Agent", ua);
                    String rg = hv(in, "Range");
                    if (rg != null) c.setRequestProperty("Range", rg);
                    String ac = hv(in, "Accept");
                    if (ac != null) c.setRequestProperty("Accept", ac);
                    String lang = hv(in, "Accept-Language");
                    if (lang != null) c.setRequestProperty("Accept-Language", lang);
                    // Alguns servidores de streaming exigem Referer. Aceita apenas um URL web válido,
                    // remove query/fragment para nunca encaminhar tokens no cabeçalho e não encaminha
                    // cookies ou Authorization automaticamente.
                    if (referer != null) {
                        try {
                            URL r = new URL(referer);
                            if (("http".equals(r.getProtocol()) || "https".equals(r.getProtocol())) && r.getHost() != null) {
                                c.setRequestProperty("Referer", new URL(r.getProtocol(), r.getHost(), r.getPort(), "/").toString());
                            }
                        } catch (Throwable ignored) { }
                    }
                    int rc = c.getResponseCode();
                    if (rc >= 300 && rc < 400 && rc != 304) {
                        String loc = c.getHeaderField("Location");
                        c.disconnect();
                        c = null;
                        if (loc == null) return err(502);
                        url = new URL(url, loc);
                        continue;
                    }
                    return build(c, rc, url.toString());
                }
                return err(508);
            } catch (Throwable e) {
                if (c != null) c.disconnect();
                return err(502);
            }
        }

        private static WebResourceResponse build(final HttpURLConnection c, int rc, String finalUrl) throws Exception {
            InputStream raw = rc >= 400 ? c.getErrorStream() : c.getInputStream();
            if (raw == null) raw = new ByteArrayInputStream(new byte[0]);
            InputStream body = new FilterInputStream(raw) {
                @Override
                public void close() throws IOException {
                    try { super.close(); } finally { c.disconnect(); }
                }
            };
            String ct = c.getContentType();
            String mime = "application/octet-stream", enc = null;
            if (ct != null) {
                String[] parts = ct.split(";");
                if (parts.length > 0 && !parts[0].trim().isEmpty()) mime = parts[0].trim();
                for (String x : parts) {
                    String t = x.trim();
                    if (t.toLowerCase().startsWith("charset=")) enc = t.substring(8);
                }
            }
            Map<String, String> h = new HashMap<>();
            h.put("Access-Control-Allow-Origin", "*");
            h.put("Cache-Control", "no-store");
            h.put("X-Final-Url", finalUrl); // endereco real depois dos redirecionamentos (o hls.js usa para montar os trechos)
            String cr = c.getHeaderField("Content-Range");
            if (cr != null) h.put("Content-Range", cr);
            String ar = c.getHeaderField("Accept-Ranges");
            if (ar != null) h.put("Accept-Ranges", ar);
            int st = (rc < 200 || rc == 204 || rc == 205 || rc == 304 || rc > 599) ? 200 : rc;
            String msg = c.getResponseMessage();
            if (msg == null || msg.isEmpty()) msg = "OK";
            return new WebResourceResponse(mime, enc, st, msg, h, body);
        }
    }
}
