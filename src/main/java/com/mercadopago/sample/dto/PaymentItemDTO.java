package com.mercadopago.sample.dto;

import java.math.BigDecimal;

public class PaymentItemDTO {
    private String id;
    private String title;
    private String description;
    private String pictureUrl;
    private String categoryId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;

    // Constructors
    public PaymentItemDTO() {}

    public PaymentItemDTO(String id, String title, String description, String categoryId, 
                         Integer quantity, BigDecimal unitPrice) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.categoryId = categoryId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPictureUrl() { return pictureUrl; }
    public void setPictureUrl(String pictureUrl) { this.pictureUrl = pictureUrl; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { 
        this.quantity = quantity; 
        calculateTotalAmount();
    }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { 
        this.unitPrice = unitPrice; 
        calculateTotalAmount();
    }

    public BigDecimal getTotalAmount() { 
        if (totalAmount == null) {
            calculateTotalAmount();
        }
        return totalAmount; 
    }

    private void calculateTotalAmount() {
        if (unitPrice != null && quantity != null) {
            this.totalAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }
}
