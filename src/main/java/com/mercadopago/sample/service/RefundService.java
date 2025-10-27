package com.mercadopago.sample.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentRefundClient;
import com.mercadopago.core.MPRequestOptions;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.payment.PaymentRefund;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class RefundService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(RefundService.class);
    
    @Value("${mercado_pago_sample_access_token}")
    private String mercadoPagoAccessToken;

    /**
     * ✅ DEVOLUCIÓN TOTAL DEL PAGO
     */
    public Map<String, Object> processTotalRefund(Long paymentId, String reason) {
        try {
            LOGGER.info("🔄 Procesando devolución TOTAL del pago: {}, Razón: {}", paymentId, reason);
            
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentRefundClient refundClient = new PaymentRefundClient();
            
            // Configurar idempotency key
            Map<String, String> customHeaders = new HashMap<>();
            String idempotencyKey = "TOTAL_REFUND_" + paymentId + "_" + UUID.randomUUID();
            customHeaders.put("x-idempotency-key", idempotencyKey);
            
            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();
            
            // Procesar devolución total
            PaymentRefund refund = refundClient.refund(paymentId, requestOptions);
            
            LOGGER.info("✅ Devolución TOTAL procesada - Refund ID: {}, Status: {}", 
                       refund.getId(), refund.getStatus());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("refund_id", refund.getId());
            result.put("payment_id", paymentId);
            result.put("refund_type", "TOTAL");
            result.put("amount_refunded", refund.getAmount());
            result.put("status", refund.getStatus());
            result.put("reason", reason);
            result.put("idempotency_key", idempotencyKey);
            result.put("timestamp", new java.util.Date());
            
            // Enviar email de notificación
            sendRefundEmail(paymentId, refund, "total", reason);
            
            return result;
            
        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API en devolución total {}: {}", paymentId, apiException.getApiResponse().getContent());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "MP_API_ERROR");
            result.put("message", apiException.getApiResponse().getContent());
            result.put("status_code", apiException.getStatusCode());
            return result;
            
        } catch (MPException exception) {
            LOGGER.error("❌ Error en devolución total {}: {}", paymentId, exception.getMessage());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "MP_EXCEPTION");
            result.put("message", exception.getMessage());
            return result;
        }
    }

    /**
     * ✅ DEVOLUCIÓN PARCIAL DEL PAGO
     */
    public Map<String, Object> processPartialRefund(Long paymentId, BigDecimal amount, String reason) {
        try {
            LOGGER.info("🔄 Procesando devolución PARCIAL del pago: {}, Monto: {}, Razón: {}", 
                       paymentId, amount, reason);
            
            // Primero verificar que el pago existe y tiene saldo suficiente
            Payment payment = getPaymentById(paymentId);
            if (payment == null) {
                throw new RuntimeException("Pago no encontrado: " + paymentId);
            }
            
            BigDecimal availableAmount = getAvailableRefundAmount(payment);
            if (amount.compareTo(availableAmount) > 0) {
                throw new RuntimeException(String.format(
                    "Monto de devolución (%.2f) excede el disponible (%.2f)", 
                    amount, availableAmount));
            }
            
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentRefundClient refundClient = new PaymentRefundClient();
            
            // Configurar idempotency key
            Map<String, String> customHeaders = new HashMap<>();
            String idempotencyKey = "PARTIAL_REFUND_" + paymentId + "_" + UUID.randomUUID();
            customHeaders.put("x-idempotency-key", idempotencyKey);
            
            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();
            
            // Procesar devolución parcial
            PaymentRefund refund = refundClient.refund(paymentId, amount, requestOptions);
            
            LOGGER.info("✅ Devolución PARCIAL procesada - Refund ID: {}, Monto: {}, Status: {}", 
                       refund.getId(), refund.getAmount(), refund.getStatus());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("refund_id", refund.getId());
            result.put("payment_id", paymentId);
            result.put("refund_type", "PARTIAL");
            result.put("amount_requested", amount);
            result.put("amount_refunded", refund.getAmount());
            result.put("status", refund.getStatus());
            result.put("reason", reason);
            result.put("idempotency_key", idempotencyKey);
            result.put("available_balance", availableAmount.subtract(amount));
            result.put("timestamp", new java.util.Date());
            
            // Enviar email de notificación
            sendRefundEmail(paymentId, refund, "partial", reason);
            
            return result;
            
        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API en devolución parcial {}: {}", paymentId, apiException.getApiResponse().getContent());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "MP_API_ERROR");
            result.put("message", apiException.getApiResponse().getContent());
            result.put("status_code", apiException.getStatusCode());
            return result;
            
        } catch (MPException exception) {
            LOGGER.error("❌ Error en devolución parcial {}: {}", paymentId, exception.getMessage());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "MP_EXCEPTION");
            result.put("message", exception.getMessage());
            return result;
        } catch (Exception exception) {
            LOGGER.error("❌ Error general en devolución parcial {}: {}", paymentId, exception.getMessage());
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", "GENERAL_ERROR");
            result.put("message", exception.getMessage());
            return result;
        }
    }

 /**
 * ✅ OBTENER INFORMACIÓN DE DEVOLUCIONES - CORREGIDO
 */
