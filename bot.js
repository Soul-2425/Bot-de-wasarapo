// IMPORTANTE: Código principal del bot para WINDOWS - VERSIÓN BLINDADA DEFINITIVA.
// 1. Bypass Absoluto de Memoria (Evade el error "r" de Meta).
// 2. Uso de ejecutable local de Chrome (Evita cuelgues de Puppeteer).
// 3. Sistema Anti-Fuga de Memoria (Cursor IDB — sin cargar todo en RAM).
// 4. FAILSAFE: timeout 30s por grupo, skip automático, recuperación de Chrome.
// 5. 🔥 Súper Limpiador (Ignora emojis y fuentes raras al buscar grupos).

// ================================================================
// 🛡️ VERIFICACIÓN DE MEMORIA Y RECOLECTOR DE BASURA (GC)
// Optimizado para operar con bajo consumo de RAM (< 1 GB)
// ================================================================
const v8 = require('v8');
const path = require('path');
const ramMB = Math.round(v8.getHeapStatistics().heap_size_limit / (1024 * 1024));
const gcDisponible = typeof global.gc === 'function';

console.log(`✅ Memoria Node.js asignada: ${ramMB} MB (Límite optimizado)`);
if (gcDisponible) {
    console.log(`✅ Recolector de basura activo (--expose-gc): la RAM se liberará en cada descanso.`);
} else {
    console.log(`ℹ️ Tip: Ejecuta con iniciar.bat o usa --expose-gc para máxima liberación de RAM.`);
}

