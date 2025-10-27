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
     * ✅ CONSTRUIR PAYMENT REQUEST - CORREGIDO para SDK 2.1.10
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
        
        // ✅ CORREGIDO: Para SDK 2.1.10 - Crear instancia directamente
        PaymentCreateRequest request = new PaymentCreateRequest();
        request.setTransactionAmount(paymentRequest.getTransactionAmount());
        request.setToken(paymentRequest.getToken());
        request.setDescription(paymentRequest.getDescription());
        request.setInstallments(paymentRequest.getInstallments());
        request.setPaymentMethodId(paymentRequest.getPaymentMethodId());
        request.setPayer(buildPayerRequest(paymentRequest.getPayer()));
        
        // External reference
        if (paymentRequest.getExternalReference() != null) {
            request.setExternalReference(paymentRequest.getExternalReference());
        }
        
        // ✅ ITEMS DETALLADOS
        if (paymentRequest.getItems() != null && !paymentRequest.getItems().isEmpty()) {
            List<PaymentItemRequest> mpItems = buildMercadoPagoItems(paymentRequest.getItems());
            request.setItems(mpItems);
            LOGGER.info("✅ {} items detallados agregados al pago", mpItems.size());
        }
        
        return request;
    }

    /**
     * ✅ CONSTRUIR PAYER REQUEST - CORREGIDO para SDK 2.1.10
     */
    private PaymentPayerRequest buildPayerRequest(PayerDTO payer) {
        PaymentPayerRequest payerRequest = new PaymentPayerRequest();
        
        if (payer == null) {
            payerRequest.setEmail("guest@millenium.com");
            payerRequest.setFirstName("Cliente");
            payerRequest.setLastName("Millenium");
            return payerRequest;
        }
        
        payerRequest.setEmail(payer.getEmail());
        payerRequest.setFirstName(payer.getFirstName() != null ? payer.getFirstName() : "Cliente");
        payerRequest.setLastName(payer.getLastName() != null ? payer.getLastName() : "Millenium");
        
        // ✅ IDENTIFICATION
        if (payer.getIdentification() != null) {
            IdentificationRequest identification = new IdentificationRequest();
            identification.setType(payer.getIdentification().getType());
            identification.setNumber(payer.getIdentification().getNumber());
            payerRequest.setIdentification(identification);
        }
        
        return payerRequest;
    }

    /**
     * ✅ CONSTRUIR ITEMS - CORREGIDO para SDK 2.1.10
     */
    private List<PaymentItemRequest> buildMercadoPagoItems(List<PaymentItemDTO> items) {
        List<PaymentItemRequest> mpItems = new ArrayList<>();
        
        for (PaymentItemDTO item : items) {
            PaymentItemRequest mpItem = new PaymentItemRequest();
            mpItem.setId(item.getId());
            mpItem.setTitle(item.getTitle());
            mpItem.setDescription(item.getDescription());
            mpItem.setPictureUrl(item.getPictureUrl());
            mpItem.setCategoryId(item.getCategoryId());
            mpItem.setQuantity(item.getQuantity());
            mpItem.setUnitPrice(item.getUnitPrice());
            
            mpItems.add(mpItem);
            
            LOGGER.debug("📦 Item agregado: {} x {} = ${}", 
                        item.getTitle(), item.getQuantity(), 
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        
        return mpItems;
    }

    /**
     * ✅ CONSTRUIR PAYMENT REQUEST COMPLETO - CORREGIDO para SDK 2.1.10
     */
    public PaymentCreateRequest buildCompletePaymentRequest(DetailedPaymentRequestDTO paymentRequest) {
        LOGGER.info("🛒 Construyendo pago COMPLETO con todos los campos requeridos");
        
        PaymentCreateRequest request = new PaymentCreateRequest();
        request.setTransactionAmount(paymentRequest.getTransactionAmount());
        request.setToken(paymentRequest.getToken());
        request.setDescription(paymentRequest.getDescription());
        request.setInstallments(paymentRequest.getInstallments());
        request.setPaymentMethodId(paymentRequest.getPaymentMethodId());
        request.setPayer(buildCompletePayerRequest(paymentRequest.getPayer()));
        
        // ✅ NOTIFICATION URL
        if (paymentRequest.getNotificationUrl() != null && !paymentRequest.getNotificationUrl().isEmpty()) {
            request.setNotificationUrl(paymentRequest.getNotificationUrl());
            LOGGER.info("✅ Notification URL agregada: {}", paymentRequest.getNotificationUrl());
        }
        
        // External reference
        if (paymentRequest.getExternalReference() != null) {
            request.setExternalReference(paymentRequest.getExternalReference());
        }
        
        // ✅ ITEMS COMPLETOS
        if (paymentRequest.getItems() != null && !paymentRequest.getItems().isEmpty()) {
            List<PaymentItemRequest> mpItems = buildCompleteMercadoPagoItems(paymentRequest.getItems());
            request.setItems(mpItems);
            LOGGER.info("✅ {} items completos agregados al pago", mpItems.size());
        }
        
        return request;
    }

    /**
     * ✅ PAYER COMPLETO - CORREGIDO para SDK 2.1.10
     */
    private PaymentPayerRequest buildCompletePayerRequest(PayerDTO payer) {
        PaymentPayerRequest payerRequest = new PaymentPayerRequest();
        
        if (payer == null) {
            payerRequest.setEmail("guest@millenium.com");
            payerRequest.setFirstName("Cliente");
            payerRequest.setLastName("Millenium");
            return payerRequest;
        }
        
        payerRequest.setEmail(payer.getEmail());
        payerRequest.setFirstName(payer.getFirstName() != null ? payer.getFirstName() : "Cliente");
        payerRequest.setLastName(payer.getLastName() != null ? payer.getLastName() : "Millenium");
        
        if (payer.getIdentification() != null) {
            IdentificationRequest identification = new IdentificationRequest();
            identification.setType(payer.getIdentification().getType());
            identification.setNumber(payer.getIdentification().getNumber());
            payerRequest.setIdentification(identification);
        }
        
        return payerRequest;
    }

    /**
     * ✅ ITEMS COMPLETOS - CORREGIDO para SDK 2.1.10
     */
    private List<PaymentItemRequest> buildCompleteMercadoPagoItems(List<PaymentItemDTO> items) {
        List<PaymentItemRequest> mpItems = new ArrayList<>();
        
        for (PaymentItemDTO item : items) {
            PaymentItemRequest mpItem = new PaymentItemRequest();
            mpItem.setId(item.getId());
            mpItem.setTitle(item.getTitle());
            mpItem.setDescription(item.getDescription());
            mpItem.setPictureUrl(item.getPictureUrl());
            mpItem.setCategoryId(item.getCategoryId());
            mpItem.setQuantity(item.getQuantity());
            mpItem.setUnitPrice(item.getUnitPrice());
            
            mpItems.add(mpItem);
            
            LOGGER.info("📦 Item completo agregado: {} (ID: {}) x {} = ${}", 
                       item.getTitle(), item.getId(), item.getQuantity(), 
                       item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        
        return mpItems;
    }

    // ✅ MANTENER LOS MÉTODOS DE VALIDACIÓN (no cambian)
    private BigDecimal calculateItemsTotal(List<PaymentItemDTO> items) {
        return items.stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Map<String, Object> validatePaymentItems(DetailedPaymentRequestDTO paymentRequest) {
        Map<String, Object> validation = new HashMap<>();
        List<String> errors = new ArrayList<>();
        
        if (paymentRequest.getItems() == null || paymentRequest.getItems().isEmpty()) {
            errors.add("La lista de items no puede estar vacía");
        } else {
            for (int i = 0; i < paymentRequest.getItems().size(); i++) {
                PaymentItemDTO item = paymentRequest.getItems().get(i);
                List<String> itemErrors = validateItem(item, i);
                errors.addAll(itemErrors);
            }
            
            BigDecimal itemsTotal = calculateItemsTotal(paymentRequest.getItems());
            if (itemsTotal.compareTo(paymentRequest.getTransactionAmount()) != 0) {
                errors.add(String.format("El total de items ($%.2f) no coincide con el monto de la transacción ($%.2f)", 
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
     * ✅ MÉTODO SIMPLIFICADO - CORREGIDO para SDK 2.1.10
     */
    public PaymentCreateRequest buildSimplePayment(DetailedPaymentRequestDTO paymentRequest) {
        LOGGER.info("🛒 Construyendo pago simple");
        
        PaymentCreateRequest request = new PaymentCreateRequest();
        request.setTransactionAmount(paymentRequest.getTransactionAmount());
        request.setToken(paymentRequest.getToken());
        request.setDescription(paymentRequest.getDescription());
        request.setInstallments(paymentRequest.getInstallments());
        request.setPaymentMethodId(paymentRequest.getPaymentMethodId());
        request.setPayer(buildPayerRequest(paymentRequest.getPayer()));
        
        return request;
    }
}
