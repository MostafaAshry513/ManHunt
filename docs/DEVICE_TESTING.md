# Testing ManHunt on a real (rooted) phone over adb

This machine is set up to install and drive the ManHunt debug APK on a rooted
Android phone on a **different network** than this Windows host. Everything below
was prepared and syntax-checked here; no phone was attached during setup, so the
device-side steps are documented but not yet exercised on hardware.

| Item | Value |
| --- | --- |
| adb | `C:\Android\Sdk\platform-tools\adb.exe` — Android Debug Bridge 1.0.41 (37.0.1) |
| scrcpy | `C:\Android\scrcpy\scrcpy.exe` — v5.0.1 (win64), added to machine `PATH` |
| Helper scripts | `scripts\device\connect.ps1`, `scripts\device\device-info.ps1`, `scripts\device\common.ps1` |
| App under test | `com.manhunt.app` |
| Default APK | `android\app\build\outputs\apk\debug\app-debug.apk` |

`PATH` changes only apply to **new** shells. In an already-open terminal:

```powershell
$env:Path += ';C:\Android\scrcpy'
scrcpy --version
```

If `scrcpy` is not recognised, the install is fine — the shell is stale.

---

## 1. Phone prerequisites

1. **Developer options**: Settings > About phone > tap *Build number* 7 times.
2. **USB debugging**: Settings > System > Developer options > *USB debugging*.
3. **Root**: Magisk / KernelSU / built-in `su`. Confirm:

   ```powershell
   adb devices                 # state must be "device", not "unauthorized"
   adb shell id                # uid=0(root) => adbd is already root
   adb shell su -c id          # uid=0(root) => su works (accept the prompt on the phone)
   ```

4. Plug in USB once so the phone can show *Allow USB debugging?* — tick
   **Always allow from this computer**. This RSA key is what authorises every
   later TCP connection too.

---

## 2. Enable adb over TCP on a rooted phone

adbd listens on USB by default. Two ways to open TCP/5555.

### Option A — temporary (USB cable, no root needed)

```powershell
adb tcpip 5555
```

adbd restarts in TCP mode; USB adb stops until you replug or run `adb usb`.
Unplug and connect:

```powershell
adb connect <phone-ip>:5555
adb devices
```

This does **not** survive a reboot.

### Option B — persistent (root, survives reboot)

`service.adb.tcp.port` is only read when adbd starts, so setting it alone does
nothing; restart adbd afterwards.

```powershell
# from USB adb on a rooted phone
adb shell su -c "setprop service.adb.tcp.port 5555"
adb shell su -c "stop adbd; start adbd"
```

Equivalent one-liner (some Android 12+ builds need the explicit stop/start
above instead):

```powershell
adb shell su -c "setprop service.adb.tcp.port 5555; setprop ctl.restart adbd"
```

Persist across reboots with a Magisk boot script:

```powershell
adb shell su -c "mkdir -p /data/adb/post-fs-data.d"
adb shell su -c "printf '#!/system/bin/sh\nsetprop service.adb.tcp.port 5555\n' > /data/adb/post-fs-data.d/adb-tcp.sh"
adb shell su -c "chmod 755 /data/adb/post-fs-data.d/adb-tcp.sh"
```

Revert to USB-only at any time:

```powershell
adb shell su -c "setprop service.adb.tcp.port -1; stop adbd; start adbd"
adb usb
```

Notes:

- Android 11+ also has **Wireless debugging** (pairing code, random port). It
  needs no root but the port changes on every reboot and pairing is a two-step
  dance: `adb pair <ip>:<pair-port>` then `adb connect <ip>:<debug-port>`.
- Some OEM ROMs (MIUI, ColorOS, OneUI) reset the property or require
  "USB debugging (Security settings)". Re-check `getprop service.adb.tcp.port`
  after rebooting.
- `adb tcpip 5555` needs an existing USB connection; the `setprop` route needs
  root. On a rooted phone, root is the more reliable path.

### Security warning — read before exposing 5555

