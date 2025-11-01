package com.mercadopago.sample.controller;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.resources.preference.Preference;
import com.mercadopago.sample.dto.BricksPaymentDTO;
import com.mercadopago.sample.dto.CardPaymentDTO;
import com.mercadopago.sample.dto.PayerDTO;
import com.mercadopago.sample.dto.PayerIdentificationDTO;
import com.mercadopago.exceptions.MPException; // ✅ AGREGAR ESTE IMPORT

import com.mercadopago.sample.dto.PaymentResponseDTO;
import com.mercadopago.sample.exception.MercadoPagoException;
import com.mercadopago.sample.service.CardPaymentService;
import com.mercadopago.sample.service.ResendEmailService;
import com.mercadopago.exceptions.MPApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/process_payment")
@CrossOrigin(origins = {"http://localhost:8080", "https://integracionmercado.onrender.com"})
public class CardPaymentController {
    
    @Autowired
    private CardPaymentService cardPaymentService;
    
    @Autowired
    private ResendEmailService resendEmailService;
    
    @Value("${mercado_pago_sample_access_token}")
    private String mercadoPagoAccessToken;
    
    private static final Logger LOGGER = LoggerFactory.getLogger(CardPaymentController.class);

    public CardPaymentController(CardPaymentService cardPaymentService, ResendEmailService resendEmailService) {
        this.cardPaymentService = cardPaymentService;
        this.resendEmailService = resendEmailService;
    }
    @PostMapping("/create_ticket_payment")
public ResponseEntity<?> createCashPayment(@RequestBody BricksPaymentDTO cashPaymentDTO) {
    try {
        LOGGER.info("🎫 Recibiendo solicitud de pago en efectivo");
        LOGGER.info("Método: {}", cashPaymentDTO.getPaymentMethodId());
        LOGGER.info("Monto: {}", cashPaymentDTO.getAmount());
        LOGGER.info("Email: {}", cashPaymentDTO.getPayerEmail());
        LOGGER.info("Nombre: {} {}", cashPaymentDTO.getPayerFirstName(), cashPaymentDTO.getPayerLastName());
        
        // ✅✅✅ CORRECCIÓN CRÍTICA - SI ES NULL, USAR PAGOFACIL
        if (cashPaymentDTO.getPaymentMethodId() == null) {
            LOGGER.warn("⚠️ PaymentMethodId es null, asignando 'pagofacil' por defecto");
            cashPaymentDTO.setPaymentMethodId("pagofacil");
        }
        
        // ✅ Validar método de pago
        String paymentMethod = cashPaymentDTO.getPaymentMethodId().toLowerCase().trim();
        if (!"rapipago".equals(paymentMethod) && !"pagofacil".equals(paymentMethod)) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Método de pago no válido. Use 'rapipago' o 'pagofacil'. Recibido: " + paymentMethod);
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // ✅ Validar monto
        if (cashPaymentDTO.getAmount() == null || cashPaymentDTO.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "El monto debe ser mayor a cero");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // ✅ Completar datos faltantes
        if (cashPaymentDTO.getPayerEmail() == null) {
            cashPaymentDTO.setPayerEmail("cliente@millenium.com");
        }
        if (cashPaymentDTO.getPayerFirstName() == null) {
            cashPaymentDTO.setPayerFirstName("Cliente");
        }
        if (cashPaymentDTO.getPayerLastName() == null) {
            cashPaymentDTO.setPayerLastName("Millenium");
        }
        if (cashPaymentDTO.getIdentificationType() == null) {
            cashPaymentDTO.setIdentificationType("DNI");
        }
        if (cashPaymentDTO.getIdentificationNumber() == null) {
            cashPaymentDTO.setIdentificationNumber("00000000");
        }
        
        LOGGER.info("✅ Datos corregidos - Método: {}, Email: {}, Nombre: {} {}", 
                   cashPaymentDTO.getPaymentMethodId(), cashPaymentDTO.getPayerEmail(),
                   cashPaymentDTO.getPayerFirstName(), cashPaymentDTO.getPayerLastName());
        
        PaymentResponseDTO result = cardPaymentService.processCashPayment(cashPaymentDTO);
        
        LOGGER.info("✅ Pago en efectivo creado exitosamente - ID: {}", result.getId());
        
        // ✅ Enviar email de confirmación
        try {
            String customerName = cashPaymentDTO.getPayerFirstName() + " " + cashPaymentDTO.getPayerLastName();
            resendEmailService.sendCashPaymentVoucherEmail(
                cashPaymentDTO.getPayerEmail(),
                customerName,
                result
            );
        } catch (Exception emailError) {
            LOGGER.warn("⚠️ No se pudo enviar email de voucher: {}", emailError.getMessage());
        }
        
        return ResponseEntity.ok(result);
        
    } catch (MercadoPagoException e) {
        LOGGER.error("❌ Error Mercado Pago en pago efectivo: {}", e.getMessage());
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Error Mercado Pago: " + e.getMessage());
        return ResponseEntity.status(500).body(errorResponse);
    } catch (Exception e) {
        LOGGER.error("❌ Error creando pago en efectivo: {}", e.getMessage());
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Error interno: " + e.getMessage());
        return ResponseEntity.internalServerError().body(errorResponse);
    }
}
    /**
     * ✅ NUEVO ENDPOINT: Obtener voucher de pago en efectivo
     */
    @GetMapping("/download_voucher/{paymentId}")
    public ResponseEntity<?> downloadCashVoucher(@PathVariable Long paymentId) {
        try {
            LOGGER.info("📄 Solicitando voucher para pago: {}", paymentId);
            
            // Obtener información del pago
            var payment = cardPaymentService.getPaymentById(paymentId);
            
            // Generar PDF del voucher
            byte[] pdfBytes = cardPaymentService.generateCashVoucherPdf(payment);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment()
                .filename("voucher-pago-" + paymentId + ".pdf")
                .build());
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
            
        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API Mercado Pago obteniendo voucher: {}", apiException.getApiResponse().getContent());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error obteniendo información del pago: " + apiException.getApiResponse().getContent());
            return ResponseEntity.status(500).body(errorResponse);
        } catch (MPException mpException) {
            LOGGER.error("❌ Error Mercado Pago obteniendo voucher: {}", mpException.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error de conexión con Mercado Pago: " + mpException.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        } catch (Exception e) {
            LOGGER.error("❌ Error generando voucher: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error generando voucher: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * ✅ NUEVO ENDPOINT: Obtener información de pago en efectivo
     */
    @GetMapping("/cash_payment/{paymentId}")
    public ResponseEntity<?> getCashPaymentInfo(@PathVariable Long paymentId) {
        try {
            LOGGER.info("🔍 Solicitando información de pago en efectivo: {}", paymentId);
            
            var payment = cardPaymentService.getPaymentById(paymentId);
            
            // Crear respuesta con información específica para efectivo
            Map<String, Object> response = new HashMap<>();
            response.put("id", payment.getId());
            response.put("status", payment.getStatus());
            response.put("statusDetail", payment.getStatusDetail());
            response.put("transactionAmount", payment.getTransactionAmount());
            response.put("dateCreated", payment.getDateCreated());
            response.put("dateOfExpiration", payment.getDateOfExpiration());
            response.put("paymentMethodId", payment.getPaymentMethodId());
            response.put("description", payment.getDescription());
            
            // Información del voucher externo
            if (payment.getTransactionDetails() != null) {
                Map<String, Object> transactionDetails = new HashMap<>();
                transactionDetails.put("externalResourceUrl", payment.getTransactionDetails().getExternalResourceUrl());
                transactionDetails.put("financialInstitution", payment.getTransactionDetails().getFinancialInstitution());
                response.put("transactionDetails", transactionDetails);
            }
            
            // Información del pagador
            if (payment.getPayer() != null) {
                Map<String, Object> payerInfo = new HashMap<>();
                payerInfo.put("email", payment.getPayer().getEmail());
                payerInfo.put("firstName", payment.getPayer().getFirstName());
                payerInfo.put("lastName", payment.getPayer().getLastName());
                response.put("payer", payerInfo);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error obteniendo información de pago: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error obteniendo información del pago: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }


    // ✅ NUEVO ENDPOINT: Crear preferencia para Wallet Brick
    @PostMapping("/create_wallet_preference")
    public ResponseEntity<?> createWalletPreference(@RequestBody Map<String, Object> requestData) {
        try {
            LOGGER.info("🎯 Creando preferencia para Wallet Brick");
            
            // ✅ Obtener datos del request
            BigDecimal amount = new BigDecimal(requestData.get("amount").toString());
            String description = (String) requestData.get("description");
            
            LOGGER.info("📦 Datos preferencia - Monto: {}, Descripción: {}", amount, description);
            
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PreferenceClient client = new PreferenceClient();

            // ✅ Crear items para la preferencia
            List<PreferenceItemRequest> items = new ArrayList<>();
            PreferenceItemRequest item = PreferenceItemRequest.builder()
                .title(description)
                .quantity(1)
                .unitPrice(amount)
                .build();
            items.add(item);

            // ✅ Crear la preferencia
            PreferenceRequest request = PreferenceRequest.builder()
                .purpose("wallet_purchase") // ✅ Para pagos logueados
                .items(items)
                .build();

            // ✅ Crear la preferencia en Mercado Pago
            Preference preference = client.create(request);
            
            LOGGER.info("✅ Preferencia creada exitosamente - ID: {}", preference.getId());
            
            // ✅ Retornar el ID de la preferencia
            Map<String, String> response = new HashMap<>();
            response.put("id", preference.getId());
            
            return ResponseEntity.ok(response);
            
        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API creando preferencia - Status: {}", apiException.getStatusCode());
            LOGGER.error("❌ Error Message: {}", apiException.getMessage());
            LOGGER.error("❌ API Response: {}", apiException.getApiResponse().getContent());
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error Mercado Pago: " + apiException.getApiResponse().getContent());
            return ResponseEntity.status(500).body(errorResponse);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error creando preferencia: {}", e.getMessage());
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error interno: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/process_bricks_payment")
    public ResponseEntity<?> processBricksPayment(@RequestBody BricksPaymentDTO bricksPaymentDTO) {
        try {
            LOGGER.info("📥 Recibiendo pago desde Bricks - Tipo: {}", bricksPaymentDTO.getBrickType());
            
            // ✅ Validaciones básicas
            if (bricksPaymentDTO.getToken() == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error_message", "Token es requerido");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            if (bricksPaymentDTO.getAmount() == null || bricksPaymentDTO.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error_message", "Monto inválido");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            PaymentResponseDTO result = cardPaymentService.processBricksPayment(bricksPaymentDTO);
            
            LOGGER.info("✅ Pago desde Bricks procesado exitosamente - ID: {}", result.getId());
            return ResponseEntity.ok(result);
            
        } catch (MercadoPagoException e) {
            LOGGER.error("❌ Error procesando pago Bricks: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error_message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        } catch (Exception e) {
            LOGGER.error("❌ Error inesperado en Bricks: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error_message", "Error interno del servidor");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // Webhook para notificaciones de Mercado Pago
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
            com.mercadopago.resources.payment.Payment payment = cardPaymentService.getPaymentById(Long.parseLong(paymentId));
            
            if (payment == null) {
                LOGGER.error("❌ No se pudo obtener información del pago ID: {}", paymentId);
                return;
            }
            
            String status = payment.getStatus();
            
            // ✅ Manejar caso cuando payer es null
            String customerEmail = null;
            String customerName = "Cliente";
            
            if (payment.getPayer() != null) {
                customerEmail = payment.getPayer().getEmail();
                customerName = (payment.getPayer().getFirstName() != null ? payment.getPayer().getFirstName() : "Cliente") + " " + 
                              (payment.getPayer().getLastName() != null ? payment.getPayer().getLastName() : "");
            }
            
            // ✅ Si no hay email, usar email de respaldo
            if (customerEmail == null || customerEmail.trim().isEmpty()) {
                LOGGER.warn("⚠️ Email del cliente no disponible para pago ID: {}. Usando email de respaldo.", paymentId);
                customerEmail = "nicolas.espinosa.ok@gmail.com";
            }
            
            LOGGER.info("📊 Estado del pago {}: {}", paymentId, status);
            LOGGER.info("👤 Cliente: {} ({})", customerName, customerEmail);
            
            // Enviar email según el estado del pago
            switch (status) {
                case "approved":
                    LOGGER.info("✅ Pago aprobado - Enviando email de confirmación");
                    resendEmailService.sendPaymentApprovalEmail(customerEmail, customerName, payment);
                    break;
                    
                case "rejected":
                    LOGGER.info("❌ Pago rechazado - Enviando email de rechazo");
                    resendEmailService.sendPaymentRejectionEmail(customerEmail, customerName, payment);
                    break;
                    
                case "in_process":
                    LOGGER.info("⏳ Pago pendiente - Enviando email de procesamiento");
                    resendEmailService.sendPaymentPendingEmail(customerEmail, customerName, payment);
                    break;
                    
                case "cancelled":
                    LOGGER.info("🚫 Pago cancelado - Enviando email de cancelación");
                    resendEmailService.sendPaymentCancellationEmail(customerEmail, customerName, payment);
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

        // ✅ Completar firstName y lastName si faltan
        if (cardPaymentDTO.getPayer().getFirstName() == null) {
            cardPaymentDTO.getPayer().setFirstName("Cliente");
        }
        
        if (cardPaymentDTO.getPayer().getLastName() == null) {
            cardPaymentDTO.getPayer().setLastName("Millenium");
        }

        try {
            PaymentResponseDTO payment = cardPaymentService.processPayment(cardPaymentDTO);
            LOGGER.info("✅ Pago exitoso - ID: {}", payment.getId());
            
            // ✅ Enviar email inmediato de confirmación
            try {
                resendEmailService.sendPaymentReceivedEmail(
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
    @GetMapping("/download_receipt/{paymentId}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long paymentId) {
        try {
            com.mercadopago.resources.payment.Payment payment = cardPaymentService.getPaymentById(paymentId);
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
