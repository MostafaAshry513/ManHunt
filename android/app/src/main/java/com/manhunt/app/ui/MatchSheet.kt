package com.manhunt.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.manhunt.app.ui.theme.BoardColors
import com.manhunt.app.ui.theme.BoardShape
import com.manhunt.app.ui.theme.BoardSpace
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntType

/**
 * `MatchSheet` (screens/01-shell-and-board.md §5.6, screens/10-dialogs-and-sheets.md): every
 * in-room confirmation and decision flow is a 2 dp-top bottom sheet, not a Material dialog.
 * Title states the consequence, body is one or two factual sentences, actions are stacked
 * full-width 56/48 BoardButtons with a hairline gesture rule above.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatchSheet(
    onDismissRequest: () -> Unit,
    title: String,
    modifier: Modifier = Modifier,
    body: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        modifier = modifier,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = BoardShape.sheet,
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
        scrimColor = BoardColors.ink.copy(alpha = if (BoardTheme.isDark()) 0.60f else 0.45f),
        dragHandle = {
            Box(
                Modifier
                    .padding(top = BoardSpace.s5)
                    .width(40.dp)
                    .height(2.dp)
                    .background(BoardTheme.hairlineStrong()),
            )
        },
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = BoardSpace.screen)
                .padding(top = BoardSpace.s3, bottom = BoardSpace.s8),
        ) {
            Text(
                title,
                style = ManHuntType.headline(),
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.semantics { heading() },
            )
            if (body != null) {
                Text(
                    body,
                    style = ManHuntType.bodySmall(),
                    color = BoardTheme.muted(),
                    modifier = Modifier.padding(top = BoardSpace.s3),
                )
            }
            Column(Modifier.padding(top = BoardSpace.s6)) { content() }
        }
    }
}
