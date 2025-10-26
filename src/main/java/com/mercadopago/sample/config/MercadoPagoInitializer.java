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
            LOGGER.info("🚀 Inicializando configuración de Mercado Pago para E-COMMERCE...");
            
            // ✅ EXPLÍCITAMENTE definir que somos E-COMMERCE
            LOGGER.info("📱 Tipo de integración: E-COMMERCE (Millenium Termotanques Online)");
            LOGGER.info("🛒 Producto: Termotanques y productos para el hogar");
            LOGGER.info("🌐 Canal: Tienda online - NO POS/PDV físico");
            LOGGER.info("💳 Métodos: Payment Brick, Wallet Brick - NO QR físico");
            
            // ✅ CREAR CONFIGURACIÓN BÁSICA (versión simplificada)
            String storeId = storeService.createStore("Millenium Online", "millenium-online", "Online");
            if (storeId != null) {
                storeService.createPOS(storeId, "millenium-pos-online", "POS Online", false);
            }
            
            LOGGER.info("✅ Configuración E-COMMERCE lista - Store: {}, POS: {}", storeId, "millenium-pos-online");
            
        } catch (Exception e) {
            LOGGER.warn("⚠️ Configuración automática de Mercado Pago no pudo completarse: {}", e.getMessage());
        }
    }
}
