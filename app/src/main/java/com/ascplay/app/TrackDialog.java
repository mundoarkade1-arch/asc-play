package com.ascplay.app;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.util.DisplayMetrics;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.media3.common.C;
import androidx.media3.common.Format;
import androidx.media3.common.TrackSelectionOverride;
import androidx.media3.common.TrackSelectionParameters;
import androidx.media3.common.Tracks;
import androidx.media3.exoplayer.ExoPlayer;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Janela "Áudio e legendas" do player (tecla das três listras em filme e episódio).
 * Lista as faixas de áudio e de legenda do vídeo que está tocando e deixa escolher uma.
 * Usa o mesmo visual da janela da programação (EpgDialog). Não usa AppCompat.
 */
public final class TrackDialog {

    private static final int COLOR_PANEL = 0xFF1A1517;
    private static final int COLOR_BORDER = 0xFF2A2326;
    private static final int COLOR_WHITE = 0xFFFFFFFF;
    private static final int COLOR_NEUTRAL = 0xFFA99FA3;
    private static final int COLOR_ON = 0xFF4ADE80;

    private TrackDialog() {
    }

    /** Uma linha da lista: o que aparece e o que fazer ao escolher. */
    private static final class Option {
        final String text;
        final boolean selected;
        final Tracks.Group group; // null = "Automático" ou "Desativadas"
        final int index;
        final boolean disable;

        Option(String text, boolean selected, Tracks.Group group, int index, boolean disable) {
            this.text = text;
            this.selected = selected;
            this.group = group;
            this.index = index;
            this.disable = disable;
        }
    }

    /** Há mais de uma faixa de áudio ou alguma legenda para escolher? */
    public static boolean hasChoices(ExoPlayer player) {
        if (player == null) {
            return false;
        }
        Tracks tracks = player.getCurrentTracks();
        int audio = 0;
        int text = 0;
        for (Tracks.Group g : tracks.getGroups()) {
            for (int i = 0; i < g.length; i++) {
                if (!g.isTrackSupported(i)) {
                    continue;
                }
                if (g.getType() == C.TRACK_TYPE_AUDIO) {
                    audio++;
                } else if (g.getType() == C.TRACK_TYPE_TEXT) {
                    text++;
                }
            }
        }
        return audio > 1 || text > 0;
    }

    /** Abre a janela. Chamar na thread principal. */
    public static void show(final Activity activity, final ExoPlayer player) {
        if (activity == null || activity.isFinishing() || activity.isDestroyed() || player == null) {
            return;
        }
        final Dialog dialog = new Dialog(activity);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(true);

        LinearLayout root = new LinearLayout(activity);
        root.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(activity, 26);
        root.setPadding(pad, pad, pad, pad);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(COLOR_PANEL);
        bg.setCornerRadius(dp(activity, 12));
        bg.setStroke(dp(activity, 2), COLOR_BORDER);
        root.setBackground(bg);

        TextView title = new TextView(activity);
        title.setText("Áudio e legendas");
        title.setTextColor(COLOR_WHITE);
        title.setTextSize(26);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        root.addView(title);

        LinearLayout list = new LinearLayout(activity);
        list.setOrientation(LinearLayout.VERTICAL);
        ScrollView scroll = new ScrollView(activity);
        scroll.addView(list, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        LinearLayout.LayoutParams scrollLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f);
        scrollLp.topMargin = dp(activity, 8);
        root.addView(scroll, scrollLp);

        Tracks tracks = player.getCurrentTracks();
        boolean subtitleOff = player.getTrackSelectionParameters()
                .disabledTrackTypes.contains(C.TRACK_TYPE_TEXT);

        List<Option> audio = collect(tracks, C.TRACK_TYPE_AUDIO, "Áudio");
        List<Option> text = collect(tracks, C.TRACK_TYPE_TEXT, "Legenda");

        Button first = null;
        if (!audio.isEmpty()) {
            addHeader(activity, list, "Áudio");
            for (Option o : audio) {
                Button b = addOption(activity, list, dialog, player, o, C.TRACK_TYPE_AUDIO);
                if (first == null || o.selected) {
                    first = b;
                }
            }
        }
        if (!text.isEmpty()) {
            addHeader(activity, list, "Legenda");
            Option off = new Option("Desativada", subtitleOff, null, -1, true);
            Button bo = addOption(activity, list, dialog, player, off, C.TRACK_TYPE_TEXT);
            if (first == null) {
                first = bo;
            }
            for (Option o : text) {
                addOption(activity, list, dialog, player, o, C.TRACK_TYPE_TEXT);
            }
        }
        if (audio.isEmpty() && text.isEmpty()) {
            TextView none = new TextView(activity);
            none.setText("Este vídeo não tem outras faixas de áudio ou legenda.");
            none.setTextColor(COLOR_NEUTRAL);
            none.setTextSize(20);
            list.addView(none);
        }

        dialog.setContentView(root);
        dialog.setOnKeyListener(new Dialog.OnKeyListener() {
            @Override
            public boolean onKey(android.content.DialogInterface d, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_MENU) {
                    if (event.getAction() == KeyEvent.ACTION_DOWN
                            && event.getRepeatCount() == 0) {
                        dialog.dismiss();
                    }
                    return true;
                }
                return false;
            }
        });
        dialog.show();

