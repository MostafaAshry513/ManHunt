package com.manhunt.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.manhunt.app.data.ChatMessage
import com.manhunt.app.i18n.t
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Group-chat style room chat with backwards paging.
 *
 * Recomposition contract:
 * - the composer draft lives here (or in the caller's saveable state) instead of the
 *   screen-level ViewModel state, so typing never recomposes the room screen;
 * - the list follows new messages only when the reader is already near the bottom, and
 *   keeps the visual position when an older page is prepended.
 */
@Composable
fun ChatPanel(
    messages: List<ChatMessage>,
    myUserId: String?,
    sending: Boolean,
    onSend: (String) -> Unit,
    error: String? = null,
    hasMore: Boolean = false,
    loadingOlder: Boolean = false,
    onLoadOlder: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    /**
     * Optional externally-hoisted draft. Production keeps the draft local; tests pass a
     * fixed value to render a populated composer. Null means "chat panel owns the draft".
     */
    draft: String? = null,
    onDraftChange: ((String) -> Unit)? = null,
) {
    val listState = rememberLazyListState()
    var localDraft by rememberSaveable { mutableStateOf("") }
    val activeDraft = draft ?: localDraft
    val updateDraft: (String) -> Unit = { value ->
        if (onDraftChange != null) onDraftChange(value) else localDraft = value
    }

    val olderItemCount = if (hasMore && onLoadOlder != null) 1 else 0
    // Stable, unique list keys, computed once per message list. Server ids are
    // authoritative; realtime system frames arrive with id == 0, so those rows are keyed
    // by createdAt + the occurrence index of that timestamp in ascending list order. Keys
    // never include the body or the absolute position, so prepending an older page (which
    // only contains larger-timestamp history with real ids) cannot re-key existing rows.
    val messageKeys = remember(messages) { stableMessageKeys(messages) }
    // Ids are the stable identity of a message; fall back to -1 when empty.
    var knownFirstId by remember { mutableLongStateOf(Long.MAX_VALUE) }
    var knownLastId by remember { mutableLongStateOf(-1L) }
    var didInitialScroll by remember { mutableStateOf(false) }

    LaunchedEffect(messages.size, messages.firstOrNull()?.id, messages.lastOrNull()?.id) {
        if (messages.isEmpty()) return@LaunchedEffect
        val firstId = messages.first().id
        val lastId = messages.last().id
        when {
            !didInitialScroll -> {
                // Open at the newest message once the first page arrives.
                listState.scrollToItem(messages.lastIndex + olderItemCount)
                didInitialScroll = true
            }
            knownFirstId != Long.MAX_VALUE && firstId < knownFirstId -> {
                // An older page was prepended: scrolling by the number of inserted rows
                // keeps the reader anchored on the message they were reading.
                val added = messages.count { it.id < knownFirstId }
                if (added > 0) {
                    listState.scrollToItem((listState.firstVisibleItemIndex + added).coerceAtLeast(0))
                }
            }
            lastId > knownLastId -> {
                val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: -1
                val nearBottom = lastVisible >= listState.layoutInfo.totalItemsCount - 2 || messages.size <= 6
                if (nearBottom) listState.animateScrollToItem(messages.lastIndex + olderItemCount)
            }
        }
        knownFirstId = firstId
        knownLastId = lastId
    }

    Column(modifier.fillMaxSize()) {
        if (messages.isEmpty()) {
            Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text(
                    t("No messages yet. Say hello."),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        } else {
            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                if (hasMore && onLoadOlder != null) {
                    item(key = "load_older") {
                        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                            TextButton(
                                onClick = onLoadOlder,
                                enabled = !loadingOlder,
                                // Material minimum touch target: 48dp tall even when the
                                // label is replaced by the small inline spinner.
                                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 10.dp),
                                modifier = Modifier
                                    .heightIn(min = 48.dp)
                                    .testTag("chat_load_older"),
                            ) {
                                if (loadingOlder) {
                                    ManHuntLoader(size = 16.dp)
                                } else {
                                    Text(t("Load older messages"))
                                }
                            }
                        }
                    }
                }
                items(
                    count = messages.size,
                    key = { index -> messageKeys[index] },
                ) { index ->
                    val message = messages[index]
                    MessageBubble(
                        message = message,
                        mine = message.userId != null && message.userId == myUserId,
                    )
                }
            }
        }

        ErrorBanner(error)
        Composer(
            draft = activeDraft,
            onDraftChange = updateDraft,
            sending = sending,
            onSend = {
                val text = activeDraft.trim()
                if (text.isNotEmpty()) {
                    onSend(text)
                    // The panel owns the draft: clear it as soon as the message is sent.
                    if (draft == null) localDraft = ""
                }
            },
        )
    }
}

