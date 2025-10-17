const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago('APP_USR-c90816a8-38cd-4720-9f60-226dae2b7b4d');
let cardPaymentBrickController;
const bricksBuilder = mercadopago.bricks();
let paymentId;

// Función para mostrar errores al usuario
function showError(message) {
    // Crear o mostrar contenedor de error
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(errorContainer);
    }
    
    errorContainer.innerHTML = `
        <strong>❌ Error en el pago</strong>
        <p style="margin: 5px 0; font-size: 14px;">${message}</p>
        <button onclick="this.parentElement.remove()" style="background: none; border: 1px solid white; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
            Cerrar
        </button>
    `;
    
    // Auto-remover después de 10 segundos
    setTimeout(() => {
        if (errorContainer && errorContainer.parentElement) {
            errorContainer.remove();
        }
    }, 10000);
}

// Función para mostrar loading
function showLoading(show) {
    let loading = document.getElementById('loading-overlay');
    if (show) {
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'loading-overlay';
            loading.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                color: white;
                font-size: 18px;
            `;
            loading.innerHTML = `
                <div style="text-align: center;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #d4af37; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
                    <p>Procesando pago...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loading);
        }
    } else {
        if (loading) {
            loading.remove();
        }
    }
}

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
                    showError('Error al cargar el comprobante de pago');
                }
            }
        });
    } catch (error) {
        console.error('Error rendering status screen:', error);
        showError('Error al mostrar el resultado del pago');
    }
};

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
                // Ocultar loading si estaba visible
                showLoading(false);
            },
            onError: (error) => {
                console.error('Error en Brick:', error);
                showLoading(false);
                
                let errorMessage = 'Error al cargar el formulario de pago';
                if (error && error.message) {
                    errorMessage += `: ${error.message}`;
                }
                showError(errorMessage);
                
                // Opcional: Volver al carrito después de error
                setTimeout(() => {
                    $('.container__payment').fadeOut(500);
                    $('.container__cart').show(500).fadeIn();
                }, 3000);
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                console.log('Datos del formulario enviados:', formData);
                showLoading(true);

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
                        // Manejar errores HTTP (403, 500, etc.)
                        const errorText = await response.text();
                        throw new Error(`Error ${response.status}: ${errorText}`);
                    }
                    
                    return response.json();
                })
                .then(result => {
                    showLoading(false);
                    console.log('Resultado del pago:', result);

                    if (result.status === 'approved' || result.status === 'pending') {
                        // Pago exitoso o pendiente
                        renderStatusScreenBrick(bricksBuilder, result);
                        
                        $('.container__payment').fadeOut(500);
                        setTimeout(() => {
                            $('.container__result').show(500).fadeIn();
                        }, 500);
                    } else {
                        // Pago rechazado
                        let errorMsg = 'Pago rechazado';
                        if (result.error_message) {
                            errorMsg += `: ${result.error_message}`;
                        }
                        if (result.status_detail) {
                            errorMsg += ` (${result.status_detail})`;
                        }
                        showError(errorMsg);
                    }
                })
                .catch((error) => {
                    showLoading(false);
                    console.error('Error en el pago:', error);
                    
                    let errorMsg = 'Error al procesar el pago';
                    if (error.message) {
                        if (error.message.includes('403')) {
                            errorMsg = 'Error de autorización (403). Verifique las credenciales.';
                        } else if (error.message.includes('500')) {
                            errorMsg = 'Error interno del servidor. Intente nuevamente.';
                        } else {
                            errorMsg = error.message;
                        }
                    }
                    showError(errorMsg);
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
        showLoading(true);
        cardPaymentBrickController = bricksBuilder.create('payment', 'mercadopago-bricks-contaner__PaymentCard', settings);
    } catch (error) {
        showLoading(false);
        console.error('Error al crear Brick:', error);
        showError('No se pudo cargar el formulario de pago');
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
    // Limpiar errores al volver
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) errorContainer.remove();
    
    $('.container__payment').fadeOut(500);
    setTimeout(() => {
        $('.container__cart').show(500).fadeIn();
    }, 500);
});

// Handle price update
function updatePrice() {
    let quantity = document.getElementById('quantity').value;
    let unitPrice = document.getElementById('unit-price').innerText;
    let amount = parseInt(unitPrice) * parseInt(quantity);

    document.getElementById('cart-total').innerText = '$ ' + amount;
    document.getElementById('summary-price').innerText = '$ ' + unitPrice;
    document.getElementById('summary-quantity').innerText = quantity;
    document.getElementById('summary-total').innerText = '$ ' + amount;
    document.getElementById('amount').value = amount;
};

document.getElementById('quantity').addEventListener('change', updatePrice);
updatePrice();

// Verifica la existencia del botón "download-receipt" antes de añadir el event listener
const downloadReceiptBtn = document.getElementById('download-receipt');
if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', function() {
        if (!paymentId) {
            showError('No hay un ID de pago disponible');
            return;
        }

        showLoading(true);
        const url = `/process_payment/download_receipt/${paymentId}`;
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al descargar comprobante');
                }
                return response.blob();
            })
            .then(blob => {
                showLoading(false);
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
                showLoading(false);
                console.error('Error downloading receipt:', error);
                showError('Error al descargar el comprobante');
            });
    });
} else {
    console.error('Elemento "download-receipt" no encontrado');
}
