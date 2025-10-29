package com.mercadopago.sample.service;

import com.mercadopago.resources.payment.Payment;
import com.mercadopago.sample.dto.PaymentResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class ResendEmailService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(ResendEmailService.class);
    
    @Value("${mailsender.api.key}")
    private String mailSenderApiKey;
    
    @Value("${mailsender.api.url}")
    private String mailSenderApiUrl;
    
    @Value("${mailsender.from.email}")
    private String fromEmail;
    
    @Value("${mailsender.from.name}")
    private String fromName;
    
    private final RestTemplate restTemplate;
    
    public ResendEmailService() {
        this.restTemplate = new RestTemplate();
    }
    
    public void sendPaymentApprovalEmail(String email, String name, Payment payment) {
        String subject = "✅ Pago Aprobado - Millenium Termotanques";
        String text = buildApprovalEmailText(name, payment);
        sendEmailViaApi(email, subject, text, "aprobación");
    }
    
    public void sendPaymentRejectionEmail(String email, String name, Payment payment) {
        String subject = "❌ Pago Rechazado - Millenium Termotanques";
        String text = buildRejectionEmailText(name, payment);
        sendEmailViaApi(email, subject, text, "rechazo");
    }
    
    public void sendPaymentPendingEmail(String email, String name, Payment payment) {
        String subject = "⏳ Pago en Proceso - Millenium Termotanques";
        String text = buildPendingEmailText(name, payment);
        sendEmailViaApi(email, subject, text, "procesamiento");
    }

    /**
     * ✅ NUEVO MÉTODO: Enviar email con voucher de pago en efectivo
     */
    public void sendCashPaymentVoucherEmail(String customerEmail, String customerName, PaymentResponseDTO payment) {
        try {
            LOGGER.info("📧 Enviando email de voucher a: {} - Pago ID: {}", customerEmail, payment.getId());
            
            String paymentMethod = getPaymentMethodName(payment.getStatusDetail());
            String subject = "🎫 Tu voucher de pago - Millenium Termotanques";
            
            String htmlContent = buildCashVoucherEmailTemplate(customerName, payment, paymentMethod);
            
            sendEmailViaApi(customerEmail, subject, htmlContent, "voucher");
            
            LOGGER.info("✅ Email de voucher enviado exitosamente a: {}", customerEmail);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email de voucher: {}", e.getMessage());
            throw new RuntimeException("Error enviando email de voucher: " + e.getMessage(), e);
        }
    }

    /**
     * ✅ Método auxiliar: Obtener nombre del método de pago
     */
    private String getPaymentMethodName(String statusDetail) {
        if (statusDetail != null) {
            if (statusDetail.contains("rapipago")) return "Rapipago";
            if (statusDetail.contains("pagofacil")) return "Pago Fácil";
        }
        return "Efectivo";
    }

    /**
     * ✅ CORREGIDO: Método simplificado sin CSS complejo
     */
    private String buildCashVoucherEmailTemplate(String customerName, PaymentResponseDTO payment, String paymentMethod) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head>");
        html.append("<meta charset=\"UTF-8\">");
        html.append("<title>Voucher de Pago</title>");
        html.append("</head>");
        html.append("<body style=\"font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;\">");
        
        // Contenedor principal
        html.append("<div style=\"max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);\">");
        
        // Header
        html.append("<div style=\"text-align: center; margin-bottom: 30px;\">");
        html.append("<h1 style=\"color: #d4af37; margin: 0;\">🎫 Millenium Termotanques</h1>");
        html.append("<p>Tu voucher de pago ha sido generado</p>");
        html.append("</div>");
        
        // Saludo
        html.append("<p>Hola <strong>").append(customerName).append("</strong>,</p>");
        html.append("<p>Tu pago en efectivo ha sido procesado exitosamente. Aquí tienes los detalles:</p>");
        
        // Información del voucher
        html.append("<div style=\"background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;\">");
        html.append("<h3 style=\"margin-top: 0;\">📋 Información del Voucher</h3>");
        html.append("<p><strong>Número de operación:</strong> ").append(payment.getId()).append("</p>");
        html.append("<p><strong>Método de pago:</strong> ").append(paymentMethod).append("</p>");
        html.append("<p><strong>Monto:</strong> $").append(payment.getTransactionAmount()).append("</p>");
        html.append("<p><strong>Estado:</strong> Pendiente de pago</p>");
        html.append("</div>");
        
        // Instrucciones
        html.append("<div style=\"background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;\">");
        html.append("<h3 style=\"margin-top: 0;\">📝 Instrucciones para pagar:</h3>");
        html.append("<ol>");
        html.append("<li>Acércate a cualquier sucursal de <strong>").append(paymentMethod).append("</strong></li>");
        html.append("<li>Presenta el número de operación o descarga el voucher</li>");
        html.append("<li>Realiza el pago en efectivo</li>");
        html.append("<li>Conserva el comprobante de pago</li>");
        html.append("</ol>");
        html.append("<p><strong>⏰ Tienes 3 días hábiles para realizar el pago</strong></p>");
        html.append("</div>");
        
        // Mensaje final
        html.append("<p>Puedes descargar tu voucher desde nuestro sitio web o presentando este número de operación en la sucursal.</p>");
        
        // Footer
        html.append("<div style=\"text-align: center; margin-top: 30px; color: #666; font-size: 14px;\">");
        html.append("<p>Gracias por elegir Millenium Termotanques</p>");
        html.append("<p>📍 Dirección: [Tu dirección]</p>");
        html.append("<p>📞 Teléfono: [Tu teléfono]</p>");
        html.append("</div>");
        
        html.append("</div>"); // Cierre del contenedor principal
        html.append("</body>");
        html.append("</html>");
        
        return html.toString();
    }
    
    public void sendPaymentCancellationEmail(String email, String name, Payment payment) {
        String subject = "🚫 Pago Cancelado - Millenium Termotanques";
        String text = buildCancellationEmailText(name, payment);
        sendEmailViaApi(email, subject, text, "cancelación");
    }
    
    public void sendPaymentReceivedEmail(String email, String name, PaymentResponseDTO payment) {
        String subject = "📋 Pago Recibido - Millenium Termotanques";
        String text = buildReceivedEmailText(name, payment);
        sendEmailViaApi(email, subject, text, "recepción");
    }
    
    private void sendEmailViaApi(String to, String subject, String text, String tipo) {
        if (!isValidEmail(to)) {
            LOGGER.warn("📧 Email no válido para {}: {}", tipo, to);
            return;
        }
        
        try {
            LOGGER.info("📧 Enviando email de {} a: {}", tipo, to);
            
            Map<String, Object> emailRequest = new HashMap<>();
            emailRequest.put("from", Map.of("email", fromEmail, "name", fromName));
            emailRequest.put("to", new Object[]{Map.of("email", to)});
            emailRequest.put("subject", subject);
            emailRequest.put("html", text);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-MailSender-API-Key", mailSenderApiKey);
            headers.set("Content-Type", "application/json");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailRequest, headers);
            
            String endpoint = mailSenderApiUrl + "/send";
            LOGGER.info("🔗 Usando endpoint: {}", endpoint);
            
            ResponseEntity<String> response = restTemplate.exchange(
                endpoint, 
                HttpMethod.POST, 
                request, 
                String.class
            );
            
            LOGGER.info("📥 Respuesta de MailSender: {}", response.getStatusCode());
            
            if (response.getStatusCode().is2xxSuccessful()) {
                LOGGER.info("✅ Email de {} enviado exitosamente a: {}", tipo, to);
            } else {
                LOGGER.error("❌ Error MailSender ({}): {}", response.getStatusCode(), response.getBody());
            }
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email de {} a {}: {}", tipo, to, e.getMessage());
        }
    }
    
    private boolean isValidEmail(String email) {
        return email != null && 
               !email.trim().isEmpty() && 
               email.contains("@") && 
               email.contains(".");
    }
    
    private String buildApprovalEmailText(String name, Payment payment) {
        return "Hola " + name + ",\n\n" +
               "¡Excelente noticia! Tu pago ha sido aprobado exitosamente.\n\n" +
               "📋 Detalles del Pago:\n" +
               "ID de Transacción: " + payment.getId() + "\n" +
               "Monto Total: $" + payment.getTransactionAmount() + "\n" +
               "Estado: APROBADO ✅\n\n" +
               "Tu pedido está siendo procesado y te contactaremos pronto para coordinar la entrega.\n\n" +
               "Gracias por confiar en Millenium Termotanques!\n\n" +
               "📞 Contacto: +54 11 1234-5678\n" +
               "📧 Email: info@milleniumtermotanques.com";
    }
    
    private String buildRejectionEmailText(String name, Payment payment) {
        return "Hola " + name + ",\n\n" +
               "Lamentablemente tu pago ha sido rechazado.\n\n" +
               "Detalles:\n" +
               "ID de Transacción: " + payment.getId() + "\n" +
               "Monto: $" + payment.getTransactionAmount() + "\n" +
               "Razón: " + (payment.getStatusDetail() != null ? payment.getStatusDetail() : "No especificada") + "\n\n" +
               "Puedes intentar nuevamente con otro método de pago.\n\n" +
               "Si necesitas ayuda, contáctanos:\n" +
               "📞 +54 11 1234-5678\n" +
               "📧 info@milleniumtermotanques.com";
    }
    
    private String buildPendingEmailText(String name, Payment payment) {
        return "Hola " + name + ",\n\n" +
               "Tu pago se encuentra en proceso de verificación.\n\n" +
               "Detalles:\n" +
               "ID de Transacción: " + payment.getId() + "\n" +
               "Monto: $" + payment.getTransactionAmount() + "\n" +
               "Estado: EN PROCESO ⏳\n\n" +
               "Te notificaremos cuando se complete la verificación.\n" +
               "Este proceso puede tomar hasta 48 horas.\n\n" +
               "Gracias por tu paciencia,\n" +
               "Equipo Millenium Termotanques\n\n" +
               "📞 Contacto: +54 11 1234-5678";
    }
    
    private String buildCancellationEmailText(String name, Payment payment) {
        return "Hola " + name + ",\n\n" +
               "Tu pago ha sido cancelado.\n\n" +
               "Detalles:\n" +
               "ID de Transacción: " + payment.getId() + "\n" +
               "Monto: $" + payment.getTransactionAmount() + "\n" +
               "Estado: CANCELADO 🚫\n\n" +
               "Si no realizaste esta cancelación o necesitas ayuda, contáctanos.\n\n" +
               "📞 +54 11 1234-5678\n" +
               "📧 info@milleniumtermotanques.com";
    }
    
    private String buildReceivedEmailText(String name, PaymentResponseDTO payment) {
        return "Hola " + name + ",\n\n" +
               "Hemos recibido tu solicitud de pago correctamente.\n\n" +
               "Detalles:\n" +
               "ID de Transacción: " + payment.getId() + "\n" +
               "Estado: " + (payment.getStatus() != null ? payment.getStatus().toUpperCase() : "RECIBIDO") + " 📋\n\n" +
               "Estamos procesando tu pago. Te notificaremos cuando se complete la transacción.\n\n" +
               "Gracias por elegir Millenium Termotanques!\n\n" +
               "📞 Contacto: +54 11 1234-5678\n" +
               "📧 Email: info@milleniumtermotanques.com";
    }
}
