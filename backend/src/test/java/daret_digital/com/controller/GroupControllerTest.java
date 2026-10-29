package daret_digital.com.controller;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Frequence;
import daret_digital.com.domain.GroupMembership;
import daret_digital.com.domain.GroupRole;
import daret_digital.com.domain.User;
import daret_digital.com.repository.DaretGroupRepository;
import daret_digital.com.repository.GroupMembershipRepository;
import daret_digital.com.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static daret_digital.com.TestData.aGroup;
import static daret_digital.com.TestData.aMembership;
import static daret_digital.com.TestData.aUser;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Direct method calls: the @PreAuthorize rules are NOT applied here, because there is no
 * Spring proxy. This class tests the business rules inside each endpoint. The security
 * rules (who may call what) need a MockMvc test, which is a separate step.
 */
@ExtendWith(MockitoExtension.class)
class GroupControllerTest {

    @Mock DaretGroupRepository groupRepository;
    @Mock GroupMembershipRepository membershipRepository;
    @Mock UtilisateurRepository userRepository;
    @Mock Authentication authentication;

    @InjectMocks GroupController controller;

    User organizer;
    User member;
    DaretGroup group;
    GroupMembership organizerMembership;
    GroupMembership memberMembership;

    @BeforeEach
    void setUp() {
        organizer = aUser("organizer@test.com");
        member = aUser("member@test.com");
        group = aGroup(3, "100.00", DaretGroup.DaretStatus.EN_ATTENTE);
        organizerMembership = aMembership(group, organizer, GroupRole.ORGANISATEUR, null);
        memberMembership = aMembership(group, member, GroupRole.MEMBRE, null);
    }

    // ======================= createGroup =======================

    @Test
    void createGroup_makesTheCreatorTheOrganizerAndGeneratesAnInviteCode() {
        when(authentication.getName()).thenReturn("organizer@test.com");
        when(userRepository.findByEmail("organizer@test.com")).thenReturn(Optional.of(organizer));

        CreateGroupRequest request = new CreateGroupRequest(
                "Famille", new BigDecimal("500"), Frequence.values()[0].name(),
                5, LocalDate.of(2026, 11, 1), "desc");

        controller.createGroup(request, authentication);

        ArgumentCaptor<DaretGroup> savedGroup = ArgumentCaptor.forClass(DaretGroup.class);
        verify(groupRepository).save(savedGroup.capture());
        assertThat(savedGroup.getValue().getInviteCode()).startsWith("DARET-").hasSize(11);

        ArgumentCaptor<GroupMembership> savedMembership = ArgumentCaptor.forClass(GroupMembership.class);
        verify(membershipRepository).save(savedMembership.capture());
        assertThat(savedMembership.getValue().getRole()).isEqualTo(GroupRole.ORGANISATEUR);
        assertThat(savedMembership.getValue().getUser()).isSameAs(organizer);
    }

    // ======================= deleteGroup =======================

    @Test
    void deleteGroup_whenGroupDoesNotExist_returnsNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(groupRepository.findById(unknownId)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.deleteGroup(unknownId);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void deleteGroup_whenGroupIsActive_isRefused() {
        group.setStatut(DaretGroup.DaretStatus.ACTIVE);
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        ResponseEntity<?> response = controller.deleteGroup(group.getId());

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verify(groupRepository, never()).delete(any(DaretGroup.class));
    }

    @Test
    void deleteGroup_whenWaiting_deletesMembershipsThenTheGroup() {
        List<GroupMembership> memberships = List.of(organizerMembership, memberMembership);
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupId(group.getId())).thenReturn(memberships);

        ResponseEntity<?> response = controller.deleteGroup(group.getId());

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(membershipRepository).deleteAll(memberships);
        verify(groupRepository).delete(group);
    }

    // ======================= removeMember =======================

