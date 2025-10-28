// ✅ CORREGIDO: Manejo unificado de pagos - VERSIÓN QUE FUNCIONA
async function handlePaymentSubmission(paymentData, brickType) {
    console.log(`🔄 Procesando pago desde ${brickType}:`, paymentData);
    
    // ✅ VALIDACIÓN CORRECTA DE LA VERSIÓN ANTERIOR
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

// ✅ FUNCIÓN AUXILIAR: Obtener datos del cliente (si existe en tu versión)
function getCustomerData() {
    return {
        firstName: document.getElementById('customer-first-name')?.value.trim() || 'Cliente',
        lastName: document.getElementById('customer-last-name')?.value.trim() || 'Millenium',
        email: document.getElementById('customer-email')?.value.trim() || 'cliente@millenium.com',
        dniType: document.getElementById('customer-dni-type')?.value || 'DNI',
        dniNumber: document.getElementById('customer-dni-number')?.value.trim() || '',
        phone: document.getElementById('customer-phone')?.value.trim() || ''
    };
}

// ✅ CORREGIDO: Inicializar Payment Brick con la estructura correcta
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
                </div>
            `;
        }
    }
}

// ✅ VERSIÓN SEGURA de loadPaymentForm
async function loadPaymentForm() {
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

    const amountInput = ensureAmountField();
    amountInput.value = cartTotal.toFixed(2);
    
    // Obtener datos del cliente
    const customerData = getCustomerData();

    // ✅ 1. CARGAR WALLET BRICK (con preferencia)
    await loadWalletBrick(cartTotal);

    // ✅ 2. CARGAR PAYMENT BRICK (pagos directos)
    await initializePaymentBrick(cartTotal, customerData.email);
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

// ✅ FUNCIÓN: Calcular total del carrito de forma confiable
function calculateCartTotal() {
    if (!cart || cart.length === 0) return 0;
    
    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });
    return total;
}

// ✅ CORREGIDO: Función createWalletPreference 
async function createWalletPreference(amount) {
    try {
        console.log('🔄 Creando preferencia para Wallet Brick, monto:', amount);

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

// ✅ CORREGIDO: Función loadWalletBrick CON PREFERENCIA
async function loadWalletBrick(amount) {
    try {
        const walletContainer = document.getElementById('walletBrick_container');
        if (walletContainer) {
            walletContainer.innerHTML = '';
        }

        console.log('💰 Configurando Wallet Brick con monto:', amount);

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
                    // Fallback elegante
                    const walletContainer = document.getElementById('walletBrick_container');
                    if (walletContainer) {
                        walletContainer.innerHTML = `
                            <div style="background: #1d2431; color: aquamarine; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                                <h4>💳 Pagar con Mercado Pago</h4>
                                <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                                <small>La billetera rápida no está disponible temporalmente.</small>
                            </div>
                        `;
                    }
                }
            }
        });
        console.log('✅ Wallet Brick creado exitosamente con preferencia:', preferenceId);
    } catch (error) {
        console.error('❌ Error creando Wallet Brick:', error);
        const walletContainer = document.getElementById('walletBrick_container');
        if (walletContainer) {
            walletContainer.innerHTML = `
                <div style="background: #1d2431; color: aquamarine; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                    <h4>💳 Pagar con Mercado Pago</h4>
                    <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                    <small>La billetera rápida no está disponible temporalmente.</small>
                </div>
            `;
        }
    }
}

// ✅ Status Screen Brick (mantener igual)
const renderStatusScreenBrick = async (bricksBuilder, result) => {
    paymentId = result.id;
    console.log('Payment ID:', paymentId);

    try {
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
                    console.log('Status Screen Brick ready');
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
    } catch (error) {
        console.error('❌ Error creando Status Screen:', error);
    }
};
