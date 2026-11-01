package com.manhunt.app.ui

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.ExpandLess
import androidx.compose.material.icons.outlined.ExpandMore
import androidx.compose.material.icons.outlined.GpsFixed
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.Pause
import androidx.compose.material.icons.outlined.Pets
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material.icons.outlined.Stop
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material.icons.outlined.Timeline
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
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
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
import com.manhunt.app.data.MatchDto
import com.manhunt.app.data.MatchHistoryEntry
import com.manhunt.app.data.MemberDto
import com.manhunt.app.data.Phases
import com.manhunt.app.data.PreyLocationStatus
import com.manhunt.app.data.RoomSocket
import com.manhunt.app.data.RoomState
import com.manhunt.app.data.SocketEvent
import com.manhunt.app.data.TagDto
import com.manhunt.app.data.Teams
import com.manhunt.app.data.TrailPoint
import com.manhunt.app.location.TrackingService
import com.manhunt.app.map.MatchMap
import com.manhunt.app.ui.theme.ManHuntElevation
import com.manhunt.app.ui.theme.ManHuntRadius
import com.manhunt.app.ui.theme.ManHuntSizes
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
    /** Claim ids the player dismissed: hidden from the dialog but shown as a banner. */
    val dismissedTagId: String? = null,
    val dismissedDisputeId: String? = null,
    val notice: String? = null,
    val history: List<MatchHistoryEntry> = emptyList(),
    val historyLoaded: Boolean = false,
    val historyError: String? = null,
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

