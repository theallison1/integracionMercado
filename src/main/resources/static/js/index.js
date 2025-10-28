const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey, {
    locale: 'es-AR'
});
const bricksBuilder = mercadopago.bricks();
let paymentId;

// Datos del comprador
let customerData = {
    firstName: '',
    lastName: '', 
    email: '',
    dniType: 'DNI',
    dniNumber: '',
    phone: ''
};

// ✅ FUNCIÓN: Asegurar que el campo amount existe
function ensureAmountField() {
    let amountInput = document.getElementById('amount');
    
    if (!amountInput) {
        amountInput = document.createElement('input');
        amountInput.id = 'amount';
        amountInput.type = 'hidden';
        amountInput.value = '0';
        document.body.appendChild(amountInput);
        console.log('✅ Campo amount creado dinámicamente');
    }
    
    return amountInput;
}

// ✅ FUNCIÓN: Calcular total del carrito de forma confiable
function calculateCartTotal() {
    if (!cart || cart.length === 0) return 0;
    
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });
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

// ✅ FUNCIÓN: Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ✅ FUNCIÓN: Saltar formulario (opcional)
function skipCustomerInfo() {
    customerData = {
        firstName: 'Cliente',
        lastName: 'Millenium',
        email: 'cliente@millenium.com',
        dniType: 'DNI',
        dniNumber: '',
        phone: ''
    };
    
    goToPayment();
}

// ✅ FUNCIÓN: Ir a métodos de pago
function goToPayment() {
    document.querySelector('.container__cart').style.display = 'none';
    document.querySelector('#customer-form-section').style.display = 'none';
    document.querySelector('.container__payment').style.display = 'block';
    
    initializeMercadoPagoBricks();
}

// ✅ CORREGIDO: Crear preferencia para ambos Bricks
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
        throw error;
    }
}

// ✅ CORREGIDO COMPLETAMENTE: Inicializar Mercado Pago con PREFERENCIA
async function initializeMercadoPagoBricks() {
    const mp = new MercadoPago(mercadoPagoPublicKey);
    const total = calculateCartTotal();
    const bricksBuilder = mp.bricks();
    
    console.log('💰 Inicializando Bricks con monto:', total);
    console.log('📧 Email del cliente:', customerData.email);

    try {
        // ✅ CREAR PREFERENCIA PARA AMBOS BRICKS
        const preferenceId = await createMercadoPagoPreference(total);
        
        if (!preferenceId) {
            throw new Error('No se pudo crear la preferencia');
        }

        // ✅ CORREGIDO: Wallet Brick CON PREFERENCIA
        const renderWalletBrick = async (bricksBuilder) => {
            try {
                const settings = {
                    initialization: {
                        preferenceId: preferenceId, // ✅ USAR PREFERENCIA
                    },
                    callbacks: {
                        onReady: () => {
                            console.log('✅ Wallet Brick ready con preferencia:', preferenceId);
                        },
                        onError: (error) => {
                            console.error('❌ Wallet Brick error:', error);
                        }
                    }
                };
                
                // Limpiar contenedor primero
                const walletContainer = document.getElementById('walletBrick_container');
                if (walletContainer) {
                    walletContainer.innerHTML = '';
                }
                
                window.walletBrickController = await bricksBuilder.create('wallet', 'walletBrick_container', settings);
                console.log('✅ Wallet Brick creado exitosamente con preferencia');
            } catch (error) {
                console.error('❌ Error creando Wallet Brick:', error);
            }
        };
        
        // ✅ CORREGIDO: Payment Brick CON PREFERENCIA Y onSubmit
        const renderPaymentBrick = async (bricksBuilder) => {
            try {
                const settings = {
                    initialization: {
                        preferenceId: preferenceId, // ✅ USAR PREFERENCIA
                    },
                    customization: {
                        visual: {
                            style: {
                                theme: 'dark'
                            }
                        }
                    },
                    callbacks: {
                        onReady: () => {
                            console.log('✅ Payment Brick ready con preferencia:', preferenceId);
                        },
                        // ✅ OPCIONAL: onSubmit para manejo personalizado
                        onSubmit: (formData) => {
                            console.log('🔄 Payment Brick onSubmit:', formData);
                            handlePaymentSubmission(formData, 'payment');
                        },
                        onError: (error) => {
                            console.error('❌ Payment Brick error:', error);
                        }
                    }
                };
                
                // Limpiar contenedor primero
                const paymentContainer = document.getElementById('paymentBrick_container');
                if (paymentContainer) {
                    paymentContainer.innerHTML = '';
                }
                
                window.paymentBrickController = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
                console.log('✅ Payment Brick creado exitosamente con preferencia');
            } catch (error) {
                console.error('❌ Error creando Payment Brick:', error);
            }
        };
        
        await renderWalletBrick(bricksBuilder);
        await renderPaymentBrick(bricksBuilder);
        
    } catch (error) {
        console.error('❌ Error inicializando Bricks:', error);
        
        // ✅ FALLBACK: Inicializar sin preferencia (solo Payment Brick funcionará)
        initializeBricksWithoutPreference();
    }
}

