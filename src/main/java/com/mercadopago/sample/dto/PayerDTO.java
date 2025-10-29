package com.mercadopago.sample.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotNull;

public class PayerDTO {
    
    @NotNull(message = "El email es requerido")
    @Email(message = "El formato del email es inválido")
    private String email;

    @JsonProperty("first_name")
    private String firstName;

    @JsonProperty("last_name")
    private String lastName;

    @NotNull(message = "La identificación es requerida")
    private PayerIdentificationDTO identification;

    public PayerDTO() {
    }

    // ✅ Constructor para facilitar testing
    public PayerDTO(String email, String firstName, String lastName, PayerIdentificationDTO identification) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.identification = identification;
    }

    // GETTERS Y SETTERS
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public PayerIdentificationDTO getIdentification() {
        return identification;
    }

    public void setIdentification(PayerIdentificationDTO identification) {
        this.identification = identification;
    }

    // ✅ MÉTODO CORREGIDO: Validar datos del pagador
    public boolean isValid() {
        return email != null && !email.trim().isEmpty() &&
               identification != null && identification.isValid();
    }

    // ✅ Método para obtener nombre completo
    public String getFullName() {
        String first = firstName != null ? firstName : "Cliente";
        String last = lastName != null ? lastName : "Millenium";
        return first + " " + last;
    }

    // ✅ Método para obtener nombre por defecto si no viene
    public String getFirstNameOrDefault() {
        return this.firstName != null ? this.firstName : "Cliente";
    }

    // ✅ Método para obtener apellido por defecto si no viene
    public String getLastNameOrDefault() {
        return this.lastName != null ? this.lastName : "Millenium";
    }

    @Override
    public String toString() {
        return "PayerDTO{" +
                "email='" + email + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", identification=" + (identification != null ? identification.toString() : "null") +
                '}';
    }
}