    @Test
    void removeMember_whenGroupIsNoLongerWaiting_isRefused() {
        group.setStatut(DaretGroup.DaretStatus.ACTIVE);
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));

        ResponseEntity<?> response = controller.removeMember(group.getId(), member.getId());

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verify(membershipRepository, never()).delete(any(GroupMembership.class));
    }

    @Test
    void removeMember_whenTargetIsNotInTheGroup_returnsNotFound() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupId(group.getId())).thenReturn(List.of(organizerMembership));

        ResponseEntity<?> response = controller.removeMember(group.getId(), member.getId());

        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void removeMember_theOrganizerCannotBeRemoved() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupId(group.getId()))
                .thenReturn(List.of(organizerMembership, memberMembership));

        ResponseEntity<?> response = controller.removeMember(group.getId(), organizer.getId());

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verify(membershipRepository, never()).delete(any(GroupMembership.class));
    }

    @Test
    void removeMember_removesARegularMember() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(membershipRepository.findByGroupId(group.getId()))
                .thenReturn(List.of(organizerMembership, memberMembership));

        ResponseEntity<?> response = controller.removeMember(group.getId(), member.getId());

        assertThat(response.getStatusCode().value()).isEqualTo(204);
        verify(membershipRepository).delete(memberMembership);
    }

    // ======================= joinByInvite =======================

    @Test
    void joinByInvite_withAnUnknownCode_returnsNotFound() {
        when(groupRepository.findByInviteCode("DARET-XXXXX")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.joinByInvite("DARET-XXXXX", authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void joinByInvite_whenGroupAlreadyStarted_isRefused() {
        group.setStatut(DaretGroup.DaretStatus.ACTIVE);
        when(groupRepository.findByInviteCode("DARET-ABCDE")).thenReturn(Optional.of(group));

        ResponseEntity<?> response = controller.joinByInvite("DARET-ABCDE", authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void joinByInvite_whenAlreadyAMember_isRefused() {
        when(groupRepository.findByInviteCode("DARET-ABCDE")).thenReturn(Optional.of(group));
        when(authentication.getName()).thenReturn("member@test.com");
        when(membershipRepository.findByGroupIdAndUserEmail(group.getId(), "member@test.com"))
                .thenReturn(Optional.of(memberMembership));

        ResponseEntity<?> response = controller.joinByInvite("DARET-ABCDE", authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verify(membershipRepository, never()).save(any(GroupMembership.class));
    }

    @Test
    void joinByInvite_whenGroupIsFull_isRefused() {
        group.setNombreMembres(2);
        when(groupRepository.findByInviteCode("DARET-ABCDE")).thenReturn(Optional.of(group));
        when(authentication.getName()).thenReturn("newcomer@test.com");
        when(membershipRepository.findByGroupIdAndUserEmail(group.getId(), "newcomer@test.com"))
                .thenReturn(Optional.empty());
        when(membershipRepository.findByGroupId(group.getId()))
                .thenReturn(List.of(organizerMembership, memberMembership)); // 2 of 2 places taken

        ResponseEntity<?> response = controller.joinByInvite("DARET-ABCDE", authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        verify(membershipRepository, never()).save(any(GroupMembership.class));
    }

    @Test
    void joinByInvite_addsTheUserAsAMember_andNormalizesTheCode() {
        User newcomer = aUser("newcomer@test.com");
        // the user typed it in lowercase with spaces: the controller must trim + uppercase it
        when(groupRepository.findByInviteCode("DARET-ABCDE")).thenReturn(Optional.of(group));
        when(authentication.getName()).thenReturn("newcomer@test.com");
        when(membershipRepository.findByGroupIdAndUserEmail(group.getId(), "newcomer@test.com"))
                .thenReturn(Optional.empty());
        when(membershipRepository.findByGroupId(group.getId())).thenReturn(List.of(organizerMembership));
        when(userRepository.findByEmail("newcomer@test.com")).thenReturn(Optional.of(newcomer));

        ResponseEntity<?> response = controller.joinByInvite("  daret-abcde ", authentication);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        ArgumentCaptor<GroupMembership> saved = ArgumentCaptor.forClass(GroupMembership.class);
        verify(membershipRepository).save(saved.capture());
        assertThat(saved.getValue().getRole()).isEqualTo(GroupRole.MEMBRE);
        assertThat(saved.getValue().getUser()).isSameAs(newcomer);
    }
}