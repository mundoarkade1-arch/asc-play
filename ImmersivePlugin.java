package com.ascplay.app;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.view.Window;
import android.view.WindowManager;
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
            apply(getActivity(), on);
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
}
