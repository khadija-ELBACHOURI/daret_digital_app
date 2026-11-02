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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
public class StripeCheckoutService {

    // Only these schemes may be used as a mobile return target (exp:// in Expo Go,
    // daret:// in a real build). Anything else is ignored, so the redirect endpoint
    // can never be abused as an open redirect.
    public static boolean isAllowedReturnUrl(String url) {
        return url != null && (url.startsWith("exp://") || url.startsWith("daret://"));
    }

    private final PaymentService paymentService;

    @Value("${stripe.secret-key}")
    private String secretKey;

    // Both URLs may contain the {groupId} placeholder, e.g.
    // http://localhost:3000/dashboard/daret/{groupId}?payment=success
    @Value("${stripe.success-url}")
    private String successUrl;

    @Value("${stripe.cancel-url}")
    private String cancelUrl;

    // Public base URL of this API as seen by the phone (e.g. http://192.168.1.23:8080).
    // Only used for the mobile return flow. Must NOT be localhost.
    @Value("${stripe.return-base-url:http://localhost:8080}")
    private String returnBaseUrl;

    public StripeCheckoutService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostConstruct
    void init() {
        Stripe.apiKey = secretKey;
    }

    // Web entry point (unchanged behaviour).
    public String startCheckout(UUID groupId, User currentUser) {
        return startCheckout(groupId, currentUser, null);
    }

    // Creates (or reuses) a Checkout Session for the current user's payment
    // and returns the hosted checkout URL. No DB transaction is held open
    // during the calls to Stripe.
    // mobileReturnUrl: deep link of the mobile app, or null for the web app.
    public String startCheckout(UUID groupId, User currentUser, String mobileReturnUrl) {
        Payment payment = paymentService.preparePaymentForCheckout(groupId, currentUser);
        String returnUrl = isAllowedReturnUrl(mobileReturnUrl) ? mobileReturnUrl : null;

        try {
            // Reuse the previous session if it is still open: avoids two live
            // sessions for the same contribution (and a double charge).
            if (payment.getStripeSessionId() != null) {
                Session existing = Session.retrieve(payment.getStripeSessionId());
                if ("open".equals(existing.getStatus()) && existing.getUrl() != null) {
                    if (returnUrl == null) {
                        return existing.getUrl();
                    }
                    // The open session carries the old (web) redirect URLs, so close it
                    // and create a new one that returns to the app. Safe: it is unpaid.
                    existing.expire();
                }
            }

            Session session = Session.create(buildParams(payment, groupId, currentUser, returnUrl));
            paymentService.attachStripeSession(payment.getId(), session.getId());
            return session.getUrl();
        } catch (StripeException e) {
            throw new IllegalStateException("Could not start the card payment. Please try again.", e);
        }
    }

    private String resolveSuccessUrl(UUID groupId, String returnUrl) {
        if (returnUrl == null) {
            return successUrl.replace("{groupId}", groupId.toString());
        }
        return returnBaseUrl + "/api/stripe/return?payment=success&to="
                + URLEncoder.encode(returnUrl, StandardCharsets.UTF_8);
    }

    private String resolveCancelUrl(UUID groupId, String returnUrl) {
        if (returnUrl == null) {
            return cancelUrl.replace("{groupId}", groupId.toString());
        }
        return returnBaseUrl + "/api/stripe/return?payment=cancelled&to="
                + URLEncoder.encode(returnUrl, StandardCharsets.UTF_8);
    }

    private SessionCreateParams buildParams(Payment payment, UUID groupId, User currentUser, String returnUrl) {
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
                .setSuccessUrl(resolveSuccessUrl(groupId, returnUrl))
                .setCancelUrl(resolveCancelUrl(groupId, returnUrl))
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