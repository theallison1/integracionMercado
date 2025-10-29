import { CUSTOMER_DATA_DEFAULT } from '../config/constants.js';
import { highlightField, showTemporaryMessage } from './utils.js';

let customerData = { ...CUSTOMER_DATA_DEFAULT };

export const getCustomerData = () => ({ ...customerData });

export const setCustomerData = (newData) => {
    customerData = { ...customerData, ...newData };
};

export const validateCustomerForm = () => {
    const firstName = document.getElementById('customer-first-name').value.trim();
    const lastName = document.getElementById('customer-last-name').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    
    const errors = [];
    
    if (!firstName) {
        errors.push('El nombre es requerido');
        highlightField('customer-first-name', true);
    } else {
        highlightField('customer-first-name', false);
    }
    
    if (!lastName) {
        errors.push('El apellido es requerido');
        highlightField('customer-last-name', true);
    } else {
        highlightField('customer-last-name', false);
    }
    
    if (!email) {
        errors.push('El email es requerido');
        highlightField('customer-email', true);
    } else if (!isValidEmail(email)) {
        errors.push('El email no tiene un formato válido');
        highlightField('customer-email', true);
    } else {
        highlightField('customer-email', false);
    }
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return false;
    }
    
    return true;
};

export const showValidationErrors = (errors) => {
    let errorContainer = document.getElementById('validation-errors');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'validation-errors';
        errorContainer.style.cssText = `
            background: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            color: #c53030;
        `;
        
        const form = document.getElementById('customer-info-form');
        form.parentNode.insertBefore(errorContainer, form);
    }
    
    errorContainer.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="background: #c53030; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px;">!</span>
            <strong>Por favor corrige los siguientes errores:</strong>
        </div>
        <ul style="margin: 0; padding-left: 20px;">
            ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
    `;
    
    setTimeout(() => {
        if (errorContainer) {
            errorContainer.style.opacity = '0';
            errorContainer.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (errorContainer && errorContainer.parentNode) {
                    errorContainer.parentNode.removeChild(errorContainer);
                }
            }, 500);
        }
    }, 5000);
};

export const showCustomerForm = () => {
    const existingErrors = document.getElementById('validation-errors');
    if (existingErrors) {
        existingErrors.remove();
    }
    
    document.querySelector('.container__cart').style.display = 'none';
    document.querySelector('#customer-form-section').style.display = 'block';
    document.querySelector('.container__payment').style.display = 'none';
    
    updateCustomerCartSummary();
};

export const skipCustomerInfo = () => {
    customerData = {
        firstName: document.getElementById('customer-first-name').value.trim() || 'Cliente',
        lastName: document.getElementById('customer-last-name').value.trim() || 'Millenium',
        email: document.getElementById('customer-email').value.trim() || 'cliente@millenium.com',
        dniType: document.getElementById('customer-dni-type').value,
        dniNumber: document.getElementById('customer-dni-number').value.trim(),
        phone: document.getElementById('customer-phone').value.trim()
    };
    
    return customerData;
};