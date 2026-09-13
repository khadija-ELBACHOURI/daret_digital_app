package daret_digital.com.service;

import daret_digital.com.domain.*;
import daret_digital.com.repository.DaretGroupRepository;
import daret_digital.com.repository.GroupMembershipRepository;
import daret_digital.com.repository.PaymentRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final DaretGroupRepository daretGroupRepository;
    private final GroupMembershipRepository groupMembershipRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          DaretGroupRepository daretGroupRepository,
                          GroupMembershipRepository groupMembershipRepository) {
        this.paymentRepository = paymentRepository;
        this.daretGroupRepository = daretGroupRepository;
        this.groupMembershipRepository = groupMembershipRepository;
    }

    // ---------- 1. A member pays their contribution for the current cycle ----------
    @Transactional
    public Payment declarePayment(UUID groupId, User currentUser, String proofUrl) {
        DaretGroup group = getGroupOrThrow(groupId);

        groupMembershipRepository.findByGroupAndUser(group, currentUser)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this group."));

        Payment payment = paymentRepository
                .findByGroupAndMemberAndCycle(group, currentUser, group.getTourActuel())
                .orElseThrow(() -> new IllegalStateException(
                        "No payment was generated for this cycle yet. Contact the organizer."));

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDate.now());
        payment.setProofUrl(proofUrl);

        return paymentRepository.save(payment);
    }

    // ---------- 3. Organizer validates a member's payment ----------
    @Transactional
    public Payment validatePayment(UUID paymentId, User currentUser) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found."));

        requireOrganizer(payment.getGroup(), currentUser);

        payment.setStatus(PaymentStatus.VALIDATED);
        payment.setValidatedAt(Instant.now());

        return paymentRepository.save(payment);
    }

    // ---------- 3bis. Organizer closes the current turn ----------
    // Call this once the current beneficiary (group.getTourActuel()) has received the money.
    @Transactional
    public DaretGroup closeTurn(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireOrganizer(group, currentUser);

        boolean incompletePayments = paymentRepository
                .existsByGroupAndCycleAndStatusNot(group, group.getTourActuel(), PaymentStatus.VALIDATED);

        if (incompletePayments) {
            throw new IllegalStateException(
                    "All payments for this cycle must be validated before closing the turn.");
        }

        return moveToNextTurn(group);
    }

    // ---------- 2. Increment the turn ----------
    private DaretGroup moveToNextTurn(DaretGroup group) {
        int totalMembers = groupMembershipRepository.findByGroup(group).size();
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

    // Organizer-triggered version: lets the organizer generate the current cycle's
    // payments on demand from the UI, instead of waiting for the monthly scheduler.
    // Safe to call repeatedly: generatePaymentsForCycle() skips members who already
    // have a payment row for this cycle.
    @Transactional
    public List<Payment> generatePaymentsForCurrentCycle(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireOrganizer(group, currentUser);
        return generatePaymentsForCycle(group);
    }

    public List<Payment> getPaymentsForCycle(UUID groupId, Integer cycle) {
        DaretGroup group = getGroupOrThrow(groupId);
        return paymentRepository.findByGroupAndCycle(group, cycle);
    }

    // ---------- Helpers ----------
    private DaretGroup getGroupOrThrow(UUID groupId) {
        return daretGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found."));
    }

    private void requireOrganizer(DaretGroup group, User user) {
        GroupMembership membership = groupMembershipRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this group."));

        // adjust GroupRole.ORGANISATEUR if your enum constant is named differently
        if (membership.getRole() != GroupRole.ORGANISATEUR) {
            throw new AccessDeniedException("Only the organizer can perform this action.");
        }
    }
}