package io.nekohasekai.sfa.vproxies

import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Process
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** allNetworks can expose a VPN before netd installs its UID permissions. */
object VProxiesNetwork {
    suspend fun awaitVpnNetwork(connectivity: ConnectivityManager): Network = withTimeout(15_000) {
        suspendCancellableCoroutine { continuation ->
            val request = NetworkRequest.Builder()
                .removeCapability(NetworkCapabilities.NET_CAPABILITY_NOT_VPN)
                .addTransportType(NetworkCapabilities.TRANSPORT_VPN)
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()
            val callback = object : ConnectivityManager.NetworkCallback() {
                private val eligible = mutableSetOf<Network>()
                private val unblocked = mutableSetOf<Network>()

                private fun completeIfReady(network: Network) {
                    if (network !in eligible || (Build.VERSION.SDK_INT >= 29 && network !in unblocked)) return
                    if (continuation.isActive) {
                        runCatching { connectivity.unregisterNetworkCallback(this) }
                        continuation.resume(network)
                    }
                }

                override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
                    if (!capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) return
                    if (Build.VERSION.SDK_INT >= 30 && capabilities.ownerUid != Process.myUid()) return
                    // Capabilities are delivered after onAvailable; do not bind a
                    // socket to an agent discovered early through allNetworks.
                    eligible.add(network)
                    completeIfReady(network)
                }

                override fun onBlockedStatusChanged(network: Network, blocked: Boolean) {
                    if (blocked) unblocked.remove(network) else unblocked.add(network)
                    completeIfReady(network)
                }

                override fun onLost(network: Network) {
                    eligible.remove(network)
                    unblocked.remove(network)
                }
            }
            continuation.invokeOnCancellation { runCatching { connectivity.unregisterNetworkCallback(callback) } }
            try {
                connectivity.registerNetworkCallback(request, callback)
                if (!continuation.isActive) runCatching { connectivity.unregisterNetworkCallback(callback) }
            } catch (error: Exception) {
                if (continuation.isActive) continuation.resumeWithException(error)
            }
        }
    }
}
