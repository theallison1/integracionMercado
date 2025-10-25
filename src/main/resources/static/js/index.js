const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago('APP_USR-c90816a8-38cd-4720-9f60-226dae2b7b4d');
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

// ✅ ACTUALIZADO: Función async/await
async function loadPaymentForm() {
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
            onSubmit: async ({ selectedPaymentMethod, formData }) => { // ✅ También async aquí
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
                ticket: "all",
                bankTransfer: "all",
                wallet_purchase: "all",
                onboarding_credits: "all"
            },
            maxInstallments: 1,
            visual: {
                style: {
                    theme: 'dark',
                    customVariables: {
                        formBackgroundColor: '#1d2431',
                        baseColor: 'aquamarine',
                        outlinePrimaryColor: 'aquamarine',
                        buttonTextColor: '#1d2431',
                        fontSizeExtraSmall: '14px',
                        fontSizeSmall: '16px',
                        fontSizeMedium: '18px',
                        fontSizeLarge: '20px'
                    }
                }
            }
        }
    };

    // Limpiar el contenedor antes de crear el nuevo Brick
    const container = document.getElementById('paymentBrick_container'); // ✅ ID actualizado
    if (container) {
        container.innerHTML = '';
    }

    try {
        // ✅ ACTUALIZADO: Usando la mejor práctica
        window.paymentBrickController = await bricksBuilder.create(
            "payment",
            "paymentBrick_container", // ✅ ID actualizado
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
    
    // Botón "Ir a Pagar"
    const checkoutBtn = $('#checkout-btn');
    if (checkoutBtn.length) {
        checkoutBtn.on('click', async function() { // ✅ También async aquí
            // Verificar que el carrito no esté vacío
            const amountInput = document.getElementById('amount');
            if (!amountInput || !amountInput.value || amountInput.value === '0') {
                alert('El carrito está vacío. Agrega productos antes de pagar.');
                return;
            }
            
            // ACTUALIZAR EL MONTO VISIBLE ANTES DE MOSTRAR EL FORMULARIO
            updateSummaryTotal();
            
            $('.container__cart').fadeOut(500);
            setTimeout(async () => {
                await loadPaymentForm(); // ✅ await aquí también
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
