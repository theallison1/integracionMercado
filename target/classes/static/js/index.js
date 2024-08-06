document.addEventListener('DOMContentLoaded', function() {
    const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
    if (!mercadoPagoPublicKey) {
        console.error('Mercado Pago public key not found');
        return;
    }

    const mercadopago = new MercadoPago(mercadoPagoPublicKey, {
        locale: 'es-AR' // Establece el idioma para el SDK
    });

    let cardPaymentBrickController;
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
        const productCost = document.getElementById('amount').value;
        const settings = {
            initialization: {
                amount: productCost,
            },
            callbacks: {
                onReady: () => {
                    console.log('Payment Brick ready');
                },
                onError: (error) => {
                    console.error('Error initializing payment brick:', error);
                },
                onSubmit: async ({ selectedPaymentMethod, formData }) => {
                    try {
                        const response = await fetch('http://localhost:8080/process_payment', {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(formData)
                        });

                        const result = await response.json();

                        if (!result.hasOwnProperty("error_message")) {
                            await renderStatusScreenBrick(bricksBuilder, result);
                            $('.container__payment').fadeOut(500);
                            setTimeout(() => {
                                $('.container__result').show(500).fadeIn();
                            }, 500);
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

    document.getElementById('checkout-btn').addEventListener('click', function() {
        $('.container__cart').fadeOut(500);
        setTimeout(() => {
            loadPaymentForm();
            $('.container__payment').show(500).fadeIn();
        }, 500);
    });

    document.getElementById('go-back').addEventListener('click', function() {
        $('.container__payment').fadeOut(500);
        setTimeout(() => {
            $('.container__cart').show(500).fadeIn();
        }, 500);
    });

    function updatePrice() {
        let quantity = document.getElementById('quantity').value;
        let unitPrice = document.getElementById('unit-price').innerText;
        let amount = parseInt(unitPrice) * parseInt(quantity);

        document.getElementById('cart-total').innerText = '$ ' + amount;
        document.getElementById('summary-price').innerText = '$ ' + unitPrice;
        document.getElementById('summary-quantity').innerText = quantity;
        document.getElementById('summary-total').innerText = '$ ' + amount;
        document.getElementById('amount').value = amount;
    }

    document.getElementById('quantity').addEventListener('change', updatePrice);
    updatePrice();

    document.getElementById('download-receipt').addEventListener('click', function() {
        const paymentId = window.paymentId;
        if (!paymentId) {
            console.error('Payment ID not found');
            return;
        }

        const url = `http://localhost:8080//process_payment/download_receipt/${paymentId}`;
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
});
