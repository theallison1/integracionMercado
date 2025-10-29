package com.mercadopago.sample.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Email;
import java.math.BigDecimal;

public class BricksPaymentDTO {
    
    @NotNull(message = "El token es requerido")
    private String token;
    
    @JsonProperty("payment_method_id")
    private String paymentMethodId;
    
    private Integer installments;
    
    @NotNull(message = "El monto es requerido")
    @Positive(message = "El monto debe ser mayor a cero")
    private BigDecimal amount;
    
    @JsonProperty("brick_type")
    private String brickType; // "wallet" o "payment"
    
    @NotNull(message = "El email del pagador es requerido")
    @Email(message = "El formato del email es inválido")
    @JsonProperty("payer_email")
    private String payerEmail;
    
    @JsonProperty("payer_first_name")
    private String payerFirstName;
    
    @JsonProperty("payer_last_name")
    private String payerLastName;
    
    private String description;
    
    // ✅ CAMPOS para pagos en efectivo
    @JsonProperty("identification_type")
    private String identificationType;
    
    @JsonProperty("identification_number")
    private String identificationNumber;
    
    @JsonProperty("issuer_id")
    private String issuerId;
    
    @JsonProperty("payment_type")
    private String paymentType;

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
    
    // ✅ Constructor para pagos en efectivo
    public BricksPaymentDTO(String paymentMethodId, BigDecimal amount, String payerEmail,
                          String payerFirstName, String payerLastName, String identificationType,
                          String identificationNumber) {
        this.paymentMethodId = paymentMethodId;
        this.amount = amount;
        this.payerEmail = payerEmail;
        this.payerFirstName = payerFirstName;
        this.payerLastName = payerLastName;
        this.identificationType = identificationType;
        this.identificationNumber = identificationNumber;
        this.brickType = "payment"; // Por defecto para efectivo
    }
    
    // Getters and Setters
    public String getToken() { 
        return token; 
    }
    
    public void setToken(String token) { 
        this.token = token; 
    }
    
    public String getPaymentMethodId() { 
        return paymentMethodId; 
    }
    
    public void setPaymentMethodId(String paymentMethodId) { 
        this.paymentMethodId = paymentMethodId; 
    }
    
    public Integer getInstallments() { 
        return installments; 
    }
    
    public void setInstallments(Integer installments) { 
        this.installments = installments; 
    }
    
    public BigDecimal getAmount() { 
        return amount; 
    }
    
    public void setAmount(BigDecimal amount) { 
        this.amount = amount; 
    }
    
    public String getBrickType() { 
        return brickType; 
    }
    
    public void setBrickType(String brickType) { 
        this.brickType = brickType; 
    }
    
    public String getPayerEmail() { 
        return payerEmail; 
    }
    
    public void setPayerEmail(String payerEmail) { 
        this.payerEmail = payerEmail; 
    }
    
    public String getPayerFirstName() { 
        return payerFirstName; 
    }
    
    public void setPayerFirstName(String payerFirstName) { 
        this.payerFirstName = payerFirstName; 
    }
    
    public String getPayerLastName() { 
        return payerLastName; 
    }
    
    public void setPayerLastName(String payerLastName) { 
        this.payerLastName = payerLastName; 
    }
    
    public String getDescription() { 
        return description; 
    }
    
    public void setDescription(String description) { 
        this.description = description; 
    }
    
    // ✅ Getters and Setters para pagos en efectivo
    public String getIdentificationType() { 
        return identificationType; 
    }
    
    public void setIdentificationType(String identificationType) { 
        this.identificationType = identificationType; 
    }
    
    public String getIdentificationNumber() { 
        return identificationNumber; 
    }
    
    public void setIdentificationNumber(String identificationNumber) { 
        this.identificationNumber = identificationNumber; 
    }
    
    public String getIssuerId() { 
        return issuerId; 
    }
    
    public void setIssuerId(String issuerId) { 
        this.issuerId = issuerId; 
    }
    
    public String getPaymentType() { 
        return paymentType; 
    }
    
    public void setPaymentType(String paymentType) { 
        this.paymentType = paymentType; 
    }
    
    // ✅ MÉTODOS UTILITARIOS
    
    /**
     * Valida si el DTO contiene los datos mínimos requeridos
     */
    public boolean isValid() {
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0 &&
               payerEmail != null && !payerEmail.trim().isEmpty();
    }
    
    /**
     * Valida si es un pago con token (tarjeta)
     */
    public boolean isTokenPayment() {
        return token != null && !token.trim().isEmpty();
    }
    
    /**
     * Valida si es un pago en efectivo
     */
    public boolean isCashPayment() {
        return "rapipago".equals(paymentMethodId) || "pagofacil".equals(paymentMethodId);
    }
    
    /**
     * Valida si es un pago con Wallet Brick
     */
    public boolean isWalletPayment() {
        return "wallet".equals(brickType);
    }
    
    /**
     * Obtiene el nombre completo del pagador
     */
    public String getPayerFullName() {
        String first = payerFirstName != null ? payerFirstName : "Cliente";
        String last = payerLastName != null ? payerLastName : "Millenium";
        return first + " " + last;
    }
    
    /**
     * Obtiene la descripción por defecto si no viene
     */
    public String getDescriptionOrDefault() {
        return description != null ? description : "Pago desde " + brickType + " Brick - Millenium";
    }
    
    /**
     * Obtiene el tipo de identificación por defecto
     */
    public String getIdentificationTypeOrDefault() {
        return identificationType != null ? identificationType : "DNI";
    }
    
    /**
     * Obtiene el número de identificación por defecto
     */
    public String getIdentificationNumberOrDefault() {
        return identificationNumber != null ? identificationNumber : "00000000";
    }
    
    /**
     * Obtiene el nombre por defecto si no viene
     */
    public String getPayerFirstNameOrDefault() {
        return payerFirstName != null ? payerFirstName : "Cliente";
    }
    
    /**
     * Obtiene el apellido por defecto si no viene
     */
    public String getPayerLastNameOrDefault() {
        return payerLastName != null ? payerLastName : "Millenium";
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
                ", issuerId='" + issuerId + '\'' +
                ", paymentType='" + paymentType + '\'' +
                '}';
    }
}
