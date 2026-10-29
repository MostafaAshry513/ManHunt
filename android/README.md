# ManHunt — Android build & test environment

A ready-to-code Android project (Kotlin + Jetpack Compose) with a fast, emulator-free
test setup. Everything below is already installed and verified on this machine.

**Convention:** this folder is the whole project. All work lives in `C:\dev\ManHunt`
(~80 KB of source, 24 files) and nothing is kept outside it. The JDK and Android SDK in
`C:\Android` are shared toolchain, not project files.

## What is installed

| Piece | Version | Location |
|---|---|---|
| JDK (Temurin LTS) | 21.0.12.1 | `C:\Android\jdk-21` |
| Android SDK | Platform 37.0 / 37.2, Build-Tools 36.0.0 | `C:\Android\Sdk` |
| Platform tools (`adb`) | 37.0.1 | `C:\Android\Sdk\platform-tools` |
| Gradle | 9.8.2 (wrapper, self-downloading) | project-local |
| Android Gradle Plugin | 9.5.0 | via version catalog |
| Kotlin | 2.2.10 (AGP built-in Kotlin) | via version catalog |
| Compose BOM | 2026.09.00 | via version catalog |

`JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` and `PATH` are set machine-wide, so new
terminals just work. No Android Studio is required (or installed).

## Everyday commands

```powershell
cd C:\dev\ManHunt

.\build.ps1     # build the debug APK
.\test.ps1      # run all JVM tests (fast, no device needed)
.\install.ps1   # install + launch on a connected phone
```

APK output: `app\build\outputs\apk\debug\app-debug.apk`
Test report: `app\build\reports\tests\testDebugUnitTest\index.html`

Typical timings on this machine: warm build ~5 s, build + tests ~12 s,
full test execution ~40 s (Robolectric's first test pays a one-off bootstrap).

## Testing without an emulator

This machine is itself a QEMU/KVM guest with **no nested virtualisation** exposed
(no AMD-V, no SLAT). An Android emulator would fall back to pure software emulation:
10–30+ minutes to boot and effectively unusable. So the project uses two faster paths:

### 1. JVM tests (default, no device)

- `AppSmokeTest` — composes the real UI through Robolectric on the JVM and asserts the
  root node exists. It is the safety net for the whole toolchain: if this passes after a
  dependency or config change, the build and test loop is healthy.

Add feature tests next to it as the app grows. Screenshot tests (rendering the UI to a
PNG on the JVM) can be added the same way when there is something to look at.

### 2. A real phone over adb

On the phone: Settings → About → tap "Build number" 7×, then Developer options →
Wireless debugging. Then:

```powershell
adb pair <ip:port>      # enter the pairing code shown on the phone (once)
adb connect <ip:port>
.\install.ps1
```

`adb` is on `PATH`. USB works too if this VM ever gets USB passthrough.

## Project layout

```
C:\dev\ManHunt
├─ app\src\main\java\com\manhunt\app\
│  ├─ MainActivity.kt        # entry point
│  └─ ManHuntApp.kt          # root composable (empty - build here)
├─ app\src\test\java\com\manhunt\app\
│  └─ AppSmokeTest.kt        # Robolectric smoke test
├─ gradle\libs.versions.toml # all dependency versions live here
├─ build.ps1 / test.ps1 / install.ps1
└─ gradle.properties
```

Add a dependency: put the version in `gradle\libs.versions.toml`, add a `[libraries]`
entry, then reference it as `implementation(libs.your.library)`.

## Host-specific fixes already applied

These are non-obvious and worth knowing about before you change them:

1. **JVM entropy (biggest one).** The JDK's `securerandom.source` pointed at the
   Linux-only `/dev/random`, which does not exist on Windows, so every JVM start burned
   ~45 s in thread-jitter seeding. `C:\Android\jdk-21\conf\security\java.security` now
   points at `file:/C:/Android/entropy.bin` (1 KB of CSPRNG bytes). Gradle went from
   ~52 s per invocation to ~5 s. A backup of the original file is at
   `java.security.bak`.
2. **Built-in Kotlin.** AGP 9+ compiles Kotlin itself; applying
   `org.jetbrains.kotlin.android` is an error. Don't re-add it. The Compose compiler
   plugin version must match AGP's bundled Kotlin (2.2.10).
3. **Kotlin compile daemon.** It cannot open its socket on this host, so
   `kotlin.compiler.execution.strategy=in-process` is set in `gradle.properties`.
4. **Robolectric on JDK 21** needs `--add-opens` flags; they are in
   `app\build.gradle.kts` under `tasks.withType<Test>`.
5. **compileSdk 37.** Compose BOM 2026.09 requires it; AGP 9.5 supports API 37.
6. **Windows Defender** exclusions were added for `C:\Android`, `C:\dev`, the Gradle
   caches and `java.exe` to keep file I/O out of the scanner.

If Gradle ever builds slowly again, first check that `java.security` still points at the
entropy file, and that a daemon is being reused (`gradlew --status`).
