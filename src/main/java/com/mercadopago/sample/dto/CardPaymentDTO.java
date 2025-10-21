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

    @NotNull // ✅ AGREGAR ESTO
    @JsonProperty("product_description")
    private String productDescription;

    @NotNull
    private PayerDTO payer;

    // ... getters y setters igual
}
