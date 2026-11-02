package com.manhunt.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import com.manhunt.app.BuildConfig
import com.manhunt.app.Graph
import com.manhunt.app.data.ApiException
import com.manhunt.app.data.InputRules
import com.manhunt.app.data.ManHuntRepository
import com.manhunt.app.i18n.t
import com.manhunt.app.i18n.translate
import com.manhunt.app.ui.theme.BoardSpace
import com.manhunt.app.ui.theme.BoardTheme
import com.manhunt.app.ui.theme.ManHuntSizes
import com.manhunt.app.ui.theme.ManHuntType
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
    /** Result of the last "Test connection" probe; null before the first test. */
    val serverStatus: String? = null,
    /** Whether [serverStatus] is a success; null while no result is shown. */
    val serverStatusOk: Boolean? = null,
    /** True while a "Test connection" probe is in flight. */
    val testingServer: Boolean = false,
)

class AuthViewModel(private val repo: ManHuntRepository) : ViewModel() {
    var ui by mutableStateOf(AuthUi(serverUrl = repo.serverUrl))
        private set

    fun onUsername(value: String) {
        ui = ui.copy(username = InputRules.username(value), error = null)
    }

    fun onPassword(value: String) {
        ui = ui.copy(password = InputRules.password(value), error = null)
    }
    fun toggleMode() { ui = ui.copy(register = !ui.register, error = null, submitted = false) }
    fun toggleServer() { ui = ui.copy(showServer = !ui.showServer) }

    fun onServerUrl(value: String) {
        // A verdict for the previous address must not outlive the edit.
        ui = ui.copy(serverUrl = value, serverStatus = null, serverStatusOk = null)
    }

    fun saveServer() {
        if (ui.serverUrl.isBlank()) return
        repo.setServerUrl(ui.serverUrl)
        ui = ui.copy(
            serverUrl = repo.serverUrl,
            showServer = false,
            error = null,
            serverStatus = null,
            serverStatusOk = null,
        )
    }

