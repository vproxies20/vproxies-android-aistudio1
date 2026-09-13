#!/usr/bin/env python3
"""Apply the VProxies Android overlay to a pinned sing-box checkout."""

from pathlib import Path
import shutil
import sys
import xml.etree.ElementTree as ET


EXPECTED_CORE = "56f91dfeabd6f4edbd437dfcc1e5b0ebc856b778"
EXPECTED_ANDROID = "af61098358a8141dea71f232b7eaebf4ccee8868"


def replace_once(path: Path, old: str, new: str) -> None:
    value = path.read_text(encoding="utf-8")
    if old not in value:
        raise RuntimeError(f"Expected text not found in {path}: {old!r}")
    path.write_text(value.replace(old, new, 1), encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: prepare-upstream.py <sing-box-checkout>")
    root = Path(sys.argv[1]).resolve()
    client = root / "clients" / "android"
    overlay = Path(__file__).resolve().parents[1] / "overlay"
    if not (root / "go.mod").is_file() or not (client / "app").is_dir():
        raise SystemExit("The supplied path is not a recursive sing-box checkout")

    activity_src = overlay / "VProxiesActivity.kt"
    activity_dst = client / "app/src/main/java/io/nekohasekai/sfa/vproxies/VProxiesActivity.kt"
    activity_dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(activity_src, activity_dst)
    shutil.copy2(overlay / "VProxiesWebSurface.kt", activity_dst.parent / "VProxiesWebSurface.kt")
    shutil.copy2(overlay / "VProxiesDiagnostics.kt", activity_dst.parent / "VProxiesDiagnostics.kt")
    test_dst = client / "app/src/androidTest/java/io/nekohasekai/sfa/vproxies"
    test_dst.mkdir(parents=True, exist_ok=True)
    shutil.copy2(overlay.parent / "tests/android/VpnStartupInstrumentation.kt", test_dst / "VpnStartupInstrumentation.kt")
    shutil.copytree(overlay.parent / "dist", client / "app/src/main/assets/web", dirs_exist_ok=True)
    shutil.copy2(overlay / "VProxiesFrontend.kt", activity_dst.parent / "VProxiesFrontend.kt")
    shutil.copy2(overlay / "VProxiesSecureStore.kt", activity_dst.parent / "VProxiesSecureStore.kt")
    shutil.copy2(overlay / "VProxiesUpdater.kt", activity_dst.parent / "VProxiesUpdater.kt")
    picker_src = overlay / "VProxiesAppPickerActivity.kt"
    picker_dst = client / "app/src/main/java/io/nekohasekai/sfa/vproxies/VProxiesAppPickerActivity.kt"
    shutil.copy2(picker_src, picker_dst)
    logo_src = overlay / "ic_vproxies_logo.xml"
    logo_dst = client / "app/src/main/res/drawable/ic_vproxies_logo.xml"
    shutil.copy2(logo_src, logo_dst)

    # Record errors at their source, before asynchronous UI callbacks can be lost.
    service = client / "app/src/main/java/io/nekohasekai/sfa/bg/BoxService.kt"
    replace_once(service, "import android.app.NotificationChannel", "import io.nekohasekai.sfa.vproxies.VProxiesDiagnostics\nimport android.app.NotificationChannel")
    replace_once(service, "internal fun onStartCommand(): Int {", 'internal fun onStartCommand(): Int {\n        VProxiesDiagnostics.record(service, "SERVICE_START", "onStartCommand; state=${status.value}")')
    replace_once(service, "private suspend fun startService() {", 'private suspend fun startService() {\n        VProxiesDiagnostics.record(service, "SERVICE_SETUP", "Preparing foreground notification and selected profile")')
    replace_once(service, "val content = File(profile.typed.path).readText()", 'VProxiesDiagnostics.record(service, "PROFILE_READ", "Reading selected profile")\n            val content = File(profile.typed.path).readText()')
    replace_once(service, "commandServer.startOrReloadService(", 'VProxiesDiagnostics.record(service, "CORE_START", "Starting native VPN runtime")\n                commandServer.startOrReloadService(')
    replace_once(service, "status.postValue(Status.Started)", 'VProxiesDiagnostics.record(service, "SERVICE_STARTED", "Native VPN runtime started")\n            status.postValue(Status.Started)')
    replace_once(service, "private suspend fun stopAndAlert(type: Alert, message: String? = null) {", 'private suspend fun stopAndAlert(type: Alert, message: String? = null) {\n        VProxiesDiagnostics.record(service, "SERVICE_ERROR", "${type.name}: ${message ?: "No error detail"}", true)')
    replace_once(service, "private fun stopService() {", 'private fun stopService() {\n        VProxiesDiagnostics.record(service, "SERVICE_STOP", "Stop received; state=${status.value}")')

    replace_once(
        client / "app/build.gradle.kts",
        'applicationId = "io.nekohasekai.sfa"',
        'applicationId = "app.vproxies.aistudio"\n        testInstrumentationRunner = "io.nekohasekai.sfa.vproxies.VpnStartupInstrumentation"',
    )
    replace_once(
        client / "app/build.gradle.kts",
        "minSdk = 23",
        "minSdk = 24",
    )
    replace_once(
        client / "app/build.gradle.kts",
        "isUniversalApk = true",
        "isUniversalApk = false",
    )
    replace_once(
        client / "app/build.gradle.kts",
        'base.archivesName.set("SFA-${versionName}")',
        'base.archivesName.set("VProxies-${versionName}")',
    )
    replace_once(
        client / "app/src/main/AndroidManifest.xml",
        'android:name=".compose.MainActivity"',
        'android:name=".vproxies.VProxiesActivity"',
    )
    replace_once(
        client / "app/src/main/AndroidManifest.xml",
        "    </application>",
        '        <activity\n'
        '            android:name=".vproxies.VProxiesAppPickerActivity"\n'
        '            android:exported="false"\n'
        '            android:theme="@style/AppTheme" />\n\n'
        "    </application>",
    )
    manifest = client / "app/src/main/AndroidManifest.xml"
    manifest.write_text(
        manifest.read_text(encoding="utf-8").replace(
            '@mipmap/ic_launcher',
            '@drawable/ic_vproxies_logo',
        ),
        encoding="utf-8",
    )
    replace_once(
        client / "app/src/main/AndroidManifest.xml",
        '<uses-permission android:name="android.permission.INTERNET" />',
        '<uses-permission android:name="android.permission.INTERNET" />\n'
        '    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\n'
        '    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />',
    )

    for strings in (client / "app/src/main/res").glob("values*/strings.xml"):
        text = strings.read_text(encoding="utf-8")
        text = text.replace(
            '<string name="app_name" translatable="false">sing-box</string>',
            '<string name="app_name" translatable="false">VProxies</string>',
        )
        strings.write_text(text, encoding="utf-8")

    replace_once(
        client / "app/src/main/AndroidManifest.xml",
        "    <application",
        '    <queries><intent><action android:name="android.intent.action.MAIN" />'
        '<category android:name="android.intent.category.LAUNCHER" /></intent></queries>\n'
        "    <application",
    )

    # No backup of active proxy credentials, and no unused camera/location/install permissions.
    ns = "{http://schemas.android.com/apk/res/android}"
    ET.register_namespace("android", "http://schemas.android.com/apk/res/android")
    ET.register_namespace("tools", "http://schemas.android.com/tools")
    tree = ET.parse(manifest)
    document = tree.getroot()
    unused = {"CAMERA", "ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION",
              "WRITE_EXTERNAL_STORAGE", "QUERY_ALL_PACKAGES", "REQUEST_INSTALL_PACKAGES"}
    for permission in list(document.findall("uses-permission")):
        if permission.get(ns + "name", "").removeprefix("android.permission.") in unused:
            document.remove(permission)
    application = document.find("application")
    application.set(ns + "allowBackup", "false")
    application.attrib.pop(ns + "dataExtractionRules", None)
    application.attrib.pop(ns + "fullBackupContent", None)
    tree.write(manifest, encoding="utf-8", xml_declaration=True)

    (client / "version.properties").write_text(
        "VERSION_CODE=4\nVERSION_NAME=0.6.3-diagnostic\nGO_VERSION=go1.26.7\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
