package com.manhunt.app

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Paint
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.GpsFixed
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.MyLocation
import androidx.compose.material.icons.outlined.Pause
import androidx.compose.material.icons.outlined.Pets
import androidx.compose.material.icons.outlined.Remove
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.material.icons.outlined.Timeline
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.manhunt.app.ui.theme.ManHuntTheme
import com.manhunt.app.ui.theme.ManHuntRadius
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Design explorations for the hunting map. These render phone-sized mock ups with a
 * real styled tile mosaic so the layout and colour options can be compared before the
 * production MatchMap is changed. Images land in build/map-samples/.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w411dp-h891dp-xxhdpi")
class MapSamplesTest {

    @get:Rule
    val rule = createComposeRule()

    enum class Layout { IMMERSIVE, CARD, TACTICAL, CURRENT }

    @Test
    fun layoutAImmersive() = capture("layout-a-immersive", Layout.IMMERSIVE, "style-teal.png", "A · Immersive")

    @Test
    fun layoutBCard() = capture("layout-b-card", Layout.CARD, "style-teal.png", "B · 16:9 card")

    @Test
    fun layoutCTactical() = capture("layout-c-tactical", Layout.TACTICAL, "style-teal.png", "C · Tactical")

    @Test
    fun layoutDCurrent() = capture("layout-d-current", Layout.CURRENT, "style-ink.png", "D · Current")

    @Test
    fun styleInk() = capture("style-1-ink", Layout.CARD, "style-ink.png", "Style 1 · Ink")

    @Test
    fun styleTeal() = capture("style-2-teal", Layout.CARD, "style-teal.png", "Style 2 · Deep teal")

    @Test
    fun styleSlate() = capture("style-3-slate", Layout.CARD, "style-slate.png", "Style 3 · Slate")

    @Test
    fun styleDaylight() = capture("style-4-daylight", Layout.CARD, "style-daylight.png", "Style 4 · Daylight")

    private fun capture(name: String, layout: Layout, asset: String, label: String) {
        val image = load(asset)
        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                SampleScreen(image, layout, label)
            }
        }
        rule.waitForIdle()
        val bitmap = rule.onRoot().captureToImage().asAndroidBitmap()
        val out = File("build/map-samples/$name.png")
        out.parentFile?.mkdirs()
        out.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        bitmap.recycle()
    }

    private fun load(asset: String): ImageBitmap {
        val stream = javaClass.classLoader!!.getResourceAsStream("map-samples/$asset")
            ?: error("missing map sample asset $asset")
        return BitmapFactory.decodeStream(stream).asImageBitmap()
    }
}

@Composable
private fun SampleScreen(map: ImageBitmap, layout: MapSamplesTest.Layout, label: String) {
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(Modifier.fillMaxSize()) {
            SampleHeader()
            SampleTabs()
            when (layout) {
                MapSamplesTest.Layout.IMMERSIVE -> ImmersiveLayout(map, label)
                MapSamplesTest.Layout.CARD -> CardLayout(map, label)
                MapSamplesTest.Layout.TACTICAL -> TacticalLayout(map, label)
                MapSamplesTest.Layout.CURRENT -> CurrentLayout(map, label)
            }
        }
    }
}

@Composable
private fun SampleHeader() {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null)
        Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
            Text(
                "The Night Run",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.16f),
                    shape = RoundedCornerShape(6.dp),
                ) {
                    Text(
                        "N1GHT",
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
                Spacer(Modifier.width(8.dp))
                Box(Modifier.size(7.dp).background(MaterialTheme.colorScheme.primary, CircleShape))
                Spacer(Modifier.width(5.dp))
                Text("Live", style = MaterialTheme.typography.bodySmall)
            }
        }
        Icon(Icons.Outlined.Share, contentDescription = null)
        Spacer(Modifier.width(14.dp))
        Icon(Icons.Outlined.History, contentDescription = null)
    }
}

@Composable
private fun SampleTabs() {
    TabRow(
        selectedTabIndex = 0,
        containerColor = MaterialTheme.colorScheme.surface,
    ) {
        Tab(
            selected = true,
            onClick = {},
            icon = { Icon(Icons.Outlined.Pets, contentDescription = null, modifier = Modifier.size(20.dp)) },
            text = { Text("Game") },
        )
        Tab(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.Timeline, contentDescription = null, modifier = Modifier.size(20.dp)) },
            text = { Text("Chat") },
        )
    }
}

