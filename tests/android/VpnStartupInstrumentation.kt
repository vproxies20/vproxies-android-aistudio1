package io.nekohasekai.sfa.vproxies

import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Bundle
import android.os.SystemClock
import io.nekohasekai.sfa.constant.Status
import kotlinx.coroutines.runBlocking
import java.net.InetSocketAddress
import kotlin.coroutines.intrinsics.suspendCoroutineUninterceptedOrReturn

/** Runs only in the separate test APK. Uses the production config/start/stop methods. */
class VpnStartupInstrumentation : Instrumentation() {
    override fun onCreate(arguments: Bundle?) {
        super.onCreate(arguments)
        start()
    }

    override fun onStart() {
        val result = Bundle()
        var activity: VProxiesActivity? = null
        try {
            activity = startActivitySync(Intent(targetContext, VProxiesActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) as VProxiesActivity
            val screen = activity
            check(VpnService.prepare(screen) == null) { "Test setup failed: VPN approval is absent" }
            val infoClass = Class.forName("io.nekohasekai.sfa.vproxies.ConnectionInfo")
            val info = infoClass.declaredConstructors.single { it.parameterCount == 7 }.apply {
                isAccessible = true
            }.newInstance("10.0.2.2", 18080, "", "", "http", listOf("http"), null)
            val config = VProxiesActivity::class.java.declaredMethods.single { it.name == "buildConfig" }
                .apply { isAccessible = true }
                .invoke(screen, info, "http", 0, false, true, false, "", "CLOUDFLARE", "") as String
            val install = VProxiesActivity::class.java.declaredMethods.single { it.name == "installProfile" }
                .apply { isAccessible = true }
            runBlocking {
                suspendCoroutineUninterceptedOrReturn<Any?> { continuation ->
                    install.invoke(screen, "CI fixture", config, continuation)
                }
            }
            runOnMainSync {
                field("pendingConfig").set(screen, config)
                call(screen, "requestVpnPermission")
            }
            val deadline = SystemClock.elapsedRealtime() + 25_000
            var started = false
            while (SystemClock.elapsedRealtime() < deadline) {
                runOnMainSync { started = field("coreStatus").get(screen) == Status.Started }
                if (started) break
                SystemClock.sleep(200)
            }
            check(started) { "VPN never reached Started: ${VProxiesDiagnostics.events(screen)}" }
            val cm = screen.getSystemService(ConnectivityManager::class.java)
            val vpn = cm.allNetworks.firstOrNull {
                cm.getNetworkCapabilities(it)?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true
            } ?: error("Service reported Started but Android has no VPN network")
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
                call(screen, "stopCore")
            }
            val stopDeadline = SystemClock.elapsedRealtime() + 10_000
            var stopped = false
            while (SystemClock.elapsedRealtime() < stopDeadline) {
                runOnMainSync { stopped = field("coreStatus").get(screen) == Status.Stopped }
                if (stopped) break
                SystemClock.sleep(200)
            }
            check(stopped) { "Explicit disconnect did not stop VPN" }
            result.putString("vproxies_result", "PASS")
            result.putString("evidence", "Permission already granted; production start reached Started; real TUN traffic crossed HTTP proxy; remained Started; explicit stop reached Stopped")
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
    private fun call(activity: VProxiesActivity, name: String) =
        VProxiesActivity::class.java.getDeclaredMethod(name).apply { isAccessible = true }.invoke(activity)
}
