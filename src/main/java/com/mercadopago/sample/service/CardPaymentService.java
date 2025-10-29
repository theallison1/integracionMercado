package com.mercadopago.sample.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.common.IdentificationRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.core.MPRequestOptions;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.sample.dto.CardPaymentDTO;
import com.mercadopago.sample.dto.PaymentResponseDTO;
import com.mercadopago.sample.exception.MercadoPagoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import com.mercadopago.sample.dto.BricksPaymentDTO; // ✅ ESTE IMPORT
import com.mercadopago.sample.dto.PaymentResponseDTO;

@Service
public class CardPaymentService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CardPaymentService.class);

    @Value("${mercado_pago_sample_access_token}")
    private String mercadoPagoAccessToken;

    @Value("${app.base.url:https://integracionmercado.onrender.com}")
    private String appBaseUrl;

    public PaymentResponseDTO processPayment(CardPaymentDTO cardPaymentDTO) {
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();

            String notificationUrl = appBaseUrl + "/process_payment/webhooks/mercadopago";

            // ✅ Asegurar descripción en el service también
            String description = cardPaymentDTO.getProductDescription() != null ? 
                               cardPaymentDTO.getProductDescription() : 
                               "Compra de termotanques Millenium";

            // ✅ Asegurar firstName y lastName
            String firstName = cardPaymentDTO.getPayer().getFirstName() != null ? 
                              cardPaymentDTO.getPayer().getFirstName() : "Cliente";
            String lastName = cardPaymentDTO.getPayer().getLastName() != null ? 
                             cardPaymentDTO.getPayer().getLastName() : "Millenium";

            LOGGER.info("=== CREANDO PAGO EN MERCADO PAGO ===");
            LOGGER.info("Descripción: {}", description);
            LOGGER.info("Monto: {}", cardPaymentDTO.getTransactionAmount());
            LOGGER.info("Email: {}", cardPaymentDTO.getPayer().getEmail());
            LOGGER.info("Nombre: {} {}", firstName, lastName);

            // ✅ Configurar headers personalizados con idempotency key
            Map<String, String> customHeaders = new HashMap<>();
            String idempotencyKey = generateIdempotencyKey(cardPaymentDTO);
            customHeaders.put("x-idempotency-key", idempotencyKey);

            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();

            LOGGER.info("Idempotency Key generado: {}", idempotencyKey);

            PaymentCreateRequest paymentCreateRequest =
                    PaymentCreateRequest.builder()
                            .transactionAmount(cardPaymentDTO.getTransactionAmount())
                            .token(cardPaymentDTO.getToken())
                            .description(description)
                            .installments(cardPaymentDTO.getInstallments())
                            .paymentMethodId(cardPaymentDTO.getPaymentMethodId())
                            .notificationUrl(notificationUrl)
                            .payer(
                                    PaymentPayerRequest.builder()
                                            .email(cardPaymentDTO.getPayer().getEmail())
                                            .firstName(firstName)
                                            .lastName(lastName)
                                            .identification(
                                                    IdentificationRequest.builder()
                                                            .type(cardPaymentDTO.getPayer().getIdentification().getType())
                                                            .number(cardPaymentDTO.getPayer().getIdentification().getNumber())
                                                            .build())
                                            .build())
                            .build();

            // ✅ Usar requestOptions con idempotency key
            Payment payment = client.create(paymentCreateRequest, requestOptions);

            LOGGER.info("✅ Pago creado exitosamente - ID: {}, Estado: {}", 
                       payment.getId(), payment.getStatus());
            LOGGER.info("URL de notificación configurada: {}", notificationUrl);
            LOGGER.info("Idempotency Key utilizado: {}", idempotencyKey);

            // ✅ Usar constructor con todos los campos
            return new PaymentResponseDTO(
                    payment.getId(),
                    String.valueOf(payment.getStatus()),
                    payment.getStatusDetail(),
                    payment.getDateCreated(),
                    payment.getTransactionAmount());

        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API Mercado Pago - Status: {}", apiException.getStatusCode());
            LOGGER.error("❌ Error Message: {}", apiException.getMessage());
            LOGGER.error("❌ API Response: {}", apiException.getApiResponse().getContent());
            
            // Log detallado para debugging
            if (apiException.getStatusCode() == 400) {
                LOGGER.error("=== ERROR 400 - BAD REQUEST ===");
                LOGGER.error("Posible problema con los datos enviados a Mercado Pago");
                LOGGER.error("Verificar: token, paymentMethodId, monto, datos del pagador");
            } else if (apiException.getStatusCode() == 401) {
                LOGGER.error("=== ERROR 401 - UNAUTHORIZED ===");
                LOGGER.error("Problema con el access token de Mercado Pago");
            } else if (apiException.getStatusCode() == 403) {
                LOGGER.error("=== ERROR 403 - FORBIDDEN ===");
                LOGGER.error("Problema de credenciales o políticas de seguridad");
            } else if (apiException.getStatusCode() == 422) {
                LOGGER.error("=== ERROR 422 - UNPROCESSABLE ENTITY ===");
                LOGGER.error("Error de validación en los datos del pago");
            } else if (apiException.getStatusCode() == 500) {
                LOGGER.error("=== ERROR 500 - INTERNAL SERVER ERROR ===");
                LOGGER.error("Error interno de Mercado Pago");
            }
            
            // ✅ CORREGIDO: Pasar la excepción como causa, no el status code
            throw new MercadoPagoException(
                "Error Mercado Pago - Status: " + apiException.getStatusCode() + " - " + apiException.getApiResponse().getContent(),
                apiException
            );
        } catch (MPException exception) {
            LOGGER.error("❌ Error Mercado Pago: {}", exception.getMessage());
            throw new MercadoPagoException("Error de conexión con Mercado Pago: " + exception.getMessage(), exception);
        } catch (Exception exception) {
            LOGGER.error("❌ Error inesperado: {}", exception.getMessage());
            throw new MercadoPagoException("Error interno del servidor: " + exception.getMessage(), exception);
        }
    }

    /**
     * ✅ NUEVO MÉTODO: Generar PDF específico para vouchers de pago en efectivo
     */
    public byte[] generateCashVoucherPdf(Payment payment) throws IOException {
        LOGGER.info("Generando voucher PDF para pago en efectivo: {}", payment.getId());
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            // Encabezado específico para voucher
            document.add(new Paragraph("VOUCHER DE PAGO")
                    .setFontSize(20)
                    .setBold()
                    .setMarginBottom(20));

            document.add(new Paragraph("Millenium Termotanques")
                    .setFontSize(16)
                    .setBold()
                    .setMarginBottom(30));

            // Información específica del voucher
            document.add(new Paragraph("PRESENTE ESTE VOUCHER PARA PAGAR")
                    .setFontSize(14)
                    .setBold()
                    .setMarginBottom(10));

            document.add(new Paragraph("ID de operación: " + payment.getId()));
            document.add(new Paragraph("Fecha de creación: " + payment.getDateCreated()));
            document.add(new Paragraph("Fecha de vencimiento: " + payment.getDateOfExpiration()));
            document.add(new Paragraph("Monto a pagar: $" + payment.getTransactionAmount()));
            
            String paymentMethod = payment.getPaymentMethodId();
            String paymentMethodName = "rapipago".equals(paymentMethod) ? "Rapipago" : "Pago Fácil";
            document.add(new Paragraph("Método de pago: " + paymentMethodName));
            
            document.add(new Paragraph("Estado: " + payment.getStatus()));
            document.add(new Paragraph("Descripción: " + payment.getDescription()));

            // ✅ Información del voucher externo
            if (payment.getTransactionDetails() != null && payment.getTransactionDetails().getExternalResourceUrl() != null) {
                document.add(new Paragraph("Código de pago: " + payment.getTransactionDetails().getExternalResourceUrl()));
            }

            document.add(new Paragraph(" ").setMarginBottom(20));

            // Instrucciones específicas
            document.add(new Paragraph("INSTRUCCIONES:")
                    .setFontSize(14)
                    .setBold()
                    .setMarginBottom(10));

            document.add(new Paragraph("1. Acércate a cualquier sucursal de " + paymentMethodName));
            document.add(new Paragraph("2. Presenta este voucher o el código de operación"));
            document.add(new Paragraph("3. Realiza el pago en efectivo"));
            document.add(new Paragraph("4. Conserva el comprobante de pago"));

            document.add(new Paragraph(" ").setMarginBottom(20));
            document.add(new Paragraph("⏰ Válido hasta: " + payment.getDateOfExpiration())
                    .setFontSize(12)
                    .setItalic());

            document.close();
            
            LOGGER.info("Voucher PDF generado exitosamente para pago: {}", payment.getId());
            return baos.toByteArray();
            
        } catch (Exception e) {
            LOGGER.error("Error generando voucher PDF para pago {}: {}", payment.getId(), e.getMessage());
            throw new IOException("Error al generar el voucher PDF para el pago: " + payment.getId(), e);
        }
    }
    public Payment getPaymentById(Long paymentId) throws MPException, MPApiException {
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();
            LOGGER.info("Buscando pago con ID: {}", paymentId);
            
            // ✅ Agregar idempotency key para consultas también
            Map<String, String> customHeaders = new HashMap<>();
            customHeaders.put("x-idempotency-key", "GET_PAYMENT_" + paymentId + "_" + UUID.randomUUID().toString());
            
            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();
            
            Payment payment = client.get(paymentId, requestOptions);
            LOGGER.info("Pago encontrado - Estado: {}", payment.getStatus());
            
            return payment;
        } catch (MPApiException apiException) {
            LOGGER.error("Error al obtener pago {}: {}", paymentId, apiException.getApiResponse().getContent());
            throw apiException;
        } catch (MPException exception) {
            LOGGER.error("Error al obtener pago {}: {}", paymentId, exception.getMessage());
            throw exception;
        }
    }

    public byte[] generateReceiptPdf(Payment payment) throws IOException {
        LOGGER.info("Generando comprobante PDF para pago: {}", payment.getId());
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            // Encabezado
            document.add(new Paragraph("COMPROBANTE DE PAGO")
                    .setFontSize(20)
                    .setBold()
                    .setMarginBottom(20));

            document.add(new Paragraph("Millenium Termotanques")
                    .setFontSize(16)
                    .setBold()
                    .setMarginBottom(30));

            // Información del pago
            document.add(new Paragraph("INFORMACIÓN DE LA TRANSACCIÓN")
                    .setFontSize(14)
                    .setBold()
                    .setMarginBottom(10));

            document.add(new Paragraph("ID de operación: " + payment.getId()));
            document.add(new Paragraph("Fecha: " + (payment.getDateCreated() != null ? payment.getDateCreated() : "N/A")));
            document.add(new Paragraph("Monto: $" + (payment.getTransactionAmount() != null ? payment.getTransactionAmount() : "0.00")));
            document.add(new Paragraph("Estado: " + (payment.getStatus() != null ? payment.getStatus() : "N/A")));
            document.add(new Paragraph("Descripción: " + (payment.getDescription() != null ? payment.getDescription() : "Compra Millenium")));

            document.add(new Paragraph(" ").setMarginBottom(20));

            // Información del pagador
            document.add(new Paragraph("INFORMACIÓN DEL PAGADOR")
                    .setFontSize(14)
                    .setBold()
                    .setMarginBottom(10));

            if (payment.getPayer() != null) {
                document.add(new Paragraph("Email: " + (payment.getPayer().getEmail() != null ? payment.getPayer().getEmail() : "N/A")));
                
                if (payment.getPayer().getFirstName() != null) {
                    document.add(new Paragraph("Nombre: " + payment.getPayer().getFirstName()));
                }
                if (payment.getPayer().getLastName() != null) {
                    document.add(new Paragraph("Apellido: " + payment.getPayer().getLastName()));
                }
                if (payment.getPayer().getIdentification() != null) {
                    document.add(new Paragraph("Tipo de identificación: " + 
                        (payment.getPayer().getIdentification().getType() != null ? payment.getPayer().getIdentification().getType() : "N/A")));
                    document.add(new Paragraph("Número: " + 
                        (payment.getPayer().getIdentification().getNumber() != null ? payment.getPayer().getIdentification().getNumber() : "N/A")));
                }
            } else {
                document.add(new Paragraph("Información del pagador no disponible"));
            }

            document.add(new Paragraph(" ").setMarginBottom(30));
            document.add(new Paragraph("Gracias por su compra")
                    .setFontSize(12)
                    .setItalic());

            document.close();
            
            LOGGER.info("Comprobante PDF generado exitosamente para pago: {}", payment.getId());
            return baos.toByteArray();
            
        } catch (Exception e) {
            LOGGER.error("Error generando PDF para pago {}: {}", payment.getId(), e.getMessage());
            throw new IOException("Error al generar el comprobante PDF para el pago: " + payment.getId(), e);
        }
    }

    /**
     * ✅ Genera una clave de idempotencia única basada en los datos del pago
     * Esto previene duplicados si se envía la misma request múltiples veces
     */
    private String generateIdempotencyKey(CardPaymentDTO cardPaymentDTO) {
        try {
            String baseData = cardPaymentDTO.getPayer().getEmail() + 
                             "_" + cardPaymentDTO.getTransactionAmount() + 
                             "_" + cardPaymentDTO.getToken().hashCode() + 
                             "_" + System.currentTimeMillis();
            return "PAYMENT_" + UUID.nameUUIDFromBytes(baseData.getBytes()).toString();
        } catch (Exception e) {
            // Fallback a UUID aleatorio si hay algún error
            LOGGER.warn("Error generando idempotency key, usando UUID aleatorio: {}", e.getMessage());
            return "PAYMENT_" + UUID.randomUUID().toString();
        }
    }

    /**
     * ✅ Método adicional para procesar pagos con opciones personalizadas
     */
    public PaymentResponseDTO processPaymentWithOptions(CardPaymentDTO cardPaymentDTO, MPRequestOptions customOptions) {
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();

            PaymentCreateRequest paymentCreateRequest = buildPaymentCreateRequest(cardPaymentDTO);
            
            // Usar las opciones personalizadas proporcionadas
            Payment payment = client.create(paymentCreateRequest, customOptions);

            LOGGER.info("✅ Pago creado con opciones personalizadas - ID: {}", payment.getId());
            
            return new PaymentResponseDTO(
                    payment.getId(),
                    String.valueOf(payment.getStatus()),
                    payment.getStatusDetail(),
                    payment.getDateCreated(),
                    payment.getTransactionAmount());

        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API Mercado Pago con opciones personalizadas - Status: {}", apiException.getStatusCode());
            LOGGER.error("❌ Error Message: {}", apiException.getMessage());
            // ✅ CORREGIDO: Pasar la excepción como causa
            throw new MercadoPagoException(
                "Error Mercado Pago: " + apiException.getApiResponse().getContent(),
                apiException
            );
        } catch (MPException exception) {
            LOGGER.error("❌ Error Mercado Pago con opciones personalizadas: {}", exception.getMessage());
            throw new MercadoPagoException("Error de conexión con Mercado Pago: " + exception.getMessage(), exception);
        }
    }

    /**
     * ✅ Método auxiliar para construir el request
     */
    private PaymentCreateRequest buildPaymentCreateRequest(CardPaymentDTO cardPaymentDTO) {
        String description = cardPaymentDTO.getProductDescription() != null ? 
                           cardPaymentDTO.getProductDescription() : 
                           "Compra de termotanques Millenium";

        String firstName = cardPaymentDTO.getPayer().getFirstName() != null ? 
                          cardPaymentDTO.getPayer().getFirstName() : "Cliente";
        String lastName = cardPaymentDTO.getPayer().getLastName() != null ? 
                         cardPaymentDTO.getPayer().getLastName() : "Millenium";

        String notificationUrl = appBaseUrl + "/process_payment/webhooks/mercadopago";

        return PaymentCreateRequest.builder()
                .transactionAmount(cardPaymentDTO.getTransactionAmount())
                .token(cardPaymentDTO.getToken())
                .description(description)
                .installments(cardPaymentDTO.getInstallments())
                .paymentMethodId(cardPaymentDTO.getPaymentMethodId())
                .notificationUrl(notificationUrl)
                .payer(
                        PaymentPayerRequest.builder()
                                .email(cardPaymentDTO.getPayer().getEmail())
                                .firstName(firstName)
                                .lastName(lastName)
                                .identification(
                                        IdentificationRequest.builder()
                                                .type(cardPaymentDTO.getPayer().getIdentification().getType())
                                                .number(cardPaymentDTO.getPayer().getIdentification().getNumber())
                                                .build())
                                .build())
                .build();
    }

    /**
     * ✅ Método para verificar el estado de un pago
     */
    public String checkPaymentStatus(Long paymentId) {
        try {
            Payment payment = getPaymentById(paymentId);
            String status = String.valueOf(payment.getStatus());
            LOGGER.info("Estado del pago {}: {}", paymentId, status);
            return status;
        } catch (MPException | MPApiException e) {
            LOGGER.error("Error verificando estado del pago {}: {}", paymentId, e.getMessage());
            throw new MercadoPagoException("Error verificando estado del pago: " + e.getMessage(), e);
        }
    }
