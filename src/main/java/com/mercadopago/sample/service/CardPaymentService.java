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

            Payment payment = client.create(paymentCreateRequest);

            LOGGER.info("Pago creado exitosamente - ID: {}, Estado: {}", 
                       payment.getId(), payment.getStatus());
            LOGGER.info("URL de notificación configurada: {}", notificationUrl);

            return new PaymentResponseDTO(
                    payment.getId(),
                    String.valueOf(payment.getStatus()),
                    payment.getStatusDetail());
        } catch (MPApiException apiException) {
            LOGGER.error("Error API Mercado Pago - Status: {}", apiException.getStatusCode());
            LOGGER.error("Error Content: {}", apiException.getApiResponse().getContent());
            throw new MercadoPagoException(apiException.getApiResponse().getContent());
        } catch (MPException exception) {
            LOGGER.error("Error Mercado Pago: {}", exception.getMessage());
            throw new MercadoPagoException(exception.getMessage());
        }
    }

    public Payment getPaymentById(Long paymentId) throws MPException, MPApiException {
        MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
        PaymentClient client = new PaymentClient();
        return client.get(paymentId);
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
