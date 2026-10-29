package daret_digital.com.service;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.GroupMembership;
import daret_digital.com.domain.GroupRole;
import daret_digital.com.domain.PaymentStatus;
import daret_digital.com.domain.Payout;
import daret_digital.com.domain.PayoutStatus;
import daret_digital.com.domain.User;
import daret_digital.com.repository.DaretGroupRepository;
import daret_digital.com.repository.GroupMembershipRepository;
import daret_digital.com.repository.PaymentRepository;
import daret_digital.com.repository.PayoutRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static daret_digital.com.TestData.aGroup;
import static daret_digital.com.TestData.aMembership;
import static daret_digital.com.TestData.aPayment;
import static daret_digital.com.TestData.aUser;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayoutServiceTest {

    @Mock PayoutRepository payoutRepository;
    @Mock DaretGroupRepository groupRepository;
    @Mock GroupMembershipRepository membershipRepository;
    @Mock PaymentRepository paymentRepository;

    // All 4 constructor parameters have different types, so @InjectMocks works here.
    @InjectMocks PayoutService service;

    User organizer;
    User member;
    DaretGroup group;
    GroupMembership organizerMembership;
    GroupMembership memberMembership;

    @BeforeEach
    void setUp() {
        organizer = aUser("organizer@test.com");
        member = aUser("member@test.com");
        group = aGroup(2, "100.00", DaretGroup.DaretStatus.ACTIVE);
        organizerMembership = aMembership(group, organizer, GroupRole.ORGANISATEUR, 1);
        memberMembership = aMembership(group, member, GroupRole.MEMBRE, 2);
    }

    private void groupExists() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
    }

    private void callerIsOrganizer() {
        when(membershipRepository.findByGroupAndUser(group, organizer))
                .thenReturn(Optional.of(organizerMembership));
    }

    private void callerIsPlainMember() {
        when(membershipRepository.findByGroupAndUser(group, member))
                .thenReturn(Optional.of(memberMembership));
    }

    private Payout aPayout(PayoutStatus status) {
        Payout payout = new Payout(group, organizer, group.getTourActuel(), new BigDecimal("200.00"));
        payout.setStatus(status);
        return payout;
    }

    // ======================= getOrCreateCurrentPayout =======================

    @Test
    void getOrCreateCurrentPayout_whenCallerIsNotAMember_throwsAccessDenied() {
        User outsider = aUser("outsider@test.com");
        groupExists();
        when(membershipRepository.findByGroupAndUser(group, outsider)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getOrCreateCurrentPayout(group.getId(), outsider))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getOrCreateCurrentPayout_whenGroupIsNotFull_throws() {
        group.setNombreMembres(3); // 3 places but only 2 members joined
        groupExists();
        callerIsPlainMember();
        when(payoutRepository.findByGroupAndCycle(group, 0)).thenReturn(Optional.empty());
        when(membershipRepository.findByGroup(group))
                .thenReturn(List.of(organizerMembership, memberMembership));

        assertThatThrownBy(() -> service.getOrCreateCurrentPayout(group.getId(), member))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must be full");
    }

    @Test
    void getOrCreateCurrentPayout_whenNobodyHoldsTheRightPosition_throws() {
        // positions were never assigned by the organizer
        organizerMembership.setPosition(null);
        memberMembership.setPosition(null);
        groupExists();
        callerIsPlainMember();
        when(payoutRepository.findByGroupAndCycle(group, 0)).thenReturn(Optional.empty());
        when(membershipRepository.findByGroup(group))
                .thenReturn(List.of(organizerMembership, memberMembership));

        assertThatThrownBy(() -> service.getOrCreateCurrentPayout(group.getId(), member))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No member holds position 1");
    }

    @Test
    void getOrCreateCurrentPayout_whenGroupIsReady_createsAPendingPayout() {
        groupExists();
        callerIsPlainMember();
        when(payoutRepository.findByGroupAndCycle(group, 0)).thenReturn(Optional.empty());
        when(membershipRepository.findByGroup(group))
                .thenReturn(List.of(organizerMembership, memberMembership));
        when(payoutRepository.save(any(Payout.class))).thenAnswer(returnsFirstArg());

        Payout result = service.getOrCreateCurrentPayout(group.getId(), member);

        assertThat(result.getStatus()).isEqualTo(PayoutStatus.EN_ATTENTE);
        // cycle 0 -> the member at position 1 (the organizer) receives the pot
        assertThat(result.getBeneficiary()).isSameAs(organizer);
        // pot = montant x nombreMembres = 100.00 x 2
        assertThat(result.getAmount()).isEqualByComparingTo("200.00");
        verify(payoutRepository).save(any(Payout.class));
    }

    @Test
    void getOrCreateCurrentPayout_onTheSecondCycle_paysTheMemberAtPositionTwo() {
        group.setTourActuel(1);
        groupExists();
        callerIsPlainMember();
        when(payoutRepository.findByGroupAndCycle(group, 1)).thenReturn(Optional.empty());
        when(membershipRepository.findByGroup(group))
                .thenReturn(List.of(organizerMembership, memberMembership));
        when(payoutRepository.save(any(Payout.class))).thenAnswer(returnsFirstArg());

        Payout result = service.getOrCreateCurrentPayout(group.getId(), member);

        assertThat(result.getBeneficiary()).isSameAs(member);
    }

    // ======================= confirmPayout =======================

    @Test
    void confirmPayout_whenCallerIsNotOrganizer_throwsAccessDenied() {
        groupExists();
        callerIsPlainMember();

        assertThatThrownBy(() -> service.confirmPayout(group.getId(), member))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void confirmPayout_whenGroupIsNotActive_throws() {
        group.setStatut(DaretGroup.DaretStatus.TERMINEE);
        groupExists();
        callerIsOrganizer();

        assertThatThrownBy(() -> service.confirmPayout(group.getId(), organizer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void confirmPayout_whenAContributionIsNotValidated_throws() {
        groupExists();
        callerIsOrganizer();
        when(membershipRepository.findByGroup(group))
                .thenReturn(List.of(organizerMembership, memberMembership));
        when(paymentRepository.findByGroupAndCycle(group, 0)).thenReturn(List.of(
                aPayment(group, organizer, 0, PaymentStatus.VALIDATED),
                aPayment(group, member, 0, PaymentStatus.PENDING)));

        assertThatThrownBy(() -> service.confirmPayout(group.getId(), organizer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("validated");
        verify(payoutRepository, never()).save(any(Payout.class));
    }

    @Test
    void confirmPayout_whenEverythingIsValidated_marksThePayoutAsPaid() {
        groupExists();
        callerIsOrganizer();
        when(membershipRepository.findByGroup(group))
                .thenReturn(List.of(organizerMembership, memberMembership));
        when(paymentRepository.findByGroupAndCycle(group, 0)).thenReturn(List.of(
                aPayment(group, organizer, 0, PaymentStatus.VALIDATED),
                aPayment(group, member, 0, PaymentStatus.VALIDATED)));
        when(payoutRepository.findByGroupAndCycle(group, 0))
                .thenReturn(Optional.of(aPayout(PayoutStatus.EN_ATTENTE)));
        when(payoutRepository.save(any(Payout.class))).thenAnswer(returnsFirstArg());

        Payout result = service.confirmPayout(group.getId(), organizer);

        assertThat(result.getStatus()).isEqualTo(PayoutStatus.VERSE);
    }

    @Test
    void confirmPayout_whenAlreadyPaid_returnsItWithoutSavingAgain() {
        groupExists();
        callerIsOrganizer();
        when(membershipRepository.findByGroup(group))
                .thenReturn(List.of(organizerMembership, memberMembership));
        when(paymentRepository.findByGroupAndCycle(group, 0)).thenReturn(List.of(
                aPayment(group, organizer, 0, PaymentStatus.VALIDATED),
                aPayment(group, member, 0, PaymentStatus.VALIDATED)));
        when(payoutRepository.findByGroupAndCycle(group, 0))
                .thenReturn(Optional.of(aPayout(PayoutStatus.VERSE)));

        Payout result = service.confirmPayout(group.getId(), organizer);

        assertThat(result.getStatus()).isEqualTo(PayoutStatus.VERSE);
        verify(payoutRepository, never()).save(any(Payout.class));
    }

    // ======================= getPayoutHistory =======================

    @Test
    void getPayoutHistory_forAMember_returnsThePayouts() {
        groupExists();
        callerIsPlainMember();
        when(payoutRepository.findByGroupOrderByCycleAsc(group))
                .thenReturn(List.of(aPayout(PayoutStatus.VERSE)));

        List<Payout> history = service.getPayoutHistory(group.getId(), member);

        assertThat(history).hasSize(1);
    }
}