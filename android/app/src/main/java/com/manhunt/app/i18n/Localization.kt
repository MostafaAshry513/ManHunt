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
    "Host a hunt" to "استضف مطاردة",
    "You set the rules. You call the hunt." to "أنت تضع القواعد. وأنت تبدأ المطاردة.",
    "Create hunt" to "أنشئ مطاردة",
    "Join a hunt" to "انضم إلى مطاردة",
    "Got an invite code?" to "لديك رمز دعوة؟",
    "Join hunt" to "انضم إلى المطاردة",
    "Hunt name" to "اسم المطاردة",
    "Invite code" to "رمز الدعوة",
    "Playing as" to "تلعب باسم",
    "Hunt name must be at least 2 characters" to "يجب أن يتكون اسم المطاردة من حرفين على الأقل",
    "Enter the 6-character invite code" to "أدخل رمز الدعوة المكوّن من 6 أحرف",

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
    "Choose your side" to "اختر جانبك",
    "The hunt" to "المطاردة",
    "Pick a side. Ready up. The huntmaster starts the hunt." to
        "اختر جانبك واستعد؛ يبدأ حكم المطاردة المطاردة.",
    "The huntmaster is setting the rules." to "حكم المطاردة يجهّز القواعد.",
    "Ready to hunt" to "مستعد للمطاردة",
    "Stand down" to "تراجع",
    "Hunt rules" to "قواعد المطاردة",
    "Begin the hunt" to "ابدأ المطاردة",
    "HUNTMASTER" to "حكم المطاردة",
    "out of range" to "خارج التغطية",
    "Hunt roster" to "قائمة المطاردة",
    "Hide. Survive." to "اختبئ. انجُ.",
    "Track. Tag." to "تتبّع. وسم.",
    "No prey yet" to "لا توجد فرائس بعد",
    "No hunters yet" to "لا يوجد صيادون بعد",
    "still gearing up" to "لا يزال يستعد",
    "Gearing up" to "يستعد",
    "Hunt over" to "انتهت المطاردة",
    "Hunt cancelled" to "أُلغيت المطاردة",
    "The hunt is paused. The clock is stopped." to "المطاردة متوقفة مؤقتًا. الساعة متوقفة.",
    "Prey remaining" to "الفرائس المتبقية",
    "Last hunt" to "آخر مطاردة",
    "Last hunt: cancelled" to "آخر مطاردة: أُلغيت",
    "End the hunt?" to "إنهاء المطاردة؟",
    "This ends the hunt for everyone and returns the room to the lobby." to
        "سينهي هذا المطاردة للجميع ويعيد الغرفة إلى الردهة.",
    "End hunt" to "إنهاء المطاردة",
    "Pause hunt" to "إيقاف المطاردة مؤقتًا",
    "Resume hunt" to "استئناف المطاردة",
    "Hunt history" to "سجل المطاردات",
    "No hunts in this room yet." to "لا مطاردات في هذه الغرفة بعد.",

    // Phase / match
    "Match" to "المباراة",
    "LOBBY" to "الردهة",
    "HEAD START" to "البداية المسبقة",
    "HUNTING" to "المطاردة",
    "PAUSED" to "متوقفة",
    "FINISHED" to "انتهت",
    "CANCELLED" to "أُلغيت",
    "In progress" to "جارٍ التنفيذ",
    "Match cancelled" to "أُلغيت المباراة",
    "Hunters win" to "فاز الصيادون",
    "Prey win" to "فازت الفرائس",
    "Zone" to "المنطقة",
    "m" to "م",
    "Zone shrinks in" to "تتقلص المنطقة بعد",
    "Players" to "اللاعبون",
    "Need" to "تحتاج",
    "players" to "لاعبين",
    "Prey" to "الفريسة",
    "Hunters" to "الصيادون",
    "Prey positions are the latest reports" to "مواقع الفرائس بحسب آخر البلاغات",
    "Sharing your position" to "تتم مشاركة موقعك",
    "Open the app to resume sharing" to "افتح التطبيق لاستئناف المشاركة",
    "Location off" to "الموقع متوقف",
    "Waiting for GPS" to "بانتظار إشارة GPS",
    "Map" to "الخريطة",
    "No report" to "لا يوجد بلاغ",
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
    "TAGGED" to "تم وسمه",
    "Stale" to "قديم",
    "Unverified" to "غير موثّق",
    "Tagged" to "تم وسمه",
    "Zone shrinks in %02d:%02d" to "تتقلص المنطقة بعد %02d:%02d",
    "Zone: %d m radius" to "المنطقة: نصف قطر %d م",

    // Dialogs
    "No eligible prey" to "لا توجد فرائس متاحة",
    "Who did you touch?" to "من الذي لامسته؟",
    "You must be physically touching the prey. False claims can be disputed." to
        "يجب أن تلامس الفريسة فعليًا. يمكن الاعتراض على الادعاءات الكاذبة.",
    "Cancel" to "إلغاء",
    "Tag claim" to "ادعاء وسم",
    "Tag claim sent - waiting for the prey to confirm" to "أُرسل ادعاء الوسم - بانتظار تأكيد الفريسة",
    "Tag confirmed" to "تم تأكيد الوسم",
    "Tag disputed - the admin will decide" to "تم الاعتراض على الوسم - سيقرر المشرف",
    "confirmed" to "مؤكد",
    "rejected" to "مرفوض",
    "Settings saved" to "تم حفظ الإعدادات",
    "No trails available yet" to "لا توجد مسارات متاحة بعد",
    "Confirm" to "تأكيد",
    "Dispute" to "اعتراض",
    "Disputed tag" to "وسم متنازع عليه",
    "says they tagged" to "يقول إنه وسم",
    ", and they dispute it. Confirm or reject the tag." to "، ويعترض على ذلك. أكّد الوسم أو ارفضه.",
    "says they physically touched you. Confirm the tag?" to "يقول إنه لامسك فعليًا. هل تؤكد الوسم؟",
    "Confirm tag" to "تأكيد الوسم",
    "Reject" to "رفض",
    "Loading match history..." to "جارٍ تحميل سجل المباريات...",
    "Close" to "إغلاق",
    "Dismiss" to "إغلاق",
    "Hunters won" to "فاز الصيادون",
    "Prey won" to "فازت الفرائس",
    "Uploaded" to "مرفوع",
    "Prey are hiding. Hunting starts in" to "الفرائس تختبئ. تبدأ المطاردة بعد",
    "Hunting." to "المطاردة.",
    "You were tagged" to "تم وسمك",
    "You are spectating this match. You can still chat, but you cannot tag or share new positions." to
        "أنت تشاهد المباراة الآن. يمكنك الدردشة، لكن لا يمكنك الوسم أو مشاركة مواقع جديدة.",

    // Errors / dialogs / fallbacks
    "Try again" to "أعد المحاولة",
    "Loading" to "جارٍ التحميل",
    "Back" to "رجوع",
    "You are abandoning this hunt. It runs without you." to "أنت تتخلى عن هذه المطاردة. ستستمر بدونك.",
    "A hunter" to "صياد",
    "a prey" to "فريسة",

    // Hunt rules dialog
    "Applies to the next match. Rules are enforced by the server." to
        "تُطبَّق على المطاردة القادمة. يفرض الخادم القواعد.",
    "Prey head start (minutes)" to "مهلة الفرائس (دقائق)",
    "Match duration (minutes)" to "مدة المطاردة (دقائق)",
    "Location report interval (minutes)" to "تباعد إرسال الموقع (دقائق)",
    "Hunters can see trails" to "يستطيع الصيادون رؤية المسارات",
    "Play area" to "منطقة اللعب",
    "Open" to "مفتوحة",
    "Zone radius (metres)" to "نصف قطر المنطقة (أمتار)",
    "Tap the map to move the zone centre" to "المس الخريطة لنقل مركز المنطقة",
    "Enable GPS or tap the map to place the zone" to "شغّل GPS أو المس الخريطة لوضع المنطقة",
    "Place the zone centre on the map first" to "ضع مركز المنطقة على الخريطة أولًا",
    "Shrink over time" to "تتقلص مع الوقت",
    "Every (min)" to "كل (دقيقة)",
    "By (m)" to "بمقدار (متر)",
    "Save" to "حفظ",

    // Pagination / connection states (used by the room/chat surface)
    "Load older messages" to "تحميل الرسائل الأقدم",
    "Loading older messages" to "جارٍ تحميل الرسائل الأقدم",
    "No older messages" to "لا توجد رسائل أقدم",
    "Connection lost" to "انقطع الاتصال",
    "Last updated" to "آخر تحديث",
    "Reconnecting" to "جارٍ إعادة الاتصال",

    // Auth / validation
    "Show password" to "إظهار كلمة المرور",
    "Hide password" to "إخفاء كلمة المرور",
    "Username is required" to "اسم المستخدم مطلوب",
    "Password must be at least 8 characters" to "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    "Enter a valid server address (http:// or https://)" to "أدخل عنوان خادم صالحًا (http:// أو https://)",
    "Change server" to "تغيير الخادم",
    "Something went wrong" to "حدث خطأ ما",

    // Home
    "Current server" to "الخادم الحالي",

    // History dialog
    "Duration" to "المدة",
    "Hunts appear here once they finish." to "تظهر المطاردات هنا بعد انتهائها.",
    "min" to "د",
    "Prey:" to "الفرائس:",
    "Hunters:" to "الصيادون:",

    // Map
    "You" to "أنت",
    "Zoom in" to "تكبير",
    "Zoom out" to "تصغير",
    "Play zone" to "منطقة اللعب",
    "Stale report" to "بلاغ قديم",
    "Unverified report" to "بلاغ غير موثّق",
    "Live report" to "بلاغ مباشر",

    // Room rules dialog
    "Timing" to "التوقيت",
    "Zone centre" to "مركز المنطقة",
    "Latitude" to "خط العرض",
    "Longitude" to "خط الطول",
    "Enter coordinates manually" to "أدخل الإحداثيات يدويًا",

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
    "Update ready to install" to "التحديث جاهز للتثبيت",
    "Allow installs from ManHunt, then tap Install update again." to
        "اسمح بتثبيت التطبيقات من ManHunt، ثم اضغط تثبيت التحديث مرة أخرى.",
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
    "While you are on the Prey team in an active match, your phone sends its position " +
        "to the server at the interval the room admin set (5 minutes by default). " +
        "Only players on the Hunters team can see it, and only during the hunting phase. " +
        "A permanent notification is shown while tracking is active. Tracking stops when " +
        "the match ends." to
        "في المرحلة النشطة وأنت تشارك في فريق الفرائس، يرسل هاتفك موقعه إلى الخادم بالتباعد الذي يحدده حكم المطاردة (5 دقائق افتراضيًا). " +
            "لا يرى موقعك إلا اللاعبون في فريق الصيادين، وفقط أثناء مرحلة المطاردة. " +
            "يظهر إشعار دائم أثناء تفعيل التتبع، ويتوقف التتبع عند انتهاء المطاردة.",
    "Precise reports are kept for 30 days by default and then deleted. Match summaries " +
        "are kept without byte-level GPS trails." to
        "تُحفظ البلاغات الدقيقة 30 يومًا افتراضيًا ثم تُحذف. وتُحفظ ملخصات المطاردات دون مسارات GPS الدقيقة.",
    "• Respect property and local law. Never trespass.\n" +
        "• Stay out of roads, traffic and hazardous ground.\n" +
        "• Never run while looking at your phone.\n" +
        "• Stop immediately if conditions or people make it unsafe.\n" +
        "• Respect people who are not playing." to
        "• احترم الممتلكات والقانون المحلي ولا تدخل أراضي غير مسموح بها.\n" +
            "• ابعد عن الطرق وحركة المرور والأماكن الخطرة.\n" +
            "• لا تركض وأنت تنظر إلى هاتفك.\n" +
            "• توقف فورًا إذا أصبحت الظروف أو الناس غير آمنة.\n" +
            "• احترم من لا يلعبون.",
    "ManHunt is a game. It is not an emergency, rescue or child-tracking service, and " +
        "GPS can be inaccurate, delayed or missing. Do not rely on it to find a person in danger." to
        "ManHunt لعبة وليست خدمة طوارئ أو إنقاذ أو تتبع أطفال، وقد يكون الإسناد الموقعي GPS غير دقيق أو متأخر أو غائبًا. لا تعتمد عليه لإيجاد شخص في خطر.",
    "Your location" to "موقعك",
    "Stay safe" to "ابقَ آمنًا",
    "Not a safety service" to "ليست خدمة أمان",
    "I understand and I'll play safely" to "أفهم ذلك وسألعب بأمان",

    // Connection & sharing
    "Reconnecting…" to "جارٍ إعادة الاتصال…",
    "Room code copied" to "تم نسخ رمز الغرفة",
    "Share room" to "مشاركة الغرفة",
    "Join code" to "رمز الانضمام",

    // Location services
    "Turn on location" to "تشغيل خدمة الموقع",
    "Location services are off - turn them on to share your position." to
        "خدمة الموقع مغلقة - شغّلها لمشاركة موقعك.",

    // Start blockers
    "Before you can start" to "قبل أن تبدأ",
    "Waiting for" to "في انتظار",
    "to ready up" to "ليستعد",

    // Updates
    "Checking..." to "جارٍ التحقق...",
    "Could not check for updates. Check your connection and try again." to
        "تعذّر التحقق من التحديثات. تحقق من اتصالك وحاول مرة أخرى.",
    "Download failed. Check your connection and try again." to
        "فشل التنزيل. تحقق من اتصالك وحاول مرة أخرى.",
    "Updates install over the current app. Android will ask you to confirm once." to
        "تُثبَّت التحديثات فوق التطبيق الحالي. سيطلب أندرويد التأكيد مرة واحدة.",

    // Match result
    "Hunt result" to "نتيجة المطاردة",
    "Hunters win!" to "فاز الصيادون!",
    "Prey win!" to "فازت الفرائس!",
    "Hunt over" to "انتهت المطاردة",
    "Winner" to "الفائز",
    "Play again" to "العب مرة أخرى",
    "View hunt history" to "عرض سجل المطاردات",
    "Back to lobby" to "العودة إلى غرفة الانتظار",

    // Zone picker
    "Pick on map" to "اختر من الخريطة",
    "Tap the map to place the zone centre" to "المس الخريطة لتحديد مركز المنطقة",
    "Drag to move the map, tap to set the centre" to "اسحب لتحريك الخريطة، والمس لتحديد المركز",
    "Zone centre set" to "تم تحديد مركز المنطقة",
    "Zone centre not set" to "لم يتم تحديد مركز المنطقة",

    // Server connection
    "Game server" to "خادم اللعبة",
    "The server your phone connects to." to "الخادم الذي يتصل به هاتفك.",
    "Test connection" to "اختبار الاتصال",
    "Server is reachable" to "الخادم متاح",
    "Server did not respond. Check the address." to "الخادم لا يستجيب. تحقق من العنوان.",

    // Tags & notifications
    "Who did you tag?" to "من الذي وسمته؟",
    "Enable notifications to hear about tags, match start and the result." to
        "فعّل الإشعارات لتصلك تنبيهات الوسم وبدء المطاردة والنتيجة.",
    "Tag claim from" to "ادعاء وسم من",
    "The hunt has started" to "بدأت المطاردة",
    "The hunt is over" to "انتهت المطاردة",
    "Disputed tag needs a decision" to "ادعاء وسم متنازع عليه يحتاج قرارًا",
    "Join my ManHunt room" to "انضم إلى غرفة ManHunt",
    "code" to "الرمز",
    "Hunters are live." to "الصيادون يتحركون الآن.",
    "Confirm the tag?" to "هل تؤكد الوسم؟",
    "Open the app to decide." to "افتح التطبيق لتقرر.",
    "Recenter" to "إعادة التمركز",
    "Turn on location services" to "شغّل خدمة الموقع",
    "Turn on" to "تشغيل",
    "Match notifications" to "إشعارات المطاردات",
    "Get notified when someone claims a tag, a hunt starts or ends." to
        "تصلك تنبيهات عند ادعاء وسم أو بدء المطاردة أو انتهائها.",
    "Before the hunt" to "قبل بدء المطاردة",
    "Permissions are asked now, before the hunt starts." to
        "تُطلب الأذونات الآن، قبل بدء المطاردة.",

    // First-run welcome (roles & scenario)
    "Welcome to ManHunt" to "مرحبًا بك في ManHunt",
    "Real-world hide-and-seek — here's how it works." to
        "لعبة الغُمّيضة في العالم الحقيقي — إليك كيف تعمل.",
    "The two sides" to "الفريقان",
    "Prey — you hide" to "الفريسة — أنت تختبئ",
    "While the hunt is running, your phone shares your position with the Hunters at " +
        "the interval the room set. Stay hidden and survive until the hunt ends — if at " +
        "least one Prey is still free when the clock stops, Prey win." to
        "أثناء المطاردة، يشارك هاتفك موقعك مع الصيادين وفق الفترة التي حددتها الغرفة. " +
            "ابقَ مختبئًا واصمد حتى تنتهي المطاردة — وإذا بقي فريسة واحدة حرة عند توقف الساعة، تفوز الفرائس.",
    "Hunters — you chase" to "الصيادون — أنت تطارد",
    "Hunters see the Prey's latest positions on the map (and their trails if the " +
        "room allows it). Find them in the real world and tag them by touching them — " +
        "each tag must be confirmed by the Prey. Tag every Prey to win." to
        "يرى الصيادون أحدث مواقع الفرائس على الخريطة (ومساراتهم إذا سمحت الغرفة بذلك). " +
            "اعثروا عليهم في العالم الحقيقي ووسموهم بلمسهم — ويجب أن تؤكد الفريسة كل وسم. " +
            "وسموا كل الفرائس لتفوزوا.",
    "How a hunt runs" to "كيف تسير المطاردة",
    "1. Create or join a room, then pick your side.\n" +
        "2. Ready up. The huntmaster starts the hunt.\n" +
        "3. Prey get a head start to hide; then hunting begins.\n" +
        "4. Hunters tag Prey in person, and each tag is confirmed in the app.\n" +
        "5. The hunt ends when the timer runs out or all Prey are tagged." to
        "1. أنشئ غرفة أو انضم إليها، ثم اختر فريقك.\n" +
            "2. استعدوا. يبدأ حكم المطاردة المطاردة.\n" +
            "3. تحصل الفرائس على مهلة للاختباء، ثم تبدأ المطاردة.\n" +
            "4. يوسم الصيادون الفرائس شخصيًا، ويُؤكَّد كل وسم في التطبيق.\n" +
            "5. تنتهي المطاردة عند انتهاء الوقت أو عند وسم كل الفرائس.",
    "What you need" to "ما تحتاجه",
    " Location access, so Prey can share their position and Hunters can use the map." to
        " إذن الموقع، حتى تشارك الفرائس مواقعها ويستخدم الصيادون الخريطة.",
    " Notifications, so tag requests and the result reach you when the phone is in a pocket." to
        " الإشعارات، حتى تصلك طلبات الوسم والنتيجة والهاتف في جيبك.",
    "A safe place to play: this is a real-world game, played outdoors." to
        "مكان آمن للعب: هذه لعبة في العالم الحقيقي تُلعب في الخارج.",
    "Play safe" to "العب بأمان",
    "Respect property and local law, watch traffic, and never run while looking at your " +
        "phone. ManHunt is a game — not an emergency, rescue or child-tracking service." to
        "احترم الممتلكات والقانون المحلي، وانتبه لحركة المرور، ولا تركض وأنت تنظر إلى هاتفك. " +
            "ManHunt لعبة — وليست خدمة طوارئ أو إنقاذ أو تتبّع أطفال.",
    "Let's play" to "لنبدأ اللعب",
    "Use my location" to "استخدم موقعي",

    // Roles page + game-mode catalog
    "Roles" to "الأدوار",
    "How each side plays, and what modes are coming." to
        "كيف يلعب كل فريق، وما الأوضاع القادمة.",
    "Classic hunt" to "المطاردة الكلاسيكية",
    "The original real-world game: Prey hide and share their position, Hunters track them down and tag them in person." to
        "اللعبة الأصلية في العالم الحقيقي: تختبئ الفرائس وتشارك مواقعها، ويتتبعها الصيادون ويوسمونها شخصيًا.",
    "Tag Relay" to "تتابع الوسم",
    "Swap sides, keep score." to "بدّلوا الجانبين واحفظوا النقاط.",
    "Planned: teams alternate between Prey and Hunters each round, scoring tags and survival time." to
        "مخطط له: تتبادل الفرق بين الفريسة والصياد كل جولة، مع احتساب الوسم ومدة الصمود.",
    "Zone Lock" to "إغلاق المنطقة",
    "The walls close in." to "تضيق الدائرة.",
    "Planned: a shrinking play area with trails off — stay inside the zone and survive as long as you can." to
        "مخطط له: منطقة لعب تتقلص مع إيقاف المسارات — ابقَ داخل المنطقة واصمد أطول وقت ممكن.",
    "Coming soon" to "قريبًا",
    "Classic is the only playable mode right now." to
        "المطاردة الكلاسيكية هي الوضع الوحيد القابل للعب حاليًا.",
    "Swipe to see all modes · classic is playable today" to
        "اسحب لرؤية كل الأوضاع · المطاردة الكلاسيكية متاحة الآن",
)

val LocalLanguage = compositionLocalOf { AppLanguage.English }
val LocalStrings = compositionLocalOf { emptyMap<String, String>() }

@Composable
fun t(english: String): String = translate(english, LocalLanguage.current)

/** Non-composable translation for ViewModels that already know the current language. */
fun translate(english: String, language: AppLanguage): String {
    if (language != AppLanguage.Arabic) return english
    return arabic[english] ?: english
}

fun arabicStrings(): Map<String, String> = arabic
