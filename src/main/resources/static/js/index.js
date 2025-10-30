// ✅ CONFIGURACIÓN CORREGIDA - Enviar datos en formato compatible con Java
async function initializePaymentBrick(total, userEmail) {
    try {
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (!paymentContainer) {
            console.error('❌ Contenedor paymentBrick_container no encontrado');
            return;
        }

        console.log('💳 Inicializando Payment Brick corregido');

        const settings = {
            initialization: {
                amount: total,
                payer: {
                    email: userEmail,
                    firstName: customerData.firstName || "",
                    lastName: customerData.lastName || "",
                }
            },
            callbacks: {
                onReady: () => {
                    console.log('✅ Payment Brick ready');
                    showTemporaryMessage('Formulario de pago listo', 'success');
                },
                onSubmit: ({ selectedPaymentMethod, formData }) => {
                    console.log('🔄 ========== ENVIANDO AL BACKEND JAVA ==========');
                    console.log('🔍 selectedPaymentMethod:', selectedPaymentMethod);
                    console.log('🔍 formData completo:', formData);
                    
                    // ✅ IMPLEMENTACIÓN CORREGIDA - Transformar datos para Java
                    return new Promise((resolve, reject) => {
                        // ✅ DETERMINAR EL ENDPOINT CORRECTO SEGÚN EL TIPO DE PAGO
                        let endpoint = '';
                        let requestData = {};
                        
                        if (selectedPaymentMethod === 'ticket') {
                            // ✅ PAGO EN EFECTIVO (Rapipago/Pago Fácil)
                            endpoint = '/process_payment/create_ticket_payment';
                            console.log('🎫 Enviando a endpoint de efectivo:', endpoint);
                            
                            // ✅ TRANSFORMAR DATOS PARA EL BACKEND JAVA - FORMATO CORRECTO
                            requestData = {
                                paymentMethodId: formData.payment_method_id, // ✅ paymentMethodId (no payment_method_id)
                                amount: parseFloat(formData.transactionAmount) || total, // ✅ amount (no transactionAmount)
                                payerEmail: formData.payer?.email || customerData.email,
                                payerFirstName: formData.payer?.firstName || customerData.firstName || "Cliente",
                                payerLastName: formData.payer?.lastName || customerData.lastName || "Millenium",
                                identificationType: customerData.dniType || "DNI",
                                identificationNumber: customerData.dniNumber || "00000000",
                                description: `Compra de ${cart.length} productos Millenium`
                            };
                            
                            console.log('📤 Datos transformados para efectivo:', requestData);
                        } else {
                            // ✅ PAGO CON TARJETA
                            endpoint = '/process_payment/process_bricks_payment';
                            console.log('💳 Enviando a endpoint de tarjeta:', endpoint);
                            
                            // ✅ TRANSFORMAR DATOS PARA TARJETA TAMBIÉN
                            requestData = {
                                token: formData.token,
                                paymentMethodId: formData.payment_method_id,
                                installments: parseInt(formData.installments) || 1,
                                issuerId: formData.issuer_id,
                                paymentType: formData.payment_type || 'credit_card',
                                amount: parseFloat(formData.transactionAmount) || total,
                                brickType: 'payment',
                                description: `Compra de ${cart.length} productos Millenium`,
                                payer: {
                                    email: formData.payer?.email || customerData.email,
                                    firstName: formData.payer?.firstName || customerData.firstName || "Cliente",
                                    lastName: formData.payer?.lastName || customerData.lastName || "Millenium"
                                }
                            };
                        }

                        // ✅ VALIDACIÓN FINAL DE DATOS CRÍTICOS
                        if (!requestData.amount || requestData.amount <= 0) {
                            console.warn('⚠️ Monto inválido, usando total del carrito');
                            requestData.amount = calculateCartTotal();
                        }
                        
                        if (!requestData.payerEmail && selectedPaymentMethod === 'ticket') {
                            requestData.payerEmail = customerData.email || "cliente@millenium.com";
                        }

                        console.log('🎯 Datos finales a enviar:', requestData);

                        // ✅ ENVIAR DATOS TRANSFORMADOS AL BACKEND JAVA
                        fetch(endpoint, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(requestData),
                        })
                        .then((response) => {
                            if (!response.ok) {
                                return response.text().then(errorText => {
                                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                                });
                            }
                            return response.json();
                        })
                        .then((response) => {
                            console.log('✅ Respuesta del backend Java:', response);
                            
                            // ✅ MANEJAR RESPUESTA EXITOSA
                            if (response.id) {
                                paymentId = response.id;
                                
                                if (selectedPaymentMethod === 'ticket') {
                                    // ✅ MOSTRAR STATUS SCREEN PARA PAGOS EN EFECTIVO
                                    showCashPaymentStatus(response);
                                } else {
                                    // ✅ MOSTRAR STATUS SCREEN PARA TARJETAS
                                    renderStatusScreenBrick(bricksBuilder, response);
                                }
                                
                                $('.container__payment').fadeOut(500, () => {
                                    $('.container__result').fadeIn(500);
                                });
                            } else {
                                throw new Error('No se recibió ID de pago del servidor');
                            }
                            
                            resolve();
                        })
                        .catch((error) => {
                            console.error('❌ Error en el pago:', error);
                            showTemporaryMessage(`Error: ${error.message}`, 'error');
                            reject();
                        });
                    });
                },
                onError: (error) => {
                    console.error('❌ Payment Brick error:', error);
                    showTemporaryMessage(`Error en formulario: ${error.message}`, 'error');
                }
            },
            customization: {
                paymentMethods: {
                    creditCard: "all",
                    debitCard: "all",
                    ticket: "all",
                    bankTransfer: "all", 
                    onboarding_credits: "all",
                    wallet_purchase: "all",
                    maxInstallments: 1
                },
                visual: {
                    style: {
                        theme: 'dark',
                        customVariables: {
                            formBackgroundColor: '#1d2431',
                            baseColor: 'aquamarine', 
                            outlinePrimaryColor: 'aquamarine',
                            buttonTextColor: '#1d2431'
                        }
                    }
                }
            }
        };

        window.paymentBrickController = await bricksBuilder.create(
            "payment",
            "paymentBrick_container", 
            settings
        );
        
        console.log('✅ Payment Brick creado exitosamente');
        
    } catch (error) {
        console.error('❌ Error creando Payment Brick:', error);
        showTemporaryMessage('Error al cargar formulario de pago', 'error');
    }
}

