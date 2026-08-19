# 🤖 Bot de WhatsApp - Guía de Instalación y Uso

¡Hola! Este bot ha sido diseñado para enviar imágenes y mensajes a todos tus grupos de forma automática y con protección anti-bloqueo.

## 🛠️ Paso 1: Instalación (Solo la primera vez)
Como acabas de descargar este código, necesitas instalar las librerías necesarias.
1. Haz doble clic en el archivo **`instalar.bat`**.
2. Se abrirá una ventana negra que descargará todo automáticamente. Espera a que termine y diga "Instalación completada".

## 🔍 Paso 2: Extraer tus Grupos
Antes de enviar mensajes, necesitas decirle al bot a qué grupos debe enviarlos.
1. Abre tu terminal de comandos (CMD) en esta carpeta y ejecuta: `node obtener_grupos.js`
2. Se abrirá un **Código QR**. Escanéalo con tu celular (en la opción de Dispositivos Vinculados de WhatsApp).
3. El bot generará un archivo llamado **`mis_grupos.txt`**.
4. Ábrelo, copia el bloque de texto que contiene los grupos, y pégalo dentro del archivo **`bot.js`** (en la sección `gruposDestino`).

## 🚀 Paso 3: Iniciar los Envíos
1. Haz doble clic en **`iniciar.bat`**.
2. ¡Listo! El bot abrirá tu WhatsApp, bloqueará imágenes y videos para no gastar tu memoria RAM, y empezará a enviar tu publicidad (`oferta.png` + el texto de `bot.js`) a todos tus grupos respetando tiempos seguros para que no te bloqueen.

### 🆘 ¿Problemas?
Si el bot se queda atascado o necesitas cerrarlo a la fuerza:
- Haz doble clic en **`limpiar_chrome.bat`** para matar cualquier proceso invisible.
- Si la sesión se corrompe y dice "LOGOUT", simplemente **borra la carpeta `.wwebjs_auth`** y vuelve a escanear el QR.
