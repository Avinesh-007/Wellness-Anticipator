# Keep model classes for Gson serialization
-keepclassmembers class com.wellnessanticipator.app.data.models.** { <fields>; }
-keep class com.wellnessanticipator.app.data.models.** { *; }

# Retrofit & OkHttp rules
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-keepattributes Signature
-keepattributes *Annotation*
