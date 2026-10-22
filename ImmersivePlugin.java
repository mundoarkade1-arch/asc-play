package com.ascplay.app;

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
    @PluginMethod
    public void set(final PluginCall call) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        getActivity().runOnUiThread(() -> {
            Window w = getActivity().getWindow();
            if (Build.VERSION.SDK_INT >= 28) {
                WindowManager.LayoutParams p = w.getAttributes();
                p.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                w.setAttributes(p);
            }
            WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, w.getDecorView());
            if (c != null) {
                if (on) {
                    c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    c.hide(WindowInsetsCompat.Type.systemBars());
                } else {
                    c.show(WindowInsetsCompat.Type.systemBars());
                }
            }
            call.resolve();
        });
    }
}
