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

//  FUNCIÓN MEJORADA: Validar formulario del comprador
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

//  FUNCIÓN: Resaltar campo con error
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

//  FUNCIÓN: Mostrar errores de validación
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

// FUNCIÓN MEJORADA: Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

//  FUNCIÓN: Asegurar que el campo amount existe
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

//  FUNCIÓN: Calcular total del carrito de forma confiable
function calculateCartTotal() {
    if (!cart || cart.length === 0) return 0;
    
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });
    return total;
}

//  FUNCIÓN PARA ACTUALIZAR EL MONTO VISIBLE
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

//  FUNCIÓN: Mostrar formulario del comprador
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

//  FUNCIÓN: Actualizar resumen del carrito en el formulario
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

// FUNCIÓN MEJORADA: Saltar formulario (opcional)
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

// CORREGIDO: Ir a métodos de pago
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

//  CORREGIDO: Crear preferencia para Mercado Pago
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

//  CORREGIDO COMPLETAMENTE: Inicializar ambos Bricks
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
        //  WALLET BRICK CON PREFERENCIA
        const preferenceId = await createMercadoPagoPreference(total);
        
        if (preferenceId) {
            await initializeWalletBrickWithPreference(preferenceId);
        }
        
    } catch (error) {
        console.log('ℹ️ Wallet Brick no disponible');
    }

    //  PAYMENT BRICK (SIEMPRE)
    await initializePaymentBrick(total, userEmail);
}

//  FUNCIÓN: Inicializar Wallet Brick
async function initializeWalletBrickWithPreference(preferenceId) {
    try {
        const walletContainer = document.getElementById('walletBrick_container');
        if (!walletContainer) return;

        console.log(' Inicializando Wallet Brick con preferencia:', preferenceId);

        window.walletBrickController = await bricksBuilder.create("wallet", "walletBrick_container", {
            initialization: {
                preferenceId: preferenceId,
            },
            callbacks: {
                onReady: () => {
                    console.log("Wallet Brick ready con preferencia");
                },
                onError: (error) => {
                    console.error("Wallet Brick error:", error);
                    walletContainer.innerHTML = `
                        <div style="background: #2d2d2d; color: #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #444;">
                            <h5> Billetera No Disponible</h5>
                            <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                        </div>
                    `;
                }
            }
        });
        
    } catch (error) {
        console.error(' Error creando Wallet Brick con preferencia:', error);
        const walletContainer = document.getElementById('walletBrick_container');
        if (walletContainer) {
            walletContainer.innerHTML = `
                <div style="background: #2d2d2d; color: #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #444;">
                    <h5> Billetera No Disponible</h5>
                    <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                </div>
            `;
        }
    }
}

