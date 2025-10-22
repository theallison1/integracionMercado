<!DOCTYPE html>
<html lang="es">
<head>
    <title>Termotanques Millenium</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
    <script src="https://sdk.mercadopago.com/js/v2"></script>
    <style>
        :root {
            --primary-color: #d4af37;
            --secondary-color: #c1272d;
            --dark-bg: #1a1a1a;
            --card-bg: #2d2d2d;
            --text-light: #ffffff;
            --text-muted: #b0b0b0;
        }
        
        body {
            background-color: var(--dark-bg);
            color: var(--text-light);
            font-family: 'Arial', sans-serif;
        }

        /* ESTILOS PARA LAS SECCIONES - CORREGIDOS */
        .container__cart,
        .container__payment, 
        .container__result {
            display: none;
            opacity: 0;
            transition: all 0.5s ease;
        }

        .container__cart.active,
        .container__payment.active,
        .container__result.active {
            display: block !important;
            opacity: 1 !important;
        }

        /* Asegurar que el contenedor del Status Screen sea visible */
        #statusScreenBrick_container {
            min-height: 400px;
            width: 100%;
            background: var(--card-bg);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .product-card {
            background: var(--card-bg);
            border: 1px solid #444;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
            border-color: var(--primary-color);
        }

        .product-image {
            max-height: 200px;
            object-fit: cover;
            border-radius: 8px;
            width: 100%;
            border: 2px solid #444;
        }

        .product-image:hover {
            border-color: var(--primary-color);
        }

        .quantity-control {
            max-width: 100px;
            background: #3a3a3a;
            border: 1px solid #555;
            color: var(--text-light);
            text-align: center;
        }

        .quantity-control:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 0.2rem rgba(212, 175, 55, 0.25);
        }

        .btn-outline-primary {
            border-color: var(--primary-color);
            color: var(--primary-color);
        }

        .btn-outline-primary:hover {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
            color: var(--dark-bg);
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary-color), #e6c158);
            border: none;
            color: var(--dark-bg);
            font-weight: bold;
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, #e6c158, var(--primary-color));
            transform: translateY(-2px);
        }

        .event-theme {
            background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
            color: white;
            padding: 8px 15px;
            border-radius: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .summary {
            background: var(--card-bg);
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #444;
        }

        .block-heading h2 {
            color: var(--primary-color);
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .block-heading p {
            color: var(--text-muted);
        }

        .badge-info {
            background-color: var(--primary-color);
            color: var(--dark-bg);
        }

        .text-primary {
            color: var(--primary-color) !important;
        }

        .border-bottom {
            border-bottom: 1px solid #444 !important;
        }

        .form-control {
            background-color: #3a3a3a;
            border: 1px solid #555;
            color: var(--text-light);
        }

        .form-control:focus {
            background-color: #444;
            border-color: var(--primary-color);
            color: var(--text-light);
            box-shadow: 0 0 0 0.2rem rgba(212, 175, 55, 0.25);
        }

        /* Estilos para el carrito */
        .cart-item {
            background: rgba(255,255,255,0.05);
            border-radius: 5px;
            margin-bottom: 10px;
        }

        /* Scroll personalizado */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #2d2d2d;
        }

        ::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #e6c158;
        }

        /* Efectos de texto */
        h2, h3, h4, h5, h6 {
            color: var(--primary-color);
        }

        .price {
            color: var(--primary-color);
            font-weight: bold;
        }

        .unit-price {
            color: var(--primary-color);
            font-size: 1.2em;
            font-weight: bold;
        }

        /* Feedback animations */
        .feedback-message {
            transition: all 0.3s ease;
        }
    </style>
