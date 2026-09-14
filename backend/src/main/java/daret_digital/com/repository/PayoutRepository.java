package daret_digital.com.repository;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Payout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayoutRepository extends JpaRepository<Payout, UUID> {
    Optional<Payout> findByGroupAndCycle(DaretGroup group, Integer cycle);

    List<Payout> findByGroupOrderByCycleAsc(DaretGroup group);
}