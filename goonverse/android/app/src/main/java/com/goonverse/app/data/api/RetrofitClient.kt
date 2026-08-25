package com.goonverse.app.data.api

import android.content.Context
import com.google.gson.GsonBuilder
import com.goonverse.app.BuildConfig
import com.goonverse.app.security.EncryptedSessionManager
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class RetrofitClient(
    context: Context,
    val sessionManager: EncryptedSessionManager,
    private val baseUrl: String = BuildConfig.API_BASE_URL
) {

    private val gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor(sessionManager))
        .addInterceptor(loggingInterceptor)
        .authenticator(TokenAuthenticator(sessionManager, baseUrl))
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS) // Generous for multipart image uploads
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()

    val authApi: AuthApi = retrofit.create(AuthApi::class.java)
    val peopleApi: PeopleApi = retrofit.create(PeopleApi::class.java)
    val imagesApi: ImagesApi = retrofit.create(ImagesApi::class.java)
    val activitiesApi: ActivitiesApi = retrofit.create(ActivitiesApi::class.java)
    val statsApi: StatsApi = retrofit.create(StatsApi::class.java)
}
