package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Login
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.manhunt.app.Graph
import com.manhunt.app.data.ApiException
import com.manhunt.app.data.InputRules
import com.manhunt.app.data.ManHuntRepository
import com.manhunt.app.i18n.t
import com.manhunt.app.i18n.translate
import com.manhunt.app.ui.theme.ManHuntSizes
import com.manhunt.app.ui.theme.ManHuntSpacing
import kotlinx.coroutines.launch

data class HomeUi(
    val roomName: String = "",
    val joinCode: String = "",
    val busy: Boolean = false,
    val createError: String? = null,
    val joinError: String? = null,
    val enteredRoomId: String? = null,
)

class HomeViewModel(private val repo: ManHuntRepository) : ViewModel() {
    var ui by mutableStateOf(HomeUi())
        private set

    fun onRoomName(value: String) {
        ui = ui.copy(roomName = InputRules.roomName(value), createError = null)
    }

    fun onJoinCode(value: String) {
        ui = ui.copy(joinCode = InputRules.inviteCode(value), joinError = null)
    }
    fun consumeNavigation() { ui = ui.copy(enteredRoomId = null) }

    fun createRoom() {
        if (ui.busy) return
        val name = ui.roomName.trim().ifBlank { "ManHunt" }
        if (name.length < 2) {
            ui = ui.copy(createError = translate("Hunt name must be at least 2 characters", repo.language.value))
            return
        }
        ui = ui.copy(busy = true, createError = null)
        viewModelScope.launch {
            try {
                val state = repo.createRoom(name)
                ui = ui.copy(busy = false, enteredRoomId = state.room.id)
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, createError = e.message)
            }
        }
    }

    fun joinRoom() {
        if (ui.busy) return
        if (ui.joinCode.length != InputRules.INVITE_CODE_LENGTH) {
            ui = ui.copy(joinError = translate("Enter the 6-character invite code", repo.language.value))
            return
        }
        ui = ui.copy(busy = true, joinError = null)
        viewModelScope.launch {
            try {
                val state = repo.joinRoom(ui.joinCode)
                ui = ui.copy(busy = false, enteredRoomId = state.room.id)
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, joinError = e.message)
            }
        }
    }
}

@Composable
fun HomeScreen(onOpenRoom: (String) -> Unit, onOpenSettings: () -> Unit, onOpenRoles: () -> Unit) {
    val repo = Graph.container.repository
    val session by repo.session.collectAsState()
    val vm: HomeViewModel = viewModel(factory = viewModelFactory {
        initializer { HomeViewModel(repo) }
    })
    val ui = vm.ui

    LaunchedEffect(ui.enteredRoomId) {
        ui.enteredRoomId?.let {
            onOpenRoom(it)
            vm.consumeNavigation()
        }
    }

    Surface(Modifier.fillMaxSize()) {
        // Adaptive: cap the reading width on tablets/foldables while phones keep full width.
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        Column(
            Modifier
                .fillMaxWidth()
                .widthIn(max = 640.dp)
                .verticalScroll(rememberScrollState())
                .padding(ManHuntSpacing.screen),
            verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.lg),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(
                        t("MANHUNT"),
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        t("Hide. Hunt. Survive."),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                IconButton(
                    onClick = onOpenRoles,
                    modifier = Modifier.size(ManHuntSizes.touchTarget).testTag("home_roles"),
                ) {
                    Icon(Icons.Outlined.Info, contentDescription = t("Roles"))
                }
                IconButton(
                    onClick = onOpenSettings,
                    modifier = Modifier.size(ManHuntSizes.touchTarget).testTag("home_settings"),
                ) {
                    Icon(Icons.Outlined.Settings, contentDescription = t("Settings"))
                }
            }

            ScreenCard(
                title = t("Host a hunt"),
                subtitle = t("You set the rules. You call the hunt."),
                icon = Icons.Outlined.AddCircle,
            ) {
                ManHuntTextField(
                    value = ui.roomName,
                    onValueChange = vm::onRoomName,
                    label = t("Hunt name"),
                    enabled = !ui.busy,
                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Text,
                    imeAction = androidx.compose.ui.text.input.ImeAction.Done,
                    keyboardActions = KeyboardActions(onDone = { if (!ui.busy) vm.createRoom() }),
                    testTag = "home_room_name",
                )
                PrimaryButton(
                    text = t("Create hunt"),
                    onClick = vm::createRoom,
                    enabled = !ui.busy,
                    icon = Icons.Outlined.AddCircle,
                    modifier = Modifier.testTag("home_create"),
                )
                ErrorBanner(ui.createError)
            }

            ScreenCard(
                title = t("Join a hunt"),
                subtitle = t("Got an invite code?"),
                icon = Icons.Outlined.Login,
            ) {
                ManHuntTextField(
                    value = ui.joinCode,
                    onValueChange = vm::onJoinCode,
                    label = t("Invite code"),
                    enabled = !ui.busy,
                    placeholder = "ABC123",
                    supportingText = if (ui.joinCode.isNotEmpty() && ui.joinCode.length < InputRules.INVITE_CODE_LENGTH) {
                        t("Enter the 6-character invite code")
                    } else {
                        null
                    },
                    imeAction = androidx.compose.ui.text.input.ImeAction.Done,
                    keyboardActions = KeyboardActions(
                        onDone = { if (!ui.busy && ui.joinCode.length == InputRules.INVITE_CODE_LENGTH) vm.joinRoom() },
                    ),
                    testTag = "home_join_code",
                )
                PrimaryButton(
                    text = t("Join hunt"),
                    onClick = vm::joinRoom,
                    enabled = !ui.busy && ui.joinCode.length == InputRules.INVITE_CODE_LENGTH,
                    icon = Icons.Outlined.Login,
                    modifier = Modifier.testTag("home_join"),
                )
                ErrorBanner(ui.joinError)
            }

            ScreenCard(
                title = t("How it works"),
                subtitle = t("Roles, modes and safety"),
                icon = Icons.Outlined.Info,
            ) {
                Text(
                    t("Prey hide. Hunters track them down and tag them in person."),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                SecondaryButton(
                    text = t("Read the roles"),
                    onClick = onOpenRoles,
                    icon = Icons.Outlined.Info,
                    modifier = Modifier.testTag("home_roles_card"),
                )
            }

            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    t("Signed in as") + " " + (session?.user?.username ?: "-"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                )
                TextButton(
                    onClick = { repo.logout() },
                    modifier = Modifier.heightIn(min = ManHuntSizes.touchTarget),
                ) {
                    Icon(
                        Icons.AutoMirrored.Outlined.Logout,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                    )
                    Spacer(Modifier.width(ManHuntSpacing.xs))
                    Text(t("Sign out"))
                }
            }
        }
        }
    }
}
