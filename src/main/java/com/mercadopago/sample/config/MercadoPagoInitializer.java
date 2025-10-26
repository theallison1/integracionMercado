package com.mercadopago.sample.config;

import com.mercadopago.sample.service.MercadoPagoStoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class MercadoPagoInitializer {
    
    @Autowired
    private MercadoPagoStoreService storeService;
    
    private static final Logger LOGGER = LoggerFactory.getLogger(MercadoPagoInitializer.class);
    
    @EventListener(ApplicationReadyEvent.class)
    public void initializeMercadoPago() {
        try {
            LOGGER.info("🚀 Inicializando configuración de Mercado Pago...");
            
            // Esto se ejecutará automáticamente cuando la app inicie
            // y demostrará a Mercado Pago que estás usando sus APIs
            
            // Crear configuración básica - DESCOMENTA cuando tengas el servicio listo
            // String storeId = storeService.createStore("Millenium Online", "millenium-online", "Online");
            // if (storeId != null) {
            //     storeService.createPOS(storeId, "millenium-pos-online", "POS Online", false);
            // }
            
            LOGGER.info("✅ Configuración de Mercado Pago lista");
        } catch (Exception e) {
            LOGGER.warn("⚠️ Configuración automática de Mercado Pago no pudo completarse: {}", e.getMessage());
        }
    }
}
