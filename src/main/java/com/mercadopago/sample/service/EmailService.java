package com.mercadopago.sample.service;

import com.mercadopago.resources.payment.Payment;
import com.mercadopago.sample.dto.PaymentResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import javax.mail.internet.MimeMessage;
import java.math.BigDecimal;

@Service
public class EmailService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }
    
    public void sendPaymentApprovalEmail(String email, String name, Payment payment) {
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("payment", payment);
            context.setVariable("paymentId", payment.getId());
            context.setVariable("amount", payment.getTransactionAmount());
            context.setVariable("status", payment.getStatus());
            
            String htmlContent = templateEngine.process("payment-approved", context);
            
            sendEmail(email, "✅ Pago Aprobado - Millenium Termotanques", htmlContent);
            LOGGER.info("📧 Email de aprobación enviado a: {}", email);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email de aprobación: {}", e.getMessage());
            // Enviar email simple como fallback
            sendSimplePaymentEmail(email, name, "aprobado", payment.getId().toString(), payment.getTransactionAmount());
        }
    }
    
    public void sendPaymentRejectionEmail(String email, String name, Payment payment) {
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("payment", payment);
            context.setVariable("paymentId", payment.getId());
            context.setVariable("statusDetail", payment.getStatusDetail());
            
            String htmlContent = templateEngine.process("payment-rejected", context);
            
            sendEmail(email, "❌ Pago Rechazado - Millenium Termotanques", htmlContent);
            LOGGER.info("📧 Email de rechazo enviado a: {}", email);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email de rechazo: {}", e.getMessage());
            sendSimplePaymentEmail(email, name, "rechazado", payment.getId().toString(), payment.getTransactionAmount());
        }
    }
    
    public void sendPaymentPendingEmail(String email, String name, Payment payment) {
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("payment", payment);
            context.setVariable("paymentId", payment.getId());
            
            String htmlContent = templateEngine.process("payment-pending", context);
            
            sendEmail(email, "⏳ Pago en Proceso - Millenium Termotanques", htmlContent);
            LOGGER.info("📧 Email de pendiente enviado a: {}", email);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email de pendiente: {}", e.getMessage());
            sendSimplePaymentEmail(email, name, "en proceso", payment.getId().toString(), payment.getTransactionAmount());
        }
    }
    
    public void sendPaymentCancellationEmail(String email, String name, Payment payment) {
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("payment", payment);
            context.setVariable("paymentId", payment.getId());
            
            String htmlContent = templateEngine.process("payment-cancelled", context);
            
            sendEmail(email, "🚫 Pago Cancelado - Millenium Termotanques", htmlContent);
            LOGGER.info("📧 Email de cancelación enviado a: {}", email);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email de cancelación: {}", e.getMessage());
            sendSimplePaymentEmail(email, name, "cancelado", payment.getId().toString(), payment.getTransactionAmount());
        }
    }
    
    public void sendPaymentReceivedEmail(String email, String name, PaymentResponseDTO payment) {
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("payment", payment);
            context.setVariable("paymentId", payment.getId());
            context.setVariable("amount", payment.getTransactionAmount());
            
            String htmlContent = templateEngine.process("payment-received", context);
            
            sendEmail(email, "📋 Pago Recibido - Millenium Termotanques", htmlContent);
            LOGGER.info("📧 Email de recepción enviado a: {}", email);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email de recepción: {}", e.getMessage());
            // Email simple para recepción
            sendSimpleEmail(email, 
                "📋 Pago Recibido - Millenium Termotanques",
                "Hola " + name + ",\n\n" +
                "Hemos recibido tu pago correctamente.\n" +
                "ID de pago: " + payment.getId() + "\n" +
                "Monto: $" + payment.getTransactionAmount() + "\n" +
                "Estado: En proceso\n\n" +
                "Te notificaremos cuando se complete el procesamiento.\n\n" +
                "Gracias por tu compra,\n" +
                "Equipo Millenium Termotanques"
            );
        }
    }
    
    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom("no-reply@milleniumtermotanques.com");
            
            mailSender.send(message);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email HTML: {}", e.getMessage());
            throw new RuntimeException("Error enviando email", e);
        }
    }
    
    // Método de fallback para emails simples
    private void sendSimplePaymentEmail(String to, String name, String status, String paymentId, BigDecimal amount) {
        try {
            String subject = "Pago " + status + " - Millenium Termotanques";
            String text = "Hola " + name + ",\n\n" +
                         "Tu pago ha sido " + status + ".\n" +
                         "ID de pago: " + paymentId + "\n" +
                         "Monto: $" + amount + "\n" +
                         "Estado: " + status.toUpperCase() + "\n\n" +
                         "Gracias por tu compra,\n" +
                         "Equipo Millenium Termotanques";
            
            sendSimpleEmail(to, subject, text);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email simple: {}", e.getMessage());
        }
    }
    
    private void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            message.setFrom("no-reply@milleniumtermotanques.com");
            
            mailSender.send(message);
            LOGGER.info("📧 Email simple enviado a: {}", to);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error enviando email simple: {}", e.getMessage());
        }
    }
}