</head>
<body>
<input id="mercado-pago-public-key" value="TEST-d3652cb4-2ab1-46e8-bbf4-a352936b2125" type="hidden" />
<main>
    <!-- Shopping Cart -->
    <section class="shopping-cart dark">
        <div class="container container__cart active">
            <div class="block-heading text-center">
                <h2><span class="event-theme">milleniumtermotanques</span></h2>
                <p>Calidad en Termotanques - Productos Disponibles</p>
            </div>
            <div class="content">
                <div class="row">
                    <div class="col-md-12 col-lg-8">
                        <div class="items" id="products-container">
                            <!-- Los productos se cargan dinámicamente aquí -->
                        </div>
                    </div>
                    <div class="col-md-12 col-lg-4">
                        <div class="summary">
                            <h3 class="text-center mb-4">🛒 Tu Carrito</h3>
                            <div id="cart-items">
                                <!-- Ítems del carrito se cargan aquí -->
                            </div>
                            <div class="summary-item mt-3 pt-3 border-top">
                                <span class="text">Subtotal</span>
                                <span class="price" id="cart-total">$0</span>
                            </div>
                            <button class="btn btn-primary btn-lg btn-block mt-4" id="checkout-btn" disabled>
                                💳 Ir a Pagar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Sección de pago -->
    <section class="payment-form dark">
        <div class="container container__payment">
            <div class="block-heading text-center">
                <h2>Medios de Pago</h2>
                <p>MILLENIUM TERMOTANQUES</p>
            </div>
            <div class="form-payment">
                <div class="products">
                    <h2 class="title">Resumen</h2>
                    <div id="summary-items">
                        <!-- Resumen de productos para pago -->
                    </div>
                    <div class="total">Total<span class="price" id="summary-total">$0</span></div>
                    <input type="hidden" id="amount" />
                    <input type="hidden" id="description" />
                </div>
                <div id="mercadopago-bricks-contaner__PaymentCard"></div>
                <a id="go-back" class="btn btn-outline-primary mt-3">
                    ← Volver al catálogo
                </a>
            </div>
        </div>
    </section>

    <!-- Sección de resultado -->
    <section class="shopping-cart dark">
        <div class="container container__result">
            <div class="block-heading text-center">
                <h2>Resultado del Pago</h2>
                <p>Millenium Termotanques - Compra</p>
            </div>
            <div class="content">
                <div class="row">
                    <div class="col-md-12 col-lg-12">
                        <div class="items product info product-details">
                            <div class="row justify-content-md-center">
                                <div class="col-md-6 product-detail">
                                    <div id="statusScreenBrick_container"></div>
                                    <button id="download-receipt" class="btn btn-primary btn-block mt-3">Descargar Comprobante</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script>
// Catálogo de termotanques Millenium
const products = [
    {
        id: 1,
        name: "Termotanque SMART AI",
        description: "Termotanque inteligente con tecnología SMART AI. Máxima eficiencia energética y control digital avanzado.",
        price: 85000,
        image: "img/smart-1_orig.jpg.jpeg",
        category: "SMART",
        features: ["Tecnología SMART AI", "Control digital", "Eficiencia energética", "Garantía 5 años"],
        stock: 15
    },
    {
        id: 2,
        name: "Termotanque Eléctrico Premium",
        description: "Termotanque eléctrico de alto rendimiento. Ideal para hogares con consumo moderado de agua caliente.",
        price: 45000,
        image: "img/captura-de-pantalla-2023-01-12-a-la-s-15-24-56_orig.png",
        category: "Eléctrico",
        features: ["Alto rendimiento", "Bajo consumo", "Fácil instalación", "Garantía 3 años"],
        stock: 25
    }
];

// Carrito de compras
let cart = [];

