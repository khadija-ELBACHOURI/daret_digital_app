package daret_digital.com.dto;

import daret_digital.com.domain.Payment;
import daret_digital.com.domain.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class PaymentDTO {

    public static class Response {
        public UUID id;
        public UUID groupId;
        public UUID memberId;
        public String memberName;
        public int cycle;
        public BigDecimal amount;
        public PaymentStatus status;
        public LocalDate paidAt;

        public static Response fromEntity(Payment p) {
            Response r = new Response();
            r.id = p.getId();
            r.groupId = p.getGroup().getId();
            r.memberId = p.getMember().getId();
            r.memberName = p.getMember().getFirstname() + " " + p.getMember().getLastname();
            r.cycle = p.getCycle();
            r.amount = p.getAmount();
            r.status = p.getStatus();
            r.paidAt = p.getPaidAt();
            return r;
        }
    }

    // request sent by the member declaring they paid
    public static class DeclarationRequest {
        public String proofUrl; // optional
    }
}