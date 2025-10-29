import { getBricksBuilder } from '../config/mercadoPagoConfig.js';
import { createMercadoPagoPreference } from '../services/paymentService.js';
import { calculateCartTotal, getCart } from './cartManager.js';
import { getCustomerData } from './customerForm.js';

let bricksInitialized = false;
let paymentId;

const bricksBuilder = getBricksBuilder();

export const getPaymentId = () => paymentId;
export const setPaymentId = (id) => { paymentId = id; };

export const resetBricksState = () => {
    bricksInitialized = false;
    console.log(' Estado de Bricks reseteado');
};

export const goToPayment = async () => {
    console.log(' Intentando ir a pagos...');
    
    if (bricksInitialized) {
        console.log('Bricks ya inicializados, solo mostrando sección');
        document.querySelector('.container__cart').style.display = 'none';
        document.querySelector('#customer-form-section').style.display = 'none';
        document.querySelector('.container__payment').style.display = 'block';
        return;
    }
    
    document.querySelector('.container__cart').style.display = 'none';
    document.querySelector('#customer-form-section').style.display = 'none';
    document.querySelector('.container__payment').style.display = 'block';
    
    await initializePaymentBricks();
};

export const initializePaymentBricks = async () => {
    if (bricksInitialized) {
        console.log('Bricks ya inicializados, omitiendo...');
        return;
    }
    
    bricksInitialized = true;
    
    const total = calculateCartTotal();
    const customerData = getCustomerData();
    const userEmail = customerData.email || "cliente@millenium.com";
    
    console.log(' Inicializando Bricks - Monto:', total, 'Email:', userEmail);

    try {
        const preferenceId = await createMercadoPagoPreference(total);
        
        if (preferenceId) {
            await initializeWalletBrickWithPreference(preferenceId);
        }
        
    } catch (error) {
        console.log('ℹ️ Wallet Brick no disponible');
    }

    await initializePaymentBrick(total, userEmail);
};

const initializeWalletBrickWithPreference = async (preferenceId) => {
    try {
        const walletContainer = document.getElementById('walletBrick_container');
        if (!walletContainer) return;

        console.log(' Inicializando Wallet Brick con preferencia:', preferenceId);

        window.walletBrickController = await bricksBuilder.create("wallet", "walletBrick_container", {
            initialization: {
                preferenceId: preferenceId,
            },
            callbacks: {
                onReady: () => {
                    console.log("Wallet Brick ready con preferencia");
                },
                onError: (error) => {
                    console.error("Wallet Brick error:", error);
                    walletContainer.innerHTML = `
                        <div style="background: #2d2d2d; color: #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #444;">
                            <h5> Billetera No Disponible</h5>
                            <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                        </div>
                    `;
                }
            }
        });
        
    } catch (error) {
        console.error(' Error creando Wallet Brick con preferencia:', error);
        const walletContainer = document.getElementById('walletBrick_container');
        if (walletContainer) {
            walletContainer.innerHTML = `
                <div style="background: #2d2d2d; color: #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #444;">
                    <h5> Billetera No Disponible</h5>
                    <p>Utiliza el formulario de abajo para pagar con tarjetas, efectivo u otros métodos.</p>
                </div>
            `;
        }
    }
};

const initializePaymentBrick = async (total, userEmail) => {
    try {
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (!paymentContainer) return;

        console.log(' Inicializando Payment Brick, monto:', total);

        const settings = {
            initialization: {
                amount: total,
                payer: {
                    email: userEmail,
                }
            },
            callbacks: {
                onReady: () => {
                    console.log('Payment Brick ready');
                },
                onSubmit: (formData) => {
                    console.log('Payment Brick onSubmit - Datos recibidos:', formData);
                    if (!formData || typeof formData !== 'object') {
                        console.error(' formData es inválido:', formData);
                        alert('Error: Datos de pago inválidos');
                        return;
                    }
                    
                    if (!formData.token && !formData.paymentMethodId) {
                        console.error(' Faltan datos críticos en formData:', formData);
                        alert('Error: Faltan datos de pago esenciales');
                        return;
                    }
                    
                    handlePaymentSubmission(formData, 'payment');
                },
                onError: (error) => {
                    console.error(' Payment Brick error:', error);
                    paymentContainer.innerHTML = `
                        <div style="background: #2d2d2d; color: #dc3545; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #dc3545;">
                            <h5> Error en formulario de pago</h5>
                            <p>${error.message || 'Error al cargar el formulario'}</p>
                            <button onclick="location.reload()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                                Recargar página
                            </button>
                        </div>
                    `;
                }
            },
            customization: {
                paymentMethods: {
                    creditCard: "all",
                    debitCard: "all", 
                    ticket: "all"
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
        
        console.log(' Payment Brick creado exitosamente');
        
    } catch (error) {
        console.error(' Error crítico creando Payment Brick:', error);
        const paymentContainer = document.getElementById('paymentBrick_container');
        if (paymentContainer) {
            paymentContainer.innerHTML = `
                <div style="background: #2d2d2d; color: #dc3545; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #dc3545;">
                    <h5> Error crítico</h5>
                    <p>No se pudo cargar el formulario de pago.</p>
                    <p>Error: ${error.message}</p>
                    <button onclick="location.reload()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px;">
                        Recargar página
                    </button>
                </div>
            `;
        }
    }
};

export const renderStatusScreenBrick = async (result) => {
    paymentId = result.id;
    console.log('Payment ID:', paymentId);

    try {
        const statusContainer = document.getElementById('statusScreenBrick_container');
        if (statusContainer) {
            statusContainer.innerHTML = '';
        }

        if (window.statusScreenBrickController) {
            try {
                await window.statusScreenBrickController.unmount();
            } catch (e) {
                console.log(' No se pudo desmontar Status Screen anterior');
            }
        }

        window.statusScreenBrickController = await bricksBuilder.create('statusScreen', 'statusScreenBrick_container', {
            initialization: {
                paymentId: paymentId
            },
            callbacks: {
                onReady: () => {
                    console.log('Status Screen Brick ready');
                },
                onError: (error) => {
                    console.error('Error en Status Screen Brick:', error);
                }
            }
        });
    } catch (error) {
        console.error('Error creando Status Screen:', error);
    }
};