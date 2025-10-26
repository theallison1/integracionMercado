const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey, {
    locale: 'es-AR'
});
const bricksBuilder = mercadopago.bricks();
let paymentId;

// FUNCIÓN PARA ACTUALIZAR EL MONTO VISIBLE
function updateSummaryTotal() {
    const amountInput = document.getElementById('amount');
    const summaryTotal = document.getElementById('summary-total');
    
    if (amountInput && summaryTotal) {
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

// ✅ NUEVA FUNCIÓN: Cargar Wallet Brick
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
            },
            callbacks: {
                onReady: () => {
                    console.log("Wallet Brick ready");
                },
                onError: (error) => {
                    console.error("Wallet Brick error:", error);
                },
                onSubmit: async (cardFormData) => {
                    console.log('Datos Wallet Brick enviados:', cardFormData);
                    
                    try {
                        const response = await fetch('/process_payment', {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(cardFormData)
                        });
                        
                        if (!response.ok) {
                            throw new Error('Error en la respuesta del servidor');
                        }
                        
                        const result = await response.json();
                        console.log('Respuesta del servidor Wallet:', result);
                        
                        if (!result.hasOwnProperty("error_message")) {
                            await renderStatusScreenBrick(bricksBuilder, result);
                            
                            $('.container__payment').fadeOut(500);
                            setTimeout(() => {
                                $('.container__result').show(500).fadeIn();
                            }, 500);
                        } else {
                            alert('Error en el pago: ' + result.error_message);
                        }
                    } catch (error) {
                        console.error('Error en la petición Wallet:', error);
                        alert('Error al procesar el pago: ' + error.message);
                    }
                }
            }
        });
        console.log('Wallet Brick creado exitosamente');
    } catch (error) {
        console.error('Error creando Wallet Brick:', error);
    }
}

// ✅ ACTUALIZADA: Función loadPaymentForm para cargar AMBOS Bricks
async function loadPaymentForm() {
    // Obtener el amount del campo hidden en tu HTML actual
    const amountInput = document.getElementById('amount');
    
    // ✅ VERIFICACIÓN MEJORADA - Usar múltiples criterios
    const hasValidAmount = amountInput && amountInput.value && amountInput.value !== '0';
    const hasItemsInCart = cart && cart.length > 0;
    
    if (!hasValidAmount || !hasItemsInCart) {
        alert('Error: El carrito está vacío. Agrega productos antes de pagar.');
        return;
    }
    
    const productCost = parseFloat(amountInput.value);
    
    if (isNaN(productCost) || productCost <= 0) {
        alert('Error: El monto debe ser mayor a 0.');
        return;
    }

    console.log('Monto a pagar:', productCost);

    // ✅ 1. CARGAR WALLET BRICK (Billetera Mercado Pago)
    await loadWalletBrick(productCost);
    
    // ✅ 2. CARGAR PAYMENT BRICK (Otros métodos de pago)
    const settings = {
        initialization: {
            amount: productCost,
            payer: {
                email: "test@test.com",
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
                
                try {
                    const response = await fetch('/process_payment', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(formData)
                    });
                    
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    
                    const result = await response.json();
                    console.log('Respuesta del servidor:', result);
                    
                    if (!result.hasOwnProperty("error_message")) {
                        await renderStatusScreenBrick(bricksBuilder, result);
                        
                        $('.container__payment').fadeOut(500);
                        setTimeout(() => {
                            $('.container__result').show(500).fadeIn();
                        }, 500);
                    } else {
                        alert('Error en el pago: ' + result.error_message);
                    }
                } catch (error) {
                    console.error('Error en la petición:', error);
                    alert('Error al procesar el pago: ' + error.message);
                }
            }
        },
        locale: 'es-AR',
        customization: {
            paymentMethods: {
                creditCard: "all",
                debitCard: "all",
                ticket: "all"
                // ❌ ELIMINAR: wallet, bankTransfer, credits (no son parámetros válidos)
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

// Event listeners usando jQuery
$(document).ready(function() {
    // ACTUALIZAR EL MONTO VISIBLE AL CARGAR LA PÁGINA
    updateSummaryTotal();
    
    // APLICAR ESTILO SEVERO AL CONTENEDOR DE RESULTADOS
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
            console.log('=== VERIFICACIÓN CARRITO ===');
            console.log('Cart:', cart);
            console.log('Cart length:', cart ? cart.length : 0);
            console.log('Amount value:', document.getElementById('amount')?.value);
            
            // ✅ VERIFICACIÓN MÚLTIPLE Y ROBUSTA
            const hasItemsInCart = cart && cart.length > 0;
            const amountInput = document.getElementById('amount');
            const hasValidAmount = amountInput && amountInput.value && amountInput.value !== '0' && amountInput.value !== '0.00';
            const amountValue = parseFloat(amountInput?.value || 0);
            
            console.log('Verificación:', { 
                hasItemsInCart, 
                hasValidAmount, 
                amountValue,
                isCheckoutEnabled: !this.disabled 
            });
            
            if (!hasItemsInCart || !hasValidAmount || amountValue <= 0) {
                alert('El carrito está vacío. Agrega productos antes de pagar.');
                console.log('❌ Carrito inválido detectado');
                return;
            }
            
            console.log('✅ Carrito OK - Procediendo con pago...');
            
            // ACTUALIZAR EL RESUMEN DE PAGO ANTES DE MOSTRAR EL FORMULARIO
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

    // ✅ NUEVO: Botón "Volver a Pagos"
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

// FUNCIÓN PARA ACTUALIZAR EL RESUMEN DE PAGO (desde tu HTML)
function updatePaymentSummary() {
    const summaryContainer = document.getElementById('summary-items');
    const amountInput = document.getElementById('amount');
    let total = 0;
    
    summaryContainer.innerHTML = '';
    
    if (!cart || cart.length === 0) {
        summaryContainer.innerHTML = '<p class="text-muted text-center">No hay productos en el carrito</p>';
        if (amountInput) amountInput.value = '0';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            summaryContainer.innerHTML += `
                <div class="item mb-3 p-2 border-bottom">
                    <span class="price">$${itemTotal.toLocaleString()}</span>
                    <p class="item-name mb-1">${item.name}</p>
                    <small class="text-muted">Cantidad: ${item.quantity}</small>
                </div>
            `;
        });
        
        // ✅ Asegurar que el amount tenga el valor correcto
        if (amountInput) {
            amountInput.value = total;
            console.log('Amount actualizado para pago:', amountInput.value);
        }
    }
    
    document.getElementById('summary-total').textContent = `$${total.toLocaleString()}`;
    updateSummaryTotal(); // Actualizar también el monto visible
}

// ✅ FUNCIONES DEL CARRITO (desde tu HTML)
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
    const amountInput = document.getElementById('amount');
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    if (!cart || cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted text-center">Tu carrito está vacío</p>';
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '💳 Ir a Pagar';
        if (amountInput) amountInput.value = '0';
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
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = `💳 Pagar $${total.toLocaleString()}`;
        if (amountInput) amountInput.value = total;
    }
    
    document.getElementById('cart-total').textContent = `$${total.toLocaleString()}`;
}
