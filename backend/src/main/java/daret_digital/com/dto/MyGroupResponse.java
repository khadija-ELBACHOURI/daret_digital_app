package daret_digital.com.dto;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.domain.GroupRole;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MyGroupResponse(
        UUID id,
        String nom,
        BigDecimal montant,
        String frequence,
        Integer nombreMembres,
        LocalDate dateDebut,
        DaretGroup.DaretStatus statut,
        Integer tourActuel,
        Integer position,
        GroupRole role
) {}