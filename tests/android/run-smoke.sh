#!/usr/bin/env bash
set -euo pipefail
mkdir -p android-evidence
python3 tests/android/proxy_fixture.py > android-evidence/proxy.log 2>&1 &
fixture_pid=$!
cleanup() {
  adb logcat -d > android-evidence/logcat.txt || true
  adb shell dumpsys activity services app.vproxies.aistudio > android-evidence/services.txt || true
  adb shell dumpsys connectivity > android-evidence/connectivity.txt || true
  kill "$fixture_pid" || true
}
trap cleanup EXIT
mapfile -t apps < <(find sing-box/clients/android/app/build/outputs/apk/other/debug -name '*x86_64*.apk')
mapfile -t tests < <(find sing-box/clients/android/app/build/outputs/apk/androidTest -name '*.apk')
test "${#apps[@]}" -eq 1
test "${#tests[@]}" -eq 1
adb install -r "${apps[0]}"
adb install -r "${tests[0]}"
adb shell appops set app.vproxies.aistudio ACTIVATE_VPN allow
adb shell pm grant app.vproxies.aistudio android.permission.POST_NOTIFICATIONS
adb logcat -c
timeout 120 adb shell am instrument -w app.vproxies.aistudio.test/io.nekohasekai.sfa.vproxies.VpnStartupInstrumentation | tee android-evidence/instrumentation.txt
grep -q 'vproxies_result=PASS' android-evidence/instrumentation.txt
grep -q 'PASS: Android TUN traffic' android-evidence/proxy.log
