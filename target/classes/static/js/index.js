const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;
const mercadopago = new MercadoPago('TEST-2faa9e28-88fe-426b-a97c-24c2234205ae');
let cardPaymentBrickController;

async function loadPaymentForm() {
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
                alert(JSON.stringify(error))
            },
            onSubmit: (cardFormData) => {
                alert(JSON.stringify(cardFormData));

                proccessPayment(cardFormData)
            }
        },
        locale: 'es-AR',
        customization: {
            paymentMethods: {
                maxInstallments: 5
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
    cardPaymentBrickController = await bricks.create('cardPayment', 'mercadopago-bricks-contaner__PaymentCard', settings);
     
};

const proccessPayment = (cardFormData) => {
                                       alert(JSON.stringify(cardFormData));

    fetch("http://localhost:8080/process_payment/holis", {
        method: "GET",
 body: JSON.stringify(cardFormData),
  headers: {"Content-type": "application/json; "}


    })
    .then(response => {
        return response.json();
    })
    .catch(error => {

        alert("Unexpected error\n"+JSON.stringify(error));
    });
}

// Handle transitions
document.getElementById('checkout-btn').addEventListener('click', function(){
    $('.container__cart').fadeOut(500);
    setTimeout(() => {
        loadPaymentForm();
        $('.container__payment').show(500).fadeIn();
    }, 500);
});

document.getElementById('go-back').addEventListener('click', function(){
    $('.container__payment').fadeOut(500);
    setTimeout(() => { $('.container__cart').show(500).fadeIn(); }, 500);
});

// Handle price update
function updatePrice(){
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