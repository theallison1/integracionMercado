package com.mercadopago.sample.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

@Component
public class MercadoPagoLogger {
    
    private static final Logger logger = LoggerFactory.getLogger(MercadoPagoLogger.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public void logRequest(String endpoint, Object request, String accessToken) {
        try {
            logger.info("=== 🚀 MERCADO PAGO REQUEST ===");
            logger.info("📤 Endpoint: {}", endpoint);
            logger.info("🔑 Access Token: {}", maskAccessToken(accessToken));
            logger.info("📦 Request Body: {}", objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request));
            logger.info("=== 🚀 END REQUEST ===");
        } catch (JsonProcessingException e) {
            logger.warn("❌ No se pudo serializar el request para logging: {}", e.getMessage());
        }
    }
    
    public void logResponse(String endpoint, String response, int statusCode) {
        logger.info("=== ✅ MERCADO PAGO RESPONSE ===");
        logger.info("📥 Endpoint: {}", endpoint);
        logger.info("📊 Status Code: {}", statusCode);
        logger.info("📄 Response Body: {}", response);
        logger.info("=== ✅ END RESPONSE ===");
    }
    
    public void logApiException(String endpoint, String errorMessage, String apiResponse, int statusCode) {
        logger.error("=== ❌ MERCADO PAGO API ERROR ===");
        logger.error("📤 Endpoint: {}", endpoint);
        logger.error("💥 Status Code: {}", statusCode);
        logger.error("❌ Error Message: {}", errorMessage);
        logger.error("📄 API Response: {}", apiResponse);
        logger.error("=== ❌ END API ERROR ===");
    }
    
    public void logMPException(String endpoint, String errorMessage) {
        logger.error("=== ⚠️ MERCADO PAGO EXCEPTION ===");
        logger.error("📤 Endpoint: {}", endpoint);
        logger.error("💥 Error: {}", errorMessage);
        logger.error("=== ⚠️ END EXCEPTION ===");
    }
    
    private String maskAccessToken(String accessToken) {
        if (accessToken == null || accessToken.length() <= 8) {
            return "***INVALID***";
        }
        return accessToken.substring(0, 8) + "..." + accessToken.substring(accessToken.length() - 4);
    }
}
