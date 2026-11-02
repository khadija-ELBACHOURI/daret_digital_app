package daret_digital.com.controller;

import daret_digital.com.service.StripeCheckoutService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

// Public endpoint (no JWT): it must be permitted in the security config.
// Stripe redirects the phone's browser here, and we bounce it into the mobile app
// (exp:// in Expo Go, daret:// in a real build).
@RestController
@RequestMapping("/api/stripe")
public class StripeReturnController {

    @GetMapping("/return")
    public ResponseEntity<Void> backToApp(
            @RequestParam("to") String to,
            @RequestParam("payment") String payment) {

        if (!StripeCheckoutService.isAllowedReturnUrl(to)
                || !("success".equals(payment) || "cancelled".equals(payment))) {
            return ResponseEntity.badRequest().build();
        }

        String separator = to.contains("?") ? "&" : "?";
        try {
            return ResponseEntity.status(302)
                    .location(URI.create(to + separator + "payment=" + payment))
                    .build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}