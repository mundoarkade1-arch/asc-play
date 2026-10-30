package com.ascplay.app;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.PackageManager;

import android.content.pm.ActivityInfo;
import android.os.Build;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Immersive")
public class ImmersivePlugin extends Plugin {
    static volatile boolean active = false;

    // Controla as margens do WebView. Com o player aberto (active) a margem e zero:
    // o video ocupa a tela toda, inclusive embaixo da barra de status e do recorte da camera.
    // Fora do player, as margens voltam a respeitar as barras do sistema.
    static void installInsets(final WebView wv) {
        if (wv == null) return;
        ViewCompat.setOnApplyWindowInsetsListener(wv, (v, insets) -> {
            int l = 0, t = 0, r = 0, b = 0;
            Insets cut = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            if (!active) {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
                l = bars.left;
                t = bars.top;
                r = bars.right;
                b = bars.bottom;
                if (insets.isVisible(WindowInsetsCompat.Type.ime())) {
                    b = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
                }
            }
            ViewGroup.LayoutParams lp = v.getLayoutParams();
            if (lp instanceof ViewGroup.MarginLayoutParams) {
                ViewGroup.MarginLayoutParams m = (ViewGroup.MarginLayoutParams) lp;
                if (m.leftMargin != l || m.topMargin != t || m.rightMargin != r || m.bottomMargin != b) {
                    m.leftMargin = l;
                    m.topMargin = t;
                    m.rightMargin = r;
                    m.bottomMargin = b;
                    v.setLayoutParams(m);
                }
            }
            // Avisa a pagina do tamanho do recorte, para os botoes do player nao ficarem embaixo da camera
            float d = v.getResources().getDisplayMetrics().density;
            int cl = active ? Math.round(cut.left / d) : 0;
            int ct = active ? Math.round(cut.top / d) : 0;
            int cr = active ? Math.round(cut.right / d) : 0;
            int cb = active ? Math.round(cut.bottom / d) : 0;
            String js = "var s=document.documentElement.style;"
                    + "s.setProperty('--cl','" + cl + "px');"
                    + "s.setProperty('--ct','" + ct + "px');"
                    + "s.setProperty('--cr','" + cr + "px');"
                    + "s.setProperty('--cb','" + cb + "px');";
            wv.evaluateJavascript(js, null);
            return WindowInsetsCompat.CONSUMED;
        });
    }

    // Esconde (on=true) ou mostra (on=false) a barra de status e a de botoes.
    static void apply(Activity a, boolean on) {
        Window w = a.getWindow();
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams p = w.getAttributes();
            p.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            w.setAttributes(p);
        }
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, w.getDecorView());
        if (on) {
            w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            if (c != null) {
                c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                c.hide(WindowInsetsCompat.Type.systemBars());
            }
        } else {
            w.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            if (c != null) {
                c.show(WindowInsetsCompat.Type.systemBars());
            }
        }
    }

    @PluginMethod
    public void set(final PluginCall call) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        active = on;
        getActivity().runOnUiThread(() -> {
            WebView wv = getBridge().getWebView();
            installInsets(wv);
            apply(getActivity(), on);
            if (wv != null) {
                ViewCompat.requestApplyInsets(wv);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void orientation(final PluginCall call) {
        final String mode = call.getString("mode", "auto");
        getActivity().runOnUiThread(() -> {
            int o = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
            if ("landscape".equals(mode)) {
                o = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
            } else if ("portrait".equals(mode)) {
                o = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
            }
            getActivity().setRequestedOrientation(o);
            call.resolve();
        });
    }

    @PluginMethod
    public void deviceInfo(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Activity a = getActivity();
            PackageManager pm = a.getPackageManager();
            ActivityManager am = (ActivityManager) a.getSystemService(Context.ACTIVITY_SERVICE);
            
            boolean isTv = false;
            UiModeManager uiModeManager = (UiModeManager) a.getSystemService(Context.UI_MODE_SERVICE);
            if (uiModeManager != null) {
                if (uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
                    isTv = true;
                }
            }
            if (!isTv) {
                isTv = pm.hasSystemFeature(PackageManager.FEATURE_LEANBACK) || 
                       pm.hasSystemFeature("android.hardware.type.television");
            }
            
            boolean hasTouch = pm.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN);
            
            boolean lowRam = false;
            if (am != null) {
                if (Build.VERSION.SDK_INT >= 19) {
                    lowRam = am.isLowRamDevice();
                }
                if (!lowRam && Build.VERSION.SDK_INT >= 16) {
                    ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
                    am.getMemoryInfo(mi);
                    lowRam = mi.totalMem <= 2L * 1024 * 1024 * 1024; // 2 GB
                }
            }
            
            android.util.DisplayMetrics dm = a.getResources().getDisplayMetrics();
            int w = dm.widthPixels;
            int h = dm.heightPixels;
            float dpr = dm.density;
            
            call.resolve(new com.getcapacitor.JSObject()
                .put("tv", isTv)
                .put("touch", hasTouch)
                .put("lowRam", lowRam)
                .put("w", w)
                .put("h", h)
                .put("dpr", dpr)
                .put("sdk", Build.VERSION.SDK_INT));
        });
    }
}
