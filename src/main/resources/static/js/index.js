const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago('APP_USR-c90816a8-38cd-4720-9f60-226dae2b7b4d');
let cardPaymentBrickController;
const bricksBuilder = mercadopago.bricks();
let paymentId;

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
            },
            onError: (error) => {
                console.error('Error en Status Screen Brick:', error);
            }
        }
    });
};

function loadPaymentForm() {
    // Obtener el amount del campo hidden en tu HTML actual
    const amountInput = document.getElementById('amount');
    
    if (!amountInput || !amountInput.value || amountInput.value === '0') {
        alert('Error: El carrito está vacío. Agrega productos antes de pagar.');
        return;
    }
    
    const productCost = parseFloat(amountInput.value);
    
    if (isNaN(productCost) || productCost <= 0) {
        alert('Error: El monto debe ser mayor a 0.');
        return;
    }

    console.log('Monto a pagar:', productCost);

    const settings = {
        initialization: {
            amount: productCost,
        },
        callbacks: {
            onReady: () => {
                console.log('Payment Brick ready');
            },
            onError: (error) => {
                console.error('Error en Payment Brick:', error);
                alert('Error al cargar el formulario de pago');
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
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('Respuesta del servidor:', result);
                    
                    if (!result.hasOwnProperty("error_message")) {
                        renderStatusScreenBrick(bricksBuilder, result);
                        
                        $('.container__payment').fadeOut(500);
                        setTimeout(() => {
                            $('.container__result').show(500).fadeIn();
                        }, 500);
                    } else {
                        alert('Error en el pago: ' + result.error_message);
                    }
                })
                .catch((error) => {
                    console.error('Error en la petición:', error);
                    alert('Error al procesar el pago: ' + error.message);
                });
            }
        },
        locale: 'es-AR',
        customization: {
            paymentMethods: {
                creditCard: 'all',
                debitCard: 'all',
                ticket: 'all'
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
    }

    // Limpiar el contenedor antes de crear el nuevo Brick
    const container = document.getElementById('mercadopago-bricks-contaner__PaymentCard');
    if (container) {
        container.innerHTML = '';
    }

    const bricks = mercadopago.bricks();
    cardPaymentBrickController = bricks.create('payment', 'mercadopago-bricks-contaner__PaymentCard', settings);
}

// Event listeners usando jQuery
$(document).ready(function() {
    // Botón "Ir a Pagar"
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', function() {
            // Verificar que el carrito no esté vacío
            const amountInput = document.getElementById('amount');
            if (!amountInput || !amountInput.value || amountInput.value === '0') {
                alert('El carrito está vacío. Agrega productos antes de pagar.');
                return;
            }
            
            $('.container__cart').fadeOut(500);
            setTimeout(() => {
                loadPaymentForm();
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
    } else {
        console.error('Elemento "download-receipt" no encontrado');
    }
});
