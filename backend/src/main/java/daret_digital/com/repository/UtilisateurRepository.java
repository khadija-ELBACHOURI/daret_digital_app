package daret_digital.com.repository;

import daret_digital.com.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UtilisateurRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
}