const CONFIGURACION = {
    textosPorCiclo: [
        [ // Grupo 1
            "Sabemos cuánto te esfuerzas por tu negocio todos los días. Por eso, creamos páginas web que realmente le hacen justicia a tu trabajo. Nada de moldes repetidos: un diseño a tu medida, pensado para que conectes con tus clientes. ¿Hablamos de tu idea? Para su total seguridad y tranquilidad, acepto realizar el trato a través del administrador del grupo.",
            "Tu emprendimiento tiene una personalidad única y tu web debería gritarlo a los cuatro vientos. En The Rose Group nos sentamos a escuchar qué buscas y diseñamos exactamente lo que tu negocio necesita. Simple, transparente y a tu medida. Con el fin de garantizar una transacción segura, acepto la intermediación del administrador del grupo.",
            "Tener un gran producto o servicio es el primer paso. El segundo es que el mundo lo vea como se merece. Te ayudamos a darle a tu negocio ese hogar digital perfecto con una página web hecha cien por ciento para ti. Como garantía de confianza, estoy dispuesto a gestionar el trato mediante el administrador de este grupo.",
            "Dale a tu proyecto ese empujón que le falta. Si sientes que es momento de tener una página web que de verdad transmita la calidad de lo que haces, estamos aquí para diseñarla juntos. Escríbenos y le damos forma. Para su mayor comodidad y seguridad, acepto concretar el trato utilizando al administrador como intermediario.",
            "Detrás de tu negocio hay mucho corazón, y queremos que tu presencia en internet transmita exactamente eso. Diseñamos tu página web a la medida para que tu emprendimiento brille y tú te preocupes solo por atender a tus nuevos clientes. Garantizo la total transparencia del proceso aceptando al administrador del grupo como intermediario del trato."
        ],
        [ // Grupo 2
            "Tu negocio nació de una gran idea; ahora necesita el espacio digital para crecer. Diseñamos la página web que tu proyecto merece: profesional, única y 100% a tu medida. ¡Hagámoslo realidad! Para su total seguridad y tranquilidad, acepto realizar el trato a través del administrador del grupo.",
            "Tu emprendimiento no es uno del montón, tu página web tampoco debería serlo. En The Rose Group creamos sitios web a la medida que reflejan la verdadera calidad de lo que ofreces. ¿Hablamos? Con el fin de garantizar una transacción segura, acepto la intermediación del administrador del grupo.",
            "Sabemos lo mucho que cuidas tu negocio todos los días. Déjanos cuidar su imagen en internet. Diseñamos tu página web a la medida para que conectes con tus clientes de forma profesional y segura. Como garantía de confianza, estoy dispuesto a gestionar el trato mediante el administrador de este grupo.",
            "Dale a tu proyecto el impulso digital que está pidiendo. Diseñamos tu página web desde cero, entendiendo lo que haces y destacando lo mejor de tu negocio ante el mundo. Para su mayor comodidad y seguridad, acepto concretar el trato utilizando al administrador como intermediario.",
            "Muestra a tus clientes el verdadero nivel de tu trabajo. Construimos la página web perfecta para tu negocio, hecha a la medida de tus objetivos. Tú pones el talento, nosotros la tecnología. Garantizo la total transparencia del proceso aceptando al administrador del grupo como intermediario del trato."
        ],
        [ // Grupo 3
            "Tu negocio merece estar en internet, pero no de cualquier forma. En The Rose Group diseñamos páginas web a la medida que capturan la esencia de tu trabajo y atraen a las personas correctas. Escríbenos por mensaje directo y empecemos a darle vida a tu idea hoy mismo. Para su total seguridad y tranquilidad, acepto realizar el trato a través del administrador del grupo.",
            "Le pones el alma a tu emprendimiento a diario, deja que nosotros nos encarguemos de tu vitrina digital. Creamos tu página web a la medida para que luzca tan profesional y confiable como tu servicio. Haz clic en el enlace y cuéntanos qué tienes en mente. Con el fin de garantizar una transacción segura, acepto la intermediación del administrador del grupo.",
            "La mejor carta de presentación para tu negocio es una web que hable por ti. Nos sentamos a escuchar tu visión y diseñamos un sitio único que realmente conecte con tus futuros clientes. Envíanos un mensaje y agendemos una charla breve para conocernos. Como garantía de confianza, estoy dispuesto a gestionar el trato mediante el administrador de este grupo.",
            "No necesitas ser un experto en tecnología para tener una presencia online increíble. Nosotros nos encargamos de todo el diseño a la medida mientras tú te enfocas en lo que mejor sabes hacer: hacer crecer tu negocio. Toca el botón de abajo y descubre cómo podemos ayudarte. Para su mayor comodidad y seguridad, acepto concretar el trato utilizando al administrador como intermediario.",
            "Un gran proyecto necesita un espacio digital que lo respalde. Construimos tu página web a la medida, paso a paso y asegurándonos de transmitir la verdadera calidad de tu marca. Hablemos de tu negocio; déjanos un comentario o un mensaje para comenzar. Garantizo la total transparencia del proceso aceptando al administrador del grupo como intermediario del trato."
        ],
        [ // Grupo 4
            "Tu negocio merece verse tan profesional como el esfuerzo que le pones a diario. Diseñamos tu web a la medida para que conectes con más clientes. ¡Escríbenos y empecemos hoy! Para su total seguridad y tranquilidad, acepto realizar el trato a través del administrador del grupo.",
            "Tu emprendimiento es único y tu página web también debería serlo. En The Rose Group diseñamos a tu medida, sin moldes repetidos. Envíame un mensaje y le damos forma a tu idea. Con el fin de garantizar una transacción segura, acepto la intermediación del administrador del grupo.",
            "Tú concéntrate en atender a tus clientes, nosotros nos encargamos de tu página web. Un diseño a la medida, humano y profesional. ¡Contáctanos! Como garantía de confianza, estoy dispuesto a gestionar el trato mediante el administrador de este grupo.",
            "La primera impresión en internet lo es todo. Dale a tu marca el hogar digital que se merece con un diseño 100% a la medida. ¡Contáctanos y cuéntanos qué necesitas! Para su mayor comodidad y seguridad, acepto concretar el trato utilizando al administrador como intermediario.",
            "Es momento de que tu trabajo llegue a más personas. Creamos la página web perfecta para tu negocio, adaptada a tus objetivos reales. Déjanos un comentario y te asesoramos. Garantizo la total transparencia del proceso aceptando al administrador del grupo como intermediario del trato."
        ],
        [ // Grupo 5
            "Que tu página web te haga sentir tan orgulloso como tu propio negocio. En The Rose Group diseñamos tu sitio a la medida para destacar lo mejor de ti. ¡Escríbenos y hagamos equipo! Para su total seguridad y tranquilidad, acepto realizar el trato a través del administrador del grupo.",
            "Tú nos cuentas la visión de tu emprendimiento y nosotros la convertimos en una página web profesional. Sin lenguaje técnico, 100% a tu medida. Mándanos un mensaje y empecemos hoy. Con el fin de garantizar una transacción segura, acepto la intermediación del administrador del grupo.",
            "Atrae a las personas correctas con una imagen digital impecable. Construimos la página web que tu negocio necesita para conectar y crecer de verdad. Haz clic aquí y hablemos de tu proyecto. Como garantía de confianza, estoy dispuesto a gestionar el trato mediante el administrador de este grupo.",
            "¿Listo para dar el siguiente gran paso? Dale a tu emprendimiento el espacio en internet que realmente merece con un diseño web a la medida. ¡Contáctanos y te asesoramos paso a paso! Para su mayor comodidad y seguridad, acepto concretar el trato utilizando al administrador como intermediario.",
            "No dejes tu presencia digital para después. Tu negocio necesita hoy una página web que transmita confianza, cercanía y profesionalismo. Déjanos un DM y le damos vida a tu idea. Garantizo la total transparencia del proceso aceptando al administrador del grupo como intermediario del trato."
        ]
    ],
    rutaImagen: path.join(__dirname, 'oferta.png'), 
    tiempoEsperaMinSegundos: 12,       // ⏱️ Espera mínima entre grupos (Protección anti-spam/baneo)
    tiempoEsperaMaxSegundos: 15,       // ⏱️ Espera máxima entre grupos (Varía aleatoriamente entre 12 y 15s)
    tiempoMaximoEnvioSegundos: 60,     // ⏱️ Tiempo límite para enviar (aumentado para conexiones lentas)
    horasDeEsperaEntreCiclos: [
        0, 1.5, 1.5, 1.5, 1.5
    ],
    gruposDestino: [
        "120363408267789482@g.us|||Prueba1",
        "120363042974800849@g.us|||𝗖/𝗩 𝗬𝗔𝗦𝗛𝗢𝗢𝗣🩷🍓",
        "120363115628942058@g.us|||🇲🇽 𝕯𝖆𝖋𝖓𝖊𝖘𝖎𝖙𝖆 𝖝 𝕱𝖗𝖆𝖓𝖈𝖎𝖘𝖈𝖔☁️",
        "120363136809056673@g.us|||V/C FF & PLATAFORMAS• EDDY •",
        "120363138064928259@g.us|||𝑪/𝑽 𝑹𝒐𝒄𝒊𝒐 𝑭𝒍𝒐𝒓𝒆𝒔 🌸🛍️",
        "120363162602510103@g.us|||💞🔥 C/V HELLO KITTY. 9 🔥💞😘🫣❤️‍🔥",
        "120363169615208363@g.us|||HIY4",
        "120363177393506456@g.us|||𝑩𝒂𝒓𝒃𝒊𝒆 — 𝑭𝒙𝒏𝒂𝒔 𝒚 𝑽𝒆𝒏𝒕𝒙𝒔 💕",
        "120363193881338585@g.us|||LINDA VENTAS #1 🌸",
        "120363199562642400@g.us|||V ÁNGEL RIVERA",
        "120363200747091983@g.us|||𝐋𝐀 𝐑𝐄𝐀𝐋𝐄𝐙𝐀",
        "120363219797169194@g.us|||Nami #3",
        "120363220794567476@g.us|||🐾𝙲/𝚅  𝙻ｉ𝚋ｒ𝚎 ³🐾",
        "120363230867518399@g.us|||𝐂/𝐕 𝐆𝐫𝐢𝐬𝐢 𝐕𝐧𝐭𝐬. #2 💜🫧",
        "120363239412740780@g.us|||V/C Flavisitaa.",
        "120363272174855938@g.us|||𝘾/𝙑 𝙋𝘼𝙉𝘽𝙐𝙉𝙉𝙔 🫧",
        "120363278356883579@g.us|||C/V YU X CRI 👻",
        "120363288738906992@g.us|||𝗖/𝗩 𝗗𝗘𝗡𝗜 𝗩𝗘𝗡𝗧𝗦",
        "120363290216390315@g.us|||🔮 𝑪/𝑽 𝑺𝑻𝑹𝑿𝑵𝑮𝑬𝑬 ²",
        "120363292261913524@g.us|||KEYNER REYES  2",
        "120363297224657755@g.us|||𝐂/𝐕 𝐋𝐈𝐁𝐑𝐄 𝐆𝐀𝐄𝐓𝐀²",
        "120363306026998175@g.us|||ꕥꔛ ིྀ KᗩᕼOᗷY  ིྀꕥꔛ",
        "120363310352420405@g.us|||(sin nombre)",
        "120363312118117713@g.us|||Tumbado #1",
        "120363319964639289@g.us|||𝑪/𝒗 𝑳𝑴𝑱𝑫",
        "120363328518219196@g.us|||FRANGEL VXNTAS 1",
        "120363333100560978@g.us|||Nami #2",
        "120363334286256785@g.us|||VALY x XELY",
        "120363334465139678@g.us|||COMUNIDAD FF 🇲🇽🇨🇴🇺🇸",
        "120363350391458365@g.us|||C/VBloom Store2.0🛍️",
        "120363355157727197@g.us|||VAZZ C/V",
        "120363368803202576@g.us|||💗 𝑽/𝑳 𝑴𝒂𝒅𝒆𝑺𝒉𝒐𝒑 💗",
        "120363370353077896@g.us|||𝐂/𝐕 🇲🇽𝐀𝐍𝐆𝐄𝐋𝐎 𝐗 𝐅𝐑𝐀𝐍𝐂𝐈𝐒𝐂𝐎🇲🇽",
        "120363373741425245@g.us|||KEYNER REYES 1",
        "120363380213665536@g.us|||🤹🏿‍♀️FUCKING VIBES #2💗",
        "120363382481907714@g.us|||C/V JHOSTINN RXX ¹",
        "120363384897062152@g.us|||𝗡𝗔𝗫𝗫 𝗞𝗔𝗧𝗧 🛍✨️",
        "120363391451324239@g.us|||(sin nombre)",
        "120363391710117651@g.us|||🌸VENTA LIBRE🌸",
        "120363392380364326@g.us|||Nami #4",
        "120363395219762204@g.us|||C/V LIBRE FREE/ROBLOX SARA-EDUARDO 1 💗",
        "120363398979797504@g.us|||C/V Libre MxA🦥",
        "120363399531716045@g.us|||V LIBRE C/V - by Menaa ෆ",
        "120363400394724414@g.us|||REYES&LEX⚜️",
        "120363400908681371@g.us|||Grupo De Provedores Y Comis Legales 💯 ☀️☀️🌎🌟✨❤‍🩹",
        "120363401026203810@g.us|||🍒• VENTA LIBRE CHERRYCITA",
        "120363401051624807@g.us|||C/V TESSA 🍓💕",
        "120363401722728864@g.us|||GAMER ZONE STORE 2",
        "120363401960898259@g.us|||VENTA LIBRE SAM x ARI",
        "120363402245799886@g.us|||Cv Valky X Roger",
        "120363402595320791@g.us|||Alex × Jared",
        "120363402752780142@g.us|||#2 MAO",
        "120363402771601119@g.us|||C/V FRANGEL VXNTAS²",
        "120363402779573840@g.us|||JUZAX C/V",
        "120363403253358373@g.us|||𝙲/𝚅 𝙵𝙵 𝚂𝙷𝙾𝙿 𝙴𝙻𝙸𝚃𝙴",
        "120363403272827706@g.us|||C/V FRANGEL VXNTAS 4",
        "120363403580807126@g.us|||(sin nombre)",
        "120363403762816663@g.us|||𝑷𝑬𝑳𝑰𝑮𝑹𝑶 𝑵𝑨𝑪𝑰𝑶𝑵𝑨𝑳 𝑴𝑿",
        "120363403965328691@g.us|||𝐕𝐄𝐍𝐓𝐀𝐒 𝐘 𝐓𝐑𝐀𝐃𝐄𝐒 𝟔𝟔𝟔",
        "120363404651640695@g.us|||C/V YAHIR #2 🌴",
        "120363404767932462@g.us|||FF CHERRY BLOOSOM⋆𝜗𝜚˚⋆",
        "120363404847147858@g.us|||C/V DANIEL × JARED",
        "120363405285960658@g.us|||𝐕/𝐋𝐢𝐛𝐫𝐞 𝐐𝐮𝐞𝐬𝐨🐹💜",
        "120363405430877071@g.us|||- ̗̀↳❀ 𝐂/𝐕 𝐛𝐲 𝐁𝐥𝐨𝐱 #1",
        "120363405560137101@g.us|||𝑪/𝑽 𝑪𝒙𝒔𝒑𝒆𝒓 𝑽𝒙𝒏𝒕𝒂𝒔.²👻",
        "120363405637249092@g.us|||#1 MAO",
        "120363405858368005@g.us|||𝐂𝐎𝐌𝐏𝐑𝐀𝐒 𝐕𝐈𝐏 𝐌𝐗",
        "120363405864973804@g.us|||𝚂𝚄𝙿𝚁𝙴𝙼 𝙰𝙳𝙼   𝚅/𝙻 𖠌",
        "120363405982484476@g.us|||𝐂/𝐕 𝐈𝐬𝐦𝐚𝐞𝐥 𝐕𝐞𝐧𝐭𝐚𝐬 #𝟏 🇲🇽",
        "120363406031060750@g.us|||C/V FRANGEL VXNTA 3",
        "120363406104549662@g.us|||🐾𝙲/𝚅  𝙻ｉ𝚋ｒ𝚎²🐾",
        "120363406112936960@g.us|||🛍️ CAR³ VENTA LIBRE ✓",
        "120363406189476586@g.us|||C V L1BRE MEL",
        "120363406466490084@g.us|||JUZAX C/V2",
        "120363406624446373@g.us|||✿︎𝙑/𝘾 𝙇𝙞𝙗𝙧𝙚 𝘿𝙞𝙥𝙥𝙞𝙣💸",
        "120363406651158993@g.us|||(sin nombre)",
        "120363406750133973@g.us|||V/C FREE FIRE 🛍️",
        "120363406828200086@g.us|||🛍️ CAR VENTA LIBRE ✓",
        "120363406842062620@g.us|||🛍️ CAR² VENTA LIBRE ✓",
        "120363406917440313@g.us|||𝐶/𝑉🇲🇽 𝐹𝑟𝑎𝑛𝑐𝑖𝑠𝑐𝑜 𝑀𝑎𝑟𝑡𝑖𝑛𝑒𝑧",
        "120363407172089664@g.us|||🔥Ｂ Λ Ｂ ϟ ᴴᴼᵀ oficial🔥",
        "120363407246774413@g.us|||🤹🏿‍♀️FUCKING VIBES #5💗🎀",
        "120363425062282984@g.us|||Prueba2",
        "120363407273117542@g.us|||C/V Xime",
        "120363407372906032@g.us|||Cv nana y may",
        "120363407395415671@g.us|||𝑪/𝑽 𝑴𝑲𝑺, 𝑭𝑭, 𝑹𝑶𝑩𝑳𝑶𝑿 𝒀 𝑬𝑻𝑪. ² 🐒🍌",
        "120363407405367403@g.us|||Alex × Jared 2",
        "120363407409583551@g.us|||LAS OVEJAS PERDIDAS DE DIOS",
        "120363407461823469@g.us|||𝐕/𝐋 𝐂𝐑𝐈𝐒𝐒 𝐗 𝐉𝐀𝐑𝐄𝐃²",
        "120363407676611027@g.us|||(sin nombre)",
        "120363407777180468@g.us|||𝐂/𝐕 𝐋𝐈𝐁𝐑𝐄 𝐆𝐀𝐄𝐓𝐀 𝐗 𝐕𝐄𝐋𝐊",
        "120363407785307837@g.us|||𝐂/𝐕 𝐂𝐫𝐢𝐬𝐬 𝐗 𝐆𝐞𝐧𝐞𝐬𝐢𝐭𝐚⁴ ⋆",
        "120363407871090506@g.us|||🎀•𝐕/𝐋𝐢𝐛𝐫𝐞 𝐌𝐨𝐧𝐭𝐬𝐢𝐢²•🎀",
        "120363408147257810@g.us|||🔥 𝐓𝐡𝐞 𝐌𝐗 𝐂/𝐕 ⁹🔥",
        "120363408147937292@g.us|||FF GAMER STORE",
        "120363408167525603@g.us|||🥷🏿 𝔾𝕌𝔸ℝ𝕀𝔻𝔸 07🥷🏿 C/V LIBRE",
        "120363408681440069@g.us|||UNKNOW",
        "120363408741815757@g.us|||𝐁𝐋𝐀𝐂𝐊 𝐌𝐄𝐗𝐈𝐂𝐎",
        "120363408843308810@g.us|||🔗 ENLACE D VENTA LIBRE 🛍️",
        "120363409078358937@g.us|||🌸👸💎V/L GAMING DARYN👑💯💥💎",
        "120363409247997438@g.us|||𝗟𝗔𝗦 𝗚𝗢𝗥𝗗𝗔𝗦 𝗗𝗘𝗟 𝗔𝗡𝗧𝗥𝗢 𝗠𝗫",
        "120363409668585033@g.us|||𝙍𝙀𝙄𝙉𝙊 𝙈𝙀𝙓𝘼",
        "120363409670926234@g.us|||Mari x Mari 🌟",
        "120363410835529695@g.us|||𝐕/𝐋𝐢𝐛𝐫𝐞 𝐐𝐮𝐞𝐬𝐨³🐹💜",
        "120363411253033579@g.us|||(sin nombre)",
        "120363411460972317@g.us|||𝙎𝙪𝙥𝙧𝙚𝙢ت︎𝙏𝙓 𝘾/𝙈",
        "120363411692301695@g.us|||💠 𝑪/𝑽¹ ┇ 𝑨𝒏𝒈𝒆𝒍³ × 𝑻𝒉𝒂𝒍𝒐𝒓² ┇ 🦖",
        "120363412393132275@g.us|||C/V Adri #4",
        "120363412411329624@g.us|||𝑪/𝑽 𝑪𝒙𝒔𝒑𝒆𝒓 𝑽𝒙𝒏𝒕𝒂𝒔.⁴👻",
        "120363412787686453@g.us|||𝐕𝐞𝐧𝐭𝐚 𝐋𝐢𝐛𝐫𝐞 / ⭐️ (𝟔)",
        "120363418141880396@g.us|||KEYNER REYES 4",
        "120363418356564563@g.us|||LINDA VENTAS #2 🌸",
        "120363418384138064@g.us|||COMPRAS  50% VENTA LIBRE 🍀",
        "120363418896702803@g.us|||🤹🏿‍♀️FUCKING VIBES #1💗🎀",
        "120363419225068617@g.us|||Davhi store  ( C/V FF )",
        "120363419266198558@g.us|||COMPRA/VENTA NOTZ KING 5",
        "120363419302262684@g.us|||LINDA VENTAS #3 🌸",
        "120363419635283595@g.us|||Nami #1",
        "120363420143251159@g.us|||(sin nombre)",
        "120363420575764447@g.us|||Pollos asados Nex",
        "120363420789288426@g.us|||General",
        "120363420831104125@g.us|||C/v Marian ³🌸",
        "120363421265761079@g.us|||C/V KEVIN VENTAS",
        "120363421332803708@g.us|||𝔼𝕃𝔼ℕ𝕀𝕋𝔸 & 𝕄𝔼𝕏𝕀ℂ𝔸ℕ𝕆 𝕊ℍ𝕆ℙ",
        "120363421668548150@g.us|||C/V LIBRE ANNY 2 🫧🎀.",
        "120363421780131127@g.us|||𝐂/𝐕 𝐦𝐱𝐫𝐢𝐚𝐦 𝐯𝐧𝐭𝐬🪼🫧",
        "120363422309667058@g.us|||🪻✨𝐂/𝐕 𝐈𝐭𝐚𝐥𝐢𝐚 𝟑/𝟑✨🪻",
        "120363422478182211@g.us|||C/VBloom Store🛍️",
        "120363422657687256@g.us|||C/V Libres    GIA V",
        "120363422760207014@g.us|||𝐶/𝑉 𝑀𝑜𝑟𝑜 𝑆𝑡𝑢𝑑𝑖𝑜 🎀",
        "120363423022710640@g.us|||𝑪/𝑽 𝑪𝒙𝒔𝒑𝒆𝒓 𝑽𝒙𝒏𝒕𝒂𝒔.¹👻",
        "120363423070733316@g.us|||𝘾/𝙑 # 1",
        "120363423180303109@g.us|||SHXP X STEAL 🌸",
        "120363423201849958@g.us|||𝐕/𝐋 𝐂𝐫𝐢𝐬𝐬 𝐆𝐥𝐳 𝟐.𝟎 🎀",
        "120363423245113975@g.us|||C/V PACHIS 🦖",
        "120363423287635092@g.us|||C/V MARIAN x TESSA",
        "120363423362016723@g.us|||C/V LIBRE BY ANNY 🫧🎀.",
        "120363423403265932@g.us|||💫 C/V MARIANA 𝟐 💫",
        "120363423473821743@g.us|||R Vnts C/V 🔥",
        "120363423584448400@g.us|||Nex Grupo",
        "120363423673343983@g.us|||C/V LIBRE LOORI  x FLOWER 🌱",
        "120363423746234672@g.us|||C/V YAHIR #1 🌴",
        "120363423989126936@g.us|||𝐂/𝐕 𝐋𝐈𝐁𝐑𝐄 𝐆𝐀𝐄𝐓𝐀 𝐗 𝐕𝐄𝐋𝐊²",
        "120363424307115459@g.us|||🐾𝙲/𝚅  𝙻ｉ𝚋ｒ𝚎¹🐾",
        "120363424364866226@g.us|||𝑪/𝑽 𝑪𝒙𝒔𝒑𝒆𝒓 𝑽𝒙𝒏𝒕𝒂𝒔.⁵👻",
        "120363424476659145@g.us|||C/V ANDRXS VNTS",
        "120363424522453392@g.us|||🤴🏽¹ C/V Jesús_ventxs_ff 🎮",
        "120363424564353082@g.us|||𝑪/𝑽 𝑪𝒙𝒔𝒑𝒆𝒓 𝑽𝒙𝒏𝒕𝒂𝒔.³👻",
        "120363424651671393@g.us|||𝑪/𝑽 𝑪𝒙𝒔𝒑𝒆𝒓 𝑽𝒙𝒏𝒕𝒂𝒔.⁶👻",
        "120363424696200884@g.us|||(sin nombre)",
        "120363424829132911@g.us|||✿︎𝙑/𝘾 𝙇𝙞𝙗𝙧𝙚 𝘿𝙞𝙥𝙥𝙞𝙣💸 ²",
        "120363424991559810@g.us|||PROYECT FIFTY SEVEN 🇨🇴⚡️💸🐐",
        "120363424999787392@g.us|||C/V YERSON VENTAS 🙌🏽!!",
        "120363425004888122@g.us|||Crew Free Fire C/v",
        "120363425056394120@g.us|||𝑺𝒆𝒓𝒗𝒊𝒄𝒆𝒔 𝑨𝒛𝒌",
        "120363425106655136@g.us|||𝐂/𝐕 𝐄𝐋 𝐅𝐎𝐂𝐊𝐈𝐍𝐆 𝐃𝐄𝐋𝐓∆ ¹",
        "120363425153465480@g.us|||ZONA C/V",
        "120363425507314590@g.us|||𝑪/𝑽 𝑪𝒙𝒔𝒑𝒆𝒓 𝑽𝒙𝒏𝒕𝒂𝒔.⁷👻",
        "120363425548378766@g.us|||C/V XIMENITA",
        "120363425583120649@g.us|||𝙑/𝘾 𝙁𝙍𝙀𝙀 𝙁𝙄𝙍𝙀 𝙉𝘼𝙏 🎀",
        "120363425668205503@g.us|||𝘾/𝙑 𝙈𝘼𝙉𝙐𝙀𝙇 𝙎𝙏𝙊𝙍𝙀 𝙂𝙍𝙐𝙋𝙊 𝙊𝙁𝙄𝘾𝙄𝘼𝙇🇻🇪",
        "120363425753216762@g.us|||C/V FREE X YUYA ❀",
        "120363425977717252@g.us|||V/C LIBRE AYLIN ² 🐰",
        "120363426124991806@g.us|||✦ 『𝑪/𝑽』𝑨𝒏𝒈𝒆𝒍¹ 🦖",
        "120363426347671220@g.us|||𝐕/𝐋 𝐌𝐚𝐫𝐢 𝐱 𝐆𝐥𝐳💗",
        "120363426349487546@g.us|||🤹🏿‍♀️FUCKING VIBES #3💗",
        "120363426425019468@g.us|||𝙀𝙇 𝙄𝙈𝙋𝙀𝙍𝙄𝙊",
        "120363426555302860@g.us|||C/V 🎀Flavisita🎀",
        "120363426745082364@g.us|||𝐁𝐋𝐀𝐂𝐊𝐒𝐇𝐎𝐏 𝐑𝐄𝐍𝐀𝐂𝐈𝐃𝐎 🦥🇲🇽",
        "120363426766895700@g.us|||𝐕/𝐋 𝐉𝐀𝐑𝐄𝐃 𝐗 𝐂𝐑𝐈𝐒𝐒",
        "120363426944125138@g.us|||𝐅𝐎𝐑𝐂𝐄 𝐌𝐄𝐗𝐈𝐂𝐎",
        "120363427032698117@g.us|||(sin nombre)",
        "120363427241114239@g.us|||🤹🏿‍♀️FUCKING VIBES #4💗🎀",
        "120363427326355428@g.us|||C/V LIBRE 🛍️ BY MENAAA²",
        "120363427461510973@g.us|||C/V NICKYSITA",
        "120363427824863186@g.us|||🌹 𝑪/𝑽¹ ┇ 𝑨𝒏𝒈𝒆𝒍² × 𝑻𝒉𝒂𝒍𝒐𝒓¹ ┇ 🦖",
        "120363427873617995@g.us|||𝓔𝓵 𝔯𝔦𝔫𝔠𝔬𝔫 𝔡𝔢 𝔩𝔬𝔰 𝔞𝔟𝔰𝔱𝔯𝔞𝔦́𝔡𝔬𝔰",
        "120363427932174145@g.us|||🏃‍♀️VIRTUZ🏃‍♂️V/L",
        "120363427935457996@g.us|||𝓥 /𝓒 𝓐𝓵𝓮𝓬𝓲𝓽𝓪",
        "120363428154074222@g.us|||𝘊/𝘷 𝘚𝘵𝘢𝘳𝘴 𝘧𝘧✨",
        "120363428194897811@g.us|||C/V FREE FIRE / ROBLOX2 ⭐️",
        "120363428380285349@g.us|||🛍️ CAR⁴ VENTA LIBRE ✓",
        "120363428858443799@g.us|||C/V FREE FIRE / ROBLOX 🇲🇽💚",
        "120363429043493174@g.us|||(sin nombre)",
        "120363429314390846@g.us|||𝐂/𝐕 𝐘𝐀𝐌𝐈 𝐗 𝐕𝐄𝐋𝐊",
        "120363429416534153@g.us|||✧ 𝑪/𝑽 ┇ 𝑮𝒂𝒆𝒕𝒂 × 𝑨𝒏𝒈𝒆𝒍¹²",
        "120363429428046172@g.us|||(sin nombre)",
        "120363429774169226@g.us|||C/V Adri #2",
        "120363429909073089@g.us|||🦖 『[C/V]』𖤍 Angel⁴ × Thalor³ 💎",
        "120363429914242715@g.us|||(sin nombre)",
        "120363408188715474@g.us|||Prueba3",
    ]

};

