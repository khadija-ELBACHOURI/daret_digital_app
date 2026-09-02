package daret_digital.com.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

record CreateGroupRequest(
        String nom,
        BigDecimal montant,
        String frequence,
        Integer nombreMembres,
        LocalDate dateDebut,
        String description
) {}