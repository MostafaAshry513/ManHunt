# Environment

Snapshot of the build/hosting machine, captured 2026-10-28. Secrets are omitted. Later changes
(CI, public deployment, GitHub authentication) are noted inline; treat the versions below as a
record of that host, not as project requirements.

## Host

| Item | Value |
|---|---|
| OS | Windows Server 2022 Datacenter, build 20348 |
| CPU | AMD EPYC-Milan, 12 logical cores |
| RAM | 24 GB |
| Disk | 720 GB, ~677 GB free |
| PowerShell | 5.1.20348 |
| Public IP | `74.208.99.178` |
| Domain | none configured |
| Virtualisation | QEMU/KVM guest, **no nested virtualisation** (no AMD-V, no SLAT) |

## Toolchain

| Tool | Version | Notes |
|---|---|---|
| JDK | Temurin 21.0.12.1 | `C:\Android\jdk-21` |
| Android SDK | Platform 37.0/37.2, Build-Tools 36.0.0 | `C:\Android\Sdk` |
| adb | 37.0.1 | `C:\Android\Sdk\platform-tools` |
| Gradle | 9.8.2 (wrapper) | project-local |
| AGP | 9.5.0 | built-in Kotlin |
| Kotlin | 2.2.10 | bundled with AGP |
| Node.js | 24.22.1 | native TypeScript type stripping works |
| npm | 11.19.1 | |
| Python | 3.15 | unused by this project |
| Git | 2.56.0 | |
| GitHub CLI (`gh`) | installed and authenticated as `MostafaAshry513` | CI and releases are live (changed after the original capture) |
| Caddy | 2.11.7 | reverse proxy for the public HTTP test deployment |
| Docker | **not installed** | |
| PostgreSQL | **not installed** | |

## Implications

1. **No Android emulator on this host.** Without nested virtualisation the emulator runs in pure
   software (10-30+ min boot, unusable). Local testing is JVM-based (Robolectric) plus a real
   phone over adb. GitHub Actions runs a real Android emulator for the in-app test instead.
2. **No Docker / PostgreSQL.** The backend uses Node's built-in `node:sqlite` with WAL, a single
   process and file-backed persistence. Migrations are plain SQL applied at boot.
3. **GitHub CLI and CI are available now.** `gh` is authenticated, CI runs on every push and
   releases are built and signed by GitHub Actions. The original "CI cannot be executed" note is
   obsolete.
4. **Public hosting is live but HTTP-only.** `http://74.208.99.178/` serves the install page and
   update channel through a Caddy reverse proxy; there is no domain and no TLS certificate. See
   [DEPLOYMENT.md](DEPLOYMENT.md).

## Host-specific fixes applied (important)

| Fix | Why |
|---|---|
| JDK `securerandom.source` -> `file:/C:/Android/entropy.bin` | The JDK pointed at the Linux-only `/dev/random`; every JVM start stalled ~45 s seeding. Gradle went from ~52 s to ~5 s per invocation. Backup: `java.security.bak`. |
| `kotlin.compiler.execution.strategy=in-process` | The Kotlin compile daemon cannot open its local socket on this host. |
| Robolectric `--add-opens` flags | JDK 21 blocks reflective access to `jdk.internal.access`. |
| Windows Defender exclusions (`C:\Android`, `C:\dev`, Gradle caches, `java.exe`) | Avoid scanner overhead on build I/O. Defender remains enabled. |
| `compileSdk = 37` | Compose BOM 2026.09 requires API 37; AGP 9.5 supports it. |
