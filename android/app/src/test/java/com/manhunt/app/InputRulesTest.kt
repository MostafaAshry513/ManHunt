package com.manhunt.app

import com.manhunt.app.data.InputRules
import org.junit.Assert.assertEquals
import org.junit.Test

/** Client-side datatype/length filters (the server re-validates everything). */
class InputRulesTest {

    @Test
    fun usernameAcceptsOnlyMatchesServerGrammar() {
        assertEquals("Alice99", InputRules.username("Alice 99!"))
        assertEquals("abc12", InputRules.username("a b c - 1 2 !"))
        assertEquals(24, InputRules.username("a".repeat(40)).length)
    }

    @Test
    fun inviteCodeIsUppercaseAlphanumericAndSixCharacters() {
        assertEquals("ABC123", InputRules.inviteCode("ab-c 12 3 zzz"))
        assertEquals("ABCDEF", InputRules.inviteCode("abcdefghij"))
        assertEquals(InputRules.INVITE_CODE_LENGTH, InputRules.inviteCode("123456789").length)
    }

    @Test
    fun roomNameKeepsPrintableCharactersOnly() {
        assertEquals("Night hunt!", InputRules.roomName("Night hunt!"))
        assertEquals("Hunt2", InputRules.roomName("Hunt\n2\u0000"))
        assertEquals(InputRules.MAX_ROOM_NAME, InputRules.roomName("x".repeat(60)).length)
    }

    @Test
    fun digitFieldsRejectNonNumbersAndCapLength() {
        assertEquals("123", InputRules.digits("1a2b3c", 3))
        assertEquals("60", InputRules.digits("60 minutes"))
        assertEquals("12", InputRules.digits("-12"))
    }

    @Test
    fun coordinatesAcceptDecimalsWithSingleSignAndDot() {
        assertEquals("51.5074", InputRules.coordinate("51.5074"))
        assertEquals("-0.1278", InputRules.coordinate("-0.12-78"))
        // The second dot is dropped rather than producing an unparsable number.
        assertEquals("12.34", InputRules.coordinate("12.3.4"))
        assertEquals("", InputRules.coordinate("abc"))
    }
}