/** Required attribution for the OSM tiles; the tactical sheet carries it because it hides the in-map chip. */
private const val OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright"

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
            is SocketEvent.Room -> updateUi { it.replayPendingTags(event.state).copy(loading = false) }
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

    /**
     * Rehydrate tag dialogs from authoritative room state. Tag claims are durable now:
     * a prey who missed the websocket event (pocketed phone, reconnected socket) still
     * gets the confirm/dispute dialog, and an admin sees the dispute queue after a
     * reconnect. Local event-derived dialogs are kept while the server snapshot may
     * not have caught up yet, and dropped once the server says the claim is resolved.
     */
    private fun RoomUi.replayPendingTags(state: RoomState): RoomUi {
        val me = state.members.firstOrNull { it.userId == repo.myUserId() }
        val myClaim = state.pendingTags.firstOrNull { it.preyId == me?.userId }
        val preyTag = when {
            myClaim == null -> pendingTag // event arrived before this snapshot: keep it
            myClaim.disputed -> null
            // Dismissed by the player: hide the dialog, but the claim stays visible as a banner.
            myClaim.id == dismissedTagId -> null
            else -> myClaim.toTag()
        }
        val disputed = state.pendingTags.firstOrNull { it.disputed }
        val adminDispute = when {
            me?.isAdmin != true -> null
            disputed != null && disputed.id != dismissedDisputeId -> disputed.toTag()
            else -> pendingDispute?.takeIf { local -> state.pendingTags.any { it.id == local.id } }
        }
        return copy(state = state, pendingTag = preyTag, pendingDispute = adminDispute)
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
                    ).replayPendingTags(state)
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
        updateUi { it.copy(busy = true, pendingTag = null, dismissedTagId = null) }
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
        val tag = ui.pendingTag ?: return
        updateUi { it.copy(pendingTag = null, dismissedTagId = tag.id) }
    }

    /** Re-opens a tag claim the player dismissed; the banner's action. */
    fun reviewPendingTag() {
        val me = ui.state?.members?.firstOrNull { it.userId == repo.myUserId() }
        val claim = ui.state?.pendingTags?.firstOrNull { it.preyId == me?.userId && !it.disputed } ?: return
        updateUi { it.copy(pendingTag = claim.toTag(), dismissedTagId = null) }
    }

    fun disputeIncomingTag() {
        val tag = ui.pendingTag ?: return
        updateUi { it.copy(busy = true, pendingTag = null, dismissedTagId = null) }
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
        updateUi { it.copy(busy = true, pendingDispute = null, dismissedDisputeId = null) }
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
        val tag = ui.pendingDispute ?: return
        updateUi { it.copy(pendingDispute = null, dismissedDisputeId = tag.id) }
    }

    /** Re-opens a disputed tag the huntmaster dismissed; the banner's action. */
    fun reviewPendingDispute() {
        val claim = ui.state?.pendingTags?.firstOrNull { it.disputed } ?: return
        updateUi { it.copy(pendingDispute = claim.toTag(), dismissedDisputeId = null) }
    }

    fun loadHistory() {
        updateUi { it.copy(historyError = null, historyLoaded = false) }
        viewModelScope.launch {
            try {
                val matches = repo.history(roomId).matches
                updateUi { it.copy(history = matches, historyLoaded = true, historyError = null) }
            } catch (e: ApiException) {
                // A failed load must not masquerade as "no hunts yet" (UI review).
                updateUi { it.copy(historyError = e.message, historyLoaded = true) }
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

    // Strings used inside non-composable lambdas (notification effects, click handlers)
    // must be resolved here, in composition scope.
    val notifHuntStarted = t("The hunt has started")
    val notifHuntersLive = t("Hunters are live.")
    val notifHuntOver = t("The hunt is over")
    val notifWinner = t("Winner")
    val winnerName = t(if (match?.winner == Teams.HUNTERS) "Hunters win" else "Prey win")
    val notifCancelled = t("Hunt cancelled")
    val notifTagFrom = t("Tag claim from")
    val notifConfirmTag = t("Confirm the tag?")
    val notifDispute = t("Disputed tag needs a decision")
    val notifOpenApp = t("Open the app to decide.")
    val fallbackHunter = t("A hunter")
    val shareRoomTitle = t("Share room")
    val joinRoomPrefix = t("Join my ManHunt room")
    val codeWord = t("code")
    val joinCodeLabel = t("Join code")
    val roomCodeCopied = t("Room code copied")

    var showLeaveConfirm by remember { mutableStateOf(false) }
    val requestLeave: () -> Unit = {
        if (me?.isAdmin == true || state?.room?.status == "active") {
            showLeaveConfirm = true
        } else {
            vm.leave()
        }
    }
    BackHandler { requestLeave() }

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

    var hasLocation by remember { mutableStateOf(hasLocationPermission(context)) }
    var locationDenied by remember { mutableStateOf(false) }
    // Re-check on resume: the player may grant/revoke a permission in system settings.
    LaunchedEffect(resumed) {
        if (resumed) hasLocation = hasLocationPermission(context)
    }
    // Only a fallback for someone who declined permissions on the welcome screen.
    // Permissions are asked once there, before the player ever enters a room.
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { result ->
        hasLocation = result[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            result[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        locationDenied = !hasLocation
    }
    val trackingPermissions = remember {
        arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        )
    }

    val matchId = match?.id
    val phase = match?.phase
    val intervalSec = state?.room?.settings?.locationIntervalSec ?: 300
    val activePhase = phase == Phases.HEAD_START || phase == Phases.HUNTING
    val showMatchMap = activePhase || phase == Phases.PAUSED

    // "Has permission" is not the same as "location is on": a granted permission with
    // Location services switched off is a silent dead end (the GPS-off state seen in the
    // human review). Re-check on resume so returning from Settings updates the UI.
    val locationServicesOn = remember(resumed) {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        when {
            lm == null -> false
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.P -> lm.isLocationEnabled
            else -> runCatching {
                Settings.Secure.getInt(context.contentResolver, Settings.Secure.LOCATION_MODE) !=
                    Settings.Secure.LOCATION_MODE_OFF
            }.getOrDefault(false)
        }
    }

    // Notify the moments that happen with the phone in a pocket. Only when the screen is
    // not resumed; a visible app already shows the banner/dialog.
    val lastNotifiedPhase = remember { mutableStateOf<String?>(null) }
    LaunchedEffect(phase, resumed) {
        val current = phase
        if (current == null) return@LaunchedEffect
        val previous = lastNotifiedPhase.value
        if (previous == current) return@LaunchedEffect
        lastNotifiedPhase.value = current
        if (resumed) return@LaunchedEffect
        when (current) {
            Phases.HUNTING -> if (previous == Phases.HEAD_START) {
                MatchNotifier.notify(context, 2, notifHuntStarted, notifHuntersLive)
            }
            Phases.FINISHED -> MatchNotifier.notify(
                context,
                3,
                notifHuntOver,
                "$notifWinner: $winnerName",
            )
            Phases.CANCELLED -> MatchNotifier.notify(context, 3, notifHuntOver, notifCancelled)
        }
    }
    LaunchedEffect(ui.pendingTag, resumed) {
        val tag = ui.pendingTag
        if (!resumed && tag != null) {
            val hunter = state?.members?.firstOrNull { it.userId == tag.hunterId }?.username ?: fallbackHunter
            MatchNotifier.notify(context, 10, "$notifTagFrom $hunter", notifConfirmTag)
        }
    }
    LaunchedEffect(ui.pendingDispute, resumed) {
        if (!resumed && ui.pendingDispute != null && me?.isAdmin == true) {
            MatchNotifier.notify(context, 11, notifDispute, notifOpenApp)
        }
    }

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

    // Single source of truth for Game/Chat is the pager: tapping a tab starts the scroll
    // directly, so rapid taps re-target it instead of cancelling mid-flight (which used to
    // leave the pager stuck between pages).
    val scope = rememberCoroutineScope()
    val pagerState = rememberPagerState(pageCount = { 2 })
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

    LaunchedEffect(pagerState.currentPage, unread) {
        // Seed the marker on first load so already-read history is not shown as unread,
        // then keep it pinned while the reader is on the Chat page.
        if (pagerState.currentPage == 1 && unread > 0) {
            lastReadId = vm.chat.messages.maxOfOrNull { it.id } ?: -1L
        } else if (lastReadId < 0) {
            lastReadId = vm.chat.messages.maxOfOrNull { it.id } ?: -1L
        }
    }
    var showTagPicker by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }
    var showHistory by remember { mutableStateOf(false) }
    var showEndConfirm by remember { mutableStateOf(false) }
    var shownResultFor by rememberSaveable { mutableStateOf<String?>(null) }
    // Only open the result dialog for a match we actually watched: a room whose previous
    // match already finished must not greet a joining/reconnecting player with an old
    // "Hunters win!" window (found after the v0.9.0 review).
    var seenActivePhase by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(matchId, phase) {
        if (phase == Phases.HEAD_START || phase == Phases.HUNTING || phase == Phases.PAUSED) {
            seenActivePhase = true
        }
        if (matchId == null) seenActivePhase = false
    }

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
            error = ui.historyError,
            onDismiss = { showHistory = false },
        )
    }

    // A match used to end as a grey chat line with no moment of its own (UI review).
    // Show the result once per finished/cancelled match, with a clear way onward.
    val resultMatch = state?.match?.takeIf {
        it.phase == Phases.FINISHED || it.phase == Phases.CANCELLED
    }
    if (resultMatch != null && seenActivePhase && shownResultFor != resultMatch.id) {
        val cancelled = resultMatch.phase == Phases.CANCELLED
        val huntersWin = resultMatch.winner == Teams.HUNTERS
        val accent = if (huntersWin) teamColor(Teams.HUNTERS) else teamColor(Teams.PREY)
        Dialog(
            onDismissRequest = { shownResultFor = resultMatch.id },
            properties = DialogProperties(),
        ) {
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 6.dp,
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(
                        imageVector = when {
                            cancelled -> Icons.Outlined.Stop
                            huntersWin -> Icons.Outlined.GpsFixed
                            else -> Icons.Outlined.Pets
                        },
                        contentDescription = null,
                        modifier = Modifier.size(44.dp),
                        tint = accent,
                    )
                    Text(
                        t("Hunt result"),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        when {
                            cancelled -> t("Hunt cancelled")
                            huntersWin -> t("Hunters win!")
                            else -> t("Prey win!")
                        },
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        "${t("Prey remaining")}: ${resultMatch.preyAlive}/${resultMatch.preyTotal}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        TextButton(
                            onClick = {
                                shownResultFor = resultMatch.id
                                vm.loadHistory()
                                showHistory = true
                            },
                            modifier = Modifier.weight(1f),
                        ) { Text(t("View hunt history")) }
                        Button(
                            onClick = { shownResultFor = resultMatch.id },
                            modifier = Modifier.weight(1f),
                        ) { Text(t("Back to lobby")) }
                    }
                }
            }
        }
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
            title = { Text(t("Who did you tag?")) },
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
                                    // Tap-to-copy: the code was display-only before; a host
                                    // had to read it aloud to invite anyone.
                                    .clickable {
                                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                        clipboard.setPrimaryClip(
                                            ClipData.newPlainText(joinCodeLabel, state.room.code),
                                        )
                                        Toast.makeText(context, roomCodeCopied, Toast.LENGTH_SHORT).show()
                                    }
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
                                t(if (ui.connected) "Live" else "Reconnecting…"),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
                if (ui.loading) ManHuntLoader(size = 18.dp)
                if (state != null) {
                    IconButton(onClick = {
                        // A tappable invite link: opening it in the app auto-joins the room.
                        val link = repo.serverUrl.trimEnd('/') + "/join?code=" + state.room.code
                        val text = "$joinRoomPrefix\n${state.room.name} - $codeWord ${state.room.code}\n$link"
                        val send = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, text)
                        }
                        context.startActivity(Intent.createChooser(send, shareRoomTitle))
                    }, modifier = Modifier.testTag("share_room")) {
                        Icon(Icons.Outlined.Share, contentDescription = shareRoomTitle)
                    }
                }
                IconButton(onClick = {
                    vm.loadHistory()
                    showHistory = true
                }) {
                    Icon(Icons.Outlined.History, contentDescription = t("History"))
                }
            }

            TabRow(
                selectedTabIndex = pagerState.currentPage,
                containerColor = MaterialTheme.colorScheme.surface,
                indicator = { tabPositions -> PagerTabIndicator(pagerState, tabPositions) },
            ) {
                Tab(
                    selected = pagerState.currentPage == 0,
                    modifier = Modifier.testTag("tab_game"),
                    onClick = { scope.launch { pagerState.animateScrollToPage(0) } },
                    icon = { Icon(Icons.Outlined.SportsEsports, contentDescription = null) },
                    text = { Text(t("Game")) },
                )
                Tab(
                    selected = pagerState.currentPage == 1,
                    modifier = Modifier.testTag("tab_chat"),
                    onClick = {
                        lastReadId = vm.chat.messages.maxOfOrNull { it.id } ?: -1L
                        scope.launch { pagerState.animateScrollToPage(1) }
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

            // Swipe between Game and Chat. During a match the map page disables the pager
            // gesture so a horizontal map pan can never flip the tab by accident.
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.weight(1f).fillMaxWidth(),
                userScrollEnabled = !(pagerState.currentPage == 0 && showMatchMap),
            ) { page ->
                if (page == 0) {
                    val tacticalMatch = match?.takeIf { !lobby && showMatchMap }
                    if (tacticalMatch != null) {
                        TacticalHuntPage(
                            state = state,
                            match = tacticalMatch,
                            me = me,
                            ui = ui,
                            vm = vm,
                            activePhase = activePhase,
                            hasLocation = hasLocation,
                            locationDenied = locationDenied,
                            locationServicesOn = locationServicesOn,
                            resumed = resumed,
                            onTagPrey = { showTagPicker = true },
                            onOpenSettings = { showSettings = true },
                            onEndHunt = { showEndConfirm = true },
                            onOpenHistory = {
                                vm.loadHistory()
                                showHistory = true
                            },
                            onEnableGps = { permissionLauncher.launch(trackingPermissions) },
                            onOpenAppSettings = { openAppSettings(context) },
                            onOpenLocationSettings = {
                                context.startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                            },
                        )
                    } else {
                        // Lobby and finished/cancelled matches keep the original scrolling
                        // page; only a live hunt switches to the map-first tactical page.
                        Column(Modifier.fillMaxSize()) {
                val waitingTagClaim = state?.pendingTags?.firstOrNull { it.preyId == me?.userId && !it.disputed }
                val waitingDispute = state?.pendingTags?.firstOrNull { it.disputed }
                LazyColumn(
                state = listState,
                // weight, not fillMaxSize: the chat composer must keep its height (UI-01).
                modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 16.dp).testTag("lobby_list"),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                // Breathing room below the tab bar so the first card is not glued to it.
                contentPadding = PaddingValues(top = 12.dp, bottom = 12.dp),
            ) {

                // A dismissed tag dialog must not silently lose the decision: keep it visible
                // as a banner until the player actually answers it.
                if (waitingTagClaim != null && ui.pendingTag == null) {
                    item(key = "tag_waiting") { TagClaimWaitingCard(onReview = vm::reviewPendingTag) }
                }
                if (me?.isAdmin == true && waitingDispute != null && ui.pendingDispute == null) {
                    item(key = "dispute_waiting") {
                        DisputeWaitingCard(onReview = vm::reviewPendingDispute)
                    }
                }

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
                        item(key = "prey_status") { PreyStatusCard(prey = ui.locations!!.prey) }
                    }

                    if (me?.eliminated == true && phase == Phases.HUNTING) {
                        item { TaggedNoticeCard() }
                    }

                }

                item { RosterCard(state = state, lobby = lobby) }

                if (lobby) {
                    item {
                        ScreenCard {
                            SectionLabel(t("Choose your side"), Icons.Outlined.SwapHoriz)
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
                    }
                    }
                } else {
                    ChatTabContent(
                        vm = vm,
                        myUserId = repo.myUserId(),
                        modifier = Modifier.fillMaxSize(),
                    )
                }
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
    val ownLocation by LiveLocation.current.collectAsStateWithLifecycle()
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
    // Both sides keep their team-colour identity, but only the chosen side looks active:
    // a full-strength 3dp outline + tint + check badge versus a thin translucent outline on
    // a neutral surface (the earlier fix against "both cards look selected", improved).
    val outlineWidth by animateDpAsState(
        targetValue = if (selected) 3.dp else 1.5.dp,
        animationSpec = tween(Motion.STANDARD, easing = Motion.EaseOutExpo),
        label = "team-outline-width",
    )
    val outlineColor by animateColorAsState(
        targetValue = if (selected) color else color.copy(alpha = 0.45f),
        animationSpec = tween(Motion.STANDARD, easing = Motion.EaseOutExpo),
        label = "team-outline-color",
    )
    val background by animateColorAsState(
        targetValue = if (selected) color.copy(alpha = 0.16f)
        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
        animationSpec = tween(Motion.STANDARD, easing = Motion.EaseOutExpo),
        label = "team-card-background",
    )
    Surface(
        modifier = modifier
            .heightIn(min = 128.dp)
            // selectable() adds the selected/disabled semantics (radio-group style) and the
            // ripple; tapping your current side stays disabled as before.
            .selectable(
                selected = selected,
                enabled = enabled,
                role = Role.RadioButton,
                onClick = onClick,
            ),
        shape = RoundedCornerShape(20.dp),
        color = background,
        contentColor = if (selected) color else MaterialTheme.colorScheme.onSurface,
        border = BorderStroke(outlineWidth, outlineColor),
    ) {
        Box(Modifier.fillMaxSize().padding(10.dp)) {
            Column(
                modifier = Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally,
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
            if (selected) {
                // Visible "this is your side" marker; TalkBack also reads the localized label.
                Icon(
                    Icons.Outlined.CheckCircle,
                    contentDescription = t("Selected"),
                    modifier = Modifier.align(Alignment.TopEnd).size(20.dp),
                    tint = color,
                )
            }
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
            SectionLabel(t("The hunt"), Icons.Outlined.SportsEsports)
            Spacer(Modifier.weight(1f))
            Text(
                t(phase.replace('_', ' ').uppercase()),
                style = MaterialTheme.typography.labelMedium,
                color = phaseColor(phase),
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
                suffix = " · ${t("Prey remaining")} ${match?.preyAlive ?: 0}/${match?.preyTotal ?: 0}",
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
            // The explanation belongs NEXT TO the disabled button: in the previous layout
            // it sat below "Hunt rules", off the first screen (human review finding).
            if (blockers.isNotEmpty()) {
                Text(
                    "${t("Before you can start")}: ${blockers.joinToString(" · ")}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.tertiary,
                    modifier = Modifier.fillMaxWidth().testTag("start_blockers"),
                )
            }
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

/*
 * ---------------------------------------------------------------------------------------
 * Layout C - tactical, map-first live hunt page
 * ---------------------------------------------------------------------------------------
 * The live hunt page keeps the map on the whole Game page and moves every control into a
 * bottom sheet, so the map is never boxed into a fixed-height card again. Structure:
 *   - [TacticalHud]: at most two glance chips (phase+countdown, prey alive) over a scrim;
 *   - floating pending-claim banner(s) directly above the sheet until answered;
 *   - [HuntSheet]: a capped peek (status, role actions, attribution) with an expandable,
 *     scrollable details area for huntmaster controls, history, prey reports and roster.
 * Game rules stay server-authoritative: this file only renders state and calls the same
 * ViewModel actions the old layout used.
 */

/**
 * Map scrim so HUD chips and the sheet edge stay legible over bright tile labels.
 *
 * The top scrim stops at 64% width on purpose: the map's own zoom/recenter controls sit at
 * the top-end, and a full-width wash would dim the very controls the player needs.
 */
@Composable
private fun ScreenScrim(modifier: Modifier = Modifier, top: Boolean) {
    val scrim = MaterialTheme.colorScheme.background
    Box(
        modifier
            .fillMaxWidth(if (top) 0.64f else 1f)
            .height(if (top) 90.dp else 56.dp)
            .background(
                Brush.verticalGradient(
                    if (top) {
                        listOf(scrim.copy(alpha = 0.72f), Color.Transparent)
                    } else {
                        listOf(Color.Transparent, scrim.copy(alpha = 0.9f))
                    },
                ),
            ),
    )
}

/** Small floating chip used by the tactical HUD. */
@Composable
private fun HudChip(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Surface(
        modifier = modifier,
        shape = CircleShape,
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.88f),
        contentColor = MaterialTheme.colorScheme.onSurface,
        tonalElevation = ManHuntElevation.raised,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)),
    ) {
        Row(
            Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) { content() }
    }
}

/** Phase accent colour shared by the old phase card and the tactical HUD/sheet. */
@Composable
private fun phaseColor(phase: String): Color = when (phase) {
    Phases.HUNTING -> MaterialTheme.colorScheme.tertiary
    Phases.HEAD_START -> MaterialTheme.colorScheme.primary
    Phases.FINISHED -> MaterialTheme.colorScheme.secondary
    else -> MaterialTheme.colorScheme.onSurfaceVariant
}

/**
 * Glance HUD (top-start): phase + live countdown, then prey alive for hunters. Two chips
 * maximum and a tiny stale state - the sheet below carries the details.
 */
@Composable
private fun TacticalHud(
    match: MatchDto,
    phase: String,
    offset: Long,
    isHunter: Boolean,
    staleReports: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(modifier.testTag("hunt_hud"), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        HudChip {
            Box(Modifier.size(7.dp).background(phaseColor(phase), CircleShape))
            Spacer(Modifier.width(6.dp))
            Text(
                t(phase.replace('_', ' ').uppercase()),
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
                color = phaseColor(phase),
            )
            val target = when (phase) {
                Phases.HEAD_START -> match.headStartEndsAt
                Phases.HUNTING -> match.endsAt
                else -> null
            }
            if (target != null) {
                Spacer(Modifier.width(6.dp))
                CountdownText(
                    target = target,
                    offset = offset,
                    prefix = "",
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontFeatureSettings = "tnum",
                    ),
                )
            }
        }
        if (isHunter) {
            HudChip {
                Icon(
                    Icons.Outlined.GpsFixed,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.tertiary,
                )
                Spacer(Modifier.width(6.dp))
                // "1/2 Prey" reads correctly in both languages without a new key.
                Text(
                    "${match.preyAlive}/${match.preyTotal} ${t("Prey")}",
                    style = MaterialTheme.typography.labelMedium.copy(fontFeatureSettings = "tnum"),
                    fontWeight = FontWeight.SemiBold,
                )
            }
            if (staleReports) {
                // Tiny third state, deliberately not a paragraph.
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(6.dp).background(MaterialTheme.colorScheme.tertiary, CircleShape))
                    Spacer(Modifier.width(5.dp))
                    Text(
                        t("Stale"),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.tertiary,
                    )
                }
            }
        }
    }
}

/**
 * The full-bleed tactical live-hunt page. The sheet is a sibling overlay in the same Box,
 * not a scrolling parent: osmdroid keeps every gesture above the sheet, and the expanded
 * details area is the only scrollable part.
 */
@Composable
private fun TacticalHuntPage(
    state: RoomState,
    match: MatchDto,
    me: MemberDto?,
    ui: RoomUi,
    vm: RoomViewModel,
    activePhase: Boolean,
    hasLocation: Boolean,
    locationDenied: Boolean,
    locationServicesOn: Boolean,
    resumed: Boolean,
    onTagPrey: () -> Unit,
    onOpenSettings: () -> Unit,
    onEndHunt: () -> Unit,
    onOpenHistory: () -> Unit,
    onEnableGps: () -> Unit,
    onOpenAppSettings: () -> Unit,
    onOpenLocationSettings: () -> Unit,
) {
    val ownLocation by LiveLocation.current.collectAsStateWithLifecycle()
    // Server-clock offset, same rule the phase card uses: the countdown is wall-clock
    // driven from `match.now`, never computed from the local phase.
    val offset = remember(match.id, match.now) { match.now - System.currentTimeMillis() }
    // A dismissed-but-unanswered claim must stay visible until it is actually answered.
    val waitingClaim = state.pendingTags
        .firstOrNull { it.preyId == me?.userId && !it.disputed }
        ?.takeIf { ui.pendingTag == null }
    val waitingDispute = state.pendingTags
        .firstOrNull { it.disputed }
        ?.takeIf { me?.isAdmin == true && ui.pendingDispute == null }
    val staleReports = (ui.locations?.prey ?: emptyList()).any { it.stale && it.hasReport }

    Box(Modifier.fillMaxSize()) {
        MatchMap(
            modifier = Modifier.fillMaxSize().testTag("match_map_card"),
            ownLocation = ownLocation,
            prey = ui.locations?.prey ?: emptyList(),
            zone = match.zone,
            showPrey = me?.team == Teams.HUNTERS,
            trails = if (ui.trailsVisible) ui.trails else emptyMap(),
            // Full-bleed tactical mode: the sheet renders its own attribution link, and
            // the generous fit padding keeps prey/zone markers above the sheet.
            showAttribution = false,
            roundedCorners = false,
            fitPadding = 160.dp,
        )

        ScreenScrim(modifier = Modifier.align(Alignment.TopStart), top = true)

        TacticalHud(
            match = match,
            phase = match.phase,
            offset = offset,
            isHunter = me?.team == Teams.HUNTERS,
            staleReports = staleReports,
            modifier = Modifier.align(Alignment.TopStart).padding(12.dp),
        )

        // Bottom stack. Letting each piece size itself (instead of fixed offsets) keeps the
        // layout intact at fontScale 1.35 and with long Arabic strings.
        Column(Modifier.align(Alignment.BottomCenter).fillMaxWidth()) {
            if (waitingClaim != null || waitingDispute != null) {
                Column(
                    Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    waitingClaim?.let {
                        PendingClaimBanner(
                            title = t("A tag claim is waiting for your answer."),
                            detail = t("Confirm or dispute it to keep the hunt fair."),
                            action = t("Review tag claim"),
                            onAction = vm::reviewPendingTag,
                            testTag = "hunt_claim_banner",
                        )
                    }
                    waitingDispute?.let {
                        PendingClaimBanner(
                            title = t("A disputed tag is waiting for the huntmaster."),
                            detail = null,
                            action = t("Review dispute"),
                            onAction = vm::reviewPendingDispute,
                            testTag = "hunt_dispute_banner",
                        )
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
            ScreenScrim(top = false)
            HuntSheet(
                state = state,
                match = match,
                me = me,
                ui = ui,
                vm = vm,
                activePhase = activePhase,
                hasLocation = hasLocation,
                locationDenied = locationDenied,
                locationServicesOn = locationServicesOn,
                resumed = resumed,
                ownLocationKnown = ownLocation != null,
                offset = offset,
                onTagPrey = onTagPrey,
                onOpenSettings = onOpenSettings,
                onEndHunt = onEndHunt,
                onOpenHistory = onOpenHistory,
                onEnableGps = onEnableGps,
                onOpenAppSettings = onOpenAppSettings,
                onOpenLocationSettings = onOpenLocationSettings,
            )
        }
    }
}

/**
 * Floating pending-claim banner: overlays the map directly above the sheet and stays there
 * until the claim is answered, so a dismissed dialog can never lose a tag decision.
 */
@Composable
private fun PendingClaimBanner(
    title: String,
    detail: String?,
    action: String,
    onAction: () -> Unit,
    testTag: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxWidth().testTag(testTag),
        shape = RoundedCornerShape(ManHuntRadius.md),
        color = MaterialTheme.colorScheme.secondaryContainer,
        contentColor = MaterialTheme.colorScheme.onSecondaryContainer,
        tonalElevation = ManHuntElevation.raised,
        shadowElevation = ManHuntElevation.floating,
    ) {
        Row(
            Modifier.padding(start = 14.dp, end = 6.dp, top = 10.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                if (detail != null) {
                    Text(detail, style = MaterialTheme.typography.bodySmall)
                }
            }
            Spacer(Modifier.width(8.dp))
            TextButton(onClick = onAction) { Text(action) }
        }
    }
}

/** Required OSM attribution link: the tactical map hides its in-map chip. */
@Composable
private fun OsmAttribution(modifier: Modifier = Modifier) {
    val uriHandler = LocalUriHandler.current
    Text(
        "© OpenStreetMap contributors",
        modifier = modifier
            .testTag("hunt_attribution")
            .clickable { uriHandler.openUri(OSM_COPYRIGHT_URL) }
            .padding(vertical = 2.dp),
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

/**
 * Bottom sheet. Collapsed peek: status/timer + zone shrink line, the role's live actions
 * (primary Tag + trails for hunters, location fix for prey), the attribution link and the
 * expand chevron. Expanded details (capped, scrollable): huntmaster controls, history,
 * prey reports, tagged notice and roster.
 */
@Composable
private fun HuntSheet(
    state: RoomState,
    match: MatchDto,
    me: MemberDto?,
    ui: RoomUi,
    vm: RoomViewModel,
    activePhase: Boolean,
    hasLocation: Boolean,
    locationDenied: Boolean,
    locationServicesOn: Boolean,
    resumed: Boolean,
    ownLocationKnown: Boolean,
    offset: Long,
    onTagPrey: () -> Unit,
    onOpenSettings: () -> Unit,
    onEndHunt: () -> Unit,
    onOpenHistory: () -> Unit,
    onEnableGps: () -> Unit,
    onOpenAppSettings: () -> Unit,
    onOpenLocationSettings: () -> Unit,
) {
    var detailsExpanded by rememberSaveable(match.id) { mutableStateOf(false) }
    Surface(
        modifier = Modifier.fillMaxWidth().testTag("hunt_sheet"),
        shape = RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
        contentColor = MaterialTheme.colorScheme.onSurface,
        tonalElevation = ManHuntElevation.floating,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)),
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                // Short screens (landscape, big font scale): the sheet scrolls itself
                // instead of clipping controls; on a normal phone the content fits.
                .verticalScroll(rememberScrollState())
                .padding(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 12.dp),
        ) {
            // Drag-handle affordance: this sheet is the hunt's command surface.
            Box(
                Modifier
                    .align(Alignment.CenterHorizontally)
                    .width(36.dp)
                    .height(4.dp)
                    .background(
                        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
                        RoundedCornerShape(ManHuntRadius.pill),
                    ),
            )
            Spacer(Modifier.height(10.dp))

            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                HuntStatusLines(
                    match = match,
                    me = me,
                    offset = offset,
                    activePhase = activePhase,
                    hasLocation = hasLocation,
                    locationServicesOn = locationServicesOn,
                    resumed = resumed,
                    ownLocationKnown = ownLocationKnown,
                    modifier = Modifier.weight(1f),
                )
                IconButton(
                    onClick = { detailsExpanded = !detailsExpanded },
                    modifier = Modifier.size(ManHuntSizes.touchTarget).testTag("hunt_sheet_expand"),
                ) {
                    Icon(
                        imageVector = if (detailsExpanded) Icons.Outlined.ExpandLess else Icons.Outlined.ExpandMore,
                        contentDescription = t(if (detailsExpanded) "Hide details" else "Details"),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            Spacer(Modifier.height(8.dp))
            ErrorBanner(ui.error)
            HuntActionBar(
                phase = match.phase,
                me = me,
                ui = ui,
                activePhase = activePhase,
                hasLocation = hasLocation,
                locationDenied = locationDenied,
                locationServicesOn = locationServicesOn,
                onTagPrey = onTagPrey,
                onToggleTrails = vm::toggleTrails,
                onEnableGps = onEnableGps,
                onOpenAppSettings = onOpenAppSettings,
                onOpenLocationSettings = onOpenLocationSettings,
            )
            Row(
                Modifier.fillMaxWidth().padding(top = 6.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Attribution stays in the collapsed peek: OSM requires it to be visible,
                // and hiding it behind the expand toggle would break it on every screen.
                OsmAttribution()
            }
            AnimatedVisibility(visible = detailsExpanded) {
                HuntDetails(
                    state = state,
                    match = match,
                    me = me,
                    ui = ui,
                    vm = vm,
                    onOpenSettings = onOpenSettings,
                    onEndHunt = onEndHunt,
                    onOpenHistory = onOpenHistory,
                )
            }
        }
    }
}

/** Sharing-status / zone-shrink lines inside the sheet peek. The phase+timer live in the
 *  HUD above; repeating them here was noisy and visually duplicated the countdown. */
@Composable
private fun HuntStatusLines(
    match: MatchDto,
    me: MemberDto?,
    offset: Long,
    activePhase: Boolean,
    hasLocation: Boolean,
    locationServicesOn: Boolean,
    resumed: Boolean,
    ownLocationKnown: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            huntStatusText(
                phase = match.phase,
                me = me,
                activePhase = activePhase,
                hasLocation = hasLocation,
                locationServicesOn = locationServicesOn,
                resumed = resumed,
                ownLocationKnown = ownLocationKnown,
            ),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        val zone = match.zone
        val nextShrink = zone?.nextShrinkAt
        if (zone != null) {
            if (nextShrink != null) {
                CountdownText(
                    target = nextShrink,
                    offset = offset,
                    prefix = "${t("Zone")}: ${zone.radiusM.toInt()} ${t("m")} · ${t("Zone shrinks in")} ",
                    style = MaterialTheme.typography.labelSmall.copy(fontFeatureSettings = "tnum"),
                    color = MaterialTheme.colorScheme.tertiary,
                )
            } else {
                Text(
                    "${t("Zone")}: ${zone.radiusM.toInt()} ${t("m")}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

/** One-line hunt status: sharing state for prey, report state for hunters, pause/tagged notices. */
@Composable
private fun huntStatusText(
    phase: String,
    me: MemberDto?,
    activePhase: Boolean,
    hasLocation: Boolean,
    locationServicesOn: Boolean,
    resumed: Boolean,
    ownLocationKnown: Boolean,
): String = t(
    when {
        me?.eliminated == true && phase == Phases.HUNTING ->
            "You are spectating this match. You can still chat, but you cannot tag or share new positions."
        phase == Phases.PAUSED -> "The hunt is paused. The clock is stopped."
        activePhase && me?.team == Teams.PREY && hasLocation && !locationServicesOn ->
            "Turn on location services"
        me?.team == Teams.HUNTERS ->
            if (phase == Phases.HEAD_START) "Prey are hiding. Hunting starts in" else "Prey positions are the latest reports"
        activePhase && hasLocation && resumed && ownLocationKnown -> "Sharing your position"
        activePhase && hasLocation && resumed -> "Waiting for GPS"
        activePhase && hasLocation -> "Open the app to resume sharing"
        activePhase -> "Location off"
        else -> "Map"
    },
)

/**
 * The peek actions by role/phase: hunters get the primary Tag + trails pulse; prey get the
 * existing location-fix actions. Destructive huntmaster actions live in [HuntDetails].
 */
@Composable
private fun HuntActionBar(
    phase: String,
    me: MemberDto?,
    ui: RoomUi,
    activePhase: Boolean,
    hasLocation: Boolean,
    locationDenied: Boolean,
    locationServicesOn: Boolean,
    onTagPrey: () -> Unit,
    onToggleTrails: () -> Unit,
    onEnableGps: () -> Unit,
    onOpenAppSettings: () -> Unit,
    onOpenLocationSettings: () -> Unit,
) {
    val isHunter = me?.team == Teams.HUNTERS
    val isPrey = me?.team == Teams.PREY
    val eliminated = me?.eliminated == true
    val gpsAction: Pair<String, () -> Unit>? = when {
        !isPrey || !activePhase || eliminated -> null
        !hasLocation && locationDenied -> t("Allow in settings") to onOpenAppSettings
        !hasLocation -> t("Enable GPS") to onEnableGps
        !locationServicesOn -> t("Turn on") to onOpenLocationSettings
        else -> null
    }
    // Tag/trails only while the server phase allows tagging; head start and pause show the
    // countdown/status instead (no tag button to tap by mistake).
    val showTag = isHunter && !eliminated && phase == Phases.HUNTING
    if (!showTag && gpsAction == null) return

    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (showTag) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Button(
                    onClick = onTagPrey,
                    modifier = Modifier.weight(1f).heightIn(min = ManHuntSizes.touchTarget).testTag("hunt_tag_button"),
                ) {
                    Icon(Icons.Outlined.GpsFixed, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(t("Tag prey"), maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                OutlinedButton(
                    onClick = onToggleTrails,
                    modifier = Modifier.heightIn(min = ManHuntSizes.touchTarget).testTag("hunt_trails_button"),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                ) {
                    Icon(Icons.Outlined.Timeline, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(t(if (ui.trailsVisible) "Hide trails" else "Trails"), maxLines = 1)
                }
            }
        }
        if (gpsAction != null) {
            OutlinedButton(
                onClick = gpsAction.second,
                modifier = Modifier.fillMaxWidth().heightIn(min = ManHuntSizes.touchTarget).testTag("hunt_gps_button"),
            ) {
                Icon(Icons.Outlined.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(gpsAction.first, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

/** Expandable details: huntmaster controls, history access, prey reports, tagged notice, roster. */
@Composable
private fun HuntDetails(
    state: RoomState,
    match: MatchDto,
    me: MemberDto?,
    ui: RoomUi,
    vm: RoomViewModel,
    onOpenSettings: () -> Unit,
    onEndHunt: () -> Unit,
    onOpenHistory: () -> Unit,
) {
    val phase = match.phase
    val isAdmin = me?.isAdmin == true
    Column(
        Modifier
            .fillMaxWidth()
            .heightIn(max = 300.dp)
            .verticalScroll(rememberScrollState())
            .padding(top = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (isAdmin) {
            // Labeled, spaced, destructive-last: these are never icon-only next to Tag.
            SectionLabel(t("HUNTMASTER"), Icons.Outlined.Tune)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (phase == Phases.HUNTING) {
                    FullWidthHuntAction(
                        text = t("Pause hunt"),
                        icon = Icons.Outlined.Pause,
                        onClick = vm::pauseMatch,
                        testTag = "hunt_pause_button",
                    )
                }
                if (phase == Phases.PAUSED) {
                    FullWidthHuntAction(
                        text = t("Resume hunt"),
                        icon = Icons.Outlined.PlayArrow,
                        onClick = vm::resumeMatch,
                        testTag = "hunt_resume_button",
                    )
                }
                FullWidthHuntAction(
                    text = t("Hunt rules"),
                    icon = Icons.Outlined.Tune,
                    onClick = onOpenSettings,
                    testTag = "hunt_rules_button",
                )
                if (phase == Phases.HUNTING || phase == Phases.PAUSED) {
                    FullWidthHuntAction(
                        text = t("End hunt"),
                        icon = Icons.Outlined.Stop,
                        onClick = onEndHunt,
                        testTag = "hunt_end_button",
                        destructive = true,
                    )
                }
            }
        }
        FullWidthHuntAction(
            text = t("View hunt history"),
            icon = Icons.Outlined.History,
            onClick = onOpenHistory,
            testTag = "hunt_history_button",
        )
        val prey = ui.locations?.prey.orEmpty()
        if (me?.team == Teams.HUNTERS && prey.isNotEmpty()) {
            PreyStatusCard(prey = prey)
        }
        if (me?.eliminated == true && phase == Phases.HUNTING) {
            TaggedNoticeCard()
        }
        RosterCard(state = state, lobby = false)
    }
}

/** Full-width, labeled action used by the expanded huntmaster/details area. */
@Composable
private fun FullWidthHuntAction(
    text: String,
    icon: ImageVector,
    onClick: () -> Unit,
    testTag: String,
    destructive: Boolean = false,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().heightIn(min = ManHuntSizes.touchTarget).testTag(testTag),
        colors = if (destructive) {
            ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
        } else {
            ButtonDefaults.outlinedButtonColors()
        },
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(8.dp))
        Text(text, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/*
 * Shared hunt cards. The lobby/finished list and the tactical details area render the same
 * content; extracting them keeps the two paths identical (no "this only works in lobby"
 * drift) without changing what either surface shows.
 */

/** Dismissed tag claim banner: the claim is still answerable, so keep it visible. */
@Composable
private fun TagClaimWaitingCard(onReview: () -> Unit) {
    ScreenCard {
        Text(
            t("A tag claim is waiting for your answer."),
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
        )
        Text(
            t("Confirm or dispute it to keep the hunt fair."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Button(
            onClick = onReview,
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
        ) { Text(t("Review tag claim")) }
    }
}

/** Dismissed dispute banner for the huntmaster, until it is resolved. */
@Composable
private fun DisputeWaitingCard(onReview: () -> Unit) {
    ScreenCard {
        Text(
            t("A disputed tag is waiting for the huntmaster."),
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
        )
        Button(
            onClick = onReview,
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
        ) { Text(t("Review dispute")) }
    }
}

/** Text alternative to the map (accessibility) with per-player stale/live states. */
@Composable
private fun PreyStatusCard(prey: List<PreyLocationStatus>) {
    ScreenCard {
        prey.forEach { p ->
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
    }
}

/** Spectating notice after being tagged while the hunt is still running. */
@Composable
private fun TaggedNoticeCard() {
    ScreenCard {
        Text(t("You were tagged"), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
        Text(
            t("You are spectating this match. You can still chat, but you cannot tag or share new positions."),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/** Roster card shared by the lobby list and the tactical details area. */
@Composable
private fun RosterCard(state: RoomState, lobby: Boolean) {
    ScreenCard {
        SectionLabel("${t("Hunt roster")} (${state.members.size})", Icons.Outlined.Groups)
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
                                t("Offline"),
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
    val notReady = state.members.filter { !it.ready }
    if (notReady.isNotEmpty()) {
        blockers += "${t("Waiting for")} ${notReady.joinToString(", ") { it.username }} ${t("to ready up")}"
    }
    return blockers
}

