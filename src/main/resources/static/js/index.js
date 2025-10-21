// ========== MERCADO PAGO INTEGRATION ==========
const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;

// 1. INICIALIZACIÓN CORRECTA
const mp = new MercadoPago(mercadoPagoPublicKey, {
    locale: 'es-AR'
});

let paymentBrickController;
let paymentId;

// 2. FUNCIÓN PRINCIPAL CORREGIDA - COMPATIBLE CON TU DTO SPRING
const renderPaymentBrick = async (bricksBuilder) => {
    console.log('🔧 Iniciando renderizado de Payment Brick...');
    
    const settings = {
        initialization: {
            amount: parseFloat(document.getElementById('amount').value),
            payer: {
                email: "cliente@millenium.com",
            },
        },
        customization: {
            visual: {
                style: {
                    theme: "dark",
                    customVariables: {
                        formBackgroundColor: '#1d2431',
                        baseColor: 'aquamarine'
                    }
                },
            },
            paymentMethods: {
                creditCard: "all",
                debitCard: "all",
                ticket: "all",
                maxInstallments: 12
            },
        },
        callbacks: {
            onReady: () => {
                console.log('✅ Payment Brick listo y visible');
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                console.log('=== 🚀 INICIANDO ENVÍO DE PAGO ===');
                console.log('📋 Datos del Brick:', formData);

                // ✅ ENVIAR DATOS EN EL FORMATO EXACTO DE TU DTO SPRING
                return new Promise((resolve, reject) => {
                    
                    // PREPARAR DATOS EXACTAMENTE COMO TU CardPaymentDTO ESPERA
                    const paymentData = {
                        token: formData.token,
                        issuer_id: formData.issuer_id || null,
                        payment_method_id: formData.payment_method_id,
                        transaction_amount: parseFloat(formData.transaction_amount),
                        installments: parseInt(formData.installments),
                        product_description: document.getElementById('description').value,
                        payer: {
                            email: formData.payer.email,
                            first_name: formData.payer.first_name || "Cliente",
                            last_name: formData.payer.last_name || "Millenium",
                            identification: {
                                type: formData.payer.identification.type,
                                number: formData.payer.identification.number
                            }
                        }
                    };

                    console.log('📤 Enviando a backend Spring:', JSON.stringify(paymentData, null, 2));

                    fetch("https://integracionmercado.onrender.com/process_payment", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(paymentData),
                    })
                    .then(async (response) => {
                        console.log('=== 📨 RESPUESTA HTTP RECIBIDA ===');
                        console.log('📊 Status:', response.status);
                        
                        const responseText = await response.text();
                        console.log('📝 Response Text (RAW):', responseText);

                        if (!response.ok) {
                            console.error('❌ Error HTTP del backend:', responseText);
                            throw new Error(`HTTP ${response.status}: ${responseText}`);
                        }

                        try {
                            const result = JSON.parse(responseText);
                            console.log('✅ Respuesta JSON del backend:', result);

                            if (result.status === 'approved' || result.status === 'pending' || result.status === 'in_process') {
                                console.log('🎉 Pago exitoso - Procediendo...');
                                
                                // ✅ RESOLVER PRIMERO
                                resolve();
                                
                                // ✅ LUEGO mostrar resultado
                                setTimeout(() => {
                                    showPaymentResult(result);
                                }, 100);
                                
                            } else {
                                console.log('❌ Pago rechazado:', result.status);
                                reject(new Error(`Pago rechazado: ${result.status}`));
                            }
                        } catch (jsonError) {
                            console.error('❌ Error parseando JSON del backend:', jsonError);
                            reject(jsonError);
                        }
                    })
                    .catch((error) => {
                        console.error('=== 💥 ERROR EN FETCH ===', error);
                        reject(error);
                    });
                });
            },
            onError: (error) => {
                console.error('❌ Error en Payment Brick:', error);
                alert('Error en el formulario de pago: ' + error.message);
            },
        },
    };

    try {
        window.paymentBrickController = await bricksBuilder.create(
            "payment",
            "mercadopago-bricks-contaner__PaymentCard",
            settings
        );
        console.log('✅ Payment Brick creado exitosamente');
        
    } catch (error) {
        console.error('❌ Error creando Payment Brick:', error);
        showBrickError();
    }
};

