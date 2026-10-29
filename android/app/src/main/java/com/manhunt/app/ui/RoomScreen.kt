package com.manhunt.app.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.manhunt.app.Graph
import com.manhunt.app.i18n.t
import com.manhunt.app.data.ApiException
import com.manhunt.app.data.ChatMessage
import com.manhunt.app.data.LatestLocations
import com.manhunt.app.data.LiveLocation
import com.manhunt.app.data.ManHuntRepository
import com.manhunt.app.data.MatchHistoryEntry
import com.manhunt.app.data.Phases
import com.manhunt.app.data.RoomSocket
import com.manhunt.app.data.RoomState
import com.manhunt.app.data.SocketEvent
import com.manhunt.app.data.TagDto
import com.manhunt.app.data.Teams
import com.manhunt.app.data.TrailPoint
import com.manhunt.app.location.TrackingService
import com.manhunt.app.map.MatchMap
import com.manhunt.app.ui.theme.Motion
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class RoomUi(
    val state: RoomState? = null,
    val messages: List<ChatMessage> = emptyList(),
    val locations: LatestLocations? = null,
    val trails: Map<String, List<TrailPoint>> = emptyMap(),
    val trailsVisible: Boolean = false,
    val pendingTag: TagDto? = null,
    val pendingDispute: TagDto? = null,
    val notice: String? = null,
    val history: List<MatchHistoryEntry> = emptyList(),
    val historyLoaded: Boolean = false,
    val connected: Boolean = false,
    val loading: Boolean = true,
    val busy: Boolean = false,
    val error: String? = null,
    val chatDraft: String = "",
    val left: Boolean = false,
)

