package com.manhunt.app

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.manhunt.app.data.AppStorage
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

/** Guards the storage accounting/cleanup used by the Settings → Storage card. */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class StorageCacheTest {

    @Test
    fun cacheSizeCountsNestedFilesAndClearEmptiesTheCache() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        AppStorage.clearCache(context)

        val tiles = File(context.cacheDir, "osmdroid/tiles").apply { mkdirs() }
        File(tiles, "a.tile").writeBytes(ByteArray(1024))
        File(tiles, "b.tile").writeBytes(ByteArray(2048))
        File(context.cacheDir, "updates").apply { mkdirs() }
        File(File(context.cacheDir, "updates"), "manhunt-99.apk").writeBytes(ByteArray(512))

        assertEquals(3584L, AppStorage.cacheSizeBytes(context))

        AppStorage.clearCache(context)
        assertEquals(0L, AppStorage.cacheSizeBytes(context))
    }

    @Test
    fun byteFormattingIsHumanReadable() {
        assertEquals("512 B", AppStorage.formatBytes(512))
        assertEquals("1.0 KB", AppStorage.formatBytes(1024))
        assertEquals("1.5 KB", AppStorage.formatBytes(1536))
        assertEquals("2.0 MB", AppStorage.formatBytes(2L * 1024 * 1024))
    }
}
