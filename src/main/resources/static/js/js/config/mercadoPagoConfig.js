export const mercadoPagoPublicKey = document.getElementById("mercado-pago-public-key").value;

export const initializeMercadoPago = () => {
    return new MercadoPago(mercadoPagoPublicKey, {
        locale: 'es-AR'
    });
};

export const getBricksBuilder = () => {
    const mercadopago = initializeMercadoPago();
    return mercadopago.bricks();
};