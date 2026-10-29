package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import com.manhunt.app.i18n.t
import com.manhunt.app.data.ApiException
import com.manhunt.app.data.ManHuntRepository
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

    fun onRoomName(value: String) { ui = ui.copy(roomName = value, createError = null) }
    fun onJoinCode(value: String) { ui = ui.copy(joinCode = value.uppercase(), joinError = null) }
    fun consumeNavigation() { ui = ui.copy(enteredRoomId = null) }

    fun createRoom() {
        if (ui.busy) return
        val name = ui.roomName.trim().ifBlank { "ManHunt" }
        if (name.length < 2) {
            ui = ui.copy(createError = "Room name must be at least 2 characters")
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
        if (ui.joinCode.length != 6) {
            ui = ui.copy(joinError = "Enter the 6-character room code")
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
fun HomeScreen(onOpenRoom: (String) -> Unit, onOpenSettings: () -> Unit) {
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
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(t("MANHUNT"), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                    Text(
                        "Signed in as ${session?.user?.username ?: "..."}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                TextButton(onClick = { repo.logout() }) { Text(t("Sign out")) }
                IconButton(onClick = onOpenSettings, modifier = Modifier.testTag("home_settings")) {
                    Icon(Icons.Outlined.Settings, contentDescription = t("Settings"))
                }
            }

            ScreenCard {
                SectionLabel(t("Start a game"))
                Text(t("Become the room admin"), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                OutlinedTextField(
                    value = ui.roomName,
                    onValueChange = vm::onRoomName,
                    label = { Text(t("Room name")) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("home_room_name"),
                )
                Button(
                    onClick = vm::createRoom,
                    enabled = !ui.busy,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp).testTag("home_create"),
                ) { Text(t("Create room")) }
                ErrorBanner(ui.createError)
            }

            ScreenCard {
                SectionLabel(t("Join a game"))
                Text(t("Enter a friend's code"), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                OutlinedTextField(
                    value = ui.joinCode,
                    onValueChange = vm::onJoinCode,
                    label = { Text(t("Room code")) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("home_join_code"),
                )
                Button(
                    onClick = vm::joinRoom,
                    enabled = !ui.busy,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp).testTag("home_join"),
                ) { Text(t("Join room")) }
                ErrorBanner(ui.joinError)
            }
        }
    }
}
