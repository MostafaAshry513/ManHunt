package com.manhunt.app.data

/**
 * Client-side input filters. They mirror the server's accepted types so players cannot
 * type text into a numeric field (or paste an over-long invite code) and only find out
 * after a round-trip. The server remains the authority.
 */
object InputRules {
    const val MIN_USERNAME = 3
    const val MAX_USERNAME = 24
    const val MAX_PASSWORD = 200
    const val MAX_ROOM_NAME = 30
    const val INVITE_CODE_LENGTH = 6
    const val MAX_COORDINATE = 12

    /** Server rule: 3-24 characters, letters, numbers or underscore. */
    fun username(value: String): String =
        value.filter { it.isLetterOrDigit() || it == '_' }.take(MAX_USERNAME)

    fun password(value: String): String = value.take(MAX_PASSWORD)

    /** Hunt names are printable characters with single spaces, no control characters. */
    fun roomName(value: String): String =
        value.filter { it.isLetterOrDigit() || it == ' ' || it in "-_.'!?" }.take(MAX_ROOM_NAME)

    /** Invite codes are the six uppercase letters/digits the server generates. */
    fun inviteCode(value: String): String =
        value.uppercase().filter { it.isLetterOrDigit() }.take(INVITE_CODE_LENGTH)

    /** Whole-number fields (minutes, metres). */
    fun digits(value: String, maxLength: Int = 4): String =
        value.filter(Char::isDigit).take(maxLength)

    /** Latitude/longitude: decimal numbers only, one minus and one dot. */
    fun coordinate(value: String): String {
        val filtered = value.filter { it.isDigit() || it == '-' || it == '.' }
        val singleMinus = filtered.removePrefix("-").replace("-", "").let { if (filtered.startsWith("-")) "-$it" else it }
        val singleDot = singleMinus.replaceFirst('.', '\u0000').replace(".", "").replace('\u0000', '.')
        return singleDot.take(MAX_COORDINATE)
    }
}
