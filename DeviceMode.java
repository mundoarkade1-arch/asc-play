package com.ascplay.app;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Guarda em qual aparelho a pessoa vai assistir: celular ou TV (Smart TV / TV Box).
 * A escolha é feita na primeira vez que o app abre (DeviceActivity) e pode ser trocada em Ajustes.
 */
final class DeviceMode {

    static final String PHONE = "ph";
    static final String TV = "tv";

    private static final String PREFS = "asc_device";
    private static final String KEY = "mode";

    private DeviceMode() {
    }

    /** "ph", "tv" ou null se a pessoa ainda não escolheu. */
    static String get(Context context) {
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return sp.getString(KEY, null);
    }

    static boolean isChosen(Context context) {
        return get(context) != null;
    }

    static boolean isPhone(Context context) {
        return PHONE.equals(get(context));
    }

    static void set(Context context, String mode) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY, mode).apply();
    }

    /** Nome para mostrar na tela. */
    static String label(Context context) {
        String m = get(context);
        if (PHONE.equals(m)) {
            return "Smartphone";
        }
        if (TV.equals(m)) {
            return "Smart TV / TV Box";
        }
        return "Não escolhido";
    }
}
