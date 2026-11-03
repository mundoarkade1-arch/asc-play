package com.ascplay.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * Primeira tela do app: "Onde você vai assistir?". Escolhe entre Smartphone e Smart TV / TV Box.
 * Feita só em código (sem arquivo de layout). Funciona com toque e com controle remoto.
 */
public class DeviceActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundResource(R.drawable.bg_gradient);
        scroll.setFillViewport(true);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(24), dp(16), dp(24), dp(16));
        scroll.addView(box, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.brand_icon);
        logo.setAdjustViewBounds(true);
        LinearLayout.LayoutParams logoLp = new LinearLayout.LayoutParams(dp(64), dp(64));
        logoLp.gravity = Gravity.CENTER_HORIZONTAL;
        box.addView(logo, logoLp);

        box.addView(text("ASC play", 28, Color.WHITE, true, 8));
        box.addView(text("Onde você vai assistir?", 22, Color.WHITE, true, 10));
        box.addView(text("Escolha o seu aparelho. Dá para trocar depois em Ajustes.",
                14, 0xFFA99FA3, false, 6));

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rowLp.topMargin = dp(18);
        box.addView(row, rowLp);

        final TextView phone = button("Smartphone");
        final TextView tv = button("Smart TV / TV Box");
        row.addView(phone, buttonParams(0));
        row.addView(tv, buttonParams(dp(14)));

        phone.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                choose(DeviceMode.PHONE);
            }
        });
        tv.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                choose(DeviceMode.TV);
            }
        });

        setContentView(scroll);

        // Quem já tinha escolhido antes começa no botão que estava marcado
        if (DeviceMode.isPhone(this)) {
            phone.requestFocus();
        } else {
            tv.requestFocus();
        }
    }

    private void choose(String mode) {
        DeviceMode.set(this, mode);
        // Abre o login; se já existe login salvo, ele segue sozinho para a página inicial
        Intent i = new Intent(this, LoginActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(i);
        finish();
    }

    private TextView text(String s, int sp, int color, boolean bold, int topDp) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        if (bold) {
            t.setTypeface(Typeface.DEFAULT_BOLD);
        }
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(topDp);
        lp.gravity = Gravity.CENTER_HORIZONTAL;
        t.setLayoutParams(lp);
        return t;
    }

    private TextView button(String label) {
        TextView b = new TextView(this);
        b.setText(label);
        b.setTextSize(18);
        b.setTextColor(Color.WHITE);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setGravity(Gravity.CENTER);
        b.setPadding(dp(16), dp(12), dp(16), dp(12));
        b.setBackgroundResource(R.drawable.bg_button);
        b.setFocusable(true);
        b.setClickable(true);
        return b;
    }

    private LinearLayout.LayoutParams buttonParams(int leftMargin) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(170), dp(84));
        lp.leftMargin = leftMargin;
        return lp;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
