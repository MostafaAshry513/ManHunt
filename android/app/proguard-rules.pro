# ManHunt R8 rules (release builds use minify + resource shrinking since 0.10.0).

# This is an MIT open-source app: keep class/member names. It costs a little APK size but
# keeps release stack traces readable, and it lets the emulator smoke run the real
# instrumentation test against the shrunk release build (test APKs reference app classes by
# their original names). R8 still removes unused code and shrinks resources.
-dontobfuscate

# Keep annotations/metadata used by kotlinx.serialization and OkHttp.
-keepattributes *Annotation*,InnerClasses,Signature,EnclosingMethod

# kotlinx.serialization: generated serializers are looked up through the companion and
# the plugin's rules. Keep the model constructors/companions explicitly as a belt.
-keepclassmembers class com.manhunt.app.data.** {
    *** Companion;
    kotlinx.serialization.KSerializer serializer(...);
}
-keepclasseswithmembers class com.manhunt.app.data.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.manhunt.app.data.**$$serializer { *; }

# osmdroid is reflection-adjacent (tile sources / config). Keep its own classes so the
# map cannot break in a release build; R8 still shrinks our code and unused libraries.
-keep class org.osmdroid.** { *; }
-dontwarn org.osmdroid.**

# Optional OkHttp/Conscrypt platform hooks.
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
