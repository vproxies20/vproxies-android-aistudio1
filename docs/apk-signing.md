# Signing APKs for distribution

GitHub Actions currently builds a debug APK as an intermediate artifact. Its
automatically generated debug certificate is not a stable distribution identity.
The previously supplied 0.6.1, 0.6.2 and 0.6.3 preview APKs have different
certificates and cannot update one another in place.

Starting with the separately signed 0.6.4 preview deliverable, retain and reuse
the owner's private signing key for package `app.vproxies.aistudio`.

Expected distribution certificate SHA-256:

```
468754ac98cbc4b9de4d130dc6caa3904710185a1ff8877b28409e60f63b2052
```

The owner has a separate private backup named
`VProxies-AIStudio-private-signing-backup.zip`. It contains the PKCS12 keystore,
password file and recovery instructions. Never commit that backup, the keystore
or its password to this repository, bundle them into an APK, or publish them as
GitHub artifacts. The alias is `vproxies-aistudio`.

After the Android connection tests pass, sign the collected APK with the retained
private key using Android SDK `apksigner`. Pass passwords using its `file:`
options; do not put passwords directly in command arguments. Verify the signed
APK with `apksigner verify --verbose --print-certs`, confirm the fingerprint
above, and compare all non-signature ZIP entries with the tested input APK.

Distribute the signed deliverable. Do not present a raw Actions debug artifact
as an update to this signed application. Increase `versionCode` for subsequent
versions and reuse the same private key. Moving from the older differently
signed previews requires uninstalling the old preview once, which removes its
saved application data.
