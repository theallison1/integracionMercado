const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey);
let cardPaymentBrickController;
const bricksBuilder = mercadopago.bricks();
let paymentId;

const renderStatusScreenBrick = async (bricksBuilder, result) => {
    try {
        console.log('=== INICIANDO RENDER STATUS SCREEN ===');
        paymentId = result.id;
        console.log('Payment ID para Status Screen:', paymentId);

        window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
            initialization: {
                paymentId: paymentId
            },
            callbacks: {
                onReady: () => {
                    console.log('✅ Status Screen listo y visible');
                },
                onError: (error) => {
                    console.error('❌ Error en Status Screen:', error);
                    volverAlCarrito();
                }
            }
        });
        
        console.log('✅ Status Screen Brick creado exitosamente');
    } catch (error) {
        console.error('❌ Error rendering status screen:', error);
        volverAlCarrito();
    }
};

// Función para volver al carrito
function volverAlCarrito() {
    console.log('🔙 Volviendo al carrito...');
    $('.container__payment').fadeOut(500);
    $('.container__result').fadeOut(500);
    setTimeout(() => {
        $('.container__cart').show(500).fadeIn();
        console.log('✅ Carrito visible');
    }, 500);
}

function loadPaymentForm() {
    const productCost = document.getElementById('amount').value;
    console.log('💰 Monto a pagar:', productCost);
    
    // Limpiar contenedor anterior si existe
    const brickContainer = document.getElementById('mercadopago-bricks-contaner__PaymentCard');
    brickContainer.innerHTML = '';
    console.log('🧹 Contenedor de Brick limpiado');

    const settings = {
        initialization: {
            amount: parseFloat(productCost),
        },
        callbacks: {
            onReady: () => {
                console.log('✅ Brick de pago listo');
            },
            onError: (error) => {
                console.error('❌ Error en Brick:', error);
                volverAlCarrito();
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                console.log('=== 🚀 INICIANDO ENVÍO DE PAGO ===');
                console.log('📋 Datos del Brick:', formData);
                console.log('🔑 Public Key usada:', mercadoPagoPublicKey);

                const paymentUrl = 'https://integracionmercado.onrender.com/process_payment';
                console.log('🌐 URL del backend:', paymentUrl);
                
                fetch(paymentUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData)
                })
                .then(async (response) => {
                    console.log('=== 📨 RESPUESTA HTTP RECIBIDA ===');
                    console.log('📊 Status:', response.status);
                    console.log('✅ OK:', response.ok);
                    console.log('🔗 URL:', response.url);
                    
                    // Obtener el texto completo de la respuesta
                    const responseText = await response.text();
                    console.log('📝 Response Text (RAW):', responseText);
                    
                    if (!response.ok) {
                        console.error('❌ Error HTTP:', response.status);
                        console.error('📋 Error Details:', responseText);
                        volverAlCarrito();
                        return null;
                    }
                    
                    try {
                        const result = JSON.parse(responseText);
                        console.log('✅ Respuesta JSON parseada correctamente:', result);
                        return result;
                    } catch (jsonError) {
                        console.error('❌ Error parseando JSON:', jsonError);
                        console.error('📋 Texto que causó el error:', responseText);
                        volverAlCarrito();
                        return null;
                    }
                })
                .then(result => {
                    console.log('=== 🔄 PROCESANDO RESULTADO ===');
                    console.log('📦 Result completo:', result);
                    
                    if (!result) {
                        console.error('❌ Result es null o undefined - No hay datos del pago');
                        volverAlCarrito();
                        return;
                    }

                    // Verificar estructura del resultado
                    console.log('🔍 ID del pago:', result.id);
                    console.log('🔍 Estado del pago:', result.status);
                    console.log('🔍 Status Detail:', result.statusDetail);
                    console.log('🔍 Tipo de resultado:', typeof result);
                    console.log('🔍 Keys del resultado:', Object.keys(result));
                    
                    if (result.status === 'approved' || result.status === 'pending') {
                        console.log('🎉 Pago exitoso/pendiente - Procediendo con flujo de éxito');
                        
                        // PASO 1: Ocultar formulario de pago
                        console.log('👁️‍🗨️ Ocultando formulario de pago...');
                        $('.container__payment').fadeOut(500);
                        
                        // PASO 2: Renderizar Status Screen Brick
                        console.log('🎬 Renderizando Status Screen Brick...');
                        renderStatusScreenBrick(bricksBuilder, result);
                        
                        // PASO 3: Mostrar pantalla de resultado después de un delay
                        setTimeout(() => {
                            console.log('🖥️ Mostrando pantalla de resultado...');
                            $('.container__result').show(500).fadeIn();
                            console.log('✅ Pantalla de resultado debería estar visible ahora');
                            
                            // Verificar visibilidad
                            setTimeout(() => {
                                const isResultVisible = $('.container__result').is(':visible');
                                console.log('👀 Pantalla de resultado visible:', isResultVisible);
                            }, 600);
                        }, 1000);
                        
                    } else {
                        console.log('❌ Pago rechazado - Estado:', result.status);
                        console.log('📋 Detalles:', result.statusDetail);
                        volverAlCarrito();
                    }
                })
                .catch((error) => {
                    console.error('=== 💥 ERROR EN FETCH ===');
                    console.error('❌ Error name:', error.name);
                    console.error('❌ Error message:', error.message);
                    console.error('❌ Error stack:', error.stack);
                    volverAlCarrito();
                });
            }
        },
        locale: 'es-AR',
        customization: {
            paymentMethods: {
                creditCard: 'all',
                debitCard: 'all',
                ticket: 'all',
                walletPurchase: 'all'
            },
            visual: {
                style: {
                    theme: 'dark',
                    customVariables: {
                        formBackgroundColor: '#1d2431',
                        baseColor: 'aquamarine'
                    }
                }
            }
        },
    };

    try {
        console.log('🔧 Creando Brick de pago...');
        cardPaymentBrickController = bricksBuilder.create('payment', 'mercadopago-bricks-contaner__PaymentCard', settings);
        console.log('✅ Brick de pago creado exitosamente');
    } catch (error) {
        console.error('❌ Error al crear Brick:', error);
        volverAlCarrito();
    }
}

