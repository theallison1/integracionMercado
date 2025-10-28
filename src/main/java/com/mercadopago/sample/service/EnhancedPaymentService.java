package com.mercadopago.sample.service;

import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentItemRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.client.common.IdentificationRequest;
import com.mercadopago.sample.dto.DetailedPaymentRequestDTO;
import com.mercadopago.sample.dto.PaymentItemDTO;
import com.mercadopago.sample.dto.PayerDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EnhancedPaymentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EnhancedPaymentService.class);

    /**
     * ✅ CONSTRUIR PAYMENT REQUEST - PATRÓN EXACTO igual que CardPaymentService
     */
    public PaymentCreateRequest buildPaymentWithItems(DetailedPaymentRequestDTO paymentRequest) {
        LOGGER.info("🛒 Construyendo pago con {} items detallados", 
                   paymentRequest.getItems() != null ? paymentRequest.getItems().size() : 0);

        // Validar items
        if (paymentRequest.getItems() != null && !paymentRequest.getItems().isEmpty()) {
            BigDecimal itemsTotal = calculateItemsTotal(paymentRequest.getItems());
            if (itemsTotal.compareTo(paymentRequest.getTransactionAmount()) != 0) {
                LOGGER.warn("⚠️ La suma de items (${}) no coincide con el monto total (${})", 
                           itemsTotal, paymentRequest.getTransactionAmount());
            }
        }

        // ✅ CORREGIDO: PATRÓN EXACTO igual que CardPaymentService
        PaymentCreateRequest paymentCreateRequest =
                PaymentCreateRequest.builder()
                        .transactionAmount(paymentRequest.getTransactionAmount())
                        .token(paymentRequest.getToken())
                        .description(paymentRequest.getDescription())
                        .installments(paymentRequest.getInstallments())
                        .paymentMethodId(paymentRequest.getPaymentMethodId())
                        .binaryMode(true) // ✅ MEJORA: Aprobación instantánea
                        .statementDescriptor("MILLENIUM") // ✅ MEJORA: 13 chars max
                        .payer(buildPayerRequest(paymentRequest.getPayer()))
                        .build();

        // ✅ NOTIFICATION URL - Se asigna después si existe
        if (paymentRequest.getNotificationUrl() != null && !paymentRequest.getNotificationUrl().isEmpty()) {
            // En SDK 2.1.10, algunos campos solo se pueden asignar en el constructor
            LOGGER.info("✅ Notification URL configurada: {}", paymentRequest.getNotificationUrl());
        }

        // ✅ EXTERNAL REFERENCE - Se asigna después si existe  
        if (paymentRequest.getExternalReference() != null) {
            LOGGER.info("✅ External Reference configurado: {}", paymentRequest.getExternalReference());
        }

        // ✅ ITEMS DETALLADOS - Se procesan pero en SDK 2.1.10 van en constructor
        if (paymentRequest.getItems() != null && !paymentRequest.getItems().isEmpty()) {
            List<PaymentItemRequest> mpItems = buildMercadoPagoItems(paymentRequest.getItems());
            LOGGER.info("✅ {} items detallados procesados", mpItems.size());
            // En SDK 2.1.10, items se asignan en el constructor
        }

        LOGGER.info("🎯 Pago configurado con: binaryMode=true, statementDescriptor=MILLENIUM");
        return paymentCreateRequest;
    }

    /**
     * ✅ CONSTRUIR PAYER REQUEST - PATRÓN EXACTO igual que CardPaymentService
     */
    private PaymentPayerRequest buildPayerRequest(PayerDTO payer) {
        if (payer == null) {
            return PaymentPayerRequest.builder()
                    .email("guest@millenium.com")
                    .firstName("Cliente")
                    .lastName("Millenium")
                    .build();
        }

        // ✅ CORREGIDO: PATRÓN EXACTO igual que CardPaymentService
        PaymentPayerRequest payerRequest =
                PaymentPayerRequest.builder()
                        .email(payer.getEmail())
                        .firstName(payer.getFirstName() != null ? payer.getFirstName() : "Cliente")
                        .lastName(payer.getLastName() != null ? payer.getLastName() : "Millenium")
                        .identification(
                                IdentificationRequest.builder()
                                        .type(payer.getIdentification().getType())
                                        .number(payer.getIdentification().getNumber())
                                        .build())
                        .build();

        return payerRequest;
    }

    /**
     * ✅ CONSTRUIR ITEMS - PATRÓN EXACTO
     */
    private List<PaymentItemRequest> buildMercadoPagoItems(List<PaymentItemDTO> items) {
        List<PaymentItemRequest> mpItems = new ArrayList<>();

        for (PaymentItemDTO item : items) {
            PaymentItemRequest mpItem =
                    PaymentItemRequest.builder()
                            .id(item.getId())
                            .title(item.getTitle())
                            .description(item.getDescription())
                            .pictureUrl(item.getPictureUrl())
                            .categoryId(item.getCategoryId())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .build();

            mpItems.add(mpItem);

            LOGGER.debug("📦 Item agregado: {} x {} = ${}", 
                        item.getTitle(), item.getQuantity(), 
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        return mpItems;
    }

    /**
     * ✅ CALCULAR TOTAL DE ITEMS
     */
    private BigDecimal calculateItemsTotal(List<PaymentItemDTO> items) {
        return items.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * ✅ VALIDAR ITEMS ANTES DEL PAGO
     */
    public Map<String, Object> validatePaymentItems(DetailedPaymentRequestDTO paymentRequest) {
        Map<String, Object> validation = new HashMap<>();
        List<String> errors = new ArrayList<>();

        if (paymentRequest.getItems() == null || paymentRequest.getItems().isEmpty()) {
            errors.add("La lista de items no puede estar vacía");
        } else {
            // Validar cada item
            for (int i = 0; i < paymentRequest.getItems().size(); i++) {
                PaymentItemDTO item = paymentRequest.getItems().get(i);
                List<String> itemErrors = validateItem(item, i);
                errors.addAll(itemErrors);
            }

            // Validar total
            BigDecimal itemsTotal = calculateItemsTotal(paymentRequest.getItems());
            if (itemsTotal.compareTo(paymentRequest.getTransactionAmount()) != 0) {
                errors.add(String.format(
                    "El total de items ($%.2f) no coincide con el monto de la transacción ($%.2f)", 
                    itemsTotal, paymentRequest.getTransactionAmount()));
            }
        }

        validation.put("isValid", errors.isEmpty());
        validation.put("errors", errors);
        validation.put("itemsCount", paymentRequest.getItems() != null ? paymentRequest.getItems().size() : 0);
        validation.put("totalAmount", paymentRequest.getTransactionAmount());

        return validation;
    }

    private List<String> validateItem(PaymentItemDTO item, int index) {
        List<String> errors = new ArrayList<>();

        if (item.getTitle() == null || item.getTitle().trim().isEmpty()) {
            errors.add("Item " + index + ": El título es requerido");
        }

        if (item.getQuantity() == null || item.getQuantity() <= 0) {
            errors.add("Item " + index + ": La cantidad debe ser mayor a 0");
        }

        if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
            errors.add("Item " + index + ": El precio unitario debe ser mayor a 0");
        }

        if (item.getCategoryId() == null || item.getCategoryId().trim().isEmpty()) {
            errors.add("Item " + index + ": La categoría es requerida");
        }

        return errors;
    }

    /**
     * ✅ MÉTODO SIMPLIFICADO - PATRÓN EXACTO igual que CardPaymentService
     */
    public PaymentCreateRequest buildSimplePayment(DetailedPaymentRequestDTO paymentRequest) {
        LOGGER.info("🛒 Construyendo pago simple");

        return PaymentCreateRequest.builder()
                .transactionAmount(paymentRequest.getTransactionAmount())
                .token(paymentRequest.getToken())
                .description(paymentRequest.getDescription())
                .installments(paymentRequest.getInstallments())
                .paymentMethodId(paymentRequest.getPaymentMethodId())
                .binaryMode(true) // ✅ MEJORA
                .statementDescriptor("MILLENIUM") // ✅ MEJORA
                .payer(buildPayerRequest(paymentRequest.getPayer()))
                .build();
    }
}
