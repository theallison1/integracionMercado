package com.mercadopago.sample.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

public class PayerIdentificationDTO {
    
    @NotNull(message = "El tipo de identificación es requerido")
    @Pattern(regexp = "DNI|CI|CPF|CNPJ", message = "El tipo de identificación debe ser DNI, CI, CPF o CNPJ")
    private String type;

    @NotNull(message = "El número de identificación es requerido")
    @Pattern(regexp = "\\d+", message = "El número de identificación debe contener solo dígitos")
    private String number;

    public PayerIdentificationDTO() {
    }

    // ✅ Constructor para facilitar testing
    public PayerIdentificationDTO(String type, String number) {
        this.type = type;
        this.number = number;
    }

    // GETTERS Y SETTERS
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    // ✅ MÉTODO CORREGIDO: Validar identificación
    public boolean isValid() {
        return type != null && !type.trim().isEmpty() &&
               number != null && !number.trim().isEmpty();
    }

    // ✅ Método para obtener tipo por defecto si no viene
    public String getTypeOrDefault() {
        return this.type != null ? this.type : "DNI";
    }

    // ✅ Método para obtener número por defecto si no viene
    public String getNumberOrDefault() {
        return this.number != null ? this.number : "00000000";
    }

    @Override
    public String toString() {
        return "PayerIdentificationDTO{" +
                "type='" + type + '\'' +
                ", number='" + number + '\'' +
                '}';
    }
}
