package com.mercadopago.sample.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CardPaymentDTO {
    @NotNull
    private String token;
    
    @JsonProperty("issuer_id")
    private String issuerId;

    @NotNull
    @JsonProperty("payment_method_id")
    private String paymentMethodId;

    @NotNull
    @JsonProperty("transaction_amount")
    private BigDecimal transactionAmount;

    @NotNull
    private Integer installments;

    
    @JsonProperty("product_description")
    private String productDescription;

    @NotNull
    private PayerDTO payer;

    public CardPaymentDTO() {
    }

    // GETTERS Y SETTERS
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

    @Override
    public String toString() {
        return "CardPaymentDTO{" +
                "token='" + token + '\'' +
                ", issuerId='" + issuerId + '\'' +
                ", paymentMethodId='" + paymentMethodId + '\'' +
                ", transactionAmount=" + transactionAmount +
                ", installments=" + installments +
                ", productDescription='" + productDescription + '\'' +
                ", payer=" + payer +
                '}';
    }
}
