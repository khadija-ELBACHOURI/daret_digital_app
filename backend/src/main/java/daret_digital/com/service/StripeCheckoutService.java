package daret_digital.com.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import daret_digital.com.domain.Payment;
import daret_digital.com.domain.User;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class StripeCheckoutService {

    private final PaymentService paymentService;

    @Value("${stripe.secret-key}")
    private String secretKey;

    // Both URLs may contain the {groupId} placeholder, e.g.
    // http://localhost:3000/dashboard/daret/{groupId}?payment=success
    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    public StripeCheckoutService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostConstruct
    void init() {
        Stripe.apiKey = secretKey;
    }

    // Creates (or reuses) a Checkout Session for the current user's payment
    // and returns the hosted checkout URL. No DB transaction is held open
    // during the calls to Stripe.
    public String startCheckout(UUID groupId, User currentUser) {
        Payment payment = paymentService.preparePaymentForCheckout(groupId, currentUser);

        try {
            // Reuse the previous session if it is still open: avoids two live
            // sessions for the same contribution (and a double charge).
            if (payment.getStripeSessionId() != null) {
                Session existing = Session.retrieve(payment.getStripeSessionId());
                if ("open".equals(existing.getStatus()) && existing.getUrl() != null) {
                    return existing.getUrl();
                }
            }

            Session session = Session.create(buildParams(payment, groupId, currentUser));
            paymentService.attachStripeSession(payment.getId(), session.getId());
            return session.getUrl();
        } catch (StripeException e) {
            throw new IllegalStateException("Could not start the card payment. Please try again.", e);
        }
    }

    private SessionCreateParams buildParams(Payment payment, UUID groupId, User currentUser) {
        String paymentId = payment.getId().toString();
        String productName = "Cotisation " + payment.getGroup().getNom()
                + " (tour " + (payment.getCycle() + 1) + ")";

        return SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setClientReferenceId(paymentId)
                .setCustomerEmail(currentUser.getEmail())
                .putMetadata("paymentId", paymentId)
                .putMetadata("groupId", groupId.toString())
                .setPaymentIntentData(
                        SessionCreateParams.PaymentIntentData.builder()
                                .putMetadata("paymentId", paymentId)
                                .build())
                .setSuccessUrl(successUrl.replace("{groupId}", groupId.toString()))
                .setCancelUrl(cancelUrl.replace("{groupId}", groupId.toString()))
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(PaymentService.CURRENCY)
                                                .setUnitAmount(PaymentService.toMinorUnits(payment.getAmount()))
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(productName)
                                                                .build())
                                                .build())
                                .build())
                .build();
    }
}
