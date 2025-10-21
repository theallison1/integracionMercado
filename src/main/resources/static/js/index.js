const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago(mercadoPagoPublicKey);
let cardPaymentBrickController;
const bricksBuilder = mercadopago.bricks();
let paymentId;

const renderStatusScreenBrick = async (bricksBuilder, result) => {
    try {
        paymentId = result.id;
        console.log('Payment ID:', paymentId);

        window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
            initialization: {
                paymentId: paymentId
            },
            callbacks: {
                onReady: () => {
                    console.log('Status Screen ready');
                },
                onError: (error) => {
                    console.error('Error en Status Screen:', error);
                    volverAlCarrito();
                }
            }
        });
    } catch (error) {
        console.error('Error rendering status screen:', error);
        volverAlCarrito();
    }
};

function volverAlCarrito() {
    $('.container__payment').fadeOut(500);
    $('.container__result').fadeOut(500);
    setTimeout(() => {
        $('.container__cart').show(500).fadeIn();
    }, 500);
}

function loadPaymentForm() {
    const productCost = document.getElementById('amount').value;
    
    const brickContainer = document.getElementById('mercadopago-bricks-contaner__PaymentCard');
    brickContainer.innerHTML = '';

    const settings = {
        initialization: {
            amount: parseFloat(productCost),
        },
        callbacks: {
            onReady: () => {
                console.log('Brick de pago listo');
            },
            onError: (error) => {
                console.error('Error en Brick:', error);
                volverAlCarrito();
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                console.log('=== INICIANDO PAGO ===');
                console.log('Datos del Brick:', formData);

                // URL ABSOLUTA PARA PRODUCCIÓN
                const paymentUrl = 'https://integracionmercado.onrender.com/process_payment';
                
                fetch(paymentUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData)
                })
                .then(async (response) => {
                    console.log('=== RESPUESTA HTTP ===');
                    console.log('Status:', response.status);
                    console.log('URL:', response.url);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('❌ Error HTTP:', response.status, errorText);
                        volverAlCarrito();
                        return null;
                    }
                    
                    try {
                        const result = await response.json();
                        console.log('✅ Respuesta JSON:', result);
                        return result;
                    } catch (jsonError) {
                        console.error('❌ Error parseando JSON:', jsonError);
                        return null;
                    }
                })
                .then(result => {
                    console.log('=== PROCESANDO RESULTADO ===');
                    console.log('Result:', result);
                    
                    if (!result) {
                        console.error('❌ Result es null o undefined');
                        volverAlCarrito();
                        return;
                    }

                    if (!result.status) {
                        console.error('❌ Result no tiene propiedad status:', result);
                        volverAlCarrito();
                        return;
                    }

                    console.log('Estado del pago:', result.status);
                    
                    if (result.status === 'approved' || result.status === 'pending') {
                        console.log('✅ Pago exitoso/pendiente');
                        renderStatusScreenBrick(bricksBuilder, result);
                        
                        $('.container__payment').fadeOut(500);
                        setTimeout(() => {
                            $('.container__result').show(500).fadeIn();
                        }, 500);
                    } else {
                        console.log('❌ Pago rechazado - Estado:', result.status);
                        volverAlCarrito();
                    }
                })
                .catch((error) => {
                    console.error('=== ERROR EN FETCH ===', error);
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
        cardPaymentBrickController = bricksBuilder.create('payment', 'mercadopago-bricks-contaner__PaymentCard', settings);
    } catch (error) {
        console.error('Error al crear Brick:', error);
        volverAlCarrito();
    }
}

// Handle transitions
document.getElementById('checkout-btn').addEventListener('click', function() {
    $('.container__cart').fadeOut(500);
    setTimeout(() => {
        loadPaymentForm();
        $('.container__payment').show(500).fadeIn();
    }, 500);
});

document.getElementById('go-back').addEventListener('click', function() {
    volverAlCarrito();
});

// Verifica la existencia del botón "download-receipt"
const downloadReceiptBtn = document.getElementById('download-receipt');
if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', function() {
        if (!paymentId) {
            console.error('Payment ID not found');
            return;
        }

        // URL ABSOLUTA PARA PRODUCCIÓN
        const url = `https://integracionmercado.onrender.com/process_payment/download_receipt/${paymentId}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error descargando comprobante');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'comprobante.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error downloading receipt:', error);
            });
    });
} else {
    console.error('Elemento "download-receipt" no encontrado');
}