// ================================================================
// 📂 LEER GRUPOS DESDE ARCHIVO (mis_grupos.txt)
// Ejecuta obtener_grupos.js cuando quieras actualizar la lista.
// Si el archivo no existe, usa la lista hardcodeada de arriba.
// ================================================================
const rutaGrupos = path.join(__dirname, 'mis_grupos.txt');
try {
    const lineasArchivo = require('fs').readFileSync(rutaGrupos, 'utf8').split('\n');
    const gruposLeidos = [];
    let dentroDeBloque = false;
    for (const linea of lineasArchivo) {
        const limpia = linea.trim();
        if (limpia.includes('gruposDestino:') && limpia.includes('[')) {
            dentroDeBloque = true;
            continue;
        }
        if (dentroDeBloque) {
            if (limpia === ']' || limpia === '],') break;
            // Extraer nombre entre comillas
            if (limpia.startsWith('"') || limpia.startsWith("'")) {
                const nombre = limpia.replace(/^["']/, '').replace(/["'],?$/, '');
                if (nombre.length > 0) gruposLeidos.push(nombre);
            }
        }
    }
    if (gruposLeidos.length > 0) {
        CONFIGURACION.gruposDestino = gruposLeidos;
        console.log('\uD83D\uDCC2 Lista cargada desde mis_grupos.txt: ' + gruposLeidos.length + ' grupos.');
    } else {
        console.log('\u26A0\uFE0F  mis_grupos.txt sin formato valido - usando lista del codigo.');
    }
} catch (e) {
    console.log('\u26A0\uFE0F  mis_grupos.txt no encontrado - usando lista del codigo.');
}
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const readline = require('readline');

// ================================================================
// 💾 GESTIÓN DE ESTADO (Para auto-recovery en caso de crashes)
// ================================================================
const rutaEstado = path.join(__dirname, 'estado.json');

function cargarEstado() {
    try {
        if (fs.existsSync(rutaEstado)) {
            return JSON.parse(fs.readFileSync(rutaEstado, 'utf8'));
        }
    } catch (e) {
        console.log("⚠️ Error leyendo estado.json, se ignorará.");
    }
    return { cicloIndex: 0, gruposProcesados: [] };
}

function guardarEstado(cicloIndex, gruposProcesadosSet) {
    try {
        fs.writeFileSync(rutaEstado, JSON.stringify({
            cicloIndex: cicloIndex,
            gruposProcesados: Array.from(gruposProcesadosSet),
            timestamp: Date.now()
        }, null, 2));
    } catch(e) {}
}

function limpiarEstado() {
    try {
        if (fs.existsSync(rutaEstado)) fs.unlinkSync(rutaEstado);
    } catch(e) {}
}

const cliente = new Client({
    authStrategy: new LocalAuth(), 
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    puppeteer: {
        headless: true, 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',        
            '--no-zygote',
            '--disable-features=ServiceWorker',
            // ⚡ OPTIMIZACIONES DE MEMORIA RAM EN CHROME (Permite procesar adjuntos)
            '--js-flags=--max-old-space-size=512',   // Limita la memoria interna de Chrome a 512 MB
            '--renderer-process-limit=1',          // Limita a 1 subproceso de renderizado
            '--disable-extensions',
            '--disable-notifications',
            '--mute-audio',
            '--no-default-browser-check',
        ],
        timeout: 180000,        // 3 minutos para conexiones lentas
        protocolTimeout: 240000 // 4 minutos de protocol timeout
    }
});

// Variable global: detecta si la página está navegando activamente
let paginaNavegando = false;
let ultimaNavegacion = 0;

// 🔒 CANDADO: evita que el motor de envíos arranque dos veces si 'ready' se dispara más de una vez
let motorActivo = false;
// 🔒 CANDADO INTERCEPTOR: evita registrar el listener de requests más de una vez
let interceptorActivo = false;

function esperar(milisegundos) {
    return new Promise(resolve => setTimeout(resolve, milisegundos));
}

// Devuelve la hora actual en formato legible: [10:34:21 a.m.]
function hora() {
    return new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
}

function preguntarAlUsuario(pregunta) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(pregunta, (respuesta) => {
            rl.close();
            resolve(respuesta.trim().toLowerCase());
        });
    });
}

