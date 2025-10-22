// EmailService.java
package com.mercadopago.sample.service;

import com.mercadopago.resources.payment.Payment;
import com.mercadopago.sample.dto.PaymentResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import javax.mail.internet.MimeMessage;

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
            LOGGER.error("❌ Error enviando email: {}", e.getMessage());
            throw new RuntimeException("Error enviando email", e);
        }
    }
}
