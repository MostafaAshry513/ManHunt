package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.manhunt.app.Graph
import com.manhunt.app.i18n.t
import com.manhunt.app.data.ApiException
import com.manhunt.app.data.ManHuntRepository
import kotlinx.coroutines.launch

data class AuthUi(
    val username: String = "",
    val password: String = "",
    val register: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
    val showServer: Boolean = false,
    val serverUrl: String = "",
)

class AuthViewModel(private val repo: ManHuntRepository) : ViewModel() {
    var ui by mutableStateOf(AuthUi(serverUrl = repo.serverUrl))
        private set

    fun onUsername(value: String) { ui = ui.copy(username = value, error = null) }
    fun onPassword(value: String) { ui = ui.copy(password = value, error = null) }
    fun toggleMode() { ui = ui.copy(register = !ui.register, error = null) }
    fun toggleServer() { ui = ui.copy(showServer = !ui.showServer) }
    fun onServerUrl(value: String) { ui = ui.copy(serverUrl = value) }

    fun saveServer() {
        if (ui.serverUrl.isBlank()) return
        repo.setServerUrl(ui.serverUrl)
        ui = ui.copy(serverUrl = repo.serverUrl, showServer = false, error = null)
    }

    fun submit() {
        if (ui.loading) return
        if (ui.username.isBlank() || ui.password.length < 8) {
            ui = ui.copy(error = "Username required and password must be at least 8 characters")
            return
        }
        ui = ui.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                if (ui.register) repo.register(ui.username, ui.password) else repo.login(ui.username, ui.password)
            } catch (e: ApiException) {
                ui = ui.copy(error = e.message)
            } catch (e: Exception) {
                ui = ui.copy(error = e.message ?: "Something went wrong")
            } finally {
                ui = ui.copy(loading = false)
            }
        }
    }
}

@Composable
fun AuthScreen() {
    val vm: AuthViewModel = viewModel(factory = viewModelFactory {
        initializer { AuthViewModel(Graph.container.repository) }
    })
    val ui = vm.ui

    Surface(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 48.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Text(t("MANHUNT"), style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black)
            Spacer(Modifier.height(6.dp))
            Text(
                "Hide. Hunt. Survive.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(32.dp))

            ScreenCard {
                Text(
                    if (ui.register) "Create your account" else "Welcome back",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )

                OutlinedTextField(
                    value = ui.username,
                    onValueChange = vm::onUsername,
                    label = { Text(t("Username")) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("auth_username"),
                )
                OutlinedTextField(
                    value = ui.password,
                    onValueChange = vm::onPassword,
                    label = { Text(t("Password")) },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth().testTag("auth_password"),
                )

                ErrorBanner(ui.error)

                Button(
                    onClick = {
                        vm.submit()
                    },
                    enabled = !ui.loading,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp).testTag("auth_submit"),
                ) {
                    if (ui.loading) {
                        ManHuntLoader(size = 20.dp, color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text(if (ui.register) "Create account" else "Sign in")
                    }
                }

                TextButton(onClick = vm::toggleMode, modifier = Modifier.fillMaxWidth()) {
                    Text(if (ui.register) "I already have an account" else "New here? Create an account")
                }
            }

            Spacer(Modifier.height(20.dp))

            TextButton(onClick = vm::toggleServer) {
                Text("${t("Server:")} ${ui.serverUrl}", style = MaterialTheme.typography.bodySmall)
            }
            if (ui.showServer) {
                ScreenCard {
                    Text(t("Server address"), style = MaterialTheme.typography.titleSmall)
                    Text(
                        "Use your PC's LAN IP on a real phone, or 10.0.2.2 on an emulator.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    OutlinedTextField(
                        value = ui.serverUrl,
                        onValueChange = vm::onServerUrl,
                        label = { Text(t("http://192.168.1.20:8080")) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Button(onClick = vm::saveServer, modifier = Modifier.fillMaxWidth()) {
                        Text(t("Save server"))
                    }
                }
            }

            Spacer(Modifier.height(8.dp))
        }
    }
}
