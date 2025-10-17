package com.mercadopago.sample.controller;

import com.mercadopago.resources.payment.Payment;
import com.mercadopago.sample.dto.CardPaymentDTO;
import com.mercadopago.sample.dto.PayerDTO;
import com.mercadopago.sample.dto.PayerIdentificationDTO;
import com.mercadopago.sample.dto.PaymentResponseDTO;
import com.mercadopago.sample.service.CardPaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.math.BigDecimal;

@RestController
@RequestMapping("/process_payment")
public class CardPaymentController {
    
    @Resource
    private CardPaymentService cardPaymentService;
    
    private static final Logger LOGGER = LoggerFactory.getLogger(CardPaymentController.class);

    public CardPaymentController(CardPaymentService cardPaymentService) {
        this.cardPaymentService = cardPaymentService;
    }

    // Webhook para notificaciones de Mercado Pago
    @PostMapping("/webhooks/mercadopago")
    public ResponseEntity<String> handleMercadoPagoNotification(
            @RequestParam("data.id") String paymentId,
            @RequestParam("type") String eventType) {
        
        LOGGER.info("Notificación recibida de Mercado Pago - ID: {}, Tipo: {}", paymentId, eventType);
        
        // Procesar la notificación según el tipo de evento
        switch (eventType) {
            case "payment":
                LOGGER.info("Actualización de pago recibida - ID: {}", paymentId);
                // Aquí puedes actualizar tu base de datos, enviar emails, etc.
                break;
            case "plan":
                LOGGER.info("Notificación de plan recibida");
                break;
            case "subscription":
                LOGGER.info("Notificación de suscripción recibida");
                break;
            case "invoice":
                LOGGER.info("Notificación de factura recibida");
                break;
            default:
                LOGGER.warn("Tipo de evento no reconocido: {}", eventType);
        }
        
        return ResponseEntity.ok("Notificación recibida");
    }

    // Endpoint para verificación del webhook
    @GetMapping("/webhooks/mercadopago")
    public ResponseEntity<String> verifyWebhook(@RequestParam("topic") String topic) {
        LOGGER.info("Verificación de webhook recibida - Tópico: {}", topic);
        return ResponseEntity.ok("Webhook verificado");
    }

    // Procesar pago principal
    @CrossOrigin(origins = "http://localhost:8080")
    @PostMapping
    public ResponseEntity<PaymentResponseDTO> processPayment(@RequestBody CardPaymentDTO cardPaymentDTO) {
        LOGGER.info("Solicitud de pago recibida: {}", cardPaymentDTO.toString());

        try {
            PaymentResponseDTO payment = cardPaymentService.processPayment(cardPaymentDTO);
            LOGGER.info("Pago procesado exitosamente - ID: {}", payment.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (Exception e) {
            LOGGER.error("Error al procesar el pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Método para obtener el comprobante del pago y devolverlo como archivo PDF
    @GetMapping("/download_receipt/{paymentId}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long paymentId) {
        try {
            Payment payment = cardPaymentService.getPaymentById(paymentId);
            byte[] pdfContent = cardPaymentService.generateReceiptPdf(payment);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename("comprobante_pago.pdf").build());

            return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            LOGGER.error("Error generando comprobante para pago ID {}: {}", paymentId, e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Endpoint de prueba
    @GetMapping("/holis")
    public ResponseEntity<String> getAuthenticationRequest() {
        LOGGER.info("Entro al endpoint de prueba ----------------------");
        
        try {
            CardPaymentDTO cardPaymentDTO1 = new CardPaymentDTO();
            cardPaymentDTO1.setToken("2ebc717fdff5fa793961b39c142963a5");
            cardPaymentDTO1.setInstallments(1);
            cardPaymentDTO1.setIssuerId("2");
            cardPaymentDTO1.setTransactionAmount(BigDecimal.valueOf(2000));
            cardPaymentDTO1.setProductDescription("Pago de prueba Millenium Termotanques");

            PayerDTO payerDTO = new PayerDTO();
            payerDTO.setEmail("nicoo.2011.pr@gmail.com");
            payerDTO.setFirstName("Nicolás"); // Agregado
            payerDTO.setLastName("Pérez");    // Agregado
            
            PayerIdentificationDTO payerIdentificationDTO = new PayerIdentificationDTO();
            payerIdentificationDTO.setType("DNI");
            payerIdentificationDTO.setNumber("35418288");
            payerDTO.setIdentification(payerIdentificationDTO);
            
            cardPaymentDTO1.setPayer(payerDTO);
            cardPaymentDTO1.setPaymentMethodId("amex");

            PaymentResponseDTO payment = cardPaymentService.processPayment(cardPaymentDTO1);
            LOGGER.info("Pago de prueba procesado - Estado: {}", payment.getStatus());
            
            return ResponseEntity.status(HttpStatus.CREATED).body("Prueba exitosa - Estado: " + payment.getStatus());
        } catch (Exception e) {
            LOGGER.error("Error en prueba: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error en prueba: " + e.getMessage());
        }
    }
}