class RoomViewModel(
    private val repo: ManHuntRepository,
    private val roomId: String,
) : ViewModel() {

    var ui by mutableStateOf(RoomUi())
        private set

    private var started = false
    private var pollJob: kotlinx.coroutines.Job? = null

    private val socket = RoomSocket(Graph.container.httpClient) { event ->
        when (event) {
            is SocketEvent.Room -> ui = ui.copy(state = event.state, loading = false)
            is SocketEvent.Chat -> refresh(silent = true)
            is SocketEvent.PreyLocation -> refresh(silent = true)
            is SocketEvent.TagRequest -> ui = ui.copy(pendingTag = event.tag)
            is SocketEvent.TagDisputed -> ui = ui.copy(pendingDispute = event.tag)
            is SocketEvent.Connection -> ui = ui.copy(connected = event.connected)
        }
    }

    init {
        // Lifecycle is driven explicitly by the screen so leaving a room cannot leak
        // a socket or a polling loop (see docs/ANDROID_REVIEW.md A1).
        refresh()
    }

    fun start() {
        if (started) return
        started = true
        repo.currentToken()?.let { socket.connect(Graph.container.serverUrl, it, roomId) }
        pollJob = viewModelScope.launch {
            while (isActive) {
                delay(10_000)
                refresh(silent = true)
            }
        }
    }

    fun stop() {
        started = false
        pollJob?.cancel()
        pollJob = null
        socket.close()
    }

    override fun onCleared() {
        stop()
    }

    fun refresh(silent: Boolean = false) {
        viewModelScope.launch {
            try {
                val state = repo.room(roomId)
                val me = state.members.firstOrNull { it.userId == repo.myUserId() }
                val locations = if (me?.team == Teams.HUNTERS && state.match?.phase == Phases.HUNTING) {
                    runCatching { repo.latestLocations(state.match.id) }.getOrNull()
                } else {
                    null
                }
                val messages = repo.messages(roomId)
                ui = ui.copy(
                    state = state,
                    messages = messages,
                    locations = locations,
                    loading = false,
                    error = if (silent) ui.error else null,
                )
            } catch (e: ApiException) {
                if (!silent) ui = ui.copy(loading = false, error = e.message)
                if (e.status == 401) ui = ui.copy(left = true)
            }
        }
    }

    fun setTeam(team: String) {
        if (ui.busy) return
        ui = ui.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                ui = ui.copy(state = repo.setTeam(roomId, team), busy = false)
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
        }
    }

    fun toggleReady() {
        val me = ui.state?.members?.firstOrNull { it.userId == repo.myUserId() }
        if (ui.busy) return
        ui = ui.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                ui = ui.copy(state = repo.setReady(roomId, !(me?.ready ?: false)), busy = false)
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
        }
    }

    fun startMatch() {
        if (ui.busy) return
        ui = ui.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                ui = ui.copy(state = repo.startMatch(roomId), busy = false)
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
        }
    }

    fun sendChat(text: String) {
        val body = text.trim()
        if (body.isEmpty() || ui.busy) return
        ui = ui.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                repo.sendMessage(roomId, body)
                ui = ui.copy(messages = repo.messages(roomId), busy = false)
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
        }
    }

    fun claimTag(preyId: String) {
        if (ui.busy) return
        ui = ui.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                repo.requestTag(roomId, preyId)
                ui = ui.copy(busy = false, notice = "Tag claim sent - waiting for the prey to confirm")
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
        }
    }

    fun confirmIncomingTag() {
        val tag = ui.pendingTag ?: return
        ui = ui.copy(busy = true, pendingTag = null)
        viewModelScope.launch {
            try {
                repo.confirmTag(tag.id)
                ui = ui.copy(busy = false, notice = "Tag confirmed")
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
            refresh(silent = true)
        }
    }

    fun disputeIncomingTag() {
        val tag = ui.pendingTag ?: return
        ui = ui.copy(busy = true, pendingTag = null)
        viewModelScope.launch {
            try {
                repo.disputeTag(tag.id)
                ui = ui.copy(busy = false, notice = "Tag disputed - the admin will decide")
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
            refresh(silent = true)
        }
    }

    fun clearNotice() { ui = ui.copy(notice = null) }

    fun pauseMatch() = act { repo.pauseMatch(roomId) }

    fun resumeMatch() = act { repo.resumeMatch(roomId) }

    fun endMatch() = act { repo.endMatch(roomId) }

    fun resolveDisputed(decision: String) {
        val tag = ui.pendingDispute ?: return
        ui = ui.copy(busy = true, pendingDispute = null)
        viewModelScope.launch {
            try {
                repo.resolveTag(tag.id, decision)
                ui = ui.copy(busy = false, notice = "Disputed tag $decision")
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
            refresh(silent = true)
        }
    }

    fun loadHistory() {
        viewModelScope.launch {
            try {
                ui = ui.copy(history = repo.history(roomId).matches, historyLoaded = true)
            } catch (e: ApiException) {
                ui = ui.copy(error = e.message, historyLoaded = true)
            }
        }
    }

    /** Trails are fetched on demand (one request per prey), only for hunters. */
    fun toggleTrails() {
        if (ui.trailsVisible) {
            ui = ui.copy(trailsVisible = false, trails = emptyMap())
            return
        }
        val matchId = ui.state?.match?.id ?: return
        val prey = ui.state?.members?.filter { it.team == Teams.PREY } ?: emptyList()
        viewModelScope.launch {
            val collected = mutableMapOf<String, List<TrailPoint>>()
            for (member in prey) {
                runCatching { repo.trail(matchId, member.userId) }
                    .getOrNull()
                    ?.takeIf { it.trailEnabled }
                    ?.let { if (it.points.isNotEmpty()) collected[member.userId] = it.points }
            }
            ui = ui.copy(
                trails = collected,
                trailsVisible = true,
                notice = if (collected.isEmpty()) "No trails available yet" else null,
            )
        }
    }

    fun saveSettings(patch: kotlinx.serialization.json.JsonObject) {
        if (ui.busy) return
        ui = ui.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                ui = ui.copy(state = repo.updateSettings(roomId, patch), busy = false, notice = "Settings saved")
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
        }
    }

    private fun act(block: suspend () -> RoomState) {
        if (ui.busy) return
        ui = ui.copy(busy = true, error = null)
        viewModelScope.launch {
            try {
                ui = ui.copy(state = block(), busy = false)
            } catch (e: ApiException) {
                ui = ui.copy(busy = false, error = e.message)
            }
        }
    }

    fun leave() {
        viewModelScope.launch {
            runCatching { repo.leaveRoom(roomId) }
            ui = ui.copy(left = true)
        }
    }
}

private fun hasLocationPermission(context: Context): Boolean {
    val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
    val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
    return fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED
}

private fun openAppSettings(context: Context) {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", context.packageName, null)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
}

@Composable
fun RoomScreen(roomId: String, onBack: () -> Unit) {
    val repo = Graph.container.repository
    val context = LocalContext.current
    val vm: RoomViewModel = viewModel(key = roomId, factory = viewModelFactory {
        initializer { RoomViewModel(repo, roomId) }
    })
    val ui = vm.ui

    LaunchedEffect(ui.left) { if (ui.left) onBack() }
    BackHandler { vm.leave() }

    LaunchedEffect(Unit) {
        vm.start()
        vm.refresh()
    }
    DisposableEffect(Unit) {
        onDispose { vm.stop() }
    }

    val state = ui.state
    val match = state?.match
    val me = state?.members?.firstOrNull { it.userId == repo.myUserId() }
    val ownLocation by LiveLocation.current.collectAsState()

    var hasLocation by remember { mutableStateOf(hasLocationPermission(context)) }
    var locationDenied by remember { mutableStateOf(false) }
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { result ->
        hasLocation = result[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            result[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        locationDenied = !hasLocation
    }
    val trackingPermissions = remember {
        buildList {
            add(Manifest.permission.ACCESS_FINE_LOCATION)
            add(Manifest.permission.ACCESS_COARSE_LOCATION)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.toTypedArray()
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    var resumed by remember {
        mutableStateOf(lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED))
    }
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, _ ->
            resumed = lifecycleOwner.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val matchId = match?.id
    val phase = match?.phase
    val intervalSec = state?.room?.settings?.locationIntervalSec ?: 300
    val activePhase = phase == Phases.HEAD_START || phase == Phases.HUNTING

    // Start tracking while the app is visible: starting a location FGS from the background
    // is illegal on Android 12+ (docs/ANDROID_REVIEW.md A2). Starting during head start also
    // means hunters have reports as soon as hunting begins (A3).
    LaunchedEffect(hasLocation, matchId, phase, me?.team, me?.eliminated, resumed) {
        val shouldTrack = hasLocation && me?.team == Teams.PREY && me?.eliminated != true &&
            matchId != null && activePhase && resumed
        if (shouldTrack) {
            TrackingService.start(context, matchId!!, intervalSec)
        } else if (!activePhase || me?.eliminated == true) {
            TrackingService.stop(context)
        }
    }
    DisposableEffect(Unit) {
        onDispose { TrackingService.stop(context) }
    }

    var tab by rememberSaveable { mutableIntStateOf(0) }
    var lastSeen by rememberSaveable { mutableIntStateOf(0) }
    val unread = (ui.messages.size - lastSeen).coerceAtLeast(0)

    LaunchedEffect(tab, ui.messages.size) {
        if (tab == 1) lastSeen = ui.messages.size
    }
    var showTagPicker by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }
    var showHistory by remember { mutableStateOf(false) }
    var showEndConfirm by remember { mutableStateOf(false) }

    if (showEndConfirm) {
        AlertDialog(
            onDismissRequest = { showEndConfirm = false },
            title = { Text(t("End the match?")) },
            text = { Text(t("This finishes the match for everyone and returns the room to the lobby.")) },
            confirmButton = {
                TextButton(onClick = {
                    showEndConfirm = false
                    vm.endMatch()
                }) { Text(t("End match")) }
            },
            dismissButton = { TextButton(onClick = { showEndConfirm = false }) { Text(t("Cancel")) } },
        )
    }

    if (me?.isAdmin == true) {
        ui.pendingDispute?.let { tag ->
            val hunter = state?.members?.firstOrNull { it.userId == tag.hunterId }?.username ?: "A hunter"
            val prey = state?.members?.firstOrNull { it.userId == tag.preyId }?.username ?: "a prey"
            AlertDialog(
                onDismissRequest = { },
                title = { Text(t("Disputed tag")) },
                text = { Text("$hunter says they tagged $prey, and $prey disputes it. Confirm or reject the tag.") },
                confirmButton = { TextButton(onClick = { vm.resolveDisputed("confirmed") }) { Text(t("Confirm tag")) } },
                dismissButton = { TextButton(onClick = { vm.resolveDisputed("rejected") }) { Text(t("Reject")) } },
            )
        }
    }

    if (showHistory) {
        HistoryDialog(matches = ui.history, onDismiss = { showHistory = false })
    }

    if (showSettings && state != null) {
        RoomSettingsDialog(
            state = state,
            currentLocation = ownLocation,
            onSave = { patch ->
                showSettings = false
                vm.saveSettings(patch)
            },
            onDismiss = { showSettings = false },
        )
    }

    ui.pendingTag?.let { tag ->
        val hunter = state?.members?.firstOrNull { it.userId == tag.hunterId }?.username ?: "A hunter"
        AlertDialog(
            onDismissRequest = { },
            title = { Text(t("Tag claim")) },
            text = { Text("$hunter says they physically touched you. Confirm the tag?") },
            confirmButton = { TextButton(onClick = vm::confirmIncomingTag) { Text(t("Confirm")) } },
            dismissButton = { TextButton(onClick = vm::disputeIncomingTag) { Text(t("Dispute")) } },
        )
    }

    if (showTagPicker && state != null) {
        val targets = state.members.filter { it.team == Teams.PREY && !it.eliminated }
        AlertDialog(
            onDismissRequest = { showTagPicker = false },
            title = { Text(t("Who did you touch?")) },
            text = {
                Column(
                    modifier = Modifier
                        .heightIn(max = 360.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    if (targets.isEmpty()) Text(t("No eligible prey"))
                    targets.forEach { target ->
                        TextButton(onClick = {
                            showTagPicker = false
                            vm.claimTag(target.userId)
                        }) { Text(target.username) }
                    }
                    Text(
                        "You must be physically touching the prey. False claims can be disputed.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            },
            confirmButton = { TextButton(onClick = { showTagPicker = false }) { Text(t("Cancel")) } },
        )
    }

    Surface(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(onClick = vm::leave) { Text(t("Leave")) }
                Column(Modifier.weight(1f)) {
                    Text(
                        state?.room?.name ?: "Room",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
            TabRow(selectedTabIndex = tab, containerColor = MaterialTheme.colorScheme.surface) {
                Tab(
                    selected = tab == 0,
                    onClick = { tab = 0 },
                    icon = { Icon(Icons.Outlined.SportsEsports, contentDescription = null) },
                    text = { Text(t("Game")) },
                )
                Tab(
                    selected = tab == 1,
                    onClick = {
                        tab = 1
                        lastSeen = ui.messages.size
                    },
                    icon = {
                        BadgedBox(badge = {
                            if (unread > 0) Badge { Text(unread.toString()) }
                        }) {
                            Icon(Icons.AutoMirrored.Outlined.Chat, contentDescription = null)
                        }
                    },
                    text = { Text(t("Chat")) },
                )
            }

                        if (state == null) {
                            Text(
                                "Connecting",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        } else {
                            Text(
                                state.room.code,
                                style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier
                                    .background(
                                        MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                                        RoundedCornerShape(6.dp),
                                    )
                                    .padding(horizontal = 8.dp, vertical = 3.dp),
                            )
                            Box(
                                Modifier
                                    .size(7.dp)
                                    .background(
                                        if (ui.connected) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                        CircleShape,
                                    ),
                            )
                            Text(
                                if (ui.connected) "Live" else "Polling",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
                if (ui.loading) ManHuntLoader(size = 18.dp)
                TextButton(onClick = {
                    vm.loadHistory()
                    showHistory = true
                }) { Text(t("History")) }
            }

            if (state == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        ManHuntLoader(size = 36.dp)
                        Spacer(Modifier.height(14.dp))
                        Text(
                            "Connecting to room",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                return@Surface
            }

            if (tab == 0) {
                LazyColumn(
                // weight, not fillMaxSize: the chat composer must keep its height (UI-01).
                modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                item(key = "error") { ErrorBanner(ui.error) }
                item(key = "notice") {
                    AnimatedVisibility(
                        visible = ui.notice != null,
                        enter = fadeIn(tween(Motion.STANDARD, easing = Motion.EaseOutExpo)) +
                            expandVertically(tween(Motion.STANDARD, easing = Motion.EaseOutExpo)),
                        exit = fadeOut(tween(Motion.QUICK, easing = Motion.EaseInOut)) +
                            shrinkVertically(tween(Motion.STANDARD, easing = Motion.EaseInOut)),
                    ) {
                        TextButton(onClick = vm::clearNotice) {
                            Text(ui.notice.orEmpty(), style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }

                item(key = "phase") { PhaseCard(state, me?.isAdmin == true) }

                if (me?.eliminated == true && phase == Phases.HUNTING) {
                    item {
                        ScreenCard {
                            Text(t("You were tagged"), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                            Text(
                                "You are spectating this match. You can still chat, but you cannot tag or share new positions.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }

                if (match != null) {
                    item(key = "map") {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            MatchMap(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(1.4f)
                                    .heightIn(max = 320.dp),
                                ownLocation = ownLocation,
                                prey = ui.locations?.prey ?: emptyList(),
                                zone = match.zone,
                                showPrey = me?.team == Teams.HUNTERS,
                                trails = if (ui.trailsVisible) ui.trails else emptyMap(),
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    when {
                                        me?.team == Teams.HUNTERS -> "Prey positions are the latest reports"
                                        activePhase && hasLocation && resumed -> "Sharing your position"
                                        activePhase && hasLocation -> "Open the app to resume sharing"
                                        activePhase -> "Location off"
                                        else -> "Map"
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.weight(1f),
                                )
                                if (me?.team == Teams.PREY && activePhase && !hasLocation) {
                                    if (locationDenied) {
                                        // Android stops showing the dialog after two denials;
                                        // the only way back is app settings.
                                        TextButton(onClick = { openAppSettings(context) }) {
                                            Text(t("Allow in settings"))
                                        }
                                    } else {
                                        TextButton(onClick = {
                                            permissionLauncher.launch(trackingPermissions)
                                        }) { Text(t("Enable GPS")) }
                                    }
                                }
                                if (me?.team == Teams.HUNTERS && phase == Phases.HUNTING) {
                                    TextButton(onClick = vm::toggleTrails) {
                                        Text(if (ui.trailsVisible) "Hide trails" else "Trails")
                                    }
                                    TextButton(onClick = { showTagPicker = true }) { Text(t("Tag prey")) }
                                }
                            }
                            if (ui.locations?.prey?.isNotEmpty() == true && me?.team == Teams.HUNTERS) {
                                // Text alternative to the map (UI-03) and per-player staleness (UI-08).
                                ui.locations!!.prey.forEach { p ->
                                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                        Text(p.username, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                                        val label = when {
                                            !p.hasReport -> "No report"
                                            p.eliminated -> "Tagged"
                                            p.flagged -> "Unverified"
                                            p.stale -> "Stale"
                                            else -> "Live"
                                        }
                                        val tint = when {
                                            !p.hasReport || p.stale -> MaterialTheme.colorScheme.tertiary
                                            p.eliminated -> MaterialTheme.colorScheme.error
                                            p.flagged -> MaterialTheme.colorScheme.tertiary
                                            else -> MaterialTheme.colorScheme.primary
                                        }
                                        Text(label, style = MaterialTheme.typography.labelSmall, color = tint)
                                    }
                                }
                            }
                            if (ui.locations?.prey?.any { it.stale } == true) {
                                Text(
                                    "Some prey reports are stale (older than two intervals).",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.tertiary,
                                )
                            }
                        }
                    }
                }

                item {
                    ScreenCard {
                        SectionLabel(t("Players (${state.members.size})"))
                        state.members.forEach { member ->
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(member.username, fontWeight = FontWeight.SemiBold)
                                        if (member.isAdmin) {
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                "ADMIN",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.primary,
                                            )
                                        }
                                        if (member.eliminated) {
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                "TAGGED",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.error,
                                            )
                                        }
                                        if (!member.connected) {
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                "offline",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            )
                                        }
                                    }
                                    Text(
                                        if (member.ready) "Ready" else "Not ready",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (member.ready) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                TeamPill(member.team)
                            }
                            Spacer(Modifier.height(10.dp))
                        }
                    }
                }

                item {
                    ScreenCard {
                        SectionLabel(t("Your setup"))
                        val lobby = state.room.status == "lobby"
                        val ready = me?.ready == true
                        val readyBg by animateColorAsState(
                            targetValue = if (ready) MaterialTheme.colorScheme.surfaceVariant
                            else MaterialTheme.colorScheme.primary,
                            animationSpec = tween(Motion.STANDARD, easing = Motion.EaseOutExpo),
                            label = "ready-bg",
                        )
                        val readyFg by animateColorAsState(
                            targetValue = if (ready) MaterialTheme.colorScheme.onSurfaceVariant
                            else MaterialTheme.colorScheme.onPrimary,
                            animationSpec = tween(Motion.STANDARD, easing = Motion.EaseOutExpo),
                            label = "ready-fg",
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(
                                selected = me?.team == Teams.PREY,
                                onClick = { vm.setTeam(Teams.PREY) },
                                label = { Text(t("Prey")) },
                                enabled = lobby,
                            )
                            FilterChip(
                                selected = me?.team == Teams.HUNTERS,
                                onClick = { vm.setTeam(Teams.HUNTERS) },
                                label = { Text(t("Hunters")) },
                                enabled = lobby,
                            )
                        }

                        Button(
                            onClick = vm::toggleReady,
                            enabled = lobby && !ui.busy,
                            modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = readyBg,
                                contentColor = readyFg,
                            ),
                        ) {
                            Text(if (me?.ready == true) "Cancel ready" else "I'm ready")
                        }

                        if (me?.isAdmin == true && lobby) {
                            OutlinedButton(
                                onClick = { showSettings = true },
                                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                            ) { Text(t("Match settings")) }

                            val blockers = startBlockers(state)
                            OutlinedButton(
                                onClick = vm::startMatch,
                                enabled = blockers.isEmpty() && !ui.busy,
                                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                            ) { Text(t("Start match")) }
                            if (blockers.isNotEmpty()) {
                                Text(
                                    blockers.joinToString(" - "),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }

                        if (me?.isAdmin == true && phase == Phases.HUNTING) {
                            OutlinedButton(
                                onClick = vm::pauseMatch,
                                enabled = !ui.busy,
                                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                            ) { Text(t("Pause match")) }
                        }
                        if (me?.isAdmin == true && phase == Phases.PAUSED) {
                            OutlinedButton(
                                onClick = vm::resumeMatch,
                                enabled = !ui.busy,
                                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                            ) { Text(t("Resume match")) }
                        }

                        if (me?.isAdmin == true && (phase == Phases.HUNTING || phase == Phases.PAUSED)) {
                            OutlinedButton(
                                onClick = { showEndConfirm = true },
                                enabled = !ui.busy,
                                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                            ) { Text(t("End match")) }
                        }
                    }
                }

                }
            } else {
                ChatPanel(
                    messages = ui.messages,
                    myUserId = repo.myUserId(),
                    sending = ui.busy,
                    onSend = vm::sendChat,
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun PhaseCard(state: RoomState, isAdmin: Boolean) {
    val match = state.match
    var tick by remember { mutableIntStateOf(0) }
    LaunchedEffect(match?.id, match?.phase) {
        if (match?.phase != Phases.HEAD_START && match?.phase != Phases.HUNTING) return@LaunchedEffect
        while (true) {
            delay(1_000)
            tick += 1
        }
    }
    @Suppress("UNUSED_EXPRESSION") tick

    val phase = when {
        state.room.status == "lobby" &&
            (match == null || match.phase == Phases.FINISHED || match.phase == Phases.CANCELLED) -> Phases.LOBBY
        else -> match?.phase ?: Phases.LOBBY
    }

    ScreenCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            SectionLabel(t("Match"))
            Spacer(Modifier.weight(1f))
            val color: Color = when (phase) {
                Phases.HUNTING -> MaterialTheme.colorScheme.tertiary
                Phases.HEAD_START -> MaterialTheme.colorScheme.primary
                Phases.FINISHED -> MaterialTheme.colorScheme.secondary
                else -> MaterialTheme.colorScheme.onSurfaceVariant
            }
            Text(
                phase.replace('_', ' ').uppercase(),
                style = MaterialTheme.typography.labelMedium,
                color = color,
                fontWeight = FontWeight.Bold,
            )
        }

        val offset = remember(match?.id, match?.now) {
        (match?.now ?: 0L) - System.currentTimeMillis()
    }
        val target = when (phase) {
            Phases.HEAD_START -> match?.headStartEndsAt
            Phases.HUNTING -> match?.endsAt
            else -> null
        }

        Text(
            when (phase) {
                Phases.LOBBY -> if (isAdmin) "Set teams, then start when everyone is ready." else "Waiting for the admin to start."
                Phases.HEAD_START -> "Prey are hiding. Hunting starts in ${remaining(target, offset)}"
                Phases.HUNTING -> "Hunting. ${remaining(target, offset)} left. Prey alive: ${match?.preyAlive ?: 0}/${match?.preyTotal ?: 0}"
                Phases.PAUSED -> "Match paused by the admin. The clock is stopped."
                Phases.FINISHED -> "Match over - ${if (match?.winner == Teams.HUNTERS) "Hunters win" else "Prey win"}"
                Phases.CANCELLED -> "Match cancelled"
                else -> "In progress"
            },
            style = MaterialTheme.typography.bodyMedium,
        )

        match?.zone?.let { zone ->
            Text(
                "Zone: ${zone.radiusM.toInt()} m radius",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            zone.nextShrinkAt?.let { next ->
                val secs = ((next - (System.currentTimeMillis() + offset)) / 1000).coerceAtLeast(0)
                Text(
                    "Zone shrinks in %02d:%02d".format(secs / 60, secs % 60),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.tertiary,
                )
            }
        }
    }
}

private fun remaining(target: Long?, offset: Long): String {
    if (target == null) return "--:--"
    val ms = target - (System.currentTimeMillis() + offset)
    if (ms <= 0) return "00:00"
    val total = ms / 1000
    return "%02d:%02d".format(total / 60, total % 60)
}

private fun startBlockers(state: RoomState): List<String> {
    val settings = state.room.settings
    val blockers = mutableListOf<String>()
    if (state.members.size < settings.minPlayers) blockers += "Need ${settings.minPlayers} players"
    val prey = state.members.count { it.team == Teams.PREY }
    val hunters = state.members.count { it.team == Teams.HUNTERS }
    if (prey == 0) blockers += "No prey"
    if (hunters == 0) blockers += "No hunters"
    val notReady = state.members.count { !it.ready }
    if (notReady > 0) blockers += "$notReady not ready"
    return blockers
}