> **adb over TCP is not encrypted and has no password.** Access control is only
> the RSA key handshake (`~/.android/adbkey` on the PC, accepted keys in
> `/data/misc/adb/adb_keys` on the phone). Anyone who can reach port 5555 *and*
> whose key you accepted — or any phone where adb auth was disabled — gets
> **full device control**: install/uninstall apps, read app data, inject input,
> capture the screen, wipe data.
>
> Internet-wide scanners probe 5555 continuously. A publicly forwarded 5555 is
> usually compromised within hours. Never DMZ the phone, never disable adb
> authentication (`ro.adb.secure=0`), and never leave the port open after a test.
>
> Before/after testing:
>
> ```powershell
> # who is allowed in?  (root)
> adb shell su -c "cat /data/misc/adb/adb_keys"
> # revoke everything: delete that file and restart adbd, then re-authorise
> adb shell su -c "rm -f /data/misc/adb/adb_keys; stop adbd; start adbd"
> # close TCP adb when finished
> adb usb
> adb disconnect <phone-ip>:5555
> ```
>
> Prefer a private overlay network (Tailscale/WireGuard) or an SSH tunnel over
> any form of port forwarding.

---

## 3. Reachability options (ranked)

Phone-side command for each option, at a glance:

| Rank | Option | Phone-side command |
| --- | --- | --- |
| 1 | Tailscale tailnet | `tailscale up` (or just enable the app), then `tailscale ip -4` |
| 2 | Router port-forward 5555 | `adb shell su -c "setprop service.adb.tcp.port 5555; stop adbd; start adbd"` (or `adb tcpip 5555` over USB) |
| 3 | Reverse SSH tunnel from phone | `ssh -N -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 5555:127.0.0.1:5555 Administrator@<server-public-ip>` (in Termux) |

### Option 1 — Tailscale (recommended)

Why first: works across NAT/CGNAT and carrier networks, WireGuard-encrypted, no
inbound ports, ACLs limit who can reach the phone, stable 100.x.y.z addresses.

Phone:

```bash
# install Tailscale from the Play Store / GitHub release, sign in to the same tailnet
tailscale up          # CLI (Termux) — or just toggle the app on
tailscale ip -4       # note the 100.x.y.z address
```

PC:

```powershell
tailscale status
tailscale ping 100.101.102.103
adb connect 100.101.102.103:5555
.\scripts\device\connect.ps1 -Host 100.101.102.103 -Launch
```

Notes:

- MagicDNS names work too: `adb connect my-phone:5555`.
- The tailnet IP is stable across networks/reboots; the phone's LAN IP is not.
- Enable *Always-on VPN* on the phone if the tailnet must survive reboots.
- adb TCP still has to be enabled on the phone (§2) — Tailscale only provides
  the route.

### Option 2 — Router port-forward to 5555 (risky, not recommended)

Exposes adb to the whole internet. Use only as a last resort and only with a
source-IP allowlist.

Phone (root):

```bash
adb shell su -c "setprop service.adb.tcp.port 5555; stop adbd; start adbd"
# or, over USB:  adb tcpip 5555
```

Router:

1. Give the phone a static DHCP lease.
2. Forward WAN TCP **5555 → phone LAN IP:5555** (or a nonstandard external port
   such as 15555 → 5555, which only slows scanners down).
3. If the router supports it, restrict the rule's source to the PC's current
   public IP (and remember it changes).

PC:

```powershell
adb connect <public-ip>:5555
# or with a nonstandard external port:
adb connect <public-ip>:15555
```

Problems: many ISPs use CGNAT or block 5555, the public IP may be shared, and
the exposure window is a full remote compromise. Disable the forward and run
`adb usb` immediately after testing.

### Option 3 — Reverse SSH tunnel from the phone (no inbound ports)

The phone dials out to this Windows host; adb traffic rides inside SSH. Nothing
is forwarded on the router and the phone has no open port.

Phone prerequisites: Termux, `pkg install openssh`, and adb TCP enabled (§2).
This Windows host must run OpenSSH Server:

```powershell
Get-Service sshd                     # must be Running
Get-NetFirewallRule -DisplayName 'OpenSSH-Server-In-TCP'
```

Phone (Termux) — the exact command:

```bash
ssh -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -R 5555:127.0.0.1:5555 Administrator@<server-public-ip>
```

Then on the PC the forwarded port appears on loopback:

```powershell
adb connect 127.0.0.1:5555
.\scripts\device\connect.ps1 -Host 127.0.0.1 -Launch
```

Notes:

- The reverse forward binds to `127.0.0.1` on the server by default, which is
  exactly what we want. Do **not** enable `GatewayPorts` to widen it.
