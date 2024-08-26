document.addEventListener('DOMContentLoaded', function() {
    const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key")?.value;
    if (!mercadoPagoPublicKey) {
        console.error('Mercado Pago public key not found');
        return;
    }

    const mercadopago = new MercadoPago(mercadoPagoPublicKey, {
        locale: 'es-AR' // Establece el idioma para el SDK
    });

    let cardPaymentBrickController;
    let isPaymentBrickInitialized = false; // Variable para verificar si el Brick ya está inicializado
    const bricksBuilder = mercadopago.bricks();

    const renderStatusScreenBrick = async (bricksBuilder, result) => {
        try {
            const paymentId = result.id;
            window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
                initialization: {
                    paymentId: paymentId
                },
                callbacks: {
                    onReady: () => {
                        console.log('Status Screen Brick ready');
                    },
                    onError: (error) => {
                        console.error('Error rendering status screen:', error);
                    }
                }
            });
        } catch (error) {
            console.error('Error creating status screen brick:', error);
        }
    };

    function loadPaymentForm() {
        if (isPaymentBrickInitialized) return; // Evita inicializar el Brick si ya está inicializado

        const productCost = document.getElementById('amount')?.value;
        if (!productCost) {
            console.error('Amount field not found or empty');
            return;
        }

        const settings = {
            initialization: {
                amount: productCost,

            },
            callbacks: {
                onReady: () => {
                    console.log('Payment Brick ready');
                    isPaymentBrickInitialized = true; // Marca el Brick como inicializado
                },
                onError: (error) => {
                    console.error('Error initializing payment brick:', error);
                },
                onSubmit: async ({ selectedPaymentMethod, formData }) => {
                    try {
                        const response = await fetch('/process_payment', {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(formData)
                        });

                        const result = await response.json();

                        if (!result.error_message) {
                            await renderStatusScreenBrick(bricksBuilder, result);
                            $('.container__payment').fadeIn(500);
                            $('.container__cart').fadeOut(500);
                            window.paymentId = result.id;
                        } else {
                            console.error('Payment error:', result.error_message);
                            alert("Error: " + JSON.stringify({
                                status: result.status,
                                message: result.error_message
                            }));
                        }
                    } catch (error) {
                        console.error('Error submitting payment:', error);
                        alert("Error: " + JSON.stringify(error));
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
                    atm: "all",
                    mercadoPago: "all"
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
            }
        };

        bricksBuilder.create('payment', 'mercadopago-bricks-contaner__PaymentCard', settings)
            .then(controller => {
                cardPaymentBrickController = controller;
            })
            .catch(error => {
                console.error('Error creating payment brick:', error);
            });
    }

    // Verifica la existencia del botón "checkout-btn" antes de añadir el event listener
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            $('.container__cart').fadeOut(500);
            setTimeout(() => {
                loadPaymentForm();
                $('.container__payment').fadeIn(500);
            }, 500);
        });
    } else {
        console.error('Elemento "checkout-btn" no encontrado');
    }

    // Verifica la existencia del botón "go-back" antes de añadir el event listener
    const goBackBtn = document.getElementById('go-back');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', function() {
            $('.container__payment').fadeOut(500);
            setTimeout(() => {
                $('.container__cart').fadeIn(500);
            }, 500);
        });
    } else {
        console.error('Elemento "go-back" no encontrado');
    }

    // Verifica la existencia del input "quantity" antes de añadir el event listener
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('change', updatePrice);
    } else {
        console.error('Elemento "quantity" no encontrado');
    }

    function updatePrice() {
        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        const unitPrice = parseInt(document.getElementById('unit-price')?.innerText) || 0;
        const amount = quantity * unitPrice;

        document.getElementById('cart-total').innerText = '$ ' + amount;
        document.getElementById('summary-price').innerText = '$ ' + unitPrice;
        document.getElementById('summary-quantity').innerText = quantity;
        document.getElementById('summary-total').innerText = '$ ' + amount;
        document.getElementById('amount').value = amount;
    }

    updatePrice();

    // Verifica la existencia del botón "download-receipt" antes de añadir el event listener
    const downloadReceiptBtn = document.getElementById('download-receipt');
    if (downloadReceiptBtn) {
        downloadReceiptBtn.addEventListener('click', function() {
            const paymentId = window.paymentId;
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
                    a.download = 'comprobante.pdf'; // Cambia el nombre del archivo si es necesario
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
});