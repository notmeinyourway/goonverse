package com.goonverse.app

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import com.goonverse.app.data.api.RetrofitClient
import com.goonverse.app.data.local.GoonverseDatabase
import com.goonverse.app.data.repository.*
import com.goonverse.app.domain.repository.*
import com.goonverse.app.security.EncryptedSessionManager
import okhttp3.OkHttpClient

class GoonverseApp : Application(), ImageLoaderFactory {

    lateinit var sessionManager: EncryptedSessionManager private set
    lateinit var database: GoonverseDatabase private set
    lateinit var retrofitClient: RetrofitClient private set

    lateinit var authRepository: AuthRepository private set
    lateinit var peopleRepository: PeopleRepository private set
    lateinit var imagesRepository: ImagesRepository private set
    lateinit var activitiesRepository: ActivitiesRepository private set
    lateinit var statsRepository: StatsRepository private set

    override fun onCreate() {
        super.onCreate()

        sessionManager = EncryptedSessionManager(this)
        database = GoonverseDatabase.getInstance(this)
        retrofitClient = RetrofitClient(this, sessionManager)

        authRepository = AuthRepositoryImpl(
            authApi = retrofitClient.authApi,
            sessionManager = sessionManager,
            database = database
        )

        peopleRepository = PeopleRepositoryImpl(
            peopleApi = retrofitClient.peopleApi,
            personDao = database.personDao()
        )

        imagesRepository = ImagesRepositoryImpl(
            imagesApi = retrofitClient.imagesApi,
            imageDao = database.imageDao()
        )

        activitiesRepository = ActivitiesRepositoryImpl(
            activitiesApi = retrofitClient.activitiesApi,
            activityDao = database.activityDao()
        )

        statsRepository = StatsRepositoryImpl(
            statsApi = retrofitClient.statsApi,
            statsDao = database.statsDao()
        )
    }

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.25)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("image_cache"))
                    .maxSizeBytes(100L * 1024 * 1024) // 100 MB cache
                    .build()
            }
            .respectCacheHeaders(false) // Handle signed S3 URLs
            .crossfade(true)
            .build()
    }
}