// 🔥 SUPER LIMPIADOR: Destruye emojis, cursivas, símbolos raros y espacios.
const limpiarTextoFuerte = (texto) => {
    if (!texto) return '';
    return texto.normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
        .replace(/[^a-zA-Z0-9]/g, '')    // Elimina emojis, espacios y símbolos
        .toLowerCase();
};

// ================================================================
// 🛑 SISTEMA DE DESCANSOS ESCALONADOS ANTI-BANEO
// 5 grupos  -> 30 segundos
// 10 grupos -> 1 minuto
// 20 grupos -> 2 minutos
// 40 grupos -> 4 minutos
// 50 grupos -> 5 minutos
// 100 grupos -> 10 minutos
// Los descansos se reinician en cada bloque de 50 (55, 60, 70, 90, 100...)
// ================================================================
function obtenerDescansoEscalonado(totalEnvios) {
    if (totalEnvios <= 0) return null;

    if (totalEnvios % 100 === 0) {
        return { segundos: 600, descripcion: "10 minutos (Hito de 100 grupos)" };
    }
    if (totalEnvios % 50 === 0) {
        return { segundos: 300, descripcion: "5 minutos (Hito de 50 grupos)" };
    }

    const pos = totalEnvios % 50;
    if (pos === 40) {
        return { segundos: 240, descripcion: "4 minutos (Pausa tras 40 grupos)" };
    }
    if (pos === 20) {
        return { segundos: 120, descripcion: "2 minutos (Pausa tras 20 grupos)" };
    }
    if (pos === 10 || pos === 30) {
        return { segundos: 60, descripcion: "1 minuto (Pausa tras 10 grupos)" };
    }
    if (pos % 5 === 0) {
        return { segundos: 30, descripcion: "30 segundos (Pausa tras 5 grupos)" };
    }

    return null;
}

