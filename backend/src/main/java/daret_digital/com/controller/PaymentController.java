package daret_digital.com.controller;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Payment;
import daret_digital.com.domain.User;
import daret_digital.com.dto.PaymentDTO;
import daret_digital.com.repository.UtilisateurRepository;
import daret_digital.com.service.PaymentService;
import daret_digital.com.service.StripeCheckoutService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups/{groupId}/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final StripeCheckoutService stripeCheckoutService;
    private final UtilisateurRepository userRepository;

    public PaymentController(PaymentService paymentService,
                             StripeCheckoutService stripeCheckoutService,
                             UtilisateurRepository userRepository) {
        this.paymentService = paymentService;
        this.stripeCheckoutService = stripeCheckoutService;
        this.userRepository = userRepository;
    }

    private User resolveCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
    }

    // Member starts a card payment: returns the Stripe Checkout URL to redirect to.
    @PostMapping("/me/checkout")
    public CheckoutResponse startCheckout(
            @PathVariable UUID groupId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        String url = stripeCheckoutService.startCheckout(groupId, currentUser);
        return new CheckoutResponse(url);
    }

    // Member declares a manual payment (cash / transfer). Disabled when
    // payments.manual-declaration-enabled=false.
    @PostMapping("/me")
    public PaymentDTO.Response declareMyPayment(
            @PathVariable UUID groupId,
            Authentication authentication,
            @RequestBody(required = false) PaymentDTO.DeclarationRequest body) {

        User currentUser = resolveCurrentUser(authentication);
        String proofUrl = body != null ? body.proofUrl : null;
        Payment payment = paymentService.declarePayment(groupId, currentUser, proofUrl);
        return PaymentDTO.Response.fromEntity(payment);
    }

    // Organizer generates the current cycle's payments on demand
    @PostMapping("/generate")
    public List<PaymentDTO.Response> generateCurrentCyclePayments(
            @PathVariable UUID groupId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        return paymentService.generatePaymentsForCurrentCycle(groupId, currentUser).stream()
                .map(PaymentDTO.Response::fromEntity)
                .toList();
    }

    // Organizer validates one manually declared payment
    @PostMapping("/{paymentId}/validate")
    public PaymentDTO.Response validatePayment(
            @PathVariable UUID groupId,
            @PathVariable UUID paymentId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        Payment payment = paymentService.validatePayment(groupId, paymentId, currentUser);
        return PaymentDTO.Response.fromEntity(payment);
    }

    // Organizer closes the current turn and moves to the next member
    @PostMapping("/turn/close")
    public GroupStateResponse closeTurn(
            @PathVariable UUID groupId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        DaretGroup group = paymentService.closeTurn(groupId, currentUser);
        return new GroupStateResponse(group.getId(), group.getTourActuel(), group.getStatut().name());
    }

    // List payments for a given cycle (members of the group only)
    @GetMapping
    public List<PaymentDTO.Response> getPaymentsForCycle(
            @PathVariable UUID groupId,
            @RequestParam Integer cycle,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        return paymentService.getPaymentsForCycle(groupId, cycle, currentUser).stream()
                .map(PaymentDTO.Response::fromEntity)
                .toList();
    }

    public record GroupStateResponse(UUID id, Integer tourActuel, String statut) {}

    public record CheckoutResponse(String url) {}
}
