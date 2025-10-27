package com.mercadopago.sample.dto;

import java.math.BigDecimal;
import java.util.List;

public class DetailedPaymentRequestDTO {
    private BigDecimal transactionAmount;
    private String token;
    private String description;
    private Integer installments;
    private String paymentMethodId;
    private PayerDTO payer;
    private List<PaymentItemDTO> items; // ✅ NUEVO: Array de items detallados
    private String externalReference;

    // Constructors
    public DetailedPaymentRequestDTO() {}

    public DetailedPaymentRequestDTO(BigDecimal transactionAmount, String token, String description, 
                                   Integer installments, String paymentMethodId, PayerDTO payer, 
                                   List<PaymentItemDTO> items, String externalReference) {
        this.transactionAmount = transactionAmount;
        this.token = token;
        this.description = description;
        this.installments = installments;
        this.paymentMethodId = paymentMethodId;
        this.payer = payer;
        this.items = items;
        this.externalReference = externalReference;
    }

    // Getters and Setters
    public BigDecimal getTransactionAmount() { return transactionAmount; }
    public void setTransactionAmount(BigDecimal transactionAmount) { this.transactionAmount = transactionAmount; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getInstallments() { return installments; }
    public void setInstallments(Integer installments) { this.installments = installments; }

    public String getPaymentMethodId() { return paymentMethodId; }
    public void setPaymentMethodId(String paymentMethodId) { this.paymentMethodId = paymentMethodId; }

    public PayerDTO getPayer() { return payer; }
    public void setPayer(PayerDTO payer) { this.payer = payer; }

    public List<PaymentItemDTO> getItems() { return items; }
    public void setItems(List<PaymentItemDTO> items) { this.items = items; }

    public String getExternalReference() { return externalReference; }
    public void setExternalReference(String externalReference) { this.externalReference = externalReference; }
}