// Espera a que la página de WhatsApp esté completamente estable
async function esperarEstabilidadDePagina() {
    // Si hubo una navegación reciente, esperar a que se asiente
    const ahora = Date.now();
    const tiempoDesdeUltimaNav = ahora - ultimaNavegacion;
    if (paginaNavegando || tiempoDesdeUltimaNav < 8000) {
        const espera = Math.max(8000 - tiempoDesdeUltimaNav, 1000);
        console.log(`⏳ Página navegando, esperando ${Math.round(espera/1000)}s para estabilizarse...`);
        await esperar(espera);
    }
}

// Lee grupos DIRECTAMENTE del IndexedDB de WhatsApp Web
// (bypasa el getChats() roto por incompatibilidad con WW 2.3000+)
async function obtenerChatsSeguro(clienteBase, intentos = 8) {
    for (let i = 1; i <= intentos; i++) {
        try {
            console.log(`⏳ [Intento ${i}/${intentos}] Leyendo grupos del IndexedDB...`);
            
            await esperarEstabilidadDePagina();
            await esperar(2000);
            
            // 🧠 CURSOR en lugar de getAll() — solo carga grupos en memoria, no todos los chats
            const grupos = await clienteBase.pupPage.evaluate(async () => {
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open('model-storage');
                    req.onerror = () => reject(new Error('No se pudo abrir model-storage: ' + req.error));
                    req.onsuccess = (evt) => {
                        const db = evt.target.result;
                        if (!db.objectStoreNames.contains('chat')) {
                            reject(new Error('Store "chat" no encontrado en model-storage'));
                            return;
                        }
                        const tx = db.transaction('chat', 'readonly');
                        const store = tx.objectStore('chat');
                        const soloGrupos = [];
                        const cursorReq = store.openCursor();
                        cursorReq.onsuccess = (e) => {
                            const cursor = e.target.result;
                            if (cursor) {
                                const c = cursor.value;
                                const id = typeof c.id === 'string' ? c.id
                                         : (c.id && c.id._serialized ? c.id._serialized : '');
                                // Solo guardar si es grupo — descarta chats normales al instante
                                if (id.includes('@g.us')) {
                                    soloGrupos.push({
                                        id: { _serialized: id },
                                        name: c.name || c.formattedTitle || c.displayName || '',
                                        isGroup: true,
                                        isReadOnly: c.isReadOnly || false
                                    });
                                }
                                cursor.continue();
                            } else {
                                resolve(soloGrupos);
                            }
                        };
                        cursorReq.onerror = () => reject(new Error('Error al recorrer IDB: ' + cursorReq.error));
                    };
                });
            });
            
            if (!grupos || grupos.length === 0) {
                throw new Error('IndexedDB vacío, WhatsApp aún sincronizando...');
            }

            console.log(`✅ ${grupos.length} grupos encontrados en IndexedDB.`);
            return grupos;

        } catch (error) {
            const msg = error.message || String(error);
            console.log(`\n⚠️ Aviso de sistema: ${msg}`);
            if (i === intentos) throw new Error('Tiempo agotado. No se pudieron cargar los grupos desde IDB.'); 
            console.log(`⏳ Pausando 15 segundos antes del siguiente intento...\n`);
            await esperar(15000); 
        }
    }
}

