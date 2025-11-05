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
import com.mercadopago.sample.dto.BricksPaymentDTO;
import com.mercadopago.sample.exception.MercadoPagoException;
import com.mercadopago.sample.util.MercadoPagoLogger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class CardPaymentService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CardPaymentService.class);

    @Value("${mercado_pago_sample_access_token}")
    private String mercadoPagoAccessToken;

    @Value("${app.base.url:https://integracionmercado.onrender.com}")
    private String appBaseUrl;

    @Autowired
    private MercadoPagoLogger mercadoPagoLogger;

    /**
     * ✅ PROCESAR PAGO CON TARJETA
     */
    public PaymentResponseDTO processPayment(CardPaymentDTO cardPaymentDTO) {
        String endpoint = "/v1/payments";
        
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();

            String notificationUrl = appBaseUrl + "/process_payment/webhooks/mercadopago";

            // ✅ Datos básicos
            String description = cardPaymentDTO.getProductDescription() != null ? 
                               cardPaymentDTO.getProductDescription() : 
                               "Compra de termotanques Millenium";

            String firstName = cardPaymentDTO.getPayer().getFirstName() != null ? 
                              cardPaymentDTO.getPayer().getFirstName() : "Cliente";
            String lastName = cardPaymentDTO.getPayer().getLastName() != null ? 
                             cardPaymentDTO.getPayer().getLastName() : "Millenium";

            LOGGER.info("=== CREANDO PAGO EN MERCADO PAGO ===");
            LOGGER.info("Descripción: {}", description);
            LOGGER.info("Monto: {}", cardPaymentDTO.getTransactionAmount());

            // ✅ Configurar headers
            Map<String, String> customHeaders = new HashMap<>();
            String idempotencyKey = generateIdempotencyKey(cardPaymentDTO);
            customHeaders.put("x-idempotency-key", idempotencyKey);

            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();

            // ✅ Construir request COMPLETO
            PaymentCreateRequest paymentCreateRequest =
                    PaymentCreateRequest.builder()
                            .transactionAmount(cardPaymentDTO.getTransactionAmount())
                            .token(cardPaymentDTO.getToken())
                            .description(description)
                            .installments(cardPaymentDTO.getInstallments())
                            .paymentMethodId(cardPaymentDTO.getPaymentMethodId())
                            .notificationUrl(notificationUrl)
                            .capture(true)
                            .binaryMode(false)
                            .externalReference("ORDER_" + UUID.randomUUID().toString())
                            .statementDescriptor("MILLENIUM")
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

            // ✅ Logging y ejecución
            mercadoPagoLogger.logRequest(endpoint, paymentCreateRequest, mercadoPagoAccessToken);
            Payment payment = client.create(paymentCreateRequest, requestOptions);
            mercadoPagoLogger.logResponse(endpoint, payment.toString(), 200);

            LOGGER.info("✅ Pago creado exitosamente - ID: {}, Estado: {}", 
                       payment.getId(), payment.getStatus());

            return new PaymentResponseDTO(
                    payment.getId(),
                    String.valueOf(payment.getStatus()),
                    payment.getStatusDetail(),
                    payment.getDateCreated(),
                    payment.getTransactionAmount());

        } catch (MPApiException apiException) {
            mercadoPagoLogger.logApiException(
                endpoint, 
                apiException.getMessage(),
                apiException.getApiResponse().getContent(),
                apiException.getStatusCode()
            );
            throw new MercadoPagoException(
                "Error Mercado Pago - Status: " + apiException.getStatusCode() + " - " + apiException.getApiResponse().getContent(),
                apiException
            );
        } catch (Exception exception) {
            mercadoPagoLogger.logMPException(endpoint, exception.getMessage());
            throw new MercadoPagoException("Error procesando pago: " + exception.getMessage(), exception);
        }
    }

    /**
     * ✅ PROCESAR PAGO DESDE BRICKS
     */
    public PaymentResponseDTO processBricksPayment(BricksPaymentDTO bricksPaymentDTO) {
        String endpoint = "/v1/payments";
        
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();

            String notificationUrl = appBaseUrl + "/process_payment/webhooks/mercadopago";

            LOGGER.info("=== CREANDO PAGO DESDE BRICKS ===");
            LOGGER.info("Brick Type: {}", bricksPaymentDTO.getBrickType());
            LOGGER.info("Monto: {}", bricksPaymentDTO.getAmount());

            // ✅ Configurar headers
            Map<String, String> customHeaders = new HashMap<>();
            String idempotencyKey = "BRICKS_" + UUID.randomUUID().toString();
            customHeaders.put("x-idempotency-key", idempotencyKey);

            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();

            // ✅ Construir request
            PaymentCreateRequest paymentCreateRequest = buildBricksPaymentRequest(bricksPaymentDTO, notificationUrl);

            // ✅ Logging y ejecución
            mercadoPagoLogger.logRequest(endpoint, paymentCreateRequest, mercadoPagoAccessToken);
            Payment payment = client.create(paymentCreateRequest, requestOptions);
            mercadoPagoLogger.logResponse(endpoint, payment.toString(), 200);

            LOGGER.info("✅ Pago desde Bricks creado exitosamente - ID: {}", payment.getId());

            return new PaymentResponseDTO(
                    payment.getId(),
                    String.valueOf(payment.getStatus()),
                    payment.getStatusDetail(),
                    payment.getDateCreated(),
                    payment.getTransactionAmount());

        } catch (MPApiException apiException) {
            mercadoPagoLogger.logApiException(
                "/v1/payments", 
                apiException.getMessage(),
                apiException.getApiResponse().getContent(),
                apiException.getStatusCode()
            );
            throw new MercadoPagoException(
                "Error Mercado Pago Bricks: " + apiException.getApiResponse().getContent(),
                apiException
            );
        } catch (Exception exception) {
            mercadoPagoLogger.logMPException("/v1/payments", exception.getMessage());
            throw new MercadoPagoException("Error procesando pago Bricks: " + exception.getMessage(), exception);
        }
    }

    /**
     * ✅ PROCESAR PAGO EN EFECTIVO
     */
    public PaymentResponseDTO processCashPayment(BricksPaymentDTO cashPaymentDTO) {
        String endpoint = "/v1/payments";
        
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();

            String notificationUrl = appBaseUrl + "/process_payment/webhooks/mercadopago";

            LOGGER.info("=== CREANDO PAGO EN EFECTIVO ===");
            LOGGER.info("Método: {}", cashPaymentDTO.getPaymentMethodId());
            LOGGER.info("Monto: {}", cashPaymentDTO.getAmount());

            // ✅ Validar método de pago
            String paymentMethodId = cashPaymentDTO.getPaymentMethodId();
            if (!"rapipago".equals(paymentMethodId) && !"pagofacil".equals(paymentMethodId)) {
                throw new MercadoPagoException("Método de pago no válido para efectivo. Use 'rapipago' o 'pagofacil'");
            }

            // ✅ Configurar headers
            Map<String, String> customHeaders = new HashMap<>();
            String idempotencyKey = "CASH_" + UUID.randomUUID().toString();
            customHeaders.put("x-idempotency-key", idempotencyKey);

            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();

            // ✅ Fecha de expiración
            OffsetDateTime expirationDate = OffsetDateTime.now().plusDays(3);

            // ✅ Construir request
            PaymentCreateRequest paymentCreateRequest = buildCashPaymentRequest(cashPaymentDTO, notificationUrl, expirationDate);

            // ✅ Logging y ejecución
            mercadoPagoLogger.logRequest(endpoint, paymentCreateRequest, mercadoPagoAccessToken);
            Payment payment = client.create(paymentCreateRequest, requestOptions);
            mercadoPagoLogger.logResponse(endpoint, payment.toString(), 200);

            LOGGER.info("✅ Pago en efectivo creado exitosamente - ID: {}", payment.getId());

            return new PaymentResponseDTO(
                    payment.getId(),
                    String.valueOf(payment.getStatus()),
                    payment.getStatusDetail(),
                    payment.getDateCreated(),
                    payment.getTransactionAmount());

        } catch (MPApiException apiException) {
            mercadoPagoLogger.logApiException(
                "/v1/payments", 
                apiException.getMessage(),
                apiException.getApiResponse().getContent(),
                apiException.getStatusCode()
            );
            throw new MercadoPagoException(
                "Error Mercado Pago pago efectivo: " + apiException.getApiResponse().getContent(),
                apiException
            );
        } catch (Exception exception) {
            mercadoPagoLogger.logMPException("/v1/payments", exception.getMessage());
            throw new MercadoPagoException("Error procesando pago efectivo: " + exception.getMessage(), exception);
        }
    }

    /**
     * ✅ CONSTRUIR PAYMENT REQUEST PARA BRICKS
     */
    private PaymentCreateRequest buildBricksPaymentRequest(BricksPaymentDTO bricksPaymentDTO, String notificationUrl) {
        String description = bricksPaymentDTO.getDescription() != null ? 
                            bricksPaymentDTO.getDescription() : 
                            "Pago desde " + bricksPaymentDTO.getBrickType() + " Brick";

        String paymentMethodId = bricksPaymentDTO.getPaymentMethodId();
        if ("wallet".equals(bricksPaymentDTO.getBrickType()) && paymentMethodId == null) {
            paymentMethodId = "account_money";
        }

        PaymentPayerRequest payerRequest = PaymentPayerRequest.builder()
                .email(bricksPaymentDTO.getPayerEmail() != null ? bricksPaymentDTO.getPayerEmail() : "guest@millenium.com")
                .firstName(bricksPaymentDTO.getPayerFirstName() != null ? bricksPaymentDTO.getPayerFirstName() : "Cliente")
                .lastName(bricksPaymentDTO.getPayerLastName() != null ? bricksPaymentDTO.getPayerLastName() : "Millenium")
                .build();

        // ✅ Usar orderNumber si está disponible
        String externalReference = bricksPaymentDTO.getOrderNumber() != null ? 
                                 bricksPaymentDTO.getOrderNumber() : 
                                 "BRICKS_" + UUID.randomUUID().toString();

        return PaymentCreateRequest.builder()
                .transactionAmount(bricksPaymentDTO.getAmount())
                .token(bricksPaymentDTO.getToken())
                .description(description)
                .installments(bricksPaymentDTO.getInstallments() != null ? bricksPaymentDTO.getInstallments() : 1)
                .paymentMethodId(paymentMethodId)
                .notificationUrl(notificationUrl)
                .capture(true)
                .binaryMode(false)
                .externalReference(externalReference)
                .statementDescriptor("MILLENIUM")
                .payer(payerRequest)
                .build();
    }

    /**
     * ✅ CONSTRUIR PAYMENT REQUEST PARA EFECTIVO
     */
    private PaymentCreateRequest buildCashPaymentRequest(BricksPaymentDTO cashPaymentDTO, String notificationUrl, OffsetDateTime expirationDate) {
        String paymentMethodName = "rapipago".equals(cashPaymentDTO.getPaymentMethodId()) ? "Rapipago" : "Pago Fácil";
        String description = cashPaymentDTO.getDescription() != null ? 
                            cashPaymentDTO.getDescription() : 
                            "Pago en " + paymentMethodName + " - Millenium";

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

        // ✅ Usar orderNumber si está disponible
        String externalReference = cashPaymentDTO.getOrderNumber() != null ? 
                                 cashPaymentDTO.getOrderNumber() : 
                                 "CASH_" + UUID.randomUUID().toString();

        return PaymentCreateRequest.builder()
                .transactionAmount(cashPaymentDTO.getAmount())
                .description(description)
                .paymentMethodId(cashPaymentDTO.getPaymentMethodId())
                .dateOfExpiration(expirationDate)
                .notificationUrl(notificationUrl)
                .capture(true)
                .binaryMode(false)
                .externalReference(externalReference)
                .statementDescriptor("MILLENIUM")
                .payer(payerRequest)
                .build();
    }

    public Payment getPaymentById(Long paymentId) throws MPException, MPApiException {
        String endpoint = "/v1/payments/" + paymentId;
        
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();
            
            Map<String, String> customHeaders = new HashMap<>();
            customHeaders.put("x-idempotency-key", "GET_PAYMENT_" + paymentId + "_" + UUID.randomUUID().toString());
            
            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();
            
            mercadoPagoLogger.logRequest(endpoint, "GET_PAYMENT_QUERY", mercadoPagoAccessToken);
            Payment payment = client.get(paymentId, requestOptions);
            mercadoPagoLogger.logResponse(endpoint, payment.toString(), 200);
            
            return payment;
        } catch (MPApiException apiException) {
            mercadoPagoLogger.logApiException(
                endpoint,
                apiException.getMessage(),
                apiException.getApiResponse().getContent(),
                apiException.getStatusCode()
            );
            throw apiException;
        } catch (MPException exception) {
            mercadoPagoLogger.logMPException(endpoint, exception.getMessage());
            throw exception;
        }
    }

    /**
     * ✅ GENERAR IDEMPOTENCY KEY
     */
    private String generateIdempotencyKey(CardPaymentDTO cardPaymentDTO) {
        try {
            String baseData = cardPaymentDTO.getPayer().getEmail() + 
                             "_" + cardPaymentDTO.getTransactionAmount() + 
                             "_" + cardPaymentDTO.getToken().hashCode() + 
                             "_" + System.currentTimeMillis();
            return "PAYMENT_" + UUID.nameUUIDFromBytes(baseData.getBytes()).toString();
        } catch (Exception e) {
            return "PAYMENT_" + UUID.randomUUID().toString();
        }
    }

    /**
     * ✅ MÉTODO PARA VERIFICAR ESTADO DE PAGO
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

    /**
     * ✅ MÉTODO PARA CANCELAR PAGO
     */
    public PaymentResponseDTO cancelPayment(Long paymentId) {
        String endpoint = "/v1/payments/" + paymentId + "/cancel";
        
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();

            Map<String, String> customHeaders = new HashMap<>();
            customHeaders.put("x-idempotency-key", "CANCEL_" + paymentId + "_" + UUID.randomUUID().toString());

            MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();

            mercadoPagoLogger.logRequest(endpoint, "CANCEL_PAYMENT_REQUEST", mercadoPagoAccessToken);
            Payment cancelledPayment = client.cancel(paymentId, requestOptions);
            mercadoPagoLogger.logResponse(endpoint, cancelledPayment.toString(), 200);
            
            LOGGER.info("✅ Pago cancelado exitosamente - ID: {}, Nuevo estado: {}", 
                       cancelledPayment.getId(), cancelledPayment.getStatus());

            return new PaymentResponseDTO(
                    cancelledPayment.getId(),
                    String.valueOf(cancelledPayment.getStatus()),
                    cancelledPayment.getStatusDetail(),
                    cancelledPayment.getDateCreated(),
                    cancelledPayment.getTransactionAmount());

        } catch (MPApiException apiException) {
            mercadoPagoLogger.logApiException(
                endpoint,
                apiException.getMessage(),
                apiException.getApiResponse().getContent(),
                apiException.getStatusCode()
            );
            throw new MercadoPagoException("Error cancelando pago: " + apiException.getApiResponse().getContent(), apiException);
        } catch (MPException exception) {
            mercadoPagoLogger.logMPException(endpoint, exception.getMessage());
            throw new MercadoPagoException("Error cancelando pago: " + exception.getMessage(), exception);
        }
    }

    // ... (MÉTODOS PDF SE MANTIENEN IGUAL)
    public byte[] generateCashVoucherPdf(Payment payment) throws IOException {
        // Tu código existente
        return new byte[0];
    }

    public byte[] generateReceiptPdf(Payment payment) throws IOException {
        // Tu código existente  
        return new byte[0];
    }
}
