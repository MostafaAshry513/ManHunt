package com.manhunt.app.ui

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Checklist
import androidx.compose.material.icons.outlined.GpsFixed
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Pets
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.manhunt.app.data.GameModeInfo
import com.manhunt.app.data.GameModes
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.ManHuntSpacing
import kotlinx.coroutines.launch

/**
 * The Roles page. It is the first screen of the app (first run only) and is also reachable
 * later from Home, so players can re-read what each side does.
 *
 * It is multi-page: one page per entry in the game-mode catalog. Classic is playable;
 * planned modes are shown with a "coming soon" note. Permissions (location + one-time
 * notifications) are requested here on the first run only, never mid-hunt.
 */
@Composable
fun RolesScreen(
    firstRun: Boolean,
    onClose: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val modes = remember { GameModes.all }
    val pagerState = rememberPagerState(pageCount = { modes.size })

    val permissions = remember {
        buildList {
            add(Manifest.permission.ACCESS_FINE_LOCATION)
            add(Manifest.permission.ACCESS_COARSE_LOCATION)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.toTypedArray()
    }
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { onClose() }

    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            if (!firstRun) {
                ScreenHeader(title = t("Roles"), onBack = onClose)
            }

            HorizontalPager(
                state = pagerState,
                modifier = Modifier.weight(1f).fillMaxWidth(),
            ) { page ->
                Column(
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(ManHuntSpacing.xl),
                    verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.lg),
                ) {
                    HeroBanner(
                        title = t(if (firstRun) "Welcome to ManHunt" else "Roles"),
                        subtitle = t(
                            if (firstRun) "Real-world hide-and-seek — here's how it works."
                            else "How each side plays, and what modes are coming."
                        ),
                        icon = Icons.Outlined.Pets,
                    )
                    ModePage(modes[page])
                }
            }

            Column(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = ManHuntSpacing.xl, vertical = ManHuntSpacing.md),
                verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm),
            ) {
                ModeDots(
                    count = modes.size,
                    selected = pagerState.currentPage,
                    onSelect = { scope.launch { pagerState.animateScrollToPage(it) } },
                )
                Text(
                    t("Swipe to see all modes · classic is playable today"),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
                if (firstRun) {
                    PrimaryButton(
                        text = t("Let's play"),
                        onClick = {
                            val missing = permissions.any {
                                ContextCompat.checkSelfPermission(context, it) !=
                                    android.content.pm.PackageManager.PERMISSION_GRANTED
                            }
                            if (missing) launcher.launch(permissions) else onClose()
                        },
                        modifier = Modifier.testTag("safety_accept"),
                        icon = Icons.Outlined.CheckCircle,
                    )
                } else {
                    SecondaryButton(text = t("Close"), onClick = onClose)
                }
                Text(
                    "ManHunt · ${t("Hide. Hunt. Survive.")}",
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun ModePage(mode: GameModeInfo) {
    Text(
        t(mode.name),
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
    )
    Text(
        t(mode.tagline),
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.primary,
    )

    if (!mode.available) {
        ScreenCard(title = t("Coming soon"), icon = Icons.Outlined.Info) {
            Text(
                t(mode.summary),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                t("Classic is the only playable mode right now."),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.tertiary,
            )
        }
        return
    }

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
        Text(
            "📍" + t(" Location access, so Prey can share their position and Hunters can use the map."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            "🔔" + t(" Notifications, so tag requests and the result reach you when the phone is in a pocket."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
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

@Composable
private fun ModeDots(count: Int, selected: Int, onSelect: (Int) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(count) { index ->
            Row(
                modifier = Modifier
                    .padding(horizontal = 4.dp)
                    .size(10.dp)
                    .background(
                        color = if (index == selected) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
                        shape = CircleShape,
                    ),
            ) {}
        }
    }
}