// EN TU CardPaymentService.java - AGREGA ESTE MÉTODO:

/**
 * ✅ NUEVO MÉTODO: Procesar pagos desde Mercado Pago Bricks (Wallet & Payment)
 * Este es el endpoint que te falta para los Bricks
 */
public PaymentResponseDTO processBricksPayment(BricksPaymentDTO bricksPaymentDTO) {
    try {
        MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
        PaymentClient client = new PaymentClient();

        String notificationUrl = appBaseUrl + "/process_payment/webhooks/mercadopago";

        LOGGER.info("=== CREANDO PAGO DESDE BRICKS ===");
        LOGGER.info("Brick Type: {}", bricksPaymentDTO.getBrickType());
        LOGGER.info("Monto: {}", bricksPaymentDTO.getAmount());
        LOGGER.info("Token: {}", bricksPaymentDTO.getToken());
        LOGGER.info("Payment Method: {}", bricksPaymentDTO.getPaymentMethodId());

        // ✅ Configurar idempotency key para Bricks
        Map<String, String> customHeaders = new HashMap<>();
        String idempotencyKey = "BRICKS_" + UUID.randomUUID().toString();
        customHeaders.put("x-idempotency-key", idempotencyKey);

        MPRequestOptions requestOptions = MPRequestOptions.builder()
            .customHeaders(customHeaders)
            .build();

        // ✅ Construir request específico para Bricks
        PaymentCreateRequest paymentCreateRequest = buildBricksPaymentRequest(bricksPaymentDTO, notificationUrl);

        Payment payment = client.create(paymentCreateRequest, requestOptions);

        LOGGER.info("✅ Pago desde Bricks creado exitosamente - ID: {}, Estado: {}", 
                   payment.getId(), payment.getStatus());

        return new PaymentResponseDTO(
                payment.getId(),
                String.valueOf(payment.getStatus()),
                payment.getStatusDetail(),
                payment.getDateCreated(),
                payment.getTransactionAmount());

    } catch (MPApiException apiException) {
        LOGGER.error("❌ Error API Mercado Pago en Bricks - Status: {}", apiException.getStatusCode());
        LOGGER.error("❌ API Response: {}", apiException.getApiResponse().getContent());
        
        throw new MercadoPagoException(
            "Error Mercado Pago Bricks: " + apiException.getApiResponse().getContent(),
            apiException
        );
    } catch (MPException exception) {
        LOGGER.error("❌ Error Mercado Pago Bricks: {}", exception.getMessage());
        throw new MercadoPagoException("Error de conexión con Mercado Pago: " + exception.getMessage(), exception);
    }
}

