# 📘 Documentación Técnica: Registro de Errores, Fallos y Soluciones

Este documento recopila de manera detallada todos los problemas y errores identificados durante la ejecución del **Bot de WhatsApp** y su **Extractor de Grupos**, explicando la causa raíz técnica de cada uno y la solución implementada para garantizar un funcionamiento fluido, estable y resiliente.

---

## 📑 Índice de Contenidos

1. [Problema: Retraso de ~5 minutos en reflejarse los mensajes enviados](#1-problema-retraso-de-5-minutos-en-reflejarse-los-mensajes-enviados)
2. [Error: Execution context was destroyed, most likely because of a navigation](#2-error-execution-context-was-destroyed-most-likely-because-of-a-navigation)
3. [Error: UnhandledPromiseRejection: "auth timeout" (ERR_UNHANDLED_REJECTION)](#3-error-unhandledpromiserejection-auth-timeout-err_unhandled_rejection)
4. [Error: net::ERR_NAME_NOT_RESOLVED y net::ERR_TIMED_OUT](#4-error-neterr_name_not_resolved-y-neterr_timed_out)
5. [Error: TIMEOUT_AUTENTICACION en bucle (3 minutos por intento)](#5-error-timeout_autenticacion-en-bucle-3-minutos-por-intento)
6. [Problema: Grupos sin nombre en la extracción ([Sin asunto - ID: ...])](#6-problema-grupos-sin-nombre-en-la-extracción-sin-asunto---id-)
7. [Error: Bloqueo de procesos y archivos Lockfile (SingletonLock, 4294967295)](#7-error-bloqueo-de-procesos-y-archivos-lockfile-singletonlock-4294967295)
8. [Buenas Prácticas para evitar retardos y bloqueos de cuenta](#8-buenas-prácticas-para-evitar-retardos-y-bloqueos-de-cuenta)

---

## 1. Problema: Retraso de ~5 minutos en reflejarse los mensajes enviados

### 🔴 Síntoma
El bot imprime en consola que el mensaje fue "Enviado con éxito" a un grupo y comienza el temporizador de descanso, pero al revisar WhatsApp en el teléfono celular o en la interfaz web, el mensaje **no aparece de inmediato** o queda con el icono de reloj (🕒) durante 3 a 5 minutos antes de reflejarse.

### 🔬 Causa Raíz
Este fenómeno se debe a la interacción de tres factores clave:

1. **Resolución anticipada de la promesa (`waitUntilMsgSent: false`)**:
   Por defecto en la librería `whatsapp-web.js`, cuando se ejecuta `cliente.sendMessage()`, el método retorna y resuelve la promesa tan pronto como el mensaje es agregado a la cola de memoria local de Chromium (`addAndSendMsgToChat`). **No espera** a que la imagen se cargue en los servidores multimedia de WhatsApp (MMS) ni a que el servidor de WhatsApp envíe la confirmación de entrega (ACK por WebSocket).
2. **Sincronización Multi-Dispositivo (Companion-to-Phone Sync)**:
   En WhatsApp Multi-Device, el bot opera como dispositivo vinculado. Los mensajes enviados van a los servidores de WhatsApp y luego el servidor sincroniza el mensaje hacia tu teléfono móvil primario. Si el teléfono tiene **ahorro de batería activado**, WhatsApp en segundo plano entra en reposo profundo y no descarga los paquetes de sincronización hasta que se enciende la pantalla o corre el ciclo del sistema (cada 5 a 10 min).
3. **Throttling de fondo en Windows (Window Occlusion)**:
   Al correr Chrome en modo `--headless`, el programador de tareas de Windows puede reducir la prioridad del hilo de red de Chromium si detecta que la ventana no tiene interfaz visual activa.

### 🟢 Solución Implementada
* **Activación de `waitUntilMsgSent: true`**:
  En `bot.js`, la llamada `cliente.sendMessage` ahora incluye la bandera `{ waitUntilMsgSent: true }`. Esto obliga al bot a **esperar la confirmación real del servidor de WhatsApp** antes de marcar el mensaje como exitoso y avanzar al siguiente grupo.
* **Nueva directiva en `config/config.json`**:
  ```json
  "esperarConfirmacionServidor": true
  ```
* **Flag anti-suspensión de Chromium**:
  Se añadió `--disable-features=CalculateNativeWinOcclusion` en los argumentos de arranque de Puppeteer para que Windows nunca ralentice los hilos de red en segundo plano.

---

## 2. Error: Execution context was destroyed, most likely because of a navigation

### 🔴 Síntoma
Al ejecutar `extraer_grupos.bat` justo después de escanear el código QR:
```text
❌ Error al leer la memoria en vivo: Protocol error (Runtime.callFunctionOn): Execution context was destroyed, most likely because of a navigation.
ℹ️ IndexedDB no disponible o vacío (Execution context was destroyed, most likely because of a navigation.).
```

### 🔬 Causa Raíz
Cuando se escanea el código QR en WhatsApp Web, la aplicación web realiza una **transición de página y recarga interna** desde la pantalla de bienvenida/login hacia el panel principal de chats. Durante esa navegación, Chromium destruye el contexto de ejecución de JavaScript anterior. El extractor intentaba ejecutar `pupPage.evaluate()` exactamente a los 15 segundos fijos, coincidiendo con el instante en que el documento se estaba destruyendo y reconstruyendo.

### 🟢 Solución Implementada
* **Espera activa de estabilización (`esperarEstabilizacionWhatsApp`)**:
  En lugar de una pausa ciega de 15 segundos, el extractor sondea dinámicamente hasta que el panel `#pane-side`, `[data-testid="chat-list"]` o `window.Store.Chat` esté realmente montado en el DOM.
* **Bucle de auto-recuperación con reintentos**:
  Si ocurre `Execution context was destroyed`, el error se captura sin cerrar el script, se informa en consola (`⏳ Pantalla de WhatsApp en transición... reintentando en 4s`) y se reintenta hasta 5 veces sobre el nuevo contexto activo.

---

## 3. Error: UnhandledPromiseRejection: "auth timeout" (ERR_UNHANDLED_REJECTION)

### 🔴 Síntoma
La consola de Node.js v20 se cierra abruptamente arrojando:
```text
UnhandledPromiseRejection: This error originated either by throwing inside of an async function without a catch block...
The promise rejected with the reason "auth timeout".
code: 'ERR_UNHANDLED_REJECTION'
```

### 🔬 Causa Raíz
Internamente, `whatsapp-web.js` (`Client.js`) establece un límite por defecto de 30 segundos (`authTimeoutMs: 30000`). Si la sincronización inicial de claves o el escaneo del QR toma más de 30 segundos, la librería lanza un rechazo de promesa no capturado con el string literal `'auth timeout'`. En Node.js 20+, cualquier promesa rechazada no controlada aborta el proceso de forma inmediata.

### 🟢 Solución Implementada
* **Ampliación del tiempo de autenticación**:
  Se configuró `authTimeoutMs: 180000` (3 minutos completos) y `qrMaxRetries: 5` tanto en `bot.js` como en `obtener_grupos.js`.
* **Escudo global contra caídas de Node**:
  Se implementaron listeners globales de `process.on('unhandledRejection')` y `process.on('uncaughtException')` que filtran y neutralizan los eventos transitorios internos de la librería sin detener la aplicación.

---

## 4. Error: net::ERR_NAME_NOT_RESOLVED y net::ERR_TIMED_OUT

### 🔴 Síntoma
```text
[09:16:42 p.m.] Iniciando motor de WhatsApp y Chrome... [Intento 1/3]
Error de arranque (intento 1): net::ERR_TIMED_OUT at https://web.whatsapp.com/
Error de arranque (intento 2): net::ERR_NAME_NOT_RESOLVED at https://web.whatsapp.com/
Error de arranque (intento 3): net::ERR_NAME_NOT_RESOLVED at https://web.whatsapp.com/
Error fatal al arrancar el bot: net::ERR_NAME_NOT_RESOLVED
```

### 🔬 Causa Raíz
Una caída temporal de la conexión a Internet o un fallo momentáneo del resolvedor DNS de Windows impidió que Chromium resolviera el dominio `web.whatsapp.com`. Como el bot reintentaba cada 5 segundos fijos, consumió sus 3 intentos en menos de 2 minutos y finalizó con código de error 1.

### 🟢 Solución Implementada
* **Módulo `asegurarConexionInternet`**:
  Antes de iniciar Chrome y al capturar errores de red (`ERR_NAME_NOT_RESOLVED`, `ERR_TIMED_OUT`, `ERR_INTERNET_DISCONNECTED`), el bot ejecuta una comprobación activa de conectividad.
* Si no hay internet, el bot suspende el arranque sin consumir intentos, avisando:
  `🌐 Sin conexión con web.whatsapp.com o fallo temporal de DNS. Esperando a que el servicio se restablezca...`
  En cuanto la red vuelve, el bot reanuda el arranque limpiamente.

---

## 5. Error: TIMEOUT_AUTENTICACION en bucle (3 minutos por intento)

### 🔴 Síntoma
```text
[09:29:52 p.m.] Iniciando motor de WhatsApp y Chrome... [Intento 1/3]
Error de arranque (intento 1): TIMEOUT_AUTENTICACION
[09:33:00 p.m.] Iniciando motor de WhatsApp y Chrome... [Intento 2/3]
Error de arranque (intento 2): TIMEOUT_AUTENTICACION
[09:36:13 p.m.] Iniciando motor de WhatsApp y Chrome... [Intento 3/3]
Error de arranque (intento 3): TIMEOUT_AUTENTICACION
```

### 🔬 Causa Raíz
Los archivos de sesión guardados en `.wwebjs_auth` quedaron en un estado corrupto o desincronizado (a raíz de un cierre forzado previo o un corte de red). WhatsApp Web no emitía el evento `qr` (porque detectaba una sesión existente), pero tampoco alcanzaba el evento `ready` (quedaba atascado en pantalla de carga o buscando el celular). Al cabo de 3 minutos, expiraba el temporizador `TIMEOUT_AUTENTICACION` y repetía el fallo con la misma sesión rota.

### 🟢 Solución Implementada
* **Auto-Curación de Sesiones (Self-Healing)**:
  Si el intento 1 falla por `TIMEOUT_AUTENTICACION`, el bot detecta que la sesión guardada está desincronizada y ejecuta automáticamente `eliminarSesionCorrupta()`. En el intento 2, Chromium abre una sesión limpia y genera de inmediato un **código QR nuevo y visible** en la terminal.
* **Telemetría y Watchdog de Celular**:
  Se añadieron escuchadores para `loading_screen` (mostrando el progreso `⏳ Sincronizando: 45%...`) y un centinela que detecta si WhatsApp Web muestra el banner "Teléfono sin conexión", advirtiendo al usuario:
  `📱 Tu celular parece no tener internet o WhatsApp está cerrado. Abre WhatsApp en tu teléfono.`

---

## 6. Problema: Grupos sin nombre en la extracción ([Sin asunto - ID: ...])

### 🔴 Síntoma
Al extraer grupos, varios aparecían con el texto `[Sin asunto - ID: 1203630...]`, impidiendo reconocer qué grupo era para decidir si ignorarlo o mantenerlo.

### 🔬 Causa Raíz
En WhatsApp Web, los metadatos de grupos que no han tenido actividad reciente no se cargan por completo en la memoria inmediata de `Chat.models`. Por lo tanto, `chat.name` y `chat.formattedTitle` retornaban valores vacíos o nulos.

### 🟢 Solución Implementada
* **Resolución Multinivel de Nombres**:
  1. Consulta en `WAWebCollections.GroupMetadata` y `WAWebCollections.Contact`.
  2. Búsqueda forzada mediante `GroupCol.update(wid)` en el cliente web.
  3. Consulta profunda en Node.js vía `cliente.getChatById(g.id)` con timeout de 4.5s.
  4. Si el grupo realmente no tiene asunto configurado por sus creadores, se extraen los primeros 35 caracteres de la **descripción del grupo** o el **número del creador + cantidad de miembros** (ejemplo: `[Sin asunto - Desc: "Grupo oficial de ventas..."]`).

---

## 7. Error: Bloqueo de procesos y archivos Lockfile (SingletonLock, 4294967295)

### 🔴 Síntoma
```text
Failed to launch the browser process!
Opening in existing browser session.
```

### 🔬 Causa Raíz
Procesos residuales o "zombies" de `chrome.exe` mantenían abiertos descriptores de archivo en `.wwebjs_auth/session/SingletonLock` o `DevToolsActivePort`, impidiendo que una nueva instancia de Puppeteer tomara control de la carpeta.

### 🟢 Solución Implementada
* **Módulo `prepararEntornoSesion`**:
  Antes de iniciar `bot.js` u `obtener_grupos.js`, el script:
  1. Comprueba que el script opuesto no esté corriendo en simultáneo.
  2. Finaliza procesos zombies de Chrome asociados a la ruta del bot.
  3. Elimina de forma segura los archivos `lockfile`, `SingletonLock`, `SingletonCookie`, `SingletonSocket` y `DevToolsActivePort`.

---

## 8. Buenas Prácticas para evitar retardos y bloqueos de cuenta

Para que los mensajes se entreguen al instante y tu número permanezca seguro:

1. **Mantén tu teléfono celular activo y conectado a WiFi**:
   Asegúrate de que WhatsApp no tenga restricciones de "Ahorro de batería" en los ajustes de Android/iOS.
2. **Usa `waitUntilMsgSent: true`**:
   Garantiza que el bot confirme con los servidores de WhatsApp que cada mensaje fue transmitido antes de iniciar la cuenta regresiva hacia el próximo grupo.
3. **Respeta los descansos orgánicos configurados**:
   Los tiempos de espera de 15 a 25 segundos y las pausas escalonadas cada 5, 10 y 20 grupos emulan comportamiento humano y evitan que Meta someta tu cuenta a revisiones automáticas.
4. **Si una sesión se desincroniza**:
   Simplemente ejecuta `reiniciar_sesion.bat` para limpiar los archivos temporales y escanear un código QR limpio.
