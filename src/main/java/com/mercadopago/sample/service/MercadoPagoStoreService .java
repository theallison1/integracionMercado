package com.mercadopago.sample.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.pos.PosClient;
import com.mercadopago.client.pos.PosRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.pos.Pos;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class MercadoPagoStoreService {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(MercadoPagoStoreService.class);
    
    @Value("${mercado_pago_sample_access_token}")
    private String mercadoPagoAccessToken;

    /**
     * ✅ CREAR CAJA (POS) POR API - OBLIGATORIO para aprobación
     */
    public String createPOS(String storeId, String externalId, String name, boolean fixedAmount) {
        try {
            LOGGER.info("🔄 Creando POS - Store: {}, External ID: {}", storeId, externalId);
            
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            
            PosRequest posRequest = PosRequest.builder()
                .name(name)
                .externalId(externalId)
                .fixedAmount(fixedAmount)
                .category(624L) // Categoría: Retail
                .storeId(storeId)
                .build();
                
            Pos pos = PosClient.create(posRequest);
            
            LOGGER.info("✅ POS creado exitosamente - ID: {}, External ID: {}", pos.getId(), externalId);
            return pos.getId();
            
        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API creando POS - Status: {}", apiException.getStatusCode());
            LOGGER.error("❌ Error: {}", apiException.getApiResponse().getContent());
            return null;
        } catch (MPException e) {
            LOGGER.error("❌ Error creando POS: {}", e.getMessage());
            return null;
        }
    }

    /**
     * ✅ CREAR SUCURSAL POR API - OBLIGATORIO para aprobación
     */
    public String createStore(String name, String externalId, String location) {
        try {
            LOGGER.info("🔄 Creando sucursal - Nombre: {}, External ID: {}", name, externalId);
            
            MercadoPagoConfig.setAccessToken(mercadoPagoAccessToken);
            
            // Para tiendas online, creamos una sucursal virtual
            com.mercadopago.client.store.StoreRequest storeRequest = 
                com.mercadopago.client.store.StoreRequest.builder()
                    .name(name)
                    .externalId(externalId)
                    .businessHours("0-0:00-23:59") // 24/7 para e-commerce
                    .location(location != null ? location : "Online")
                    .build();
                    
            com.mercadopago.resources.store.Store store = 
                com.mercadopago.client.store.StoreClient.create(storeRequest);
            
            LOGGER.info("✅ Sucursal creada exitosamente - ID: {}, Nombre: {}", store.getId(), name);
            return store.getId();
            
        } catch (MPApiException apiException) {
            LOGGER.error("❌ Error API creando sucursal - Status: {}", apiException.getStatusCode());
            LOGGER.error("❌ Error: {}", apiException.getApiResponse().getContent());
            return null;
        } catch (MPException e) {
            LOGGER.error("❌ Error creando sucursal: {}", e.getMessage());
            return null;
        }
    }
}