    /**
     * Probes the configured server with the public update manifest. GET /api/app/latest
     * needs no auth token, so it verifies the address before sign-in; any failure reads
     * as "not responding" in the card instead of crashing the screen on a dead server.
     */
    fun testServer() {
        if (ui.testingServer) return
        val configured = repo.serverUrl
        ui = ui.copy(testingServer = true, serverStatus = null, serverStatusOk = null)
        viewModelScope.launch {
            val reachable = runCatching { repo.latestUpdate() }.isSuccess
            // The address changed while the probe was in flight: a verdict for the old
            // server would be misleading, so only stop the spinner.
            if (repo.serverUrl != configured) {
                ui = ui.copy(testingServer = false)
                return@launch
            }
            ui = ui.copy(
                testingServer = false,
                serverStatusOk = reachable,
                serverStatus = translate(
                    if (reachable) {
                        "Server is reachable"
                    } else {
                        "Server did not respond. Check the address."
                    },
                    repo.language.value,
                ),
            )
        }
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

    val usernameError = ui.submitted && ui.username.length < InputRules.MIN_USERNAME
    val passwordError = ui.submitted && ui.password.length < 8
    val canSubmit = !ui.loading &&
        ui.username.length in InputRules.MIN_USERNAME..InputRules.MAX_USERNAME &&
        ui.password.length in 8..InputRules.MAX_PASSWORD

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .widthIn(max = 560.dp)
                .verticalScroll(rememberScrollState())
                .imePadding(),
        ) {
            // FieldPlate: the drawn field is the first impression. It is decorative art, so it
            // gets no semantics and its motion follows the reduced-motion/lifecycle policy.
            BrandFieldPlate(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .testTag("auth_field_plate"),
                animate = true,
            )
            Column(
                Modifier.padding(horizontal = BoardSpace.screen),
                verticalArrangement = Arrangement.spacedBy(BoardSpace.s8),
            ) {
                Spacer(Modifier.height(BoardSpace.s8))
                HeadingText(t("Hide from your friends."), style = ManHuntType.displayL())
                PlateTextField(
                    value = ui.username,
                    onValueChange = vm::onUsername,
                    label = t("Username"),
                    enabled = !ui.loading,
                    error = if (usernameError) t("Username is required") else null,
                    helper = if (
                        !usernameError &&
                        ui.username.isNotEmpty() &&
                        ui.username.length < InputRules.MIN_USERNAME
                    ) {
                        t("At least 3 characters")
                    } else {
                        null
                    },
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next,
                    autofillContentType = if (ui.register) ContentType.NewUsername else ContentType.Username,
                    testTag = "auth_username",
                )
                PlateTextField(
                    value = ui.password,
                    onValueChange = vm::onPassword,
                    label = t("Password"),
                    enabled = !ui.loading,
                    error = if (passwordError) t("Password must be at least 8 characters") else null,
                    helper = if (!passwordError && ui.password.isNotEmpty() && ui.password.length < 8) {
                        t("At least 8 characters")
                    } else {
                        null
                    },
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done,
                    visualTransformation = if (passwordVisible) {
                        VisualTransformation.None
                    } else {
                        PasswordVisualTransformation()
                    },
                    autofillContentType = if (ui.register) ContentType.NewPassword else ContentType.Password,
                    trailing = {
                        IconButton(
                            onClick = { passwordVisible = !passwordVisible },
                            enabled = !ui.loading,
                            modifier = Modifier.size(ManHuntSizes.touchTarget),
                        ) {
                            Icon(
                                if (passwordVisible) {
                                    Icons.Outlined.VisibilityOff
                                } else {
                                    Icons.Outlined.Visibility
                                },
                                contentDescription = t(
                                    if (passwordVisible) "Hide password" else "Show password",
                                ),
                                tint = MaterialTheme.colorScheme.onBackground,
                            )
                        }
                    },
                    keyboardActions = KeyboardActions(onDone = { if (canSubmit) vm.submit() }),
                    testTag = "auth_password",
                )
                ErrorStrip(message = ui.error, onRetry = vm::submit)
                BoardButton(
                    text = if (ui.register) t("Create account") else t("Sign in"),
                    onClick = vm::submit,
                    enabled = canSubmit,
                    loading = ui.loading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("auth_submit"),
                )
                InlineLink(
                    text = if (ui.register) {
                        t("I already have an account")
                    } else {
                        t("New here? Create an account")
                    },
                    onClick = vm::toggleMode,
                    enabled = !ui.loading,
                )

                ChalkRule()

                // Server disclosure: a data row, below the rule, never above the primary action.
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("auth_server_row"),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        t("Game server") + " · " + ui.serverUrl,
                        style = ManHuntType.data(),
                        color = BoardTheme.muted(),
                        maxLines = 1,
                        modifier = Modifier.weight(1f),
                    )
                    InlineLink(
                        text = if (ui.showServer) t("Cancel") else t("Change server"),
                        onClick = vm::toggleServer,
                    )
                }
                if (ui.showServer) {
                    Column(verticalArrangement = Arrangement.spacedBy(BoardSpace.s4)) {
                        PlateTextField(
                            value = ui.serverUrl,
                            onValueChange = vm::onServerUrl,
                            label = t("Server address"),
                            enabled = !ui.testingServer,
                            helper = t("The server your phone connects to."),
                            keyboardType = KeyboardType.Uri,
                            imeAction = ImeAction.Done,
                            testTag = "auth_server_field",
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(BoardSpace.s4)) {
                            BoardButton(
                                text = t("Cancel"),
                                onClick = vm::toggleServer,
                                tone = BoardButtonTone.Outline,
                                modifier = Modifier.weight(1f),
                            )
                            BoardButton(
                                text = t("Save server"),
                                onClick = vm::saveServer,
                                modifier = Modifier.weight(1f),
                            )
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(BoardSpace.s4),
                        ) {
                            BoardButton(
                                text = t("Test connection"),
                                onClick = vm::testServer,
                                tone = BoardButtonTone.Outline,
                                enabled = !ui.testingServer,
                                testTag = "auth_test_server",
                            )
                            if (ui.testingServer) {
                                LoadingTicks()
                                Text(
                                    t("Loading"),
                                    style = ManHuntType.caption(),
                                    color = BoardTheme.muted(),
                                )
                            } else {
                                ui.serverStatus?.let { status ->
                                    Text(
                                        status,
                                        style = ManHuntType.caption(),
                                        color = if (ui.serverStatusOk == true) {
                                            MaterialTheme.colorScheme.primary
                                        } else {
                                            MaterialTheme.colorScheme.error
                                        },
                                    )
                                }
                            }
                        }
                    }
                }
                Text(
                    "v" + BuildConfig.VERSION_NAME + " · free APK · Android 8+",
                    style = ManHuntType.dataSmall(),
                    color = BoardTheme.muted(),
                    modifier = Modifier.testTag("auth_version"),
                )
                Spacer(Modifier.height(BoardSpace.s10))
            }
        }
    }
}
