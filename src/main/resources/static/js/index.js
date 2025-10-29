const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey, {
    locale: 'es-AR'
});
const bricksBuilder = mercadopago.bricks();
let paymentId;

// Control para evitar inicializaciones duplicadas
let bricksInitialized = false;

// Datos del comprador
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
}

// ✅ FUNCIÓN: Resaltar campo con error
function highlightField(fieldId, hasError) {
    const field = document.getElementById(fieldId);
    if (field) {
        if (hasError) {
            field.style.borderColor = '#dc3545';
            field.style.backgroundColor = '#fff5f5';
        } else {
            field.style.borderColor = '#28a745';
            field.style.backgroundColor = '';
        }
    }
}

// ✅ FUNCIÓN: Mostrar errores de validación
function showValidationErrors(errors) {
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
}

// ✅ FUNCIÓN MEJORADA: Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ✅ FUNCIÓN: Asegurar que el campo amount existe
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

// ✅ FUNCIÓN MEJORADA: Calcular total del carrito de forma confiable
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

// ✅ FUNCIÓN PARA ACTUALIZAR EL MONTO VISIBLE
function updateSummaryTotal() {
    const amountInput = ensureAmountField();
    const summaryTotal = document.getElementById('summary-total');
    
    if (summaryTotal) {
        const amount = parseFloat(amountInput.value);
        if (!isNaN(amount) && amount > 0) {
            summaryTotal.textContent = '$' + amount.toLocaleString('es-AR');
        } else {
            summaryTotal.textContent = '$0';
        }
    }
}

// ✅ FUNCIÓN: Mostrar formulario del comprador
function showCustomerForm() {
    const existingErrors = document.getElementById('validation-errors');
    if (existingErrors) {
        existingErrors.remove();
    }
    
    document.querySelector('.container__cart').style.display = 'none';
    document.querySelector('#customer-form-section').style.display = 'block';
    document.querySelector('.container__payment').style.display = 'none';
    
    updateCustomerCartSummary();
}

// ✅ FUNCIÓN: Actualizar resumen del carrito en el formulario
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

// ✅ FUNCIÓN MEJORADA: Saltar formulario (opcional)
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

