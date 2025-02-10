package com.netflixclone.screens

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.netflixclone.payment.PaymentActivity


class SubscriptionActivity : BaseActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val username = intent?.extras?.getString("username") ?: ""

        setContent {
            val subscriptions = listOf(
                "Mobile Plan - ₹149/month (480p, 1 mobile device)" to 14900,  // ₹149 in paise
                "Basic Plan - ₹199/month (720p, 1 device)" to 19900,
                "Standard Plan - ₹499/month (1080p, 2 devices)" to 49900,
                "Premium Plan - ₹649/month (4K+HDR, 4 devices)" to 64900
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                LazyColumn(modifier = Modifier.fillMaxWidth()) {
                    items(subscriptions) { (plan, amount) ->
                        Box(
                            modifier = Modifier
                                .padding(12.dp)
                                .clickable {
                                    // Start Payment Activity with amount and username
                                    val intent = Intent(this@SubscriptionActivity, PaymentActivity::class.java)
                                    intent.putExtra("amount", amount)
                                    intent.putExtra("username", username)
                                    startActivity(intent)
                                }
                        ) {
                            Text(plan, color = Color.White)
                        }
                    }
                }
                Text("Subscribe", color = Color.Red, modifier = Modifier.padding(8.dp))
            }
        }
    }
}
