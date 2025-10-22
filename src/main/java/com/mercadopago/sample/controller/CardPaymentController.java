package com.mercadopago.sample.controller;

import com.mercadopago.resources.payment.Payment;
import com.mercadopago.sample.dto.CardPaymentDTO;
import com.mercadopago.sample.dto.PayerDTO;
import com.mercadopago.sample.dto.PayerIdentificationDTO;
import com.mercadopago.sample.dto.PaymentResponseDTO;
import com.mercadopago.sample.service.CardPaymentService;
import com.mercadopago.sample.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.math.BigDecimal;

@RestController
@RequestMapping("/process_payment")
public class CardPaymentController {
    
    @Resource
    private CardPaymentService cardPaymentService;
    
    @Resource
    private EmailService emailService;
    
    private static final Logger LOGGER = LoggerFactory.getLogger(CardPaymentController.class);

    public CardPaymentController(CardPaymentService cardPaymentService, EmailService emailService) {
        this.cardPaymentService = cardPaymentService;
        this.emailService = emailService;
    }

    // Webhook para notificaciones de Mercado Pago - MEJORADO
    @PostMapping("/webhooks/mercadopago")
    public ResponseEntity<String> handleMercadoPagoNotification(
            @RequestParam("data.id") String paymentId,
            @RequestParam("type") String eventType) {
        
        LOGGER.info("🔔 Notificación recibida de Mercado Pago - ID: {}, Tipo: {}", paymentId, eventType);
        
        try {
            switch (eventType) {
                case "payment":
                    LOGGER.info("💳 Procesando notificación de pago - ID: {}", paymentId);
                    processPaymentNotification(paymentId);
                    break;
                case "plan":
                    LOGGER.info("📋 Notificación de plan recibida");
                    break;
                case "subscription":
                    LOGGER.info("🔄 Notificación de suscripción recibida");
                    break;
                case "invoice":
                    LOGGER.info("🧾 Notificación de factura recibida");
                    break;
                default:
                    LOGGER.warn("⚠️ Tipo de evento no reconocido: {}", eventType);
            }
            
            return ResponseEntity.ok("Notificación procesada exitosamente");
            
        } catch (Exception e) {
            LOGGER.error("❌ Error procesando notificación: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error procesando notificación");
        }
    }

    // Método para procesar notificaciones de pago
    private void processPaymentNotification(String paymentId) {
        try {
            LOGGER.info("🔄 Obteniendo información del pago ID: {}", paymentId);
            
            // Obtener información completa del pago
            Payment payment = cardPaymentService.getPaymentById(Long.parseLong(paymentId));
            
            if (payment == null) {
                LOGGER.error("❌ No se pudo obtener información del pago ID: {}", paymentId);
                return;
            }
            
            String status = payment.getStatus();
            String customerEmail = payment.getPayer().getEmail();
            String customerName = payment.getPayer().getFirstName() + " " + 
                                 (payment.getPayer().getLastName() != null ? payment.getPayer().getLastName() : "");
            
            LOGGER.info("📊 Estado del pago {}: {}", paymentId, status);
            LOGGER.info("👤 Cliente: {} ({})", customerName, customerEmail);
            
            // Enviar email según el estado del pago
            switch (status) {
                case "approved":
                    LOGGER.info("✅ Pago aprobado - Enviando email de confirmación");
                    emailService.sendPaymentApprovalEmail(customerEmail, customerName, payment);
                    break;
                    
                case "rejected":
                    LOGGER.info("❌ Pago rechazado - Enviando email de rechazo");
                    emailService.sendPaymentRejectionEmail(customerEmail, customerName, payment);
                    break;
                    
                case "in_process":
                    LOGGER.info("⏳ Pago pendiente - Enviando email de procesamiento");
                    emailService.sendPaymentPendingEmail(customerEmail, customerName, payment);
                    break;
                    
                case "cancelled":
                    LOGGER.info("🚫 Pago cancelado - Enviando email de cancelación");
                    emailService.sendPaymentCancellationEmail(customerEmail, customerName, payment);
                    break;
                    
                default:
                    LOGGER.warn("⚠️ Estado de pago no manejado: {}", status);
            }
            
        } catch (Exception e) {
            LOGGER.error("❌ Error procesando notificación de pago {}: {}", paymentId, e.getMessage(), e);
        }
    }

    // Endpoint para verificación del webhook
    @GetMapping("/webhooks/mercadopago")
    public ResponseEntity<String> verifyWebhook(@RequestParam("topic") String topic) {
        LOGGER.info("🔍 Verificación de webhook recibida - Tópico: {}", topic);
        return ResponseEntity.ok("Webhook verificado - Tópico: " + topic);
    }

