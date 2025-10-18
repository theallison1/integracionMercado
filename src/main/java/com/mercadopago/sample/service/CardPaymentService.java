package com.mercadopago.sample.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.common.IdentificationRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.client.common.MPRequestOptions;
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
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class CardPaymentService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CardPaymentService.class);

    @Value("${mercado_pago_sample_access_token}")
    private String mercadoPagoAccessToken;

    @Value("${app.base.url:http://localhost:8080}")
    private String appBaseUrl;

    public PaymentResponseDTO processPayment(CardPaymentDTO cardPaymentDTO) {
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);

            PaymentClient client = new PaymentClient();

            // URL de notificación para webhooks
            String notificationUrl = appBaseUrl + "/webhooks/mercadopago";

            PaymentCreateRequest paymentCreateRequest =
                    PaymentCreateRequest.builder()
                            .transactionAmount(cardPaymentDTO.getTransactionAmount())
                            .token(cardPaymentDTO.getToken())
                            .description(cardPaymentDTO.getProductDescription())
                            .installments(cardPaymentDTO.getInstallments())
                            .paymentMethodId(cardPaymentDTO.getPaymentMethodId())
                            .notificationUrl(notificationUrl)
                            .payer(
                                    PaymentPayerRequest.builder()
                                            .email(cardPaymentDTO.getPayer().getEmail())
                                            .firstName(cardPaymentDTO.getPayer().getFirstName())
                                            .lastName(cardPaymentDTO.getPayer().getLastName())
                                            .identification(
                                                    IdentificationRequest.builder()
                                                            .type(cardPaymentDTO.getPayer().getIdentification().getType())
                                                            .number(cardPaymentDTO.getPayer().getIdentification().getNumber())
                                                            .build())
                                            .build())
                            .build();

            // Configurar idempotency key para evitar pagos duplicados
            Map<String, String> customHeaders = new HashMap<>();
            String idempotencyKey = generateIdempotencyKey(cardPaymentDTO);
            customHeaders.put("x-idempotency-key", idempotencyKey);

            MPRequestOptions requestOptions = MPRequestOptions.builder()
                    .customHeaders(customHeaders)
                    .build();

            LOGGER.info("Creando pago con idempotency key: {}", idempotencyKey);

            Payment payment = client.create(paymentCreateRequest, requestOptions);

            LOGGER.info("Pago creado exitosamente - ID: {}, Estado: {}", 
                       payment.getId(), payment.getStatus());
            LOGGER.info("URL de notificación configurada: {}", notificationUrl);

            return new PaymentResponseDTO(
                    payment.getId(),
                    String.valueOf(payment.getStatus()),
                    payment.getStatusDetail());
        } catch (MPApiException apiException) {
            LOGGER.error("Error API Mercado Pago: {}", apiException.getApiResponse().getContent());
            LOGGER.error("Código de error: {}, Mensaje: {}", 
                        apiException.getStatusCode(), apiException.getMessage());
            throw new MercadoPagoException(apiException.getApiResponse().getContent());
        } catch (MPException exception) {
            LOGGER.error("Error Mercado Pago: {}", exception.getMessage());
            throw new MercadoPagoException(exception.getMessage());
        }
    }

    // Generar una clave única de idempotencia
    private String generateIdempotencyKey(CardPaymentDTO cardPaymentDTO) {
        // Puedes personalizar esta lógica según tus necesidades
        String baseKey = cardPaymentDTO.getToken() + 
                        cardPaymentDTO.getTransactionAmount() + 
                        cardPaymentDTO.getPayer().getEmail();
        
        // Generar un UUID único basado en los datos del pago
        return UUID.nameUUIDFromBytes(baseKey.getBytes()).toString();
    }

    public Payment getPaymentById(Long paymentId) throws MPException, MPApiException {
        MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
        PaymentClient client = new PaymentClient();
        
        // También puedes usar idempotency key para consultas si es necesario
        Map<String, String> customHeaders = new HashMap<>();
        customHeaders.put("x-idempotency-key", "query-" + paymentId);
        
        MPRequestOptions requestOptions = MPRequestOptions.builder()
                .customHeaders(customHeaders)
                .build();
                
        return client.get(paymentId, requestOptions);
    }

    public byte[] generateReceiptPdf(Payment payment) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDocument = new PdfDocument(writer);
        Document document = new Document(pdfDocument);

        document.add(new Paragraph("Comprobante de Pago - Millenium Termotanques")
                .setFontSize(18)
                .setBold());
        document.add(new Paragraph("ID de operación: " + payment.getId()));
        document.add(new Paragraph("Fecha de transacción: " + payment.getDateCreated()));
        document.add(new Paragraph("Monto: $" + payment.getTransactionAmount()));
        document.add(new Paragraph("Estado: " + payment.getStatus()));
        document.add(new Paragraph("Descripción: " + payment.getDescription()));
        
        // Datos del pagador
        if (payment.getPayer() != null) {
            document.add(new Paragraph("Email: " + payment.getPayer().getEmail()));
            if (payment.getPayer().getFirstName() != null) {
                document.add(new Paragraph("Nombre: " + payment.getPayer().getFirstName()));
            }
            if (payment.getPayer().getLastName() != null) {
                document.add(new Paragraph("Apellido: " + payment.getPayer().getLastName()));
            }
            if (payment.getPayer().getIdentification() != null) {
                document.add(new Paragraph("Tipo de identificación: " + payment.getPayer().getIdentification().getType()));
                document.add(new Paragraph("Número: " + payment.getPayer().getIdentification().getNumber()));
            }
        }

        document.close();
        return baos.toByteArray();
    }
}
