package com.manhunt.app.ui

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Checklist
import androidx.compose.material.icons.outlined.GpsFixed
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Pets
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.core.content.ContextCompat
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.ManHuntSpacing

/**
 * First-run welcome. Shown once, before the player ever sees the lobby:
 * it explains the two roles and how a real hunt plays out, and collects the
 * permissions the game needs up front (location + notifications) — instead of
 * interrupting a match later. Existing players have already accepted it, so the
 * screen stays a first-time-only experience.
 */
@Composable
fun WelcomeScreen(onAccept: () -> Unit) {
    val context = LocalContext.current
    val permissions = remember {
        buildList {
            add(Manifest.permission.ACCESS_FINE_LOCATION)
            add(Manifest.permission.ACCESS_COARSE_LOCATION)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.toTypedArray()
    }
    // The player can still decline; the app opens and permissions can be fixed later
    // from Settings → Permissions (or the in-match GPS fallback).
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { onAccept() }

    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            Column(
                Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(ManHuntSpacing.xl),
                verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.lg),
            ) {
                HeroBanner(
                    title = t("Welcome to ManHunt"),
                    subtitle = t("Real-world hide-and-seek — here's how it works."),
                    icon = Icons.Outlined.Pets,
                )

                ScreenCard(title = t("The two sides"), icon = Icons.Outlined.GpsFixed) {
                    Text(
                        t("Prey — you hide"),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.tertiary,
                    )
                    Text(
                        t(
                            "While the hunt is running, your phone shares your position with the Hunters at " +
                                "the interval the room set. Stay hidden and survive until the hunt ends — if at " +
                                "least one Prey is still free when the clock stops, Prey win."
                        ),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        t("Hunters — you chase"),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.secondary,
                    )
                    Text(
                        t(
                            "Hunters see the Prey's latest positions on the map (and their trails if the " +
                                "room allows it). Find them in the real world and tag them by touching them — " +
                                "each tag must be confirmed by the Prey. Tag every Prey to win."
                        ),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                ScreenCard(title = t("How a hunt runs"), icon = Icons.Outlined.Checklist) {
                    Text(
                        t(
                            "1. Create or join a room, then pick your side.\n" +
                                "2. Ready up. The huntmaster starts the hunt.\n" +
                                "3. Prey get a head start to hide; then hunting begins.\n" +
                                "4. Hunters tag Prey in person, and each tag is confirmed in the app.\n" +
                                "5. The hunt ends when the timer runs out or all Prey are tagged."
                        ),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }

                ScreenCard(title = t("What you need"), icon = Icons.Outlined.Info) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            "📍",
                            style = MaterialTheme.typography.bodyLarge,
                        )
                        Text(
                            t(" Location access, so Prey can share their position and Hunters can use the map."),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            "🔔",
                            style = MaterialTheme.typography.bodyLarge,
                        )
                        Text(
                            t(" Notifications, so tag requests and the result reach you when the phone is in a pocket."),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                        Text(
                            t("A safe place to play: this is a real-world game, played outdoors."),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                }

                ScreenCard(title = t("Play safe"), icon = Icons.Outlined.LocationOn) {
                    Text(
                        t(
                            "Respect property and local law, watch traffic, and never run while looking at your " +
                                "phone. ManHunt is a game — not an emergency, rescue or child-tracking service."
                        ),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            Column(
                Modifier
                    .fillMaxWidth()
                    .padding(ManHuntSpacing.xl),
                verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm),
            ) {
                PrimaryButton(
                    text = t("Let's play"),
                    onClick = {
                        val missing = permissions.any {
                            ContextCompat.checkSelfPermission(context, it) !=
                                android.content.pm.PackageManager.PERMISSION_GRANTED
                        }
                        if (missing) launcher.launch(permissions) else onAccept()
                    },
                    modifier = Modifier.testTag("safety_accept"),
                    icon = Icons.Outlined.CheckCircle,
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "ManHunt · ${t("Hide. Hunt. Survive.")}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }
    }
}
