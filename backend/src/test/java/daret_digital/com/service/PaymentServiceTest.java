package daret_digital.com.service;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.GroupMembership;
import daret_digital.com.domain.GroupRole;
import daret_digital.com.domain.Payment;
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static daret_digital.com.TestData.aGroup;
import static daret_digital.com.TestData.aMembership;
import static daret_digital.com.TestData.aPayment;
import static daret_digital.com.TestData.aUser;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock PaymentRepository paymentRepository;
    @Mock DaretGroupRepository groupRepository;
    @Mock GroupMembershipRepository membershipRepository;
    @Mock PayoutRepository payoutRepository;

    PaymentService service;

    User organizer;
    User member;
    DaretGroup group;
    GroupMembership organizerMembership;
    GroupMembership memberMembership;

    @BeforeEach
    void setUp() {
        // PaymentService has a boolean constructor parameter, so we build it by hand
        // instead of using @InjectMocks. "true" = manual declaration enabled.
        service = new PaymentService(paymentRepository, groupRepository, membershipRepository,
                payoutRepository, true);

        organizer = aUser("organizer@test.com");
        member = aUser("member@test.com");
        group = aGroup(2, "100.00", DaretGroup.DaretStatus.ACTIVE);
        organizerMembership = aMembership(group, organizer, GroupRole.ORGANISATEUR, 1);
        memberMembership = aMembership(group, member, GroupRole.MEMBRE, 2);
    }

    // ---------- small helpers that describe the "world" for a test ----------

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

    private void groupHasTwoMembers() {
        when(membershipRepository.findByGroup(group))
                .thenReturn(List.of(organizerMembership, memberMembership));
    }

    private Payout aPayout(PayoutStatus status) {
        Payout payout = new Payout(group, organizer, group.getTourActuel(), new BigDecimal("200.00"));
        payout.setStatus(status);
        return payout;
    }

    // ======================= closeTurn =======================

    @Test
    void closeTurn_whenCallerIsNotOrganizer_throwsAccessDenied() {
        groupExists();
        callerIsPlainMember();

        assertThatThrownBy(() -> service.closeTurn(group.getId(), member))
                .isInstanceOf(AccessDeniedException.class);

        verify(groupRepository, never()).save(any(DaretGroup.class));
    }

    @Test
    void closeTurn_whenGroupIsNotActive_throws() {
        group.setStatut(DaretGroup.DaretStatus.EN_ATTENTE);
        groupExists();
        callerIsOrganizer();

        assertThatThrownBy(() -> service.closeTurn(group.getId(), organizer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void closeTurn_whenOnePaymentIsNotValidated_throws() {
        groupExists();
        callerIsOrganizer();
        groupHasTwoMembers();
        when(paymentRepository.findByGroupAndCycle(group, 0)).thenReturn(List.of(
                aPayment(group, organizer, 0, PaymentStatus.VALIDATED),
                aPayment(group, member, 0, PaymentStatus.PAID)));

        assertThatThrownBy(() -> service.closeTurn(group.getId(), organizer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("validated");

        verify(groupRepository, never()).save(any(DaretGroup.class));
    }

    @Test
    void closeTurn_whenSomeMembersHaveNoPayment_throws() {
        groupExists();
        callerIsOrganizer();
        groupHasTwoMembers();
        // only one payment row for two members
        when(paymentRepository.findByGroupAndCycle(group, 0)).thenReturn(List.of(
                aPayment(group, organizer, 0, PaymentStatus.VALIDATED)));

        assertThatThrownBy(() -> service.closeTurn(group.getId(), organizer))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void closeTurn_whenNoPayoutExists_throws() {
        groupExists();
        callerIsOrganizer();
        groupHasTwoMembers();
        when(paymentRepository.findByGroupAndCycle(group, 0)).thenReturn(List.of(
                aPayment(group, organizer, 0, PaymentStatus.VALIDATED),
                aPayment(group, member, 0, PaymentStatus.VALIDATED)));
        when(payoutRepository.findByGroupAndCycle(group, 0)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.closeTurn(group.getId(), organizer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("payout");
    }

    @Test
    void closeTurn_whenPayoutIsNotYetConfirmed_throws() {
        groupExists();
        callerIsOrganizer();
        groupHasTwoMembers();
        when(paymentRepository.findByGroupAndCycle(group, 0)).thenReturn(List.of(
                aPayment(group, organizer, 0, PaymentStatus.VALIDATED),
                aPayment(group, member, 0, PaymentStatus.VALIDATED)));
        when(payoutRepository.findByGroupAndCycle(group, 0))
                .thenReturn(Optional.of(aPayout(PayoutStatus.EN_ATTENTE)));

        assertThatThrownBy(() -> service.closeTurn(group.getId(), organizer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("payout");
    }

    @Test
    void closeTurn_whenEverythingIsReady_movesToNextTurnAndGeneratesPayments() {
        groupExists();
        callerIsOrganizer();
        groupHasTwoMembers();
        when(paymentRepository.findByGroupAndCycle(group, 0)).thenReturn(List.of(
                aPayment(group, organizer, 0, PaymentStatus.VALIDATED),
                aPayment(group, member, 0, PaymentStatus.VALIDATED)));
        when(payoutRepository.findByGroupAndCycle(group, 0))
                .thenReturn(Optional.of(aPayout(PayoutStatus.VERSE)));
        // next turn (cycle 1): nobody has a payment yet, so the service creates them
        when(paymentRepository.findByGroupAndMemberAndCycle(eq(group), any(User.class), eq(1)))
                .thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(returnsFirstArg());
        when(groupRepository.save(group)).thenAnswer(returnsFirstArg());

        DaretGroup result = service.closeTurn(group.getId(), organizer);

        assertThat(result.getTourActuel()).isEqualTo(1);
        assertThat(result.getStatut()).isEqualTo(DaretGroup.DaretStatus.ACTIVE);
        verify(paymentRepository, times(2)).save(any(Payment.class)); // one per member
    }

    @Test
    void closeTurn_onTheLastTurn_marksTheGroupAsFinished() {
        group.setTourActuel(1); // 2 members: cycles 0 and 1, so cycle 1 is the last one
        groupExists();
        callerIsOrganizer();
        groupHasTwoMembers();
        when(paymentRepository.findByGroupAndCycle(group, 1)).thenReturn(List.of(
                aPayment(group, organizer, 1, PaymentStatus.VALIDATED),
                aPayment(group, member, 1, PaymentStatus.VALIDATED)));
        when(payoutRepository.findByGroupAndCycle(group, 1))
                .thenReturn(Optional.of(aPayout(PayoutStatus.VERSE)));
        when(groupRepository.save(group)).thenAnswer(returnsFirstArg());

        DaretGroup result = service.closeTurn(group.getId(), organizer);

        assertThat(result.getStatut()).isEqualTo(DaretGroup.DaretStatus.TERMINEE);
        verify(paymentRepository, never()).save(any(Payment.class)); // nothing to generate
    }

    // ======================= validatePayment =======================

    @Test
    void validatePayment_whenPaid_becomesValidated() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PAID);
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));
        callerIsOrganizer();
        when(paymentRepository.save(any(Payment.class))).thenAnswer(returnsFirstArg());

        Payment result = service.validatePayment(group.getId(), payment.getId(), organizer);

        assertThat(result.getStatus()).isEqualTo(PaymentStatus.VALIDATED);
    }

    @Test
    void validatePayment_whenStillPending_throws() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PENDING);
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));
        callerIsOrganizer();

        assertThatThrownBy(() -> service.validatePayment(group.getId(), payment.getId(), organizer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("declared as paid");
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void validatePayment_whenPaymentBelongsToAnotherGroup_looksLikeNotFound() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PAID);
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));

        UUID otherGroupId = UUID.randomUUID();

        assertThatThrownBy(() -> service.validatePayment(otherGroupId, payment.getId(), organizer))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void validatePayment_whenCallerIsAPlainMember_throwsAccessDenied() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PAID);
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));
        callerIsPlainMember();

        assertThatThrownBy(() -> service.validatePayment(group.getId(), payment.getId(), member))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ======================= declarePayment (manual) =======================

    @Test
    void declarePayment_whenManualDeclarationIsDisabled_throws() {
        PaymentService strictService = new PaymentService(paymentRepository, groupRepository,
                membershipRepository, payoutRepository, false);

        assertThatThrownBy(() -> strictService.declarePayment(group.getId(), member, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("disabled");
    }

    @Test
    void declarePayment_whenPending_becomesPaid() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PENDING);
        groupExists();
        callerIsPlainMember();
        when(paymentRepository.findByGroupAndMemberAndCycle(group, member, 0))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(returnsFirstArg());

        Payment result = service.declarePayment(group.getId(), member, "http://proof");

        assertThat(result.getStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void declarePayment_whenAlreadyPaid_throws() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PAID);
        groupExists();
        callerIsPlainMember();
        when(paymentRepository.findByGroupAndMemberAndCycle(group, member, 0))
                .thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> service.declarePayment(group.getId(), member, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already");
    }

    // ======================= Stripe webhook =======================

    @Test
    void confirmStripePayment_whenAmountAndCurrencyMatch_validatesThePayment() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PENDING);
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));

        // 100.00 MAD = 10000 centimes. Uppercase currency must be accepted too.
        service.confirmStripePayment(payment.getId(), "cs_123", "pi_123", 10000L, "MAD");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.VALIDATED);
        assertThat(payment.getStripeSessionId()).isEqualTo("cs_123");
        verify(paymentRepository).save(payment);
    }

    @Test
    void confirmStripePayment_whenAmountDiffers_doesNotValidate() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PENDING);
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));

        service.confirmStripePayment(payment.getId(), "cs_123", "pi_123", 5000L, "mad");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void confirmStripePayment_whenCurrencyDiffers_doesNotValidate() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.PENDING);
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));

        service.confirmStripePayment(payment.getId(), "cs_123", "pi_123", 10000L, "eur");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void confirmStripePayment_whenAlreadyValidated_isIdempotent() {
        Payment payment = aPayment(group, member, 0, PaymentStatus.VALIDATED);
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));

        // Stripe can deliver the same event twice
        service.confirmStripePayment(payment.getId(), "cs_123", "pi_123", 10000L, "mad");

        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void confirmStripePayment_whenPaymentIsUnknown_doesNothing() {
        UUID unknownId = UUID.randomUUID();
        when(paymentRepository.findById(unknownId)).thenReturn(Optional.empty());

        service.confirmStripePayment(unknownId, "cs_123", "pi_123", 10000L, "mad");

        verify(paymentRepository, never()).save(any(Payment.class));
    }

    // ======================= toMinorUnits (pure function) =======================

    @ParameterizedTest
    @CsvSource({
            "100.00, 10000",
            "12.5,   1250",
            "0.335,  34",   // rounds half up
            "0,      0"
    })
    void toMinorUnits_convertsMadToCentimes(String amount, long expected) {
        assertThat(PaymentService.toMinorUnits(new BigDecimal(amount))).isEqualTo(expected);
    }
}