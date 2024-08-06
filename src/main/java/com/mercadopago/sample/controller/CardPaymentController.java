package com.mercadopago.sample.controller;

import com.mercadopago.resources.payment.Payment;
import com.mercadopago.sample.dto.CardPaymentDTO;
import com.mercadopago.sample.dto.PayerDTO;
import com.mercadopago.sample.dto.PayerIdentificationDTO;
import com.mercadopago.sample.dto.PaymentResponseDTO;
import com.mercadopago.sample.service.CardPaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;

@RestController
@RequestMapping("/process_payment")
public class CardPaymentController {
    @Resource
    private  CardPaymentService cardPaymentService;
    private static final Logger LOGGER = LoggerFactory.getLogger(CardPaymentController.class);

    public CardPaymentController(CardPaymentService cardPaymentService) {
        this.cardPaymentService = cardPaymentService;
    }

    @CrossOrigin(origins = "http://localhost:8080")
    @PostMapping
    public ResponseEntity<PaymentResponseDTO> processPayment(@RequestBody  CardPaymentDTO cardPaymentDTO) {
        LOGGER.info(cardPaymentDTO.toString());

        PaymentResponseDTO payment = cardPaymentService.processPayment(cardPaymentDTO);
        LOGGER.info(payment.getId().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }
    // Método para obtener el comprobante del pago y devolverlo como archivo PDF
    @GetMapping("/download_receipt/{paymentId}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long paymentId) {
        try {
            Payment payment = cardPaymentService.getPaymentById(paymentId);
            byte[] pdfContent = cardPaymentService.generateReceiptPdf(payment);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename("receipt.pdf").build());

            return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            LOGGER.error("Error generating receipt", e);
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping(value = "/holis")
    public ResponseEntity<String> getAuthenticationRequest( ) {

        LOGGER.info("entro al controller----------------------");
        LOGGER.info("entro al controller----------------------");
        CardPaymentDTO cardPaymentDTO1 = new CardPaymentDTO();
        cardPaymentDTO1.setToken("2ebc717fdff5fa793961b39c142963a5");
        cardPaymentDTO1.setInstallments(1);
        cardPaymentDTO1.setIssuerId("2");

        cardPaymentDTO1.setTransactionAmount(BigDecimal.valueOf(2000));
        PayerDTO payerDTO = new PayerDTO();

        payerDTO.setEmail("nicoo.2011.pr@gmail.com");
        PayerIdentificationDTO payerIdentificationDTO= new PayerIdentificationDTO();
        payerIdentificationDTO.setType("DNI");
        payerIdentificationDTO.setNumber("35418288");
        payerDTO.setIdentification(payerIdentificationDTO);
        cardPaymentDTO1.setPaymentMethodId("amex");
        cardPaymentDTO1.setPayer(payerDTO);



        PaymentResponseDTO payment = cardPaymentService.processPayment(cardPaymentDTO1);
        LOGGER.info(payment.getStatus().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body("holisllllllll");
    }
}
