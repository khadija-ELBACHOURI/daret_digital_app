package daret_digital.com.service;

import daret_digital.com.domain.*;
import daret_digital.com.repository.DaretGroupRepository;
import daret_digital.com.repository.GroupMembershipRepository;
import daret_digital.com.repository.PaymentRepository;
import daret_digital.com.repository.PayoutRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PayoutService {

    private final PayoutRepository payoutRepository;
    private final DaretGroupRepository daretGroupRepository;
    private final GroupMembershipRepository groupMembershipRepository;
    private final PaymentRepository paymentRepository;

    public PayoutService(PayoutRepository payoutRepository,
                         DaretGroupRepository daretGroupRepository,
                         GroupMembershipRepository groupMembershipRepository,
                         PaymentRepository paymentRepository) {
        this.payoutRepository = payoutRepository;
        this.daretGroupRepository = daretGroupRepository;
        this.groupMembershipRepository = groupMembershipRepository;
        this.paymentRepository = paymentRepository;
    }

    // Beneficiary of cycle N is the member whose position is N + 1
    // (position is 1-based, cycle/tourActuel is 0-based).
    private User resolveBeneficiary(List<GroupMembership> memberships, Integer cycle) {
        return memberships.stream()
                .filter(m -> m.getPosition() != null && m.getPosition() == cycle + 1)
                .map(GroupMembership::getUser)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No member holds position " + (cycle + 1) + " for this cycle yet."));
    }

    // Returns the payout row for the current cycle, creating it (as EN_ATTENTE) on first
    // read if it doesn't exist yet. Any group member can call this.
    @Transactional
    public Payout getOrCreateCurrentPayout(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireMember(group, currentUser);
        return getOrCreatePayout(group);
    }

    // Organizer confirms the beneficiary actually received the pot for this cycle.
    @Transactional
    public Payout confirmPayout(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireOrganizer(group, currentUser);

        if (group.getStatut() != DaretGroup.DaretStatus.ACTIVE) {
            throw new IllegalStateException("This group is not active.");
        }

        // The pot can only be handed over once every contribution is validated.
        int totalMembers = groupMembershipRepository.findByGroup(group).size();
        List<Payment> payments = paymentRepository.findByGroupAndCycle(group, group.getTourActuel());
        boolean allValidated = payments.size() == totalMembers
                && payments.stream().allMatch(p -> p.getStatus() == PaymentStatus.VALIDATED);

        if (!allValidated) {
            throw new IllegalStateException(
                    "All payments for this cycle must be validated before confirming the payout.");
        }

        Payout payout = getOrCreatePayout(group);

        if (payout.getStatus() == PayoutStatus.VERSE) {
            return payout; // already confirmed
        }

        payout.setStatus(PayoutStatus.VERSE);
        payout.setPaidAt(Instant.now());
        return payoutRepository.save(payout);
    }

    // Only members of the group can read its payout history.
    @Transactional(readOnly = true)
    public List<Payout> getPayoutHistory(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireMember(group, currentUser);
        return payoutRepository.findByGroupOrderByCycleAsc(group);
    }

    private Payout getOrCreatePayout(DaretGroup group) {
        return payoutRepository.findByGroupAndCycle(group, group.getTourActuel())
                .orElseGet(() -> {
                    List<GroupMembership> memberships = groupMembershipRepository.findByGroup(group);

                    // The pot is montant x nombreMembres, so the group must be full.
                    if (memberships.size() != group.getNombreMembres()) {
                        throw new IllegalStateException(
                                "The group must be full before a payout can be prepared.");
                    }

                    User beneficiary = resolveBeneficiary(memberships, group.getTourActuel());
                    BigDecimal pot = group.getMontant().multiply(BigDecimal.valueOf(group.getNombreMembres()));
                    return payoutRepository.save(new Payout(group, beneficiary, group.getTourActuel(), pot));
                });
    }

    private DaretGroup getGroupOrThrow(UUID groupId) {
        return daretGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found."));
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