// 3. FUNCIÓN MEJORADA PARA STATUS SCREEN - VERSIÓN CORREGIDA
async function renderStatusScreenBrick(result) {
    console.log('=== 📱 RENDERIZANDO STATUS SCREEN ===');
    paymentId = result.id;
    
    const container = document.getElementById('statusScreenBrick_container');
    
    // ✅ 1. FORZAR QUE LA SECCIÓN SEA VISIBLE PRIMERO
    const resultSection = document.querySelector('.container__result').closest('section');
    resultSection.style.display = 'block';
    resultSection.style.opacity = '1';
    resultSection.style.visibility = 'visible';
    
    // ✅ 2. PREPARAR CONTENEDOR CON ESTILOS EXPLÍCITOS
    container.innerHTML = '<div class="text-center p-4">Cargando estado del pago...</div>';
    container.style.display = 'block';
    container.style.opacity = '1';
    container.style.visibility = 'visible';
    container.style.width = '100%';
    container.style.minHeight = '400px';
    container.style.background = 'transparent';
    
    console.log('✅ Contenedor preparado con estilos forzados');

    try {
        const bricksBuilder = await mp.bricks();
        
        console.log('🔧 Creando Status Screen Brick...');
        
        // ✅ 3. CREAR STATUS SCREEN CON CONFIGURACIÓN MEJORADA
        window.statusScreenBrickController = await bricksBuilder.create(
            'statusScreen', 
            'statusScreenBrick_container', 
            {
                initialization: {
                    paymentId: paymentId
                },
                callbacks: {
                    onReady: () => {
                        console.log('✅ Status Screen listo y visible');
                        // ✅ FORZAR REDIBUJADO
                        container.style.display = 'block';
                        setTimeout(() => {
                            container.style.opacity = '1';
                        }, 100);
                    },
                    onError: (error) => {
                        console.error('❌ Error en Status Screen:', error);
                        console.error('Detalles del error:', error);
                        showFallbackResult(result);
                    },
                    onRender: () => {
                        console.log('🎨 Status Screen renderizado en el DOM');
                    }
                }
            }
        );
        
        console.log('✅ Status Screen Brick creado exitosamente');
        
        // ✅ 4. FORZAR RENDERIZADO MANUALMENTE SI ES NECESARIO
        setTimeout(() => {
            if (container.innerHTML.includes('Cargando')) {
                console.log('⚠️ El Brick no se renderizó automáticamente, usando fallback');
                showFallbackResult(result);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error creando Status Screen:', error);
        showFallbackResult(result);
    }
}

// 4. FUNCIÓN PARA MOSTRAR ERROR DEL BRICK
function showBrickError() {
    const container = document.getElementById('mercadopago-bricks-contaner__PaymentCard');
    container.innerHTML = `
        <div class="alert alert-danger text-center">
            <h5>❌ Error al cargar el formulario de pago</h5>
            <p>No se pudo cargar el sistema de pagos.</p>
            <button class="btn btn-warning mt-2" onclick="volverAlCarrito()">
                ← Volver al Carrito
            </button>
        </div>
    `;
}

// 5. FUNCIÓN PARA MOSTRAR RESULTADO
function showPaymentResult(result) {
    console.log('=== 🎯 MOSTRANDO RESULTADO ===');
    console.log('Resultado del pago:', result);

    // Ocultar formulario de pago
    document.querySelector('.payment-form').style.display = 'none';
    
    // Mostrar sección de resultados
    const resultSection = document.querySelector('.container__result').closest('section');
    resultSection.style.display = 'block';
    resultSection.style.opacity = '1';
    
    // Renderizar Status Screen
    renderStatusScreenBrick(result);
}

// 6. FALLBACK MEJORADO
function showFallbackResult(result) {
    const container = document.getElementById('statusScreenBrick_container');
    const amount = document.getElementById('summary-total')?.textContent || '0';
    
    container.innerHTML = `
        <div class="alert alert-success text-center" style="background: var(--card-bg); border: 1px solid #28a745;">
            <div class="mb-3">
                <h2 style="color: #28a745; font-size: 48px;">✅</h2>
                <h4 class="text-success">¡Pago Exitoso!</h4>
            </div>
            
            <div class="bg-dark p-3 rounded mb-3 text-left">
                <p><strong>📋 ID de transacción:</strong> ${result.id}</p>
                <p><strong>📊 Estado:</strong> <span class="badge badge-success">${result.status}</span></p>
                <p><strong>💰 Monto:</strong> $${amount}</p>
                <p><strong>🔍 Detalle:</strong> ${result.statusDetail || 'accredited'}</p>
            </div>
            
            <p class="mb-3">🎉 ¡Gracias por tu compra en Millenium Termotanques!</p>
            
            <div class="mt-4">
                <button class="btn btn-primary btn-lg" onclick="volverAlCarrito()">
                    🛒 Continuar Comprando
                </button>
                <button class="btn btn-outline-secondary btn-lg ml-2" onclick="downloadReceipt()">
                    📄 Descargar Comprobante
                </button>
            </div>
        </div>
    `;
    
    console.log('✅ Fallback renderizado correctamente');
}

// 7. FUNCIÓN PARA CARGAR FORMULARIO DE PAGO
async function loadPaymentForm() {
    console.log('💰 Cargando formulario de pago...');
    
    const brickContainer = document.getElementById('mercadopago-bricks-contaner__PaymentCard');
    brickContainer.innerHTML = '<div class="text-center p-4">Cargando opciones de pago...</div>';

    try {
        const bricksBuilder = await mp.bricks();
        console.log('✅ Bricks Builder obtenido');
        
        await renderPaymentBrick(bricksBuilder);
        
    } catch (error) {
        console.error('❌ Error cargando formulario:', error);
        showBrickError();
    }
}

// 8. FUNCIÓN VOLVER AL CARRITO
function volverAlCarrito() {
    console.log('🔙 Volviendo al carrito...');
    
    document.querySelector('.payment-form').style.display = 'none';
    document.querySelector('.container__result').closest('section').style.display = 'none';
    document.querySelector('.container__cart').closest('section').style.display = 'block';
    
    // Resetear carrito si el pago fue exitoso
    if (paymentId) {
        cart = [];
        updateCartDisplay();
        document.querySelectorAll('.quantity-control').forEach(input => {
            input.value = 0;
        });
        paymentId = null;
    }
}

// 9. FUNCIÓN DESCARGAR COMPROBANTE
function downloadReceipt() {
    if (!paymentId) {
        alert('No hay un ID de pago disponible');
        return;
    }

    console.log('📄 Descargando comprobante para pago:', paymentId);
    
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
            a.download = `comprobante-millenium-${paymentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            console.log('✅ Comprobante descargado exitosamente');
        })
        .catch(error => {
            console.error('❌ Error downloading receipt:', error);
            alert('Error al descargar el comprobante: ' + error.message);
        });
}

// 10. EVENT LISTENERS
document.getElementById('checkout-btn').addEventListener('click', function() {
    console.log('🛒 Click en botón "Pagar"');
    
    if (cart.length > 0) {
        document.querySelector('.container__cart').closest('section').style.display = 'none';
        document.querySelector('.payment-form').style.display = 'block';
        updatePaymentSummary();
        loadPaymentForm();
    }
});

document.getElementById('go-back').addEventListener('click', function() {
    volverAlCarrito();
});

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
    
    console.log('=== 🚀 SISTEMA INICIALIZADO ===');
    console.log('🔑 Public Key:', mercadoPagoPublicKey);
    console.log('🌐 Entorno:', mercadoPagoPublicKey.startsWith('TEST-') ? 'PRUEBAS' : 'PRODUCCIÓN');
});
