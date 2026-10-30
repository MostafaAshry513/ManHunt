package com.manhunt.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material.icons.outlined.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.manhunt.app.Graph
import com.manhunt.app.data.ApiException
import com.manhunt.app.data.ManHuntRepository
import com.manhunt.app.i18n.t
import com.manhunt.app.i18n.translate
import com.manhunt.app.ui.theme.ManHuntSpacing
import kotlinx.coroutines.launch

data class AuthUi(
    val username: String = "",
    val password: String = "",
    val register: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
    val showServer: Boolean = false,
    val serverUrl: String = "",
    /** True after the first submit attempt, so field errors appear inline. */
    val submitted: Boolean = false,
)

class AuthViewModel(private val repo: ManHuntRepository) : ViewModel() {
    var ui by mutableStateOf(AuthUi(serverUrl = repo.serverUrl))
        private set

    fun onUsername(value: String) { ui = ui.copy(username = value, error = null) }
    fun onPassword(value: String) { ui = ui.copy(password = value, error = null) }
    fun toggleMode() { ui = ui.copy(register = !ui.register, error = null, submitted = false) }
    fun toggleServer() { ui = ui.copy(showServer = !ui.showServer) }
    fun onServerUrl(value: String) { ui = ui.copy(serverUrl = value) }

    fun saveServer() {
        if (ui.serverUrl.isBlank()) return
        repo.setServerUrl(ui.serverUrl)
        ui = ui.copy(serverUrl = repo.serverUrl, showServer = false, error = null)
    }

    fun submit() {
        if (ui.loading) return
        // Same rule as before: a username is required and passwords are at least 8 characters.
        if (ui.username.isBlank() || ui.password.length < 8) {
            ui = ui.copy(
                submitted = true,
                error = if (ui.username.isBlank()) {
                    translate("Username is required", repo.language.value)
                } else {
                    translate("Password must be at least 8 characters", repo.language.value)
                },
            )
            return
        }
        ui = ui.copy(loading = true, error = null, submitted = true)
        viewModelScope.launch {
            try {
                if (ui.register) repo.register(ui.username, ui.password) else repo.login(ui.username, ui.password)
            } catch (e: ApiException) {
                ui = ui.copy(error = e.message)
            } catch (e: Exception) {
                ui = ui.copy(error = e.message ?: translate("Something went wrong", repo.language.value))
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
    var passwordVisible by remember { mutableStateOf(false) }

    val usernameError = ui.submitted && ui.username.isBlank()
    val passwordError = ui.submitted && ui.password.length < 8

    Surface(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = ManHuntSpacing.xl, vertical = ManHuntSpacing.section),
            verticalArrangement = Arrangement.spacedBy(ManHuntSpacing.xl),
        ) {
            HeroBanner(
                title = t("MANHUNT"),
                subtitle = t("Hide. Hunt. Survive."),
                icon = Icons.Outlined.Person,
            )

            ScreenCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (ui.register) Icons.Outlined.Person else Icons.Outlined.Lock,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(Modifier.width(ManHuntSpacing.sm))
                    Text(
                        if (ui.register) t("Create your account") else t("Welcome back"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                }

                ManHuntTextField(
                    value = ui.username,
                    onValueChange = vm::onUsername,
                    label = t("Username"),
                    enabled = !ui.loading,
                    isError = usernameError,
                    supportingText = if (usernameError) t("Username is required") else null,
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next,
                    autofillType = if (ui.register) ContentType.NewUsername else ContentType.Username,
                    testTag = "auth_username",
                )

                ManHuntTextField(
                    value = ui.password,
                    onValueChange = vm::onPassword,
                    label = t("Password"),
                    enabled = !ui.loading,
                    isError = passwordError,
                    supportingText = if (passwordError) t("Password must be at least 8 characters") else null,
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done,
                    visualTransformation = if (passwordVisible) {
                        VisualTransformation.None
                    } else {
                        PasswordVisualTransformation()
                    },
                    autofillType = if (ui.register) ContentType.NewPassword else ContentType.Password,
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                if (passwordVisible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                contentDescription = t(if (passwordVisible) "Hide password" else "Show password"),
                            )
                        }
                    },
                    testTag = "auth_password",
                )

                ErrorBanner(ui.error)

                PrimaryButton(
                    text = if (ui.register) t("Create account") else t("Sign in"),
                    onClick = vm::submit,
                    loading = ui.loading,
                    enabled = !ui.loading,
                    modifier = Modifier.testTag("auth_submit"),
                )

                InlineAction(
                    text = if (ui.register) t("I already have an account") else t("New here? Create an account"),
                    onClick = vm::toggleMode,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            ScreenCard(
                title = t("Server:"),
                subtitle = t("Use your PC's LAN IP on a real phone, or 10.0.2.2 on an emulator."),
                icon = Icons.Outlined.Wifi,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        ui.serverUrl,
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    InlineAction(
                        text = if (ui.showServer) t("Cancel") else t("Change server"),
                        onClick = vm::toggleServer,
                    )
                }
                if (ui.showServer) {
                    ManHuntTextField(
                        value = ui.serverUrl,
                        onValueChange = vm::onServerUrl,
                        label = t("Server address"),
                        // Format hint, not copy: a placeholder must never leak a private LAN address.
                        placeholder = "http://server:8080",
                        keyboardType = KeyboardType.Uri,
                        autofillType = null,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(ManHuntSpacing.sm)) {
                        SecondaryButton(
                            text = t("Cancel"),
                            onClick = vm::toggleServer,
                            modifier = Modifier.weight(1f),
                        )
                        PrimaryButton(
                            text = t("Save server"),
                            onClick = vm::saveServer,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            Spacer(Modifier.height(ManHuntSpacing.sm))
        }
    }
}
