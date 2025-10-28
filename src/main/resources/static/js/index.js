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

// ✅ CORREGIDO: Ir a métodos de pago - CON CONTROL DE DUPLICADOS
function goToPayment() {
    console.log('🚀 Intentando ir a pagos...');
    
    // ✅ PREVENIR INICIALIZACIÓN DUPLICADA
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

// ✅ CORREGIDO: Inicializar ambos Bricks - UNA SOLA VEZ
async function initializePaymentBricks() {
    // ✅ PREVENIR EJECUCIÓN DUPLICADA
    if (bricksInitialized) {
        console.log('ℹ️ Bricks ya inicializados, omitiendo...');
        return;
    }
    
    bricksInitialized = true;
    
    const total = calculateCartTotal();
    const userEmail = customerData.email || "cliente@millenium.com";
    
    console.log('💰 Inicializando Bricks - Monto:', total, 'Email:', userEmail);

    // ✅ LIMPIAR CONTENEDORES PRIMERO
    await cleanBrickContainers();

    try {
        // ✅ WALLET BRICK CON PREFERENCIA
        const preferenceId = await createMercadoPagoPreference(total);
        
        if (preferenceId) {
            await initializeWalletBrickWithPreference(preferenceId);
        }
        
    } catch (error) {
        console.log('ℹ️ Wallet Brick no disponible');
    }

    // ✅ PAYMENT BRICK (SIEMPRE)
    await initializePaymentBrick(total, userEmail);
}

// ✅ FUNCIÓN: Limpiar contenedores
async function cleanBrickContainers() {
    try {
        const walletContainer = document.getElementById('walletBrick_container');
        const paymentContainer = document.getElementById('paymentBrick_container');
        
        if (walletContainer) walletContainer.innerHTML = '';
        if (paymentContainer) paymentContainer.innerHTML = '';

        // Limpiar controllers existentes
        if (window.walletBrickController) {
            try { await window.walletBrickController.unmount(); } catch(e) {}
        }
        if (window.paymentBrickController) {
            try { await window.paymentBrickController.unmount(); } catch(e) {}
        }
        
        console.log('✅ Contenedores limpiados exitosamente');
    } catch (error) {
        console.error('❌ Error limpiando contenedores:', error);
    }
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
                    // Mostrar mensaje de error en el contenedor
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

// ✅ CORREGIDO: Inicializar Payment Brick
async function initializePaymentBrick(total, userEmail) {
    try {
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (!paymentContainer) return;

        console.log('💳 Inicializando Payment Brick, monto:', total);

        const settings = {
            initialization: {
                amount: total,
                payer: {
                    email: userEmail,
                }
            },
            callbacks: {
                onReady: () => {
                    console.log('✅ Payment Brick ready');
                },
                onSubmit: (formData) => {
                    console.log('🔄 Payment Brick onSubmit:', formData);
                    handlePaymentSubmission(formData, 'payment');
                },
                onError: (error) => {
                    console.error('❌ Payment Brick error:', error);
                    // Mostrar mensaje de error
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
                    ticket: "all"
                    // ❌ REMOVED: bankTransfer - causa advertencias
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
                    <button onclick="goBackToPayments()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px;">
                        Volver a pagos
                    </button>
                </div>
            `;
        }
    }
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

        // Desmontar status screen anterior si existe
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

    // ✅ BOTÓN "Volver al catálogo" - CON RESET
    const goBackBtn = $('#go-back');
    if (goBackBtn.length) {
        goBackBtn.on('click', function() {
            $('.container__payment').fadeOut(500);
            setTimeout(() => {
                $('.container__cart').show(500).fadeIn();
                resetBricksState(); // ✅ RESET AL VOLVER
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

    console.log('✅ JavaScript cargado correctamente - Sin duplicados');
});
