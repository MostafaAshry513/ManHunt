package com.manhunt.app.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.SystemUpdate
import androidx.compose.material.icons.outlined.Translate
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import com.manhunt.app.data.UpdateManager
import com.manhunt.app.Graph
import com.manhunt.app.i18n.AppLanguage
import com.manhunt.app.i18n.t

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
    var tab by rememberSaveable { mutableIntStateOf(0) }

    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = t("Back"))
                }
                Text(
                    t("Settings"),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                )
            }

            Row(
                Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(0.dp),
            ) {
                SettingsTab.entries.forEachIndexed { index, entry ->
                    val selected = tab == index
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { tab = index }
                            .padding(vertical = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Icon(
                            entry.icon,
                            contentDescription = null,
                            modifier = Modifier.size(22.dp),
                            tint = if (selected) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            t(entry.label),
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                            color = if (selected) MaterialTheme.colorScheme.primary
                            else MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(4.dp))
                        Box(
                            Modifier
                                .width(20.dp)
                                .height(2.dp)
                                .background(
                                    if (selected) MaterialTheme.colorScheme.primary else Color.Transparent,
                                    RoundedCornerShape(1.dp),
                                ),
                        )
                    }
                }
            }

            Column(
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                when (SettingsTab.entries[tab]) {
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

@Composable
private fun AppearanceTab(
    dark: Boolean,
    storedScale: Float,
    onTheme: (Boolean) -> Unit,
    onScale: (Float) -> Unit,
) {
    var scale by remember(storedScale) { mutableFloatStateOf(storedScale) }

    ScreenCard {
        SectionLabel(t("Theme"))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = dark, onClick = { onTheme(true) }, label = { Text(t("Dark")) })
            FilterChip(selected = !dark, onClick = { onTheme(false) }, label = { Text(t("Light")) })
        }
    }

    ScreenCard {
        SectionLabel(t("Text size"))
        Text(
            "${(scale * 100).toInt()}%",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Slider(
            value = scale,
            onValueChange = { scale = it },
            onValueChangeFinished = { onScale(scale) },
            valueRange = 0.85f..1.35f,
            steps = 4,
        )
        Text(
            "Preview: the room, chat and buttons scale together.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            "Hunters see prey positions every few minutes.",
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun LanguageTab(language: AppLanguage, onLanguage: (AppLanguage) -> Unit) {
    ScreenCard {
        SectionLabel(t("Language"))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
    var downloaded by remember { mutableStateOf<java.io.File?>(null) }
    var status by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    ScreenCard {
        SectionLabel(t("Updates"))
        Text(
            "${t("Installed")} ${com.manhunt.app.BuildConfig.VERSION_NAME} (${com.manhunt.app.BuildConfig.VERSION_CODE})",
            style = MaterialTheme.typography.bodyMedium,
        )
        Button(
            onClick = {
                busy = true
                status = null
                scope.launch {
                    runCatching { repo.latestUpdate() }
                        .onSuccess {
                            latest = it
                            status = if (it.versionCode > com.manhunt.app.BuildConfig.VERSION_CODE) {
                                "${t("Update available")}: ${it.versionName}"
                            } else {
                                t("You are up to date")
                            }
                        }
                        .onFailure { status = it.message }
                    busy = false
                }
            },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth().height(50.dp),
        ) { Text(t("Check for updates")) }

        latest?.let { update ->
            if (update.versionCode > com.manhunt.app.BuildConfig.VERSION_CODE) {
                Text(
                    "v${update.versionName} · ${(update.size / 1024 / 1024)} MB",
                    style = MaterialTheme.typography.titleMedium,
                )
                update.notes?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Button(
                    onClick = {
                        busy = true
                        status = t("Downloading...")
                        scope.launch {
                            runCatching { manager.download(update) }
                                .onSuccess {
                                    downloaded = it
                                    status = t("Verified. Tap Install update.")
                                }
                                .onFailure { status = it.message }
                            busy = false
                        }
                    },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                ) { Text(t("Download update")) }
            }
        }

        downloaded?.let { file ->
            Button(
                onClick = { manager.install(file) },
                modifier = Modifier.fillMaxWidth().height(50.dp),
            ) { Text(t("Install update")) }
        }

        status?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text(
            t("Updates install over the current app (same signing key); Android will ask you to confirm once."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun PermissionsTab() {
    val context = LocalContext.current

    ScreenCard {
        SectionLabel(t("Location"))
        val granted = hasPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ||
            hasPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
        PermissionRow(
            icon = Icons.Outlined.LocationOn,
            title = t("Precise location"),
            granted = granted,
            explanation = t("Required while you play as Prey in an active match."),
            onOpenSettings = { openAppSettings(context) },
        )
    }

    ScreenCard {
        SectionLabel(t("Notifications"))
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasPermission(context, Manifest.permission.POST_NOTIFICATIONS)
        } else {
            true
        }
        PermissionRow(
            icon = Icons.Outlined.Notifications,
            title = t("Tracking notice"),
            granted = granted,
            explanation = t("Android requires a visible notification while location tracking is active."),
            onOpenSettings = { openAppSettings(context) },
        )
    }
}

@Composable
private fun PermissionRow(
    icon: ImageVector,
    title: String,
    granted: Boolean,
    explanation: String,
    onOpenSettings: () -> Unit,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Column(Modifier.weight(1f).padding(start = 12.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(
                if (granted) t("Allowed") else t("Not allowed"),
                style = MaterialTheme.typography.bodySmall,
                color = if (granted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
            )
        }
        OutlinedButton(onClick = onOpenSettings) { Text(t(if (granted) "Manage" else "Allow")) }
    }
    Text(
        explanation,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

@Composable
private fun AccountTab(username: String, serverUrl: String, onSignOut: () -> Unit) {
    ScreenCard {
        SectionLabel(t("Signed in as"))
        Text(username, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
    }
    ScreenCard {
        SectionLabel(t("Server"))
        Text(serverUrl, style = MaterialTheme.typography.bodyMedium)
        Text(
            t("To change the server, sign out and edit it on the sign-in screen."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
    Button(
        onClick = onSignOut,
        modifier = Modifier.fillMaxWidth().height(50.dp),
        shape = RoundedCornerShape(14.dp),
    ) { Text(t("Sign out")) }
    Spacer(Modifier.height(8.dp))
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
