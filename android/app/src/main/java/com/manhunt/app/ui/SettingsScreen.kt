package com.manhunt.app.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.SystemUpdate
import androidx.compose.material.icons.outlined.Translate
import androidx.compose.material.icons.outlined.Wifi
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.manhunt.app.Graph
import com.manhunt.app.data.UpdateManager
import com.manhunt.app.i18n.AppLanguage
import com.manhunt.app.i18n.t
import com.manhunt.app.i18n.translate
import com.manhunt.app.ui.theme.ManHuntRadius
import com.manhunt.app.ui.theme.ManHuntSpacing
import kotlinx.coroutines.launch

private enum class SettingsTab(val label: String, val icon: ImageVector) {
    Appearance("Appearance", Icons.Outlined.Palette),
    Language("Language", Icons.Outlined.Translate),
    Permissions("Permissions", Icons.Outlined.LocationOn),
    Updates("Updates", Icons.Outlined.SystemUpdate),
    Account("Account", Icons.Outlined.Person),
}

@Composable
fun SettingsScreen(onBack: () -> Unit) {
    val repo = Graph.container.repository
    val dark by repo.darkTheme.collectAsState()
    val storedScale by repo.textScale.collectAsState()
    val language by repo.language.collectAsState()
    val session by repo.session.collectAsState()
    val scope = rememberCoroutineScope()
    // Single source of truth: the pager. Tapping a tab starts a scroll directly, so rapid
    // taps simply re-target the animation instead of cancelling it mid-flight and sticking.
    val pagerState = rememberPagerState(pageCount = { SettingsTab.entries.size })

    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            ScreenHeader(title = t("Settings"), onBack = onBack)

            // Icon-only tabs: the labels were too tall/wordy for a phone header, so the
            // tab strip is compact and the icons stay centred; TalkBack still gets the
            // localized label through the content description.
            TabRow(
                selectedTabIndex = pagerState.currentPage,
                containerColor = MaterialTheme.colorScheme.surface,
                indicator = { tabPositions -> PagerTabIndicator(pagerState, tabPositions) },
            ) {
                SettingsTab.entries.forEachIndexed { index, entry ->
                    Tab(
                        selected = pagerState.currentPage == index,
                        onClick = { scope.launch { pagerState.animateScrollToPage(index) } },
                        icon = {
                            Icon(
                                entry.icon,
                                contentDescription = t(entry.label),
                                modifier = Modifier.padding(vertical = 2.dp),
                            )
                        },
                    )
                }
            }

            // Swipe between settings pages, synced with the tab strip above.
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.weight(1f).fillMaxWidth(),
            ) { page ->
                Column(
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = ManHuntSpacing.xl, vertical = ManHuntSpacing.lg),
                    verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.lg),
                ) {
                    when (SettingsTab.entries[page]) {
                        SettingsTab.Appearance -> AppearanceTab(
                            dark = dark,
                            storedScale = storedScale,
                            onTheme = repo::setDarkTheme,
                            onScale = repo::setTextScale,
                        )
                        SettingsTab.Language -> LanguageTab(
                            language = language,
                            onLanguage = repo::setLanguage,
                        )
                        SettingsTab.Permissions -> PermissionsTab()
                        SettingsTab.Updates -> UpdateTab()
                        SettingsTab.Account -> AccountTab(
                            username = session?.user?.username ?: "-",
                            serverUrl = repo.serverUrl,
                            onSignOut = { repo.logout() },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun AppearanceTab(
    dark: Boolean,
    storedScale: Float,
    onTheme: (Boolean) -> Unit,
    onScale: (Float) -> Unit,
) {
    var scale by remember(storedScale) { mutableFloatStateOf(storedScale) }

    ScreenCard(title = t("Theme"), icon = Icons.Outlined.Palette) {
        Row(horizontalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm)) {
            FilterChip(selected = dark, onClick = { onTheme(true) }, label = { Text(t("Dark")) })
            FilterChip(selected = !dark, onClick = { onTheme(false) }, label = { Text(t("Light")) })
        }
    }

    ScreenCard(title = t("Text size"), icon = Icons.Outlined.Person) {
        Text(
            "${(scale * 100).toInt()}%",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Slider(
            value = scale,
            // Preview-only update while dragging: only the sample text rescales live (via
            // LocalDensity below), so low-end phones do not re-theme the whole app on every
            // finger move. The choice is applied app-wide when the finger is released.
            onValueChange = { scale = it },
            onValueChangeFinished = { onScale(scale) },
            valueRange = 0.85f..1.35f,
            // steps=9 => 11 stops: 85, 90, 95, 100, 105, ... 135. Includes exactly 100%.
            steps = 9,
        )
        Text(
            t("Preview: the room, chat and buttons scale together."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        val density = LocalDensity.current
        CompositionLocalProvider(
            LocalDensity provides Density(density.density, density.fontScale * scale),
        ) {
            Surface(
                shape = RoundedCornerShape(ManHuntRadius.sm),
                color = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    t("Hunters see prey positions every few minutes."),
                    modifier = Modifier.padding(ManHuntSpacing.md),
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}

@Composable
private fun LanguageTab(language: AppLanguage, onLanguage: (AppLanguage) -> Unit) {
    ScreenCard(title = t("Language"), icon = Icons.Outlined.Translate) {
        Row(horizontalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm)) {
            FilterChip(
                selected = language == AppLanguage.English,
                onClick = { onLanguage(AppLanguage.English) },
                label = { Text("English") },
            )
            FilterChip(
                selected = language == AppLanguage.Arabic,
                onClick = { onLanguage(AppLanguage.Arabic) },
                label = { Text("العربية") },
            )
        }
        Text(
            t("Language applies immediately and mirrors the whole layout."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun UpdateTab() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val repo = Graph.container.repository
    val manager = remember {
        UpdateManager(context.applicationContext, Graph.container.httpClient, { repo.serverUrl })
    }
    var latest by remember { mutableStateOf<com.manhunt.app.data.AppUpdate?>(null) }
    var downloaded by remember {
        mutableStateOf(manager.pendingApk(com.manhunt.app.BuildConfig.VERSION_CODE))
    }
    var status by remember { mutableStateOf<String?>(null) }
    // One flag per action: the two buttons are independent, so pressing "Check for
    // updates" must not make "Download update" look busy as well.
    var checking by remember { mutableStateOf(false) }
    var downloading by remember { mutableStateOf(false) }
    val anyBusy = checking || downloading
    val downloadProgress by manager.progress.collectAsState()

    ScreenCard(title = t("Updates"), icon = Icons.Outlined.SystemUpdate) {
        Text(
            "${t("Installed")} ${com.manhunt.app.BuildConfig.VERSION_NAME} (${com.manhunt.app.BuildConfig.VERSION_CODE})",
            style = MaterialTheme.typography.bodyMedium,
        )
        PrimaryButton(
            text = if (checking) t("Checking...") else t("Check for updates"),
            onClick = {
                checking = true
                status = null
                scope.launch {
                    runCatching { repo.latestUpdate() }
                        .onSuccess {
                            latest = it
                            status = if (it.versionCode > com.manhunt.app.BuildConfig.VERSION_CODE) {
                                "${translate("Update available", repo.language.value)}: ${it.versionName}"
                            } else {
                                translate("You are up to date", repo.language.value)
                            }
                        }
                        .onFailure {
                            status = translate("Could not check for updates. Check your connection and try again.", repo.language.value)
                        }
                    checking = false
                }
            },
            enabled = !anyBusy,
            loading = checking,
        )

        latest?.let { update ->
            if (update.versionCode > com.manhunt.app.BuildConfig.VERSION_CODE) {
                Text(
                    "v${update.versionName} | ${(update.size / 1024 / 1024)} MB",
                    style = MaterialTheme.typography.titleMedium,
                )
                update.notes?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (downloaded == null) {
                    PrimaryButton(
                        text = t("Download update"),
                        onClick = {
                            downloading = true
                            status = null
                            scope.launch {
                                runCatching { manager.download(update) }
                                    .onSuccess {
                                        downloaded = it
                                        status = translate("Verified. Tap Install update.", repo.language.value)
                                    }
                                    .onFailure {
                                        status = translate("Download failed. Check your connection and try again.", repo.language.value)
                                    }
                                downloading = false
                            }
                        },
                        enabled = !anyBusy,
                        loading = downloading,
                    )
                }
            }
        }

        downloadProgress?.let { fraction ->
            if (fraction < 1f) {
                LinearProgressIndicator(
                    progress = { fraction },
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                )
                Text(
                    "${t("Downloading...")} ${(fraction * 100).toInt()}%",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        downloaded?.let {
            Text(
                t("Update ready to install"),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary,
            )
            PrimaryButton(
                text = t("Install update"),
                onClick = {
                    if (!manager.install(it)) {
                        status = translate(
                            "Allow installs from ManHunt, then tap Install update again.",
                            repo.language.value,
                        )
                    }
                },
                icon = Icons.Outlined.SystemUpdate,
            )
        }

        status?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text(
            t("Updates install over the current app. Android will ask you to confirm once."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun PermissionsTab() {
    val context = LocalContext.current

    ScreenCard(title = t("Location"), icon = Icons.Outlined.LocationOn) {
        val granted = hasPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ||
            hasPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
        PermissionRow(
            title = t("Precise location"),
            granted = granted,
            explanation = t("Required while you play as Prey in an active match."),
            onOpenSettings = { openAppSettings(context) },
        )
    }

    ScreenCard(title = t("Notifications"), icon = Icons.Outlined.Notifications) {
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasPermission(context, Manifest.permission.POST_NOTIFICATIONS)
        } else {
            true
        }
        PermissionRow(
            title = t("Tracking notice"),
            granted = granted,
            explanation = t("Android requires a visible notification while location tracking is active."),
            onOpenSettings = { openAppSettings(context) },
        )
        var matchNotifications by remember {
            mutableStateOf(MatchNotifier.enabled(context))
        }
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(t("Match notifications"), style = MaterialTheme.typography.bodyMedium)
                Text(
                    t("Get notified when someone claims a tag, a hunt starts or ends."),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Switch(
                checked = matchNotifications,
                onCheckedChange = {
                    matchNotifications = it
                    MatchNotifier.setEnabled(context, it)
                },
                modifier = Modifier.testTag("match_notifications_switch"),
            )
        }
    }
}

@Composable
private fun PermissionRow(
    title: String,
    granted: Boolean,
    explanation: String,
    onOpenSettings: () -> Unit,
) {
    // Icon lives in the card header only; repeating it on the row looked duplicated.
    InfoRow(label = title, value = t(if (granted) "Allowed" else "Not allowed"))
    Text(
        explanation,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    SecondaryButton(
        text = t(if (granted) "Manage" else "Allow"),
        onClick = onOpenSettings,
    )
}

@Composable
private fun AccountTab(username: String, serverUrl: String, onSignOut: () -> Unit) {
    ScreenCard(title = t("Account"), icon = Icons.Outlined.Person) {
        // Card header already carries the icon; rows are text-only so it is not repeated.
        InfoRow(
            label = t("Signed in as"),
            value = username,
        )
    }
    ScreenCard(title = t("Server"), icon = Icons.Outlined.Wifi) {
        InfoRow(
            label = t("Server"),
            value = serverUrl,
        )
        Text(
            t("To change the server, sign out and edit it on the sign-in screen."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
    SecondaryButton(
        text = t("Sign out"),
        onClick = onSignOut,
        contentColor = MaterialTheme.colorScheme.error,
    )
}

private fun hasPermission(context: Context, permission: String): Boolean =
    ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

private fun openAppSettings(context: Context) {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", context.packageName, null)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
}