cliente.on('qr', (qrCode) => {
    console.log('\n📱 Escanea este código QR con tu WhatsApp:');
    qrcode.generate(qrCode, { small: true });
});

cliente.on('ready', () => {
    console.log('✅ ¡El bot ha iniciado sesión correctamente y la sesión está lista!');
    
    // 🚦 MONITOREO DE ESTABILIDAD (solo se registra UNA vez)
    // El bloqueo de imágenes y contención de memoria se gestiona nativamente en Chrome
    if (!interceptorActivo) {
        interceptorActivo = true;
        cliente.pupPage.on('framenavigated', (frame) => {
            if (frame === cliente.pupPage.mainFrame()) {
                paginaNavegando = true;
                ultimaNavegacion = Date.now();
                setTimeout(() => { paginaNavegando = false; }, 10000);
            }
        });
        console.log('🚦 Optimizador activo: memoria limitada y recursos pesados suprimidos nativamente.');
    }
    
    if (!fs.existsSync(CONFIGURACION.rutaImagen)) {
        console.log('❌ ERROR GRAVE: No se encontró la imagen en: ' + CONFIGURACION.rutaImagen);
        process.exit(1); 
    }

    // 🔒 CANDADO ANTI-DUPLICADO: si el motor ya está corriendo, ignorar este evento ready
    if (motorActivo) {
        console.log(`⚠️  [${hora()}] Evento 'ready' duplicado detectado — motor ya activo, se ignora.`);
        return;
    }
    motorActivo = true;
    iniciarMotorDeEnvios().finally(() => { motorActivo = false; });
});

cliente.on('disconnected', async (razon) => {
    console.log(`\n❌ WhatsApp se ha desconectado. Razón: ${razon}`);
    motorActivo = false;
    if (razon === 'LOGOUT') {
        // LOGOUT = el móvil cerró sesión o hubo conflicto. No reintentar automático.
        console.log('🔐 Sesión cerrada desde el móvil. Reinicia el bot manualmente.');
        try { await cliente.destroy(); } catch(e) {}
        process.exit(0);   // Exit 0 para no disparar error en la terminal
    } else {
        // Desconexion temporal: intentar reconectar
        console.log('🔄 Intentando reconectar en 10 segundos...');
        await esperar(10000);
        try {
            await inicializarBot();
        } catch(e) {
            console.log('No se pudo reconectar:', e.message);
            process.exit(1);
        }
    }
});

