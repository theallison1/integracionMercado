export const mercadoPagoConfig = {
    getPublicKey: () => document.getElementById("mercado-pago-public-key").value,
    locale: 'es-AR'
};

export const customerFormConfig = {
    requiredFields: ['firstName', 'lastName', 'email'],
    dniTypes: ['DNI', 'CUIT', 'CUIL']
};
