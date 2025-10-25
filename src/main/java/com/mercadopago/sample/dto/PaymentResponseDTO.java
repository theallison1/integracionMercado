package com.mercadopago.sample.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class PaymentResponseDTO {
    private Long id;
    private String status;
    private String statusDetail;
    private OffsetDateTime dateCreated;
    private BigDecimal transactionAmount;

    public PaymentResponseDTO() {
    }

    public PaymentResponseDTO(Long id, String status, String statusDetail) {
        this.id = id;
        this.status = status;
        this.statusDetail = statusDetail;
    }

    public PaymentResponseDTO(Long id, String status, String statusDetail, 
                            OffsetDateTime dateCreated, BigDecimal transactionAmount) {
        this.id = id;
        this.status = status;
        this.statusDetail = statusDetail;
        this.dateCreated = dateCreated;
        this.transactionAmount = transactionAmount;
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

    @Override
    public String toString() {
        return "PaymentResponseDTO{" +
                "id=" + id +
                ", status='" + status + '\'' +
                ", statusDetail='" + statusDetail + '\'' +
                ", dateCreated=" + dateCreated +
                ", transactionAmount=" + transactionAmount +
                '}';
    }
}
