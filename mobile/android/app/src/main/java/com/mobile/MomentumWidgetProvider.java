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
    public static final String PREF_LAST_ROTATION_TIME = "widget_last_rotation_time";
    public static final String PREF_QUOTE_INDEX = "widget_quote_index";

    public static final String ACTION_CYCLE_WIDGET_QUOTE = "com.mobile.ACTION_CYCLE_WIDGET_QUOTE";
    private static final long ROTATION_INTERVAL_MS = 3 * 60 * 60 * 1000L; // Auto-cycle every 3 hours

    // Curated timeless stoic, discipline, and high-performance quotes
    private static final String[][] ROTATION_QUOTES = {
        {"Discipline equals freedom.", "Jocko Willink"},
        {"We suffer more often in imagination than in reality.", "Seneca"},
        {"Waste no more time arguing about what a good man should be. Be one.", "Marcus Aurelius"},
        {"Don't count the days, make the days count.", "Muhammad Ali"},
        {"First say to yourself what you would be; and then do what you have to do.", "Epictetus"},
        {"You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear"},
        {"The impediment to action advances action. What stands in the way becomes the way.", "Marcus Aurelius"},
        {"He who has a why to live can bear almost any how.", "Friedrich Nietzsche"},
        {"It is not that we have a short time to live, but that we waste a lot of it.", "Seneca"},
        {"Action expresses priorities.", "Mahatma Gandhi"},
        {"Focus is a muscle. The more you protect it, the sharper it becomes.", "Momentum Flow"},
        {"Small disciplines repeated with consistency every day lead to great achievements.", "John C. Maxwell"},
        {"Simplicity is the prerequisite for reliability.", "Edsger Dijkstra"},
        {"The man who moves a mountain begins by carrying away small stones.", "Confucius"},
        {"No citizen has a right to be an amateur in the matter of physical and mental training.", "Socrates"},
        {"Victory is reserved for those who are willing to pay its price.", "Sun Tzu"}
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent == null || intent.getAction() == null) return;

        if (ACTION_CYCLE_WIDGET_QUOTE.equals(intent.getAction())) {
            rotateToNextQuote(context);
        } else if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            long lastTime = prefs.getLong(PREF_LAST_ROTATION_TIME, 0);
            if (System.currentTimeMillis() - lastTime >= ROTATION_INTERVAL_MS) {
                rotateToNextQuote(context);
            }
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long lastTime = prefs.getLong(PREF_LAST_ROTATION_TIME, 0);
        if (System.currentTimeMillis() - lastTime >= ROTATION_INTERVAL_MS) {
            rotateToNextQuote(context);
            return;
        }

        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void rotateToNextQuote(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int currentIndex = prefs.getInt(PREF_QUOTE_INDEX, 0);
        int nextIndex = (currentIndex + 1) % ROTATION_QUOTES.length;
        int streak = prefs.getInt(PREF_STREAK, 1);

        String[] quotePair = ROTATION_QUOTES[nextIndex];
        SharedPreferences.Editor editor = prefs.edit();
        editor.putInt(PREF_QUOTE_INDEX, nextIndex);
        editor.putString(PREF_QUOTE, quotePair[0]);
        editor.putString(PREF_AUTHOR, quotePair[1]);
        editor.putLong(PREF_LAST_ROTATION_TIME, System.currentTimeMillis());
        editor.apply();

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, MomentumWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String quote = prefs.getString(PREF_QUOTE, ROTATION_QUOTES[0][0]);
        String author = prefs.getString(PREF_AUTHOR, ROTATION_QUOTES[0][1]);
        int streak = prefs.getInt(PREF_STREAK, 1);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.momentum_widget_layout);
        views.setTextViewText(R.id.widget_quote_text, "\"" + quote + "\"");
        views.setTextViewText(R.id.widget_author_text, "— " + author);
        views.setTextViewText(R.id.widget_streak_text, "🔥 " + streak + " Day Streak");

        // Intent to launch MainActivity when widget body / header is clicked
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        // Intent to cycle quote when the quote text itself is tapped
        Intent cycleIntent = new Intent(context, MomentumWidgetProvider.class);
        cycleIntent.setAction(ACTION_CYCLE_WIDGET_QUOTE);
        PendingIntent cyclePending = PendingIntent.getBroadcast(
            context,
            701,
            cycleIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_quote_text, cyclePending);

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
        editor.putLong(PREF_LAST_ROTATION_TIME, System.currentTimeMillis());
        editor.apply();

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, MomentumWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}
