package com.mercadopago.sample.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Email;
import javax.validation.constraints.Pattern;
import java.math.BigDecimal;

public class BricksPaymentDTO {
    
    @NotNull(message = "El token es requerido para pagos con tarjeta")
    private String token;
    
    @JsonProperty("payment_method_id")
    private String paymentMethodId;
    
    @Positive(message = "Las cuotas deben ser mayor a cero")
    private Integer installments;
    
    @JsonProperty("issuer_id")
    private String issuerId;
    
    @JsonProperty("payment_type")
    private String paymentType;
    
    @NotNull(message = "El monto es requerido")
    @Positive(message = "El monto debe ser mayor a cero")
    private BigDecimal amount;
    
    @JsonProperty("brick_type")
    private String brickType; // "wallet" o "payment"
    
    private String description;
    
    // ✅ Campos del pagador en objeto anidado (como viene del frontend)
    @JsonProperty("payer")
    private PayerInfo payer;
    
    // ✅ Campos directos para pagos en efectivo
    @JsonProperty("payer_email")
    @Email(message = "El formato del email es inválido")
    private String payerEmail;
    
    @JsonProperty("payer_first_name")
    private String payerFirstName;
    
    @JsonProperty("payer_last_name")
    private String payerLastName;
    
    @JsonProperty("identification_type")
    @Pattern(regexp = "DNI|CI|CPF|CNPJ", message = "El tipo de identificación debe ser DNI, CI, CPF o CNPJ")
    private String identificationType;
    
    @JsonProperty("identification_number")
    @Pattern(regexp = "\\d+", message = "El número de identificación debe contener solo dígitos")
    private String identificationNumber;

    // ✅ Clase interna para el objeto payer
    public static class PayerInfo {
        @Email(message = "El formato del email es inválido")
        private String email;
        
        @JsonProperty("first_name")
        private String firstName;
        
        @JsonProperty("last_name")
        private String lastName;
        
        // Constructores
        public PayerInfo() {}
        
        public PayerInfo(String email, String firstName, String lastName) {
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
        }
        
        // Getters y Setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        
        @Override
        public String toString() {
            return "PayerInfo{" +
                    "email='" + email + '\'' +
                    ", firstName='" + firstName + '\'' +
                    ", lastName='" + lastName + '\'' +
                    '}';
        }
    }

    // Constructores
    public BricksPaymentDTO() {}
    
    public BricksPaymentDTO(String token, String paymentMethodId, Integer installments, 
                          BigDecimal amount, String brickType, String description) {
        this.token = token;
        this.paymentMethodId = paymentMethodId;
        this.installments = installments;
        this.amount = amount;
        this.brickType = brickType;
        this.description = description;
    }
    
    // ✅ Constructor para pagos en efectivo
    public BricksPaymentDTO(String paymentMethodId, BigDecimal amount, String payerEmail,
                          String payerFirstName, String payerLastName, String identificationType,
                          String identificationNumber, String description) {
        this.paymentMethodId = paymentMethodId;
        this.amount = amount;
        this.payerEmail = payerEmail;
        this.payerFirstName = payerFirstName;
        this.payerLastName = payerLastName;
        this.identificationType = identificationType;
        this.identificationNumber = identificationNumber;
        this.description = description;
        this.brickType = "payment";
    }

    // Getters y Setters
    public String getToken() { 
        return token; 
    }
    
    public void setToken(String token) { 
        this.token = token; 
    }
    
    public String getPaymentMethodId() { 
        return paymentMethodId; 
    }
    
    public void setPaymentMethodId(String paymentMethodId) { 
        this.paymentMethodId = paymentMethodId; 
    }
    
    public Integer getInstallments() { 
        return installments; 
    }
    
    public void setInstallments(Integer installments) { 
        this.installments = installments; 
    }
    
    public String getIssuerId() { 
        return issuerId; 
    }
    
    public void setIssuerId(String issuerId) { 
        this.issuerId = issuerId; 
    }
    
    public String getPaymentType() { 
        return paymentType; 
    }
    
    public void setPaymentType(String paymentType) { 
        this.paymentType = paymentType; 
    }
    
    public BigDecimal getAmount() { 
        return amount; 
    }
    
    public void setAmount(BigDecimal amount) { 
        this.amount = amount; 
    }
    
    public String getBrickType() { 
        return brickType; 
    }
    
    public void setBrickType(String brickType) { 
        this.brickType = brickType; 
    }
    
    public String getDescription() { 
        return description; 
    }
    
