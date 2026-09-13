package io.nekohasekai.sfa.vproxies

import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Bundle
import android.os.SystemClock
import android.webkit.WebView
import io.nekohasekai.sfa.constant.Status
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.json.JSONTokener
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.InetSocketAddress
import java.net.URL
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.Collections

/** Real WebView -> JS bridge -> account API parsing -> profile -> Android VPN -> TUN.
 * Only account HTTP transport is substituted; no private start/config method is invoked.
 */
class VpnStartupInstrumentation : Instrumentation() {
    private val requests = Collections.synchronizedList(mutableListOf<String>())
    override fun onCreate(arguments: Bundle?) {
        super.onCreate(arguments)
        start()
    }

    override fun onStart() {
        val result = Bundle()
        var activity: VProxiesActivity? = null
        try {
            targetContext.getSharedPreferences("vproxies_startup_diagnostics", 0).edit().clear().commit()
            activity = startActivitySync(Intent(targetContext, VProxiesActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as VProxiesActivity
            val screen = activity
            check(VpnService.prepare(screen) == null) { "Test setup failed: VPN approval is absent" }
            val transport: (URL) -> HttpURLConnection = { url -> FixtureConnection(url) }
            val apiClass = Class.forName("io.nekohasekai.sfa.vproxies.ApiClient")
            val api = apiClass.declaredConstructors.single { it.parameterCount == 2 }.apply {
                isAccessible = true
            }.newInstance(screen.getSystemService(ConnectivityManager::class.java), transport)
            apiClass.getDeclaredField("token").apply { isAccessible = true }.set(api, "ci-session")
            runOnMainSync {
                field("api").set(screen, api)
                field("webAccount").set(screen, JSONObject().put("identity", "CI account")
                    .put("active", true).put("packageName", "CI").put("remainingDays", 7))
            }
            val surface = field("webSurface").get(screen)
            val web = surface.javaClass.getDeclaredMethod("getView").apply { isAccessible = true }.invoke(surface) as WebView
            awaitCondition("WebView did not sync and select API proxy") {
                js(web, "document.body.innerText.includes('CI fixture')") == true
            }
            js(web, "document.getElementById('power_dial_button').click(); true")
            awaitCondition("Native Connect did not request VPN startup") {
                VProxiesDiagnostics.events(screen).toString().contains("START_REQUEST")
            }
            // A repeated click after the API response must never become an implicit Stop.
            js(web, "document.getElementById('power_dial_button').click(); document.getElementById('action_connect_button').click(); true")
            val deadline = SystemClock.elapsedRealtime() + 25_000
            var started = false
            while (SystemClock.elapsedRealtime() < deadline) {
                runOnMainSync { started = field("coreStatus").get(screen) == Status.Started }
                if (started) break
                SystemClock.sleep(200)
            }
            check(started) { "VPN never reached Started: ${VProxiesDiagnostics.events(screen)}" }
            awaitCondition("Native VPN started but Dashboard did not show Connected") {
                js(web, "document.getElementById('action_connect_button').innerText.includes('DISCONNECT PROXY')") == true
            }
            val beforeStop = VProxiesDiagnostics.events(screen)
            check((0 until beforeStop.length()).count { beforeStop.getJSONObject(it).optString("tag") == "BUTTON_CONNECT" } == 1)
            check((0 until beforeStop.length()).none { beforeStop.getJSONObject(it).optString("tag") == "BUTTON_STOP" }) {
                "Connect button issued an implicit disconnect: $beforeStop"
            }
            check(requests.contains("POST connections")) { "The real API connection parser was not exercised" }
            val cm = screen.getSystemService(ConnectivityManager::class.java)
            val vpn = runBlocking { VProxiesNetwork.awaitVpnNetwork(cm) }
            check(VProxiesDiagnostics.events(screen).toString().contains("NETWORK_READY")) {
                "Dashboard reported Connected before Android made the VPN network available"
            }
            // The fixture responds only through HTTP CONNECT; this address has no real origin.
            vpn.socketFactory.createSocket().use { socket ->
                socket.soTimeout = 10_000
                socket.connect(InetSocketAddress("198.18.0.1", 80), 10_000)
                socket.getOutputStream().write("GET /vpn-smoke HTTP/1.1\r\nHost: vpn-smoke.invalid\r\nConnection: close\r\n\r\n".toByteArray())
                val response = socket.getInputStream().bufferedReader().readText()
                check(response.contains("VPROXIES_TUNNEL_OK")) { "VPN traffic did not reach the proxy fixture: $response" }
            }
            SystemClock.sleep(3_000)
            runOnMainSync {
                check(field("coreStatus").get(screen) == Status.Started) { "VPN stopped without a disconnect request" }
            }
            js(web, "document.getElementById('action_connect_button').click(); true")
            val stopDeadline = SystemClock.elapsedRealtime() + 10_000
            var stopped = false
            while (SystemClock.elapsedRealtime() < stopDeadline) {
                runOnMainSync { stopped = field("coreStatus").get(screen) == Status.Stopped }
                if (stopped) break
                SystemClock.sleep(200)
            }
            check(stopped) { "Explicit disconnect did not stop VPN" }
            result.putString("vproxies_result", "PASS")
            result.putString("evidence", "WebView synced API proxies; real Connect button requested and parsed connection details; repeated taps sent no Stop; Dashboard showed Connected; real TUN traffic crossed HTTP CONNECT; Disconnect button stopped VPN")
            result.putString("api_requests", requests.toString())
        } catch (error: Throwable) {
            result.putString("vproxies_result", "FAIL")
            result.putString("error", error.stackTraceToString())
        } finally {
            result.putString("events", VProxiesDiagnostics.events(targetContext).toString(2))
            activity?.let { screen -> runOnMainSync { screen.finish() } }
        }
        finish(if (result.getString("vproxies_result") == "PASS") Activity.RESULT_OK else Activity.RESULT_CANCELED, result)
    }

    private fun field(name: String) = VProxiesActivity::class.java.getDeclaredField(name).apply { isAccessible = true }
    private fun js(web: WebView, script: String): Any? {
        val done = CountDownLatch(1)
        var value: Any? = null
        runOnMainSync { web.evaluateJavascript(script) { result -> value = JSONTokener(result).nextValue(); done.countDown() } }
        check(done.await(10, TimeUnit.SECONDS)) { "WebView did not answer: $script" }
        return value
    }

    private fun awaitCondition(message: String, predicate: () -> Boolean) {
        val deadline = SystemClock.elapsedRealtime() + 30_000
        while (SystemClock.elapsedRealtime() < deadline) {
            if (predicate()) return
            SystemClock.sleep(200)
        }
        error("$message; ${VProxiesDiagnostics.events(targetContext)}")
    }

    private inner class FixtureConnection(url: URL) : HttpURLConnection(url) {
        private val body = ByteArrayOutputStream()
        override fun connect() = Unit
        override fun disconnect() = Unit
        override fun usingProxy() = false
        override fun getResponseCode() = 200
        override fun getOutputStream() = body
        override fun getInputStream(): java.io.InputStream {
            check(getRequestProperty("Authorization") == "Bearer ci-session")
            val path = url.path.removePrefix("/api/v1/")
            requests.add("$requestMethod $path")
            val json = when (path) {
                "entitlement" -> """{"data":{"active":true,"status":"active","package_name":"CI","remaining_days":7}}"""
                "gateways" -> """{"gateways":[{"id":"ci","name":"CI gateway","region":"test"}]}"""
                "proxies" -> """{"proxies":[{"id":1,"gateway_id":"ci","name":"CI fixture","protocol":"http","protocols":["http"],"status":"online"}]}"""
                "connections" -> {
                    check(requestMethod == "POST")
                    val payload = JSONObject(body.toString("UTF-8"))
                    check(payload.getString("gateway_id") == "ci" && payload.getLong("proxy_id") == 1L)
                    """{"connection":{"mode":"direct","gateway_id":"ci","proxy_id":1,"connection":{"host":"10.0.2.2","port":18080,"username":"","password":"","protocol":"http","protocols":["http"]}}}"""
                }
                else -> error("Unexpected account API request: $path")
            }
            return json.byteInputStream()
        }
    }
}
