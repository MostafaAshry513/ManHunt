package com.manhunt.app

import android.graphics.Bitmap
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.dp
import com.manhunt.app.data.LatLng
import com.manhunt.app.data.PreyLocationStatus
import com.manhunt.app.data.TrailPoint
import com.manhunt.app.data.ZoneDto
import com.manhunt.app.map.MatchMap
import com.manhunt.app.ui.theme.ManHuntTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.osmdroid.config.Configuration
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Renders the real hunting map component (zone, trail, prey markers) on the JVM.
 * Tiles are not fetched here; the overlays are produced by the production composable.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [36], qualifiers = "w411dp-h891dp-xxhdpi")
class GameScreenshotTest {

    @get:Rule
    val rule = createComposeRule()

    @Test
    fun captureHuntingMap() {
        Configuration.getInstance().userAgentValue = "ManHunt/0.6 (preview)"

        val zone = ZoneDto(centerLat = 51.5007, centerLng = -0.1246, radiusM = 420.0)
        val now = 1_700_000_000_000L
        val prey = listOf(
            PreyLocationStatus("u2", "bob", 51.5020, -0.1230, 6.0, now, now, stale = false, hasReport = true),
            PreyLocationStatus("u3", "cara", 51.4990, -0.1265, 22.0, now - 900_000, now, stale = true, hasReport = true),
        )
        val trail = listOf(
            TrailPoint(51.5035, -0.1200, 8.0, now - 1_200_000),
            TrailPoint(51.5030, -0.1215, 8.0, now - 900_000),
            TrailPoint(51.5024, -0.1226, 7.0, now - 600_000),
            TrailPoint(51.5020, -0.1230, 6.0, now),
        )

        rule.setContent {
            ManHuntTheme(darkTheme = true) {
                Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    Column(Modifier.padding(12.dp)) {
                        Text("HUNTING · 42:17 left", style = MaterialTheme.typography.titleMedium)
                        MatchMap(
                            modifier = Modifier.fillMaxWidth().height(560.dp).padding(top = 8.dp),
                            ownLocation = LatLng(51.5009, -0.1252),
                            prey = prey,
                            zone = zone,
                            showPrey = true,
                            trails = mapOf("u2" to trail),
                        )
                    }
                }
            }
        }
        rule.waitForIdle()

        val bitmap = rule.onRoot().captureToImage().asAndroidBitmap()
        val out = File("build/screenshots/04-hunting-map.png")
        out.parentFile?.mkdirs()
        out.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
}
