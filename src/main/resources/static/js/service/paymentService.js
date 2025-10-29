import { getCustomerData } from '../modules/customerForm.js';
import { getCart, calculateCartTotal } from '../modules/cartManager.js';
import { renderStatusScreenBrick } from '../modules/paymentBricks.js';

export const createMercadoPagoPreference = async (amount) => {
    try {
        console.log('Creando preferencia en Mercado Pago, monto:', amount);
        
        const response = await fetch('/process_payment/create_wallet_preference', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: amount,
                description: `Compra de ${getCart().length} productos Millenium`
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(' Error creando preferencia:', errorText);
            throw new Error('Error del servidor al crear preferencia');
        }
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        console.log(' Preferencia creada:', result.id);
        return result.id;
        
    } catch (error) {
        console.error(' Error creando preferencia:', error);
        return null;
    }
};

export const handlePaymentSubmission = async (paymentData, brickType) => {
    console.log(` Procesando pago desde ${brickType}:`, paymentData);
    
    if (!paymentData || typeof paymentData !== 'object') {
        console.error(' Error: paymentData es inválido:', paymentData);
        alert('Error: Datos de pago inválidos. Por favor, intenta nuevamente.');
        return;
    }

    const hasRequiredData = paymentData.token || paymentData.paymentMethodId;
    if (!hasRequiredData) {
        console.error(' Error: Faltan datos críticos en paymentData:', paymentData);
        alert('Error: Datos de pago incompletos. Faltan token o paymentMethodId.');
        return;
    }

    try {
        const total = calculateCartTotal();
        const customerData = getCustomerData();
        const userEmail = customerData.email || "cliente@millenium.com";

        const requestData = {
            token: paymentData.token || paymentData.paymentMethodId,
            paymentMethodId: paymentData.payment_method_id || paymentData.paymentMethodId,
            installments: parseInt(paymentData.installments) || 1,
            issuerId: paymentData.issuer_id || null,
            paymentType: paymentData.payment_type || 'credit_card',
            amount: total,
            brickType: brickType,
            description: `Pago de ${getCart().length} productos Millenium`,
            payer: {
                email: userEmail,
                firstName: customerData.firstName || "Cliente",
                lastName: customerData.lastName || "Millenium",
                identification: {
                    type: customerData.dniType || 'DNI',
                    number: customerData.dniNumber || ''
                }
            }
        };

        console.log(' Enviando datos de pago al servidor:', requestData);

        const response = await fetch('/process_payment/process_bricks_payment', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestData)
        });

        console.log(` Respuesta del servidor (status: ${response.status})`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en respuesta:', errorData);
            throw new Error(errorData.error_message || `Error del servidor: ${response.status}`);
        }

        const result = await response.json();
        console.log(` Pago procesado exitosamente:`, result);

        if (result.error_message) {
            throw new Error(result.error_message);
        }

        await renderStatusScreenBrick(result);

        $('.container__payment').fadeOut(500);
        setTimeout(() => {
            $('.container__result').show(500).fadeIn();
        }, 500);

    } catch (error) {
        console.error(` Error procesando pago:`, error);
        alert(`Error al procesar el pago: ${error.message}`);
    }
};

export const downloadReceipt = (paymentId) => {
    const url = `/process_payment/download_receipt/${paymentId}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al descargar el comprobante');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobante-pago-${paymentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            console.log('Comprobante descargado exitosamente');
        })
        .catch(error => {
            console.error('Error downloading receipt:', error);
            alert('Error al descargar el comprobante: ' + error.message);
        });
};