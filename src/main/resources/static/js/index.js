const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey, {
    locale: 'es-AR'
});
const bricksBuilder = mercadopago.bricks();

// Variables globales
let paymentId;
let bricksInitialized = false;
let customerData = {
    firstName: '',
    lastName: '', 
    email: '',
    dniType: 'DNI',
    dniNumber: '',
    phone: ''
};

// ========== FUNCIONES DE VALIDACIÓN ==========
function validateCustomerForm() {
    const firstName = document.getElementById('customer-first-name').value.trim();
    const lastName = document.getElementById('customer-last-name').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    
    const errors = [];
    
    if (!firstName) errors.push('El nombre es requerido');
    if (!lastName) errors.push('El apellido es requerido');
    if (!email) {
        errors.push('El email es requerido');
    } else if (!isValidEmail(email)) {
        errors.push('El email no tiene un formato válido');
    }
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showValidationErrors(errors) {
    let errorContainer = document.getElementById('validation-errors');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'validation-errors';
        errorContainer.style.cssText = `
            background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; 
            padding: 15px; margin: 15px 0; color: #c53030;
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
            setTimeout(() => {
                if (errorContainer && errorContainer.parentNode) {
                    errorContainer.parentNode.removeChild(errorContainer);
                }
            }, 500);
        }
    }, 5000);
}

// ========== FUNCIONES DEL CARRITO ==========
function addToCart(productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityInput.value);
    const feedback = document.getElementById(`feedback-${productId}`);
    
    if (quantity > 0) {
        updateCart(productId, quantity);
        feedback.textContent = "✓ Agregado al carrito";
        feedback.style.color = "#28a745";
        setTimeout(() => feedback.textContent = "", 2000);
    } else {
        feedback.textContent = "Selecciona una cantidad";
        feedback.style.color = "#dc3545";
        setTimeout(() => feedback.textContent = "", 2000);
    }
}

function updateCart(productId, quantity) {
    const quantityNum = parseInt(quantity);
    const product = products.find(p => p.id === productId);
    
    if (quantityNum === 0) {
        cart = cart.filter(item => item.id !== productId);
    } else {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity = quantityNum;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantityNum,
                image: product.image
            });
        }
    }
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('checkout-btn');
    const amountInput = ensureAmountField();
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    if (!cart || cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted text-center">Tu carrito está vacío</p>';
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '💳 Ir a Pagar';
        }
        amountInput.value = '0';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            cartItemsContainer.innerHTML += `
                <div class="cart-item p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="font-weight-bold">${item.name}</small><br>
                            <small class="text-muted">${item.quantity} x $${item.price.toLocaleString()}</small>
                        </div>
                        <span class="font-weight-bold price">$${itemTotal.toLocaleString()}</span>
                    </div>
                </div>
            `;
        });
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = `💳 Pagar $${total.toLocaleString()}`;
        }
        amountInput.value = total.toFixed(2);
    }
    
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) cartTotalElement.textContent = `$${total.toLocaleString()}`;
    updateSummaryTotal();
}

function calculateCartTotal() {
    console.log('🛒 Calculando total del carrito...');
    
    if (!cart || cart.length === 0) {
        console.warn('⚠️ Carrito vacío o no definido');
        return 0;
    }
    
    let total = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        console.log(`📦 Item ${index + 1}: ${item.name} x${item.quantity} = $${itemTotal}`);
    });
    
    console.log('💰 Total calculado:', total);
    return total;
}

// ========== FUNCIONES DE NAVEGACIÓN ==========
function showCustomerForm() {
    const existingErrors = document.getElementById('validation-errors');
    if (existingErrors) existingErrors.remove();
    
    document.querySelector('.container__cart').style.display = 'none';
    document.querySelector('#customer-form-section').style.display = 'block';
    document.querySelector('.container__payment').style.display = 'none';
    
    updateCustomerCartSummary();
    captureCustomerFormData();
}

function updateCustomerCartSummary() {
    const summaryContainer = document.getElementById('customer-cart-summary');
    const totalElement = document.getElementById('customer-cart-total');
    
    summaryContainer.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        summaryContainer.innerHTML += `
            <div class="cart-item p-2">
                <div class="d-flex justify-content-between">
                    <span>${item.name} x${item.quantity}</span>
                    <span class="price">$${itemTotal.toLocaleString()}</span>
                </div>
            </div>
        `;
    });
    
    totalElement.textContent = `$${total.toLocaleString()}`;
}

function captureCustomerFormData() {
    customerData = {
        firstName: document.getElementById('customer-first-name').value.trim() || 'Cliente',
        lastName: document.getElementById('customer-last-name').value.trim() || 'Millenium',
        email: document.getElementById('customer-email').value.trim() || 'cliente@millenium.com',
        dniType: document.getElementById('customer-dni-type').value || 'DNI',
        dniNumber: document.getElementById('customer-dni-number').value.trim() || '00000000',
        phone: document.getElementById('customer-phone').value.trim() || ''
    };
    
    console.log('📝 Datos del comprador capturados:', customerData);
}

function skipCustomerInfo() {
    captureCustomerFormData();
    goToPayment();
}

function goToPayment() {
    console.log('🚀 Intentando ir a pagos...');
    console.log('👤 CustomerData al ir a pagos:', customerData);
    
    if (bricksInitialized) {
        document.querySelector('.container__cart').style.display = 'none';
        document.querySelector('#customer-form-section').style.display = 'none';
        document.querySelector('.container__payment').style.display = 'block';
        return;
    }
    
    document.querySelector('.container__cart').style.display = 'none';
    document.querySelector('#customer-form-section').style.display = 'none';
    document.querySelector('.container__payment').style.display = 'block';
    
    initializePaymentBricks();
}

function verifyCartBeforePayment() {
    const total = calculateCartTotal();
    const hasItems = cart && cart.length > 0;
    
    console.log('🔍 Verificación pre-pago:', { hasItems, total });
    
    if (!hasItems || total <= 0) {
        showTemporaryMessage('❌ Error: El carrito está vacío', 'error');
        return false;
    }
    
    return true;
}

// ========== FUNCIÓN AUXILIAR PARA DETECTAR TIPO DE TARJETA ==========
function detectPaymentType(formData) {
    // Si ya viene el payment_type en formData, usarlo
    if (formData.payment_type) {
        return formData.payment_type;
    }
    
    // Detectar por payment_method_id
    const paymentMethodId = formData.payment_method_id ? formData.payment_method_id.toLowerCase() : '';
    const debitPrefixes = ['deb', 'debito', 'debit'];
    
    // Si el payment_method_id comienza con prefijos de débito
    if (debitPrefixes.some(prefix => paymentMethodId.startsWith(prefix))) {
        return 'debit_card';
    }
    
    // Por defecto, crédito
    return 'credit_card';
}

// ========== FUNCIONES DE MERCADO PAGO ==========
async function createMercadoPagoPreference(amount) {
    try {
        console.log('🔄 Creando preferencia en Mercado Pago, monto:', amount);
        
        const response = await fetch('/process_payment/create_wallet_preference', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: amount,
                description: `Compra de ${cart.length} productos Millenium`
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error creando preferencia:', errorText);
            throw new Error('Error del servidor al crear preferencia');
        }
        
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        
        console.log('✅ Preferencia creada:', result.id);
        return result.id;
        
    } catch (error) {
        console.error('❌ Error creando preferencia:', error);
        return null;
    }
}

async function initializePaymentBricks() {
    if (bricksInitialized) return;
    bricksInitialized = true;
    
    const total = calculateCartTotal();
    const userEmail = customerData.email || "cliente@millenium.com";
    
    console.log('💰 Inicializando Bricks - Monto:', total, 'Email:', userEmail);
    console.log('👤 CustomerData en Bricks:', customerData);

    try {
        const preferenceId = await createMercadoPagoPreference(total);
        if (preferenceId) await initializeWalletBrickWithPreference(preferenceId);
    } catch (error) {
        console.log('ℹ️ Wallet Brick no disponible');
    }

    await initializePaymentBrick(total, userEmail);
}

async function initializeWalletBrickWithPreference(preferenceId) {
    try {
        const walletContainer = document.getElementById('walletBrick_container');
        if (!walletContainer) return;

        console.log('👛 Inicializando Wallet Brick con preferencia:', preferenceId);

        window.walletBrickController = await bricksBuilder.create("wallet", "walletBrick_container", {
            initialization: { preferenceId: preferenceId },
            callbacks: {
                onReady: () => console.log("✅ Wallet Brick ready con preferencia"),
                onError: (error) => {
                    console.error("❌ Wallet Brick error:", error);
                    walletContainer.innerHTML = `
                        <div style="background: #2d2d2d; color: #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #444;">
                            <h5>👛 Billetera No Disponible</h5>
                            <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                        </div>
                    `;
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error creando Wallet Brick con preferencia:', error);
        const walletContainer = document.getElementById('walletBrick_container');
        if (walletContainer) {
            walletContainer.innerHTML = `
                <div style="background: #2d2d2d; color: #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #444;">
                    <h5>👛 Billetera No Disponible</h5>
                    <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                </div>
            `;
        }
    }
}

async function initializePaymentBrick(total, userEmail) {
    try {
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (!paymentContainer) {
            console.error('❌ Contenedor paymentBrick_container no encontrado');
            return;
        }

        console.log('💳 Inicializando Payment Brick corregido');
        console.log('👤 CustomerData en Payment Brick:', customerData);

        const settings = {
            initialization: {
                amount: total,
                payer: {
                    email: userEmail,
                    firstName: customerData.firstName || "",
                    lastName: customerData.lastName || "",
                }
            },
            callbacks: {
                onReady: () => {
                    console.log('✅ Payment Brick ready');
                    showTemporaryMessage('Formulario de pago listo', 'success');
                },
                onSubmit: async ({ selectedPaymentMethod, formData }) => {
                    console.log('🔄 ========== INICIANDO ENVÍO AL BACKEND ==========');
                    console.log('🔍 selectedPaymentMethod:', selectedPaymentMethod);
                    console.log('🔍 formData COMPLETO:', JSON.stringify(formData, null, 2));
                    console.log('👤 customerData disponible:', customerData);
                    console.log('💰 Total del carrito:', calculateCartTotal());
                    console.log('📦 Items en carrito:', cart);
                    
                    return new Promise(async (resolve, reject) => {
                        try {
                            let endpoint = '';
                            let requestData = {};

                            if (selectedPaymentMethod === 'ticket') {
                                // ✅ PAGO EN EFECTIVO - Usar directamente el payment_method_id del formData
                                endpoint = '/process_payment/create_ticket_payment';
                                console.log('🎫 Enviando a endpoint de efectivo:', endpoint);
                                
                                // ✅ USAR DIRECTAMENTE EL MÉTODO QUE YA SELECCIONÓ EL USUARIO
                                const paymentMethodId = formData.payment_method_id;
                                console.log('🎯 Método de pago seleccionado por el usuario:', paymentMethodId);

                                if (!paymentMethodId) {
                                    throw new Error('No se recibió el método de pago en efectivo seleccionado');
                                }

                                requestData = {
                                    paymentMethodId: paymentMethodId,
                                    amount: formData.transactionAmount ? parseFloat(formData.transactionAmount) : total,
                                    payerEmail: customerData.email || "cliente@millenium.com",
                                    payerFirstName: customerData.firstName || "Cliente",
                                    payerLastName: customerData.lastName || "Millenium",
                                    identificationType: customerData.dniType || "DNI",
                                    identificationNumber: customerData.dniNumber || "00000000",
                                    description: `Compra de ${cart.length} productos Millenium`
                                };
                                
                                console.log('📤 DATOS A ENVIAR AL BACKEND (EFECTIVO):', JSON.stringify(requestData, null, 2));
                                
                            } else {
                                // ✅ PAGO CON TARJETA
                                endpoint = '/process_payment/process_bricks_payment';
                                console.log('💳 Enviando a endpoint de tarjeta:', endpoint);
                                
                                // ✅ CORRECCIÓN: DETECCIÓN AUTOMÁTICA DEL TIPO DE TARJETA
                                const detectedPaymentType = detectPaymentType(formData);
                                console.log('🎯 Tipo de tarjeta detectado:', detectedPaymentType);
                                
                                requestData = {
                                    token: formData.token,
                                    paymentMethodId: formData.payment_method_id,
                                    installments: parseInt(formData.installments) || 1,
                                    issuerId: formData.issuer_id,
                                    paymentType: detectedPaymentType, // ✅ USAR LA DETECCIÓN CORRECTA
                                    amount: parseFloat(formData.transactionAmount) || total,
                                    brickType: 'payment',
                                    description: `Compra de ${cart.length} productos Millenium`,
                                    payerEmail: customerData.email || "cliente@millenium.com",
                                    payerFirstName: customerData.firstName || "Cliente",
                                    payerLastName: customerData.lastName || "Millenium"
                                };
                                
                                console.log('📤 DATOS A ENVIAR AL BACKEND (TARJETA):', JSON.stringify(requestData, null, 2));
                            }

                            // Validaciones finales
                            if (!requestData.amount || requestData.amount <= 0) {
                                console.warn('⚠️ Monto inválido, usando total del carrito');
                                requestData.amount = calculateCartTotal();
                            }
                            
                            console.log('🎯 ENDPOINT FINAL:', endpoint);
                            console.log('🎯 REQUEST DATA FINAL:', JSON.stringify(requestData, null, 2));

                            // ✅ ENVIAR DATOS AL BACKEND
                            console.log('🚀 ENVIANDO REQUEST AL BACKEND...');
                            const response = await fetch(endpoint, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(requestData),
                            });

                            console.log('📥 RESPONSE STATUS:', response.status);
                            console.log('📥 RESPONSE OK:', response.ok);

                            if (!response.ok) {
                                const errorText = await response.text();
                                console.error('❌ ERROR DEL SERVIDOR:', errorText);
                                throw new Error(`HTTP ${response.status}: ${errorText}`);
                            }

                            const result = await response.json();
                            console.log('✅ RESPUESTA EXITOSA DEL BACKEND:', JSON.stringify(result, null, 2));
                            
                            if (result.id) {
                                paymentId = result.id;
                                console.log('💰 PAYMENT ID OBTENIDO:', paymentId);
                                
                                if (selectedPaymentMethod === 'ticket') {
                                    console.log('🎫 Mostrando resultado de pago en efectivo');
                                    showCashPaymentResult(result);
                                } else {
                                    console.log('💳 Mostrando Status Screen Brick');
                                    renderStatusScreenBrick(bricksBuilder, result);
                                }
                                
                                $('.container__payment').fadeOut(500, () => {
                                    $('.container__result').fadeIn(500);
                                });
                            } else {
                                throw new Error('No se recibió ID de pago del servidor');
                            }
                            
                            resolve();
                        } catch (error) {
                            console.error('❌ ERROR EN EL PROCESO DE PAGO:', error);
                            console.error('❌ Stack trace:', error.stack);
                            showTemporaryMessage(`Error: ${error.message}`, 'error');
                            reject();
                        }
                    });
                },
                onError: (error) => {
                    console.error('❌ Payment Brick error:', error);
                    showTemporaryMessage(`Error en formulario: ${error.message}`, 'error');
                }
            },
            customization: {
                paymentMethods: {
                    // ✅ SOLO LOS MEDIOS DE PAGO QUE NECESITAS
                    ticket: "all",           // Efectivo (Rapipago, Pago Fácil)
                    creditCard: "all",       // Tarjetas de crédito
                    debitCard: "all",        // Tarjetas de débito
                    mercadoPago: "all",      // Cuenta Mercado Pago
                    prepaidCard: "all"       // Tarjetas prepagas
                },
                visual: {
                    style: {
                        theme: 'dark',
                        customVariables: {
                            formBackgroundColor: '#1d2431',
                            baseColor: 'aquamarine', 
                            outlinePrimaryColor: 'aquamarine',
                            buttonTextColor: '#1d2431'
                        }
                    }
                }
            }
        };

        window.paymentBrickController = await bricksBuilder.create(
            "payment",
            "paymentBrick_container", 
            settings
        );
        
        console.log('✅ Payment Brick creado exitosamente');
        
    } catch (error) {
        console.error('❌ Error creando Payment Brick:', error);
        showTemporaryMessage('Error al cargar formulario de pago', 'error');
    }
}

// ========== FUNCIONES AUXILIARES ==========
function showCashPaymentResult(paymentResult) {
    const paymentMethod = paymentResult.payment_method_id || paymentResult.paymentMethodId || 'pagofacil';
    const paymentMethodName = paymentMethod === 'rapipago' ? 'Rapipago' : 'Pago Fácil';
    
    document.querySelector('.container__payment').style.display = 'none';
    document.querySelector('.container__result').style.display = 'block';
    
    const resultContainer = document.querySelector('.container__result');
    resultContainer.innerHTML = `
        <div class="success-animation">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
        </div>
        
        <h2 class="success-title">¡Pago en Efectivo Creado Exitosamente!</h2>
        
        <div class="payment-details">
            <div class="detail-item">
                <span class="detail-label">Método de Pago:</span>
                <span class="detail-value">${paymentMethodName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Monto:</span>
                <span class="detail-value">$${paymentResult.transaction_amount ? paymentResult.transaction_amount.toLocaleString('es-AR') : (paymentResult.transactionAmount || calculateCartTotal()).toLocaleString('es-AR')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Número de Operación:</span>
                <span class="detail-value">${paymentResult.id || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Estado:</span>
                <span class="detail-value status-pending">Pendiente de Pago</span>
            </div>
        </div>
        
        <div class="voucher-info">
            <h4>📋 Instrucciones para pagar:</h4>
            <p>Acércate a cualquier sucursal de <strong>${paymentMethodName}</strong> y presenta este código:</p>
            <div class="voucher-code">
                <strong>${paymentResult.id || 'N/A'}</strong>
            </div>
            <p class="expiration-info">⏰ Tienes 3 días hábiles para realizar el pago</p>
        </div>
        
        <div class="action-buttons">
            <button id="download-voucher" class="btn btn-primary">
                📄 Descargar Voucher
            </button>
            <button id="back-to-store" class="btn btn-secondary">
                🏪 Volver a la Tienda
            </button>
        </div>
    `;
    
    document.getElementById('download-voucher').addEventListener('click', function() {
        if (paymentResult.id) {
            downloadCashVoucher(paymentResult.id);
        } else {
            showTemporaryMessage('No hay ID de pago disponible para descargar el voucher', 'warning');
        }
    });
    
    document.getElementById('back-to-store').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
}

function downloadCashVoucher(paymentId) {
    const url = `/process_payment/download_voucher/${paymentId}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Error al descargar el voucher');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `voucher-${paymentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showTemporaryMessage('✅ Voucher descargado exitosamente', 'success');
        })
        .catch(error => {
            console.error('Error downloading voucher:', error);
            showTemporaryMessage('❌ Error al descargar el voucher: ' + error.message, 'error');
        });
}

const renderStatusScreenBrick = async (bricksBuilder, result) => {
    paymentId = result.id;
    console.log('Payment ID:', paymentId);

    try {
        const statusContainer = document.getElementById('statusScreenBrick_container');
        if (statusContainer) statusContainer.innerHTML = '';

        if (window.statusScreenBrickController) {
            try { await window.statusScreenBrickController.unmount(); } catch (e) {}
        }

        window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
            initialization: { paymentId: paymentId },
            callbacks: {
                onReady: () => console.log('Status Screen Brick ready'),
                onError: (error) => console.error('Error en Status Screen Brick:', error)
            }
        });
    } catch (error) {
        console.error('❌ Error creando Status Screen:', error);
    }
};

