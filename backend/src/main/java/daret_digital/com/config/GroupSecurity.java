package daret_digital.com.config;

import daret_digital.com.domain.GroupRole;
import daret_digital.com.repository.GroupMembershipRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("groupSecurity")
public class GroupSecurity {

    private final GroupMembershipRepository membershipRepository;

    public GroupSecurity(GroupMembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    public boolean hasRole(UUID groupId, String userEmail, String requiredRole) {
        return membershipRepository.findByGroupIdAndUserEmail(groupId, userEmail)
                .map(m -> m.getRole() == GroupRole.valueOf(requiredRole))
                .orElse(false);
    }

    public boolean isMember(UUID groupId, String userEmail) {
        return membershipRepository.findByGroupIdAndUserEmail(groupId, userEmail).isPresent();
    }
}