- If 5555 is already taken on the PC, map a different local port:
  `-R 15555:127.0.0.1:5555` then `adb connect 127.0.0.1:15555`.
- Run the SSH session inside `tmux`/`nohup` or Termux's wake lock so Android
  does not kill it; `ExitOnForwardFailure=yes` makes a bad tunnel fail loudly.
- Authentication: use a dedicated key for the phone account, and keep the
  server's `sshd_config` to key-only login.

---

## 4. Connect + install with the helper script

`scripts\device\connect.ps1`

| Parameter | Default | Meaning |
| --- | --- | --- |
| `-Host` (required, alias of `-DeviceHost`) | — | phone IP/DNS name reachable from the PC (an alias because `$Host` is a reserved PowerShell variable) |
| `-Port` | `5555` | adb TCP port |
| `-Apk` | `android\app\build\outputs\apk\debug\app-debug.apk` | APK to install; relative paths resolve against the current dir, then the repo root |
| `-Package` | `com.manhunt.app` | app id used for launching |
| `-Launch` | off | start the app after install |
| `-Disconnect` | off | drop the connection and exit |
| `-WaitSeconds` | `60` | wait for the device to come online |
| `-InstallTimeoutSeconds` | `300` | install timeout |
| `-AdbPath` | auto | override adb.exe |

Examples:

```powershell
# connect + install
.\scripts\device\connect.ps1 -Host 100.101.102.103

# connect + install + launch
.\scripts\device\connect.ps1 -Host 100.101.102.103 -Launch

# install a build from somewhere else
.\scripts\device\connect.ps1 -Host 100.101.102.103 -Apk D:\ci\manhunt\app-debug.apk -Launch

# phone behind an SSH reverse tunnel
.\scripts\device\connect.ps1 -Host 127.0.0.1 -Port 15555

# clean up
.\scripts\device\connect.ps1 -Host 100.101.102.103 -Disconnect
```

