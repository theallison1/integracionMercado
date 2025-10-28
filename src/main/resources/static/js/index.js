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

// ✅ CORREGIDO: Inicializar Mercado Pago con datos del cliente
function initializeMercadoPagoBricks() {
    const mp = new MercadoPago(mercadoPagoPublicKey);
    const total = calculateCartTotal();
    const bricksBuilder = mp.bricks();
    
    console.log('💰 Inicializando Bricks con monto:', total);
    console.log('📧 Email del cliente:', customerData.email);

    // ✅ CORREGIDO: Wallet Brick - SIN onSubmit (correcto)
    const renderWalletBrick = async (bricksBuilder) => {
        try {
            const settings = {
                initialization: {
                    amount: total,
                    payer: {
                        email: customerData.email || "cliente@millenium.com",
                    }
                },
                callbacks: {
                    onReady: () => {
                        console.log('✅ Wallet Brick ready');
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
            console.log('✅ Wallet Brick creado exitosamente');
        } catch (error) {
            console.error('❌ Error creando Wallet Brick:', error);
        }
    };
    
    // ✅ CORREGIDO: Payment Brick - CON onSubmit (obligatorio)
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
                        console.log('✅ Payment Brick ready');
                    },
                    // ✅ OBLIGATORIO: Payment Brick SIEMPRE necesita onSubmit
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
            console.log('✅ Payment Brick creado exitosamente');
        } catch (error) {
            console.error('❌ Error creando Payment Brick:', error);
        }
    };
    
    renderWalletBrick(bricksBuilder);
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

        // ✅ RUTA CORREGIDA
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
        
        // ✅ REHABILITAR el brick para reintentar
        if (window.paymentBrickController) {
            window.paymentBrickController.unmount();
            setTimeout(() => initializeMercadoPagoBricks(), 1000);
        }
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

// ✅ CORREGIDO: Función createWalletPreference con ruta correcta
async function createWalletPreference(amount) {
    try {
        console.log('🔄 Creando preferencia para Wallet Brick, monto:', amount);
        
        // ✅ RUTA CORREGIDA
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

// ✅ CORREGIDO: Función loadWalletBrick CON PREFERENCIA (OPCIONAL)
async function loadWalletBrickWithPreference(amount) {
    try {
        const walletContainer = document.getElementById('walletBrick_container');
        if (walletContainer) {
            walletContainer.innerHTML = '';
        }

        console.log('💰 Configurando Wallet Brick con preferencia, monto:', amount);

        // ✅ CREAR PREFERENCIA REAL para Wallet Brick
        const preferenceId = await createWalletPreference(amount);
        
        if (!preferenceId) {
            throw new Error('No se pudo crear la preferencia para Wallet Brick');
        }

        window.walletBrickController = await bricksBuilder.create("wallet", "walletBrick_container", {
            initialization: {
                preferenceId: preferenceId,
            },
            customization: {
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
            },
            callbacks: {
                onReady: () => {
                    console.log("✅ Wallet Brick ready con preferencia:", preferenceId);
                },
                onError: (error) => {
                    console.error("❌ Wallet Brick error:", error);
                }
            }
        });
        console.log('✅ Wallet Brick con preferencia creado exitosamente');
    } catch (error) {
        console.error('❌ Error creando Wallet Brick con preferencia:', error);
    }
}

// ✅ ACTUALIZADA: Función loadPaymentForm
async function loadPaymentForm() {
    const cartTotal = calculateCartTotal();
    const hasItemsInCart = cart && cart.length > 0;
    const hasValidAmount = cartTotal > 0;
    
    console.log('✅ Verificación final de pago:', {
        cartTotal,
        hasItemsInCart,
        hasValidAmount,
        cartLength: cart ? cart.length : 0
    });

    if (!hasItemsInCart || !hasValidAmount) {
        alert('❌ Error: El carrito está vacío o el monto es inválido.');
        return;
    }

    console.log('💰 Monto a pagar:', cartTotal);

    const amountInput = ensureAmountField();
    amountInput.value = cartTotal.toFixed(2);

    // ✅ INICIALIZAR BRICKS
    initializeMercadoPagoBricks();
}

// ✅ FUNCIÓN PARA VOLVER A PAGOS.HTML
function goBackToPayments() {
    console.log('🔄 Volviendo a pagos.html');
    window.location.href = 'pagos.html';
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
        console.log('💰 Monto actualizado en display:', amountInput.value);
    }
    
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) {
        cartTotalElement.textContent = `$${total.toLocaleString()}`;
    }
    
    updateSummaryTotal();
}

// ✅ FUNCIÓN PARA ACTUALIZAR EL RESUMEN DE PAGO
function updatePaymentSummary() {
    const summaryContainer = document.getElementById('summary-items');
    const amountInput = ensureAmountField();
    const cartTotal = calculateCartTotal();
    
    if (summaryContainer) {
        summaryContainer.innerHTML = '';
        
        if (!cart || cart.length === 0) {
            summaryContainer.innerHTML = '<p class="text-muted text-center">No hay productos en el carrito</p>';
            amountInput.value = '0';
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                
                summaryContainer.innerHTML += `
                    <div class="item mb-3 p-2 border-bottom">
                        <span class="price">$${itemTotal.toLocaleString()}</span>
                        <p class="item-name mb-1">${item.name}</p>
                        <small class="text-muted">Cantidad: ${item.quantity}</small>
                    </div>
                `;
            });
            
            amountInput.value = cartTotal.toFixed(2);
            console.log('💰 Amount actualizado para pago:', amountInput.value);
        }
    }
    
    const summaryTotal = document.getElementById('summary-total');
    if (summaryTotal) {
        summaryTotal.textContent = `$${cartTotal.toLocaleString()}`;
    }
    
    updateSummaryTotal();
}

