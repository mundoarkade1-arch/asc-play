package com.ascplay.app;

import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

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
        if (Build.VERSION.SDK_INT >= 26) st.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled(false);
    }
}
