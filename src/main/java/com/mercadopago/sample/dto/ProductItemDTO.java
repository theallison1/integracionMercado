package com.mercadopago.sample.dto;

import java.math.BigDecimal;

public class ProductItemDTO {
    private String id;
    private String title;
    private String description;
    private String categoryId;
    private String pictureUrl;
    private Integer quantity;
    private BigDecimal unitPrice;

    // Constructor vacío
    public ProductItemDTO() {}

    // Constructor con parámetros
    public ProductItemDTO(String id, String title, String description, String categoryId, 
                         String pictureUrl, Integer quantity, BigDecimal unitPrice) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.categoryId = categoryId;
        this.pictureUrl = pictureUrl;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public String getPictureUrl() { return pictureUrl; }
    public void setPictureUrl(String pictureUrl) { this.pictureUrl = pictureUrl; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
}
