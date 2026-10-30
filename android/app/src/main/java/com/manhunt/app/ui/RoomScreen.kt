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
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.GpsFixed
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Pause
import androidx.compose.material.icons.outlined.Pets
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material.icons.outlined.Stop
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.manhunt.app.Graph
import com.manhunt.app.i18n.t
import com.manhunt.app.i18n.translate
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
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class RoomUi(
    val state: RoomState? = null,
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
    val left: Boolean = false,
)

/**
 * Chat has its own state holder: message traffic (every socket chat event, every poll)
 * then invalidates only the chat tab instead of re-running the whole room screen.
 */
data class ChatUi(
    val messages: List<ChatMessage> = emptyList(),
    val sending: Boolean = false,
    val error: String? = null,
    val hasMore: Boolean = false,
    val loadingOlder: Boolean = false,
)

private const val CHAT_PAGE_SIZE = 50
private const val MAX_LOADED_MESSAGES = 500
private const val POLL_CONNECTED_MS = 20_000L
private const val POLL_FALLBACK_MS = 10_000L
private const val SOCKET_REFRESH_DEBOUNCE_MS = 350L

class RoomViewModel(
    private val repo: ManHuntRepository,
    private val roomId: String,
) : ViewModel() {

    var ui by mutableStateOf(RoomUi())
        private set

    var chat by mutableStateOf(ChatUi())
        private set

    private var started = false
    private var pollJob: Job? = null
    private var refreshJob: Job? = null
    private var refreshRunning = false
    private var refreshQueued = false

    private fun msg(english: String): String = translate(english, repo.language.value)

    // Socket events are dispatched on viewModelScope (main dispatcher) by RoomSocket, so
    // every handler below runs on the main thread and is cancelled with the ViewModel.
    private val socket = RoomSocket(Graph.container.httpClient, viewModelScope) { event ->
        when (event) {
            is SocketEvent.Room -> updateUi { it.copy(state = event.state, loading = false) }
            // Coalesce the refresh storm: a single location/chat frame should not cause one
            // network round per event (they often arrive in bursts).
            is SocketEvent.Chat -> scheduleRefresh(silent = true, debounceMs = SOCKET_REFRESH_DEBOUNCE_MS)
            is SocketEvent.PreyLocation -> scheduleRefresh(silent = true, debounceMs = SOCKET_REFRESH_DEBOUNCE_MS)
            is SocketEvent.TagRequest -> updateUi { it.copy(pendingTag = event.tag) }
            is SocketEvent.TagDisputed -> updateUi { it.copy(pendingDispute = event.tag) }
            is SocketEvent.Connection -> {
                updateUi { it.copy(connected = event.connected) }
                // A reconnect may have missed events: pull the authoritative state once.
                if (event.connected) scheduleRefresh(silent = true, debounceMs = 0)
            }
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
        // Coming back from the background: refresh once immediately instead of waiting
        // for the first poll interval.
        refresh(silent = true)
        pollJob = viewModelScope.launch {
            while (isActive) {
                // The socket is the fast path; polling is a slower correctness fallback.
                delay(if (ui.connected) POLL_CONNECTED_MS else POLL_FALLBACK_MS)
                refresh(silent = true)
            }
        }
    }

    fun stop() {
        started = false
        pollJob?.cancel()
        pollJob = null
        refreshJob?.cancel()
        refreshJob = null
        socket.close()
    }

    override fun onCleared() {
        stop()
        super.onCleared()
    }

    /** Skips the write when the value is unchanged, so idle polls do not recompose. */
    private inline fun updateUi(block: (RoomUi) -> RoomUi) {
        val next = block(ui)
        if (next != ui) ui = next
    }

    private inline fun updateChat(block: (ChatUi) -> ChatUi) {
        val next = block(chat)
        if (next != chat) chat = next
    }

    fun refresh(silent: Boolean = false) = scheduleRefresh(silent, debounceMs = 0)

    /**
     * Debounced, single-flight refresh: socket-triggered reloads within [debounceMs] fold
     * into one request, and a refresh that is already running swallows the concurrent one
     * (running exactly one trailing refresh if anything arrived meanwhile).
     */
    private fun scheduleRefresh(silent: Boolean, debounceMs: Long) {
        refreshJob?.cancel()
        refreshJob = viewModelScope.launch {
            if (debounceMs > 0) delay(debounceMs)
            requestRefreshNow(silent)
        }
    }

    private fun requestRefreshNow(silent: Boolean) {
        viewModelScope.launch {
            if (refreshRunning) {
                refreshQueued = true
                return@launch
            }
            refreshRunning = true
            try {
                refreshOnce(silent)
            } finally {
                refreshRunning = false
            }
            if (refreshQueued) {
                refreshQueued = false
                requestRefreshNow(true)
            }
        }
    }

    private suspend fun refreshOnce(silent: Boolean) {
        try {
            coroutineScope {
                // Room state and newest chat page are independent requests: run in parallel.
                val stateDeferred = async { repo.room(roomId) }
                // No query string here: this is exactly the pre-pagination request, so the
                // newest-50 contract stays byte-identical for the common path.
                val chatDeferred = async { repo.messages(roomId) }
                val state = stateDeferred.await()
                val page = chatDeferred.await()
                val me = state.members.firstOrNull { it.userId == repo.myUserId() }
                val huntingMatch = state.match?.takeIf { it.phase == Phases.HUNTING }
                val locations = if (me?.team == Teams.HUNTERS && huntingMatch != null) {
                    runCatching { repo.latestLocations(huntingMatch.id) }.getOrNull()
                } else {
                    null
                }
                updateUi {
                    it.copy(
                        state = state,
                        locations = locations,
                        loading = false,
                        error = if (silent) it.error else null,
                    )
                }
                updateChat { current -> current.mergeNewest(page.messages, page.hasMore) }
            }
        } catch (e: ApiException) {
            if (!silent) updateUi { it.copy(loading = false, error = e.message) }
            if (e.status == 401) updateUi { it.copy(left = true) }
        }
    }

    /** Newest page merged over already-loaded older pages (id is the stable identity). */
    private fun ChatUi.mergeNewest(newest: List<ChatMessage>, newestHasMore: Boolean): ChatUi {
        if (messages.isEmpty()) return copy(messages = newest, hasMore = newestHasMore)
        val byId = LinkedHashMap<Long, ChatMessage>(messages.size + newest.size)
        for (message in messages) if (message.id > 0) byId[message.id] = message
        for (message in newest) if (message.id > 0) byId[message.id] = message
        val merged = byId.values.sortedWith(compareBy({ it.id }, { it.createdAt })).takeLast(MAX_LOADED_MESSAGES)
        // Older history is already loaded (hasMore=false): keep that knowledge.
        return copy(messages = merged)
    }

    /** Loads the page before the oldest loaded message. Call from the chat tab. */
    fun loadOlderMessages() {
        if (chat.loadingOlder || !chat.hasMore) return
        val oldestId = chat.messages.firstOrNull { it.id > 0 }?.id ?: return
        updateChat { it.copy(loadingOlder = true, error = null) }
        viewModelScope.launch {
            try {
                val page = repo.messages(roomId, limit = CHAT_PAGE_SIZE, before = oldestId)
                updateChat { current ->
                    val byId = LinkedHashMap<Long, ChatMessage>(page.messages.size + current.messages.size)
                    for (message in page.messages) if (message.id > 0) byId[message.id] = message
                    for (message in current.messages) if (message.id > 0) byId[message.id] = message
                    val merged = byId.values.sortedWith(compareBy({ it.id }, { it.createdAt }))
                        .takeLast(MAX_LOADED_MESSAGES)
                    current.copy(messages = merged, hasMore = page.hasMore, loadingOlder = false)
                }
            } catch (e: ApiException) {
                updateChat { it.copy(loadingOlder = false, error = e.message) }
            }
        }
    }

    fun setTeam(team: String) {
        if (ui.busy) return
        updateUi { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try {
                val state = repo.setTeam(roomId, team)
                updateUi { it.copy(state = state, busy = false) }
            } catch (e: ApiException) {
                updateUi { it.copy(busy = false, error = e.message) }
            }
        }
    }

    fun toggleReady() {
        val me = ui.state?.members?.firstOrNull { it.userId == repo.myUserId() }
        if (ui.busy) return
        updateUi { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try {
                val state = repo.setReady(roomId, !(me?.ready ?: false))
                updateUi { it.copy(state = state, busy = false) }
            } catch (e: ApiException) {
                updateUi { it.copy(busy = false, error = e.message) }
            }
        }
    }

    fun startMatch() {
        if (ui.busy) return
        updateUi { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try {
                val state = repo.startMatch(roomId)
                updateUi { it.copy(state = state, busy = false) }
            } catch (e: ApiException) {
                updateUi { it.copy(busy = false, error = e.message) }
            }
        }
    }

    fun sendChat(text: String) {
        val body = text.trim()
        if (body.isEmpty() || chat.sending) return
        updateChat { it.copy(sending = true, error = null) }
        viewModelScope.launch {
            try {
                repo.sendMessage(roomId, body)
                val page = repo.messages(roomId)
                updateChat { it.copy(sending = false).mergeNewest(page.messages, page.hasMore) }
            } catch (e: ApiException) {
                updateChat { it.copy(sending = false, error = e.message) }
            }
        }
    }

    fun claimTag(preyId: String) {
        if (ui.busy) return
        updateUi { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try {
                repo.requestTag(roomId, preyId)
                updateUi {
                    it.copy(busy = false, notice = msg("Tag claim sent - waiting for the prey to confirm"))
                }
            } catch (e: ApiException) {
                updateUi { it.copy(busy = false, error = e.message) }
            }
        }
    }

    fun confirmIncomingTag() {
        val tag = ui.pendingTag ?: return
        updateUi { it.copy(busy = true, pendingTag = null) }
        viewModelScope.launch {
            try {
                repo.confirmTag(tag.id)
                updateUi { it.copy(busy = false, notice = msg("Tag confirmed")) }
            } catch (e: ApiException) {
                // Keep the dialog alive: the prey must still answer this claim.
                updateUi { it.copy(busy = false, error = e.message, pendingTag = tag) }
            }
            refresh(silent = true)
        }
    }

    fun dismissPendingTag() {
        updateUi { it.copy(pendingTag = null) }
    }

    fun disputeIncomingTag() {
        val tag = ui.pendingTag ?: return
        updateUi { it.copy(busy = true, pendingTag = null) }
        viewModelScope.launch {
            try {
                repo.disputeTag(tag.id)
                updateUi { it.copy(busy = false, notice = msg("Tag disputed - the admin will decide")) }
            } catch (e: ApiException) {
                updateUi { it.copy(busy = false, error = e.message, pendingTag = tag) }
            }
            refresh(silent = true)
        }
    }

    fun clearNotice() {
        updateUi { it.copy(notice = null) }
    }

    fun pauseMatch() = act { repo.pauseMatch(roomId) }

    fun resumeMatch() = act { repo.resumeMatch(roomId) }

    fun endMatch() = act { repo.endMatch(roomId) }

    fun resolveDisputed(decision: String) {
        val tag = ui.pendingDispute ?: return
        updateUi { it.copy(busy = true, pendingDispute = null) }
        viewModelScope.launch {
            try {
                repo.resolveTag(tag.id, decision)
                updateUi {
                    it.copy(
                        busy = false,
                        notice = "${msg("Disputed tag")}: ${translate(decision, repo.language.value)}",
                    )
                }
            } catch (e: ApiException) {
                updateUi { it.copy(busy = false, error = e.message, pendingDispute = tag) }
            }
            refresh(silent = true)
        }
    }

    fun dismissPendingDispute() {
        updateUi { it.copy(pendingDispute = null) }
    }

    fun loadHistory() {
        viewModelScope.launch {
            try {
                val matches = repo.history(roomId).matches
                updateUi { it.copy(history = matches, historyLoaded = true) }
            } catch (e: ApiException) {
                updateUi { it.copy(error = e.message, historyLoaded = true) }
            }
        }
    }

    /** Trails are fetched on demand (one request per prey), only for hunters, in parallel. */
    fun toggleTrails() {
        if (ui.trailsVisible) {
            updateUi { it.copy(trailsVisible = false, trails = emptyMap()) }
            return
        }
        val state = ui.state ?: return
        val matchId = state.match?.id ?: return
        val prey = state.members.filter { it.team == Teams.PREY }
        viewModelScope.launch {
            val results = coroutineScope {
                prey.map { member ->
                    async {
                        member.userId to runCatching { repo.trail(matchId, member.userId) }.getOrNull()
                    }
                }.awaitAll()
            }
            val collected = buildMap {
                for ((userId, trail) in results) {
                    val points = trail?.takeIf { it.trailEnabled }?.points.orEmpty()
                    if (points.isNotEmpty()) put(userId, points)
                }
            }
            updateUi {
                it.copy(
                    trails = collected,
                    trailsVisible = true,
                    notice = if (collected.isEmpty()) msg("No trails available yet") else null,
                )
            }
        }
    }

    fun saveSettings(patch: kotlinx.serialization.json.JsonObject) {
        if (ui.busy) return
        updateUi { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try {
                val state = repo.updateSettings(roomId, patch)
                updateUi { it.copy(state = state, busy = false, notice = msg("Settings saved")) }
            } catch (e: ApiException) {
                updateUi { it.copy(busy = false, error = e.message) }
            }
        }
    }

    private fun act(block: suspend () -> RoomState) {
        if (ui.busy) return
        updateUi { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try {
                val state = block()
                updateUi { it.copy(state = state, busy = false) }
            } catch (e: ApiException) {
                updateUi { it.copy(busy = false, error = e.message) }
            }
        }
    }

    fun leave() {
        viewModelScope.launch {
            runCatching { repo.leaveRoom(roomId) }
            updateUi { it.copy(left = true) }
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

    // Polling and the socket are owned by the screen lifecycle: they run while the screen
    // is STARTED and are torn down when it is STOPPED (backgrounded) or disposed. This
    // avoids 10 s polls and socket churn while the app is in the background.
    val lifecycleOwner = LocalLifecycleOwner.current
    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            vm.start()
            try {
                awaitCancellation()
            } finally {
                vm.stop()
            }
        }
    }
    DisposableEffect(Unit) {
        onDispose { vm.stop() }
    }

    val state = ui.state
    val match = state?.match
    val me = state?.members?.firstOrNull { it.userId == repo.myUserId() }

    var showLeaveConfirm by remember { mutableStateOf(false) }
    val requestLeave: () -> Unit = {
        if (me?.isAdmin == true || state?.room?.status == "active") {
            showLeaveConfirm = true
        } else {
            vm.leave()
        }
    }
    BackHandler { requestLeave() }

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
    val showMatchMap = activePhase || phase == Phases.PAUSED

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
    // Unread is tracked by message id, not list length: the server window caps the
    // visible list, so in a busy room a length-based badge would silently stay at zero.
    var lastReadId by rememberSaveable { mutableLongStateOf(-1L) }
    // derivedStateOf keeps chat traffic out of the screen's recomposition path: the screen
    // recomposes only when the unread *count* changes, not on every incoming message.
    val unread by remember {
        derivedStateOf {
            val marker = lastReadId
            if (marker < 0) 0 else vm.chat.messages.count { it.id > marker }
        }
    }
    val listState = rememberLazyListState()

    // Bring the list back to the TOP on real phase/status transitions (and when the first
    // room state arrives). The lobby must open at the top, not scrolled to the last card;
    // this also stops the map/menu from opening half-scrolled after a match ends.
    var lastScrollKey by remember { mutableStateOf<Any?>(null) }
    LaunchedEffect(ui.state?.room?.status, ui.state?.match?.id, ui.state?.match?.phase) {
        val key = listOf(ui.state?.room?.status, ui.state?.match?.id, ui.state?.match?.phase)
        if (lastScrollKey != null && lastScrollKey != key) {
            listState.scrollToItem(0)
        }
        lastScrollKey = key
    }

    LaunchedEffect(tab, unread) {
        // Seed the marker on first load so already-read history is not shown as unread,
        // then keep it pinned while the reader is on the Chat tab.
        if (tab == 1 && unread > 0) {
            lastReadId = vm.chat.messages.maxOfOrNull { it.id } ?: -1L
        } else if (lastReadId < 0) {
            lastReadId = vm.chat.messages.maxOfOrNull { it.id } ?: -1L
        }
    }
    var showTagPicker by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }
    var showHistory by remember { mutableStateOf(false) }
    var showEndConfirm by remember { mutableStateOf(false) }

    if (showLeaveConfirm) {
        AlertDialog(
            onDismissRequest = { showLeaveConfirm = false },
            title = { Text(t("Leave the room?")) },
            text = {
                Text(
                    t(
                        if (state?.room?.status == "active") {
                            "You are abandoning this hunt. It runs without you."
                        } else {
                            "You will leave the room and lose your spot in the lobby."
                        }
                    )
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    showLeaveConfirm = false
                    vm.leave()
                }) { Text(t("Leave")) }
            },
            dismissButton = { TextButton(onClick = { showLeaveConfirm = false }) { Text(t("Cancel")) } },
        )
    }

    if (showEndConfirm) {
        AlertDialog(
            onDismissRequest = { showEndConfirm = false },
            title = { Text(t("End the hunt?")) },
            text = { Text(t("This ends the hunt for everyone and returns the room to the lobby.")) },
            confirmButton = {
                TextButton(onClick = {
                    showEndConfirm = false
                    vm.endMatch()
                }) { Text(t("End hunt")) }
            },
            dismissButton = { TextButton(onClick = { showEndConfirm = false }) { Text(t("Cancel")) } },
        )
    }

    if (me?.isAdmin == true) {
        ui.pendingDispute?.let { tag ->
            val hunter = state?.members?.firstOrNull { it.userId == tag.hunterId }?.username ?: t("A hunter")
            val prey = state?.members?.firstOrNull { it.userId == tag.preyId }?.username ?: t("a prey")
            AlertDialog(
                onDismissRequest = vm::dismissPendingDispute,
                title = { Text(t("Disputed tag")) },
                text = {
                    Text(
                        "$hunter ${t("says they tagged")} $prey" +
                            t(", and they dispute it. Confirm or reject the tag.")
                    )
                },
                confirmButton = { TextButton(onClick = { vm.resolveDisputed("confirmed") }) { Text(t("Confirm tag")) } },
                dismissButton = { TextButton(onClick = { vm.resolveDisputed("rejected") }) { Text(t("Reject")) } },
            )
        }
    }

    if (showHistory) {
        HistoryDialog(
            matches = ui.history,
            loading = !ui.historyLoaded,
            onDismiss = { showHistory = false },
        )
    }

    if (showSettings && state != null) {
        RoomSettingsHost(
            state = state,
            onSave = { patch ->
                showSettings = false
                vm.saveSettings(patch)
            },
            onDismiss = { showSettings = false },
        )
    }

    ui.pendingTag?.let { tag ->
        val hunter = state?.members?.firstOrNull { it.userId == tag.hunterId }?.username ?: t("A hunter")
        AlertDialog(
            onDismissRequest = vm::dismissPendingTag,
            title = { Text(t("Tag claim")) },
            text = { Text("$hunter ${t("says they physically touched you. Confirm the tag?")}") },
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
                        t("You must be physically touching the prey. False claims can be disputed."),
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
                IconButton(onClick = requestLeave) {
                    Icon(
                        Icons.AutoMirrored.Outlined.Logout,
                        contentDescription = t("Leave"),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Column(Modifier.weight(1f)) {
                    Text(
                        state?.room?.name ?: t("Room"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    if (state != null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Text(
                                state.room.code,
                                style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 2.sp),
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.testTag("room_code")
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
                                t(if (ui.connected) "Live" else "Polling"),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
                if (ui.loading) ManHuntLoader(size = 18.dp)
                IconButton(onClick = {
                    vm.loadHistory()
                    showHistory = true
                }) {
                    Icon(Icons.Outlined.History, contentDescription = t("History"))
                }
            }

            TabRow(selectedTabIndex = tab, containerColor = MaterialTheme.colorScheme.surface) {
                Tab(
                    selected = tab == 0,
                    modifier = Modifier.testTag("tab_game"),
                    onClick = { tab = 0 },
                    icon = { Icon(Icons.Outlined.SportsEsports, contentDescription = null) },
                    text = { Text(t("Game")) },
                )
                Tab(
                    selected = tab == 1,
                    modifier = Modifier.testTag("tab_chat"),
                    onClick = {
                        tab = 1
                        lastReadId = vm.chat.messages.maxOfOrNull { it.id } ?: -1L
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

            ui.notice?.let { notice ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.secondaryContainer)
                        .padding(start = 16.dp, end = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        notice,
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                    )
                    TextButton(onClick = vm::clearNotice) { Text(t("Dismiss")) }
                }
            }

            if (state == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    if (ui.error != null && !ui.loading) {
                        // Load failed (room gone, wrong server, 5xx): state it inside a
                        // card with a way back, instead of spinning forever.
                        ScreenCard(Modifier.padding(horizontal = 16.dp)) {
                            ErrorBanner(ui.error)
                            Button(
                                onClick = { vm.refresh() },
                                modifier = Modifier.fillMaxWidth(),
                            ) { Text(t("Try again")) }
                        }
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            ManHuntLoader(size = 36.dp)
                            Spacer(Modifier.height(14.dp))
                            Text(
                                t("Connecting to room"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
                return@Surface
            }

            val lobby = state.room.status == "lobby"
            val matchCard: @Composable () -> Unit = {
                PhaseCard(
                    state = state,
                    isAdmin = me?.isAdmin == true,
                    busy = ui.busy,
                    onStart = vm::startMatch,
                    onOpenSettings = { showSettings = true },
                    onPause = vm::pauseMatch,
                    onResume = vm::resumeMatch,
                    onEnd = { showEndConfirm = true },
                )
            }

            // The map is deliberately OUTSIDE the scrolling list. A LazyColumn's vertical
            // drag detector steals osmdroid's pans (dragging the map scrolls the page).
            // Kept at a fixed height, the map owns its own touch stream in every direction.
            val activeMatchMap: @Composable (Modifier) -> Unit = { outerModifier ->
                val ownLocation by LiveLocation.current.collectAsState()
                Column(
                    modifier = outerModifier,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    MatchMap(
                        modifier = Modifier.fillMaxWidth().height(240.dp),
                        ownLocation = ownLocation,
                        prey = ui.locations?.prey ?: emptyList(),
                        zone = match?.zone,
                        showPrey = me?.team == Teams.HUNTERS,
                        trails = if (ui.trailsVisible) ui.trails else emptyMap(),
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            t(
                                when {
                                    me?.team == Teams.HUNTERS -> "Prey positions are the latest reports"
                                    activePhase && hasLocation && resumed && ownLocation != null -> "Sharing your position"
                                    activePhase && hasLocation && resumed -> "Waiting for GPS"
                                    activePhase && hasLocation -> "Open the app to resume sharing"
                                    activePhase -> "Location off"
                                    else -> "Map"
                                }
                            ),
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
                                Text(t(if (ui.trailsVisible) "Hide trails" else "Trails"))
                            }
                            TextButton(onClick = { showTagPicker = true }) { Text(t("Tag prey")) }
                        }
                    }
                }
            }

            if (tab == 0) {
                if (!lobby && match != null && showMatchMap) {
                    activeMatchMap(
                        Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp)
                            .testTag("match_map_card"),
                    )
                }
                LazyColumn(
                state = listState,
                // weight, not fillMaxSize: the chat composer must keep its height (UI-01).
                modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp).testTag("lobby_list"),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {

                if (!lobby) {
                    if (ui.error != null) {
                        item(key = "match_error") {
                            // Mid-match actions (tag, pause, resume, end, settings) report
                            // here - during a match there is no lobby card to carry ui.error.
                            ScreenCard { ErrorBanner(ui.error) }
                        }
                    }

                    item(key = "phase") { matchCard() }

                    if (me?.team == Teams.HUNTERS && ui.locations?.prey?.isNotEmpty() == true) {
                        item(key = "prey_status") {
                            ScreenCard {
                                // Text alternative to the map (UI-03) and per-player staleness (UI-08).
                                ui.locations!!.prey.forEach { p ->
                                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                        Text(p.username, style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                                        val label = when {
                                            !p.hasReport -> t("No report")
                                            p.eliminated -> t("Tagged")
                                            p.flagged -> t("Unverified")
                                            p.stale -> t("Stale")
                                            else -> t("Live")
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
                                if (ui.locations!!.prey.any { it.stale }) {
                                    Text(
                                        t("Some prey reports are stale (older than two intervals)."),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.tertiary,
                                    )
                                }
                            }
                        }
                    }

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

                }

                item {
                    ScreenCard {
                        SectionLabel("${t("Hunt roster")} (${state.members.size})")
                        state.members.forEach { member ->
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            if (member.team == Teams.PREY) Icons.Outlined.Pets else Icons.Outlined.GpsFixed,
                                            contentDescription = null,
                                            modifier = Modifier.size(15.dp),
                                            tint = teamColor(member.team),
                                        )
                                        Spacer(Modifier.width(5.dp))
                                        Text(member.username, fontWeight = FontWeight.SemiBold)
                                        if (member.isAdmin) {
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                t("HUNTMASTER"),
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.primary,
                                            )
                                        }
                                        if (member.eliminated && state.room.status != "lobby") {
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                t("TAGGED"),
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.error,
                                            )
                                        }
                                        if (!member.connected) {
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                t("out of range"),
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            )
                                        }
                                    }
                                    if (lobby) {
                                        Text(
                                            t(if (member.ready) "Ready" else "Gearing up"),
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (member.ready) MaterialTheme.colorScheme.primary
                                            else MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                }
                                TeamPill(member.team)
                            }
                            Spacer(Modifier.height(10.dp))
                        }
                    }
                }

                if (lobby) {
                    item {
                        ScreenCard {
                            SectionLabel(t("Choose your side"))
                            ErrorBanner(ui.error)
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
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                TeamChoiceCard(
                                    team = Teams.PREY,
                                    selected = me?.team == Teams.PREY,
                                    // Tapping the side you are already on is a no-op; disable it
                                    // so it is obvious the choice is already applied.
                                    enabled = !ui.busy && me?.team != Teams.PREY,
                                    onClick = { vm.setTeam(Teams.PREY) },
                                    modifier = Modifier.weight(1f).testTag("team_prey"),
                                )
                                TeamChoiceCard(
                                    team = Teams.HUNTERS,
                                    selected = me?.team == Teams.HUNTERS,
                                    enabled = !ui.busy && me?.team != Teams.HUNTERS,
                                    onClick = { vm.setTeam(Teams.HUNTERS) },
                                    modifier = Modifier.weight(1f).testTag("team_hunters"),
                                )
                            }

                            Button(
                                onClick = vm::toggleReady,
                                enabled = !ui.busy,
                                modifier = Modifier.fillMaxWidth().heightIn(min = 54.dp).testTag("ready_button"),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = readyBg,
                                    contentColor = readyFg,
                                ),
                            ) {
                                Icon(
                                    if (ready) Icons.Outlined.Close else Icons.Outlined.CheckCircle,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp),
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(t(if (ready) "Stand down" else "Ready to hunt"))
                            }
                        }
                    }
                    item(key = "phase") { matchCard() }
                }

                }
            } else {
                ChatTabContent(
                    vm = vm,
                    myUserId = repo.myUserId(),
                    modifier = Modifier.weight(1f).fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun ChatTabContent(
    vm: RoomViewModel,
    myUserId: String?,
    modifier: Modifier = Modifier,
) {
    // Reading the chat state in this dedicated composable keeps chat traffic inside the
    // chat tab's recomposition scope; the lobby/game surface does not re-run for messages.
    val chat = vm.chat
    ChatPanel(
        messages = chat.messages,
        myUserId = myUserId,
        sending = chat.sending,
        onSend = vm::sendChat,
        error = chat.error,
        hasMore = chat.hasMore,
        loadingOlder = chat.loadingOlder,
        onLoadOlder = vm::loadOlderMessages,
        modifier = modifier,
    )
}

@Composable
private fun RoomSettingsHost(
    state: RoomState,
    onSave: (kotlinx.serialization.json.JsonObject) -> Unit,
    onDismiss: () -> Unit,
) {
    // The live GPS fix is only read while the dialog is open, so ordinary location updates
    // do not invalidate the room screen.
    val ownLocation by LiveLocation.current.collectAsState()
    RoomSettingsDialog(
        state = state,
        currentLocation = ownLocation,
        onSave = onSave,
        onDismiss = onDismiss,
    )
}

@Composable
private fun TeamChoiceCard(
    team: String,
    selected: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val color = teamColor(team)
    val icon = if (team == Teams.PREY) Icons.Outlined.Pets else Icons.Outlined.GpsFixed
    Surface(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.heightIn(min = 128.dp),
        shape = RoundedCornerShape(20.dp),
        color = if (selected) color.copy(alpha = 0.18f)
        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
        contentColor = if (selected) color else MaterialTheme.colorScheme.onSurface,
        border = BorderStroke(
            if (selected) 3.dp else 2.dp,
            color.copy(alpha = if (selected) 1f else 0.55f),
        ),
    ) {
        Column(
            Modifier.fillMaxSize().padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(36.dp), tint = color)
            Spacer(Modifier.height(8.dp))
            Text(
                t(teamLabel(team)),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                t(if (team == Teams.PREY) "Hide. Survive." else "Track. Tag."),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun PhaseCard(
    state: RoomState,
    isAdmin: Boolean,
    busy: Boolean,
    onStart: () -> Unit,
    onOpenSettings: () -> Unit,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onEnd: () -> Unit,
) {
    val match = state.match

    val phase = when {
        state.room.status == "lobby" &&
            (match == null || match.phase == Phases.FINISHED || match.phase == Phases.CANCELLED) -> Phases.LOBBY
        else -> match?.phase ?: Phases.LOBBY
    }

    ScreenCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            SectionLabel(t("The hunt"))
            Spacer(Modifier.weight(1f))
            val color: Color = when (phase) {
                Phases.HUNTING -> MaterialTheme.colorScheme.tertiary
                Phases.HEAD_START -> MaterialTheme.colorScheme.primary
                Phases.FINISHED -> MaterialTheme.colorScheme.secondary
                else -> MaterialTheme.colorScheme.onSurfaceVariant
            }
            Text(
                t(phase.replace('_', ' ').uppercase()),
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

        when (phase) {
            Phases.LOBBY -> Text(
                if (isAdmin) t("Pick a side. Ready up. The huntmaster starts the hunt.")
                else t("The huntmaster is setting the rules."),
                style = MaterialTheme.typography.bodyMedium,
            )
            Phases.HEAD_START -> CountdownText(
                target = target,
                offset = offset,
                prefix = "${t("Prey are hiding. Hunting starts in")} ",
            )
            Phases.HUNTING -> CountdownText(
                target = target,
                offset = offset,
                prefix = "${t("Hunting.")} ",
                suffix = " Â· ${t("Prey remaining")} ${match?.preyAlive ?: 0}/${match?.preyTotal ?: 0}",
            )
            Phases.PAUSED -> Text(
                t("The hunt is paused. The clock is stopped."),
                style = MaterialTheme.typography.bodyMedium,
            )
            Phases.FINISHED -> Text(
                "${t("Hunt over")} - ${if (match?.winner == Teams.HUNTERS) t("Hunters win") else t("Prey win")}",
                style = MaterialTheme.typography.bodyMedium,
            )
            Phases.CANCELLED -> Text(t("Hunt cancelled"), style = MaterialTheme.typography.bodyMedium)
            else -> Text(t("In progress"), style = MaterialTheme.typography.bodyMedium)
        }

        if (phase == Phases.LOBBY && match != null &&
            (match.phase == Phases.FINISHED || match.phase == Phases.CANCELLED)) {
            Text(
                when {
                    match.phase == Phases.CANCELLED -> t("Last hunt: cancelled")
                    match.winner == Teams.HUNTERS -> "${t("Last hunt")}: ${t("Hunters won")}"
                    else -> "${t("Last hunt")}: ${t("Prey won")}"
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        if (isAdmin && state.room.status == "lobby") {
            val blockers = startBlockers(state)
            Button(
                onClick = onStart,
                enabled = blockers.isEmpty() && !busy,
                modifier = Modifier.fillMaxWidth().heightIn(min = 54.dp).testTag("start_match"),
            ) {
                Icon(Icons.Outlined.PlayArrow, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(t("Begin the hunt"))
            }
            OutlinedButton(
                onClick = onOpenSettings,
                modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
            ) {
                Icon(Icons.Outlined.Tune, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(t("Hunt rules"))
            }
            if (blockers.isNotEmpty()) {
                Text(
                    blockers.joinToString(" - "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        if (isAdmin && state.room.status != "lobby") {
            if (phase == Phases.HUNTING) {
                OutlinedButton(
                    onClick = onPause,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                ) {
                    Icon(Icons.Outlined.Pause, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(t("Pause hunt"))
                }
            }
            if (phase == Phases.PAUSED) {
                OutlinedButton(
                    onClick = onResume,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                ) {
                    Icon(Icons.Outlined.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(t("Resume hunt"))
                }
            }
            if (phase == Phases.HUNTING || phase == Phases.PAUSED) {
                OutlinedButton(
                    onClick = onEnd,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp),
                ) {
                    Icon(Icons.Outlined.Stop, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(t("End hunt"))
                }
            }
        }

        match?.zone?.let { zone ->
            Text(
                "${t("Zone")}: ${zone.radiusM.toInt()} ${t("m")}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            zone.nextShrinkAt?.let { next ->
                CountdownText(
                    target = next,
                    offset = offset,
                    prefix = "${t("Zone shrinks in")} ",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.tertiary,
                )
            }
        }
    }
}

/**
 * Wall-clock countdown. Only this composable reads the ticking value, so a running
 * clock invalidates one Text per second instead of driving a whole-card state tick.
 *
 * It must NOT wait for a frame every vsync: a per-frame loop keeps the Compose frame
 * clock permanently busy (instrumentation tests time out waiting for idle, and on device
 * it wakes the choreographer at 60 Hz for a value that changes once a second). Sleep
 * until the next displayed-second boundary instead.
 */
@Composable
private fun CountdownText(
    target: Long?,
    offset: Long,
    prefix: String,
    suffix: String = "",
    style: TextStyle = MaterialTheme.typography.bodyMedium,
    color: Color = MaterialTheme.colorScheme.onSurface,
) {
    var seconds by remember(target, offset) { mutableLongStateOf(remainingSeconds(target, offset)) }
    LaunchedEffect(target, offset) {
        if (target == null) return@LaunchedEffect
        while (isActive) {
            val next = remainingSeconds(target, offset)
            if (next != seconds) seconds = next
            val remainingMs = (target - (System.currentTimeMillis() + offset)).coerceAtLeast(0L)
            val waitMs = if (remainingMs == 0L) 1_000L else (remainingMs % 1_000L).takeIf { it > 0L } ?: 1_000L
            delay(waitMs)
        }
    }
    Text(prefix + formatRemaining(target, seconds) + suffix, style = style, color = color)
}

private fun remainingSeconds(target: Long?, offset: Long): Long {
    if (target == null) return 0L
    return ((target - (System.currentTimeMillis() + offset)) / 1000).coerceAtLeast(0)
}

private fun formatRemaining(target: Long?, seconds: Long): String {
    if (target == null) return "--:--"
    return "%02d:%02d".format(seconds / 60, seconds % 60)
}

@Composable
private fun startBlockers(state: RoomState): List<String> {
    val settings = state.room.settings
    val blockers = mutableListOf<String>()
    if (state.members.size < settings.minPlayers) {
        blockers += "${t("Need")} ${settings.minPlayers} ${t("players")}"
    }
    val prey = state.members.count { it.team == Teams.PREY }
    val hunters = state.members.count { it.team == Teams.HUNTERS }
    if (prey == 0) blockers += t("No prey yet")
    if (hunters == 0) blockers += t("No hunters yet")
    val notReady = state.members.count { !it.ready }
    if (notReady > 0) blockers += "$notReady ${t("still gearing up")}"
    return blockers
}

