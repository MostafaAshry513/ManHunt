package com.manhunt.app.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.GpsFixed
import androidx.compose.material.icons.outlined.Pets
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.TabPosition
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.autofill.contentType
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.lerp
import com.manhunt.app.data.Teams
import com.manhunt.app.i18n.t
import com.manhunt.app.ui.theme.ManHuntElevation
import com.manhunt.app.ui.theme.ManHuntRadius
import com.manhunt.app.ui.theme.ManHuntSizes
import com.manhunt.app.ui.theme.ManHuntSpacing
import com.manhunt.app.ui.theme.Motion
import kotlin.math.abs

@Composable
fun teamColor(team: String): Color = when (team) {
    // Theme-aware: the light palette uses darker role colours so 11 sp labels keep AA contrast.
    Teams.PREY -> MaterialTheme.colorScheme.tertiary
    Teams.HUNTERS -> MaterialTheme.colorScheme.secondary
    else -> MaterialTheme.colorScheme.onSurfaceVariant
}

fun teamLabel(team: String): String = when (team) {
    Teams.PREY -> "Prey"
    Teams.HUNTERS -> "Hunters"
    else -> team
}

@Composable
fun TeamPill(team: String, modifier: Modifier = Modifier) {
    val color by animateColorAsState(
        teamColor(team),
        tween(Motion.STANDARD, easing = Motion.EaseOutExpo),
        label = "team-color",
    )
    // Role icon instead of a plain colour dot: the word alone was harder to scan.
    Pill(
        text = t(teamLabel(team)),
        color = color,
        modifier = modifier,
        icon = if (team == Teams.PREY) Icons.Outlined.Pets else Icons.Outlined.GpsFixed,
    )
}

