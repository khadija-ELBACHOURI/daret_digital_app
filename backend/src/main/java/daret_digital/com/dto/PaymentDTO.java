package daret_digital.com.dto;

import daret_digital.com.domain.Payment;
import daret_digital.com.domain.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PaiementDTO {

    public static class Response {
        public Long id;
        public Long groupeId;
        public Long membreId;
        public String membreNom;
        public int cycle;
        public BigDecimal montant;
        public StatutPaiement statut;
        public LocalDate datePaiement;

        public static Response fromEntity(Payment p) {
            Response r = new Response();
            r.id = p.getId();
            r.groupeId = p.getGroupe().getId();
            r.membreId = p.getMembre().getId();
            r.membreNom = p.getMembre().getFirstname();
            r.cycle = p.getCycle();
            r.montant = p.getMontant();
            r.statut = p.getStatut();
            r.datePaiement = p.getDatePaiement();
            return r;
        }
    }

    public static class DeclarationRequest {
        public String preuveUrl; 
    }
}
