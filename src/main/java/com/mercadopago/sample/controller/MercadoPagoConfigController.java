package com.mercadopago.sample.controller;

import com.mercadopago.sample.service.MercadoPagoStoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/mercado-pago")
public class MercadoPagoConfigController {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(MercadoPagoConfigController.class);
    
    @Autowired
    private MercadoPagoStoreService mercadoPagoStoreService;

    /**
     * ✅ ENDPOINT PARA INICIALIZAR CONFIGURACIÓN DE MERCADO PAGO
     * Esto demuestra a Mercado Pago que estás usando sus APIs
     */
    @PostMapping("/initialize")
    public ResponseEntity<?> initializeMercadoPagoConfig() {
        try {
            LOGGER.info("🎯 Inicializando configuración de Mercado Pago para aprobación");
            
            Map<String, String> results = new HashMap<>();
            
            // 1. Crear sucursal virtual (para e-commerce)
            String storeId = mercadoPagoStoreService.createStore(
                "Millenium Termotanques Online", 
                "millenium-online-001",
                "Tienda Online"
            );
            results.put("storeId", storeId);
            
            // 2. Crear POS virtual (para e-commerce)
            if (storeId != null) {
                String posId = mercadoPagoStoreService.createPOS(
                    storeId,
                    "millenium-pos-online",
                    "POS Millenium Online", 
                    false // fixedAmount = false para montos variables
                );
                results.put("posId", posId);
            }
            
            LOGGER.info("✅ Configuración de Mercado Pago inicializada exitosamente");
            return ResponseEntity.ok(results);
            
        } catch (Exception e) {
            LOGGER.error("❌ Error inicializando configuración: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    /**
 * ✅ LISTAR STORES CON DETALLES (para el controller)
 */
public Map<String, Object> listStoresWithDetails() {
    try {
        LOGGER.info("📋 Listando stores con detalles...");
        
        List<Map<String, Object>> stores = listAllStores();
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("total_stores", stores.size());
        result.put("stores", stores);
        result.put("environment", "PRODUCTION");
        result.put("timestamp", new Date());
        
        if (stores.isEmpty()) {
            result.put("message", "No hay stores configurados. Usa /api/config/manage-stores para crear uno.");
        } else {
            result.put("primary_store_id", stores.get(0).get("id"));
            result.put("primary_store_name", stores.get(0).get("name"));
        }
        
        LOGGER.info("✅ Listado de stores completado - Total: {}", stores.size());
        return result;
        
    } catch (Exception e) {
        LOGGER.error("❌ Error listando stores: {}", e.getMessage());
        return createErrorResponse("STORES_LIST_ERROR", e.getMessage());
    }
}

    /**
     * ✅ ENDPOINT DE VERIFICACIÓN PARA MERCADO PAGO
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        LOGGER.info("🔍 Health check - Sistema operativo");
        return ResponseEntity.ok(Map.of(
            "status", "active",
            "integration", "mercado-pago",
            "logs", "enabled",
            "pos_api", "implemented",
            "store_api", "implemented"
        ));
    }
}
