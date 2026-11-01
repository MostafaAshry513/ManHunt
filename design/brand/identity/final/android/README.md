# Android handoff — approved ManHunt icon (Open Zone)

Everything needed to replace the current launcher icon. **No app file was edited in this workstream** —
this is a copy-in package. Mark geometry is the approved `concepts/01-open-zone/mark.svg`.

## 1. File → resource path map

Copy each file to the destination below. `res/` = `android/app/src/main/res/`.

| File here | Destination | Notes |
|---|---|---|
| `ic_launcher_foreground.xml` | `res/drawable/ic_launcher_foreground.xml` | 108 dp VectorDrawable; mark inside the 66 dp safe circle |
| `ic_launcher_monochrome.xml` | `res/drawable/ic_launcher_monochrome.xml` | Android 13+ themed icon; single colour, mark only |
| `mipmap-anydpi-v26/ic_launcher.xml` | `res/mipmap-anydpi-v26/ic_launcher.xml` | adaptive-icon definition (background + foreground + monochrome) |
| `mipmap-anydpi-v26/ic_launcher_round.xml` | `res/mipmap-anydpi-v26/ic_launcher_round.xml` | round variant, same layers |
| `values/icon_colors.xml` | `res/values/icon_colors.xml` | **new** values file: `icon_background` = `#0B1220` |
| `mipmap-mdpi/ic_launcher.png` (48×48) | `res/mipmap-mdpi/ic_launcher.png` | legacy (API < 26) |
| `mipmap-mdpi/ic_launcher_round.png` | `res/mipmap-mdpi/ic_launcher_round.png` | legacy round |
| `mipmap-hdpi/…` (72×72) | `res/mipmap-hdpi/…` | |
| `mipmap-xhdpi/…` (96×96) | `res/mipmap-xhdpi/…` | |
| `mipmap-xxhdpi/…` (144×144) | `res/mipmap-xxhdpi/…` | |
| `mipmap-xxxhdpi/…` (192×192) | `res/mipmap-xxxhdpi/…` | |
| `play-512.png` | upload to Google Play (not in `res/`) | 512×512, opaque, no text |
| `favicon-32.png`, `favicon-48.png` | web/install page (`res/` not involved) | also duplicated in `../install/` |

The adaptive definition is already written for you, e.g. `res/mipmap-anydpi-v26/ic_launcher.xml`:

```xml
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/icon_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>
```

If the app already defines the field colour (`launch_bg = #0B1220`), you may point `<background>` at
`@color/launch_bg` instead of adding `icon_colors.xml`.

## 2. Manifest and legacy compatibility

- Point both icons at the mipmaps: `android:icon="@mipmap/ic_launcher"` and
  `android:roundIcon="@mipmap/ic_launcher_round"` (the manifest already uses these names, so no manifest
  edit is strictly needed once the resources land).
- The legacy PNGs are the **central 80 dp** of the adaptive art, so the mark fills ~80 % of the icon on
  API < 26; the adaptive art keeps the mark inside the 66 dp safe circle.
- **Delete the old vector** `drawable/ic_launcher.xml` (navy square + cyan crosshair + coral cross) or it
  becomes an unused duplicate. Do not keep it as `ic_launcher_round` source.
- Do not ship the monochrome layer as a separate launcher icon; only `android:monochrome` uses it.
- No code changes are required: the icon is purely a resource swap. The version bump / release process is
  the owner's normal release flow.

## 3. Verification after copying

```powershell
cd C:\dev\ManHunt\android
./gradlew :app:lintDebug
./gradlew :app:assembleDebug
# install on a device/emulator and check: launcher (normal), launcher (round),
# Settings → Wallpaper & style → Themed icons on for ManHunt (monochrome layer), 48 dp legibility
```

Expected: no missing-density warnings; the icon reads at 48 dp on `#0B1220`; the themed monochrome layer
renders the mark silhouette only (no background). Reference renders:
`../final/install/install-page-icon-192.png` (full art) and `previews/01-open-zone/` in the identity root.

## 4. Integrity

`../MANIFEST.json` lists SHA-256 for every PNG/XML in this folder. `../verification-final.json` records
the automated checks (dimensions, palette, opacity, VectorDrawable structure, adaptive-icon structure).