// Handle transitions
document.getElementById('checkout-btn').addEventListener('click', function() {
    console.log('🛒 Click en botón "Pagar"');
    console.log('📦 Productos en carrito:', cart);
    
    $('.container__cart').fadeOut(500);
    setTimeout(() => {
        console.log('💳 Cargando formulario de pago...');
        loadPaymentForm();
        $('.container__payment').show(500).fadeIn();
        console.log('✅ Formulario de pago visible');
    }, 500);
});

document.getElementById('go-back').addEventListener('click', function() {
    console.log('🔙 Click en botón "Volver"');
    volverAlCarrito();
});

// Verifica la existencia del botón "download-receipt"
const downloadReceiptBtn = document.getElementById('download-receipt');
if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', function() {
        console.log('📄 Click en botón "Descargar Comprobante"');
        
        if (!paymentId) {
            console.error('❌ Payment ID not found');
            alert('No hay un ID de pago disponible');
            return;
        }

        console.log('🔍 Payment ID para descarga:', paymentId);
        const url = `https://integracionmercado.onrender.com/process_payment/download_receipt/${paymentId}`;
        console.log('🌐 URL de descarga:', url);
        
        fetch(url)
            .then(response => {
                console.log('📨 Respuesta de descarga:', response.status);
                
                if (!response.ok) {
                    throw new Error(`Error ${response.status} descargando comprobante`);
                }
                return response.blob();
            })
            .then(blob => {
                console.log('✅ Comprobante descargado, creando enlace...');
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'comprobante-millenium.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                console.log('✅ Comprobante descargado exitosamente');
            })
            .catch(error => {
                console.error('❌ Error downloading receipt:', error);
                alert('Error al descargar el comprobante: ' + error.message);
            });
    });
} else {
    console.error('❌ Elemento "download-receipt" no encontrado');
}

// Log inicial
console.log('=== 🚀 SISTEMA INICIALIZADO ===');
console.log('🔑 Public Key:', mercadoPagoPublicKey);
console.log('🌐 Entorno:', mercadoPagoPublicKey.startsWith('TEST-') ? 'PRUEBAS' : 'PRODUCCIÓN');
