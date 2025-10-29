package com.mercadopago.sample.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Email;
import java.math.BigDecimal;

public class BricksPaymentDTO {
    
    private String token;
    
    @JsonProperty("payment_method_id")
    private String paymentMethodId;
    
    private Integer installments;
    
    @JsonProperty("issuer_id")
    private String issuerId;
    
    @JsonProperty("payment_type")
    private String paymentType;
    
    @NotNull(message = "El monto es requerido")
    @Positive(message = "El monto debe ser mayor a cero")
    private BigDecimal amount;
    
    @JsonProperty("brick_type")
    private String brickType;
    
    private String description;
    
    @JsonProperty("payer_email")
    @Email(message = "El formato del email es inválido")
    private String payerEmail;
    
    @JsonProperty("payer_first_name")
    private String payerFirstName;
    
    @JsonProperty("payer_last_name")
    private String payerLastName;
    
    @JsonProperty("identification_type")
    private String identificationType;
    
    @JsonProperty("identification_number")
    private String identificationNumber;

    // Constructors
    public BricksPaymentDTO() {}
    
    public BricksPaymentDTO(String token, String paymentMethodId, Integer installments, 
                          BigDecimal amount, String brickType, String payerEmail) {
        this.token = token;
        this.paymentMethodId = paymentMethodId;
        this.installments = installments;
        this.amount = amount;
        this.brickType = brickType;
        this.payerEmail = payerEmail;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getPaymentMethodId() { return paymentMethodId; }
    public void setPaymentMethodId(String paymentMethodId) { this.paymentMethodId = paymentMethodId; }
    
    public Integer getInstallments() { return installments; }
    public void setInstallments(Integer installments) { this.installments = installments; }
    
    public String getIssuerId() { return issuerId; }
    public void setIssuerId(String issuerId) { this.issuerId = issuerId; }
    
    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getBrickType() { return brickType; }
    public void setBrickType(String brickType) { this.brickType = brickType; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getPayerEmail() { return payerEmail; }
    public void setPayerEmail(String payerEmail) { this.payerEmail = payerEmail; }
    
    public String getPayerFirstName() { return payerFirstName; }
    public void setPayerFirstName(String payerFirstName) { this.payerFirstName = payerFirstName; }
    
    public String getPayerLastName() { return payerLastName; }
    public void setPayerLastName(String payerLastName) { this.payerLastName = payerLastName; }
    
    public String getIdentificationType() { return identificationType; }
    public void setIdentificationType(String identificationType) { this.identificationType = identificationType; }
    
    public String getIdentificationNumber() { return identificationNumber; }
    public void setIdentificationNumber(String identificationNumber) { this.identificationNumber = identificationNumber; }
    
    // ✅ MÉTODOS UTILITARIOS SIMPLIFICADOS
    
    public boolean isValid() {
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0 &&
               payerEmail != null && !payerEmail.trim().isEmpty();
    }
    
    public boolean isTokenPayment() {
        return token != null && !token.trim().isEmpty();
    }
    
    public boolean isCashPayment() {
        return "rapipago".equals(paymentMethodId) || "pagofacil".equals(paymentMethodId);
    }
    
    public String getPayerFullName() {
        String first = payerFirstName != null ? payerFirstName : "Cliente";
        String last = payerLastName != null ? payerLastName : "Millenium";
        return first + " " + last;
    }
    
    public String getDescriptionOrDefault() {
        return description != null ? description : "Pago desde " + brickType + " Brick";
    }
    
    public String getIdentificationTypeOrDefault() {
        return identificationType != null ? identificationType : "DNI";
    }
    
    public String getIdentificationNumberOrDefault() {
        return identificationNumber != null ? identificationNumber : "00000000";
    }
    
    @Override
    public String toString() {
        return "BricksPaymentDTO{" +
                "token='" + (token != null ? "[PROVIDED]" : "null") + '\'' +
                ", paymentMethodId='" + paymentMethodId + '\'' +
                ", installments=" + installments +
                ", amount=" + amount +
                ", brickType='" + brickType + '\'' +
                ", payerEmail='" + payerEmail + '\'' +
                ", payerFirstName='" + payerFirstName + '\'' +
                ", payerLastName='" + payerLastName + '\'' +
                ", description='" + description + '\'' +
                ", identificationType='" + identificationType + '\'' +
                ", identificationNumber='" + identificationNumber + '\'' +
                '}';
    }
}
