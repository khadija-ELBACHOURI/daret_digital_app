package daret_digital.com.domain;

package daret_digital.com.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "group_membership",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "group_id"}))
@Data
public class GroupMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private DaretGroup group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupRole role;

    @Column(name = "joined_at")
    private Instant joinedAt = Instant.now();
}