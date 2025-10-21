const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago('APP_USR-c90816a8-38cd-4720-9f60-226dae2b7b4d');
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
                    // Volver al carrito si hay error
                    volverAlCarrito();
                }
            }
        });
    } catch (error) {
        console.error('Error rendering status screen:', error);
        volverAlCarrito();
    }
};

// Función para volver al carrito
function volverAlCarrito() {
    $('.container__payment').fadeOut(500);
    $('.container__result').fadeOut(500);
    setTimeout(() => {
        $('.container__cart').show(500).fadeIn();
    }, 500);
}

function loadPaymentForm() {
    const productCost = document.getElementById('amount').value;
    
    // Limpiar contenedor anterior si existe
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
                // Volver al carrito inmediatamente en error
                volverAlCarrito();
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                console.log('Datos del formulario enviados:', formData);

                fetch('/process_payment', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData)
                })
                .then(async (response) => {
                    console.log('Respuesta del servidor:', response);
                    
                    if (!response.ok) {
                        // Cualquier error HTTP (403, 500, etc.) -> volver al carrito
                        volverAlCarrito();
                        return;
                    }
                    
                    return response.json();
                })
                .then(result => {
                    console.log('Resultado del pago:', result);

                    if (result.status === 'approved' || result.status === 'pending') {
                        // Pago exitoso o pendiente
                        renderStatusScreenBrick(bricksBuilder, result);
                        
                        $('.container__payment').fadeOut(500);
                        setTimeout(() => {
                            $('.container__result').show(500).fadeIn();
                        }, 500);
                    } else {
                        // Pago rechazado -> volver al carrito
                        volverAlCarrito();
                    }
                })
                .catch((error) => {
                    console.error('Error en el pago:', error);
                    // Cualquier error -> volver al carrito
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

        const url = `/process_payment/download_receipt/${paymentId}`;
        fetch(url)
            .then(response => response.blob())
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
