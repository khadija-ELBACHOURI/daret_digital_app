package daret_digital.com.controller;

import daret_digital.com.domain.Payout;
import daret_digital.com.domain.User;
import daret_digital.com.dto.PayoutDTO;
import daret_digital.com.repository.UtilisateurRepository;
import daret_digital.com.service.PayoutService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups/{groupId}/payouts")
public class PayoutController {

    private final PayoutService payoutService;
    private final UtilisateurRepository userRepository;

    public PayoutController(PayoutService payoutService, UtilisateurRepository userRepository) {
        this.payoutService = payoutService;
        this.userRepository = userRepository;
    }

    private User resolveCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
    }

    // Current cycle's payout (lazily creates the EN_ATTENTE row on first call)
    @GetMapping("/current")
    public PayoutDTO.Response getCurrentPayout(
            @PathVariable UUID groupId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        Payout payout = payoutService.getOrCreateCurrentPayout(groupId, currentUser);
        return PayoutDTO.Response.fromEntity(payout);
    }

    // Organizer confirms the beneficiary has received the pot for this cycle
    @PostMapping("/current/confirm")
    public PayoutDTO.Response confirmCurrentPayout(
            @PathVariable UUID groupId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        Payout payout = payoutService.confirmPayout(groupId, currentUser);
        return PayoutDTO.Response.fromEntity(payout);
    }

    // Full payout history for the group (members only)
    @GetMapping("/history")
    public List<PayoutDTO.Response> getHistory(
            @PathVariable UUID groupId,
            Authentication authentication) {

        User currentUser = resolveCurrentUser(authentication);
        return payoutService.getPayoutHistory(groupId, currentUser).stream()
                .map(PayoutDTO.Response::fromEntity)
                .toList();
    }
}
