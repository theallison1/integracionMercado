const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago('TEST-2faa9e28-88fe-426b-a97c-24c2234205ae');
let cardPaymentBrickController;
const bricksBuilder = mercadopago.bricks();
const renderStatusScreenBrick = async (bricksBuilder, result) => {


    var message = "";
    message = result.id;

    window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
        initialization: {
            paymentId: message
        },
        callbacks: {
            onReady: () => {
                // handle form ready
            },
            onError: (error) => {
                // handle error
            }
        }
    });
};

function loadPaymentForm() {
    const productCost = document.getElementById('amount').value;
    const settings = {
        initialization: {
            amount: productCost,
        },
        callbacks: {
            onReady: () => {
                console.log('brick ready')
            },
            onError: (error) => {
                alert(JSON.stringify("errorlllllll"))
            },
            onSubmit: ({
                selectedPaymentMethod,
                formData
            }) => {

                alert("entra ala funcion");
                alert(JSON.stringify(formData));
                fetch('http://localhost:8080/process_payment', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(formData)
                    })
                    .then((response) => {
                        // recibir el resultado del pago
                        alert(JSON.stringify(response));
                        return response.json();
                    })
                    .then(result => {
                        if (!result.hasOwnProperty("error_message")) {
                            renderStatusScreenBrick(bricksBuilder, result);
                            alert("deberia renderisar");

                            $('.container__payment').fadeOut(500);
                            setTimeout(() => {
                                $('.container__result').show(500).fadeIn();
                            }, 500);

                        } else {
                            alert(JSON.stringify({
                                status: result.status,
                                message: result.error_message
                            }))
                        }
                    })
                    .catch((error) => {
                        // manejar la respuesta de error al intentar crear el pago
                        alert(JSON.stringify(error.status));

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
    }

    const bricks = mercadopago.bricks();
    cardPaymentBrickController = bricks.create('payment', 'mercadopago-bricks-contaner__PaymentCard', settings);


};




// Handle transitions
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