// ✅ CORREGIDO: Ir a métodos de pago
function goToPayment() {
    console.log('🚀 Intentando ir a pagos...');
    
    if (bricksInitialized) {
        console.log('ℹ️ Bricks ya inicializados, solo mostrando sección');
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

// ✅ CORREGIDO: Crear preferencia para Mercado Pago
async function createMercadoPagoPreference(amount) {
    try {
        console.log('🔄 Creando preferencia en Mercado Pago, monto:', amount);
        
        const response = await fetch('/process_payment/create_wallet_preference', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
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
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        console.log('✅ Preferencia creada:', result.id);
        return result.id;
        
    } catch (error) {
        console.error('❌ Error creando preferencia:', error);
        return null;
    }
}

// ✅ CORREGIDO COMPLETAMENTE: Inicializar ambos Bricks
async function initializePaymentBricks() {
    if (bricksInitialized) {
        console.log('ℹ️ Bricks ya inicializados, omitiendo...');
        return;
    }
    
    bricksInitialized = true;
    
    const total = calculateCartTotal();
    const userEmail = customerData.email || "cliente@millenium.com";
    
    console.log('💰 Inicializando Bricks - Monto:', total, 'Email:', userEmail);

    try {
        // ✅ WALLET BRICK CON PREFERENCIA
        const preferenceId = await createMercadoPagoPreference(total);
        
        if (preferenceId) {
            await initializeWalletBrickWithPreference(preferenceId);
        }
        
    } catch (error) {
        console.log('ℹ️ Wallet Brick no disponible');
    }

    // ✅ PAYMENT BRICK (SIEMPRE) - CON PAGO FÁCIL Y RAPIPAGO
    await initializePaymentBrick(total, userEmail);
}

// ✅ FUNCIÓN: Inicializar Wallet Brick
async function initializeWalletBrickWithPreference(preferenceId) {
    try {
        const walletContainer = document.getElementById('walletBrick_container');
        if (!walletContainer) return;

        console.log('👛 Inicializando Wallet Brick con preferencia:', preferenceId);

        window.walletBrickController = await bricksBuilder.create("wallet", "walletBrick_container", {
            initialization: {
                preferenceId: preferenceId,
            },
            callbacks: {
                onReady: () => {
                    console.log("✅ Wallet Brick ready con preferencia");
                },
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

// ✅ ACTUALIZADA: Inicializar Payment Brick con Pago Fácil y Rapipago
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
                    console.log('🔄 Payment Brick onSubmit - Datos recibidos:', cardForm);
                    
                    const { selectedPaymentMethod, formData } = cardForm;
                    
                    // ✅ DETECTAR SI ES PAGO EN EFECTIVO (PAGO FÁCIL O RAPIPAGO)
                    if (selectedPaymentMethod === 'ticket') {
                        console.log('🎫 Procesando pago en efectivo:', formData);
                        processCashPayment(formData);
                    } else {
                        // ✅ PROCESAR PAGO CON TARJETA (CÓDIGO EXISTENTE)
                        console.log('💳 Procesando pago con tarjeta:', formData);
                        
                        if (!formData || typeof formData !== 'object') {
                            console.error('❌ formData es inválido:', formData);
                            alert('Error: Datos de pago inválidos. Por favor, intenta nuevamente.');
                            return;
                        }
                        
                        const token = formData.token;
                        const paymentMethodId = formData.payment_method_id;
                        const issuerId = formData.issuer_id;
                        const installments = formData.installments;

                        console.log('🔍 DEBUG - Estructura de formData:', {
                            token: token,
                            paymentMethodId: paymentMethodId,
                            issuerId: issuerId,
                            installments: installments
                        });
                        
                        if (!token) {
                            console.error('❌ Token no disponible');
                            alert('Error: No se pudo generar el token de seguridad. Verifica que todos los datos de la tarjeta estén completos y correctos.');
                            return;
                        }
                        
                        console.log('✅ Token encontrado correctamente:', token);
                        handlePaymentSubmission(formData, 'payment');
                    }
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
                    ticket: "all", // ✅ HABILITAR PAGOS EN EFECTIVO
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
        
        console.log('✅ Payment Brick creado exitosamente con soporte para Pago Fácil y Rapipago');
        
    } catch (error) {
        console.error('❌ Error crítico creando Payment Brick:', error);
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (paymentContainer) {
            paymentContainer.innerHTML = `
                <div style="background: #2d2d2d; color: #dc3545; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #dc3545;">
                    <h5>❌ Error crítico</h5>
                    <p>No se pudo cargar el formulario de pago.</p>
                    <p>Error: ${error.message}</p>
                    <button onclick="location.reload()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px;">
                        Recargar página
                    </button>
                </div>
            `;
        }
    }
}
// ✅ AGREGAR ESTO A TU processCashPayment FUNCTION
async function processCashPayment(formData) {
    console.log('🎫 Iniciando procesamiento de pago en efectivo:', formData);
    
    try {
        // ✅ DEBUG DETALLADO - ESTO ES CLAVE
        console.log('🔍 DEBUG ANTES DE ENVIAR:');
        console.log('1. Carrito:', cart);
        console.log('2. Customer Data:', customerData);
        console.log('3. Form Data recibido:', formData);
        
        const total = calculateCartTotal();
        const userEmail = customerData.email || "cliente@millenium.com";
        const userFirstName = customerData.firstName || "Cliente";
        const userLastName = customerData.lastName || "Millenium";
        
        console.log('4. Total calculado:', total);
        console.log('5. Email a usar:', userEmail);
        console.log('6. Nombre a usar:', userFirstName, userLastName);
        
        if (total <= 0) {
            console.error('❌ ERROR: Total es menor o igual a cero:', total);
            throw new Error('El monto debe ser mayor a cero');
        }

        // ✅ PREPARAR DATOS CON VALORES POR DEFECTO
        const paymentData = {
            amount: total,
            paymentMethodId: formData.payment_method_id,
            description: `Compra de ${cart.length} productos Millenium`,
            payerEmail: userEmail,
            payerFirstName: userFirstName,
            payerLastName: userLastName,
            identificationType: customerData.dniType || "DNI",
            identificationNumber: customerData.dniNumber || "00000000"
        };

        console.log('📤 DATOS QUE SE ENVIARÁN AL SERVIDOR:', paymentData);

        // ✅ VERIFICACIÓN FINAL ANTES DE ENVIAR
        if (!paymentData.amount || paymentData.amount <= 0) {
            console.error('❌ MONTO INVÁLIDO:', paymentData.amount);
            throw new Error('Monto inválido: ' + paymentData.amount);
        }

        if (!paymentData.payerEmail) {
            console.error('❌ EMAIL INVÁLIDO:', paymentData.payerEmail);
            throw new Error('Email del cliente es requerido');
        }

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
            throw new Error('Error del servidor al procesar pago en efectivo');
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }

        console.log('✅ Pago en efectivo creado exitosamente:', result);
        showCashPaymentResult(result);

    } catch (error) {
        console.error('❌ Error procesando pago en efectivo:', error);
        showTemporaryMessage(`Error en pago en efectivo: ${error.message}`, 'error');
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar resultado de pago en efectivo
function showCashPaymentResult(paymentResult) {
    const paymentMethod = paymentResult.paymentMethodId || 'pagofacil';
    const paymentMethodName = paymentMethod === 'rapipago' ? 'Rapipago' : 'Pago Fácil';
    
    // ✅ Ocultar el contenedor de pago y mostrar resultados
    document.querySelector('.container__payment').style.display = 'none';
    document.querySelector('.container__result').style.display = 'block';
    
    // ✅ Actualizar el contenido del resultado para pagos en efectivo
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
    
    // ✅ Agregar event listeners para los nuevos botones
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

// ✅ NUEVA FUNCIÓN: Descargar voucher de pago en efectivo
function downloadCashVoucher(paymentId) {
    const url = `/process_payment/download_voucher/${paymentId}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al descargar el voucher');
            }
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

// ✅ FUNCIÓN DE DEBUGGING
function debugCashPayment() {
    console.log('🔍 DEBUG - Datos antes de enviar pago efectivo:');
    console.log('- calculateCartTotal():', calculateCartTotal());
    console.log('- cart:', cart);
    console.log('- customerData:', customerData);
    
    const total = calculateCartTotal();
    console.log('- Total calculado:', total);
    console.log('- Tipo de total:', typeof total);
    console.log('- Es mayor a cero?:', total > 0);
}

// ✅ VERIFICAR CARRITO ANTES DE PAGAR
function verifyCartBeforePayment() {
    const total = calculateCartTotal();
    const hasItems = cart && cart.length > 0;
    
    console.log('🔍 Verificación pre-pago:');
    console.log('- Carrito tiene items?:', hasItems);
    console.log('- Total calculado:', total);
    console.log('- Carrito completo:', cart);
    
    if (!hasItems || total <= 0) {
        showTemporaryMessage('❌ Error: El carrito está vacío', 'error');
        return false;
    }
    
    return true;
}

// ... (el resto de tus funciones existentes se mantienen igual)

// ✅ CORREGIDO COMPLETAMENTE: Status Screen Brick
const renderStatusScreenBrick = async (bricksBuilder, result) => {
    paymentId = result.id;
    console.log('Payment ID:', paymentId);

    try {
        const statusContainer = document.getElementById('statusScreenBrick_container');
        if (statusContainer) {
            statusContainer.innerHTML = '';
        }

        if (window.statusScreenBrickController) {
            try {
                await window.statusScreenBrickController.unmount();
            } catch (e) {
                console.log('ℹ️ No se pudo desmontar Status Screen anterior');
            }
        }

        window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
            initialization: {
                paymentId: paymentId
            },
            callbacks: {
                onReady: () => {
                    console.log('Status Screen Brick ready');
                },
                onError: (error) => {
                    console.error('Error en Status Screen Brick:', error);
                }
            }
        });
    } catch (error) {
        console.error('❌ Error creando Status Screen:', error);
    }
};

// ✅ ACTUALIZADA: handlePaymentSubmission para manejar ambos tipos de pago
async function handlePaymentSubmission(paymentData, brickType) {
    console.log(`🔄 Procesando pago desde ${brickType}:`, paymentData);
    
    // Si es pago en efectivo, ya se manejó en processCashPayment
    if (paymentData.payment_type === 'ticket') {
        console.log('🎫 Pago en efectivo ya procesado');
        return;
    }
    
    // Validación detallada para debugging
    console.log('🔍 DEBUG - Estructura de paymentData:', {
        tienePaymentData: !!paymentData,
        tipo: typeof paymentData,
        keys: paymentData ? Object.keys(paymentData) : 'no paymentData',
        token: paymentData?.token,
        tokenTipo: typeof paymentData?.token
    });
    
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

        console.log('📤 Enviando datos al servidor:', requestData);

        const response = await fetch('/process_payment/process_bricks_payment', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error_message || 'Error del servidor');

        // ✅ ÉXITO
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

// ✅ FUNCIÓN PARA VOLVER A PAGOS.HTML
function goBackToPayments() {
    console.log('Volviendo a pagos.html');
    window.location.href = 'pagos.html';
}

// ✅ RESET para cuando se vuelve al carrito
function resetBricksState() {
    bricksInitialized = false;
    console.log('🔄 Estado de Bricks reseteado');
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
            
            const cartItemElement = `
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
            cartItemsContainer.innerHTML += cartItemElement;
        });
        
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = `💳 Pagar $${total.toLocaleString()}`;
        }
        
        amountInput.value = total.toFixed(2);
    }
    
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) {
        cartTotalElement.textContent = `$${total.toLocaleString()}`;
    }
    
    updateSummaryTotal();
}

// ✅ EVENT LISTENERS MEJORADOS
$(document).ready(function() {
    ensureAmountField();
    updateSummaryTotal();
    
    // ✅ MANEJAR FORMULARIO DEL COMPRADOR
    const customerForm = document.getElementById('customer-info-form');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateCustomerForm()) {
                return;
            }
            
            // Guardar datos del cliente
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
    
    // ✅ BOTÓN "Ir a Pagar" CON VERIFICACIÓN
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', function() {
            if (!verifyCartBeforePayment()) {
                return;
            }
            showCustomerForm();
        });
    }

    // ✅ BOTÓN "Volver al catálogo"
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

    // ✅ BOTÓN "Descargar Comprobante"
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

    // ✅ BOTÓN "Volver a Pagos"
    const backToPaymentsBtn = $('#back-to-payments');
    if (backToPaymentsBtn.length) {
        backToPaymentsBtn.on('click', function() {
            goBackToPayments();
        });
    }

    // ✅ BOTÓN "Saltar formulario"
    const skipFormBtn = $('#skip-customer-form');
    if (skipFormBtn.length) {
        skipFormBtn.on('click', function() {
            skipCustomerInfo();
        });
    }

    // ✅ INICIALIZAR CARRITO AL CARGAR
    if (typeof updateCartDisplay === 'function') {
        updateCartDisplay();
    }

    console.log('✅ JavaScript cargado correctamente - CON PAGO FÁCIL Y RAPIPAGO CORREGIDO');
});

// ✅ FUNCIÓN ADICIONAL: Mostrar mensajes temporales
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
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background: ${style.background};
        color: ${style.color};
        border: ${style.border};
        max-width: 300px;
    `;
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 500);
    }, 4000);
}

// ✅ FUNCIÓN: Descargar comprobante
function downloadReceipt(paymentId) {
    const url = `/process_payment/download_receipt/${paymentId}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al descargar el comprobante');
            }
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