What it does: resolves `adb.exe` (clear error if missing) → `adb connect` →
bounded `wait-for-device` → state check (turns *unauthorized*/*offline* into an
actionable message) → `adb install -r` with install-failure hints → optional
launch (resolves the launcher activity, falls back to `monkey`) → prints
`adb devices -l`. Exit code `0` on success, `1` on failure.

The APK must exist first:

```powershell
.\gradlew.bat :app:assembleDebug
```

Raw adb equivalent:

```powershell
adb connect 100.101.102.103:5555
adb devices -l
adb -s 100.101.102.103:5555 install -r android\app\build\outputs\apk\debug\app-debug.apk
adb -s 100.101.102.103:5555 shell am start -n com.manhunt.app/.MainActivity
```

(`.MainActivity` is an example — use `adb shell cmd package resolve-activity
--brief com.manhunt.app` to read the real component from the installed APK.)

---

## 5. Device report

`scripts\device\device-info.ps1` prints model, Android version/API, build type,
ABI(s), the `adb shell id` identity, root/`su`/SELinux status, `wm size` and
`wm density` (including overrides), and whether `com.manhunt.app` is installed
(with version name/code and debuggable flag).

```powershell
.\scripts\device\device-info.ps1 -Host 100.101.102.103
.\scripts\device\device-info.ps1                 # single already-connected device
.\scripts\device\device-info.ps1 -Host 100.101.102.103 -Json
```

Illustrative output (values from any real phone will differ; not yet produced
on hardware):

```
Device report for 100.101.102.103:5555
------------------------------------------------------------
Serial           100.101.102.103:5555
Model            Google Pixel 7
Codename         panther
AndroidVersion   14 (API 34)
BuildType        userdebug
DebuggableBuild  1
Abi              arm64-v8a
AbiList          arm64-v8a,armeabi-v7a,armeabi
AdbIdentity      uid=0(root) gid=0(root) groups=0(root)
Root             adbd is running as root (uid=0)
SuBinary         /system/bin/su
Selinux          Enforcing
ScreenSize       Physical size: 1080x2400
ScreenOverride   none
ScreenDensity    Physical density: 420
DensityOverride  none
Package          com.manhunt.app
Installed        yes
VersionName      1.0.0
VersionCode      1
DebuggableApp    yes
------------------------------------------------------------
```

Key checks before a test run:

- `Installed = yes` and the version matches the build you just installed.
- `Root` reports `uid=0` or a `su` path; otherwise root-only tests cannot pass.
- `Abi` contains `arm64-v8a` for a normal 64-bit phone; if the APK ships only
  `armeabi-v7a`/x86 the install fails with `INSTALL_FAILED_NO_MATCHING_ABIS`.
- Density/size matter when comparing screenshots or UI coordinates.

---

## 6. Day-to-day commands

Replace `SERIAL` with the target, e.g. `100.101.102.103:5555`. Always use `-s`
when more than one device is attached.

### Screenshot

```powershell
# PowerShell 5.1's '>' would corrupt the PNG — go through cmd, or pull a file.
cmd /c "adb -s SERIAL exec-out screencap -p > screenshot.png"

# safer / portable
adb -s SERIAL shell screencap -p /sdcard/manhunt.png
adb -s SERIAL pull /sdcard/manhunt.png .\manhunt.png
```

### Screen recording

```powershell
adb -s SERIAL shell screenrecord --size 720x1280 --bit-rate 6M --time-limit 180 /sdcard/manhunt-demo.mp4
adb -s SERIAL pull /sdcard/manhunt-demo.mp4 .
adb -s SERIAL shell rm /sdcard/manhunt-demo.mp4
```

`screenrecord` caps a single file at ~3 minutes (180 s); for longer captures
repeat with `--time-limit` and stitch, or record the PC screen while mirroring.

### logcat

```powershell
adb -s SERIAL logcat -c                       # clear
adb -s SERIAL logcat -v threadtime            # live, full device

# app-only, survives app restarts poorly but is enough for a session:
adb -s SERIAL shell pidof com.manhunt.app
adb -s SERIAL logcat --pid=<pid> -v threadtime

# capture to a file for the bug report (PowerShell text redirect is fine)
adb -s SERIAL logcat -v threadtime | Tee-Object -FilePath .\logcat.txt

# crashes / native crashes
adb -s SERIAL logcat -b crash -v threadtime
```

### Uninstall / reset

```powershell
adb -s SERIAL uninstall com.manhunt.app              # remove app + data
adb -s SERIAL shell pm uninstall -k com.manhunt.app  # keep data
adb -s SERIAL shell pm clear com.manhunt.app         # wipe data only
```

### Root-only inspection

```powershell
adb root                                    # restart adbd as root (userdebug/eng builds)
adb -s SERIAL shell su -c "id"
adb -s SERIAL shell su -c "ls -la /data/data/com.manhunt.app"
adb -s SERIAL shell su -c "tar -czf /sdcard/manhunt-data.tgz /data/data/com.manhunt.app"
adb -s SERIAL pull /sdcard/manhunt-data.tgz .
```

### Mirror with scrcpy

```powershell
scrcpy --version
scrcpy --tcpip=100.101.102.103:5555                  # connect (also enables tcpip if USB is attached)
scrcpy -s 100.101.102.103:5555 --max-size 1024 --record session.mp4
scrcpy -s 100.101.102.103:5555 --no-audio --window-title ManHunt
```

scrcpy bundles its own `adb.exe`; if it disagrees with the SDK adb, run
`adb kill-server` and retry (see Troubleshooting).

---

## 7. Setting the server URL on first run

The phone is on another network, so `localhost` on the phone means **the phone**,
not this PC. Give the app this PC's address as seen from the phone:

- Tailscale: `http://100.x.y.z:<port>`
- Port-forward: `http://<public-ip>:<port>`
- Reverse SSH tunnel: `http://127.0.0.1:<port>` works only if the app's traffic
  is tunnelled too (adb is not a general proxy — normally you still need the
  PC's tailnet/public address for the API).

### 7.1 Make the PC reachable

1. Bind the server to all interfaces (`0.0.0.0`), not `127.0.0.1`.
2. Open the API port for the tailnet/LAN:

   ```powershell
   New-NetFirewallRule -DisplayName 'ManHunt API' -Direction Inbound `
     -Protocol TCP -LocalPort <port> -Action Allow -Profile Any
   ```

3. From the phone, confirm reachability — phone browsers are the simplest check:
   open `http://100.x.y.z:<port>/` (or a `/health` endpoint if one exists).
   `adb shell` can also try it when the ROM ships a client:

   ```powershell
   adb -s SERIAL shell "toybox wget -qO- http://100.x.y.z:<port>/health"
   ```

### 7.2 Point the app at it

**Primary path — the app's own settings/first-run screen.** Launch the app
(`.\scripts\device\connect.ps1 -Host ... -Launch`), open its settings/first-run
configuration, enter the base URL `http://100.x.y.z:<port>`, save, and confirm
the request shows up in the server log.

**Fallbacks — only if the app implements them.** The app code owns the exact
key/extra names, so verify in `android/` before relying on these:

```powershell
# launch-time intent extra (if the app reads one, e.g. "server_url")
adb -s SERIAL shell am start -n com.manhunt.app/.MainActivity --es server_url "http://100.x.y.z:<port>"

# deep link, if the app declares one
adb -s SERIAL shell am start -a android.intent.action.VIEW -d "manhunt://settings?server=http://100.x.y.z:<port>"

# debuggable builds only: inspect / edit SharedPreferences
adb -s SERIAL shell run-as com.manhunt.app ls shared_prefs
adb -s SERIAL shell run-as com.manhunt.app cat shared_prefs/<file>.xml
adb -s SERIAL pull /data/local/tmp/<file>.xml .   # after copying it out via run-as
```

**Build-time default.** If the URL is a Gradle property / `BuildConfig` field,
rebuild and reinstall instead:

```powershell
.\gradlew.bat :app:assembleDebug -PserverUrl=http://100.x.y.z:<port>
.\scripts\device\connect.ps1 -Host 100.101.102.103 -Launch
```

### 7.3 If requests fail

Android 9+ blocks cleartext HTTP unless the app opts in
(`android:usesCleartextTraffic` or a network security config). Symptom in
logcat:

```
CLEARTEXT communication to 100.x.y.z not permitted by network security policy
```

Options: allow cleartext for the debug build, or terminate TLS in front of the
API (Caddy is installed on this host as `C:\caddy`) and use `https://`.

---

## 8. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `adb: command not found` | add `C:\Android\Sdk\platform-tools` to `PATH` or pass `-AdbPath` |
| `scrcpy` not recognised | `PATH` was updated after the shell started; open a new terminal |
| `device unauthorized` | unlock the phone, accept *Allow USB debugging?*; revoke + re-authorise if needed |
| `cannot connect ... actively refused` | adb TCP not enabled / wrong port / phone IP changed |
| `cannot connect ... timed out` | wrong network, tailnet down, router forward missing, phone asleep |
| Connects, then dies after reboot | `adb tcpip` is not persistent — use the `setprop` boot script (§2) |
| `adb server version doesn't match` | scrcpy's bundled adb vs SDK adb: `adb kill-server`, retry |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | different signing key: `adb uninstall com.manhunt.app` then reinstall |
| `INSTALL_FAILED_NO_MATCHING_ABIS` | APK lacks the phone's ABI (e.g. x86-only build on arm64) |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | uninstall first or `adb install -r -d` |
| App can't reach the server | bind `0.0.0.0`, firewall rule, wrong IP (localhost = phone), cleartext blocked |
| Multiple devices | always pass `-s SERIAL` (scripts handle this) |
| Tunnel dies with phone asleep | Termux wake lock / `svc power stayon true` while testing |

---

## 9. Validation status

Verified on this machine:

- scrcpy 5.0.1 downloaded from Genymobile's GitHub release, SHA-256
  `b12a2c4e…16227a5` matched, installed to `C:\Android\scrcpy`, machine `PATH`
  updated, `scrcpy --version` → `scrcpy 5.0.1` (SDL 3.4.18, FFmpeg libavcodec
  63.1.102).
- `adb version` → 1.0.41 (37.0.1).
- All three PowerShell files pass `[Parser]::ParseFile` with zero errors.
- Error paths exercised without hardware: missing APK, missing `adb.exe`,
  unreachable host, no attached device, `-Disconnect`, and `-Json` failure
  output all return clear messages and a non-zero exit code where appropriate.

Not yet verified (needs the phone):

- Real `adb connect` / `install -r` / launch on hardware.
- `device-info.ps1` against a real device (sample output above is illustrative).
- Persistence of `service.adb.tcp.port` on the specific OEM ROM.
- The app's actual launcher activity and server-URL configuration mechanism.
