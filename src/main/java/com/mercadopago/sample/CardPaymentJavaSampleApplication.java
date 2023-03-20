package com.mercadopago.sample;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@SpringBootApplication
public class CardPaymentJavaSampleApplication {

    public static void main(String[] args) {
        SpringApplication.run(CardPaymentJavaSampleApplication.class, args);
    }

}
