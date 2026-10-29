package daret_digital.com.controller;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Payment;
import daret_digital.com.domain.PaymentStatus;
import daret_digital.com.domain.User;
import daret_digital.com.repository.UtilisateurRepository;
import daret_digital.com.service.PaymentService;
import daret_digital.com.service.StripeCheckoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

import static daret_digital.com.TestData.aGroup;
import static daret_digital.com.TestData.aPayment;
import static daret_digital.com.TestData.aUser;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * PaymentController is thin: it finds the current user, calls a service, maps the result.
 * So these tests are few and simple. The business rules are tested in PaymentServiceTest.
 */
@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock PaymentService paymentService;
    @Mock StripeCheckoutService stripeCheckoutService;
    @Mock UtilisateurRepository userRepository;
    @Mock Authentication authentication;

    @InjectMocks PaymentController controller;

    User member;
    DaretGroup group;
    UUID groupId;

    @BeforeEach
    void setUp() {
        member = aUser("member@test.com");
        group = aGroup(2, "100.00", DaretGroup.DaretStatus.ACTIVE);
        groupId = group.getId();
    }

    private void callerIsMember() {
        when(authentication.getName()).thenReturn("member@test.com");
        when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(member));
    }

    @Test
    void startCheckout_returnsTheStripeUrl() {
        callerIsMember();
        when(stripeCheckoutService.startCheckout(groupId, member))
                .thenReturn("https://checkout.stripe.com/c/pay/cs_test_1");

        PaymentController.CheckoutResponse response = controller.startCheckout(groupId, authentication);

        assertThat(response.url()).isEqualTo("https://checkout.stripe.com/c/pay/cs_test_1");
    }

    @Test
    void startCheckout_whenTheUserNoLongerExists_throws() {
        when(authentication.getName()).thenReturn("ghost@test.com");
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.startCheckout(groupId, authentication))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(stripeCheckoutService);
    }

    @Test
    void declareMyPayment_withoutABody_passesANullProofToTheService() {
        callerIsMember();
        Payment paid = aPayment(group, member, 0, PaymentStatus.PAID);
        when(paymentService.declarePayment(groupId, member, null)).thenReturn(paid);

        controller.declareMyPayment(groupId, authentication, null);

        verify(paymentService).declarePayment(groupId, member, null);
    }

    @Test
    void closeTurn_returnsTheNewTurnState() {
        callerIsMember();
        group.setTourActuel(1);
        when(paymentService.closeTurn(groupId, member)).thenReturn(group);

        PaymentController.GroupStateResponse response = controller.closeTurn(groupId, authentication);

        assertThat(response.id()).isEqualTo(groupId);
        assertThat(response.tourActuel()).isEqualTo(1);
        assertThat(response.statut()).isEqualTo("ACTIVE");
    }
}