// ========== FUNCIONES DE UTILIDAD ==========
function ensureAmountField() {
    let amountInput = document.getElementById('amount');
    if (!amountInput) {
        amountInput = document.createElement('input');
        amountInput.id = 'amount';
        amountInput.type = 'hidden';
        amountInput.value = '0';
        document.body.appendChild(amountInput);
    }
    return amountInput;
}

function updateSummaryTotal() {
    const amountInput = ensureAmountField();
    const summaryTotal = document.getElementById('summary-total');
    if (summaryTotal) {
        const amount = parseFloat(amountInput.value);
        summaryTotal.textContent = amount > 0 ? '$' + amount.toLocaleString('es-AR') : '$0';
    }
}

function showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    const styles = {
        info: { background: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' },
        error: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
        warning: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' },
        success: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' }
    };
    
    const style = styles[type] || styles.info;
    
    messageDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        border-radius: 8px; z-index: 10000; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background: ${style.background}; color: ${style.color};
        border: ${style.border}; max-width: 300px;
    `;
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv);
        }, 500);
    }, 4000);
}

function resetBricksState() {
    bricksInitialized = false;
    if (window.paymentBrickController) {
        try { window.paymentBrickController.unmount(); } catch (error) {}
    }
    if (window.walletBrickController) {
        try { window.walletBrickController.unmount(); } catch (error) {}
    }
    if (window.statusScreenBrickController) {
        try { window.statusScreenBrickController.unmount(); } catch (error) {}
    }
}

// ========== INICIALIZACIÓN ==========
$(document).ready(function() {
    ensureAmountField();
    updateSummaryTotal();
    
    // Manejar formulario del comprador
    const customerForm = document.getElementById('customer-info-form');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!validateCustomerForm()) return;
            captureCustomerFormData();
            console.log('✅ Datos enviados a pago:', customerData);
            goToPayment();
        });
    }
    
    // Event listeners de botones
    $('#checkout-btn').on('click', function() {
        if (!verifyCartBeforePayment()) return;
        showCustomerForm();
    });

    $('#go-back').on('click', function() {
        $('.container__payment').fadeOut(500);
        setTimeout(() => {
            $('.container__cart').show(500).fadeIn();
            resetBricksState();
        }, 500);
    });

    $('#skip-customer-info').on('click', function() {
        skipCustomerInfo();
    });

    $('#edit-cart').on('click', function() {
        $('.container__payment').fadeOut(500);
        setTimeout(() => {
            $('.container__cart').show(500).fadeIn();
            resetBricksState();
        }, 500);
    });

    // Inicializar carrito
    updateCartDisplay();
});