// ✅ FALLBACK: Inicializar Bricks sin preferencia (solo Payment Brick)
function initializeBricksWithoutPreference() {
    const mp = new MercadoPago(mercadoPagoPublicKey);
    const total = calculateCartTotal();
    const bricksBuilder = mp.bricks();
    
    console.log('🔄 Inicializando Bricks sin preferencia (fallback)');

    // ❌ Wallet Brick NO funcionará sin preferencia
    const walletContainer = document.getElementById('walletBrick_container');
    if (walletContainer) {
        walletContainer.innerHTML = `
            <div style="background: #2d2d2d; color: #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #444;">
                <h5>👛 Billetera Temporalmente No Disponible</h5>
                <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                <small>La billetera rápida requiere configuración adicional.</small>
            </div>
        `;
    }

    // ✅ Payment Brick SÍ funciona sin preferencia (con onSubmit)
    const renderPaymentBrick = async (bricksBuilder) => {
        try {
            const settings = {
                initialization: {
                    amount: total,
                    payer: {
                        email: customerData.email || "cliente@millenium.com",
                    }
                },
                customization: {
                    visual: {
                        style: {
                            theme: 'dark'
                        }
                    }
                },
                callbacks: {
                    onReady: () => {
                        console.log('✅ Payment Brick ready (sin preferencia)');
                    },
                    // ✅ OBLIGATORIO: onSubmit cuando no hay preferenceId
                    onSubmit: (formData) => {
                        console.log('🔄 Payment Brick onSubmit:', formData);
                        handlePaymentSubmission(formData, 'payment');
                    },
                    onError: (error) => {
                        console.error('❌ Payment Brick error:', error);
                    }
                }
            };
            
            const paymentContainer = document.getElementById('paymentBrick_container');
            if (paymentContainer) {
                paymentContainer.innerHTML = '';
            }
            
            window.paymentBrickController = await bricksBuilder.create('payment', 'paymentBrick_container', settings);
            console.log('✅ Payment Brick creado exitosamente (sin preferencia)');
        } catch (error) {
            console.error('❌ Error creando Payment Brick:', error);
        }
    };
    
    renderPaymentBrick(bricksBuilder);
}

