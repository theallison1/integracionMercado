export class FormValidator {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateCustomerForm(formData) {
        const errors = [];
        
        if (!formData.firstName?.trim()) {
            errors.push('El nombre es requerido');
        }
        
        if (!formData.lastName?.trim()) {
            errors.push('El apellido es requerido');
        }
        
        if (!formData.email?.trim()) {
            errors.push('El email es requerido');
        } else if (!this.validateEmail(formData.email)) {
            errors.push('El email no tiene un formato válido');
        }
        
        return errors;
    }

    static highlightField(fieldId, hasError) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        field.style.borderColor = hasError ? '#dc3545' : '#28a745';
        field.style.backgroundColor = hasError ? '#fff5f5' : '';
    }
}
