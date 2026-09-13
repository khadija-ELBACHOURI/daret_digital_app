package daret_digital.com.service;

import daret_digital.com.domain.DaretGroup;
import daret_digital.com.repository.DaretGroupRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentSchedulerService {

    private final DaretGroupRepository daretGroupRepository;
    private final PaymentService paymentService;

    public PaymentSchedulerService(DaretGroupRepository daretGroupRepository,
                                   PaymentService paymentService) {
        this.daretGroupRepository = daretGroupRepository;
        this.paymentService = paymentService;
    }

    // Runs on the 1st of every month at 8am: generates PENDING payments
    // for every member of every ACTIVE group, for the current cycle.
    // If you'd rather trigger this manually (organizer button) instead of
    // automatically, drop the @Scheduled annotation and call
    // paymentService.generatePaymentsForCycle(group) from a dedicated endpoint.
    @Scheduled(cron = "0 0 8 1 * *")
    public void generateMonthlyPayments() {
        List<DaretGroup> activeGroups = daretGroupRepository.findByStatut(DaretGroup.DaretStatus.ACTIVE);
        for (DaretGroup group : activeGroups) {
            paymentService.generatePaymentsForCycle(group);
        }
    }
}