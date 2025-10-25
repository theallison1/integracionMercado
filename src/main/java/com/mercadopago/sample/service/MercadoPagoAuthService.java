package com.mercadopago.sample.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class MercadoPagoAuthService {
    private static final Logger LOGGER = LoggerFactory.getLogger(MercadoPagoAuthService.class);
    
    @Value("${mercado_pago.client_id}")
    private String clientId;
    
    @Value("${mercado_pago.client_secret}")
    private String clientSecret;
    
    @Value("${mercado_pago.redirect_uri}")
    private String redirectUri;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String getClientCredentialsToken() throws Exception {
        LOGGER.info("Obteniendo token con Client Credentials para client_id: {}", clientId);
        
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("client_id", clientId);
        requestBody.put("client_secret", clientSecret);
        requestBody.put("grant_type", "client_credentials");
        
        String jsonBody = objectMapper.writeValueAsString(requestBody);
        
        Map<String, String> customHeaders = new HashMap<>();
        customHeaders.put("x-idempotency-key", "CLIENT_CRED_" + UUID.randomUUID().toString());
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.mercadopago.com/oauth/token"))
                .header("Content-Type", "application/json")
                .headers(customHeaders.entrySet().stream()
                        .flatMap(entry -> Stream.of(entry.getKey(), entry.getValue()))
                        .toArray(String[]::new))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() == 200) {
            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            String accessToken = (String) responseMap.get("access_token");
            LOGGER.info("✅ Token Client Credentials obtenido exitosamente");
            return accessToken;
        } else {
            LOGGER.error("❌ Error obteniendo token Client Credentials: {}", response.body());
            throw new RuntimeException("Error obteniendo token: " + response.body());
        }
    }
    
    public String getAuthorizationUrl(String state) {
        String authUrl = String.format(
            "https://auth.mercadopago.com/authorization?client_id=%s&response_type=code&platform_id=mp&state=%s&redirect_uri=%s",
            clientId, state, redirectUri
        );
        LOGGER.info("URL de autorización generada: {}", authUrl);
        return authUrl;
    }
    
    public Map<String, Object> exchangeCodeForToken(String code) throws Exception {
        LOGGER.info("Intercambiando código por token OAuth...");
        
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("client_id", clientId);
        requestBody.put("client_secret", clientSecret);
        requestBody.put("grant_type", "authorization_code");
        requestBody.put("code", code);
        requestBody.put("redirect_uri", redirectUri);
        
        String jsonBody = objectMapper.writeValueAsString(requestBody);
        
        Map<String, String> customHeaders = new HashMap<>();
        customHeaders.put("x-idempotency-key", "OAUTH_EXCHANGE_" + UUID.randomUUID().toString());
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.mercadopago.com/oauth/token"))
                .header("Content-Type", "application/json")
                .headers(customHeaders.entrySet().stream()
                        .flatMap(entry -> Stream.of(entry.getKey(), entry.getValue()))
                        .toArray(String[]::new))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
        
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() == 200) {
            Map<String, Object> tokenResponse = objectMapper.readValue(response.body(), Map.class);
            LOGGER.info("✅ Token OAuth obtenido exitosamente para usuario");
            return tokenResponse;
        } else {
            LOGGER.error("❌ Error intercambiando código: {}", response.body());
            throw new RuntimeException("Error intercambiando código: " + response.body());
        }
    }
}
