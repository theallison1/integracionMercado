package com.mercadopago.sample.controller;

import com.mercadopago.sample.service.RefundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/refunds")
public class RefundController {
    
    @Autowired
    private RefundService refundService;
    
    /**
     * ✅ DEVOLUCIÓN TOTAL
     */
    @PostMapping("/total/{paymentId}")
    public Map<String, Object> processTotalRefund(
            @PathVariable Long paymentId,
            @RequestParam String reason) {
        
        return refundService.processTotalRefund(paymentId, reason);
    }
    
    /**
     * ✅ DEVOLUCIÓN PARCIAL
     */
    @PostMapping("/partial/{paymentId}")
    public Map<String, Object> processPartialRefund(
            @PathVariable Long paymentId,
            @RequestParam BigDecimal amount,
            @RequestParam String reason) {
        
        return refundService.processPartialRefund(paymentId, amount, reason);
    }
    
    /**
     * ✅ INFORMACIÓN DE DEVOLUCIONES
     */
    @GetMapping("/info/{paymentId}")
    public Map<String, Object> getRefundInfo(@PathVariable Long paymentId) {
        return refundService.getRefundInfo(paymentId);
    }
}
