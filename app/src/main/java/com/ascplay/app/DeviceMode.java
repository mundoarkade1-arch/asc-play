package com.ascplay.app;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

final class DeviceMode {

    static final String PHONE = "ph";
    static final String TV = "tv";

    private static final String PREFS = "asc_device";
    private static final String KEY = "mode";

    private DeviceMode() {
    }

    static String get(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
    }

    static boolean isChosen(Context context) {
        return PHONE.equals(get(context)) || TV.equals(get(context));
    }

    static boolean isPhone(Context context) {
        return PHONE.equals(get(context));
    }

    static boolean isPhoneDevice(Context context) {
        String mode = get(context);
        if (PHONE.equals(mode)) {
            return true;
        }
        if (TV.equals(mode)) {
            return false;
        }
        return context.getPackageManager().hasSystemFeature(
                android.content.pm.PackageManager.FEATURE_TOUCHSCREEN)
                && !context.getPackageManager().hasSystemFeature(
                android.content.pm.PackageManager.FEATURE_LEANBACK);
    }

    static void set(Context context, String mode) {
        if (!PHONE.equals(mode) && !TV.equals(mode)) {
            throw new IllegalArgumentException("Invalid device mode");
        }
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY, mode).apply();
    }

    static String label(Context context) {
        if (isPhone(context)) {
            return "Smartphone";
        }
        return TV.equals(get(context)) ? "Smart TV / TV Box" : "Não escolhido";
    }

    static void configureNavigation(Activity activity) {
        if (!isPhone(activity)) {
            return;
        }
        View nav = activity.findViewById(R.id.group_nav);
        if (!(nav instanceof ScrollView) || !(nav.getParent() instanceof LinearLayout)) {
            return;
        }
        LinearLayout root = (LinearLayout) nav.getParent();
        if (root.getOrientation() != LinearLayout.HORIZONTAL) {
            return;
        }

        root.removeView(nav);
        root.setOrientation(LinearLayout.VERTICAL);
        View content = root.getChildAt(0);
        if (content != null) {
            LinearLayout.LayoutParams contentParams =
                    (LinearLayout.LayoutParams) content.getLayoutParams();
            contentParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
            contentParams.height = 0;
            contentParams.weight = 1;
            content.setLayoutParams(contentParams);
        }

        ScrollView scroll = (ScrollView) nav;
        scroll.setFillViewport(true);
        scroll.setVerticalScrollBarEnabled(false);
        View child = scroll.getChildAt(0);
        if (child instanceof LinearLayout) {
            LinearLayout menu = (LinearLayout) child;
            menu.setOrientation(LinearLayout.HORIZONTAL);
            menu.setGravity(Gravity.CENTER_VERTICAL);
            menu.setPadding(0, 0, 0, 0);
            ViewGroup.LayoutParams menuParams = menu.getLayoutParams();
            menuParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
            menuParams.height = ViewGroup.LayoutParams.MATCH_PARENT;
            menu.setLayoutParams(menuParams);
            String[] labels = {"Início", "Canais", "Filmes", "Séries", "Ajustes", "Atualizar"};
            for (int i = 0; i < menu.getChildCount(); i++) {
                View item = menu.getChildAt(i);
                if (!(item instanceof TextView)) {
                    continue;
                }
                LinearLayout.LayoutParams itemParams =
                        (LinearLayout.LayoutParams) item.getLayoutParams();
                itemParams.width = 0;
                itemParams.height = ViewGroup.LayoutParams.MATCH_PARENT;
                itemParams.weight = 1;
                itemParams.setMargins(0, 0, 0, 0);
                item.setLayoutParams(itemParams);
                TextView button = (TextView) item;
                button.setText(labels[i]);
                button.setTextSize(8);
                button.setGravity(Gravity.CENTER);
                button.setPadding(1, 2, 1, 2);
                button.setCompoundDrawablePadding(1);
            }
        }
        LinearLayout.LayoutParams navParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(activity, 62));
        root.addView(nav, navParams);
    }

    static void configurePhoneBrowse(Activity activity) {
        if (!isPhone(activity)) {
            return;
        }
        View categories = activity.findViewById(R.id.group_categories);
        if (!(categories instanceof LinearLayout)
                || !(categories.getParent() instanceof LinearLayout)) {
            return;
        }
        LinearLayout panel = (LinearLayout) categories.getParent();
        if (panel.getOrientation() != LinearLayout.HORIZONTAL) {
            return;
        }
        View gridContainer = null;
        for (int i = 0; i < panel.getChildCount(); i++) {
            View child = panel.getChildAt(i);
            if (child != categories) {
                gridContainer = child;
                break;
            }
        }
        if (gridContainer == null) {
            return;
        }
        panel.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams categoriesParams =
                (LinearLayout.LayoutParams) categories.getLayoutParams();
        LinearLayout.LayoutParams gridParams =
                (LinearLayout.LayoutParams) gridContainer.getLayoutParams();

        View categoryList = activity.findViewById(R.id.lv_categories);
        if (categoryList == null || categoryList.getVisibility() == View.GONE) {
            categories.setVisibility(View.GONE);
            gridParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
            gridParams.height = 0;
            gridParams.weight = 1;
            gridParams.setMargins(0, 0, 0, 0);
        } else {
            categoriesParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
            categoriesParams.height = 0;
            categoriesParams.weight = 0.38f;
            gridParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
            gridParams.height = 0;
            gridParams.weight = 0.62f;
            gridParams.setMargins(0, dp(activity, 8), 0, 0);
            View categoryListView = activity.findViewById(R.id.lv_categories);
            if (categoryListView != null) {
                ViewGroup.LayoutParams listParams = categoryListView.getLayoutParams();
                listParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
                categoryListView.setLayoutParams(listParams);
            }
        }
        categories.setLayoutParams(categoriesParams);
        gridContainer.setLayoutParams(gridParams);

    }

    static void configurePhoneSettings(Activity activity) {
        if (!isPhone(activity)) {
            return;
        }
        View list = activity.findViewById(R.id.lv_settings);
        if (list == null || !(list.getParent() instanceof LinearLayout)) {
            return;
        }
        LinearLayout panel = (LinearLayout) list.getParent();
        panel.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams listParams =
                (LinearLayout.LayoutParams) list.getLayoutParams();
        listParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
        listParams.height = 0;
        listParams.weight = 0.58f;
        list.setLayoutParams(listParams);

        View detail = activity.findViewById(R.id.tv_detail);
        if (detail != null) {
            LinearLayout.LayoutParams detailParams =
                    (LinearLayout.LayoutParams) detail.getLayoutParams();
            detailParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
            detailParams.height = 0;
            detailParams.weight = 0.42f;
            detailParams.setMargins(0, dp(activity, 8), 0, 0);
            detail.setLayoutParams(detailParams);
        }
    }

    static void configurePhoneMovie(Activity activity) {
        if (!isPhone(activity)) {
            return;
        }
        View cover = activity.findViewById(R.id.iv_cover);
        if (cover == null || !(cover.getParent() instanceof LinearLayout)) {
            return;
        }
        LinearLayout root = (LinearLayout) cover.getParent();
        root.setOrientation(LinearLayout.VERTICAL);

        LinearLayout.LayoutParams coverParams =
                (LinearLayout.LayoutParams) cover.getLayoutParams();
        coverParams.width = dp(activity, 104);
        coverParams.height = dp(activity, 150);
        cover.setLayoutParams(coverParams);

        if (root.getChildCount() > 1 && root.getChildAt(1) instanceof LinearLayout) {
            View details = root.getChildAt(1);
            LinearLayout.LayoutParams detailsParams =
                    (LinearLayout.LayoutParams) details.getLayoutParams();
            detailsParams.width = ViewGroup.LayoutParams.MATCH_PARENT;
            detailsParams.height = 0;
            detailsParams.weight = 1;
            detailsParams.setMargins(0, dp(activity, 8), 0, 0);
            details.setLayoutParams(detailsParams);
        }
    }

    private static int dp(Context context, int value) {
        return Math.round(value * context.getResources().getDisplayMetrics().density);
    }

}
