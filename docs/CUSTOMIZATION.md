# Customization

Everything below is user-facing and persisted on the device or in the room.

## In the app

Open **Settings** (gear on the home screen):

| Tab | What you can change |
|---|---|
| Appearance | Dark / light theme, text size (85%–135%) |
| Language | English / العربية — switches the whole UI to RTL with Arabic copy |
| Permissions | Location and notification status, with a shortcut to system settings |
| Account | Signed-in user, server address, sign out |

## Server address

The app talks to whatever server you point it at. Set it on the sign-in screen
under **Server**. Examples:

- Emulator: `http://10.0.2.2:8080`
- Phone on your LAN: `http://192.168.1.20:8080`
- Public: `https://your-domain.example`

The value is stored locally and used for both REST and WebSocket.

## Room settings (admin)

Before starting a match, the admin can change:

- head start (default 5 minutes),
- match duration (default 60 minutes),
- location report interval (default 5 minutes),
- hunter trails on/off,
- open play vs circular zone, plus optional shrinking and its step/interval.

These are enforced by the server; clients only send the change request.

## Forking

To build your own variant:

1. Change `applicationId` and `namespace` in `android/app/build.gradle.kts`.
2. Replace `res/values/strings.xml`-driven copy or extend
   `android/app/src/main/java/com/manhunt/app/i18n/Localization.kt` with your language.
3. Adjust the palette in `ui/theme/Theme.kt` (one accent, one prey colour, one hunter colour).
4. Point the default server at your deployment (`DEFAULT_SERVER_URL` build config field).

Keep the server-authoritative rules intact if you want fair multiplayer.
