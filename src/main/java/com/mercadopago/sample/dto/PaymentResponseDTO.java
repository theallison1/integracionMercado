package com.mercadopago.sample.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class PaymentResponseDTO {
    
    private Long id;
    private String status;
    private String statusDetail;
    
    @JsonProperty("date_created")
    private OffsetDateTime dateCreated;
    
    @JsonProperty("transaction_amount")
    private BigDecimal transactionAmount;

    // ✅ Campos adicionales para mejor respuesta
    @JsonProperty("payment_method_id")
    private String paymentMethodId;
    
    private String description;
    
    @JsonProperty("external_reference")
    private String externalReference;

    public PaymentResponseDTO() {
    }

    // ✅ Constructor completo
    public PaymentResponseDTO(Long id, String status, String statusDetail, 
                             OffsetDateTime dateCreated, BigDecimal transactionAmount) {
        this.id = id;
        this.status = status;
        this.statusDetail = statusDetail;
        this.dateCreated = dateCreated;
        this.transactionAmount = transactionAmount;
    }

    // ✅ Constructor extendido
    public PaymentResponseDTO(Long id, String status, String statusDetail, 
                             OffsetDateTime dateCreated, BigDecimal transactionAmount,
                             String paymentMethodId, String description, String externalReference) {
        this.id = id;
        this.status = status;
        this.statusDetail = statusDetail;
        this.dateCreated = dateCreated;
        this.transactionAmount = transactionAmount;
        this.paymentMethodId = paymentMethodId;
        this.description = description;
        this.externalReference = externalReference;
    }

    // GETTERS Y SETTERS
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusDetail() {
        return statusDetail;
    }

    public void setStatusDetail(String statusDetail) {
        this.statusDetail = statusDetail;
    }

    public OffsetDateTime getDateCreated() {
        return dateCreated;
    }

    public void setDateCreated(OffsetDateTime dateCreated) {
        this.dateCreated = dateCreated;
    }

    public BigDecimal getTransactionAmount() {
        return transactionAmount;
    }

    public void setTransactionAmount(BigDecimal transactionAmount) {
        this.transactionAmount = transactionAmount;
    }

    public String getPaymentMethodId() {
        return paymentMethodId;
    }

    public void setPaymentMethodId(String paymentMethodId) {
        this.paymentMethodId = paymentMethodId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public void setExternalReference(String externalReference) {
        this.externalReference = externalReference;
    }

    // ✅ Método para verificar si el pago fue exitoso
    public boolean isApproved() {
        return "approved".equals(status);
    }

    // ✅ Método para verificar si el pago está pendiente
    public boolean isPending() {
        return "pending".equals(status) || "in_process".equals(status);
    }

    // ✅ Método para verificar si el pago fue rechazado
    public boolean isRejected() {
        return "rejected".equals(status) || "cancelled".equals(status);
    }

    @Override
    public String toString() {
        return "PaymentResponseDTO{" +
                "id=" + id +
                ", status='" + status + '\'' +
                ", statusDetail='" + statusDetail + '\'' +
                ", dateCreated=" + dateCreated +
                ", transactionAmount=" + transactionAmount +
                ", paymentMethodId='" + paymentMethodId + '\'' +
                ", description='" + description + '\'' +
                ", externalReference='" + externalReference + '\'' +
                '}';
    }
}
