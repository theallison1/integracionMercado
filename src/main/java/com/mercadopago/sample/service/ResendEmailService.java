
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
    
  
    private static final Logger LOGGER = LoggerFactory.getLogger(MailSenderEmailService.class);
    
    @Value("${mailsender.api.key}")
    private String mailSenderApiKey;
    
    @Value("${mailsender.api.url}")
    private String mailSenderApiUrl;
    
    @Value("${mailsender.from.email}")
    private String fromEmail;
    
    @Value("${mailsender.from.name}")
    private String fromName;
    
    private final RestTemplate restTemplate;
    
    public MailSenderEmailService() {
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
            emailRequest.put("text", text);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-MailSender-API-Key", mailSenderApiKey);
            headers.set("Content-Type", "application/json");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailRequest, headers);
            
            // ✅ URL específica para MailSender
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
    
    // Los métodos build... se mantienen IGUAL
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
