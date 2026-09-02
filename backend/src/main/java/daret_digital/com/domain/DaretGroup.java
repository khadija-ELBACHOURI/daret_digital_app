package daret_digital.com.domain;

import jakarta.persistence.Id;

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
}