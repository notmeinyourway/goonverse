package com.goonverse.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.goonverse.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

data class HeatmapDay(val dateString: String, val activityCount: Int)

@Composable
fun HeatmapCalendar(
    activityCounts: Map<String, Int>,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState(Int.MAX_VALUE)
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    // Generate past 90 days
    val daysList = remember(activityCounts) {
        val list = mutableListOf<HeatmapDay>()
        val cal = Calendar.getInstance()
        for (i in 89 downTo 0) {
            val dateCal = Calendar.getInstance().apply {
                time = cal.time
                add(Calendar.DAY_OF_YEAR, -i)
            }
            val key = sdf.format(dateCal.time)
            val count = activityCounts[key] ?: 0
            list.add(HeatmapDay(key, count))
        }
        list
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(Shapes.medium)
            .background(SurfaceDark)
            .border(1.dp, BorderSubtle, Shapes.medium)
            .padding(16.dp)
    ) {
        Text(
            text = "Activity Heatmap (Past 90 Days)",
            style = MaterialTheme.typography.titleMedium,
            color = TextPrimary,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(scrollState),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // Group by weeks of 7 days
            val chunkedWeeks = daysList.chunked(7)
            for (week in chunkedWeeks) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    for (day in week) {
                        val count = day.activityCount
                        val color = when {
                            count == 0 -> SurfaceVariantDark
                            count == 1 -> PrimaryVioletDark.copy(alpha = 0.6f)
                            count == 2 -> PrimaryViolet
                            count == 3 -> PrimaryVioletLight
                            else -> AccentCrimson
                        }
                        Box(
                            modifier = Modifier
                                .size(14.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(color)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Legend
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.End,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(text = "Less", style = MaterialTheme.typography.bodySmall, fontSize = 10.sp, color = TextMuted)
            Spacer(modifier = Modifier.width(4.dp))
            Box(modifier = Modifier.size(10.dp).clip(RoundedCornerShape(2.dp)).background(SurfaceVariantDark))
            Spacer(modifier = Modifier.width(2.dp))
            Box(modifier = Modifier.size(10.dp).clip(RoundedCornerShape(2.dp)).background(PrimaryVioletDark.copy(alpha = 0.6f)))
            Spacer(modifier = Modifier.width(2.dp))
            Box(modifier = Modifier.size(10.dp).clip(RoundedCornerShape(2.dp)).background(PrimaryViolet))
            Spacer(modifier = Modifier.width(2.dp))
            Box(modifier = Modifier.size(10.dp).clip(RoundedCornerShape(2.dp)).background(AccentCrimson))
            Spacer(modifier = Modifier.width(4.dp))
            Text(text = "More", style = MaterialTheme.typography.bodySmall, fontSize = 10.sp, color = TextMuted)
        }
    }
}
