package com.manhunt.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.manhunt.app.BuildConfig
import com.manhunt.app.Graph
import com.manhunt.app.data.ApiException
import com.manhunt.app.data.InputRules
import com.manhunt.app.data.ManHuntRepository
import com.manhunt.app.i18n.t
import com.manhunt.app.i18n.translate
import com.manhunt.app.ui.theme.BoardSpace
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntType
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.coroutines.delay
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

    // Real device local time, refreshed once a minute (data face, not decoration fantasy).
    var clock by remember {
        mutableStateOf(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm", Locale.getDefault())))
    }
    LaunchedEffect(Unit) {
        while (true) {
            delay(30_000L)
            clock = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm", Locale.getDefault()))
        }
    }

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .widthIn(max = 560.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            Masthead(clock = clock, onOpenSettings = onOpenSettings)
            // The field plate is the brand introduction. It animates only when the screen is
            // RESUMED and reduced motion is off; the static first frame is the returning state.
            BrandFieldPlate(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .testTag("home_field_plate"),
                animate = true,
            )
            Column(
                Modifier.padding(horizontal = BoardSpace.screen),
                verticalArrangement = Arrangement.spacedBy(BoardSpace.s8),
            ) {
                Spacer(Modifier.height(BoardSpace.s6))
                Text(
                    "Tonight / $clock",
                    style = ManHuntType.data(),
                    color = MaterialTheme.colorScheme.primary,
                )
                HeadingText(t("Start something."), style = ManHuntType.displayL())

                // Host block: two verbs, no plate. The button is the only cyan surface.
                Text(
                    t("Host a hunt"),
                    style = ManHuntType.title(),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier
                        .semantics { heading() }
                        .testTag("home_host_section"),
                )
                PlateTextField(
                    value = ui.roomName,
                    onValueChange = vm::onRoomName,
                    label = t("Hunt name"),
                    enabled = !ui.busy,
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Done,
                    keyboardActions = KeyboardActions(onDone = { if (!ui.busy) vm.createRoom() }),
                    testTag = "home_room_name",
                )
                ErrorStrip(
                    message = ui.createError,
                    onRetry = vm::createRoom,
                    testTag = "home_create_error",
                )
                BoardButton(
                    text = t("Create hunt"),
                    onClick = vm::createRoom,
                    enabled = !ui.busy,
                    loading = ui.busy,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("home_create"),
                )

                ChalkRule()

                Text(
                    t("Join a hunt"),
                    style = ManHuntType.title(),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier
                        .semantics { heading() }
                        .testTag("home_join_section"),
                )
                CodePlate(
                    code = ui.joinCode,
                    onCodeChange = vm::onJoinCode,
                    testTag = "home_join_code",
                )
                if (ui.joinCode.isNotEmpty() && ui.joinCode.length < InputRules.INVITE_CODE_LENGTH) {
                    Text(
                        t("Enter the 6-character invite code"),
                        style = ManHuntType.bodySmall(),
                        color = BoardTheme.muted(),
                    )
                }
                ErrorStrip(
                    message = ui.joinError,
                    onRetry = vm::joinRoom,
                    testTag = "home_join_error",
                )
                BoardButton(
                    text = t("Join hunt"),
                    onClick = vm::joinRoom,
                    tone = BoardButtonTone.Outline,
                    enabled = !ui.busy && ui.joinCode.length == InputRules.INVITE_CODE_LENGTH,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("home_join"),
                )

                ChalkRule()

                Row(
                    Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    InlineLink(
                        text = t("Read the roles"),
                        onClick = onOpenRoles,
                        modifier = Modifier.testTag("home_roles_card"),
                    )
                    Spacer(Modifier.weight(1f))
                    session?.user?.username?.let { name ->
                        Text(
                            t("Playing as") + " " + name,
                            style = ManHuntType.bodySmall(),
                            color = BoardTheme.muted(),
                            maxLines = 1,
                        )
                        Spacer(Modifier.width(BoardSpace.s4))
                    }
                    InlineLink(
                        text = t("Sign out"),
                        onClick = { repo.logout() },
                        modifier = Modifier.testTag("home_signout"),
                    )
                }
                Text(
                    "v" + BuildConfig.VERSION_NAME + " · free APK · Android 8+",
                    style = ManHuntType.dataSmall(),
                    color = BoardTheme.muted(),
                )
                Spacer(Modifier.height(BoardSpace.s10))
            }
        }
    }
}
