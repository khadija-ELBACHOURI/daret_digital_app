package daret_digital.com.repository;

import daret_digital.com.domain.DaretGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DaretGroupRepository extends JpaRepository<DaretGroup, UUID> {
}
