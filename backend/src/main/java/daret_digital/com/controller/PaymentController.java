package daret_digital.com.controller;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Payment;
import daret_digital.com.domain.User;
import daret_digital.com.dto.PaymentDTO;
import daret_digital.com.repository.UtilisateurRepository;
import daret_digital.com.service.PaymentService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups/{groupId}/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final UtilisateurRepository userRepository;

    public PaymentController(PaymentService paymentService, UtilisateurRepository userRepository) {
        this.paymentService = paymentService;
        this.userRepository = userRepository;
    }

    private User resolveCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
    }

    // 1. Member declares they paid their contribution for the current cycle
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

    // 3. Organizer validates one member's payment
    @PostMapping("/{paymentId}/validate")
    public PaymentDTO.Response validatePayment(
            @PathVariable UUID groupId,
            @PathVariable UUID paymentId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        Payment payment = paymentService.validatePayment(paymentId, currentUser);
        return PaymentDTO.Response.fromEntity(payment);
    }

    // 3bis. Organizer closes the current turn and moves to the next member
    @PostMapping("/turn/close")
    public GroupStateResponse closeTurn(
            @PathVariable UUID groupId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        DaretGroup group = paymentService.closeTurn(groupId, currentUser);
        return new GroupStateResponse(group.getId(), group.getTourActuel(), group.getStatut().name());
    }

    // List payments for a given cycle (organizer or member view)
    @GetMapping
    public List<PaymentDTO.Response> getPaymentsForCycle(
            @PathVariable UUID groupId,
            @RequestParam Integer cycle) {

        return paymentService.getPaymentsForCycle(groupId, cycle).stream()
                .map(PaymentDTO.Response::fromEntity)
                .toList();
    }

    public record GroupStateResponse(UUID id, Integer tourActuel, String statut) {}
}