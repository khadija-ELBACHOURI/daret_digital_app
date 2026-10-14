package daret_digital.com.service;

import daret_digital.com.domain.*;
import daret_digital.com.repository.DaretGroupRepository;
import daret_digital.com.repository.GroupMembershipRepository;
import daret_digital.com.repository.PaymentRepository;
import daret_digital.com.repository.PayoutRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    public static final String CURRENCY = "mad";

    private final PaymentRepository paymentRepository;
    private final DaretGroupRepository daretGroupRepository;
    private final GroupMembershipRepository groupMembershipRepository;
    private final PayoutRepository payoutRepository;

    // Set payments.manual-declaration-enabled=false once Stripe is live, so members
    // cannot self-declare a payment ("J'ai paye") without actually paying.
    private final boolean manualDeclarationEnabled;

    public PaymentService(PaymentRepository paymentRepository,
                          DaretGroupRepository daretGroupRepository,
                          GroupMembershipRepository groupMembershipRepository,
                          PayoutRepository payoutRepository,
                          @Value("${payments.manual-declaration-enabled:true}") boolean manualDeclarationEnabled) {
        this.paymentRepository = paymentRepository;
        this.daretGroupRepository = daretGroupRepository;
        this.groupMembershipRepository = groupMembershipRepository;
        this.payoutRepository = payoutRepository;
        this.manualDeclarationEnabled = manualDeclarationEnabled;
    }

    // ---------- 1. A member declares they paid (cash / bank transfer) ----------
    @Transactional
    public Payment declarePayment(UUID groupId, User currentUser, String proofUrl) {
        if (!manualDeclarationEnabled) {
            throw new IllegalStateException("Manual payment declaration is disabled. Please pay by card.");
        }

        DaretGroup group = getGroupOrThrow(groupId);
        requireActive(group);
        requireMember(group, currentUser);

        Payment payment = paymentRepository
                .findByGroupAndMemberAndCycle(group, currentUser, group.getTourActuel())
                .orElseThrow(() -> new IllegalStateException(
                        "No payment was generated for this cycle yet. Contact the organizer."));

        if (!isPayable(payment)) {
            throw new IllegalStateException("This payment was already declared or validated.");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDate.now());
        payment.setProofUrl(proofUrl);

        return paymentRepository.save(payment);
    }

    // ---------- 2. Organizer validates a manually declared payment ----------
    @Transactional
    public Payment validatePayment(UUID groupId, UUID paymentId, User currentUser) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        // The payment must belong to the group in the URL.
        if (!payment.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Payment not found.");
        }

        requireOrganizer(payment.getGroup(), currentUser);

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new IllegalStateException("Only a payment declared as paid can be validated.");
        }

        payment.setStatus(PaymentStatus.VALIDATED);
        payment.setValidatedAt(Instant.now());

        return paymentRepository.save(payment);
    }

    // ---------- 3. Organizer closes the current turn ----------
    // Requires: every member has a payment for this cycle and all are VALIDATED,
    // and the payout to this cycle's beneficiary is VERSE.
    @Transactional
    public DaretGroup closeTurn(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireOrganizer(group, currentUser);
        requireActive(group);

        int totalMembers = groupMembershipRepository.findByGroup(group).size();
        List<Payment> payments = paymentRepository.findByGroupAndCycle(group, group.getTourActuel());

        boolean allValidated = payments.size() == totalMembers
                && payments.stream().allMatch(p -> p.getStatus() == PaymentStatus.VALIDATED);

        if (!allValidated) {
            throw new IllegalStateException(
                    "All payments for this cycle must exist and be validated before closing the turn.");
        }

        Payout payout = payoutRepository.findByGroupAndCycle(group, group.getTourActuel()).orElse(null);

        if (payout == null || payout.getStatus() != PayoutStatus.VERSE) {
            throw new IllegalStateException(
                    "The payout to this cycle's beneficiary must be confirmed before closing the turn.");
        }

        return moveToNextTurn(group, totalMembers);
    }

    private DaretGroup moveToNextTurn(DaretGroup group, int totalMembers) {
        int nextTurn = group.getTourActuel() + 1;

        if (nextTurn >= totalMembers) {
            group.setStatut(DaretGroup.DaretStatus.TERMINEE);
        } else {
            group.setTourActuel(nextTurn);
            generatePaymentsForCycle(group);
        }

        return daretGroupRepository.save(group);
    }

    // ---------- 4. Generate this cycle's payments for every member ----------
    // Internal version: no auth check, used by the scheduler and by closeTurn().
    @Transactional
    public List<Payment> generatePaymentsForCycle(DaretGroup group) {
        List<GroupMembership> memberships = groupMembershipRepository.findByGroup(group);

        return memberships.stream()
                .map(membership -> paymentRepository
                        .findByGroupAndMemberAndCycle(group, membership.getUser(), group.getTourActuel())
                        .orElseGet(() -> paymentRepository.save(
                                new Payment(group, membership.getUser(), group.getTourActuel(), group.getMontant()))))
                .toList();
    }

    // Organizer-triggered version. Safe to call repeatedly: members who already
    // have a payment row for this cycle are skipped.
    @Transactional
    public List<Payment> generatePaymentsForCurrentCycle(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireOrganizer(group, currentUser);
        requireActive(group);
        return generatePaymentsForCycle(group);
    }

    // Only members of the group can read its payments.
    @Transactional(readOnly = true)
    public List<Payment> getPaymentsForCycle(UUID groupId, Integer cycle, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireMember(group, currentUser);
        return paymentRepository.findByGroupAndCycle(group, cycle);
    }

    // ---------- Stripe support ----------

    // Loads the current user's payable payment for the current cycle.
    // Called before creating a Checkout Session.
    @Transactional(readOnly = true)
    public Payment preparePaymentForCheckout(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireActive(group);
        requireMember(group, currentUser);

        Payment payment = paymentRepository
                .findByGroupAndMemberAndCycle(group, currentUser, group.getTourActuel())
                .orElseThrow(() -> new IllegalStateException(
                        "No payment was generated for this cycle yet. Contact the organizer."));

        if (!isPayable(payment)) {
            throw new IllegalStateException("This payment was already paid or is awaiting validation.");
        }

        return payment;
    }

    @Transactional
    public void attachStripeSession(UUID paymentId, String sessionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));
        payment.setStripeSessionId(sessionId);
        paymentRepository.save(payment);
    }

    // Called ONLY by the Stripe webhook after the signature was verified.
    // Idempotent: Stripe may deliver the same event several times.
    @Transactional
    public void confirmStripePayment(UUID paymentId, String sessionId, String paymentIntentId,
                                     Long amountTotal, String currency) {
        Payment payment = paymentRepository.findById(paymentId).orElse(null);

        if (payment == null) {
            log.warn("Stripe webhook: payment {} not found (session {})", paymentId, sessionId);
            return;
        }

        if (payment.getStatus() == PaymentStatus.VALIDATED) {
            return; // already processed
        }

        long expected = toMinorUnits(payment.getAmount());
        if (amountTotal == null || amountTotal.longValue() != expected
                || currency == null || !CURRENCY.equalsIgnoreCase(currency)) {
            log.error("Stripe webhook: amount mismatch for payment {} (expected {} {}, got {} {})",
                    paymentId, expected, CURRENCY, amountTotal, currency);
            return;
        }

        payment.setStatus(PaymentStatus.VALIDATED);
        payment.setPaidAt(LocalDate.now());
        payment.setValidatedAt(Instant.now());
        payment.setStripeSessionId(sessionId);
        payment.setStripePaymentIntentId(paymentIntentId);
        paymentRepository.save(payment);
    }

    // Stripe amounts are in the smallest currency unit (centimes for MAD).
    public static long toMinorUnits(BigDecimal amount) {
        return amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValue();
    }

    // ---------- Helpers ----------
    private boolean isPayable(Payment payment) {
        return payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.LATE;
    }

    private DaretGroup getGroupOrThrow(UUID groupId) {
        return daretGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found."));
    }

    private void requireActive(DaretGroup group) {
        if (group.getStatut() != DaretGroup.DaretStatus.ACTIVE) {
            throw new IllegalStateException("This group is not active.");
        }
    }

    private GroupMembership requireMember(DaretGroup group, User user) {
        return groupMembershipRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this group."));
    }

    private void requireOrganizer(DaretGroup group, User user) {
        GroupMembership membership = requireMember(group, user);

        if (membership.getRole() != GroupRole.ORGANISATEUR) {
            throw new AccessDeniedException("Only the organizer can perform this action.");
        }
    }
}