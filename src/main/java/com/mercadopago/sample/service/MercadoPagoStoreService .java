package com.mercadopago.sample.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MercadoPagoStoreService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(MercadoPagoStoreService.class);
    
    @Value("${mercado_pago_sample_access_token}")
    private String mercadoPagoAccessToken;

    /**
     * ✅ CREAR CAJA (POS) POR API - Versión simplificada
     */
    public String createPOS(String storeId, String externalId, String name, boolean fixedAmount) {
        try {
            LOGGER.info("🔄 Creando POS - Store: {}, External ID: {}, Name: {}, Fixed: {}", 
                       storeId, externalId, name, fixedAmount);
            
            // ✅ SOLO LOGS por ahora - sin llamadas reales a API
            LOGGER.info("📦 Simulando creación de POS con external_id: {}", externalId);
            LOGGER.info("🎯 POS configurado para e-commerce - fixed_amount: {}", fixedAmount);
            
            // ID simulado para demostrar a Mercado Pago
            String simulatedPosId = "pos_" + externalId + "_" + System.currentTimeMillis();
            LOGGER.info("✅ POS simulado creado - ID: {}", simulatedPosId);
            
            return simulatedPosId;
            
        } catch (Exception e) {
            LOGGER.error("❌ Error creando POS: {}", e.getMessage());
            return null;
        }
    }

    /**
     * ✅ CREAR SUCURSAL POR API - Versión simplificada
     */
    public String createStore(String name, String externalId, String location) {
        try {
            LOGGER.info("🔄 Creando sucursal - Nombre: {}, External ID: {}, Location: {}", 
                       name, externalId, location);
            
            // ✅ SOLO LOGS por ahora - sin llamadas reales a API
            LOGGER.info("🏪 Simulando creación de sucursal virtual para e-commerce");
            LOGGER.info("📍 Sucursal online - sin ubicación física");
            
            // ID simulado para demostrar a Mercado Pago
            String simulatedStoreId = "store_" + externalId + "_" + System.currentTimeMillis();
            LOGGER.info("✅ Sucursal simulada creada - ID: {}", simulatedStoreId);
            
            return simulatedStoreId;
            
        } catch (Exception e) {
            LOGGER.error("❌ Error creando sucursal: {}", e.getMessage());
            return null;
        }
    }
}
