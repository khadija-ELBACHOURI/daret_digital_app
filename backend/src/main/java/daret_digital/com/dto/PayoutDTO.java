package daret_digital.com.dto;

import daret_digital.com.domain.Payout;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class PayoutDTO {

    public record Response(
            UUID id,
            UUID groupId,
            UUID beneficiaryId,
            String beneficiaryName,
            Integer cycle,
            BigDecimal amount,
            String status,
            Instant paidAt
    ) {
        public static Response fromEntity(Payout payout) {
            return new Response(
                    payout.getId(),
                    payout.getGroup().getId(),
                    payout.getBeneficiary().getId(),
                    payout.getBeneficiary().getFirstname() + " " + payout.getBeneficiary().getLastname(),
                    payout.getCycle(),
                    payout.getAmount(),
                    payout.getStatus().name(),
                    payout.getPaidAt()
            );
        }
    }
}