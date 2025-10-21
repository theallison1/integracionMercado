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
    $('.container__payment').fadeOut(500);
    $('.container__result').fadeOut(500);
    setTimeout(() => {
        $('.container__cart').show(500).fadeIn();
        console.log('✅ Carrito visible');
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

                // ✅ RETORNAR PROMESA como el ejemplo de Mercado Pago
                return new Promise((resolve, reject) => {
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
                            reject(new Error(`HTTP ${response.status}: ${responseText}`));
                            return;
                        }
                        
                        try {
                            const result = JSON.parse(responseText);
                            console.log('✅ Respuesta JSON:', result);
                            
                            // ✅ PROCESAR RESULTADO Y LUEGO RESOLVER
                            if (result.status === 'approved' || result.status === 'pending') {
                                console.log('🎉 Pago exitoso - Renderizando...');
                                
                                // 1. Ocultar formulario
                                $('.container__payment').fadeOut(500);
                                
                                // 2. Renderizar Status Screen
                                renderStatusScreenBrick(bricksBuilder, result);
                                
                                // 3. Mostrar resultado
                                setTimeout(() => {
                                    $('.container__result').show(500).fadeIn();
                                    console.log('✅ Pantalla de resultado visible');
                                }, 1000);
                                
                                // ✅ RESOLVER LA PROMESA
                                resolve();
                                
                            } else {
                                console.log('❌ Pago rechazado');
                                reject(new Error(`Pago rechazado: ${result.status}`));
                            }
                            
                        } catch (jsonError) {
                            console.error('❌ Error parseando JSON:', jsonError);
                            reject(jsonError);
                        }
                    })
                    .catch((error) => {
                        console.error('=== 💥 ERROR EN FETCH ===', error);
                        reject(error);
                    });
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
    
    $('.container__cart').fadeOut(500);
    setTimeout(() => {
        console.log('💳 Cargando formulario de pago...');
        loadPaymentForm();
        $('.container__payment').show(500).fadeIn();
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
    console.error('❌ Elemento "download-receipt" no encontrado');
}

// ========== SISTEMA DE CARRITO ==========
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

function updatePaymentSummary() {
    const summaryContainer = document.getElementById('summary-items');
    let total = 0;
    
    summaryContainer.innerHTML = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        summaryContainer.innerHTML += `
            <div class="item mb-3 p-2 border-bottom">
                <span class="price">$${itemTotal.toLocaleString()}</span>
                <p class="item-name mb-1">${item.name}</p>
                <small class="text-muted">Cantidad: ${item.quantity}</small>
            </div>
        `;
    });
    
    document.getElementById('summary-total').textContent = `$${total.toLocaleString()}`;
    document.getElementById('amount').value = total;
    document.getElementById('description').value = `Termotanques Millenium - ${cart.length} producto(s)`;
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    updateCartDisplay();
    
    // Navegación entre secciones
    document.getElementById('checkout-btn').addEventListener('click', function() {
        if (cart.length > 0) {
            document.querySelector('.shopping-cart').style.display = 'none';
            document.querySelector('.payment-form').style.display = 'block';
            updatePaymentSummary();
        }
    });
    
    document.getElementById('go-back').addEventListener('click', function() {
        document.querySelector('.payment-form').style.display = 'none';
        document.querySelector('.shopping-cart').style.display = 'block';
    });
});

// Log inicial
console.log('=== 🚀 SISTEMA INICIALIZADO ===');
console.log('🔑 Public Key:', mercadoPagoPublicKey);
console.log('🌐 Entorno:', mercadoPagoPublicKey.startsWith('TEST-') ? 'PRUEBAS' : 'PRODUCCIÓN');
