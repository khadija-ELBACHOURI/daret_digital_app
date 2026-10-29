package daret_digital.com.controller;

import daret_digital.com.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * The webhook is the only door through which a payment becomes VALIDATED without a human,
 * so it deserves the most careful tests.
 *
 * We do not mock Stripe's signature check: we sign the payload ourselves, the same way
 * Stripe does (HMAC-SHA256 over "timestamp.payload" with the webhook secret), and let
 * the real Webhook.constructEvent verify it.
 */
@ExtendWith(MockitoExtension.class)
class StripeWebhookControllerTest {

    private static final String SECRET = "whsec_test_secret";

    @Mock PaymentService paymentService;

    StripeWebhookController controller;
    UUID paymentId;

    @BeforeEach
    void setUp() {
        controller = new StripeWebhookController(paymentService, SECRET);
        paymentId = UUID.randomUUID();
    }

    // ---------- helpers ----------

    private static String signatureHeader(String payload, String secret) {
        try {
            long timestamp = Instant.now().getEpochSecond();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal((timestamp + "." + payload).getBytes(StandardCharsets.UTF_8));
            return "t=" + timestamp + ",v1=" + HexFormat.of().formatHex(hash);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String event(String type, String objectJson) {
        return """
                {"id":"evt_test_1","object":"event","type":"%s","data":{"object":%s}}"""
                .formatted(type, objectJson.strip());
    }

    private static String session(String paymentStatus, String metadataJson) {
        return """
                {"id":"cs_test_1","object":"checkout.session","payment_status":"%s",\
                "payment_intent":"pi_test_1","amount_total":10000,"currency":"mad",\
                "metadata":%s}""".formatted(paymentStatus, metadataJson);
    }

    private String metadataWithPaymentId() {
        return "{\"paymentId\":\"" + paymentId + "\"}";
    }

    /** Sends a correctly signed event to the controller. */
    private ResponseEntity<String> postSigned(String type, String objectJson) {
        String payload = event(type, objectJson);
        return controller.handleWebhook(payload, signatureHeader(payload, SECRET));
    }

    // ======================= signature =======================

    @Test
    void invalidSignature_isRejected_andNothingIsConfirmed() {
        String payload = event("checkout.session.completed", session("paid", metadataWithPaymentId()));

        ResponseEntity<String> response = controller.handleWebhook(payload, "t=1,v1=not-a-real-signature");

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verifyNoInteractions(paymentService);
    }

    @Test
    void eventSignedWithAnotherSecret_isRejected() {
        String payload = event("checkout.session.completed", session("paid", metadataWithPaymentId()));

        ResponseEntity<String> response =
                controller.handleWebhook(payload, signatureHeader(payload, "whsec_attacker_secret"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verifyNoInteractions(paymentService);
    }

    // ======================= handled events =======================

    @Test
    void paidCheckoutSession_confirmsThePayment() {
        ResponseEntity<String> response =
                postSigned("checkout.session.completed", session("paid", metadataWithPaymentId()));

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo("OK");
        verify(paymentService).confirmStripePayment(
                eq(paymentId), eq("cs_test_1"), eq("pi_test_1"), eq(10000L), eq("mad"));
    }

    @Test
    void asyncPaymentSucceeded_isHandledToo() {
        ResponseEntity<String> response =
                postSigned("checkout.session.async_payment_succeeded", session("paid", metadataWithPaymentId()));

        assertThat(response.getBody()).isEqualTo("OK");
        verify(paymentService).confirmStripePayment(
                eq(paymentId), eq("cs_test_1"), eq("pi_test_1"), eq(10000L), eq("mad"));
    }

    @Test
    void completedButUnpaidSession_isNotConfirmed() {
        // delayed payment methods: the session completes before the money arrives
        ResponseEntity<String> response =
                postSigned("checkout.session.completed", session("unpaid", metadataWithPaymentId()));

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo("Not paid yet");
        verifyNoInteractions(paymentService);
    }

    // ======================= ignored / malformed events =======================

    @Test
    void unrelatedEventType_isIgnored() {
        ResponseEntity<String> response =
                postSigned("customer.created", "{\"id\":\"cus_1\",\"object\":\"customer\"}");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo("Ignored");
        verifyNoInteractions(paymentService);
    }

    @Test
    void sessionWithoutPaymentIdMetadata_isIgnored() {
        ResponseEntity<String> response =
                postSigned("checkout.session.completed", session("paid", "{}"));

        assertThat(response.getBody()).isEqualTo("No paymentId");
        verifyNoInteractions(paymentService);
    }

    @Test
    void sessionWithAnInvalidPaymentId_isIgnored() {
        ResponseEntity<String> response =
                postSigned("checkout.session.completed", session("paid", "{\"paymentId\":\"not-a-uuid\"}"));

        assertThat(response.getBody()).isEqualTo("Invalid paymentId");
        verifyNoInteractions(paymentService);
    }
}