    @CrossOrigin(origins = {"http://localhost:8080", "https://integracionmercado.onrender.com"})
    @PostMapping
    public ResponseEntity<PaymentResponseDTO> processPayment(@RequestBody CardPaymentDTO cardPaymentDTO) {
        LOGGER.info("=== SOLICITUD DE PAGO RECIBIDA ===");
        LOGGER.info("Token: {}", cardPaymentDTO.getToken());
        LOGGER.info("PaymentMethodId: {}", cardPaymentDTO.getPaymentMethodId());
        LOGGER.info("Installments: {}", cardPaymentDTO.getInstallments());
        LOGGER.info("Amount: {}", cardPaymentDTO.getTransactionAmount());
        LOGGER.info("Description: {}", cardPaymentDTO.getProductDescription());
        LOGGER.info("Email: {}", cardPaymentDTO.getPayer().getEmail());

        // ✅ CORRECCIÓN CRÍTICA: El Brick NO envía productDescription
        if (cardPaymentDTO.getProductDescription() == null) {
            cardPaymentDTO.setProductDescription("Compra de termotanques Millenium");
            LOGGER.info("✅ Product description asignado por defecto");
        }

        // ✅ También completar firstName y lastName si faltan
        if (cardPaymentDTO.getPayer().getFirstName() == null) {
            cardPaymentDTO.getPayer().setFirstName("Cliente");
        }
        
        if (cardPaymentDTO.getPayer().getLastName() == null) {
            cardPaymentDTO.getPayer().setLastName("Millenium");
        }

        try {
            PaymentResponseDTO payment = cardPaymentService.processPayment(cardPaymentDTO);
            LOGGER.info("✅ Pago exitoso - ID: {}", payment.getId());
            
            // ✅ Enviar email inmediato de confirmación de recepción
            try {
                emailService.sendPaymentReceivedEmail(
                    cardPaymentDTO.getPayer().getEmail(),
                    cardPaymentDTO.getPayer().getFirstName() + " " + cardPaymentDTO.getPayer().getLastName(),
                    payment
                );
            } catch (Exception emailError) {
                LOGGER.warn("⚠️ No se pudo enviar email de confirmación: {}", emailError.getMessage());
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (Exception e) {
            LOGGER.error("❌ Error en pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Método para obtener el comprobante del pago
    @CrossOrigin(origins = {"http://localhost:8080", "https://integracionmercado.onrender.com"})
    @GetMapping("/download_receipt/{paymentId}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long paymentId) {
        try {
            Payment payment = cardPaymentService.getPaymentById(paymentId);
            byte[] pdfContent = cardPaymentService.generateReceiptPdf(payment);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename("comprobante_pago.pdf").build());

            return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            LOGGER.error("Error generando comprobante para pago ID {}: {}", paymentId, e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Endpoint de prueba
    @CrossOrigin(origins = {"http://localhost:8080", "https://integracionmercado.onrender.com"})
    @GetMapping("/holis")
    public ResponseEntity<String> getAuthenticationRequest() {
        LOGGER.info("Entro al endpoint de prueba ----------------------");
        
        try {
            CardPaymentDTO cardPaymentDTO1 = new CardPaymentDTO();
            cardPaymentDTO1.setToken("2ebc717fdff5fa793961b39c142963a5");
            cardPaymentDTO1.setInstallments(1);
            cardPaymentDTO1.setIssuerId("2");
            cardPaymentDTO1.setTransactionAmount(BigDecimal.valueOf(2000));
            cardPaymentDTO1.setProductDescription("Pago de prueba Millenium Termotanques");

            PayerDTO payerDTO = new PayerDTO();
            payerDTO.setEmail("test@test.com");
            payerDTO.setFirstName("Test");
            payerDTO.setLastName("User");
            
            PayerIdentificationDTO payerIdentificationDTO = new PayerIdentificationDTO();
            payerIdentificationDTO.setType("DNI");
            payerIdentificationDTO.setNumber("12345678");
            payerDTO.setIdentification(payerIdentificationDTO);
            
            cardPaymentDTO1.setPayer(payerDTO);
            cardPaymentDTO1.setPaymentMethodId("visa");

            PaymentResponseDTO payment = cardPaymentService.processPayment(cardPaymentDTO1);
            LOGGER.info("Pago de prueba procesado - Estado: {}", payment.getStatus());
            
            return ResponseEntity.status(HttpStatus.CREATED).body("Prueba exitosa - Estado: " + payment.getStatus());
        } catch (Exception e) {
            LOGGER.error("Error en prueba: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error en prueba: " + e.getMessage());
        }
    }
}
