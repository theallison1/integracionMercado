package com.mercadopago.sample.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class MercadoPagoHeaderLogger implements ClientHttpRequestInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(MercadoPagoHeaderLogger.class);

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        
        // Log request headers
        logger.info("=== 📨 REQUEST HEADERS ===");
        logger.info("URL: {}", request.getURI());
        request.getHeaders().forEach((key, value) -> {
            if (!"Authorization".equalsIgnoreCase(key)) {
                logger.info("{}: {}", key, value);
            } else {
                logger.info("Authorization: Bearer ***MASKED***");
            }
        });
        logger.info("=== 📨 END HEADERS ===");
        
        ClientHttpResponse response = execution.execute(request, body);
        
        // Log response headers
        logger.info("=== 📬 RESPONSE HEADERS ===");
        logger.info("Status: {}", response.getStatusCode());
        response.getHeaders().forEach((key, value) -> {
            logger.info("{}: {}", key, value);
        });
        logger.info("=== 📬 END HEADERS ===");
        
        return response;
    }
}
