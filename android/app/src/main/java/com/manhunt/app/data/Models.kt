package com.manhunt.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

val ManHuntJson: Json = Json {
    ignoreUnknownKeys = true
    isLenient = true
    explicitNulls = false
}

@Serializable
data class UserDto(val id: String, val username: String)

@Serializable
data class AuthResponse(val token: String, val user: UserDto)

@Serializable
data class ErrorDetail(val code: String = "error", val message: String = "Something went wrong")

@Serializable
data class ErrorBody(val error: ErrorDetail)

@Serializable
data class ZoneDto(
    val centerLat: Double,
    val centerLng: Double,
    val radiusM: Double,
    val nextShrinkAt: Long? = null,
)

@Serializable
data class ShrinkDto(
    val enabled: Boolean = false,
    val intervalSec: Int = 120,
    val stepM: Double = 25.0,
    val minRadiusM: Double = 100.0,
    val warningSec: Int = 30,
)

@Serializable
data class SettingsDto(
    val headStartSec: Int = 300,
    val durationSec: Int = 3600,
    val minPlayers: Int = 2,
    val locationIntervalSec: Int = 300,
    val trailsEnabled: Boolean = true,
    val mode: String = "open",
    val zone: ZoneDto? = null,
    val shrink: ShrinkDto = ShrinkDto(),
    val tagPolicy: String = "confirm",
)

@Serializable
data class RoomInfo(
    val id: String,
    val code: String,
    val name: String,
    val adminId: String,
    val status: String,
    val settings: SettingsDto = SettingsDto(),
    val createdAt: Long = 0,
)

@Serializable
data class MemberDto(
    val userId: String,
    val username: String,
    val team: String,
    val ready: Boolean = false,
    val connected: Boolean = false,
    val eliminated: Boolean = false,
    val isAdmin: Boolean = false,
)

@Serializable
data class MatchDto(
    val id: String,
    val phase: String,
    val status: String = "",
    val startedAt: Long = 0,
    val headStartEndsAt: Long = 0,
    val endsAt: Long = 0,
    val now: Long = 0,
    val winner: String? = null,
    val preyAlive: Int = 0,
    val preyTotal: Int = 0,
    val zone: ZoneDto? = null,
)

@Serializable
data class RoomState(
    val room: RoomInfo,
    val members: List<MemberDto> = emptyList(),
    val match: MatchDto? = null,
    /**
     * Durable tag claims replayed by the server so a reconnecting player never misses a
     * real-world tag. Additive: older servers omit the field and it defaults to empty.
     */
    val pendingTags: List<PendingTagDto> = emptyList(),
    @SerialName("serverNow") val serverNow: Long = 0,
)

/** A pending (or expired-then-disputed) tag claim as returned in room state. */
@Serializable
data class PendingTagDto(
    val id: String,
    val matchId: String = "",
    val hunterId: String = "",
    val preyId: String = "",
    val createdAt: Long = 0,
    val expiresAt: Long = 0,
    /** True once the claim expired and became a huntmaster dispute. */
    val disputed: Boolean = false,
) {
    fun toTag(): TagDto = TagDto(
        id = id,
        matchId = matchId,
        hunterId = hunterId,
        preyId = preyId,
        status = if (disputed) "disputed" else "pending",
        createdAt = createdAt,
    )
}

@Serializable
data class ChatMessage(
    val id: Long = 0,
    val userId: String? = null,
    val username: String = "System",
    val kind: String = "chat",
    val body: String,
    val createdAt: Long = 0,
)

@Serializable
data class MessagesResponse(
    val messages: List<ChatMessage> = emptyList(),
    /**
     * True when older messages exist before the first entry of this page.
     * Additive field: older servers omit it and it defaults to false.
     */
    val hasMore: Boolean = false,
)

@Serializable
data class PreyLocationStatus(
    val userId: String,
    val username: String = "",
    val lat: Double? = null,
    val lng: Double? = null,
    val accuracy: Double? = null,
    val recordedAt: Long? = null,
    val receivedAt: Long? = null,
    val stale: Boolean = true,
    val flagged: Boolean = false,
    val eliminated: Boolean = false,
    val hasReport: Boolean = false,
)

@Serializable
data class LatestLocations(
    val now: Long = 0,
    val staleAfterMs: Long = 0,
    val prey: List<PreyLocationStatus> = emptyList(),
)

@Serializable
data class LocationReportDto(
    val matchId: String = "",
    val userId: String,
    val username: String = "",
    val lat: Double,
    val lng: Double,
    val accuracy: Double? = null,
    val recordedAt: Long = 0,
    val receivedAt: Long = 0,
    val flagged: Boolean = false,
)

@Serializable
data class TagDto(
    val id: String,
    val matchId: String = "",
    val hunterId: String = "",
    val preyId: String,
    val status: String,
    val createdAt: Long = 0,
)

@Serializable
data class ReportLocationResponse(val ok: Boolean = true, val flagged: Boolean = false)

@Serializable
data class AppUpdate(
    val versionCode: Int = 0,
    val versionName: String = "",
    val url: String = "/app.apk",
    val sha256: String = "",
    val size: Long = 0,
    val publishedAt: String? = null,
    val notes: String? = null,
)

@Serializable
data class TrailPoint(
    val lat: Double,
    val lng: Double,
    val accuracy: Double? = null,
    val recordedAt: Long = 0,
    val flagged: Boolean = false,
)

@Serializable
data class TrailResponse(
    val matchId: String = "",
    val userId: String = "",
    val trailEnabled: Boolean = true,
    val points: List<TrailPoint> = emptyList(),
)

@Serializable
data class MatchHistoryEntry(
    val id: String,
    val startedAt: Long = 0,
    val endedAt: Long? = null,
    val winner: String? = null,
    val cancelled: Boolean = false,
    val durationSec: Double? = null,
    val prey: List<String> = emptyList(),
    val hunters: List<String> = emptyList(),
)

@Serializable
data class MatchHistoryResponse(val matches: List<MatchHistoryEntry> = emptyList())

@Serializable
data class MatchSummary(
    val id: String,
    val phase: String,
    val status: String = "",
    val startedAt: Long = 0,
    val headStartEndsAt: Long = 0,
    val endsAt: Long = 0,
    val endedAt: Long? = null,
    val winner: String? = null,
    val preyAlive: Int = 0,
    val preyTotal: Int = 0,
    val zone: ZoneDto? = null,
    val now: Long = 0,
)

class ApiException(
    val code: String,
    override val message: String,
    val status: Int = 0,
) : Exception(message)

object Teams {
    const val PREY = "prey"
    const val HUNTERS = "hunters"
}

object Phases {
    const val LOBBY = "lobby"
    const val HEAD_START = "head_start"
    const val HUNTING = "hunting"
    const val PAUSED = "paused"
    const val FINISHED = "finished"
    const val CANCELLED = "cancelled"
}
