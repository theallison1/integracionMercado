package com.mercadopago.sample.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.math.BigDecimal;

public class CardPaymentDTO {
    
    @NotNull(message = "El token es requerido")
    private String token;
    
    @JsonProperty("issuer_id")
    private String issuerId;

    @NotNull(message = "El método de pago es requerido")
    @JsonProperty("payment_method_id")
    private String paymentMethodId;

    @NotNull(message = "El monto de la transacción es requerido")
    @Positive(message = "El monto debe ser mayor a cero")
    @JsonProperty("transaction_amount")
    private BigDecimal transactionAmount;

    @NotNull(message = "El número de cuotas es requerido")
    @Positive(message = "El número de cuotas debe ser mayor a cero")
    private Integer installments;

    @JsonProperty("product_description")
    private String productDescription;

    @NotNull(message = "La información del pagador es requerida")
    private PayerDTO payer;

    // ✅✅✅ CAMPOS CRÍTICOS QUE FALTABAN
    @JsonProperty("capture")
    private Boolean capture = true;  // ← Valor por defecto: true

    @JsonProperty("binary_mode")
    private Boolean binaryMode = false; // ← Valor por defecto: false

    // ✅ Campos adicionales para mejor control
    @JsonProperty("notification_url")
    private String notificationUrl;

    @JsonProperty("external_reference")
    private String externalReference;

    @JsonProperty("statement_descriptor")
    private String statementDescriptor;

    public CardPaymentDTO() {
    }

    // ✅ Constructor actualizado
    public CardPaymentDTO(String token, String paymentMethodId, BigDecimal transactionAmount, 
                         Integer installments, String productDescription, PayerDTO payer) {
        this.token = token;
        this.paymentMethodId = paymentMethodId;
        this.transactionAmount = transactionAmount;
        this.installments = installments;
        this.productDescription = productDescription;
        this.payer = payer;
        this.capture = true;    // ← Inicializar
        this.binaryMode = false; // ← Inicializar
    }

    // GETTERS Y SETTERS (agrega los nuevos)
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getIssuerId() {
        return issuerId;
    }

    public void setIssuerId(String issuerId) {
        this.issuerId = issuerId;
    }

    public String getPaymentMethodId() {
        return paymentMethodId;
    }

    public void setPaymentMethodId(String paymentMethodId) {
        this.paymentMethodId = paymentMethodId;
    }

    public BigDecimal getTransactionAmount() {
        return transactionAmount;
    }

    public void setTransactionAmount(BigDecimal transactionAmount) {
        this.transactionAmount = transactionAmount;
    }

    public Integer getInstallments() {
        return installments;
    }

    public void setInstallments(Integer installments) {
        this.installments = installments;
    }

    public String getProductDescription() {
        return productDescription;
    }

    public void setProductDescription(String productDescription) {
        this.productDescription = productDescription;
    }

    public PayerDTO getPayer() {
        return payer;
    }

    public void setPayer(PayerDTO payer) {
        this.payer = payer;
    }

    // ✅✅✅ NUEVOS GETTERS Y SETTERS
    public Boolean getCapture() {
        return capture;
    }

    public void setCapture(Boolean capture) {
        this.capture = capture;
    }

    public Boolean getBinaryMode() {
        return binaryMode;
    }

    public void setBinaryMode(Boolean binaryMode) {
        this.binaryMode = binaryMode;
    }

    public String getNotificationUrl() {
        return notificationUrl;
    }

    public void setNotificationUrl(String notificationUrl) {
        this.notificationUrl = notificationUrl;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public void setExternalReference(String externalReference) {
        this.externalReference = externalReference;
    }

    public String getStatementDescriptor() {
        return statementDescriptor;
    }

    public void setStatementDescriptor(String statementDescriptor) {
        this.statementDescriptor = statementDescriptor;
    }

    // ✅ MÉTODO CORREGIDO: Validar datos básicos
    public boolean isValid() {
        return token != null && !token.trim().isEmpty() &&
               paymentMethodId != null && !paymentMethodId.trim().isEmpty() &&
               transactionAmount != null && transactionAmount.compareTo(BigDecimal.ZERO) > 0 &&
               installments != null && installments > 0 &&
               payer != null && payer.isValid();
    }

    // ✅ Método para obtener descripción por defecto si no viene
    public String getProductDescriptionOrDefault() {
        return this.productDescription != null ? this.productDescription : "Compra de termotanques Millenium";
    }

    @Override
    public String toString() {
        return "CardPaymentDTO{" +
                "token='" + (token != null ? "[PROVIDED]" : "null") + '\'' +
                ", issuerId='" + issuerId + '\'' +
                ", paymentMethodId='" + paymentMethodId + '\'' +
                ", transactionAmount=" + transactionAmount +
                ", installments=" + installments +
                ", productDescription='" + productDescription + '\'' +
                ", capture=" + capture +
                ", binaryMode=" + binaryMode +
                ", payer=" + (payer != null ? payer.toString() : "null") +
                ", notificationUrl='" + notificationUrl + '\'' +
                ", externalReference='" + externalReference + '\'' +
                ", statementDescriptor='" + statementDescriptor + '\'' +
                '}';
    }
}
