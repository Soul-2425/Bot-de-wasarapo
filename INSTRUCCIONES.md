# 🤖 Bot de WhatsApp - Guía de Instalación y Uso (Versión Optimizada)

¡Hola! Este bot ha sido diseñado para enviar imágenes y mensajes publicitarios a todos tus grupos de forma automática, con **bajo consumo de RAM** y **protección anti-bloqueo avanzada**.

---

## 🛠️ Paso 1: Instalación (Solo la primera vez)
1. Haz doble clic en el archivo **`instalar.bat`**.
2. Espera a que termine y diga "Instalación completada".

---

## 🔍 Paso 2: Extraer tus Grupos (100% Automático)
1. Haz doble clic en **`extraer_grupos.bat`** (o ejecuta `node obtener_grupos.js`).
2. Si te solicita código QR, escanéalo con tu WhatsApp (Dispositivos Vinculados).
3. ¡Listo! El bot guardará tus grupos automáticamente en **`config/grupos.json`**.  
   *(Ya **NO** necesitas abrir ningún archivo para copiar o pegar código a mano).*

---

## ⚙️ Paso 3: Configurar tus Mensajes y Oferta (Opcional)
- **Imagen:** Coloca tu imagen publicitaria en la carpeta principal con el nombre **`oferta.png`**.
- **Textos y tiempos:** Abre **`config/config.json`** para personalizar tus textos publicitarios o modificar los tiempos de espera entre envíos sin tocar el código.

---

## 🚀 Paso 4: Iniciar los Envíos
1. Haz doble clic en **`iniciar.bat`**.
2. El bot:
   - Detectará automáticamente Google Chrome.
   - Bloqueará fotos y videos entrantes para **no saturar tu memoria RAM**.
   - Simulará escritura humana (*"escribiendo..."*) antes de enviar.
   - Variará los tiempos de espera orgánicamente y alternará los mensajes para proteger tu cuenta.
   - Guardará el registro de envíos en la carpeta **`logs/`**.

---

### 🆘 ¿Problemas o solución rápida?
- **¿Procesos de Chrome colgados?** Haz doble clic en **`limpiar_chrome.bat`**.
- **¿Desconexión o sesión corrupta?** Borra la carpeta **`.wwebjs_auth`** y vuelve a escanear el código QR.
- **¿Se fue la luz o se cerró?** El bot guarda su progreso en **`estado.json`** y al volver a iniciar saltará los grupos que ya fueron procesados.

