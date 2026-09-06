package daret_digital.com.controller;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Frequence;
import daret_digital.com.domain.GroupMembership;
import daret_digital.com.domain.GroupRole;
import daret_digital.com.domain.User;
import daret_digital.com.dto.MemberResponse;
import daret_digital.com.dto.MyGroupResponse;
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
        group.setNom(request.nom());
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

        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @GetMapping("/{groupId}")
    @PreAuthorize("@groupSecurity.isMember(#groupId, authentication.name)")
    public ResponseEntity<?> getGroup(@PathVariable UUID groupId) {
        DaretGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Groupe introuvable"));
        return ResponseEntity.ok(GroupResponse.from(group));
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

        return ResponseEntity.ok(MemberResponse.from(membership));
    }

    @GetMapping("/{groupId}/members")
    @PreAuthorize("@groupSecurity.isMember(#groupId, authentication.name)")
    public ResponseEntity<?> listMembers(@PathVariable UUID groupId) {
        List<GroupMembership> members = membershipRepository.findByGroupId(groupId);

        List<MemberResponse> response = members.stream()
                .map(m -> new MemberResponse(
                        m.getUser().getId(),
                        m.getUser().getFirstname(),
                        m.getUser().getLastname(),
                        m.getUser().getEmail(),
                        m.getRole(),
                        m.getPosition()
                ))
                .toList();

        return ResponseEntity.ok(response);
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

        List<MyGroupResponse> response = memberships.stream()
                .map(m -> new MyGroupResponse(
                        m.getGroup().getId(),
                        m.getGroup().getNom(),
                        m.getGroup().getMontant(),
                        m.getGroup().getFrequence().name(),
                        m.getGroup().getNombreMembres(),
                        m.getGroup().getDateDebut(),
                        m.getGroup().getStatut(),
                        m.getGroup().getTourActuel(),
                        m.getPosition(),
                        m.getRole()
                ))
                .toList();

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{groupId}/members/{userId}/position")
    @PreAuthorize("@groupSecurity.hasRole(#groupId, authentication.name, 'ORGANISATEUR')")
    public ResponseEntity<?> assignPosition(@PathVariable UUID groupId,
                                            @PathVariable UUID userId,
                                            @RequestBody AssignPositionRequest request) {
        GroupMembership membership = membershipRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Membre introuvable dans ce groupe"));

        membership.setPosition(request.position());
        membershipRepository.save(membership);

        return ResponseEntity.ok(MemberResponse.from(membership));
    }

    @PatchMapping("/{groupId}/status")
    @PreAuthorize("@groupSecurity.hasRole(#groupId, authentication.name, 'ORGANISATEUR')")
    public ResponseEntity<?> updateStatus(@PathVariable UUID groupId,
                                          @RequestBody UpdateStatusRequest request) {
        DaretGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Groupe introuvable"));

        group.setStatut(DaretGroup.DaretStatus.valueOf(request.statut().toUpperCase()));
        groupRepository.save(group);

        return ResponseEntity.ok(GroupResponse.from(group));
    }

    record UpdateStatusRequest(String statut) {}
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
record AssignPositionRequest(Integer position) {}


record GroupResponse(
        UUID id,
        String nom,
        BigDecimal montant,
        String frequence,
        Integer nombreMembres,
        LocalDate dateDebut,
        String description,
        DaretGroup.DaretStatus statut,
        Integer tourActuel
) {
    static GroupResponse from(DaretGroup g) {
        return new GroupResponse(
                g.getId(),
                g.getNom(),
                g.getMontant(),
                g.getFrequence() != null ? g.getFrequence().name() : null,
                g.getNombreMembres(),
                g.getDateDebut(),
                g.getDescription(),
                g.getStatut(),
                g.getTourActuel()
        );
    }
}

