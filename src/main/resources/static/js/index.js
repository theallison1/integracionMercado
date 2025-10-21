// ========== SOLUCIÓN ESPECÍFICA PARA EL STATUS SCREEN ==========

// 3. FUNCIÓN COMPLETAMENTE REESCRITA PARA STATUS SCREEN
async function renderStatusScreenBrick(result) {
    console.log('=== 📱 RENDERIZANDO STATUS SCREEN ===');
    paymentId = result.id;
    
    // ✅ 1. PRIMERO FORZAR QUE LA SECCIÓN SEA VISIBLE
    const resultSection = document.querySelector('.container__result').closest('section');
    resultSection.style.display = 'block';
    resultSection.style.opacity = '1';
    resultSection.style.visibility = 'visible';
    
    // ✅ 2. ESPERAR UN FRAME PARA QUE EL DOM SE ACTUALICE
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const container = document.getElementById('statusScreenBrick_container');
    
    // ✅ 3. LIMPIAR COMPLETAMENTE EL CONTENEDOR
    container.innerHTML = '';
    container.style.cssText = `
        width: 100% !important;
        min-height: 500px !important;
        background: var(--card-bg) !important;
        border-radius: 10px !important;
        padding: 20px !important;
        margin: 20px 0 !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        border: 1px solid #444 !important;
    `;

    console.log('✅ Contenedor preparado con estilos forzados');

    try {
        const bricksBuilder = await mp.bricks();
        console.log('🔧 Creando Status Screen Brick...');
        
        // ✅ 4. CREAR EL STATUS SCREEN CON MÁS CONFIGURACIÓN
        window.statusScreenBrickController = await bricksBuilder.create(
            'statusScreen', 
            'statusScreenBrick_container', 
            {
                initialization: {
                    paymentId: paymentId
                },
                customization: {
                    visual: {
                        style: {
                            theme: 'dark',
                            customVariables: {
                                formBackgroundColor: '#2d2d2d',
                                baseColor: 'aquamarine'
                            }
                        }
                    }
                },
                callbacks: {
                    onReady: () => {
                        console.log('✅ Status Screen listo y visible');
                        // ✅ FORZAR ACTUALIZACIÓN VISUAL
                        container.style.display = 'block';
                        container.style.visibility = 'visible';
                        
                        // ✅ VERIFICAR SI REALMENTE SE VE
                        setTimeout(() => {
                            const hasContent = container.children.length > 0;
                            const hasIframe = container.querySelector('iframe');
                            console.log('🔍 Verificando renderizado:', {
                                hasChildren: hasContent,
                                hasIframe: !!hasIframe,
                                containerHTML: container.innerHTML.length
                            });
                            
                            if (!hasContent || !hasIframe) {
                                console.log('⚠️ Status Screen no se renderizó visualmente');
                                showFallbackResult(result);
                            }
                        }, 1000);
                    },
                    onError: (error) => {
                        console.error('❌ Error en Status Screen:', error);
                        showFallbackResult(result);
                    }
                }
            }
        );
        
        console.log('✅ Status Screen Brick creado exitosamente');
        
        // ✅ 5. FALLBACK AUTOMÁTICO SI NO SE RENDERIZA EN 2 SEGUNDOS
        setTimeout(() => {
            const hasVisibleContent = container.children.length > 0 && 
                                    container.offsetHeight > 100;
            if (!hasVisibleContent) {
                console.log('⏰ Timeout: Status Screen no se mostró, usando fallback');
                showFallbackResult(result);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error creando Status Screen:', error);
        showFallbackResult(result);
    }
}

// 6. FALLBACK MEJORADO - ESTE SÍ SE VA A VER
function showFallbackResult(result) {
    console.log('🔄 Mostrando fallback para resultado de pago...');
    
    const container = document.getElementById('statusScreenBrick_container');
    const amount = document.getElementById('summary-total')?.textContent || '0';
    
    // ✅ ESTILOS MUY EXPLÍCITOS PARA GARANTIZAR VISIBILIDAD
    container.style.cssText = `
        width: 100% !important;
        min-height: 400px !important;
        background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%) !important;
        border-radius: 15px !important;
        padding: 40px 30px !important;
        margin: 20px 0 !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        border: 2px solid #28a745 !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
    `;
    
    container.innerHTML = `
        <div style="text-align: center; color: white;">
            <!-- ICONO GRANDE -->
            <div style="font-size: 100px; color: #28a745; margin-bottom: 20px;">
                ✅
            </div>
            
            <!-- TÍTULO -->
            <h1 style="color: #28a745; font-size: 2.5rem; margin-bottom: 30px; font-weight: bold;">
                ¡PAGO EXITOSO!
            </h1>
            
            <!-- TARJETA DE INFORMACIÓN -->
            <div style="
                background: rgba(40, 167, 69, 0.1);
                border: 2px solid #28a745;
                border-radius: 10px;
                padding: 25px;
                margin: 25px 0;
                text-align: left;
            ">
                <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                    <div>
                        <strong>📋 ID de Transacción:</strong>
                        <div style="color: #aquamarine; font-family: monospace; font-size: 1.1rem;">
                            ${result.id}
                        </div>
                    </div>
                    
                    <div>
                        <strong>📊 Estado:</strong>
                        <div>
                            <span style="
                                background: #28a745;
                                color: white;
                                padding: 8px 16px;
                                border-radius: 20px;
                                font-weight: bold;
                                font-size: 1rem;
                            ">
                                ${result.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <strong>💰 Monto Total:</strong>
                        <div style="color: #aquamarine; font-size: 1.3rem; font-weight: bold;">
                            $${amount}
                        </div>
                    </div>
                    
                    <div>
                        <strong>🔍 Detalle:</strong>
                        <div style="color: #b0b0b0;">
                            ${result.statusDetail || 'Pago acreditado exitosamente'}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- MENSAJE DE AGRADECIMIENTO -->
            <div style="margin: 30px 0;">
                <p style="font-size: 1.3rem; margin-bottom: 10px;">
                    🎉 ¡Gracias por tu compra en Millenium Termotanques!
                </p>
                <p style="color: #b0b0b0; font-size: 1rem;">
                    Tu pedido ha sido procesado exitosamente. Recibirás un correo de confirmación shortly.
                </p>
            </div>
            
            <!-- BOTONES DE ACCIÓN -->
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 40px;">
                <button 
                    class="btn btn-primary btn-lg" 
                    onclick="volverAlCarrito()"
                    style="
                        padding: 12px 30px;
                        font-size: 1.1rem;
                        border-radius: 25px;
                        min-width: 200px;
                    "
                >
                    🛒 Continuar Comprando
                </button>
                
                <button 
                    class="btn btn-outline-light btn-lg" 
                    onclick="downloadReceipt()"
                    style="
                        padding: 12px 30px;
                        font-size: 1.1rem;
                        border-radius: 25px;
                        min-width: 200px;
                    "
                >
                    📄 Descargar Comprobante
                </button>
            </div>
            
            <!-- INFORMACIÓN ADICIONAL -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #444;">
                <small style="color: #888;">
                    ¿Necesitas ayuda? Contacta a nuestro soporte: 
                    <a href="mailto:soporte@milleniumtermotanques.com" style="color: aquamarine;">
                        soporte@milleniumtermotanques.com
                    </a>
                </small>
            </div>
        </div>
    `;
    
    console.log('✅ Fallback renderizado con estilos garantizados');
}

// 5. FUNCIÓN PARA MOSTRAR RESULTADO - MÁS ROBUSTA
function showPaymentResult(result) {
    console.log('=== 🎯 MOSTRANDO RESULTADO ===');
    
    // ✅ OCULTAR PAGO CON TRANSICIÓN
    document.querySelector('.payment-form').style.display = 'none';
    
    // ✅ MOSTRAR RESULTADO CON ESTILOS FORZADOS
    const resultSection = document.querySelector('.container__result').closest('section');
    resultSection.style.cssText = `
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        position: relative !important;
        z-index: 1000 !important;
    `;
    
    // ✅ SCROLLEAR A LA SECCIÓN DE RESULTADOS
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log('🎯 Sección de resultados forzada a ser visible');
    
    // ✅ RENDERIZAR STATUS SCREEN
    renderStatusScreenBrick(result);
}