// ✅ FUNCIÓN MEJORADA: Mostrar estado de pago en efectivo
function showCashPaymentStatus(paymentResult) {
    console.log('🎫 Mostrando estado de pago en efectivo:', paymentResult);
    
    document.querySelector('.container__payment').style.display = 'none';
    document.querySelector('.container__result').style.display = 'block';
    
    const resultContainer = document.querySelector('.container__result');
    
    // ✅ OBTENER INFORMACIÓN DEL PAGO
    const paymentMethod = paymentResult.payment_method_id || 'pagofacil';
    const paymentMethodName = paymentMethod === 'rapipago' ? 'Rapipago' : 'Pago Fácil';
    const externalUrl = paymentResult.transaction_details?.external_resource_url;
    const paymentCode = paymentResult.transaction_details?.payment_method_reference_id || paymentResult.id;
    
    resultContainer.innerHTML = `
        <div class="success-animation">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
        </div>
        
        <h2 class="success-title">¡Pago en Efectivo Creado Exitosamente!</h2>
        
        <div class="payment-details">
            <div class="detail-item">
                <span class="detail-label">Método de Pago:</span>
                <span class="detail-value">${paymentMethodName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Monto:</span>
                <span class="detail-value">$${paymentResult.transaction_amount?.toLocaleString('es-AR') || calculateCartTotal().toLocaleString('es-AR')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Código de Pago:</span>
                <span class="detail-value">${paymentCode}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Estado:</span>
                <span class="detail-value status-pending">Pendiente de Pago</span>
            </div>
        </div>
        
        <div class="voucher-info">
            <h4>📋 Instrucciones para pagar:</h4>
            <p>Acércate a cualquier sucursal de <strong>${paymentMethodName}</strong> y presenta este código:</p>
            <div class="voucher-code">
                <strong>${paymentCode}</strong>
            </div>
            
            ${externalUrl ? `
            <div style="margin-top: 15px;">
                <a href="${externalUrl}" target="_blank" class="btn btn-primary" style="display: inline-block; margin: 10px 0;">
                    📄 Ver Voucher Completo
                </a>
            </div>
            ` : ''}
            
            <p class="expiration-info">⏰ Tienes 3 días hábiles para realizar el pago</p>
        </div>
        
        <!-- ✅ STATUS SCREEN BRICK PARA MOSTRAR CÓDIGO DE BARRAS -->
        <div id="statusScreenBrick_container" style="margin: 20px 0;"></div>
        
        <div class="action-buttons">
            <button id="back-to-store" class="btn btn-secondary">
                🏪 Volver a la Tienda
            </button>
        </div>
    `;
    
    // ✅ INICIALIZAR STATUS SCREEN BRICK PARA MOSTRAR CÓDIGO DE BARRAS
    if (paymentResult.id) {
        renderStatusScreenBrick(bricksBuilder, paymentResult);
    }
    
    document.getElementById('back-to-store').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
}
