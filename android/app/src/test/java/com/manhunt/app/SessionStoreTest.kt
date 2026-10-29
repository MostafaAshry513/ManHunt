package com.manhunt.app

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.manhunt.app.data.SessionStore
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SessionStoreTest {

    private fun store(): SessionStore {
        val context = ApplicationProvider.getApplicationContext<Context>()
        context.getSharedPreferences("manhunt", Context.MODE_PRIVATE).edit().clear().commit()
        return SessionStore(context)
    }

    @Test
    fun sessionRoundTripAndClear() {
        val s = store()
        assertNull(s.token)
        s.token = "abc"
        s.userJson = "{\"id\":\"u1\",\"username\":\"alice\"}"
        assertEquals("abc", s.token)

        s.clearSession()
        assertNull(s.token)
        assertNull(s.userJson)
    }

    @Test
    fun serverUrlIsTrimmed() {
        val s = store()
        s.serverUrl = "  http://192.168.1.20:8080/  "
        assertEquals("http://192.168.1.20:8080", s.serverUrl)
    }

    @Test
    fun safetyStartsUnacceptedAndPersists() {
        val s = store()
        assertFalse(s.safetyAccepted)
        s.safetyAccepted = true
        assertTrue(SessionStore(ApplicationProvider.getApplicationContext()).safetyAccepted)
    }

    @Test
    fun darkThemeDefaultsToTrue() {
        val s = store()
        assertTrue(s.darkTheme)
        s.darkTheme = false
        assertFalse(SessionStore(ApplicationProvider.getApplicationContext()).darkTheme)
    }
}