/** Small rounded status chip: dot + label. Used for teams and statuses. */
@Composable
fun Pill(
    text: String,
    color: Color,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
) {
    Row(
        modifier = modifier
            .background(color.copy(alpha = 0.14f), RoundedCornerShape(ManHuntRadius.pill))
            .border(1.dp, color.copy(alpha = 0.30f), RoundedCornerShape(ManHuntRadius.pill))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(13.dp), tint = color)
        } else {
            Box(Modifier.size(7.dp).background(color, CircleShape))
        }
        Spacer(Modifier.width(6.dp))
        Text(
            text = text.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

/**
 * The standard raised "box" surface used across every screen.
 *
 * Existing call sites keep working: all new parameters are optional and have
 * defaults, and the content lambda still receives a ColumnScope.
 */
@Composable
fun ScreenCard(
    modifier: Modifier = Modifier,
    title: String? = null,
    subtitle: String? = null,
    icon: ImageVector? = null,
    containerColor: Color = MaterialTheme.colorScheme.surface,
    elevation: Dp = ManHuntElevation.card,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(ManHuntRadius.lg),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.28f)),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = elevation),
    ) {
        Column(
            Modifier.padding(ManHuntSpacing.card),
            verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.md),
        ) {
            if (title != null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (icon != null) {
                        Box(
                            Modifier
                                .size(34.dp)
                                .background(
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                                    RoundedCornerShape(ManHuntRadius.sm),
                                ),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                icon,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                                tint = MaterialTheme.colorScheme.primary,
                            )
                        }
                        Spacer(Modifier.width(ManHuntSpacing.md))
                    }
                    Column(Modifier.weight(1f)) {
                        Text(
                            title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.semantics { heading() },
                        )
                        if (subtitle != null) {
                            Text(
                                subtitle,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
            content()
        }
    }
}

/** Screen title row with an optional back affordance and trailing actions. */
@Composable
fun ScreenHeader(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = ManHuntSpacing.md, vertical = ManHuntSpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            IconButton(
                onClick = onBack,
                modifier = Modifier.size(ManHuntSizes.touchTarget),
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = t("Back"))
            }
        }
        Column(Modifier.weight(1f)) {
            Text(
                title,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.semantics { heading() },
            )
            if (subtitle != null) {
                Text(
                    subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        actions()
    }
}

/** Branded hero banner used on the auth and safety screens. */
@Composable
fun HeroBanner(
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
) {
    val brush = Brush.linearGradient(
        listOf(
            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.85f),
            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f),
        ),
    )
    Box(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(ManHuntRadius.xl))
            .background(brush)
            .border(
                1.dp,
                MaterialTheme.colorScheme.primary.copy(alpha = 0.30f),
                RoundedCornerShape(ManHuntRadius.xl),
            )
            .padding(ManHuntSpacing.xl),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.xs)) {
            if (icon != null) {
                Icon(
                    icon,
                    contentDescription = null,
                    modifier = Modifier.size(26.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
                Spacer(Modifier.height(ManHuntSpacing.xs))
            }
            Text(
                title,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.semantics { heading() },
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * Shared text field: themed shape, optional trailing action, autofill hint and
 * inline error text. A thin wrapper over OutlinedTextField so screens agree on
 * styling without duplicating it.
 */
@Composable
fun ManHuntTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    singleLine: Boolean = true,
    isError: Boolean = false,
    supportingText: String? = null,
    placeholder: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Done,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    autofillType: ContentType? = null,
    trailingIcon: (@Composable () -> Unit)? = null,
    testTag: String? = null,
) {
    var fieldModifier = modifier.fillMaxWidth()
    if (testTag != null) fieldModifier = fieldModifier.testTag(testTag)
    if (autofillType != null) fieldModifier = fieldModifier.contentType(autofillType)

    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = fieldModifier,
        enabled = enabled,
        singleLine = singleLine,
        isError = isError,
        shape = RoundedCornerShape(ManHuntRadius.md),
        placeholder = placeholder?.let { hint -> { Text(hint) } },
        supportingText = supportingText?.let { hint -> { Text(hint) } },
        visualTransformation = visualTransformation,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
        trailingIcon = trailingIcon,
        textStyle = MaterialTheme.typography.bodyLarge,
    )
}

/** Full-width primary action, 52 dp tall, with an inline loading state. */
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    icon: ImageVector? = null,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier.fillMaxWidth().heightIn(min = ManHuntSizes.button),
        shape = RoundedCornerShape(ManHuntRadius.md),
    ) {
        if (loading) {
            ManHuntLoader(size = 20.dp, color = MaterialTheme.colorScheme.onPrimary, label = text)
        } else {
            if (icon != null) {
                Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(ManHuntSpacing.sm))
            }
            Text(text, style = MaterialTheme.typography.labelLarge, textAlign = TextAlign.Center)
        }
    }
}

/** Full-width outlined action, 48 dp+ tall. */
@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: ImageVector? = null,
    contentColor: Color = MaterialTheme.colorScheme.primary,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.fillMaxWidth().heightIn(min = ManHuntSizes.touchTarget),
        shape = RoundedCornerShape(ManHuntRadius.md),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = contentColor),
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(ManHuntSpacing.sm))
        }
        Text(text, style = MaterialTheme.typography.labelLarge, textAlign = TextAlign.Center)
    }
}

/** Compact inline text action that still honours the 48 dp touch target. */
@Composable
fun InlineAction(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    contentColor: Color = MaterialTheme.colorScheme.primary,
) {
    TextButton(
        onClick = onClick,
        modifier = modifier.heightIn(min = ManHuntSizes.touchTarget),
        colors = ButtonDefaults.textButtonColors(contentColor = contentColor),
    ) { Text(text, style = MaterialTheme.typography.labelLarge) }
}