/**
 * ✅ Construir el PaymentCreateRequest para Bricks
 */
private PaymentCreateRequest buildBricksPaymentRequest(BricksPaymentDTO bricksPaymentDTO, String notificationUrl) {
    // ✅ Descripción basada en el tipo de Brick
    String description = bricksPaymentDTO.getDescription() != null ? 
                        bricksPaymentDTO.getDescription() : 
                        "Pago desde " + bricksPaymentDTO.getBrickType() + " Brick";

    // ✅ Para Wallet Brick, el payment method puede ser 'account_money'
    String paymentMethodId = bricksPaymentDTO.getPaymentMethodId();
    if ("wallet".equals(bricksPaymentDTO.getBrickType()) && paymentMethodId == null) {
        paymentMethodId = "account_money";
    }

    // ✅ Payer information
    PaymentPayerRequest payerRequest = PaymentPayerRequest.builder()
            .email(bricksPaymentDTO.getPayerEmail() != null ? bricksPaymentDTO.getPayerEmail() : "guest@millenium.com")
            .firstName(bricksPaymentDTO.getPayerFirstName() != null ? bricksPaymentDTO.getPayerFirstName() : "Cliente")
            .lastName(bricksPaymentDTO.getPayerLastName() != null ? bricksPaymentDTO.getPayerLastName() : "Millenium")
            .build();

    // ✅ Construir el request del pago
    return PaymentCreateRequest.builder()
            .transactionAmount(bricksPaymentDTO.getAmount())
            .token(bricksPaymentDTO.getToken())
            .description(description)
            .installments(bricksPaymentDTO.getInstallments() != null ? bricksPaymentDTO.getInstallments() : 1)
            .paymentMethodId(paymentMethodId)
            .notificationUrl(notificationUrl)
            .payer(payerRequest)
            .build();
}

    /**
 * ✅ NUEVO MÉTODO: Procesar pagos en efectivo (Pago Fácil y Rapipago)
 */