@Composable
private fun ImmersiveLayout(map: ImageBitmap, label: String) {
    Column(Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxWidth().height(330.dp)) {
            MapBackdrop(
                map = map,
                modifier = Modifier.fillMaxSize(),
                shape = RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp),
            )
            Row(
                Modifier.align(Alignment.TopStart).padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                HudChip("HUNTING · 42:17", Icons.Outlined.Timer)
                HudChip("Prey 1/2", Icons.Outlined.GpsFixed)
            }
            MapControls(Modifier.align(Alignment.TopEnd).padding(10.dp))
            Attribution(Modifier.align(Alignment.BottomEnd).padding(8.dp))
            ChipLabel(label, Modifier.align(Alignment.BottomStart).padding(8.dp))
        }
        Column(
            Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            HuntStatusCard()
            Text(
                "Hunters are live. The prey was last seen near the river — trails are on.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun CardLayout(map: ImageBitmap, label: String) {
    Column(
        Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(Modifier.fillMaxWidth().aspectRatio(16f / 9f)) {
            MapBackdrop(
                map = map,
                modifier = Modifier.fillMaxSize(),
                shape = RoundedCornerShape(24.dp),
            )
            Row(
                Modifier.align(Alignment.TopStart).padding(10.dp),
                horizontalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                HudChip("HUNTING · 42:17", Icons.Outlined.Timer)
                HudChip("1/2 prey", Icons.Outlined.GpsFixed)
            }
            MapControls(Modifier.align(Alignment.TopEnd).padding(8.dp), compact = true)
            Attribution(Modifier.align(Alignment.BottomEnd).padding(6.dp))
            ChipLabel(label, Modifier.align(Alignment.BottomStart).padding(6.dp))
        }
        HuntStatusCard()
        Text(
            "The map card uses a 16:9 frame with floating controls, so it fits the screen without the old fixed-height letterboxing.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun TacticalLayout(map: ImageBitmap, label: String) {
    Box(Modifier.fillMaxSize()) {
        MapBackdrop(map, Modifier.fillMaxSize(), RoundedCornerShape(0.dp))
        Row(
            Modifier.align(Alignment.TopStart).padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            HudChip("HUNTING · 42:17", Icons.Outlined.Timer)
            HudChip("1/2 prey", Icons.Outlined.GpsFixed)
        }
        MapControls(Modifier.align(Alignment.TopEnd).padding(12.dp))
        Attribution(Modifier.align(Alignment.BottomStart).padding(12.dp, bottom = 150.dp))
        ChipLabel(label, Modifier.align(Alignment.BottomEnd).padding(12.dp, bottom = 150.dp))
        Surface(
            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth(),
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
            shape = RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp),
            tonalElevation = 6.dp,
        ) {
            Column(
                Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    "Hunters are live — tag confirmed by prey",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    "The prey was last seen near the river. Trails are on.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(onClick = {}, modifier = Modifier.weight(1f).height(48.dp)) {
                        Icon(Icons.Outlined.GpsFixed, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(7.dp))
                        Text("Tag prey")
                    }
                    OutlinedButton(onClick = {}, modifier = Modifier.height(48.dp)) {
                        Icon(Icons.Outlined.Pause, contentDescription = null)
                    }
                    OutlinedButton(onClick = {}, modifier = Modifier.height(48.dp)) {
                        Icon(Icons.Outlined.Close, contentDescription = null)
                    }
                }
            }
        }
    }
}

@Composable
private fun CurrentLayout(map: ImageBitmap, label: String) {
    Column(
        Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(220.dp)
                .border(
                    1.dp,
                    MaterialTheme.colorScheme.outline.copy(alpha = 0.35f),
                    RoundedCornerShape(20.dp),
                ),
        ) {
            MapBackdrop(map, Modifier.fillMaxSize(), RoundedCornerShape(20.dp))
            MapControls(Modifier.align(Alignment.TopEnd).padding(8.dp), compact = true)
            Attribution(Modifier.align(Alignment.BottomEnd).padding(6.dp))
            ChipLabel(label, Modifier.align(Alignment.BottomStart).padding(6.dp))
        }
        HuntStatusCard()
        Text(
            "Current fixed 220 dp card with side margins: the map is boxed in and leaves no reading room for trails.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun MapBackdrop(map: ImageBitmap, modifier: Modifier, shape: RoundedCornerShape) {
    Box(modifier.clip(shape).background(MaterialTheme.colorScheme.surfaceVariant)) {
        Image(
            bitmap = map,
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        MapOverlay(Modifier.fillMaxSize())
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        0f to Color.Black.copy(alpha = 0.18f),
                        0.35f to Color.Transparent,
                        0.75f to Color.Transparent,
                        1f to Color.Black.copy(alpha = 0.28f),
                    ),
                ),
        )
    }
}