@Composable
fun ErrorBanner(
    message: String?,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null,
) {
    AnimatedVisibility(
        visible = !message.isNullOrBlank(),
        modifier = modifier,
        enter = fadeIn(tween(Motion.STANDARD, easing = Motion.EaseOutExpo)) +
            expandVertically(tween(Motion.STANDARD, easing = Motion.EaseOutExpo)),
        exit = fadeOut(tween(Motion.QUICK, easing = Motion.EaseInOut)) +
            shrinkVertically(tween(Motion.STANDARD, easing = Motion.EaseInOut)),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .animateContentSize()
                .background(
                    MaterialTheme.colorScheme.errorContainer,
                    RoundedCornerShape(ManHuntRadius.sm),
                )
                .padding(horizontal = ManHuntSpacing.md, vertical = ManHuntSpacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                message.orEmpty(),
                modifier = Modifier.weight(1f),
                color = MaterialTheme.colorScheme.onErrorContainer,
                style = MaterialTheme.typography.bodySmall,
            )
            if (onRetry != null) {
                InlineAction(
                    text = t("Try again"),
                    onClick = onRetry,
                    contentColor = MaterialTheme.colorScheme.error,
                )
            }
        }
    }
}

/**
 * Tab underline that follows the pager while it is being dragged, instead of jumping
 * to the new tab after the swipe settles.
 *
 * The pager's offset is read inside the layout lambda (not during composition) so a drag
 * invalidates layout instead of recomposing this composable on every frame.
 * shortcut: assumes TabRow gives every tab the same width, as both call sites do.
 */
@Composable
fun PagerTabIndicator(pagerState: PagerState, tabPositions: List<TabPosition>) {
    if (tabPositions.isEmpty()) return
    val tabWidth = tabPositions.first().width
    TabRowDefaults.SecondaryIndicator(
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentSize(Alignment.BottomStart)
            .offset {
                val current = pagerState.currentPage.coerceIn(0, tabPositions.lastIndex)
                val offset = pagerState.currentPageOffsetFraction
                val target = if (offset >= 0f) {
                    (current + 1).coerceAtMost(tabPositions.lastIndex)
                } else {
                    (current - 1).coerceAtLeast(0)
                }
                val fraction = abs(offset).coerceIn(0f, 1f)
                IntOffset(
                    x = lerp(tabPositions[current].left, tabPositions[target].left, fraction).roundToPx(),
                    y = 0,
                )
            }
            .width(tabWidth),
    )
}

@Composable
fun SectionLabel(text: String, icon: ImageVector? = null) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        if (icon != null) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
            Spacer(Modifier.width(5.dp))
        }
        Text(
            text = text.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.semantics { heading() },
        )
    }
    Spacer(Modifier.height(ManHuntSpacing.xxs))
}

/** A labelled row (icon + text + trailing slot) for settings/detail lists. */
@Composable
fun InfoRow(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    valueColor: Color = MaterialTheme.colorScheme.onSurfaceVariant,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Box(
                Modifier
                    .size(36.dp)
                    .background(
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.10f),
                        RoundedCornerShape(ManHuntRadius.sm),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Spacer(Modifier.width(ManHuntSpacing.md))
        }
        Column(Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                value,
                style = MaterialTheme.typography.bodyMedium,
                color = valueColor,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

/** Centred empty/error state with an optional action. */
@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    modifier: Modifier = Modifier,
    message: String? = null,
    action: (@Composable () -> Unit)? = null,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(ManHuntSpacing.lg),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm),
    ) {
        Box(
            Modifier
                .size(52.dp)
                .background(
                    MaterialTheme.colorScheme.primary.copy(alpha = 0.10f),
                    RoundedCornerShape(ManHuntRadius.md),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(26.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
        }
        Text(
            title,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
        )
        if (message != null) {
            Text(
                message,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
        action?.invoke()
    }
}

/** Inset divider matching the card border treatment. */
@Composable
fun SoftDivider(modifier: Modifier = Modifier) {
    Box(
        modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
    )
}

/** Full-screen scrim-free surface used by simple screens. Kept for consistency. */
@Composable
fun ScreenSurface(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.background,
        content = content,
    )
}