    public void setDescription(String description) { 
        this.description = description; 
    }
    
    public PayerInfo getPayer() { 
        return payer; 
    }
    
    public void setPayer(PayerInfo payer) { 
        this.payer = payer; 
    }
    
    public String getPayerEmail() { 
        return payerEmail; 
    }
    
    public void setPayerEmail(String payerEmail) { 
        this.payerEmail = payerEmail; 
    }
    
    public String getPayerFirstName() { 
        return payerFirstName; 
    }
    
    public void setPayerFirstName(String payerFirstName) { 
        this.payerFirstName = payerFirstName; 
    }
    
    public String getPayerLastName() { 
        return payerLastName; 
    }
    
    public void setPayerLastName(String payerLastName) { 
        this.payerLastName = payerLastName; 
    }
    
    public String getIdentificationType() { 
        return identificationType; 
    }
    
    public void setIdentificationType(String identificationType) { 
        this.identificationType = identificationType; 
    }
    
    public String getIdentificationNumber() { 
        return identificationNumber; 
    }
    
    public void setIdentificationNumber(String identificationNumber) { 
        this.identificationNumber = identificationNumber; 
    }
    
    // ✅ MÉTODOS UTILITARIOS MEJORADOS
    
    /**
     * Obtener email del pagador (prioriza objeto payer)
     */
    public String getEffectivePayerEmail() {
        if (this.payer != null && this.payer.getEmail() != null && !this.payer.getEmail().trim().isEmpty()) {
            return this.payer.getEmail();
        }
        return this.payerEmail != null ? this.payerEmail : "cliente@millenium.com";
    }
    
    /**
     * Obtener nombre del pagador (prioriza objeto payer)
     */
    public String getEffectivePayerFirstName() {
        if (this.payer != null && this.payer.getFirstName() != null && !this.payer.getFirstName().trim().isEmpty()) {
            return this.payer.getFirstName();
        }
        return this.payerFirstName != null ? this.payerFirstName : "Cliente";
    }
    
    /**
     * Obtener apellido del pagador (prioriza objeto payer)
     */
    public String getEffectivePayerLastName() {
        if (this.payer != null && this.payer.getLastName() != null && !this.payer.getLastName().trim().isEmpty()) {
            return this.payer.getLastName();
        }
        return this.payerLastName != null ? this.payerLastName : "Millenium";
    }
    
    /**
     * Obtener nombre completo del pagador
     */
    public String getPayerFullName() {
        return getEffectivePayerFirstName() + " " + getEffectivePayerLastName();
    }
    
    /**
     * Obtener tipo de identificación con valor por defecto
     */
    public String getEffectiveIdentificationType() {
        return this.identificationType != null ? this.identificationType : "DNI";
    }
    
    /**
     * Obtener número de identificación con valor por defecto
     */
    public String getEffectiveIdentificationNumber() {
        return this.identificationNumber != null ? this.identificationNumber : "00000000";
    }
    
    /**
     * Obtener descripción con valor por defecto
     */
    public String getEffectiveDescription() {
        return this.description != null ? this.description : 
               "Compra desde " + (this.brickType != null ? this.brickType : "payment") + " Brick";
    }
    
    /**
     * Obtener cuotas con valor por defecto
     */
    public Integer getEffectiveInstallments() {
        return this.installments != null ? this.installments : 1;
    }
    
    // ✅ MÉTODOS DE VALIDACIÓN
    
    /**
     * Valida si el DTO contiene los datos mínimos requeridos
     */
    public boolean isValid() {
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0 &&
               getEffectivePayerEmail() != null && !getEffectivePayerEmail().trim().isEmpty();
    }
    
    /**
     * Valida si es un pago con token (tarjeta)
     */
    public boolean isTokenPayment() {
        return token != null && !token.trim().isEmpty();
    }
    
    /**
     * Valida si es un pago en efectivo
     */
    public boolean isCashPayment() {
        return "rapipago".equals(paymentMethodId) || "pagofacil".equals(paymentMethodId);
    }
    
    /**
     * Valida si es un pago con Wallet Brick
     */
    public boolean isWalletPayment() {
        return "wallet".equals(brickType);
    }
    
    /**
     * Valida si requiere identificación (pagos en efectivo)
     */
    public boolean requiresIdentification() {
        return isCashPayment();
    }
    
    /**
     * Valida si los datos de identificación están completos para pagos en efectivo
     */
    public boolean hasValidIdentification() {
        if (!requiresIdentification()) return true;
        
        return getEffectiveIdentificationType() != null && 
               getEffectiveIdentificationNumber() != null &&
               !getEffectiveIdentificationNumber().trim().isEmpty();
    }
    
