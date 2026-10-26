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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final DaretGroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UtilisateurRepository userRepository;
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private String generateInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("DARET-");
            for (int i = 0; i < 5; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (groupRepository.existsByInviteCode(code));
        return code;
    }
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
        group.setInviteCode(generateInviteCode());
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

    @PutMapping("/{groupId}")
    @PreAuthorize("@groupSecurity.hasRole(#groupId, authentication.name, 'ORGANISATEUR')")
    public ResponseEntity<?> updateGroup(@PathVariable UUID groupId,
                                         @RequestBody UpdateGroupRequest request) {
        DaretGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Groupe introuvable"));

        if (request.nom() == null || request.nom().isBlank()) {
            return ResponseEntity.badRequest().body("Le nom est obligatoire");
        }

        Frequence newFrequence;
        try {
            newFrequence = Frequence.valueOf(request.frequence().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Fréquence invalide");
        }

        if (request.montant() == null || request.montant().signum() <= 0) {
            return ResponseEntity.badRequest().body("Le montant doit être positif");
        }
        if (request.nombreMembres() == null || request.nombreMembres() < 2) {
            return ResponseEntity.badRequest().body("Il faut au moins 2 membres");
        }

        boolean structureChanged =
                group.getMontant().compareTo(request.montant()) != 0
                        || group.getFrequence() != newFrequence
                        || !group.getNombreMembres().equals(request.nombreMembres())
                        || (group.getDateDebut() == null
                        ? request.dateDebut() != null
                        : !group.getDateDebut().equals(request.dateDebut()));

        if (structureChanged && group.getStatut() != DaretGroup.DaretStatus.EN_ATTENTE) {
            return ResponseEntity.badRequest()
                    .body("Montant, fréquence, nombre de membres et date de début ne sont modifiables que tant que la daret est en attente");
        }

        List<GroupMembership> memberships = membershipRepository.findByGroupId(groupId);
        int maxPosition = memberships.stream()
                .map(GroupMembership::getPosition)
                .filter(p -> p != null)
                .max(Integer::compareTo)
                .orElse(0);

        if (request.nombreMembres() < memberships.size() || request.nombreMembres() < maxPosition) {
            return ResponseEntity.badRequest()
                    .body("Le nombre de places ne peut pas être inférieur au nombre de membres ou aux positions déjà attribuées");
        }

        group.setNom(request.nom().trim());
        group.setMontant(request.montant());
        group.setFrequence(newFrequence);
        group.setNombreMembres(request.nombreMembres());
        group.setDateDebut(request.dateDebut());
        group.setDescription(request.description());
        groupRepository.save(group);

        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @DeleteMapping("/{groupId}")
    @PreAuthorize("@groupSecurity.hasRole(#groupId, authentication.name, 'ORGANISATEUR')")
    @Transactional
    public ResponseEntity<?> deleteGroup(@PathVariable UUID groupId) {
        DaretGroup group = groupRepository.findById(groupId).orElse(null);
        if (group == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Groupe introuvable");
        }
        if (group.getStatut() != DaretGroup.DaretStatus.EN_ATTENTE) {
            return ResponseEntity.badRequest()
                    .body("Seule une daret en attente peut être supprimée");
        }

        membershipRepository.deleteAll(membershipRepository.findByGroupId(groupId));
        groupRepository.delete(group);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invite/{code}")
    public ResponseEntity<?> previewInvite(@PathVariable String code) {
        DaretGroup group = groupRepository.findByInviteCode(code.trim().toUpperCase()).orElse(null);
        if (group == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Aucune daret trouvée pour ce code");
        }
        int current = membershipRepository.findByGroupId(group.getId()).size();
        return ResponseEntity.ok(new InvitePreviewResponse(
                group.getId(),
                group.getNom(),
                group.getMontant(),
                group.getFrequence() != null ? group.getFrequence().name() : null,
                group.getNombreMembres(),
                current,
                group.getStatut()
        ));
    }

    @PostMapping("/invite/{code}/join")
    public ResponseEntity<?> joinByInvite(@PathVariable String code, Authentication authentication) {
        DaretGroup group = groupRepository.findByInviteCode(code.trim().toUpperCase()).orElse(null);
        if (group == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Aucune daret trouvée pour ce code");
        }
        if (group.getStatut() != DaretGroup.DaretStatus.EN_ATTENTE) {
            return ResponseEntity.badRequest().body("Cette daret n'accepte plus de nouveaux membres");
        }

        String email = authentication.getName();
        if (membershipRepository.findByGroupIdAndUserEmail(group.getId(), email).isPresent()) {
            return ResponseEntity.badRequest().body("Vous êtes déjà membre de cette daret");
        }
        if (membershipRepository.findByGroupId(group.getId()).size() >= group.getNombreMembres()) {
            return ResponseEntity.badRequest().body("Cette daret est complète");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));

        GroupMembership membership = new GroupMembership();
        membership.setUser(user);
        membership.setGroup(group);
        membership.setRole(GroupRole.MEMBRE);
        membershipRepository.save(membership);

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

    // Phone and IBAN are private: only the organizer of this group can read them,
    // and they are deliberately NOT part of the member list that every member can fetch.
    @GetMapping("/{groupId}/members/{userId}/contact")
    @PreAuthorize("@groupSecurity.hasRole(#groupId, authentication.name, 'ORGANISATEUR')")
    public ResponseEntity<?> memberContact(@PathVariable UUID groupId, @PathVariable UUID userId) {
        GroupMembership target = membershipRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .findFirst()
                .orElse(null);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Membre introuvable dans ce groupe");
        }

        User user = target.getUser();
        return ResponseEntity.ok(new MemberContactResponse(user.getPhone(), user.getIban()));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("@groupSecurity.hasRole(#groupId, authentication.name, 'ORGANISATEUR')")
    public ResponseEntity<?> removeMember(@PathVariable UUID groupId, @PathVariable UUID userId) {
        DaretGroup group = groupRepository.findById(groupId).orElse(null);
        if (group == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Groupe introuvable");
        }
        if (group.getStatut() != DaretGroup.DaretStatus.EN_ATTENTE) {
            return ResponseEntity.badRequest()
                    .body("Les membres ne peuvent être retirés que tant que la daret est en attente");
        }

        GroupMembership target = membershipRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .findFirst()
                .orElse(null);
        if (target == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Membre introuvable dans ce groupe");
        }
        if (target.getRole() == GroupRole.ORGANISATEUR) {
            return ResponseEntity.badRequest().body("L'organisateur ne peut pas être retiré");
        }

        membershipRepository.delete(target);
        return ResponseEntity.noContent().build();
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

record UpdateGroupRequest(
        String nom,
        BigDecimal montant,
        String frequence,
        Integer nombreMembres,
        LocalDate dateDebut,
        String description
) {}

record AddMemberRequest(String email) {}
record AssignPositionRequest(Integer position) {}
record MemberContactResponse(String phone, String iban) {}


record InvitePreviewResponse(
        UUID id,
        String nom,
        BigDecimal montant,
        String frequence,
        Integer nombreMembres,
        Integer membresActuels,
        DaretGroup.DaretStatus statut
) {}

record GroupResponse(
        UUID id,
        String nom,
        BigDecimal montant,
        String frequence,
        Integer nombreMembres,
        LocalDate dateDebut,
        String description,
        DaretGroup.DaretStatus statut,
        Integer tourActuel,
        String inviteCode
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
                g.getTourActuel(),
                g.getInviteCode()
        );
    }
}