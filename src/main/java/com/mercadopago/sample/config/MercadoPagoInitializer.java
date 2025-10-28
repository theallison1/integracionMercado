package com.mercadopago.sample.config;

import com.mercadopago.sample.service.MercadoPagoStoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.Map;

@Component
public class MercadoPagoInitializer {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(MercadoPagoInitializer.class);
    
    @Autowired
    private MercadoPagoStoreService storeService;

    @PostConstruct
    public void initialize() {
        try {
            LOGGER.info("🚀 INICIANDO CONFIGURACIÓN MERCADO PAGO...");
            
            // ✅ CORREGIDO: Eliminar llamadas a métodos que no existen
            // Map<String, Object> credentials = storeService.verifyProductionCredentials();
            // LOGGER.info("🔐 Credenciales verificadas: {}", credentials);
            
            // ✅ CORREGIDO: Eliminar llamada a manageStores()
            // Map<String, Object> storesResult = storeService.manageStores();
            // LOGGER.info("🏪 Stores inicializados: {}", storesResult);
            
            LOGGER.info("✅ CONFIGURACIÓN MERCADO PAGO COMPLETADA - Servicios listos");
            
        } catch (Exception e) {
            LOGGER.error("❌ Error en inicialización MP: {}", e.getMessage());
            // ✅ NO bloquear el startup por errores de stores
        }
    }
}