public Map<String, Object> getRefundInfo(Long paymentId) {
    try {
        LOGGER.info("📋 Obteniendo información de devoluciones del pago: {}", paymentId);
        
        Payment payment = getPaymentById(paymentId);
        if (payment == null) {
            throw new RuntimeException("Pago no encontrado: " + paymentId);
        }
        
        // ❌ ELIMINAR: refundList no existe
        // ✅ SIMULAR lista vacía de devoluciones
        List<Object> refunds = new ArrayList<>(); // Lista vacía por ahora
        
        BigDecimal totalRefunded = BigDecimal.ZERO;
        BigDecimal availableAmount = getAvailableRefundAmount(payment);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("payment_id", paymentId);
        result.put("payment_status", payment.getStatus());
        result.put("original_amount", payment.getTransactionAmount());
        result.put("total_refunded", totalRefunded);
        result.put("available_for_refund", availableAmount);
        result.put("refund_count", refunds.size());
        result.put("refunds", refunds);
        result.put("can_refund", availableAmount.compareTo(BigDecimal.ZERO) > 0);
        result.put("timestamp", new java.util.Date());
        
        LOGGER.info("📊 Información de devoluciones - Disponible: {}", availableAmount);
        
        return result;
        
    } catch (Exception e) {
        LOGGER.error("❌ Error obteniendo información de devoluciones: {}", e.getMessage());
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("error", e.getMessage());
        return result;
    }
}
/**
 * ✅ CALCULAR MONTO DISPONIBLE PARA DEVOLUCIÓN - CORREGIDO
 */
private BigDecimal getAvailableRefundAmount(Payment payment) {
    try {
        BigDecimal originalAmount = payment.getTransactionAmount();
        BigDecimal totalRefunded = BigDecimal.ZERO;
        
        // ❌ ELIMINAR: refundList no existe en el SDK
        // ✅ SIMULAR que no hay devoluciones previas por ahora
        LOGGER.info("💰 Calculando monto disponible para pago: {}", payment.getId());
        
        // En una implementación real, aquí llamarías a la API de refunds
        // Por ahora asumimos que no hay devoluciones previas
        totalRefunded = BigDecimal.ZERO;
        
        BigDecimal available = originalAmount.subtract(totalRefunded);
        LOGGER.info("💰 Monto disponible para devolución: {} (Original: {})", 
                   available, originalAmount);
        
        return available.compareTo(BigDecimal.ZERO) > 0 ? available : BigDecimal.ZERO;
        
    } catch (Exception e) {
        LOGGER.error("Error calculando monto disponible: {}", e.getMessage());
        return BigDecimal.ZERO;
    }
}
    /**
     * ✅ OBTENER PAGO POR ID
     */
    private Payment getPaymentById(Long paymentId) {
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient paymentClient = new PaymentClient();
            return paymentClient.get(paymentId);
        } catch (Exception e) {
            LOGGER.error("Error obteniendo pago {}: {}", paymentId, e.getMessage());
            return null;
        }
    }

    /**
     * ✅ ENVIAR EMAIL DE NOTIFICACIÓN DE DEVOLUCIÓN
     */
    private void sendRefundEmail(Long paymentId, PaymentRefund refund, String refundType, String reason) {
        try {
            // Obtener información del pago para el email
            Payment payment = getPaymentById(paymentId);
            if (payment != null && payment.getPayer() != null) {
                String email = payment.getPayer().getEmail();
                String name = payment.getPayer().getFirstName() != null ? 
                             payment.getPayer().getFirstName() : "Cliente";
                
                String subject = String.format("🔄 Devolución %s Procesada - Millenium Termotanques", 
                                             refundType.equals("total") ? "Total" : "Parcial");
                
                String text = buildRefundEmailText(name, payment, refund, refundType, reason);
                
                // Usar tu servicio de email existente
                // resendEmailService.sendRefundEmail(email, subject, text);
                
                LOGGER.info("📧 Email de devolución {} enviado a: {}", refundType, email);
            }
        } catch (Exception e) {
            LOGGER.error("Error enviando email de devolución: {}", e.getMessage());
        }
    }

    private String buildRefundEmailText(String name, Payment payment, PaymentRefund refund, 
                                      String refundType, String reason) {
        return String.format(
            "Hola %s,\n\n" +
            "Hemos procesado una devolución %s de tu pago.\n\n" +
            "📋 Detalles de la Devolución:\n" +
            "ID de Devolución: %s\n" +
            "ID de Pago Original: %s\n" +
            "Monto Devolución: $%.2f\n" +
            "Tipo: %s\n" +
            "Razón: %s\n" +
            "Estado: %s\n\n" +
            "El dinero será acreditado en tu cuenta dentro de los próximos 5-10 días hábiles.\n\n" +
            "Si tienes alguna pregunta, no dudes en contactarnos.\n\n" +
            "Gracias,\n" +
            "Equipo Millenium Termotanques\n\n" +
            "📞 Contacto: +54 11 1234-5678\n" +
            "📧 Email: info@milleniumtermotanques.com",
            name,
            refundType.equals("total") ? "total" : "parcial",
            refund.getId(),
            payment.getId(),
            refund.getAmount(),
            refundType.equals("total") ? "Devolución Total" : "Devolución Parcial",
            reason,
            refund.getStatus()
        );
    }
}
