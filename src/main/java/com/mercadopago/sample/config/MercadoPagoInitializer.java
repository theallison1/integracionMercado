package com.mercadopago.sample.config;

import com.mercadopago.sample.service.MercadoPagoStoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MercadoPagoInitializer implements CommandLineRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(MercadoPagoInitializer.class);
    
    @Autowired
    private MercadoPagoStoreService storeService;

    @Override
    public void run(String... args) throws Exception {
        LOGGER.info("🚀 Inicializando configuración de Mercado Pago...");
        
        try {
            // ✅ VERIFICAR CREDENCIALES
            Map<String, Object> credentials = storeService.verifyProductionCredentials();
            if ((Boolean) credentials.get("authenticated")) {
                LOGGER.info("✅ Credenciales de Mercado Pago válidas - User: {}", credentials.get("user_id"));
            } else {
                LOGGER.error("❌ Credenciales de Mercado Pago inválidas");
            }
            
            // ✅ ADMINISTRAR STORES (usando el nuevo método)
            Map<String, Object> storesResult = storeService.manageStores();
            if ((Boolean) storesResult.get("success")) {
                LOGGER.info("✅ Stores configurados correctamente - ID: {}", storesResult.get("primary_store_id"));
            }
            
            LOGGER.info("✅ Configuración de Mercado Pago completada");
            
        } catch (Exception e) {
            LOGGER.error("❌ Error en inicialización de Mercado Pago: {}", e.getMessage());
        }
    }
}
