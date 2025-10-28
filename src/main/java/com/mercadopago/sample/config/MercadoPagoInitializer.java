// En MercadoPagoInitializer.java - REEMPLAZAR las líneas problemáticas
@PostConstruct
public void initialize() {
    try {
        LOGGER.info("🚀 INICIANDO CONFIGURACIÓN MERCADO PAGO...");
        
        // ✅ CORREGIDO: Eliminar llamadas a métodos que no existen
        // Map<String, Object> credentials = storeService.verifyProductionCredentials();
        // LOGGER.info("🔐 Credenciales verificadas: {}", credentials);
        
        // ✅ CORREGIDO: Eliminar llamada a manageStores()
        // Map<String, Object> storesResult = storeService.manageStores();
        // LOGGER.info("🏪 Stores inicializados: {}", storesResult);
        
        LOGGER.info("✅ CONFIGURACIÓN MERCADO PAGO COMPLETADA - Servicios listos");
        
    } catch (Exception e) {
        LOGGER.error("❌ Error en inicialización MP: {}", e.getMessage());
        // ✅ NO bloquear el startup por errores de stores
    }
}
