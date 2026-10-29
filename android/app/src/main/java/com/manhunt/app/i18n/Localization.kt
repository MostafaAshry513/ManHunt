package com.manhunt.app.i18n

import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.Composable

enum class AppLanguage(val code: String, val nativeName: String, val isRtl: Boolean) {
    English("en", "English", false),
    Arabic("ar", "العربية", true),
    ;

    companion object {
        fun fromCode(code: String?): AppLanguage =
            entries.firstOrNull { it.code == code } ?: English
    }
}

/** Arabic strings keyed by their English source text. Missing keys fall back to English. */
private val arabic: Map<String, String> = mapOf(
    // Auth
    "Hide. Hunt. Survive." to "اختبئ. اصطد. انجُ.",
    "Create your account" to "أنشئ حسابك",
    "Welcome back" to "مرحبًا بعودتك",
    "Username" to "اسم المستخدم",
    "Password" to "كلمة المرور",
    "Create account" to "إنشاء حساب",
    "Sign in" to "تسجيل الدخول",
    "I already have an account" to "لدي حساب بالفعل",
    "New here? Create an account" to "جديد هنا؟ أنشئ حسابًا",
    "Server:" to "الخادم:",
    "Server address" to "عنوان الخادم",
    "Use your PC's LAN IP on a real phone, or 10.0.2.2 on an emulator." to
        "استخدم عنوان الشبكة المحلية لجهاز الكمبيوتر على الهاتف، أو 10.0.2.2 على المحاكي.",
    "Save server" to "حفظ الخادم",

    // Home
    "Signed in as" to "مسجّل الدخول باسم",
    "Sign out" to "تسجيل الخروج",
    "Start a game" to "ابدأ لعبة",
    "Become the room admin" to "كن مشرف الغرفة",
    "Room name" to "اسم الغرفة",
    "Create room" to "إنشاء غرفة",
    "Join a game" to "انضم إلى لعبة",
    "Enter a friend's code" to "أدخل رمز صديقك",
    "Room code" to "رمز الغرفة",
    "Join room" to "انضم إلى الغرفة",
    "Enter the 6-character room code" to "أدخل رمز الغرفة المكوّن من 6 أحرف",
    "Room name must be at least 2 characters" to "يجب أن يتكون اسم الغرفة من حرفين على الأقل",

    // Room header / tabs
    "Leave" to "مغادرة",
    "Leave the room?" to "مغادرة الغرفة؟",
    "You will leave the room and lose your spot in the lobby." to
        "ستغادر الغرفة وتفقد مكانك في الردهة.",
    "Game" to "اللعبة",
    "Chat" to "الدردشة",
    "History" to "السجل",
    "Connecting" to "جارٍ الاتصال",
    "Live" to "مباشر",
    "Polling" to "تحديث دوري",

    // Phase / match
    "Match" to "المباراة",
    "LOBBY" to "الردهة",
    "HEAD START" to "البداية المسبقة",
    "HUNTING" to "المطاردة",
    "PAUSED" to "متوقفة",
    "FINISHED" to "انتهت",
    "CANCELLED" to "أُلغيت",
    "Set teams, then start when everyone is ready." to "حدّد الفرق ثم ابدأ عندما يكون الجميع مستعدًا.",
    "Waiting for the admin to start." to "بانتظار المشرف ليبدأ.",
    "In progress" to "جارٍ التنفيذ",
    "Match cancelled" to "أُلغيت المباراة",
    "Match over" to "انتهت المباراة",
    "Hunters win" to "فاز الصيادون",
    "Prey win" to "فازت الفرائس",
    "Prey alive" to "الفرائس الأحياء",
    "Last match" to "آخر مباراة",
    "Last match: cancelled" to "آخر مباراة: أُلغيت",
    "Zone" to "المنطقة",
    "m" to "م",
    "Zone shrinks in" to "تتقلص المنطقة خلال",
    "Players" to "اللاعبون",
    "Your setup" to "إعدادك",
    "Prey" to "الفريسة",
    "Hunters" to "الصيادون",
    "Cancel ready" to "إلغاء الاستعداد",
    "I'm ready" to "أنا مستعد",
    "Match in progress" to "المباراة جارية",
    "Match settings" to "إعدادات المباراة",
    "Start match" to "ابدأ المباراة",
    "Pause match" to "إيقاف المباراة مؤقتًا",
    "Resume match" to "استئناف المباراة",
    "End match" to "إنهاء المباراة",
    "Prey positions are the latest reports" to "مواقع الفرائس بحسب آخر البلاغات",
    "Sharing your position" to "تتم مشاركة موقعك",
    "Open the app to resume sharing" to "افتح التطبيق لاستئناف المشاركة",
    "Location off" to "الموقع متوقف",
    "Map" to "الخريطة",
    "No report" to "لا يوجد بلاغ",
    "Unverified" to "غير موثّق",
    "Stale" to "قديم",
    "Some prey reports are stale (older than two intervals)." to
        "بعض بلاغات الفرائس قديمة (أقدم من فترتين).",
    "Room" to "الغرفة",
    "Connecting to room" to "جارٍ الاتصال بالغرفة",
    "Enable GPS" to "تفعيل GPS",
    "Allow in settings" to "السماح من الإعدادات",
    "Trails" to "المسارات",
    "Hide trails" to "إخفاء المسارات",
    "Tag prey" to "وسم الفريسة",
    "Ready" to "مستعد",
    "Not ready" to "غير مستعد",
    "offline" to "غير متصل",
    "TAGGED" to "تم وسمه",
    "ADMIN" to "مشرف",
    "No report" to "لا بلاغ",
    "Stale" to "قديم",
    "Unverified" to "غير موثّق",
    "Tagged" to "تم وسمه",
    "Some prey reports are stale (older than two intervals)." to "بعض بلاغات الفرائس قديمة (أقدم من فترتين).",
    "Zone shrinks in %02d:%02d" to "تتقلص المنطقة خلال %02d:%02d",
    "Zone: %d m radius" to "المنطقة: نصف قطر %d م",

    // Dialogs
    "Tag a prey" to "وسم فريسة",
    "No eligible prey" to "لا توجد فرائس متاحة",
    "Who did you touch?" to "من الذي لامسته؟",
    "You must be physically touching the prey. False claims can be disputed." to
        "يجب أن تلامس الفريسة فعليًا. يمكن الاعتراض على الادعاءات الكاذبة.",
    "Cancel" to "إلغاء",
    "Tag claim" to "ادعاء وسم",
    "A hunter says they physically touched you. Confirm the tag?" to
        "يقول صياد إنه لامسك. هل تؤكد الوسم؟",
    "Confirm" to "تأكيد",
    "Dispute" to "اعتراض",
    "Disputed tag" to "وسم متنازع عليه",
    "Confirm tag" to "تأكيد الوسم",
    "Reject" to "رفض",
    "End the match?" to "إنهاء المباراة؟",
    "This finishes the match for everyone and returns the room to the lobby." to
        "سينتهي هذا المباراة للجميع وتعود الغرفة إلى الردهة.",
    "Match history" to "سجل المباريات",
    "No matches played in this room yet." to "لم تُلعب أي مباراة في هذه الغرفة بعد.",
    "Loading match history..." to "جارٍ تحميل سجل المباريات...",
    "Close" to "إغلاق",
    "Dismiss" to "إغلاق",
    "Hunters won" to "فاز الصيادون",
    "Prey won" to "فازت الفرائس",
    "Uploaded" to "مرفوع",
    "Match over - Hunters win!" to "انتهت المباراة - فاز الصيادون!",
    "Match over - Prey win!" to "انتهت المباراة - فازت الفرائس!",
    "Head start over - hunting is live." to "انتهت البداية المسبقة - بدأت المطاردة.",
    "Prey are hiding. Hunting starts in" to "الفرائس تختبئ. تبدأ المطاردة خلال",
    "Hunting." to "المطاردة.",
    "Match paused by the admin. The clock is stopped." to "أوقف المشرف المباراة مؤقتًا. الساعة متوقفة.",
    "You were tagged" to "تم وسمك",
    "You are spectating this match. You can still chat, but you cannot tag or share new positions." to
        "أنت تشاهد المباراة الآن. يمكنك الدردشة، لكن لا يمكنك الوسم أو مشاركة مواقع جديدة.",

    // Chat
    "No messages yet. Say hello." to "لا رسائل بعد. ألقِ التحية.",
    "Message" to "رسالة",
    "Send message" to "إرسال الرسالة",

    // Settings
    "Settings" to "الإعدادات",
    "Appearance" to "المظهر",
    "Permissions" to "الأذونات",
    "Account" to "الحساب",
    "Language" to "اللغة",
    "Theme" to "السمة",
    "Dark" to "داكن",
    "Light" to "فاتح",
    "Text size" to "حجم النص",
    "Preview: the room, chat and buttons scale together." to "معاينة: تتغير الغرفة والدردشة والأزرار معًا.",
    "Hunters see prey positions every few minutes." to "يرى الصيادون مواقع الفرائس كل بضع دقائق.",
    "Location" to "الموقع",
    "Precise location" to "الموقع الدقيق",
    "Required while you play as Prey in an active match." to "مطلوب أثناء لعبك كفريسة في مباراة نشطة.",
    "Notifications" to "الإشعارات",
    "Tracking notice" to "إشعار التتبع",
    "Android requires a visible notification while location tracking is active." to
        "يتطلب أندرويد إشعارًا ظاهرًا أثناء تفعيل تتبع الموقع.",
    "Allowed" to "مسموح",
    "Not allowed" to "غير مسموح",
    "Manage" to "إدارة",
    "Allow" to "سماح",
    "Updates" to "التحديثات",
    "Installed" to "المثبّت",
    "Check for updates" to "التحقق من التحديثات",
    "Update available" to "يتوفر تحديث",
    "You are up to date" to "أنت تستخدم أحدث إصدار",
    "Download update" to "تنزيل التحديث",
    "Install update" to "تثبيت التحديث",
    "Downloading..." to "جارٍ التنزيل...",
    "Verified. Tap Install update." to "تم التحقق. اضغط على تثبيت التحديث.",
    "Updates install over the current app (same signing key); Android will ask you to confirm once." to
        "تُثبَّت التحديثات فوق التطبيق الحالي (بنفس مفتاح التوقيع)؛ وسيطلب أندرويد التأكيد مرة واحدة.",
    "Signed in as" to "مسجّل الدخول باسم",
    "Server" to "الخادم",
    "To change the server, sign out and edit it on the sign-in screen." to
        "لتغيير الخادم، سجّل الخروج وعدّله في شاشة الدخول.",
    "Language applies immediately and mirrors the whole layout." to
        "تُطبَّق اللغة فورًا وتنعكس الواجهة بالكامل.",

    // Safety screen
    "Before you play" to "قبل أن تبدأ",
    "ManHunt is a real-world game. Read this once." to "ManHunt لعبة في العالم الحقيقي. اقرأ هذا مرة واحدة.",
    "Your location" to "موقعك",
    "Stay safe" to "ابقَ آمنًا",
    "Not a safety service" to "ليست خدمة أمان",
    "I understand and I'll play safely" to "أفهم ذلك وسألعب بأمان",
)

val LocalLanguage = compositionLocalOf { AppLanguage.English }
val LocalStrings = compositionLocalOf { emptyMap<String, String>() }

@Composable
fun t(english: String): String {
    val language = LocalLanguage.current
    if (language != AppLanguage.Arabic) return english
    return arabic[english] ?: english
}

fun arabicStrings(): Map<String, String> = arabic
