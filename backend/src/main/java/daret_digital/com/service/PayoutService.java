package daret_digital.com.service;

import daret_digital.com.domain.*;
import daret_digital.com.repository.DaretGroupRepository;
import daret_digital.com.repository.GroupMembershipRepository;
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

    public PayoutService(PayoutRepository payoutRepository,
                         DaretGroupRepository daretGroupRepository,
                         GroupMembershipRepository groupMembershipRepository) {
        this.payoutRepository = payoutRepository;
        this.daretGroupRepository = daretGroupRepository;
        this.groupMembershipRepository = groupMembershipRepository;
    }

    // Beneficiary of cycle N is the member whose position is N + 1
    // (position is 1-based, cycle/tourActuel is 0-based).
    private User resolveBeneficiary(DaretGroup group, Integer cycle) {
        return groupMembershipRepository.findByGroup(group).stream()
                .filter(m -> m.getPosition() != null && m.getPosition() == cycle + 1)
                .map(GroupMembership::getUser)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No member holds position " + (cycle + 1) + " for this cycle yet."));
    }

    // Returns the payout row for the current cycle, creating it (as EN_ATTENTE) on first
    // read if it doesn't exist yet. Any group member can call this, it's read-lazy, not
    // a state-changing action.
    @Transactional
    public Payout getOrCreateCurrentPayout(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);

        groupMembershipRepository.findByGroupAndUser(group, currentUser)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this group."));

        return payoutRepository.findByGroupAndCycle(group, group.getTourActuel())
                .orElseGet(() -> {
                    User beneficiary = resolveBeneficiary(group, group.getTourActuel());
                    BigDecimal pot = group.getMontant().multiply(BigDecimal.valueOf(group.getNombreMembres()));
                    return payoutRepository.save(new Payout(group, beneficiary, group.getTourActuel(), pot));
                });
    }

    // Organizer confirms the beneficiary actually received the pot for this cycle.
    @Transactional
    public Payout confirmPayout(UUID groupId, User currentUser) {
        DaretGroup group = getGroupOrThrow(groupId);
        requireOrganizer(group, currentUser);

        Payout payout = getOrCreateCurrentPayout(groupId, currentUser);
        payout.setStatus(PayoutStatus.VERSE);
        payout.setPaidAt(Instant.now());
        return payoutRepository.save(payout);
    }

    public List<Payout> getPayoutHistory(UUID groupId) {
        DaretGroup group = getGroupOrThrow(groupId);
        return payoutRepository.findByGroupOrderByCycleAsc(group);
    }

    private DaretGroup getGroupOrThrow(UUID groupId) {
        return daretGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found."));
    }

    private void requireOrganizer(DaretGroup group, User user) {
        GroupMembership membership = groupMembershipRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this group."));

        if (membership.getRole() != GroupRole.ORGANISATEUR) {
            throw new AccessDeniedException("Only the organizer can perform this action.");
        }
    }
}