        Window window = dialog.getWindow();
        if (window != null) {
            DisplayMetrics dm = activity.getResources().getDisplayMetrics();
            window.setLayout((int) (dm.widthPixels * 0.6f),
                    (int) (dm.heightPixels * 0.85f));
            window.setBackgroundDrawable(new ColorDrawable(0x00000000));
            window.setFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL);
        }
        if (first != null) {
            first.requestFocus();
        }
    }

    private static List<Option> collect(Tracks tracks, int type, String fallbackName) {
        List<Option> out = new ArrayList<>();
        int n = 0;
        for (Tracks.Group g : tracks.getGroups()) {
            if (g.getType() != type) {
                continue;
            }
            for (int i = 0; i < g.length; i++) {
                if (!g.isTrackSupported(i)) {
                    continue;
                }
                n++;
                out.add(new Option(describe(g.getTrackFormat(i), fallbackName, n),
                        g.isTrackSelected(i), g, i, false));
            }
        }
        return out;
    }

    private static String describe(Format f, String fallbackName, int n) {
        StringBuilder sb = new StringBuilder();
        String lang = null;
        if (f.language != null && !f.language.isEmpty() && !"und".equals(f.language)) {
            try {
                lang = new Locale(f.language).getDisplayLanguage(new Locale("pt", "BR"));
            } catch (Exception e) {
                lang = f.language;
            }
        }
        if (f.label != null && !f.label.isEmpty()) {
            sb.append(f.label);
        } else if (lang != null && !lang.isEmpty()) {
            sb.append(Character.toUpperCase(lang.charAt(0))).append(lang.substring(1));
        } else {
            sb.append(fallbackName).append(' ').append(n);
        }
        if (f.channelCount > 0 && f.sampleMimeType != null && f.sampleMimeType.startsWith("audio")) {
            if (f.channelCount == 1) {
                sb.append("  (mono)");
            } else if (f.channelCount == 2) {
                sb.append("  (estéreo)");
            } else if (f.channelCount >= 6) {
                sb.append("  (5.1)");
            }
        }
        return sb.toString();
    }

    private static void addHeader(Activity a, LinearLayout list, String text) {
        TextView h = new TextView(a);
        h.setText(text);
        h.setTextColor(COLOR_NEUTRAL);
        h.setTextSize(18);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(a, 12);
        lp.bottomMargin = dp(a, 4);
        list.addView(h, lp);
    }

    private static Button addOption(final Activity a, LinearLayout list, final Dialog dialog,
                                    final ExoPlayer player, final Option o, final int type) {
        Button b = new Button(a);
        b.setAllCaps(false);
        b.setText((o.selected ? "✓  " : "     ") + o.text);
        b.setTextColor(o.selected ? COLOR_ON : COLOR_WHITE);
        b.setTextSize(20);
        b.setGravity(android.view.Gravity.START | android.view.Gravity.CENTER_VERTICAL);
        b.setBackgroundResource(R.drawable.bg_button);
        b.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                apply(player, o, type);
                dialog.dismiss();
            }
        });
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(a, 4);
        list.addView(b, lp);
        return b;
    }

    private static void apply(ExoPlayer player, Option o, int type) {
        TrackSelectionParameters.Builder b = player.getTrackSelectionParameters().buildUpon();
        if (o.disable) {
            b.setTrackTypeDisabled(type, true);
        } else if (o.group != null) {
            b.setTrackTypeDisabled(type, false);
            b.setOverrideForType(new TrackSelectionOverride(o.group.getMediaTrackGroup(), o.index));
        }
        player.setTrackSelectionParameters(b.build());
    }

    private static int dp(Activity activity, int value) {
        return Math.round(value * activity.getResources().getDisplayMetrics().density);
    }
}