//  CORREGIDO COMPLETAMENTE: Inicializar Payment Brick
async function initializePaymentBrick(total, userEmail) {
    try {
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (!paymentContainer) return;

        console.log(' Inicializando Payment Brick, monto:', total);

        const settings = {
            initialization: {
                amount: total,
                payer: {
                    email: userEmail,
                }
            },
            callbacks: {
                onReady: () => {
                    console.log('Payment Brick ready');
                },
                onSubmit: (formData) => {
                    console.log('Payment Brick onSubmit - Datos recibidos:', formData);
                    // ✅ VERIFICACIÓN INMEDIATA DE LOS DATOS
                    if (!formData || typeof formData !== 'object') {
                        console.error(' formData es inválido:', formData);
                        alert('Error: Datos de pago inválidos');
                        return;
                    }
                    
                    if (!formData.token && !formData.paymentMethodId) {
                        console.error(' Faltan datos críticos en formData:', formData);
                        alert('Error: Faltan datos de pago esenciales');
                        return;
                    }
                    
                    handlePaymentSubmission(formData, 'payment');
                },
                onError: (error) => {
                    console.error(' Payment Brick error:', error);
                    paymentContainer.innerHTML = `
                        <div style="background: #2d2d2d; color: #dc3545; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #dc3545;">
                            <h5> Error en formulario de pago</h5>
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
                    ticket: "all"
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
        
        console.log(' Payment Brick creado exitosamente');
        
    } catch (error) {
        console.error(' Error crítico creando Payment Brick:', error);
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (paymentContainer) {
            paymentContainer.innerHTML = `
                <div style="background: #2d2d2d; color: #dc3545; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #dc3545;">
                    <h5> Error crítico</h5>
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

// CORREGIDO COMPLETAMENTE: Status Screen Brick
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
                console.log(' No se pudo desmontar Status Screen anterior');
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
        console.error('Error creando Status Screen:', error);
    }
};

//  CORREGIDO COMPLETAMENTE: Manejo unificado de pagos - SIN ERROR DE TOKEN
async function handlePaymentSubmission(paymentData, brickType) {
    console.log(` Procesando pago desde ${brickType}:`, paymentData);
    
    //  VALIDACIÓN MEJORADA - MÁS FLEXIBLE
    if (!paymentData || typeof paymentData !== 'object') {
        console.error(' Error: paymentData es inválido:', paymentData);
        alert('Error: Datos de pago inválidos. Por favor, intenta nuevamente.');
        return;
    }

    //  VERIFICAR DATOS CRÍTICOS (diferentes bricks envían diferentes estructuras)
    const hasRequiredData = paymentData.token || paymentData.paymentMethodId;
    if (!hasRequiredData) {
        console.error(' Error: Faltan datos críticos en paymentData:', paymentData);
        alert('Error: Datos de pago incompletos. Faltan token o paymentMethodId.');
        return;
    }

    try {
        const total = calculateCartTotal();
        const userEmail = customerData.email || "cliente@millenium.com";

        //  ESTRUCTURA COMPATIBLE CON AMBOS BRICKS
        const requestData = {
            token: paymentData.token || paymentData.paymentMethodId,
            paymentMethodId: paymentData.payment_method_id || paymentData.paymentMethodId,
            installments: parseInt(paymentData.installments) || 1,
            issuerId: paymentData.issuer_id || null,
            paymentType: paymentData.payment_type || 'credit_card',
            amount: total,
            brickType: brickType,
            description: `Pago de ${cart.length} productos Millenium`,
            payer: {
                email: userEmail,
                firstName: customerData.firstName || "Cliente",
                lastName: customerData.lastName || "Millenium",
                identification: {
                    type: customerData.dniType || 'DNI',
                    number: customerData.dniNumber || ''
                }
            }
        };

        console.log(' Enviando datos de pago al servidor:', requestData);

        const response = await fetch('/process_payment/process_bricks_payment', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData)
        });

        console.log(` Respuesta del servidor (status: ${response.status})`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en respuesta:', errorData);
            throw new Error(errorData.error_message || `Error del servidor: ${response.status}`);
        }

        const result = await response.json();
        console.log(` Pago procesado exitosamente:`, result);

        if (result.error_message) {
            throw new Error(result.error_message);
        }

        await renderStatusScreenBrick(bricksBuilder, result);

        $('.container__payment').fadeOut(500);
        setTimeout(() => {
            $('.container__result').show(500).fadeIn();
        }, 500);

    } catch (error) {
        console.error(` Error procesando pago:`, error);
        alert(`Error al procesar el pago: ${error.message}`);
    }
}

// FUNCIÓN PARA VOLVER A PAGOS.HTML
function goBackToPayments() {
    console.log('Volviendo a pagos.html');
    window.location.href = 'pagos.html';
}

//  RESET para cuando se vuelve al carrito
function resetBricksState() {
    bricksInitialized = false;
    console.log(' Estado de Bricks reseteado');
}

//  FUNCIONES DEL CARRITO
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
            checkoutBtn.innerHTML = ' Ir a Pagar';
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
            checkoutBtn.innerHTML = ` Pagar $${total.toLocaleString()}`;
        }
        
        amountInput.value = total.toFixed(2);
    }
    
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) {
        cartTotalElement.textContent = `$${total.toLocaleString()}`;
    }
    
    updateSummaryTotal();
}

//  EVENT LISTENERS MEJORADOS
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

    //  BOTÓN "Volver al catálogo"
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

    //  BOTÓN "Descargar Comprobante"
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

    //  BOTÓN "Volver a Pagos"
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
            skipCustomerInfo();
        });
    }

    //  INICIALIZAR CARRITO AL CARGAR
    if (typeof updateCartDisplay === 'function') {
        updateCartDisplay();
    }

    console.log(' JavaScript cargado correctamente - Versión corregida');
});

//  FUNCIÓN ADICIONAL: Mostrar mensajes temporales
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

//  FUNCIÓN: Descargar comprobante
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