public PaymentResponseDTO processCashPayment(BricksPaymentDTO cashPaymentDTO) {
    try {
        MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
        PaymentClient client = new PaymentClient();

        String notificationUrl = appBaseUrl + "/process_payment/webhooks/mercadopago";

        LOGGER.info("=== CREANDO PAGO EN EFECTIVO ===");
        LOGGER.info("Método: {}", cashPaymentDTO.getPaymentMethodId());
        LOGGER.info("Monto: {}", cashPaymentDTO.getAmount());
        LOGGER.info("Email: {}", cashPaymentDTO.getPayerEmail());
        LOGGER.info("Nombre: {} {}", cashPaymentDTO.getPayerFirstName(), cashPaymentDTO.getPayerLastName());

        // ✅ Validar que sea un método de pago en efectivo válido
        String paymentMethodId = cashPaymentDTO.getPaymentMethodId();
        if (!"rapipago".equals(paymentMethodId) && !"pagofacil".equals(paymentMethodId)) {
            throw new MercadoPagoException("Método de pago no válido para efectivo. Use 'rapipago' o 'pagofacil'");
        }

        // ✅ Configurar idempotency key
        Map<String, String> customHeaders = new HashMap<>();
        String idempotencyKey = "CASH_" + UUID.randomUUID().toString();
        customHeaders.put("x-idempotency-key", idempotencyKey);

        MPRequestOptions requestOptions = MPRequestOptions.builder()
            .customHeaders(customHeaders)
            .build();

        // ✅ Fecha de expiración (3 días hábiles)
        OffsetDateTime expirationDate = OffsetDateTime.now().plusDays(3);

        // ✅ Construir request específico para pagos en efectivo
        PaymentCreateRequest paymentCreateRequest = buildCashPaymentRequest(cashPaymentDTO, notificationUrl, expirationDate);

        Payment payment = client.create(paymentCreateRequest, requestOptions);

        LOGGER.info("✅ Pago en efectivo creado exitosamente - ID: {}, Estado: {}", 
                   payment.getId(), payment.getStatus());
        LOGGER.info("Fecha de expiración: {}", expirationDate);
        LOGGER.info("URL externa: {}", payment.getTransactionDetails() != null ? 
                   payment.getTransactionDetails().getExternalResourceUrl() : "N/A");

        return new PaymentResponseDTO(
                payment.getId(),
                String.valueOf(payment.getStatus()),
                payment.getStatusDetail(),
                payment.getDateCreated(),
                payment.getTransactionAmount());

    } catch (MPApiException apiException) {
        LOGGER.error("❌ Error API Mercado Pago en pago efectivo - Status: {}", apiException.getStatusCode());
        LOGGER.error("❌ API Response: {}", apiException.getApiResponse().getContent());
        
        throw new MercadoPagoException(
            "Error Mercado Pago pago efectivo: " + apiException.getApiResponse().getContent(),
            apiException
        );
    } catch (MPException exception) {
        LOGGER.error("❌ Error Mercado Pago pago efectivo: {}", exception.getMessage());
        throw new MercadoPagoException("Error de conexión con Mercado Pago: " + exception.getMessage(), exception);
    }
}