@Composable
private fun MapOverlay(modifier: Modifier) {
    val cyan = MaterialTheme.colorScheme.primary
    val coral = MaterialTheme.colorScheme.tertiary
    val labelColor = MaterialTheme.colorScheme.onSurface
    val density = LocalDensity.current
    val labelPaint = remember(density) {
        Paint().apply {
            color = android.graphics.Color.WHITE
            textSize = with(density) { 11.sp.toPx() }
            isAntiAlias = true
            typeface = android.graphics.Typeface.create(
                android.graphics.Typeface.DEFAULT,
                android.graphics.Typeface.BOLD,
            )
            setShadowLayer(4f, 0f, 1f, android.graphics.Color.BLACK)
        }
    }
    Canvas(modifier) {
        val w = size.width
        val h = size.height
        val center = Offset(w * 0.58f, h * 0.46f)
        val zoneRadius = minOf(w, h) * 0.31f
        drawCircle(cyan.copy(alpha = 0.12f), zoneRadius, center)
        drawCircle(cyan.copy(alpha = 0.75f), zoneRadius, center, style = Stroke(2.dp.toPx()))

        val points = listOf(
            Offset(w * 0.18f, h * 0.78f),
            Offset(w * 0.29f, h * 0.61f),
            Offset(w * 0.42f, h * 0.58f),
            center,
        )
        val trail = Path().apply {
            moveTo(points.first().x, points.first().y)
            points.drop(1).forEach { lineTo(it.x, it.y) }
        }
        drawPath(trail, coral.copy(alpha = 0.85f), style = Stroke(3.dp.toPx(), cap = StrokeCap.Round))

        drawPreyMarker(Offset(w * 0.69f, h * 0.34f), "bob", coral, labelPaint, 8.dp.toPx())
        drawPreyMarker(Offset(w * 0.44f, h * 0.68f), "cara", coral, labelPaint, 7.dp.toPx())

        val me = Offset(w * 0.33f, h * 0.74f)
        drawCircle(Color.White, 8.dp.toPx(), me)
        drawCircle(cyan, 6.dp.toPx(), me)
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawPreyMarker(
    position: Offset,
    name: String,
    color: Color,
    labelPaint: Paint,
    radiusPx: Float,
) {
    drawCircle(Color.White, radiusPx + 1.5f, position)
    drawCircle(color, radiusPx, position)
    drawContext.canvas.nativeCanvas.drawText(
        name,
        position.x + radiusPx + 5f,
        position.y + 4f,
        labelPaint,
    )
}

@Composable
private fun HudChip(text: String, icon: ImageVector) {
    Surface(
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.82f),
        shape = CircleShape,
        tonalElevation = 2.dp,
    ) {
        Row(
            Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(6.dp))
            Text(text, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun MapControls(modifier: Modifier = Modifier, compact: Boolean = false) {
    val size = if (compact) 34.dp else 40.dp
    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        MapFab(Icons.Outlined.Add, size)
        MapFab(Icons.Outlined.Remove, size)
        MapFab(Icons.Outlined.MyLocation, size)
    }
}

@Composable
private fun MapFab(icon: ImageVector, size: androidx.compose.ui.unit.Dp) {
    Surface(
        shape = CircleShape,
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f),
        tonalElevation = 2.dp,
    ) {
        IconButton(onClick = {}, modifier = Modifier.size(size)) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun Attribution(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(6.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.82f),
    ) {
        Text(
            "© OpenStreetMap",
            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun ChipLabel(label: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(7.dp),
        color = Color.Black.copy(alpha = 0.62f),
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = Color.White,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun HuntStatusCard() {
    Surface(
        shape = RoundedCornerShape(ManHuntRadius.md),
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
        ),
    ) {
        Column(
            Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "THE HUNT",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "HUNTING",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.tertiary,
                    fontWeight = FontWeight.SemiBold,
                )
            }
            Text("42:17 · Prey remaining 1/2", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = {}, modifier = Modifier.weight(1f).height(48.dp)) {
                    Icon(Icons.Outlined.GpsFixed, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(7.dp))
                    Text("Tag prey")
                }
                OutlinedButton(onClick = {}, modifier = Modifier.height(48.dp)) {
                    Icon(Icons.Outlined.Timeline, contentDescription = null)
                }
            }
        }
    }
}
