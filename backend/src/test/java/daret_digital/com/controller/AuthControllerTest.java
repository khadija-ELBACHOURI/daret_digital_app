package daret_digital.com.controller;

import daret_digital.com.domain.User;
import daret_digital.com.repository.UtilisateurRepository;
import daret_digital.com.service.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static daret_digital.com.TestData.aUser;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Calls the controller methods directly, like normal Java methods. There is no HTTP
 * and no Spring Security here, so this tests the logic only (not URLs or auth rules).
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock UtilisateurRepository repository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @InjectMocks AuthController controller;

    // A real repository would assign the id when saving; the mock must do it for us.
    private void saveAssignsAnId() {
        when(repository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });
    }

    // ======================= register =======================

    @Test
    void register_splitsTheFullNameAndStoresAHashedPassword() {
        when(repository.findByEmail("khadija@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("hashed-secret");
        saveAssignsAnId();
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

        ResponseEntity<?> response = controller.register(
                new RegisterRequest("khadija@test.com", "secret123", "Khadija El Bachouri"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getFirstname()).isEqualTo("Khadija");
        assertThat(saved.getValue().getLastname()).isEqualTo("El Bachouri");
        assertThat(saved.getValue().getPassword()).isEqualTo("hashed-secret"); // never the plain text

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        AuthResponse body = (AuthResponse) response.getBody();
        assertThat(body.token()).isEqualTo("jwt-token");
        assertThat(body.email()).isEqualTo("khadija@test.com");
    }

    @Test
    void register_withASingleWordName_usesAnEmptyLastName() {
        when(repository.findByEmail("a@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        saveAssignsAnId();
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");

        controller.register(new RegisterRequest("a@test.com", "secret123", "Khadija"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getFirstname()).isEqualTo("Khadija");
        assertThat(saved.getValue().getLastname()).isEmpty();
    }

    @Test
    void register_withABlankName_returnsBadRequest() {
        ResponseEntity<?> response = controller.register(
                new RegisterRequest("a@test.com", "secret123", "   "));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verify(repository, never()).save(any(User.class));
    }

    @Test
    void register_withAnEmailAlreadyUsed_returnsBadRequest() {
        when(repository.findByEmail("a@test.com")).thenReturn(Optional.of(aUser("a@test.com")));

        ResponseEntity<?> response = controller.register(
                new RegisterRequest("a@test.com", "secret123", "Khadija"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isEqualTo("Email deja utilise");
        verify(repository, never()).save(any(User.class));
    }

    // ======================= login =======================

    @Test
    void login_withAnUnknownEmail_throwsBadCredentials() {
        when(repository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.login(new LoginRequest("ghost@test.com", "whatever")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_withAWrongPassword_throwsBadCredentials() {
        User user = aUser("a@test.com");
        when(repository.findByEmail("a@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> controller.login(new LoginRequest("a@test.com", "wrong")))
                .isInstanceOf(BadCredentialsException.class);
        verify(jwtService, never()).generateToken(any(User.class));
    }

    @Test
    void login_withTheRightPassword_returnsAToken() {
        User user = aUser("a@test.com");
        when(repository.findByEmail("a@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", user.getPassword())).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        ResponseEntity<?> response = controller.login(new LoginRequest("a@test.com", "secret123"));

        AuthResponse body = (AuthResponse) response.getBody();
        assertThat(body.token()).isEqualTo("jwt-token");
        assertThat(body.userId()).isEqualTo(user.getId().toString());
    }
}