    /**
     * Obtiene información de validación detallada
     */
    public ValidationResult validate() {
        ValidationResult result = new ValidationResult();
        
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            result.addError("El monto debe ser mayor a cero");
        }
        
        if (getEffectivePayerEmail() == null || getEffectivePayerEmail().trim().isEmpty()) {
            result.addError("El email del pagador es requerido");
        }
        
        if (isTokenPayment() && token.trim().isEmpty()) {
            result.addError("El token es requerido para pagos con tarjeta");
        }
        
        if (isCashPayment() && !hasValidIdentification()) {
            result.addError("La identificación es requerida para pagos en efectivo");
        }
        
        if (paymentMethodId == null || paymentMethodId.trim().isEmpty()) {
            result.addError("El método de pago es requerido");
        }
        
        return result;
    }
    
    // ✅ Clase para resultado de validación
    public static class ValidationResult {
        private boolean valid = true;
        private java.util.List<String> errors = new java.util.ArrayList<>();
        
        public void addError(String error) {
            this.valid = false;
            this.errors.add(error);
        }
        
        public boolean isValid() { return valid; }
        public java.util.List<String> getErrors() { return errors; }
        public String getErrorMessage() { 
            return String.join("; ", errors); 
        }
    }
    
    // ✅ MÉTODOS DE CONVENIENCIA
    
    /**
     * Crear DTO para pago en efectivo
     */
    public static BricksPaymentDTO createCashPayment(String paymentMethodId, BigDecimal amount, 
                                                   String email, String firstName, String lastName,
                                                   String identificationType, String identificationNumber) {
        BricksPaymentDTO dto = new BricksPaymentDTO();
        dto.setPaymentMethodId(paymentMethodId);
        dto.setAmount(amount);
        dto.setPayerEmail(email);
        dto.setPayerFirstName(firstName);
        dto.setPayerLastName(lastName);
        dto.setIdentificationType(identificationType);
        dto.setIdentificationNumber(identificationNumber);
        dto.setBrickType("payment");
        dto.setDescription("Pago en efectivo - " + 
                          ("rapipago".equals(paymentMethodId) ? "Rapipago" : "Pago Fácil"));
        return dto;
    }
    
    /**
     * Crear DTO para pago con tarjeta
     */
    public static BricksPaymentDTO createCardPayment(String token, String paymentMethodId, 
                                                   Integer installments, BigDecimal amount,
                                                   String email, String firstName, String lastName) {
        BricksPaymentDTO dto = new BricksPaymentDTO();
        dto.setToken(token);
        dto.setPaymentMethodId(paymentMethodId);
        dto.setInstallments(installments);
        dto.setAmount(amount);
        dto.setBrickType("payment");
        
        // Usar objeto payer para mejor estructura
        PayerInfo payer = new PayerInfo();
        payer.setEmail(email);
        payer.setFirstName(firstName);
        payer.setLastName(lastName);
        dto.setPayer(payer);
        
        return dto;
    }
    
    @Override
    public String toString() {
        return "BricksPaymentDTO{" +
                "token='" + (token != null ? "[PROVIDED]" : "null") + '\'' +
                ", paymentMethodId='" + paymentMethodId + '\'' +
                ", installments=" + installments +
                ", issuerId='" + issuerId + '\'' +
                ", paymentType='" + paymentType + '\'' +
                ", amount=" + amount +
                ", brickType='" + brickType + '\'' +
                ", description='" + description + '\'' +
                ", payer=" + (payer != null ? payer.toString() : "null") +
                ", payerEmail='" + payerEmail + '\'' +
                ", payerFirstName='" + payerFirstName + '\'' +
                ", payerLastName='" + payerLastName + '\'' +
                ", identificationType='" + identificationType + '\'' +
                ", identificationNumber='" + identificationNumber + '\'' +
                '}';
    }
    
    /**
     * Método para logging seguro (oculta datos sensibles)
     */
    public String toSafeString() {
        return "BricksPaymentDTO{" +
                "paymentMethodId='" + paymentMethodId + '\'' +
                ", installments=" + installments +
                ", amount=" + amount +
                ", brickType='" + brickType + '\'' +
                ", description='" + description + '\'' +
                ", payerEmail='" + (payerEmail != null ? "[EMAIL_PROVIDED]" : "null") + '\'' +
                ", identificationType='" + identificationType + '\'' +
                '}';
    }
}
