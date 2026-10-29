package daret_digital.com.service;

import daret_digital.com.domain.User;
import io.jsonwebtoken.security.WeakKeyException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static daret_digital.com.TestData.aUser;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * No Mockito here: JwtService has no collaborators, so we test the real class.
 * The two @Value fields are normally filled by Spring; in a plain unit test we fill
 * them ourselves with ReflectionTestUtils.
 */
class JwtServiceTest {

    private static final String SECRET = "a-test-secret-that-is-at-least-32-characters-long";

    private JwtService jwtService;
    private User user;

    private static JwtService serviceWith(String secret, long expirationMs) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secretKey", secret);
        ReflectionTestUtils.setField(service, "expiration", expirationMs);
        return service;
    }

    @BeforeEach
    void setUp() {
        jwtService = serviceWith(SECRET, 3_600_000L);
        user = aUser("khadija@test.com");
    }

    @Test
    void generatedToken_containsEmailAndUserId() {
        String token = jwtService.generateToken(user);

        assertThat(jwtService.extractEmail(token)).isEqualTo("khadija@test.com");
        assertThat(jwtService.extractUserId(token)).isEqualTo(user.getId().toString());
    }

    @Test
    void generatedToken_isValid() {
        assertThat(jwtService.isTokenValid(jwtService.generateToken(user))).isTrue();
    }

    @Test
    void garbageToken_isNotValid() {
        assertThat(jwtService.isTokenValid("not.a.jwt")).isFalse();
        assertThat(jwtService.isTokenValid("")).isFalse();
    }

    @Test
    void tokenSignedWithAnotherSecret_isNotValid() {
        JwtService attacker = serviceWith("another-secret-that-is-also-32-characters-long!", 3_600_000L);

        String forgedToken = attacker.generateToken(user);

        assertThat(jwtService.isTokenValid(forgedToken)).isFalse();
    }

    @Test
    void expiredToken_isNotValid() {
        JwtService shortLived = serviceWith(SECRET, -1000L); // already expired when created

        assertThat(shortLived.isTokenValid(shortLived.generateToken(user))).isFalse();
    }

    @Test
    void secretShorterThan32Characters_isRejected() {
        // HS256 needs a 256-bit key: a short JWT_SECRET fails at the first login.
        JwtService weak = serviceWith("too-short", 3_600_000L);

        assertThatThrownBy(() -> weak.generateToken(user)).isInstanceOf(WeakKeyException.class);
    }
}