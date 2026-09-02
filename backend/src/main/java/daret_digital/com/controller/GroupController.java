package daret_digital.com.controller;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Frequence;
import daret_digital.com.domain.GroupMembership;
import daret_digital.com.domain.GroupRole;
import daret_digital.com.domain.User;
import daret_digital.com.repository.DaretGroupRepository;
import daret_digital.com.repository.GroupMembershipRepository;
import daret_digital.com.repository.UtilisateurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final DaretGroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UtilisateurRepository userRepository;

    public GroupController(DaretGroupRepository groupRepository,
                           GroupMembershipRepository membershipRepository,
                           UtilisateurRepository userRepository) {
        this.groupRepository = groupRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody CreateGroupRequest request,
                                         Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));

        DaretGroup group = new DaretGroup();
        group.setName(request.nom());
        group.setMontant(request.montant());
        group.setFrequence(Frequence.valueOf(request.frequence().toUpperCase()));
        group.setNombreMembres(request.nombreMembres());
        group.setDateDebut(request.dateDebut());
        group.setDescription(request.description());
        groupRepository.save(group);

        GroupMembership membership = new GroupMembership();
        membership.setUser(user);
        membership.setGroup(group);
        membership.setRole(GroupRole.ORGANISATEUR);
        membershipRepository.save(membership);

        return ResponseEntity.ok(group);
    }

    @GetMapping("/{groupId}")
    @PreAuthorize("@groupSecurity.isMember(#groupId, authentication.name)")
    public ResponseEntity<?> getGroup(@PathVariable UUID groupId) {
        DaretGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Groupe introuvable"));
        return ResponseEntity.ok(group);
    }

    @PostMapping("/{groupId}/members")
    @PreAuthorize("@groupSecurity.hasRole(#groupId, authentication.name, 'ORGANISATEUR')")
    public ResponseEntity<?> addMember(@PathVariable UUID groupId,
                                       @RequestBody AddMemberRequest request) {
        DaretGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Groupe introuvable"));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Aucun utilisateur avec cet email"));

        if (membershipRepository.findByGroupIdAndUserEmail(groupId, request.email()).isPresent()) {
            return ResponseEntity.badRequest().body("Cet utilisateur est deja membre du groupe");
        }

        GroupMembership membership = new GroupMembership();
        membership.setUser(user);
        membership.setGroup(group);
        membership.setRole(GroupRole.MEMBRE);
        membershipRepository.save(membership);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/{groupId}/members")
    @PreAuthorize("@groupSecurity.isMember(#groupId, authentication.name)")
    public ResponseEntity<?> listMembers(@PathVariable UUID groupId) {
        List<GroupMembership> members = membershipRepository.findByGroupId(groupId);
        return ResponseEntity.ok(members);
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("@groupSecurity.hasRole(#groupId, authentication.name, 'ORGANISATEUR')")
    public ResponseEntity<?> removeMember(@PathVariable UUID groupId, @PathVariable UUID userId) {
        List<GroupMembership> members = membershipRepository.findByGroupId(groupId);
        members.stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .findFirst()
                .ifPresent(membershipRepository::delete);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mine")
    public ResponseEntity<?> myGroups(Authentication authentication) {
        List<GroupMembership> memberships = membershipRepository.findByUserEmail(authentication.getName());
        return ResponseEntity.ok(memberships);
    }
}

record CreateGroupRequest(
        String nom,
        BigDecimal montant,
        String frequence,
        Integer nombreMembres,
        LocalDate dateDebut,
        String description
) {}

record AddMemberRequest(String email) {}