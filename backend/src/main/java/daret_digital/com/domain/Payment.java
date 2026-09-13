package daret_digital.com.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "payment",
        uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "member_id", "cycle"})
        // one payment per member per cycle in a given group
)
@Data
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private DaretGroup group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "member_id")
    private User member;

    @Column(nullable = false)
    private Integer cycle; // set to group.getTourActuel() at generation time

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    private LocalDate paidAt;
    private Instant validatedAt;

    private String proofUrl;

    public Payment() {
    }

    public Payment(DaretGroup group, User member, Integer cycle, BigDecimal amount) {
        this.group = group;
        this.member = member;
        this.cycle = cycle;
        this.amount = amount;
        this.status = PaymentStatus.PENDING;
    }
}