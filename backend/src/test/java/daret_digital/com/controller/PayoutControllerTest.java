package daret_digital.com.controller;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Payout;
import daret_digital.com.domain.User;
import daret_digital.com.repository.UtilisateurRepository;
import daret_digital.com.service.PayoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static daret_digital.com.TestData.aGroup;
import static daret_digital.com.TestData.aUser;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayoutControllerTest {

    @Mock PayoutService payoutService;
    @Mock UtilisateurRepository userRepository;
    @Mock Authentication authentication;

    @InjectMocks PayoutController controller;

    User member;
    DaretGroup group;
    UUID groupId;
    Payout payout;

    @BeforeEach
    void setUp() {
        member = aUser("member@test.com");
        group = aGroup(2, "100.00", DaretGroup.DaretStatus.ACTIVE);
        groupId = group.getId();

        payout = new Payout(group, member, 0, new BigDecimal("200.00"));
        // the database would generate this id
        ReflectionTestUtils.setField(payout, "id", UUID.randomUUID());
    }

    private void callerIsMember() {
        when(authentication.getName()).thenReturn("member@test.com");
        when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(member));
    }

    @Test
    void getCurrentPayout_asksTheServiceForTheCurrentUser() {
        callerIsMember();
        when(payoutService.getOrCreateCurrentPayout(groupId, member)).thenReturn(payout);

        assertThat(controller.getCurrentPayout(groupId, authentication)).isNotNull();

        verify(payoutService).getOrCreateCurrentPayout(groupId, member);
    }

    @Test
    void confirmCurrentPayout_asksTheServiceForTheCurrentUser() {
        callerIsMember();
        when(payoutService.confirmPayout(groupId, member)).thenReturn(payout);

        assertThat(controller.confirmCurrentPayout(groupId, authentication)).isNotNull();

        verify(payoutService).confirmPayout(groupId, member);
    }

    @Test
    void getHistory_returnsOneEntryPerPayout() {
        callerIsMember();
        when(payoutService.getPayoutHistory(groupId, member)).thenReturn(List.of(payout, payout));

        assertThat(controller.getHistory(groupId, authentication)).hasSize(2);
    }

    @Test
    void whenTheUserNoLongerExists_nothingIsCalled() {
        when(authentication.getName()).thenReturn("ghost@test.com");
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getCurrentPayout(groupId, authentication))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(payoutService);
    }
}