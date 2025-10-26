const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey, {
    locale: 'es-AR'
});
const bricksBuilder = mercadopago.bricks();
let paymentId;

// ✅ FUNCIÓN: Asegurar que el campo amount existe
function ensureAmountField() {
    let amountInput = document.getElementById('amount');
    
    if (!amountInput) {
        // Crear el campo hidden si no existe
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

const renderStatusScreenBrick = async (bricksBuilder, result) => {
    paymentId = result.id;
    console.log('Payment ID:', paymentId);

    window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
        initialization: {
            paymentId: paymentId
        },
        callbacks: {
            onReady: () => {
                console.log('Status Screen Brick ready');
                
                // ✅ APLICAR ESTILO SEVERO AL STATUS SCREEN
                const statusContainer = document.getElementById('statusScreenBrick_container');
                if (statusContainer) {
                    statusContainer.style.backgroundColor = '#1d2431';
                    statusContainer.style.color = 'aquamarine';
                    statusContainer.style.padding = '20px';
                    statusContainer.style.borderRadius = '8px';
                }
            },
            onError: (error) => {
                console.error('Error en Status Screen Brick:', error);
            }
        }
    });
};

// ✅ CORREGIDO: Manejo unificado de pagos con NUEVO ENDPOINT
async function handlePaymentSubmission(paymentData, brickType) {
    console.log(`🔄 Procesando pago desde ${brickType}:`, paymentData);
    
    // ✅ VALIDACIÓN ROBUSTA de los datos
    if (!paymentData) {
        console.error('❌ Error: paymentData es null o undefined');
        alert('Error: Datos de pago inválidos');
        return;
    }
    
    if (brickType === 'wallet' && !paymentData.token) {
        console.error('❌ Error: Falta token en wallet payment');
        alert('Error: No se pudo generar el token de pago');
        return;
    }
    
    if (brickType === 'payment' && !paymentData.token && !paymentData.payment_method_id) {
        console.error('❌ Error: Datos insuficientes en payment brick');
        alert('Error: Información de pago incompleta');
        return;
    }

    try {
        // ✅ OBTENER EL MONTO ACTUALIZADO
        const amountInput = ensureAmountField();
        const amount = parseFloat(amountInput.value);
        
        // ✅ OBTENER EMAIL DEL USUARIO (puedes modificar esto según tu implementación)
        const userEmail = getUserEmail() || "cliente@millenium.com";
        
        // ✅ PREPARAR DATOS PARA EL NUEVO ENDPOINT DE BRICKS
        const requestData = {
            token: paymentData.token,
            paymentMethodId: paymentData.payment_method_id || paymentData.paymentMethodId,
            installments: parseInt(paymentData.installments) || 1,
            amount: amount,
            brickType: brickType,
            payerEmail: userEmail,
            description: `Pago de ${cart.length} productos Millenium`,
            payerFirstName: "Cliente",
            payerLastName: "Millenium"
        };

        console.log('📤 Enviando a /process_bricks_payment:', requestData);

        // ✅ NUEVO ENDPOINT PARA BRICKS
        const response = await fetch('/process_bricks_payment', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData)
        });
        
        console.log(`📥 Respuesta del servidor (status: ${response.status})`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en respuesta:', errorText);
            throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Respuesta del servidor (${brickType}):`, result);
        
        if (result.error_message) {
            throw new Error(result.error_message);
        }
        
        // ✅ PROCESAR RESULTADO EXITOSO
        await renderStatusScreenBrick(bricksBuilder, result);
        
        $('.container__payment').fadeOut(500);
        setTimeout(() => {
            $('.container__result').show(500).fadeIn();
        }, 500);
        
    } catch (error) {
        console.error(`❌ Error en la petición (${brickType}):`, error);
        alert(`Error al procesar el pago: ${error.message}`);
    }
}

// ✅ FUNCIÓN AUXILIAR: Obtener email del usuario
function getUserEmail() {
    // Puedes implementar esto según tu aplicación:
    // 1. De un formulario de usuario
    // 2. De una sesión almacenada
    // 3. De un campo hidden en el HTML
    // 4. Por defecto para testing
    
    const emailInput = document.getElementById('user-email');
    if (emailInput && emailInput.value) {
        return emailInput.value;
    }
    
    // Si no hay email específico, usar uno por defecto
    return "cliente@millenium.com";
}

// ✅ CORREGIDO: Función loadWalletBrick
async function loadWalletBrick(amount) {
    try {
        // Limpiar contenedor del Wallet Brick
        const walletContainer = document.getElementById('walletBrick_container');
        if (walletContainer) {
            walletContainer.innerHTML = '';
        }

        window.walletBrickController = await bricksBuilder.create("wallet", "walletBrick_container", {
            initialization: {
                amount: amount,
                preferenceId: null, // ✅ Importante para pagos directos
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
                },
                texts: {
                    action: 'pay',
                    actionComplement: 'with_my_wallet' 
                }
            },
            callbacks: {
                onReady: () => {
                    console.log("✅ Wallet Brick ready y configurado");
                },
                onError: (error) => {
                    console.error("❌ Wallet Brick error:", error);
                    alert('Error al cargar la billetera: ' + error.message);
                },
                onSubmit: async (formData) => {
                    console.log('✅ Datos Wallet Brick enviados:', formData);
                    
                    // ✅ VALIDAR que formData no sea undefined
                    if (!formData) {
                        console.error('❌ Error: formData es undefined');
                        alert('Error: No se pudieron obtener los datos de pago');
                        return;
                    }
                    
                    await handlePaymentSubmission(formData, 'wallet');
                }
            }
        });
        console.log('✅ Wallet Brick creado exitosamente');
    } catch (error) {
        console.error('❌ Error creando Wallet Brick:', error);
        alert('Error al cargar la billetera de Mercado Pago');
    }
}

// ✅ ACTUALIZADA: Función loadPaymentForm para cargar AMBOS Bricks
async function loadPaymentForm() {
    // ✅ VERIFICACIÓN MEJORADA - Usar cálculo directo del carrito
    const cartTotal = calculateCartTotal();
    const hasItemsInCart = cart && cart.length > 0;
    const hasValidAmount = cartTotal > 0;
    
    console.log('Verificación final de pago:', {
        cartTotal,
        hasItemsInCart,
        hasValidAmount,
        cartLength: cart ? cart.length : 0
    });

    if (!hasItemsInCart || !hasValidAmount) {
        alert('Error: El carrito está vacío o el monto es inválido. Agrega productos antes de pagar.');
        return;
    }

    console.log('Monto a pagar:', cartTotal);

    // ✅ ACTUALIZAR EL CAMPO AMOUNT CON EL VALOR CORRECTO
    const amountInput = ensureAmountField();
    amountInput.value = cartTotal.toFixed(2);
    console.log('💰 Campo amount actualizado:', amountInput.value);

    // ✅ 1. CARGAR WALLET BRICK (Billetera Mercado Pago)
    await loadWalletBrick(cartTotal);
    
    // ✅ 2. CARGAR PAYMENT BRICK (Otros métodos de pago)
    const settings = {
        initialization: {
            amount: cartTotal,
            payer: {
                email: getUserEmail() || "test@test.com", // ✅ Usar email real
                entityType: "individual"
            }
        },
        callbacks: {
            onReady: () => {
                console.log('Payment Brick ready');
            },
            onError: (error) => {
                console.error('Error en Payment Brick:', error);
                alert('Error al cargar el formulario de pago');
            },
            onSubmit: async ({ selectedPaymentMethod, formData }) => {
                console.log('Datos del formulario enviados:', formData);
                await handlePaymentSubmission(formData, 'payment');
            }
        },
        locale: 'es-AR',
        customization: {
            paymentMethods: {
                creditCard: "all",
                debitCard: "all",
                ticket: "all"
            },
            maxInstallments: 1,
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

    // Limpiar el contenedor antes de crear el nuevo Brick
    const container = document.getElementById('paymentBrick_container');
    if (container) {
        container.innerHTML = '';
    }

    try {
        // ✅ ACTUALIZADO: Usando Payment Bricks
        window.paymentBrickController = await bricksBuilder.create(
            "payment",
            "paymentBrick_container",
            settings
        );
        console.log('Payment Brick creado exitosamente');
    } catch (error) {
        console.error('Error creando Payment Brick:', error);
        alert('Error al cargar el formulario de pago');
    }
}

// FUNCIÓN PARA VOLVER A PAGOS.HTML
function goBackToPayments() {
    console.log('Volviendo a pagos.html');
    window.location.href = 'pagos.html';
}

// ✅ FUNCIONES DEL CARRITO MEJORADAS
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
    
    // ✅ Asegurar que el campo amount existe
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
        
        // ✅ ACTUALIZAR EL MONTO CORRECTAMENTE
        amountInput.value = total.toFixed(2);
        console.log('💰 Monto actualizado en display:', amountInput.value);
    }
    
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) {
        cartTotalElement.textContent = `$${total.toLocaleString()}`;
    }
    
    // ✅ Actualizar también el summary visible
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
            
            // ✅ Asegurar que el amount tenga el valor correcto
            amountInput.value = cartTotal.toFixed(2);
            console.log('💰 Amount actualizado para pago:', amountInput.value);
        }
    }
    
    const summaryTotal = document.getElementById('summary-total');
    if (summaryTotal) {
        summaryTotal.textContent = `$${cartTotal.toLocaleString()}`;
    }
    
    updateSummaryTotal(); // Actualizar también el monto visible
}

// Event listeners usando jQuery
$(document).ready(function() {
    // ✅ Asegurar que el campo amount existe al cargar la página
    ensureAmountField();
    updateSummaryTotal();
    
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
    
    // ✅ CORREGIDO: Botón "Ir a Pagar" - VERIFICACIÓN ROBUSTA
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', async function() {
            console.log('=== VERIFICACIÓN MEJORADA CARRITO ===');
            
            // ✅ USAR CÁLCULO DIRECTO Y CONFIABLE
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
                console.error('Carrito inválido:', { cart, cartTotal });
                return;
            }
            
            console.log('✅ Carrito válido - Procediendo con pago...');
            
            // ✅ ACTUALIZAR EL RESUMEN DE PAGO ANTES DE MOSTRAR EL FORMULARIO
            updatePaymentSummary();
            
            $('.container__cart').fadeOut(500);
            setTimeout(async () => {
                await loadPaymentForm();
                $('.container__payment').show(500).fadeIn();
            }, 500);
        });
    } else {
        console.error('Elemento "checkout-btn" no encontrado');
    }

    // Botón "Volver al catálogo"
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

    // Botón "Descargar Comprobante"
    const downloadReceiptBtn = $('#download-receipt');
    if (downloadReceiptBtn.length) {
        downloadReceiptBtn.on('click', function() {
            console.log('Payment ID para descarga:', paymentId);
            
            if (!paymentId) {
                alert('No hay un ID de pago disponible para descargar el comprobante.');
                console.error('Payment ID not found');
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
                    console.log('Comprobante descargado exitosamente');
                })
                .catch(error => {
                    console.error('Error downloading receipt:', error);
                    alert('Error al descargar el comprobante: ' + error.message);
                });
        });
        
        // APLICAR ESTILO SEVERO AL BOTÓN DESCARGAR COMPROBANTE
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
        
        // APLICAR ESTILO SEVERO AL BOTÓN
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
});
