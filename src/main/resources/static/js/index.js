
onSubmit: ({ selectedPaymentMethod, formData }) => {
    console.log('=== INICIANDO PAGO ===');
    console.log('Datos del Brick:', formData);

    fetch('/process_payment', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
    })
    .then(async (response) => {
        console.log('=== RESPUESTA HTTP ===');
        console.log('Status:', response.status);
        console.log('OK:', response.ok);
        console.log('Headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error HTTP:', response.status, errorText);
            volverAlCarrito();
            return null; // ← IMPORTANTE: retornar null para evitar el siguiente then
        }
        
        try {
            const result = await response.json();
            console.log('✅ Respuesta JSON:', result);
            return result;
        } catch (jsonError) {
            console.error('❌ Error parseando JSON:', jsonError);
            return null;
        }
    })
    .then(result => {
        console.log('=== PROCESANDO RESULTADO ===');
        console.log('Result:', result);
        
        // ✅ VERIFICACIÓN ROBUSTA
        if (!result) {
            console.error('❌ Result es null o undefined');
            volverAlCarrito();
            return;
        }

        if (!result.status) {
            console.error('❌ Result no tiene propiedad status:', result);
            volverAlCarrito();
            return;
        }

        console.log('Estado del pago:', result.status);
        
        if (result.status === 'approved' || result.status === 'pending') {
            console.log('✅ Pago exitoso/pendiente');
            renderStatusScreenBrick(bricksBuilder, result);
            
            $('.container__payment').fadeOut(500);
            setTimeout(() => {
                $('.container__result').show(500).fadeIn();
            }, 500);
        } else {
            console.log('❌ Pago rechazado - Estado:', result.status);
            volverAlCarrito();
        }
    })
    .catch((error) => {
        console.error('=== ERROR EN FETCH ===');
        console.error('Error completo:', error);
        console.error('Nombre:', error.name);
        console.error('Mensaje:', error.message);
        volverAlCarrito();
    });
}