// Función para renderizar productos
function renderProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    products.forEach(product => {
        const productElement = `
            <div class="product-card">
                <div class="product">
                    <div class="info">
                        <div class="product-details">
                            <div class="row align-items-center">
                                <div class="col-md-3">
                                    <img class="img-fluid mx-auto d-block image product-image" 
                                         src="${product.image}" 
                                         alt="${product.name}"
                                         onerror="this.src='https://via.placeholder.com/200x150/2d2d2d/ffffff?text=Producto'">
                                </div>
                                <div class="col-md-5 product-detail">
                                    <h5 class="text-primary">${product.name}</h5>
                                    <div class="product-info">
                                        <p class="mb-2">${product.description}</p>
                                        <p class="mb-1"><b>Categoría:</b> <span class="badge badge-info">${product.category}</span></p>
                                        <p class="mb-1"><b>Disponibles:</b> ${product.stock} unidades</p>
                                        <p class="mb-2"><b>Precio:</b> $<span class="unit-price">${product.price.toLocaleString()}</span></p>
                                        <small class="text-muted">
                                            <b>Características:</b> ${product.features.join(', ')}
                                        </small>
                                    </div>
                                </div>
                                <div class="col-md-4 product-detail text-center">
                                    <label for="quantity-${product.id}"><h6>Cantidad</h6></label>
                                    <input type="number" 
                                           id="quantity-${product.id}" 
                                           value="0" 
                                           min="0" 
                                           max="${product.stock}"
                                           class="form-control quantity-control mx-auto mb-2"
                                           onchange="updateCart(${product.id}, this.value)">
                                    <button class="btn btn-outline-primary btn-sm" 
                                            onclick="addToCart(${product.id})">
                                        🛒 Agregar al Carrito
                                    </button>
                                    <div class="mt-2">
                                        <small class="text-success feedback-message" id="feedback-${product.id}"></small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += productElement;
    });
}

// Funciones del carrito
function addToCart(productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityInput.value);
    const feedback = document.getElementById(`feedback-${productId}`);
    
    if (quantity > 0) {
        updateCart(productId, quantity);
        feedback.textContent = "✓ Agregado al carrito";
        feedback.style.color = "#28a745";
        setTimeout(() => feedback.textContent = "", 2000);
    } else {
        feedback.textContent = "Selecciona una cantidad";
        feedback.style.color = "#dc3545";
        setTimeout(() => feedback.textContent = "", 2000);
    }
}

function updateCart(productId, quantity) {
    const quantityNum = parseInt(quantity);
    const product = products.find(p => p.id === productId);
    
    if (quantityNum === 0) {
        cart = cart.filter(item => item.id !== productId);
    } else {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity = quantityNum;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantityNum,
                image: product.image
            });
        }
    }
    
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted text-center">Tu carrito está vacío</p>';
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '💳 Ir a Pagar';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItemElement = `
                <div class="cart-item p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="font-weight-bold">${item.name}</small><br>
                            <small class="text-muted">${item.quantity} x $${item.price.toLocaleString()}</small>
                        </div>
                        <span class="font-weight-bold price">$${itemTotal.toLocaleString()}</span>
                    </div>
                </div>
            `;
            cartItemsContainer.innerHTML += cartItemElement;
        });
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = `💳 Pagar $${total.toLocaleString()}`;
    }
    
    document.getElementById('cart-total').textContent = `$${total.toLocaleString()}`;
}

// ========== MERCADO PAGO INTEGRATION ==========
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
    
    // Ocultar todas las secciones
    $('.container__payment, .container__result').removeClass('active').fadeOut(500);
    
    setTimeout(() => {
        // Mostrar solo el carrito
        $('.container__cart').addClass('active').fadeIn(500);
        console.log('✅ Carrito visible - Clase active aplicada');
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

                const paymentUrl = 'https://integracionmercado.onrender.com/process_payment';
                
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
                    
                    const responseText = await response.text();
                    console.log('📝 Response Text (RAW):', responseText);
                    
                    if (!response.ok) {
                        console.error('❌ Error HTTP:', response.status, responseText);
                        volverAlCarrito();
                        return null;
                    }
                    
                    try {
                        const result = JSON.parse(responseText);
                        console.log('✅ Respuesta JSON parseada correctamente:', result);
                        return result;
                    } catch (jsonError) {
                        console.error('❌ Error parseando JSON:', jsonError);
                        volverAlCarrito();
                        return null;
                    }
                })
                .then(result => {
                    console.log('=== 🔄 PROCESANDO RESULTADO ===');
                    console.log('📦 Result completo:', result);
                    
                    if (!result) {
                        console.error('❌ Result es null o undefined');
                        volverAlCarrito();
                        return;
                    }

                    console.log('🔍 ID del pago:', result.id);
                    console.log('🔍 Estado del pago:', result.status);
                    
                    if (result.status === 'approved' || result.status === 'pending') {
                        console.log('🎉 Pago exitoso/pendiente');
                        
                        // 1. Ocultar formulario de pago
                        $('.container__payment').removeClass('active').fadeOut(500);
                        
                        // 2. Renderizar Status Screen
                        renderStatusScreenBrick(bricksBuilder, result);
                        
                        // 3. Mostrar resultado después de un delay
                        setTimeout(() => {
                            console.log('🖥️ Mostrando pantalla de resultado...');
                            $('.container__result').addClass('active').fadeIn(500);
                            console.log('✅ Pantalla de resultado debería estar visible ahora');
                        }, 1000);
                        
                    } else {
                        console.log('❌ Pago rechazado - Estado:', result.status);
                        volverAlCarrito();
                    }
                })
                .catch((error) => {
                    console.error('=== 💥 ERROR EN FETCH ===', error);
                    volverAlCarrito();
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
    
    $('.container__cart').removeClass('active').fadeOut(500);
    setTimeout(() => {
        console.log('💳 Cargando formulario de pago...');
        loadPaymentForm();
        $('.container__payment').addClass('active').fadeIn(500);
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
                a.download = 'comprobante-millenium.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                console.log('✅ Comprobante descargado exitosamente');
            })
            .catch(error => {
                console.error('❌ Error downloading receipt:', error);
                alert('Error al descargar el comprobante');
            });
    });
} else {
    console.error('❌ Elemento "download-re
