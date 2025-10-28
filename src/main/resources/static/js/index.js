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
        throw error;
    }
}

// ✅ CORREGIDO: Inicializar ambos Bricks - SOLO SIN PREFERENCIA
async function initializePaymentBricks() {
    const total = calculateCartTotal();
    const userEmail = customerData.email || "cliente@millenium.com";
    
    console.log('💰 Inicializando Bricks con monto:', total);
    console.log('📧 Email del cliente:', userEmail);

    try {
        // ✅ INTENTAR crear preferencia para Wallet Brick
        const preferenceId = await createMercadoPagoPreference(total);
        
        if (preferenceId) {
            // ✅ Wallet Brick CON preferencia
            await initializeWalletBrickWithPreference(preferenceId);
            // ✅ Payment Brick SIN preferencia (con amount)
            await initializePaymentBrickWithoutPreference();
        } else {
            throw new Error('No se pudo crear la preferencia');
        }
        
    } catch (error) {
        console.error('❌ Error con preferencia, inicializando ambos sin preferencia:', error);
        
        // ✅ FALLBACK: Inicializar ambos sin preferencia
        await initializeBothBricksWithoutPreference();
    }
}

// ✅ FUNCIÓN: Inicializar Wallet Brick CON preferencia
async function initializeWalletBrickWithPreference(preferenceId) {
    try {
        const walletContainer = document.getElementById('walletBrick_container');
        if (walletContainer) {
            walletContainer.innerHTML = '';
        }

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
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error creando Wallet Brick con preferencia:', error);
        // Mostrar mensaje de fallback
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

// ✅ CORREGIDO: Inicializar Payment Brick SIN preferencia (SIEMPRE)
async function initializePaymentBrickWithoutPreference() {
    try {
        const total = calculateCartTotal();
        const userEmail = customerData.email || "cliente@millenium.com";
        
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (paymentContainer) {
            paymentContainer.innerHTML = '';
        }

        console.log('💳 Inicializando Payment Brick SIN preferencia, monto:', total);

        const settings = {
            initialization: {
                // ✅ OBLIGATORIO: amount siempre
                amount: total,
                payer: {
                    email: userEmail,
                }
            },
            callbacks: {
                onReady: () => {
                    console.log('✅ Payment Brick ready');
                },
                // ✅ OBLIGATORIO: onSubmit siempre
                onSubmit: (formData) => {
                    console.log('🔄 Payment Brick onSubmit:', formData);
                    handlePaymentSubmission(formData, 'payment');
                },
                onError: (error) => {
                    console.error('❌ Payment Brick error:', error);
                }
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
            }
        };

        // ✅ DESMONTAR brick anterior si existe
        if (window.paymentBrickController) {
            await window.paymentBrickController.unmount();
        }

        window.paymentBrickController = await bricksBuilder.create(
            "payment",
            "paymentBrick_container",
            settings
        );
        
        console.log('✅ Payment Brick creado exitosamente');
        
    } catch (error) {
        console.error('❌ Error crítico creando Payment Brick:', error);
        alert('Error al cargar el formulario de pago. Por favor, recarga la página.');
    }
}

// ✅ FUNCIÓN: Inicializar ambos Bricks SIN preferencia
async function initializeBothBricksWithoutPreference() {
    const total = calculateCartTotal();
    const userEmail = customerData.email || "cliente@millenium.com";
    
    console.log('🔄 Inicializando ambos Bricks SIN preferencia');

    // ❌ Wallet Brick NO funciona sin preferencia - mostrar mensaje
    const walletContainer = document.getElementById('walletBrick_container');
    if (walletContainer) {
        walletContainer.innerHTML = `
            <div style="background: #2d2d2d; color: #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #444;">
                <h5>👛 Billetera No Disponible</h5>
                <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                <small>La billetera rápida requiere configuración adicional del servidor.</small>
            </div>
        `;
    }

    // ✅ Payment Brick SIN preferencia
    await initializePaymentBrickWithoutPreference();
}

// ✅ FUNCIÓN: Status Screen Brick
const renderStatusScreenBrick = async (bricksBuilder, result) => {
    paymentId = result.id;
    console.log('Payment ID:', paymentId);

    try {
        const statusContainer = document.getElementById('statusScreenBrick_container');
        if (statusContainer) {
            statusContainer.innerHTML = '';
        }

        // ✅ DESMONTAR brick anterior si existe
        if (window.statusScreenBrickController) {
            await window.statusScreenBrickController.unmount();
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

// ✅ CORREGIDO: Manejo unificado de pagos
async function handlePaymentSubmission(paymentData, brickType) {
    console.log(`🔄 Procesando pago desde ${brickType}:`, paymentData);
    
    if (!paymentData || !paymentData.token) {
        console.error('❌ Error: paymentData es inválido o falta token');
        alert('Error: Datos de pago incompletos. Por favor, intenta nuevamente.');
        return;
    }

    try {
        const total = calculateCartTotal();
        const userEmail = customerData.email || "cliente@millenium.com";

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
                firstName: customerData.firstName || "Cliente",
                lastName: customerData.lastName || "Millenium",
                identification: {
                    type: customerData.dniType || 'DNI',
                    number: customerData.dniNumber || ''
                }
            }
        };

        console.log('📤 Enviando datos de pago:', requestData);

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

// ✅ FUNCIÓN PARA VOLVER A PAGOS.HTML
function goBackToPayments() {
    console.log('Volviendo a pagos.html');
    window.location.href = 'pagos.html';
}

// ✅ FUNCIONES DEL CARRITO (se mantienen igual)
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
}

// ✅ EVENT LISTENERS COMPLETOS
$(document).ready(function() {
    ensureAmountField();
    
    // ✅ MANEJAR FORMULARIO DEL COMPRADOR
    const customerForm = document.getElementById('customer-info-form');
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            customerData = {
                firstName: document.getElementById('customer-first-name').value.trim(),
                lastName: document.getElementById('customer-last-name').value.trim(),
                email: document.getElementById('customer-email').value.trim(),
                dniType: document.getElementById('customer-dni-type').value,
                dniNumber: document.getElementById('customer-dni-number').value.trim(),
                phone: document.getElementById('customer-phone').value.trim()
            };
            
            if (!customerData.firstName || !customerData.lastName || !customerData.email) {
                alert('❌ Por favor completa los campos obligatorios (*)');
                return;
            }
            
            if (!isValidEmail(customerData.email)) {
                alert('❌ Por favor ingresa un email válido');
                return;
            }
            
            goToPayment();
        });
    }
    
    // ✅ BOTÓN "Ir a Pagar"
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', function() {
            const cartTotal = calculateCartTotal();
            const hasItemsInCart = cart && cart.length > 0;
            
            if (!hasItemsInCart || cartTotal <= 0) {
                alert('❌ Error: El carrito está vacío o el monto es inválido.');
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
            }, 500);
        });
    }

    // ✅ BOTÓN "Descargar Comprobante"
    const downloadReceiptBtn = $('#download-receipt');
    if (downloadReceiptBtn.length) {
        downloadReceiptBtn.on('click', function() {
            console.log('📥 Descargando comprobante para paymentId:', paymentId);
            
            if (!paymentId) {
                alert('No hay un ID de pago disponible para descargar el comprobante.');
                return;
            }

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

    console.log('✅ JavaScript cargado correctamente');
});