@Composable
private fun MessageBubble(message: ChatMessage, mine: Boolean) {
    if (message.kind == "system") {
        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            Text(
                message.body,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .background(
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                        RoundedCornerShape(10.dp),
                    )
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            )
        }
        return
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start,
    ) {
        Column(
            horizontalAlignment = if (mine) Alignment.End else Alignment.Start,
            modifier = Modifier.widthIn(max = 300.dp),
        ) {
            if (!mine) {
                Text(
                    message.username,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(start = 6.dp, bottom = 2.dp),
                )
            }
            Box(
                modifier = Modifier
                    .background(
                        color = if (mine) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(
                            topStart = 18.dp,
                            topEnd = 18.dp,
                            bottomEnd = if (mine) 4.dp else 18.dp,
                            bottomStart = if (mine) 18.dp else 4.dp,
                        ),
                    )
                    .padding(horizontal = 14.dp, vertical = 9.dp),
            ) {
                Text(
                    message.body,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (mine) MaterialTheme.colorScheme.onPrimary
                    else MaterialTheme.colorScheme.onSurface,
                )
            }
            Text(
                formatTime(message.createdAt),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 2.dp, start = 6.dp, end = 6.dp),
            )
        }
    }
}

@Composable
private fun Composer(
    draft: String,
    onDraftChange: (String) -> Unit,
    sending: Boolean,
    onSend: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        OutlinedTextField(
            value = draft,
            onValueChange = onDraftChange,
            modifier = Modifier.weight(1f).testTag("chat_input"),
            placeholder = { Text(t("Message")) },
            maxLines = 4,
            shape = RoundedCornerShape(22.dp),
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Sentences,
                imeAction = ImeAction.Default,
            ),
        )
        FilledIconButton(
            onClick = onSend,
            enabled = draft.isNotBlank() && !sending,
            modifier = Modifier.size(48.dp).testTag("chat_send"),
        ) {
            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = t("Send message"))
        }
    }
}

/**
 * LazyColumn keys, guaranteed unique for the current list.
 *
 * - Persisted messages (server id > 0): `m-<id>` — the database primary key is unique and
 *   survives paging, so the key is stable when older pages are prepended.
 * - Realtime/system frames (server sends `id: 0` for the broadcast-only system message):
 *   `s-<createdAt>-<occurrence>`, where occurrence counts earlier id-less rows with the
 *   same createdAt in ascending list order. Two system frames with an identical body and
 *   timestamp therefore get distinct keys, while the key still never depends on the body
 *   hash or the absolute list index (so it does not change when history is prepended).
 */
private fun stableMessageKeys(messages: List<ChatMessage>): List<String> {
    val occurrenceByCreatedAt = HashMap<Long, Int>(messages.size)
    return messages.map { message ->
        if (message.id > 0) {
            "m-${message.id}"
        } else {
            val occurrence = occurrenceByCreatedAt.getOrDefault(message.createdAt, 0)
            occurrenceByCreatedAt[message.createdAt] = occurrence + 1
            "s-${message.createdAt}-$occurrence"
        }
    }
}

private fun formatTime(epochMs: Long): String {
    if (epochMs <= 0) return ""
    return Instant.ofEpochMilli(epochMs)
        .atZone(ZoneId.systemDefault())
        .format(DateTimeFormatter.ofPattern("HH:mm"))
}
