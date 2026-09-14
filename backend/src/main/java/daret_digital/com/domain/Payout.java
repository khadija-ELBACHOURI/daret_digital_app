package daret_digital.com.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payouts", uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "cycle"}))
public class Payout {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private DaretGroup group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "beneficiary_id", nullable = false)
    private User beneficiary;

    @Column(nullable = false)
    private Integer cycle;

    // The full pot for this cycle (montant x nombreMembres), not a per-member share.
    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus status = PayoutStatus.EN_ATTENTE;

    private Instant paidAt;

    protected Payout() {
    }

    public Payout(DaretGroup group, User beneficiary, Integer cycle, BigDecimal amount) {
        this.group = group;
        this.beneficiary = beneficiary;
        this.cycle = cycle;
        this.amount = amount;
    }

    public UUID getId() {
        return id;
    }

    public DaretGroup getGroup() {
        return group;
    }

    public User getBeneficiary() {
        return beneficiary;
    }

    public Integer getCycle() {
        return cycle;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PayoutStatus getStatus() {
        return status;
    }

    public void setStatus(PayoutStatus status) {
        this.status = status;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }
}