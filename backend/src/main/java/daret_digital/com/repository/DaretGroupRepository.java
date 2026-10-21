package daret_digital.com.repository;

import daret_digital.com.domain.DaretGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DaretGroupRepository extends JpaRepository<DaretGroup, UUID> {
    List<DaretGroup> findByStatut(DaretGroup.DaretStatus statut);

    Optional<DaretGroup> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
}
