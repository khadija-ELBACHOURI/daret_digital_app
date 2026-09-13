package daret_digital.com.repository;


import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.Payment;
import daret_digital.com.domain.StatutPaiement;
import daret_digital.com.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByGroupeAndCycle(DaretGroup groupe, int cycle);

    Optional<Payment> findByGroupeAndMembreAndCycle(DaretGroup groupe, User membre, int cycle);

    List<Payment> findByMembreOrderByCycleDesc(User membre);

    boolean existsByGroupeAndCycleAndStatutNot(DaretGroup groupe, int cycle, StatutPaiement statut);
}