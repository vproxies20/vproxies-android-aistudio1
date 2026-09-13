package io.nekohasekai.sfa.vproxies

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Small local event journal. Never records profiles, tokens or proxy credentials. */
object VProxiesDiagnostics {
    private const val PREFS = "vproxies_startup_diagnostics"

    @Synchronized
    fun record(context: Context, phase: String, message: String, error: Boolean = false) {
        runCatching {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val old = JSONArray(prefs.getString("events", "[]"))
            val events = JSONArray()
            for (i in maxOf(0, old.length() - 59) until old.length()) events.put(old.getJSONObject(i))
            val sequence = prefs.getLong("sequence", 0) + 1
            val safe = message.lineSequence().map { line ->
                if (Regex("(?i)(password|passwd|authorization|bearer|token|secret|username)\\s*[:=\\\"]").containsMatchIn(line))
                    "[credential-bearing error detail omitted]"
                else line.replace(Regex("(https?|socks[45]?)://[^\\s/@]+:[^\\s/@]+@"), "$1://[redacted]@")
            }.joinToString("\n").take(1200)
            events.put(JSONObject().put("id", "service-$sequence").put("timestamp", System.currentTimeMillis())
                .put("level", if (error) "ERROR" else "INFO").put("tag", phase).put("message", safe))
            prefs.edit().putString("events", events.toString()).putLong("sequence", sequence).commit()
        }
    }

    @Synchronized
    fun events(context: Context): JSONArray = runCatching {
        JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("events", "[]"))
    }.getOrElse { JSONArray() }

    fun latestError(context: Context, since: Long): String? {
        if (since == 0L) return null
        val entries = events(context)
        for (i in entries.length() - 1 downTo 0) {
            val entry = entries.getJSONObject(i)
            if (entry.optLong("timestamp") >= since && entry.optString("level") == "ERROR")
                return "${entry.optString("tag")}: ${entry.optString("message")}"
        }
        return null
    }
}
