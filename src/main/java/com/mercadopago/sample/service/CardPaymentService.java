package com.mercadopago.sample.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.common.IdentificationRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
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

            Payment payment = client.create(paymentCreateRequest);

            LOGGER.info("✅ Pago creado exitosamente - ID: {}, Estado: {}", 
                       payment.getId(), payment.getStatus());
            LOGGER.info("URL de notificación configurada: {}", notificationUrl);

            return new PaymentResponseDTO(
                    payment.getId(),
                    String.valueOf(payment.getStatus()),
                    payment.getStatusDetail());

        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API Mercado Pago - Status: {}", apiException.getStatusCode());
            LOGGER.error("❌ Error Message: {}", apiException.getMessage());
            LOGGER.error("❌ API Response: {}", apiException.getApiResponse().getContent());
            
            // Log detallado para debugging
            if (apiException.getStatusCode() == 400) {
                LOGGER.error("=== ERROR 400 - BAD REQUEST ===");
                LOGGER.error("Posible problema con los datos enviados a Mercado Pago");
            } else if (apiException.getStatusCode() == 403) {
                LOGGER.error("=== ERROR 403 - FORBIDDEN ===");
                LOGGER.error("Problema de credenciales o políticas de seguridad");
            } else if (apiException.getStatusCode() == 500) {
                LOGGER.error("=== ERROR 500 - INTERNAL SERVER ERROR ===");
                LOGGER.error("Error interno de Mercado Pago");
            }
            
            throw new MercadoPagoException(apiException.getApiResponse().getContent());
        } catch (MPException exception) {
            LOGGER.error("❌ Error Mercado Pago: {}", exception.getMessage());
            throw new MercadoPagoException(exception.getMessage());
        } catch (Exception exception) {
            LOGGER.error("❌ Error inesperado: {}", exception.getMessage());
            throw new MercadoPagoException("Error interno del servidor: " + exception.getMessage());
        }
    }

    public Payment getPaymentById(Long paymentId) throws MPException, MPApiException {
        try {
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            PaymentClient client = new PaymentClient();
            LOGGER.info("Buscando pago con ID: {}", paymentId);
            
            Payment payment = client.get(paymentId);
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
            document.add(new Paragraph("Fecha: " + payment.getDateCreated()));
            document.add(new Paragraph("Monto: $" + payment.getTransactionAmount()));
            document.add(new Paragraph("Estado: " + payment.getStatus()));
            document.add(new Paragraph("Descripción: " + payment.getDescription()));

            document.add(new Paragraph(" ").setMarginBottom(20));

            // Información del pagador
            document.add(new Paragraph("INFORMACIÓN DEL PAGADOR")
                    .setFontSize(14)
                    .setBold()
                    .setMarginBottom(10));

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

            document.add(new Paragraph(" ").setMarginBottom(30));
            document.add(new Paragraph("Gracias por su compra")
                    .setFontSize(12)
                    .setItalic());

            document.close();
            
            LOGGER.info("Comprobante PDF generado exitosamente");
            return baos.toByteArray();
            
        } catch (Exception e) {
            LOGGER.error("Error generando PDF: {}", e.getMessage());
            throw new IOException("Error al generar el comprobante PDF", e);
        }
    }
}
