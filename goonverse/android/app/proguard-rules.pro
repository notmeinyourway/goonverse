# Proguard rules for Goonverse Release Build

-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Keep Gson models and SerializedName fields
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.goonverse.app.data.models.** { *; }
-keep class com.goonverse.app.data.local.entity.** { *; }
-keep class com.goonverse.app.domain.model.** { *; }

# Retrofit / OkHttp
-dontwarn okio.**
-dontwarn retrofit2.**
-keepclassmembers,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}

# Room
-keep class androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Security Crypto
-keep class androidx.security.crypto.** { *; }
