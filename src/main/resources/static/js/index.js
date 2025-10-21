// ========== MERCADO PAGO INTEGRATION ==========
const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;

// 1. INICIALIZACIÓN CORRECTA
const mp = new MercadoPago(mercadoPagoPublicKey, {
    locale: 'es-AR'
});

let paymentBrickController;
let preferenceId;

// 2. FUNCIÓN PRINCIPAL CORREGIDA - SEGÚN DOCUMENTACIÓN
const renderPaymentBrick = async (bricksBuilder) => {
    console.log('🔧 Iniciando renderizado de Payment Brick...');
    
    const settings = {
        initialization: {
            amount: parseFloat(document.getElementById('amount').value),
            // ✅ AGREGAR ESTOS CAMPOS ESENCIALES:
            payer: {
                email: "comprador@ejemplo.com", // Puedes obtenerlo de un formulario
            },
        },
        customization: {
            visual: {
                style: {
                    theme: "dark",
                    customVariables: {
                        formBackgroundColor: '#1d2431',
                        baseColor: 'aquamarine'
                    }
                },
            },
            paymentMethods: {
                creditCard: "all",
                debitCard: "all",
                ticket: "all",
                bankTransfer: "all",
                maxInstallments: 12 // Aumentar cuotas
            },
        },
        callbacks: {
            onReady: () => {
                console.log('✅ Payment Brick listo y visible');
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                console.log('=== 🚀 INICIANDO ENVÍO DE PAGO ===');
                console.log('📋 Datos del Brick:', formData);
                console.log('💳 Método seleccionado:', selectedPaymentMethod);

                // ✅ RETURN PROMISE COMO EN LA DOCUMENTACIÓN
                return new Promise((resolve, reject) => {
                    fetch("https://integracionmercado.onrender.com/process_payment", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(formData),
                    })
                    .then(async (response) => {
                        console.log('=== 📨 RESPUESTA HTTP RECIBIDA ===');
                        console.log('📊 Status:', response.status);
                        
                        const responseText = await response.text();
                        console.log('📝 Response Text (RAW):', responseText);

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${responseText}`);
                        }

                        const result = JSON.parse(responseText);
                        console.log('✅ Respuesta JSON:', result);

                        if (result.status === 'approved' || result.status === 'pending' || result.status === 'in_process') {
                            console.log('🎉 Pago exitoso - Procediendo...');
                            
                            // ✅ RESOLVER PRIMERO como indica la documentación
                            resolve();
                            
                            // ✅ LUEGO mostrar resultado
                            setTimeout(() => {
                                showPaymentResult(result);
                            }, 100);
                            
                        } else {
                            console.log('❌ Pago rechazado:', result.status);
                            reject(new Error(`Pago rechazado: ${result.status}`));
                        }
                    })
                    .catch((error) => {
                        console.error('=== 💥 ERROR EN FETCH ===', error);
                        reject(error);
                    });
                });
            },
            onError: (error) => {
                console.error('❌ Error en Payment Brick:', error);
                alert('Error en el formulario de pago. Por favor, recarga la página.');
            },
        },
    };

    try {
        // ✅ CREAR BRICK COMO EN LA DOCUMENTACIÓN
        window.paymentBrickController = await bricksBuilder.create(
            "payment",
            "mercadopago-bricks-contaner__PaymentCard",
            settings
        );
        console.log('✅ Payment Brick creado exitosamente');
        
    } catch (error) {
        console.error('❌ Error creando Payment Brick:', error);
        document.getElementById('mercadopago-bricks-contaner__PaymentCard').innerHTML = `
            <div class="alert alert-danger">
                <h5>Error al cargar el formulario de pago</h5>
                <p>Recarga la página o intenta nuevamente.</p>
                <button class="btn btn-warning" onclick="volverAlCarrito()">Volver al Carrito</button>
            </div>
        `;
    }
};

// 3. FUNCIÓN MEJORADA PARA MOSTRAR RESULTADO
function showPaymentResult(result) {
    console.log('=== 🎯 MOSTRANDO RESULTADO ===');
    console.log('Resultado del pago:', result);

    // Ocultar formulario de pago
    document.querySelector('.payment-form').style.display = 'none';
    
    // Mostrar sección de resultados
    const resultSection = document.querySelector('.container__result').closest('section');
    resultSection.style.display = 'block';
    
    const container = document.getElementById('statusScreenBrick_container');
    
    // ✅ RENDERIZAR STATUS SCREEN BRICK CORRECTAMENTE
    renderStatusScreenBrick(result);
}

// 4. FUNCIÓN CORREGIDA PARA STATUS SCREEN
async function renderStatusScreenBrick(result) {
    console.log('=== 📱 RENDERIZANDO STATUS SCREEN ===');
    paymentId = result.id;
    
    const container = document.getElementById('statusScreenBrick_container');
    container.innerHTML = '<div class="text-center p-4">Cargando estado del pago...</div>';

    try {
        const bricksBuilder = await mp.bricks();
        
        console.log('🔧 Creando Status Screen Brick...');
        window.statusScreenBrickController = await bricksBuilder.create(
            'statusScreen', 
            'statusScreenBrick_container', 
            {
                initialization: {
                    paymentId: paymentId
                },
                callbacks: {
                    onReady: () => {
                        console.log('✅ Status Screen listo y visible');
                    },
                    onError: (error) => {
                        console.error('❌ Error en Status Screen:', error);
                        showFallbackResult(result);
                    }
                }
            }
        );
        console.log('✅ Status Screen Brick creado');
        
    } catch (error) {
        console.error('❌ Error creando Status Screen:', error);
        showFallbackResult(result);
    }
}

// 5. FALLBACK MEJORADO
function showFallbackResult(result) {
    const container = document.getElementById('statusScreenBrick_container');
    const amount = document.getElementById('summary-total')?.textContent || '0';
    
    container.innerHTML = `
        <div class="alert alert-success text-center">
            <h2>✅</h2>
            <h4>¡Pago Exitoso!</h4>
            <div class="bg-dark p-3 rounded my-3 text-left">
                <p><strong>ID:</strong> ${result.id}</p>
                <p><strong>Estado:</strong> ${result.status}</p>
                <p><strong>Monto:</strong> $${amount}</p>
            </div>
            <button class="btn btn-primary" onclick="volverAlCarrito()">Continuar Comprando</button>
        </div>
    `;
}

// 6. FUNCIÓN PARA CARGAR FORMULARIO DE PAGO
async function loadPaymentForm() {
    console.log('💰 Cargando formulario de pago...');
    
    const brickContainer = document.getElementById('mercadopago-bricks-contaner__PaymentCard');
    brickContainer.innerHTML = '<div class="text-center p-4">Cargando opciones de pago...</div>';

    try {
        // OBTENER BRICKS BUILDER
        const bricksBuilder = await mp.bricks();
        console.log('✅ Bricks Builder obtenido');
        
        // RENDERIZAR PAYMENT BRICK
        await renderPaymentBrick(bricksBuilder);
        
    } catch (error) {
        console.error('❌ Error cargando formulario:', error);
        brickContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar el formulario. Recarga la página.
            </div>
        `;
    }
}

// 7. FUNCIÓN VOLVER AL CARRITO (MANTENER LA TUYA)
function volverAlCarrito() {
    console.log('🔙 Volviendo al carrito...');
    
    document.querySelector('.payment-form').style.display = 'none';
    document.querySelector('.container__result').closest('section').style.display = 'none';
    document.querySelector('.container__cart').closest('section').style.display = 'block';
    
    // Resetear carrito si el pago fue exitoso
    if (paymentId) {
        cart = [];
        updateCartDisplay();
        document.querySelectorAll('.quantity-control').forEach(input => {
            input.value = 0;
        });
    }
}

// 8. EVENT LISTENERS (MANTENER LOS TUYOS)
document.getElementById('checkout-btn').addEventListener('click', function() {
    console.log('🛒 Click en botón "Pagar"');
    
    if (cart.length > 0) {
        document.querySelector('.container__cart').closest('section').style.display = 'none';
        document.querySelector('.payment-form').style.display = 'block';
        updatePaymentSummary();
        loadPaymentForm();
    }
});

document.getElementById('go-back').addEventListener('click', function() {
    volverAlCarrito();
});

// ========== MANTENER TU CÓDIGO DE CARRITO ==========
// (Todo tu código existente de products, cart, renderProducts, etc.)
const products = [ /* ... tu array de productos ... */ ];
let cart = [];
// ... el resto de tus funciones del carrito ...

// Log inicial
console.log('=== 🚀 SISTEMA INICIALIZADO ===');
console.log('🔑 Public Key:', mercadoPagoPublicKey);
