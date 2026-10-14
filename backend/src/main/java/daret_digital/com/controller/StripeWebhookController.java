package daret_digital.com.controller;

import com.stripe.exception.EventDataObjectDeserializationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;

import daret_digital.com.service.PaymentService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Public endpoint (no JWT): it must be permitted in the security config.
// Trust comes from the Stripe-Signature header, verified against the RAW body.
@RestController
@RequestMapping("/api/stripe")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private static final Set<String> HANDLED_EVENTS = Set.of(
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded");

    private final PaymentService paymentService;
    private final String webhookSecret;

    public StripeWebhookController(PaymentService paymentService,
                                   @Value("${stripe.webhook-secret}") String webhookSecret) {
        this.paymentService = paymentService;
        this.webhookSecret = webhookSecret;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {

        Event event;
        try {
            event = Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook: invalid signature");
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        if (!HANDLED_EVENTS.contains(event.getType())) {
            return ResponseEntity.ok("Ignored");
        }

        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        StripeObject stripeObject = deserializer.getObject().orElse(null);
        if (stripeObject == null) {
            try {
                stripeObject = deserializer.deserializeUnsafe();
            } catch (EventDataObjectDeserializationException e) {
                log.error("Stripe webhook: cannot deserialize event {}", event.getId(), e);
                return ResponseEntity.badRequest().body("Cannot deserialize event");
            }
        }

        if (!(stripeObject instanceof Session session)) {
            return ResponseEntity.ok("Ignored");
        }

        // A completed session can still be unpaid (delayed payment methods).
        if (!"paid".equals(session.getPaymentStatus())) {
            return ResponseEntity.ok("Not paid yet");
        }

        Map<String, String> metadata = session.getMetadata();
        String rawPaymentId = metadata != null ? metadata.get("paymentId") : null;
        if (rawPaymentId == null) {
            log.warn("Stripe webhook: session {} has no paymentId metadata", session.getId());
            return ResponseEntity.ok("No paymentId");
        }

        UUID paymentId;
        try {
            paymentId = UUID.fromString(rawPaymentId);
        } catch (IllegalArgumentException e) {
            log.warn("Stripe webhook: invalid paymentId metadata on session {}", session.getId());
            return ResponseEntity.ok("Invalid paymentId");
        }

        paymentService.confirmStripePayment(
                paymentId,
                session.getId(),
                session.getPaymentIntent(),
                session.getAmountTotal(),
                session.getCurrency());

        return ResponseEntity.ok("OK");
    }
}
