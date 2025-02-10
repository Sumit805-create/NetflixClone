package com.netflixclone.screens

import AuthTokenManager
import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.gson.Gson
import com.netflixclone.R
import com.netflixclone.network.models.AuthResponse
import com.netflixclone.network.models.RetrofitClient
import com.netflixclone.network.models.User
import com.netflixclone.network.services.LoginRequest
import com.netflixclone.network.services.TokenResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : AppCompatActivity() {

    private lateinit var authTokenManager: AuthTokenManager  // Helper class to store token

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val emailEditText: EditText = findViewById(R.id.email_edit_text)
        val passwordEditText: EditText = findViewById(R.id.password_edit_text)
        val loginButton: Button = findViewById(R.id.login_button)
        val signupButton: Button = findViewById(R.id.signup_button)

        loginButton.setOnClickListener {
            val email = emailEditText.text.toString().trim()
            val password = passwordEditText.text.toString().trim()
//
//            if (email.isEmpty() || password.isEmpty()) {
//                Toast.makeText(this, "Please enter all fields", Toast.LENGTH_SHORT).show()
//                return@setOnClickListener
//            }

            loginUser(email, password)
        }
        signupButton.setOnClickListener {
            val intent = Intent(this@LoginActivity, SignupActivity::class.java)
            startActivity(intent)
        }
    }

    private fun loginUser(email: String, password: String) {
        RetrofitClient.instance.login(User(email, password)).enqueue(object: Callback<AuthResponse>{
            override fun onResponse(call: Call<AuthResponse>, response: Response<AuthResponse>) {


                if(response.isSuccessful) {
                    val authTokenManager = AuthTokenManager(this@LoginActivity)
                    val token = response.body()?.token ?: ""
                    val isSubscribed = response.body()?.subscribed ?:false // Check if user is subscribed

                    authTokenManager.saveToken(token)
                    authTokenManager.saveSubscriptionStatus(isSubscribed)
                   if (isSubscribed){
                    val intent = Intent(this@LoginActivity, BottomNavActivity::class.java)
                    this@LoginActivity.startActivity(intent)}
                    else{
                        val intent=Intent(this@LoginActivity,SubscriptionActivity::class.java)
                    }
                } else {
                    Toast.makeText(this@LoginActivity, "Failed to login", Toast.LENGTH_LONG).show()
                    val intent=Intent(this@LoginActivity,SubscriptionActivity::class.java)

                }
            }

            override fun onFailure(call: Call<AuthResponse>, t: Throwable) {
                Toast.makeText(this@LoginActivity, "Failed to login", Toast.LENGTH_LONG).show()
            }

        })

    }
}
