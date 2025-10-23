package com.mercadopago.sample.service;

import com.mercadopago.resources.payment.Payment;
import com.mercadopago.sample.dto.PaymentResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    public void sendPaymentApprovalEmail(String email, String name, Payment payment) {
        String subject = "✅ Pago Aprobado - Millenium Termotanques";
        String text = buildApprovalEmailText(name, payment);
        sendSimpleEmail(email, subject, text);
    }
    
    public void sendPaymentRejectionEmail(String email, String name, Payment payment) {
        String subject = "❌ Pago Rechazado - Millenium Termotanques";
        String text = buildRejectionEmailText(name, payment);
        sendSimpleEmail(email, subject, text);
    }
    
    public void sendPaymentPendingEmail(String email, String name, Payment payment) {
        String subject = "⏳ Pago en Proceso - Millenium Termotanques";
        String text = buildPendingEmailText(name, payment);
        sendSimpleEmail(email, subject, text);
    }
    
    public void sendPaymentCancellationEmail(String email, String name, Payment payment) {
        String subject = "🚫 Pago Cancelado - Millenium Termotanques";
        String text = buildCancellationEmailText(name, payment);
        sendSimpleEmail(email, subject, text);
    }
    
    public void sendPaymentReceivedEmail(String email, String name, PaymentResponseDTO payment) {
        String subject = "📋 Pago Recibido - Millenium Termotanques";
        String text = buildReceivedEmailText(name, payment);
        sendSimpleEmail(email, subject, text);
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
        // ✅ CORRECCIÓN: PaymentResponseDTO no tiene transactionAmount
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
    
    private void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            message.setFrom("no-reply@milleniumtermotanques.com");
            
            mailSender.send(message);
            LOGGER.info("📧 Email enviado a: {} - Asunto: {}", to, subject);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email a {}: {}", to, e.getMessage());
        }
    }
}