// ✅ CORREGIDO: Función unificada para manejar pagos
async function handlePaymentSubmission(paymentData, brickType) {
    console.log(`🔄 Procesando pago desde ${brickType}:`, paymentData);
    
    // ✅ VALIDACIÓN MEJORADA
    if (!paymentData || !paymentData.token) {
        console.error('❌ Error: paymentData es inválido o falta token');
        alert('Error: Datos de pago incompletos. Por favor, intenta nuevamente.');
        return;
    }

    try {
        const total = calculateCartTotal();
        const userEmail = customerData.email || "cliente@millenium.com";
        
        // ✅ PREPARAR datos para enviar al servidor
        const requestData = {
            token: paymentData.token,
            paymentMethodId: paymentData.payment_method_id || paymentData.paymentMethodId,
            installments: parseInt(paymentData.installments) || 1,
            issuerId: paymentData.issuer_id || null,
            paymentType: paymentData.payment_type || 'credit_card',
            amount: total,
            brickType: brickType,
            description: `Pago de ${cart.length} productos Millenium`,
            payer: {
                email: userEmail,
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                identification: {
                    type: customerData.dniType || 'DNI',
                    number: customerData.dniNumber || ''
                }
            }
        };

        console.log('📤 Enviando datos de pago a /process_payment/process_bricks_payment');
        console.log('Datos enviados:', requestData);

        const response = await fetch('/process_payment/process_bricks_payment', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData)
        });
        
        console.log(`📥 Respuesta del servidor (status: ${response.status})`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error en respuesta:', errorData);
            throw new Error(errorData.error_message || `Error del servidor: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`✅ Pago procesado exitosamente:`, result);
        
        if (result.error_message) {
            throw new Error(result.error_message);
        }
        
        // ✅ MOSTRAR RESULTADO
        await renderStatusScreenBrick(bricksBuilder, result);
        
        $('.container__payment').fadeOut(500);
        setTimeout(() => {
            $('.container__result').show(500).fadeIn();
        }, 500);
        
    } catch (error) {
        console.error(`❌ Error procesando pago:`, error);
        alert(`Error al procesar el pago: ${error.message}`);
    }
}

// ✅ FUNCIÓN: Status Screen Brick
const renderStatusScreenBrick = async (bricksBuilder, result) => {
    paymentId = result.id;
    console.log('🆔 Payment ID:', paymentId);

    try {
        // Limpiar contenedor primero
        const statusContainer = document.getElementById('statusScreenBrick_container');
        if (statusContainer) {
            statusContainer.innerHTML = '';
        }

        window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
            initialization: {
                paymentId: paymentId
            },
            callbacks: {
                onReady: () => {
                    console.log('✅ Status Screen Brick ready');
                },
                onError: (error) => {
                    console.error('❌ Error en Status Screen Brick:', error);
                }
            }
        });
    } catch (error) {
        console.error('❌ Error creando Status Screen:', error);
    }
};

// ✅ FUNCIÓN PARA VOLVER A PAGOS.HTML
function goBackToPayments() {
    console.log('🔄 Volviendo a pagos.html');
    window.location.href = 'pagos.html';
}

// ... (las funciones del carrito se mantienen igual - addToCart, updateCart, updateCartDisplay, etc.)

// ✅ EVENT LISTENERS COMPLETOS Y CORREGIDOS
$(document).ready(function() {
    // ✅ Asegurar que el campo amount existe al cargar la página
    ensureAmountField();
    updateSummaryTotal();
    
    // ✅ MANEJAR FORMULARIO DEL COMPRADOR
    const customerForm = document.getElementById('customer-info-form');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Guardar datos del cliente
            customerData = {
                firstName: document.getElementById('customer-first-name').value.trim(),
                lastName: document.getElementById('customer-last-name').value.trim(),
                email: document.getElementById('customer-email').value.trim(),
                dniType: document.getElementById('customer-dni-type').value,
                dniNumber: document.getElementById('customer-dni-number').value.trim(),
                phone: document.getElementById('customer-phone').value.trim()
            };
            
            // Validar campos obligatorios
            if (!customerData.firstName || !customerData.lastName || !customerData.email) {
                alert('❌ Por favor completa los campos obligatorios (*)');
                return;
            }
            
            // Validar email
            if (!isValidEmail(customerData.email)) {
                alert('❌ Por favor ingresa un email válido');
                return;
            }
            
            // Ir a la sección de pago
            goToPayment();
        });
    }
    
    // ✅ BOTÓN "Ir a Pagar"
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', async function() {
            const cartTotal = calculateCartTotal();
            const hasItemsInCart = cart && cart.length > 0;
            
            if (!hasItemsInCart || cartTotal <= 0) {
                alert('❌ Error: El carrito está vacío o el monto es inválido.');
                return;
            }
            
            showCustomerForm();
        });
    }

    // ... (el resto de los event listeners se mantienen igual)
});

// ✅ FUNCIONES DEL CARRITO (mantener las mismas)
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
