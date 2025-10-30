const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey, {
    locale: 'es-AR'
});
const bricksBuilder = mercadopago.bricks();
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

// ✅ FUNCIÓN MEJORADA: Validar formulario del comprador
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

function highlightField(fieldId, hasError) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.borderColor = hasError ? '#dc3545' : '#28a745';
        field.style.backgroundColor = hasError ? '#fff5f5' : '';
    }
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

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

function updateSummaryTotal() {
    const amountInput = ensureAmountField();
    const summaryTotal = document.getElementById('summary-total');
    if (summaryTotal) {
        const amount = parseFloat(amountInput.value);
        summaryTotal.textContent = amount > 0 ? '$' + amount.toLocaleString('es-AR') : '$0';
    }
}

function showCustomerForm() {
    const existingErrors = document.getElementById('validation-errors');
    if (existingErrors) existingErrors.remove();
    
    document.querySelector('.container__cart').style.display = 'none';
    document.querySelector('#customer-form-section').style.display = 'block';
    document.querySelector('.container__payment').style.display = 'none';
    
    updateCustomerCartSummary();
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

function skipCustomerInfo() {
    customerData = {
        firstName: document.getElementById('customer-first-name').value.trim() || 'Cliente',
        lastName: document.getElementById('customer-last-name').value.trim() || 'Millenium',
        email: document.getElementById('customer-email').value.trim() || 'cliente@millenium.com',
        dniType: document.getElementById('customer-dni-type').value,
        dniNumber: document.getElementById('customer-dni-number').value.trim(),
        phone: document.getElementById('customer-phone').value.trim()
    };
    goToPayment();
}

function goToPayment() {
    console.log('🚀 Intentando ir a pagos...');
    
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

// ✅ FUNCIÓN CORREGIDA: Inicializar Payment Brick
async function initializePaymentBrick(total, userEmail) {
    try {
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (!paymentContainer) {
            console.error('❌ Contenedor paymentBrick_container no encontrado');
            return;
        }

        console.log('💳 Inicializando Payment Brick, monto:', total);

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
                    console.log('✅ Payment Brick ready - Formulario listo para usar');
                },
                onSubmit: (cardForm) => {
                    console.log('🔄 Payment Brick onSubmit - Datos COMPLETOS:', cardForm);
                    
                    const { selectedPaymentMethod, formData } = cardForm;
                    
                    // ✅ DEBUG EXTENDIDO - VER QUÉ ENVÍA REALMENTE EL BRICK
                    console.log('🔍 selectedPaymentMethod:', selectedPaymentMethod);
                    console.log('🔍 formData:', formData);
                    console.log('🔍 formData keys:', formData ? Object.keys(formData) : 'no formData');
                    
                    if (formData) {
                        console.log('🔍 payment_method_id:', formData.payment_method_id);
                        console.log('🔍 token:', formData.token);
                    }

                    // ✅ SI ES PAGO EN EFECTIVO (PAGO FÁCIL O RAPIPAGO)
                    if (formData && formData.payment_method_id && 
                        (formData.payment_method_id === 'rapipago' || formData.payment_method_id === 'pagofacil')) {
                        
                        console.log('🎫 Procesando pago en efectivo:', formData.payment_method_id);
                        processCashPayment(formData);
                        return;
                    }

                    // ✅ SI ES TARJETA
                    if (formData && formData.token) {
                        console.log('💳 Procesando pago con tarjeta:', formData);
                        
                        if (!formData.token) {
                            alert('Error: No se pudo generar el token de seguridad.');
                            return;
                        }
                        
                        handlePaymentSubmission(formData, 'payment');
                        return;
                    }

                    // ✅ SI LLEGA AQUÍ, ES UN ERROR
                    console.error('❌ No se pudo determinar el tipo de pago:', { selectedPaymentMethod, formData });
                    alert('Error: No se pudieron procesar los datos de pago. Por favor, intenta nuevamente.');
                },
                onError: (error) => {
                    console.error('❌ Payment Brick error:', error);
                    paymentContainer.innerHTML = `
                        <div style="background: #2d2d2d; color: #dc3545; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #dc3545;">
                            <h5>❌ Error en formulario de pago</h5>
                            <p>${error.message || 'Error al cargar el formulario'}</p>
                            <button onclick="location.reload()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                                Recargar página
                            </button>
                        </div>
                    `;
                }
            },
            customization: {
                paymentMethods: {
                    creditCard: "all",
                    debitCard: "all", 
                    ticket: "all",
                    bankTransfer: ["pagoefectivo_atm"]
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
        
    } catch (error) {
        console.error('❌ Error creando Payment Brick:', error);
    }
}

// ✅ FUNCIÓN CORREGIDA: Procesar pago en efectivo
async function processCashPayment(formData) {
    console.log('🎫 Procesando pago en efectivo con formData:', formData);
    
    try {
        const total = calculateCartTotal();
        const paymentMethodId = formData.payment_method_id;
        
        console.log('💰 Total:', total);
        console.log('💰 Método:', paymentMethodId);

        // ✅ VALIDAR DATOS DEL CLIENTE
        if (!customerData.email) {
            throw new Error('Por favor completa tu información en el formulario del cliente');
        }

        if (total <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }

        // ✅ PREPARAR DATOS PARA ENVIAR AL BACKEND
        const paymentData = {
            amount: total,
            paymentMethodId: paymentMethodId,
            description: `Compra de ${cart.length} productos Millenium`,
            payerEmail: customerData.email,
            payerFirstName: customerData.firstName || "Cliente",
            payerLastName: customerData.lastName || "Millenium",
            identificationType: customerData.dniType || "DNI",
            identificationNumber: customerData.dniNumber || "00000000"
        };

        // ✅ LOG DETALLADO DEL JSON QUE SE ENVÍA
        console.log('📤 ========== JSON ENVIADO AL BACKEND ==========');
        console.log('🔍 URL: /process_payment/create_ticket_payment');
        console.log('🔍 Método: POST');
        console.log('🔍 Headers: { "Content-Type": "application/json" }');
        console.log('🔍 Body (JSON):', JSON.stringify(paymentData, null, 2));
        console.log('🔍 Estructura del JSON:');
        console.log('   - amount:', paymentData.amount);
        console.log('   - paymentMethodId:', paymentData.paymentMethodId);
        console.log('   - description:', paymentData.description);
        console.log('   - payerEmail:', paymentData.payerEmail);
        console.log('   - payerFirstName:', paymentData.payerFirstName);
        console.log('   - payerLastName:', paymentData.payerLastName);
        console.log('   - identificationType:', paymentData.identificationType);
        console.log('   - identificationNumber:', paymentData.identificationNumber);
        console.log('========== FIN DEL LOG ==========');

        // ✅ ENVIAR AL SERVIDOR
        const response = await fetch('/process_payment/create_ticket_payment', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            
            if (response.status === 400) {
                throw new Error('Datos inválidos enviados al servidor: ' + errorText);
            } else if (response.status === 403) {
                throw new Error('Mercado Pago ha rechazado la transacción.');
            } else {
                throw new Error('Error del servidor: ' + errorText);
            }
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }

        console.log('✅ Pago en efectivo creado exitosamente:', result);
        showCashPaymentResult(result);

    } catch (error) {
        console.error('❌ Error procesando pago en efectivo:', error);
        showTemporaryMessage(`Error: ${error.message}`, 'error');
    }
}

// ✅ FUNCIÓN: Mostrar resultado de pago en efectivo
function showCashPaymentResult(paymentResult) {
    const paymentMethod = paymentResult.paymentMethodId || 'pagofacil';
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
                <span class="detail-value">$${paymentResult.transactionAmount ? paymentResult.transactionAmount.toLocaleString('es-AR') : calculateCartTotal().toLocaleString('es-AR')}</span>
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

// ✅ FUNCIÓN: Descargar voucher de pago en efectivo
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

// ✅ FUNCIÓN: Mostrar mensajes temporales
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

// ✅ VERIFICAR CARRITO ANTES DE PAGAR
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

// ✅ Status Screen Brick
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

// ✅ handlePaymentSubmission para tarjetas
async function handlePaymentSubmission(paymentData, brickType) {
    console.log(`🔄 Procesando pago desde ${brickType}:`, paymentData);
    
    if (!paymentData || !paymentData.token) {
        console.error('❌ Token no disponible en handlePaymentSubmission:', paymentData);
        alert('Error: No se pudieron obtener los datos de pago. Por favor, intenta nuevamente.');
        return;
    }

    try {
        const requestData = {
            token: paymentData.token,
            paymentMethodId: paymentData.payment_method_id,
            installments: parseInt(paymentData.installments) || 1,
            issuerId: paymentData.issuer_id,
            paymentType: paymentData.payment_type || 'credit_card',
            amount: calculateCartTotal(),
            brickType: brickType,
            description: `Compra de ${cart.length} productos Millenium`,
            payer: {
                email: customerData.email || "cliente@millenium.com",
                firstName: customerData.firstName || "Cliente",
                lastName: customerData.lastName || "Millenium"
            }
        };

        // ✅ LOG DETALLADO PARA PAGOS CON TARJETA
        console.log('📤 ========== JSON ENVIADO AL BACKEND (TARJETA) ==========');
        console.log('🔍 URL: /process_payment/process_bricks_payment');
        console.log('🔍 Método: POST');
        console.log('🔍 Body (JSON):', JSON.stringify(requestData, null, 2));
        console.log('========== FIN DEL LOG ==========');

        const response = await fetch('/process_payment/process_bricks_payment', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error_message || 'Error del servidor');

        paymentId = result.id;
        await renderStatusScreenBrick(bricksBuilder, result);
        
        $('.container__payment').fadeOut(500, () => {
            $('.container__result').fadeIn(500);
        });

    } catch (error) {
        console.error('❌ Error procesando pago:', error);
        alert(`Error: ${error.message}`);
    }
}

// ✅ FUNCIONES DEL CARRITO
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

// ✅ EVENT LISTENERS
$(document).ready(function() {
    ensureAmountField();
    updateSummaryTotal();
    
    const customerForm = document.getElementById('customer-info-form');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!validateCustomerForm()) return;
            
            customerData = {
                firstName: document.getElementById('customer-first-name').value.trim(),
                lastName: document.getElementById('customer-last-name').value.trim(),
                email: document.getElementById('customer-email').value.trim(),
                dniType: document.getElementById('customer-dni-type').value,
                dniNumber: document.getElementById('customer-dni-number').value.trim(),
                phone: document.getElementById('customer-phone').value.trim()
            };
            goToPayment();
        });
    }
    
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', function() {
            if (!verifyCartBeforePayment()) return;
            showCustomerForm();
        });
    }

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

    const downloadReceiptBtn = $('#download-receipt');
    if (downloadReceiptBtn.length) {
        downloadReceiptBtn.on('click', function() {
            if (!paymentId) {
                showTemporaryMessage('No hay un ID de pago disponible para descargar el comprobante.', 'warning');
                return;
            }
            downloadReceipt(paymentId);
        });
    }

    const backToPaymentsBtn = $('#back-to-payments');
    if (backToPaymentsBtn.length) {
        backToPaymentsBtn.on('click', function() {
            goBackToPayments();
        });
    }

    const skipFormBtn = $('#skip-customer-form');
    if (skipFormBtn.length) {
        skipFormBtn.on('click', function() {
            skipCustomerInfo();
        });
    }

    if (typeof updateCartDisplay === 'function') updateCartDisplay();

    console.log('✅ JavaScript cargado correctamente');
});

// ✅ FUNCIONES ADICIONALES
function goBackToPayments() {
    console.log('Volviendo a pagos.html');
    window.location.href = 'pagos.html';
}

function resetBricksState() {
    bricksInitialized = false;
    console.log('🔄 Estado de Bricks reseteado');
}

function downloadReceipt(paymentId) {
    const url = `/process_payment/download_receipt/${paymentId}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Error al descargar el comprobante');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobante-pago-${paymentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            console.log('Comprobante descargado exitosamente');
        })
        .catch(error => {
            console.error('Error downloading receipt:', error);
            alert('Error al descargar el comprobante: ' + error.message);
        });
}
