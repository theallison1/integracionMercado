package com.mercadopago.sample.config;

// ✅ COMENTA TEMPORALMENTE - YA HAY OTRO restTemplate
/*
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import com.mercadopago.sample.util.MercadoPagoHeaderLogger;
import java.util.Collections;

@Configuration
public class RestTemplateConfig {
    
    @Autowired
    private MercadoPagoHeaderLogger headerLogger;
    
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setInterceptors(Collections.singletonList(headerLogger));
        return restTemplate;
    }
}
*/
