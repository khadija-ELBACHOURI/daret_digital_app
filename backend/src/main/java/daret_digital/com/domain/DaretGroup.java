package daret_digital.com.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daret_groups")
@Data
public class DaretGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    private Frequence frequence; // HEBDOMADAIRE, MENSUELLE

    @Column(name = "nombre_membres")
    private Integer nombreMembres;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    private String description;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public enum DaretStatus { EN_ATTENTE, ACTIVE, TERMINEE }

    @Enumerated(EnumType.STRING)
    private DaretStatus statut = DaretStatus.EN_ATTENTE;

    private Integer tourActuel = 0;

}