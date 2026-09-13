package daret_digital.com.repository;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Payment;
import daret_digital.com.domain.PaymentStatus;
import daret_digital.com.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByGroupAndCycle(DaretGroup group, Integer cycle);

    Optional<Payment> findByGroupAndMemberAndCycle(DaretGroup group, User member, Integer cycle);

    List<Payment> findByMemberOrderByCycleDesc(User member);

    boolean existsByGroupAndCycleAndStatusNot(DaretGroup group, Integer cycle, PaymentStatus status);
}