/**
 * ✅ Construir el PaymentCreateRequest para pagos en efectivo
 */
private PaymentCreateRequest buildCashPaymentRequest(BricksPaymentDTO cashPaymentDTO, String notificationUrl, OffsetDateTime expirationDate) {
    
    // ✅ Descripción específica para pagos en efectivo
    String paymentMethodName = "rapipago".equals(cashPaymentDTO.getPaymentMethodId()) ? "Rapipago" : "Pago Fácil";
    String description = cashPaymentDTO.getDescription() != null ? 
                        cashPaymentDTO.getDescription() : 
                        "Pago en " + paymentMethodName + " - Millenium";

    // ✅ Información del pagador con identificación
    PaymentPayerRequest payerRequest = PaymentPayerRequest.builder()
            .email(cashPaymentDTO.getPayerEmail() != null ? cashPaymentDTO.getPayerEmail() : "guest@millenium.com")
            .firstName(cashPaymentDTO.getPayerFirstName() != null ? cashPaymentDTO.getPayerFirstName() : "Cliente")
            .lastName(cashPaymentDTO.getPayerLastName() != null ? cashPaymentDTO.getPayerLastName() : "Millenium")
            .identification(
                IdentificationRequest.builder()
                    .type(cashPaymentDTO.getIdentificationType() != null ? cashPaymentDTO.getIdentificationType() : "DNI")
                    .number(cashPaymentDTO.getIdentificationNumber() != null ? cashPaymentDTO.getIdentificationNumber() : "00000000")
                    .build()
            )
            .build();

    // ✅ Construir el request del pago en efectivo
    // NOTA: Para pagos en efectivo NO se usa token
    return PaymentCreateRequest.builder()
            .transactionAmount(cashPaymentDTO.getAmount())
            .description(description)
            .paymentMethodId(cashPaymentDTO.getPaymentMethodId())
            .dateOfExpiration(expirationDate) // ✅ Fecha de expiración importante
            .notificationUrl(notificationUrl)
            .payer(payerRequest)
            .build();
}
    /**
     * ✅ Método para cancelar un pago
     */
    public PaymentResponseDTO cancelPayment(Long paymentId) {
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();

            // ✅ Agregar idempotency key para cancelación
            Map<String, String> customHeaders = new HashMap<>();
            customHeaders.put("x-idempotency-key", "CANCEL_" + paymentId + "_" + UUID.randomUUID().toString());

            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();

            Payment cancelledPayment = client.cancel(paymentId, requestOptions);
            
            LOGGER.info("✅ Pago cancelado exitosamente - ID: {}, Nuevo estado: {}", 
                       cancelledPayment.getId(), cancelledPayment.getStatus());

            return new PaymentResponseDTO(
                    cancelledPayment.getId(),
                    String.valueOf(cancelledPayment.getStatus()),
                    cancelledPayment.getStatusDetail(),
                    cancelledPayment.getDateCreated(),
                    cancelledPayment.getTransactionAmount());

        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error cancelando pago {}: {}", paymentId, apiException.getApiResponse().getContent());
            throw new MercadoPagoException("Error cancelando pago: " + apiException.getApiResponse().getContent(), apiException);
        } catch (MPException exception) {
            LOGGER.error("❌ Error cancelando pago {}: {}", paymentId, exception.getMessage());
            throw new MercadoPagoException("Error cancelando pago: " + exception.getMessage(), exception);
        }
    }
}
