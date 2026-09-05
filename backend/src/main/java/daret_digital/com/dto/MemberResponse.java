package daret_digital.com.dto;

import daret_digital.com.domain.GroupMembership;
import daret_digital.com.domain.GroupRole;

import java.util.UUID;

public record MemberResponse(
        UUID userId,
        String firstname,
        String lastname,
        String email,
        GroupRole role,
        Integer position
) {
    public static MemberResponse from(GroupMembership m) {
        return new MemberResponse(
                m.getUser().getId(),
                m.getUser().getFirstname(),
                m.getUser().getLastname(),
                m.getUser().getEmail(),
                m.getRole(),
                m.getPosition()
        );
    }
}