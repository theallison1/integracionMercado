package com.mercadopago.sample.dto;

import java.math.BigDecimal;

public class BricksPaymentDTO {
    private String token;
    private String paymentMethodId;
    private Integer installments;
    private BigDecimal amount;
    private String brickType; // "wallet" o "payment"
    private String payerEmail;
    private String payerFirstName;
    private String payerLastName;
    private String description;
    
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
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getBrickType() { return brickType; }
    public void setBrickType(String brickType) { this.brickType = brickType; }
    
    public String getPayerEmail() { return payerEmail; }
    public void setPayerEmail(String payerEmail) { this.payerEmail = payerEmail; }
    
    public String getPayerFirstName() { return payerFirstName; }
    public void setPayerFirstName(String payerFirstName) { this.payerFirstName = payerFirstName; }
    
    public String getPayerLastName() { return payerLastName; }
    public void setPayerLastName(String payerLastName) { this.payerLastName = payerLastName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
