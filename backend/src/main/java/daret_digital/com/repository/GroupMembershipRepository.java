package daret_digital.com.repository;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.GroupMembership;
import daret_digital.com.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupMembershipRepository extends JpaRepository<GroupMembership, UUID> {

    @Query("""
        SELECT gm FROM GroupMembership gm
        WHERE gm.group.id = :groupId AND gm.user.email = :email
        """)
    Optional<GroupMembership> findByGroupIdAndUserEmail(@Param("groupId") UUID groupId,
                                                        @Param("email") String email);

    List<GroupMembership> findByUserEmail(String email);

    List<GroupMembership> findByGroupId(UUID groupId);


    Optional<GroupMembership> findByGroupAndPosition(DaretGroup group, Integer position);

    Optional<GroupMembership> findByGroupAndUser(DaretGroup group, User user);
    List<GroupMembership> findByGroup(DaretGroup group);
}