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

public final class DeviceActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        boolean compact = DeviceMode.isPhoneDevice(this) || ScreenFit.widthDp(this) < 600;
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
        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(dp(64), dp(64));
        logoParams.gravity = Gravity.CENTER_HORIZONTAL;
        box.addView(logo, logoParams);

        box.addView(text("ASC play", 28, Color.WHITE, true, 8));
        box.addView(text("Onde você vai assistir?", 22, Color.WHITE, true, 10));
        box.addView(text("Escolha o seu aparelho. Dá para trocar depois em Ajustes.",
                14, 0xFFA99FA3, false, 6));

        LinearLayout choices = new LinearLayout(this);
        choices.setOrientation(compact ? LinearLayout.VERTICAL : LinearLayout.HORIZONTAL);
        choices.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams choicesParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        choicesParams.topMargin = dp(18);
        box.addView(choices, choicesParams);

        TextView phone = button("Smartphone");
        TextView tv = button("Smart TV / TV Box");
        choices.addView(phone, buttonParams(compact ? 0 : dp(14), compact));
        choices.addView(tv, buttonParams(compact ? dp(10) : 0, compact));

        phone.setOnClickListener(v -> choose(DeviceMode.PHONE));
        tv.setOnClickListener(v -> choose(DeviceMode.TV));
        setContentView(scroll);
        (DeviceMode.isPhoneDevice(this) ? phone : tv).requestFocus();
    }

    private void choose(String mode) {
        DeviceMode.set(this, mode);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private TextView text(String value, int size, int color, boolean bold, int topDp) {
        TextView text = new TextView(this);
        text.setText(value);
        text.setTextSize(size);
        text.setTextColor(color);
        text.setGravity(Gravity.CENTER);
        if (bold) {
            text.setTypeface(Typeface.DEFAULT_BOLD);
        }
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.topMargin = dp(topDp);
        params.gravity = Gravity.CENTER_HORIZONTAL;
        text.setLayoutParams(params);
        return text;
    }

    private TextView button(String label) {
        TextView button = new TextView(this);
        button.setText(label);
        button.setTextSize(18);
        button.setTextColor(Color.WHITE);
        button.setTypeface(Typeface.DEFAULT_BOLD);
        button.setGravity(Gravity.CENTER);
        button.setPadding(dp(16), dp(12), dp(16), dp(12));
        button.setBackgroundResource(R.drawable.bg_button);
        button.setFocusable(true);
        button.setClickable(true);
        return button;
    }

    private LinearLayout.LayoutParams buttonParams(int topOrLeftMargin, boolean compact) {
        LinearLayout.LayoutParams params = compact
                ? new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(64))
                : new LinearLayout.LayoutParams(dp(170), dp(84));
        if (compact) {
            params.topMargin = topOrLeftMargin;
        } else {
            params.leftMargin = topOrLeftMargin;
        }
        return params;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
