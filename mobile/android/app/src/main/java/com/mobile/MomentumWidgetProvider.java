package com.mobile;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class MomentumWidgetProvider extends AppWidgetProvider {
    public static final String PREFS_NAME = "MomentumWidgetPrefs";
    public static final String PREF_QUOTE = "widget_quote";
    public static final String PREF_AUTHOR = "widget_author";
    public static final String PREF_STREAK = "widget_streak";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String quote = prefs.getString(PREF_QUOTE, "Discipline equals freedom.");
        String author = prefs.getString(PREF_AUTHOR, "Jocko Willink");
        int streak = prefs.getInt(PREF_STREAK, 1);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.momentum_widget_layout);
        views.setTextViewText(R.id.widget_quote_text, "\"" + quote + "\"");
        views.setTextViewText(R.id.widget_author_text, "— " + author);
        views.setTextViewText(R.id.widget_streak_text, "🔥 " + streak + " Day Streak");

        // Intent to launch MainActivity when widget is clicked
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context, String quote, String author, int streak) {
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit();
        if (quote != null && !quote.isEmpty()) {
            editor.putString(PREF_QUOTE, quote);
        }
        if (author != null && !author.isEmpty()) {
            editor.putString(PREF_AUTHOR, author);
        }
        if (streak >= 0) {
            editor.putInt(PREF_STREAK, streak);
        }
        editor.apply();

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, MomentumWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}
