package com.goonverse.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.goonverse.app.data.local.dao.*
import com.goonverse.app.data.local.entity.*

@Database(
    entities = [
        PersonEntity::class,
        ImageEntity::class,
        ActivityEntity::class,
        StatsCacheEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class GoonverseDatabase : RoomDatabase() {

    abstract fun personDao(): PersonDao
    abstract fun imageDao(): ImageDao
    abstract fun activityDao(): ActivityDao
    abstract fun statsDao(): StatsDao

    suspend fun clearAllCache() {
        personDao().clearAll()
        imageDao().clearAll()
        activityDao().clearAll()
        statsDao().clearAll()
    }

    companion object {
        @Volatile
        private var INSTANCE: GoonverseDatabase? = null

        fun getInstance(context: Context): GoonverseDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    GoonverseDatabase::class.java,
                    "goonverse_cache.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
