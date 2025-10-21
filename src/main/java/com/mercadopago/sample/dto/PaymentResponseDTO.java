package com.mercadopago.sample.dto;

public class PaymentResponseDTO {
    private Long id;
    private String status;
    private String statusDetail;

    public PaymentResponseDTO() {
    }

    public PaymentResponseDTO(Long id, String status, String statusDetail) {
        this.id = id;
        this.status = status;
        this.statusDetail = statusDetail;
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
}