async function iniciarMotorDeEnvios() {
    let continuarTrabajando = true;
    let contadorVueltasGlobales = 1;

    // ================================================================
    // 🗂️ LECTURA ÚNICA DE GRUPOS AL INICIO
    // Los grupos se leen UNA SOLA VEZ y se reutilizan en todos los ciclos.
    // Evita que Chrome se bloquee re-leyendo IDB en cada ciclo.
    // ================================================================
    console.log('⏳ Esperando 120 segundos para que WhatsApp sincronice los grupos...');
    await esperar(120000);

    console.log('🗂️ Leyendo lista de grupos (solo una vez)...');
    const todosLosChats = await obtenerChatsSeguro(cliente, 8);
    const soloGrupos = todosLosChats.filter(chat => chat.isGroup);

    // Construir diccionario de búsqueda rápida
    const diccionarioGrupos = new Map();
    soloGrupos.forEach(g => {
        if (g.id && g.id._serialized) {
            diccionarioGrupos.set(g.id._serialized, g);
        }
        if (g.name) {
            diccionarioGrupos.set(g.name, g);
            diccionarioGrupos.set(g.name.normalize('NFC'), g);
            diccionarioGrupos.set(g.name.toLowerCase().trim(), g);
            diccionarioGrupos.set(limpiarTextoFuerte(g.name), g);
        }
    });
    console.log(`✅ ${soloGrupos.length} grupos cargados. Iniciando ciclos...\n`);

    let estadoActual = cargarEstado();
    let indexCicloInicial = estadoActual.cicloIndex || 0;

    while (continuarTrabajando) {
        if (contadorVueltasGlobales > 1) {
            console.log(`\n🔄 REINICIANDO TODOS LOS CICLOS (Vuelta #${contadorVueltasGlobales})`);
        }

        for (let i = indexCicloInicial; i < CONFIGURACION.horasDeEsperaEntreCiclos.length; i++) {
            let horas = CONFIGURACION.horasDeEsperaEntreCiclos[i];
            let numeroDeCiclo = i + 1;

            if (horas > 0) {
                let textoEspera = horas < 1 ? `${Math.round(horas * 60)} min` : `${horas} hrs`;
                const horaReanudacion = new Date(Date.now() + horas * 60 * 60 * 1000)
                    .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
                console.log(`\n💤 REPOSO ACTIVADO: El bot dormirá por ${textoEspera}. Próximo ciclo aprox. a las ${horaReanudacion}`);
                await esperar(horas * 60 * 60 * 1000); 
            }

            console.log(`\n🚀 INICIANDO CICLO #${numeroDeCiclo}... [${hora()}]`);
            
            try {
                const imagenMultimedia = MessageMedia.fromFilePath(CONFIGURACION.rutaImagen);

                    // Helper: enviar con timeout de 30s para no quedarse colgado
                    const enviarConTimeout = (promesa, segundos = 30) => Promise.race([
                        promesa,
                        new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_ENVIO')), segundos * 1000))
                    ]);

                    let timeoutsConsecutivos = 0;
                    // Usar el diccionario de grupos ya cargado (no releer IDB)

                    const gruposEnviadosEnEsteCiclo = new Set();
                    if (estadoActual && i === estadoActual.cicloIndex && estadoActual.gruposProcesados) {
                        estadoActual.gruposProcesados.forEach(g => gruposEnviadosEnEsteCiclo.add(g));
                        if (gruposEnviadosEnEsteCiclo.size > 0) {
                            console.log(`\n🔄 RECUPERACIÓN ACTIVADA: Saltando ${gruposEnviadosEnEsteCiclo.size} grupos ya procesados en este ciclo.\n`);
                        }
                    }

                    let reporteExitosos = [], reporteSoloAdmin = [], reporteNoEncontrado = [];
                    let enviosConsecutivos = 0, contadorGrupoActual = 0;
                    let indiceGrupoMensaje = i % CONFIGURACION.textosPorCiclo.length;
                    let grupoMensajesActual = CONFIGURACION.textosPorCiclo[indiceGrupoMensaje];
                    console.log(`📝 [ROTACIÓN ACTIVA] Usando el Grupo de Mensajes #${indiceGrupoMensaje + 1} (contiene ${grupoMensajesActual.length} variantes).`);
                    const totalGrupos = CONFIGURACION.gruposDestino.length;

                    for (let lineaGrupo of CONFIGURACION.gruposDestino) {
                        contadorGrupoActual++; 
                        let idBuscado = null;
                        let nombreGrupoBuscado = lineaGrupo;
                        
                        if (lineaGrupo.includes('|||')) {
                            const partes = lineaGrupo.split('|||');
                            idBuscado = partes[0];
                            nombreGrupoBuscado = partes[1];
                        }

                        let grupoEncontrado = null;
                        if (idBuscado) {
                            grupoEncontrado = diccionarioGrupos.get(idBuscado);
                        }

                        if (!grupoEncontrado) {
                            const nombreLimpioBuscado = limpiarTextoFuerte(nombreGrupoBuscado);
                            grupoEncontrado = diccionarioGrupos.get(nombreGrupoBuscado) 
                                               || diccionarioGrupos.get(nombreGrupoBuscado.normalize('NFC'))
                                               || diccionarioGrupos.get(nombreGrupoBuscado.toLowerCase().trim())
                                               || diccionarioGrupos.get(nombreLimpioBuscado);

                            if (!grupoEncontrado && nombreLimpioBuscado.length > 3) {
                                grupoEncontrado = soloGrupos.find(g => {
                                    if (!g.name) return false;
                                    const nombreLimpioExtraido = limpiarTextoFuerte(g.name);
                                    return nombreLimpioExtraido.includes(nombreLimpioBuscado) || nombreLimpioBuscado.includes(nombreLimpioExtraido);
                                });
                            }
                        }

                        if (!grupoEncontrado) {
                            reporteNoEncontrado.push(nombreGrupoBuscado);
                            continue; 
                        }

                        if (gruposEnviadosEnEsteCiclo.has(grupoEncontrado.id._serialized)) continue; 
                        if (grupoEncontrado.isReadOnly) {
                            reporteSoloAdmin.push(nombreGrupoBuscado);
                            gruposEnviadosEnEsteCiclo.add(grupoEncontrado.id._serialized);
                            guardarEstado(i, gruposEnviadosEnEsteCiclo);
                            continue; 
                        }

                        // Rotar el mensaje dentro del grupo para evitar ban
                        let indiceVariante = contadorGrupoActual % grupoMensajesActual.length;
                        const mensajeFinal = grupoMensajesActual[indiceVariante];
                        
                        // ⏱️ Espera aleatoria de 12 a 15 segundos entre grupos (+ micro-jitter anti-patrones)
                        const minMs = CONFIGURACION.tiempoEsperaMinSegundos * 1000;
                        const maxMs = CONFIGURACION.tiempoEsperaMaxSegundos * 1000;
                        const esperaAleatoria = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs + Math.floor(Math.random() * 1500);
                        console.log(`⏳ [${hora()}] Esperando ${(esperaAleatoria / 1000).toFixed(1)}s antes de procesar el siguiente grupo...`);
                        await esperar(esperaAleatoria);

                        let envioExitoso = false;
                        let reintentosRestantes = 1;

                        while (!envioExitoso) {
                            try {
                                console.log(`📤 [${hora()}] Ciclo #${numeroDeCiclo} | Enviando (${contadorGrupoActual}/${totalGrupos}): ${nombreGrupoBuscado}`);
                                
                                await enviarConTimeout(
                                    cliente.sendMessage(grupoEncontrado.id._serialized, imagenMultimedia, { caption: mensajeFinal }),
                                    CONFIGURACION.tiempoMaximoEnvioSegundos
                                );
                                gruposEnviadosEnEsteCiclo.add(grupoEncontrado.id._serialized);
                                guardarEstado(i, gruposEnviadosEnEsteCiclo);
                                reporteExitosos.push(nombreGrupoBuscado);
                                enviosConsecutivos++;
                                timeoutsConsecutivos = 0;
                                envioExitoso = true;
                                console.log(`   ✅ Enviado a: ${nombreGrupoBuscado} [${hora()}]`);

                            } catch (error) {
                                const esTimeout = error.message === 'TIMEOUT_ENVIO'
                                    || error.message?.includes('callFunctionOn timed out')
                                    || error.message?.includes('protocolTime');

                                if (esTimeout) {
                                    timeoutsConsecutivos++;
                                    console.log(`   ⏱️ Timeout en ${nombreGrupoBuscado} — intentando solo texto...`);
                                } else {
                                    console.log(`   ⚠️ Error en ${nombreGrupoBuscado}: ${error.message?.substring(0, 60)}`);
                                }

                                try {
                                    // Fallback: intentar enviar solo texto
                                    await enviarConTimeout(
                                        cliente.sendMessage(grupoEncontrado.id._serialized, mensajeFinal),
                                        CONFIGURACION.tiempoMaximoEnvioSegundos
                                    );
                                    gruposEnviadosEnEsteCiclo.add(grupoEncontrado.id._serialized);
                                    guardarEstado(i, gruposEnviadosEnEsteCiclo);
                                    reporteExitosos.push(nombreGrupoBuscado + ' (Solo Texto)');
                                    enviosConsecutivos++;
                                    timeoutsConsecutivos = 0;
                                    envioExitoso = true;
                                    console.log(`   ✅ (Solo texto) ${nombreGrupoBuscado} [${hora()}]`);
                                } catch (fallbackError) {
                                    if (reintentosRestantes > 0) {
                                        console.log(`   ⏳ Falla de envío. Pausando 1 minuto con 30 segundos y limpiando caché para reintentar...`);
                                        
                                        // Limpieza de memoria (V8 + Node.js)
                                        try {
                                            await cliente.pupPage.evaluate(() => { if (window.gc) window.gc(); });
                                        } catch(e) {}
                                        if (typeof global.gc === 'function') global.gc();

                                        await esperar(90000); // Esperar 1 minuto y 30 segundos
                                        reintentosRestantes--;
                                    } else {
                                        console.log(`   ❌ Grupo saltado definitivamente (falla persistente).`);
                                        reporteNoEncontrado.push(nombreGrupoBuscado + (esTimeout ? ' [timeout]' : ' [error]'));
                                        
                                        if (timeoutsConsecutivos >= 5) {
                                            console.log(`\n========================================================`);
                                            console.log(`🔄 [¡EMERGENCIA DE MEMORIA!] Chrome saturado (${timeoutsConsecutivos} fallas seguidas).`);
                                            console.log(`   El estado ha sido guardado. Reiniciando bot automáticamente...`);
                                            console.log(`========================================================\n`);
                                            process.exit(2);
                                        }
                                        break; // Salimos del while y pasamos al siguiente grupo
                                    }
                                }
                            }
                        }

                        // 🛑 DESCANSOS ESCALONADOS ANTI-BANEO + LIMPIEZA DE RAM
                        if (envioExitoso) {
                            const pausa = obtenerDescansoEscalonado(enviosConsecutivos);
                            if (pausa) {
                                console.log(`\n🛑 [PAUSA ANTI-BANEO] Descanso de ${pausa.descripcion} tras ${enviosConsecutivos} grupos enviados.`);

                                // 🧹 Limpieza activa de memoria en pausas de 1 minuto o más
                                if (pausa.segundos >= 60) {
                                    try {
                                        await cliente.pupPage.evaluate(async () => {
                                            if (window.gc) window.gc();
                                        });
                                    } catch(e) {}

                                    if (typeof global.gc === 'function') {
                                        global.gc();
                                        console.log('   ♻️  Memoria RAM liberada (GC ejecutado en Node.js y Chrome)');
                                    }
                                }

                                const horaFinPausa = new Date(Date.now() + pausa.segundos * 1000)
                                    .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                                console.log(`   ⏳ Reanudando envíos a las: ${horaFinPausa}`);
                                await esperar(pausa.segundos * 1000);

                                // La rotación del mensaje ahora se hace automáticamente en cada envío individual para mayor seguridad.
                                console.log(`▶️ Reanudando envíos...\n`);
                            }
                        }

                    } // fin for grupos

                    await esperar(20000); // Dar 20s para que WhatsApp respire antes de generar reporte

                    // Al terminar el ciclo exitosamente, limpiamos el estado para el siguiente ciclo
                    limpiarEstado();
                    estadoActual = { cicloIndex: i + 1, gruposProcesados: [] };
                
                const horaFinCiclo = hora();
                const siguienteEspera = CONFIGURACION.horasDeEsperaEntreCiclos[i + 1];
                let msgSiguiente = '';
                if (siguienteEspera !== undefined) {
                    const horaProximo = new Date(Date.now() + siguienteEspera * 60 * 60 * 1000)
                        .toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
                    msgSiguiente = siguienteEspera > 0
                        ? `Próximo ciclo en ${siguienteEspera} hrs → aprox. ${horaProximo}`
                        : `Próximo ciclo inicia de inmediato`;
                } else {
                    msgSiguiente = 'Todos los ciclos completados.';
                }
                console.log('\n===================================================================');
                console.log(`📈 REPORTE DIAGNÓSTICO FINAL - CICLO #${numeroDeCiclo}`);
                console.log(`🕐 Hora de término: ${horaFinCiclo}`);
                console.log(`▶️ Total agenda: ${totalGrupos} | ✅ Éxitos: ${reporteExitosos.length}`);
                console.log(`🔒 Solo admin: ${reporteSoloAdmin.length} | 👻 No encontrados: ${reporteNoEncontrado.length}`);
                console.log(`⏭️  ${msgSiguiente}`);
                console.log('===================================================================\n');
            
            } catch (errorCiclo) {
                console.log('\n❌ ERROR CRÍTICO DEL CICLO: ', errorCiclo.message);
                console.log(`   Guardando estado para recuperación...`);
                // En este nivel, el estado ya se guardó por cada grupo, pero forzamos reinicio.
                process.exit(2);
            }
        } 

        indexCicloInicial = 0; // Para la siguiente vuelta completa
        estadoActual = { cicloIndex: 0, gruposProcesados: [] };

        const respuesta = await preguntarAlUsuario('\n🔔 Todos los ciclos han concluido. ¿Reiniciar globalmente? (si/no): ');
        if (respuesta === 'si' || respuesta === 's') {
            contadorVueltasGlobales++;
        } else {
            continuarTrabajando = false;
        }
    }
    process.exit(0);
}

const inicializarBot = async (intentos = 0) => {
    try {
        console.log(`⚙️ Iniciando motor de Chrome... [Intento ${intentos + 1}/3]`);
        await cliente.initialize();
    } catch (err) {
        console.error(`❌ ERROR DE ARRANQUE: ${err.message}`);
        if (intentos < 2) {
            try { await cliente.destroy(); } catch (e) {} 
            await esperar(5000); 
            await inicializarBot(intentos + 1); 
        } else {
            process.exit(1);
        }
    }
};

// 🛡️ CAPTURADOR GLOBAL: evita que errores inesperados cierren el bot sin control
process.on('unhandledRejection', (razon, promesa) => {
    console.log(`\n⚠️ [${hora()}] Error no manejado interceptado (bot continúa):`, razon?.message || razon);
});

process.on('uncaughtException', (err) => {
    console.log(`\n⚠️ [${hora()}] Excepción no capturada interceptada (bot continúa):`, err.message);
});

inicializarBot();