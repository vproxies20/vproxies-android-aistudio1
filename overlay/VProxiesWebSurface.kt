package io.nekohasekai.sfa.vproxies

import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.json.JSONObject

/** Only bundled, same-origin assets may run with this bridge. No arbitrary URL requests. */
internal class VProxiesWebSurface(
    private val activity: AppCompatActivity,
    private val secrets: VProxiesSecureStore,
    private val dispatch: suspend (String, JSONObject) -> Any,
) {
    val view = WebView(activity)
    private var destroyed = false
    private val host = "appassets.androidplatform.net"

    init {
        view.setBackgroundColor(android.graphics.Color.rgb(10, 14, 23))
        view.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            setSupportMultipleWindows(false)
        }
        CookieManager.getInstance().setAcceptCookie(false)
        WebView.setWebContentsDebuggingEnabled(false)
        view.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                request.url.scheme != "https" || request.url.host != host

            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                val uri = request.url
                val path = uri.path.orEmpty().removePrefix("/").ifBlank { "index.html" }
                if (uri.scheme != "https" || uri.host != host || path.contains("..") ||
                    !path.matches(Regex("[a-zA-Z0-9_./-]+"))) return denied()
                val mime = when (path.substringAfterLast('.')) {
                    "html" -> "text/html"; "js" -> "application/javascript"; "css" -> "text/css"
                    "svg" -> "image/svg+xml"; "png" -> "image/png"; "jpg", "jpeg" -> "image/jpeg"
                    "woff2" -> "font/woff2"; else -> "application/octet-stream"
                }
                return runCatching {
                    WebResourceResponse(mime, "UTF-8", 200, "OK", mapOf(
                        "Content-Security-Policy" to "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
                        "X-Content-Type-Options" to "nosniff"
                    ), activity.assets.open("web/$path"))
                }.getOrElse { denied() }
            }
        }
        view.addJavascriptInterface(Bridge(), "VProxiesNative")
        view.loadUrl("https://$host/index.html")
    }

    private fun denied() = WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", emptyMap(), "".byteInputStream())

    private inner class Bridge {
        @JavascriptInterface
        fun savedCredentials(): String = secrets.read("web_login") ?: "null"

        @JavascriptInterface
        fun request(id: String, method: String, payload: String) {
            if (!id.matches(Regex("[0-9]{1,12}")) || payload.length > 65536) return
            activity.runOnUiThread {
                if (destroyed) return@runOnUiThread
                activity.lifecycleScope.launch {
                    val response = runCatching { dispatch(method, JSONObject(payload)) }.fold(
                        { JSONObject().put("id", id).put("ok", true).put("data", it) },
                        { JSONObject().put("id", id).put("ok", false).put("error", it.message ?: "Operation failed.") }
                    )
                    if (!destroyed) view.evaluateJavascript("window.__vproxiesReply && window.__vproxiesReply(" + response.toString() + ")", null)
                }
            }
        }
    }

    fun destroy() {
        destroyed = true
        view.removeJavascriptInterface("VProxiesNative")
        view.destroy()
    }
}