// ✅ CORREGIDO: Función para descargar comprobante
function downloadReceipt(paymentId) {
    console.log('📥 Descargando comprobante para paymentId:', paymentId);
    
    if (!paymentId) {
        alert('No hay un ID de pago disponible para descargar el comprobante.');
        return;
    }

    // ✅ RUTA CORREGIDA
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
            console.log('✅ Comprobante descargado exitosamente');
        })
        .catch(error => {
            console.error('Error downloading receipt:', error);
            alert('Error al descargar el comprobante: ' + error.message);
        });
}

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
    
    // ✅ APLICAR ESTILO SEVERO AL CONTENEDOR DE RESULTADOS
    const resultContainer = $('.container__result');
    if (resultContainer.length) {
        resultContainer.css({
            'background-color': '#1d2431',
            'color': 'aquamarine',
            'padding': '30px',
            'border-radius': '12px',
            'border': '2px solid aquamarine'
        });
    }
    
    // ✅ BOTÓN "Ir a Pagar" - VERIFICACIÓN ROBUSTA
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', async function() {
            console.log('=== VERIFICACIÓN MEJORADA CARRITO ===');
            
            const cartTotal = calculateCartTotal();
            const hasItemsInCart = cart && cart.length > 0;
            const hasValidAmount = cartTotal > 0;
            
            console.log('Verificación mejorada:', { 
                hasItemsInCart, 
                hasValidAmount, 
                cartTotal,
                cartLength: cart ? cart.length : 0
            });
            
            if (!hasItemsInCart || !hasValidAmount) {
                alert('❌ Error: El carrito está vacío o el monto es inválido.');
                return;
            }
            
            console.log('✅ Carrito válido - Mostrando formulario del comprador...');
            
            // ✅ MOSTRAR FORMULARIO DEL COMPRADOR (nuevo paso)
            showCustomerForm();
        });
    } else {
        console.error('Elemento "checkout-btn" no encontrado');
    }

    // ✅ BOTÓN "Volver al catálogo"
    const goBackBtn = $('#go-back');
    if (goBackBtn.length) {
        goBackBtn.on('click', function() {
            $('.container__payment').fadeOut(500);
            setTimeout(() => {
                $('.container__cart').show(500).fadeIn();
            }, 500);
        });
    } else {
        console.error('Elemento "go-back" no encontrado');
    }

    // ✅ BOTÓN "Descargar Comprobante" - CORREGIDO
    const downloadReceiptBtn = $('#download-receipt');
    if (downloadReceiptBtn.length) {
        downloadReceiptBtn.on('click', function() {
            console.log('📥 Descargando comprobante para paymentId:', paymentId);
            
            if (!paymentId) {
                alert('No hay un ID de pago disponible para descargar el comprobante.');
                console.error('Payment ID not found');
                return;
            }

            downloadReceipt(paymentId);
        });
        
        // ✅ APLICAR ESTILO SEVERO AL BOTÓN DESCARGAR COMPROBANTE
        downloadReceiptBtn.css({
            'background-color': 'aquamarine',
            'color': '#1d2431',
            'border': '2px solid aquamarine',
            'padding': '12px 24px',
            'border-radius': '8px',
            'font-weight': 'bold',
            'cursor': 'pointer',
            'transition': 'all 0.3s ease',
            'margin': '10px'
        }).hover(
            function() {
                $(this).css({
                    'background-color': '#1d2431',
                    'color': 'aquamarine',
                    'transform': 'translateY(-2px)',
                    'box-shadow': '0 4px 8px rgba(0,0,0,0.3)'
                });
            },
            function() {
                $(this).css({
                    'background-color': 'aquamarine',
                    'color': '#1d2431',
                    'transform': 'translateY(0)',
                    'box-shadow': 'none'
                });
            }
        );
    } else {
        console.error('Elemento "download-receipt" no encontrado');
    }

    // ✅ BOTÓN "Volver a Pagos"
    const backToPaymentsBtn = $('#back-to-payments');
    if (backToPaymentsBtn.length) {
        backToPaymentsBtn.on('click', function() {
            goBackToPayments();
        });
        
        // ✅ APLICAR ESTILO SEVERO AL BOTÓN
        backToPaymentsBtn.css({
            'background-color': 'aquamarine',
            'color': '#1d2431',
            'border': '2px solid aquamarine',
            'padding': '12px 24px',
            'border-radius': '8px',
            'font-weight': 'bold',
            'cursor': 'pointer',
            'transition': 'all 0.3s ease',
            'margin': '10px'
        }).hover(
            function() {
                $(this).css({
                    'background-color': '#1d2431',
                    'color': 'aquamarine',
                    'transform': 'translateY(-2px)',
                    'box-shadow': '0 4px 8px rgba(0,0,0,0.3)'
                });
            },
            function() {
                $(this).css({
                    'background-color': 'aquamarine',
                    'color': '#1d2431',
                    'transform': 'translateY(0)',
                    'box-shadow': 'none'
                });
            }
        );
    } else {
        console.error('Elemento "back-to-payments" no encontrado');
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

    console.log('✅ JavaScript cargado correctamente - Bricks configurados');
});
