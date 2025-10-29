import { ensureAmountField, updateSummaryTotal, showTemporaryMessage } from './modules/utils.js';
import { validateCustomerForm, showCustomerForm, skipCustomerInfo, setCustomerData } from './modules/customerForm.js';
import { calculateCartTotal, updateCartDisplay, addToCart, updateCart } from './modules/cartManager.js';
import { goToPayment, resetBricksState, getPaymentId } from './modules/paymentBricks.js';
import { handlePaymentSubmission, downloadReceipt } from './services/paymentService.js';

// Variables globales que necesitan mantenerse
let products = []; // Definir según tu aplicación
let cart = []; // Inicializar según tu aplicación

// Funciones de navegación
export const goBackToPayments = () => {
    console.log('Volviendo a pagos.html');
    window.location.href = 'pagos.html';
};

// Inicialización
$(document).ready(function() {
    ensureAmountField();
    updateSummaryTotal();
    
    // MANEJAR FORMULARIO DEL COMPRADOR
    const customerForm = document.getElementById('customer-info-form');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateCustomerForm()) {
                return;
            }
            
            setCustomerData({
                firstName: document.getElementById('customer-first-name').value.trim(),
                lastName: document.getElementById('customer-last-name').value.trim(),
                email: document.getElementById('customer-email').value.trim(),
                dniType: document.getElementById('customer-dni-type').value,
                dniNumber: document.getElementById('customer-dni-number').value.trim(),
                phone: document.getElementById('customer-phone').value.trim()
            });
            
            goToPayment();
        });
    }
    
    // BOTÓN "Ir a Pagar"
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', function() {
            const cartTotal = calculateCartTotal();
            const hasItemsInCart = cart && cart.length > 0;
            
            if (!hasItemsInCart || cartTotal <= 0) {
                showTemporaryMessage(' Error: El carrito está vacío o el monto es inválido.', 'error');
                return;
            }
            
            showCustomerForm();
        });
    }

    // BOTÓN "Volver al catálogo"
    const goBackBtn = $('#go-back');
    if (goBackBtn.length) {
        goBackBtn.on('click', function() {
            $('.container__payment').fadeOut(500);
            setTimeout(() => {
                $('.container__cart').show(500).fadeIn();
                resetBricksState();
            }, 500);
        });
    }

    // BOTÓN "Descargar Comprobante"
    const downloadReceiptBtn = $('#download-receipt');
    if (downloadReceiptBtn.length) {
        downloadReceiptBtn.on('click', function() {
            const paymentId = getPaymentId();
            if (!paymentId) {
                showTemporaryMessage('No hay un ID de pago disponible para descargar el comprobante.', 'warning');
                return;
            }
            downloadReceipt(paymentId);
        });
    }

    // BOTÓN "Volver a Pagos"
    const backToPaymentsBtn = $('#back-to-payments');
    if (backToPaymentsBtn.length) {
        backToPaymentsBtn.on('click', function() {
            goBackToPayments();
        });
    }

    // BOTÓN "Saltar formulario"
    const skipFormBtn = $('#skip-customer-form');
    if (skipFormBtn.length) {
        skipFormBtn.on('click', function() {
            const customerData = skipCustomerInfo();
            setCustomerData(customerData);
            goToPayment();
        });
    }

    // INICIALIZAR CARRITO AL CARGAR
    if (typeof updateCartDisplay === 'function') {
        updateCartDisplay();
    }

    console.log(' JavaScript cargado correctamente - Versión modularizada');
});

// Exportar funciones globales necesarias
window.addToCart = (productId) => addToCart(productId, products);
window.updateCart = (productId, quantity) => updateCart(productId, quantity, products);
window.handlePaymentSubmission = handlePaymentSubmission;
window.goBackToPayments = goBackToPayments;
window.downloadReceipt = downloadReceipt;