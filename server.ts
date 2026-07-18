import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { readStadiumData, writeStadiumData } from "./src/stadium-db.js";
import { StadiumData } from "./src/types.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Retrieve the current stadium knowledge base
app.get("/api/stadium-data", (req, res) => {
  try {
    const data = readStadiumData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to read stadium data: " + err.message });
  }
});

// 2. API: Update stadium entities (Gates, Restrooms, Food Stalls, Medical Points)
app.post("/api/stadium-data", (req, res) => {
  try {
    const { type, id, updates } = req.body;
    if (!type || !id || !updates) {
      return res.status(400).json({ error: "Missing required fields (type, id, updates)" });
    }

    const currentData = readStadiumData();
    let updated = false;

    if (type === "gates") {
      currentData.gates = currentData.gates.map((item) => {
        if (item.id === id) {
          updated = true;
          return { ...item, ...updates };
        }
        return item;
      });
    } else if (type === "restrooms") {
      currentData.restrooms = currentData.restrooms.map((item) => {
        if (item.id === id) {
          updated = true;
          return { ...item, ...updates };
        }
        return item;
      });
    } else if (type === "foodStalls") {
      currentData.foodStalls = currentData.foodStalls.map((item) => {
        if (item.id === id) {
          updated = true;
          return { ...item, ...updates };
        }
        return item;
      });
    } else if (type === "medicalPoints") {
      currentData.medicalPoints = currentData.medicalPoints.map((item) => {
        if (item.id === id) {
          updated = true;
          return { ...item, ...updates };
        }
        return item;
      });
    } else {
      return res.status(400).json({ error: "Invalid entity type specified." });
    }

    if (!updated) {
      return res.status(404).json({ error: `Entity of type '${type}' with ID '${id}' not found.` });
    }

    const success = writeStadiumData(currentData);
    if (success) {
      res.json({ success: true, message: "Stadium operational intelligence updated successfully.", data: currentData });
    } else {
      res.status(500).json({ error: "Failed to save updated stadium data." });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
});

// Local fallback generator when Gemini API hits quota/rate limits
function generateFallbackResponse(message: string, stadiumData: any): string {
  const query = message.toLowerCase();
  
  // Detect language
  const isHindi = /[\u0900-\u097F]/.test(message) || query.includes("वॉशरूम") || query.includes("शौचालय") || query.includes("गेट") || query.includes("रास्ता") || query.includes("भोजन") || query.includes("क्या") || query.includes("कब") || query.includes("भीड़");
  const isSpanish = query.includes("donde") || query.includes("baño") || query.includes("puerta") || query.includes("comida") || query.includes("hola") || query.includes("gracias") || query.includes("silla de ruedas") || query.includes("vegetariano");

  // Get active gates, restrooms, food
  const g1 = stadiumData.gates.find((g: any) => g.id === "gate-1") || { status: "open", crowdDensity: "low", averageQueueTimeMinutes: 5, name: "Gate 1", location: "North-East side" };
  const g2 = stadiumData.gates.find((g: any) => g.id === "gate-2") || { status: "open", crowdDensity: "high", averageQueueTimeMinutes: 25, name: "Gate 2", location: "West side" };
  const g3 = stadiumData.gates.find((g: any) => g.id === "gate-3") || { status: "closed", crowdDensity: "high", averageQueueTimeMinutes: 999, name: "Gate 3", location: "South side" };
  const g4 = stadiumData.gates.find((g: any) => g.id === "gate-4") || { status: "open", crowdDensity: "medium", averageQueueTimeMinutes: 12, name: "Gate 4", location: "South-West side" };

  const r105 = stadiumData.restrooms.find((r: any) => r.id === "restroom-105") || { crowdDensity: "low", queueTimeMinutes: 2, name: "Restroom Section 105" };
  const r122 = stadiumData.restrooms.find((r: any) => r.id === "restroom-122") || { crowdDensity: "high", queueTimeMinutes: 15, name: "Restroom Section 122" };
  const r135 = stadiumData.restrooms.find((r: any) => r.id === "restroom-135") || { crowdDensity: "medium", queueTimeMinutes: 6, name: "Restroom Section 135" };

  const f1 = stadiumData.foodStalls.find((f: any) => f.id === "food-1") || { crowdDensity: "medium", status: "open", name: "Jersey Shore Eats" };
  const f2 = stadiumData.foodStalls.find((f: any) => f.id === "food-2") || { crowdDensity: "low", status: "open", name: "Verde Organic & Vegetarian" };
  const f3 = stadiumData.foodStalls.find((f: any) => f.id === "food-3") || { crowdDensity: "high", status: "open", name: "Global Halal Kitchen" };

  if (isHindi) {
    if (query.includes("wheelchair") || query.includes("व्हीलचेयर") || query.includes("विकलांग") || query.includes("stroller") || query.includes("बुजुर्ग") || query.includes("elderly") || query.includes("elevator") || query.includes("लिफ्ट")) {
      return `व्हीलचेयर और सुगम मार्ग (Accessibility) के लिए, हम निम्नलिखित सुरक्षित और सीढ़ी-मुक्त मार्गों की सलाह देते हैं:

* **मुख्य दक्षिणी रैंप (Main South Ramp)**: गेट 4 और सेक्शन 128 के बीच स्थित है। यह बिना किसी सीढ़ी के सीधे निचले स्तर की सीटों और व्हीलचेयर सीटों तक सुरक्षित रास्ता प्रदान करता है।
* **वेस्ट कॉनकोर्स एलीवेटर्स (West Concourse Elevators)**: गेट 2 (Verizon Gate) से सीधे 30 मीटर आगे बढ़ें। वहां एलीवेटर्स हैं जो लेवल 1, 2 और 3 तक सुरक्षित पहुँच प्रदान करते हैं।
* **सुगम सुविधाएं**: गेट 1, गेट 2, और गेट 4 पूरी तरह से व्हीलचेयर अनुकूल हैं।
* **सुगम शौचालय**: सेक्शन 105 और 135 के शौचालय पूरी तरह से सुगम हैं और इनमें बेबी चेंजिंग टेबल भी है। (कृपया ध्यान दें कि सेक्शन 122 का शौचालय व्हीलचेयर के लिए अनुकूल नहीं है क्योंकि वहां केवल सीढ़ियां हैं)।
* **चिकित्सा सहायता**: किसी भी आपातकालीन स्थिति में, सेक्शन 110 के ठीक पीछे **First Aid Station A** स्थित है जो पूरी तरह से ग्राउंड लेवल पर है और इसमें प्रमाणित चिकित्सा स्टाफ उपलब्ध है।`;
    }

    if (query.includes("washroom") || query.includes("restroom") || query.includes("toilet") || query.includes("वॉशरूम") || query.includes("शौचालय") || query.includes("टॉयलेट")) {
      return `मेटलाइफ स्टेडियम में वर्तमान शौचालय (Restrooms) की स्थिति निम्नलिखित है:

1. **शौचालय सेक्शन 105 (All-Gender / Family)**:
   * **भीड़**: **${r105.crowdDensity.toUpperCase()}** (प्रतीक्षा समय: लगभग ${r105.queueTimeMinutes} मिनट) 🟢 *शानदार विकल्प!*
   * **सुविधा**: **व्हीलचेयर अनुकूल**, बेबी चेंजिंग टेबल उपलब्ध है।
2. **शौचालय सेक्शन 135 (Men & Women separate)**:
   * **भीड़**: **${r135.crowdDensity.toUpperCase()}** (प्रतीक्षा समय: लगभग ${r135.queueTimeMinutes} मिनट) 🟡
   * **सुविधा**: **व्हीलचेयर अनुकूल**, बेबी चेंजिंग टेबल उपलब्ध है।
3. **शौचालय सेक्शन 122 (Men & Women separate)**:
   * **भीड़**: **${r122.crowdDensity.toUpperCase()}** (प्रतीक्षा समय: लगभग ${r122.queueTimeMinutes} मिनट) 🔴 *अत्यधिक भीड़!*
   * **सुविधा**: व्हीलचेयर अनुकूल नहीं है (केवल सीढ़ियां)। हम आपको इसके बदले पास के सेक्शन 105 या 135 शौचालय का उपयोग करने की सलाह देते हैं।`;
    }

    if (query.includes("time") || query.includes("open") || query.includes("queue") || query.includes("समय") || query.includes("खुलता") || query.includes("खुला") || query.includes("कतार") || query.includes("गेट")) {
      return `मेटलाइफ स्टेडियम के प्रवेश द्वार (Gates) और समय की लाइव स्थिति निम्नलिखित है:

* **सामान्य नियम**: स्टेडियम के गेट्स मैच शुरू होने (Kickoff) से **3 घंटे पहले** खुलते हैं। सुरक्षा जांच के लिए बैग का आकार 4.5x6.5 इंच से छोटा होना चाहिए, केवल पारदर्शी बैग (12x6x12 इंच से कम) ही अनुमत हैं।
* **गेट 1 (Bud Light Gate)**: **${g1.status.toUpperCase()}** | भीड़: **${g1.crowdDensity.toUpperCase()}** (कतार का समय: ${g1.averageQueueTimeMinutes} मिनट) 🟢 *प्रवेश के लिए सर्वोत्तम!*
* **गेट 4 (Hanu Gate)**: **${g4.status.toUpperCase()}** | भीड़: **${g4.crowdDensity.toUpperCase()}** (कतार का समय: ${g4.averageQueueTimeMinutes} मिनट) 🟡
* **गेट 2 (Verizon Gate)**: **${g2.status.toUpperCase()}** | भीड़: **${g2.crowdDensity.toUpperCase()}** (कतार का समय: ${g2.averageQueueTimeMinutes} मिनट) 🔴 *अत्यधिक भीड़!*
* **गेट 3 (Pepsi Gate)**: **${g3.status.toUpperCase()}** 🔴 *यह गेट वर्तमान में अस्थायी रूप से बंद है।* कृपया इसके बदले पास के **गेट 4 (Hanu Gate)** का उपयोग करें।`;
    }

    if (query.includes("food") || query.includes("vegetarian") || query.includes("vegan") || query.includes("halal") || query.includes("भोजन") || query.includes("शाकाहारी") || query.includes("खाना") || query.includes("वेज")) {
      return `मेटलाइफ स्टेडियम में भोजन और शाकाहारी (Vegetarian/Vegan) लाइव विकल्प निम्नलिखित हैं:

1. **Verde Organic & Vegetarian (सेक्शन 117 के पास)**:
   * **भोजन**: शाकाहारी रैप्स, वीगन बर्गर, और ग्लूटेन-फ्री सलाद।
   * **भीड़ स्थिति**: **${f2.crowdDensity.toUpperCase()}** 🟢 *अत्यंत अनुशंसित! यहाँ कतार बहुत छोटी है।*
2. **Global Halal Kitchen (सेक्शन 131 के पास)**:
   * **भोजन**: हलाल जायरो, फलाफेल, और हम्मस प्लैटर्स।
   * **भीड़ स्थिति**: **${f3.crowdDensity.toUpperCase()}** 🔴 *यहाँ स्वादिष्ट भोजन के कारण भीड़ अधिक है।*
3. **Jersey Shore Eats (सेक्शन 104 के पास)**:
   * **भोजन**: हॉट डॉग्स, फ्राइज़ और बियर (गैर-शाकाहारी / सामान्य भोजन)।
   * **भीड़ स्थिति**: **${f1.crowdDensity.toUpperCase()}** 🟡`;
    }

    if (query.includes("train") || query.includes("shuttle") || query.includes("bus") || query.includes("rideshare") || query.includes("cab") || query.includes("ट्रेन") || query.includes("शटल") || query.includes("बस") || query.includes("कैब") || query.includes("परिवहन") || query.includes("यात्रा") || query.includes("पार्किंग")) {
      return `मेटलाइफ स्टेडियम परिवहन (Transit Hubs) की लाइव स्थिति निम्नलिखित है:

* **NJ Transit Train Station (Gate 1 के बाहर)**: स्थिति: **सक्रिय** | भीड़: **अत्यधिक भीड़ (HIGH)** (प्रतीक्षा समय: लगभग 35 मिनट)। मैच के बाद भीड़ से बचने के लिए पहले प्रस्थान करें।
* **FIFA Official Shuttle Bus (पार्किंग Lot G, Gate 2 के पास)**: स्थिति: **सक्रिय** | भीड़: **कम (LOW)** (प्रतीक्षा समय: लगभग 8 मिनट)। यह एक तेज और आरामदायक विकल्प है।
* **Rideshare Pickup Point (पार्किंग Lot D, Gate 4 के पास)**: स्थिति: **सक्रिय** | भीड़: **मध्यम (MEDIUM)** (प्रतीक्षा समय: लगभग 15 मिनट)। उबर और टैक्सियों के लिए सुरक्षित स्थल।`;
    }

    if (query.includes("eco") || query.includes("recycle") || query.includes("green") || query.includes("sustainability") || query.includes("water") || query.includes("पर्यावरण") || query.includes("इको") || query.includes("रीसायकल") || query.includes("कचरा") || query.includes("पानी") || query.includes("बोतल")) {
      return `मेटलाइफ स्टेडियम पर्यावरण और स्थिरता (Sustainability) लाइव पहल:

* **इको-स्टेशन रीसाइक्लिंग हब (Eco-Station Recycling Hub)**: सेक्शन 117 और 131 के पास कॉनकोर्स पर स्थित है। यहाँ पुनर्चक्रण योग्य कचरा, खाद (Composting) और दोबारा इस्तेमाल होने वाले कप सुरक्षित रूप से जमा करें।
* **इको वाटर रीफिल स्टेशन (Eco Water Bottle Refill Station)**: सेक्शन 105, 117 और 135 के पास स्थित है। यहाँ अपनी पर्यावरण-अनुकूल बोतलों में मुफ्त ठंडा फ़िल्टर्ड पानी भरें। प्लास्टिक कचरा कम करने में सहयोग करें!`;
    }

    return `मेटलाइफ स्टेडियम के लाइव एआई संचालन पोर्टल में आपका स्वागत है! मैं आपकी सहायता के लिए तैयार हूँ।
* **गेट 1, 2, और 4** वर्तमान में प्रवेश के लिए खुले हुए हैं। **गेट 3** बंद है।
* शाकाहारी भोजन के लिए सेक्शन 117 के पास **Verde Organic & Vegetarian** पर जाएँ (भीड़ बहुत कम है)।
* पर्यावरण अनुकूल रीफिल स्टेशनों और सुगम मार्गों के लिए गेट 4 के पास **Main South Ramp** का उपयोग करें।
* यदि आपको किसी विशेष गेट, शौचालय, परिवहन, या पर्यावरण स्टेशन की जानकारी चाहिए, तो कृपया पूछें!`;
  }

  if (isSpanish) {
    if (query.includes("wheelchair") || query.includes("silla de ruedas") || query.includes("discapacidad") || query.includes("stroller") || query.includes("anciano") || query.includes("elderly") || query.includes("ascensor") || query.includes("ramp")) {
      return `Para rutas accesibles, sillas de ruedas o personas de la tercera edad, MetLife Stadium cuenta con las siguientes instalaciones adaptadas:

* **Rampa Principal Sur (Main South Ramp)**: Ubicada de manera segura entre la Puerta 4 y la Sección 128. Proporciona una transición suave y sin escaleras para acceder a todos los asientos del nivel inferior.
* **Ascensores del Concurso Oeste (West Concourse Elevators)**: Desde la Puerta 2 (Verizon Gate), camine 30 metros en línea recta hacia los ascensores para subir a los Niveles 1, 2 y 3.
* **Baños Accesibles**: Los baños de las Secciones 105 y 135 son completamente accesibles y disponen de cambiadores para bebés. (El baño de la Sección 122 requiere escaleras).
* **Asistencia Médica**: La **Estación de Primeros Auxilios A** está a nivel del suelo detrás de la Sección 110, al lado de los ascensores 1 y 2.`;
    }

    if (query.includes("washroom") || query.includes("restroom") || query.includes("toilet") || query.includes("baño") || query.includes("sanitario") || query.includes("servicio")) {
      return `Aquí tiene el estado en tiempo real de los baños más cercanos en el estadio:

1. **Baño Sección 105 (Familiar y Todo Género)**:
   * **Congestión**: **${r105.crowdDensity.toUpperCase()}** (espera de aprox. ${r105.queueTimeMinutes} min) 🟢 *¡Recomendado!*
   * **Accesibilidad**: Totalmente **accesible para silla de ruedas**, con cambiador para bebés.
2. **Baño Sección 135 (Hombres y Mujeres separados)**:
   * **Congestión**: **${r135.crowdDensity.toUpperCase()}** (espera de aprox. ${r135.queueTimeMinutes} min) 🟡
   * **Accesibilidad**: **Accesible para silla de ruedas**, con cambiador para bebés.
3. **Baño Sección 122 (Hombres y Mujeres separados)**:
   * **Congestión**: **${r122.crowdDensity.toUpperCase()}** (espera de aprox. ${r122.queueTimeMinutes} min) 🔴 *¡Mucha fila!*
   * **Accesibilidad**: No accesible (solo escaleras). Sugerimos caminar al baño de la Sección 105 para mayor comodidad.`;
    }

    if (query.includes("time") || query.includes("open") || query.includes("queue") || query.includes("hora") || query.includes("abierto") || query.includes("fila") || query.includes("puerta")) {
      return `Estado actual de las puertas de acceso y tiempos de espera en el Estadio MetLife:

* **Horario**: Las puertas se abren **3 horas antes** del saque inicial. Solo se permiten bolsos transparentes pequeños (menos de 12x6x12 pulgadas).
* **Puerta 1 (Bud Light Gate)**: **${g1.status.toUpperCase()}** | Congestión: **${g1.crowdDensity.toUpperCase()}** (espera de ${g1.averageQueueTimeMinutes} min) 🟢 *¡Excelente opción para entrar rápido!*
* **Puerta 4 (Hanu Gate)**: **${g4.status.toUpperCase()}** | Congestión: **${g4.crowdDensity.toUpperCase()}** (espera de ${g4.averageQueueTimeMinutes} min) 🟡
* **Puerta 2 (Verizon Gate)**: **${g2.status.toUpperCase()}** | Congestión: **${g2.crowdDensity.toUpperCase()}** (espera de ${g2.averageQueueTimeMinutes} min) 🔴 *Fila larga.*
* **Puerta 3 (Pepsi Gate)**: **${g3.status.toUpperCase()}** 🔴 *Esta puerta está temporalmente cerrada.* Diríjase a la **Puerta 4** para ingresar de manera óptima.`;
    }

    if (query.includes("food") || query.includes("vegetarian") || query.includes("vegan") || query.includes("halal") || query.includes("comida") || query.includes("vegetariano") || query.includes("vegano")) {
      return `Opciones gastronómicas en tiempo real en el Estadio MetLife:

1. **Verde Organic & Vegetarian (Cerca de la Sección 117)**:
   * **Menú**: Wraps vegetarianos, hamburguesas veganas y ensaladas sin gluten.
   * **Congestión**: **${f2.crowdDensity.toUpperCase()}** 🟢 *¡Muy recomendado, sin fila!*
2. **Global Halal Kitchen (Cerca de la Sección 131)**:
   * **Menú**: Gyros Halal, Falafel y platos de Hummus.
   * **Congestión**: **${f3.crowdDensity.toUpperCase()}** 🔴 *¡Muy rico pero concurrido!*
3. **Jersey Shore Eats (Cerca de la Sección 104)**:
   * **Menú**: Hot dogs clásicos, papas fritas y bebidas.
   * **Congestión**: **${f1.crowdDensity.toUpperCase()}** 🟡`;
    }

    if (query.includes("tren") || query.includes("shuttle") || query.includes("autobús") || query.includes("bus") || query.includes("taxi") || query.includes("uber") || query.includes("rideshare") || query.includes("transporte") || query.includes("estacionamiento")) {
      return `Estado actual del transporte y tránsito (Transit Hubs) en el Estadio MetLife:

* **Estación de tren NJ Transit (Afuera de la Puerta 1)**: Estado: **ACTIVO** | Congestión: **ALTA** (espera de aprox. 35 min). ¡Planifique con tiempo para evitar filas largas después del partido!
* **Zona oficial de autobuses de enlace FIFA (Estacionamiento G cerca de la Puerta 2)**: Estado: **ACTIVO** | Congestión: **BAJA** (espera de aprox. 8 min). Excelente alternativa rápida y directa.
* **Punto de encuentro Rideshare (Estacionamiento D cerca de la Puerta 4)**: Estado: **ACTIVO** | Congestión: **MEDIA** (espera de aprox. 15 min). Zona oficial autorizada para Uber, Lyft y taxis.`;
    }

    if (query.includes("ecológico") || query.includes("eco") || query.includes("reciclaje") || query.includes("reciclar") || query.includes("verde") || query.includes("agua") || query.includes("botella") || query.includes("sostenible") || query.includes("sostenibilidad")) {
      return `Iniciativas ecológicas y de sostenibilidad (Sustainability Stops) en el Estadio MetLife:

* **Centro de reciclaje Eco-Station**: Ubicado en el pasillo cerca de las Secciones 117 y 131. Cuenta con contenedores para reciclaje, compostaje y devolución de vasos reutilizables.
* **Estación de recarga de agua ecológica**: Disponible cerca de las Secciones 105, 117 y 135. Ofrece agua filtrada fría gratuita para incentivar el uso de botellas reutilizables. ¡Ayúdenos a reducir plásticos de un solo uso!`;
    }

    return `¡Bienvenido al portal inteligente de MetLife Stadium! Las puertas abiertas hoy son:

* **Puertas 1, 2 y 4** están abiertas. La **Puerta 3** está cerrada.
* Para comida vegetariana, el puesto **Verde Organic & Vegetarian** (Sección 117) está disponible con muy poca fila.
* Para rutas accesibles, estaciones ecológicas y rampas, le recomendamos utilizar el acceso cercano a la **Puerta 4**.
* Por favor indíquenos si necesita más detalles sobre rampas, alimentos, baños, transporte o ecología.`;
  }

  // --- ENGLISH ---
  if (query.includes("wheelchair") || query.includes("disable") || query.includes("stroller") || query.includes("elderly") || query.includes("elevator") || query.includes("ramp") || query.includes("walk") || query.includes("father") || query.includes("accessibility") || query.includes("accessible") || query.includes("elder")) {
    return `For wheelchair, elderly, and stroller-friendly routing, MetLife Stadium offers the following safe and accessible options:

* **Main South Ramp**: Located safely between **${g4.name}** and **Section 128**. This ramp bypasses all stairs, offering an immediate, smooth walk to the lower tier accessible seating areas.
* **West Concourse Elevators**: Located directly inside **${g2.name}**. Go 30 meters straight ahead to find the elevator bank servicing Levels 1, 2, and 3.
* **Accessible Facilities**: Gate 1, Gate 2, and Gate 4 are fully wheelchair accessible. 
* **Accessible Restrooms**: The restrooms at **Section 105** (All-Gender/Family) and **Section 135** (Men/Women separate) are fully accessible with baby changing stations. (Note: Restroom at Section 122 is stairs-only).
* **Medical Aid**: **First Aid Station A** is on level ground behind Section 110 (next to Elevators 1 & 2), staffed by certified EMTs.`;
  }

  if (query.includes("washroom") || query.includes("restroom") || query.includes("toilet") || query.includes("washrooms") || query.includes("restrooms") || query.includes("bathroom") || query.includes("bathrooms")) {
    return `Here is the current live status of the nearest restrooms at MetLife Stadium:

1. **Restroom Section 105 (All-Gender / Family)**:
   * **Wait Time**: **${r105.queueTimeMinutes} minutes** (Crowd: **${r105.crowdDensity.toUpperCase()}**) 🟢 *Highly Recommended!*
   * **Aptitude**: Fully **wheelchair accessible**, includes a baby changing table.
2. **Restroom Section 135 (Men & Women separate)**:
   * **Wait Time**: **${r135.queueTimeMinutes} minutes** (Crowd: **${r135.crowdDensity.toUpperCase()}**) 🟡
   * **Aptitude**: **Wheelchair accessible**, includes a baby changing table.
3. **Restroom Section 122 (Men & Women separate)**:
   * **Wait Time**: **${r122.queueTimeMinutes} minutes** (Crowd: **${r122.crowdDensity.toUpperCase()}**) 🔴 *Very busy!*
   * **Aptitude**: **NOT wheelchair accessible** (stairs only). We recommend walking to the restrooms near Section 105 or 135 instead.`;
  }

  if (query.includes("time") || query.includes("open") || query.includes("queue") || query.includes("wait") || query.includes("line") || query.includes("gate") || query.includes("gates") || query.includes("hour") || query.includes("hours")) {
    return `Here is the live status of MetLife Stadium access gates and operating times:

* **General Schedule**: General public gates open **3 hours prior to kickoff**. Bags larger than 4.5x6.5 inches are prohibited, unless they are clear bags (under 12x6x12 inches).
* **Gate 1 (Bud Light Gate)**: **${g1.status.toUpperCase()}** | Crowd: **${g1.crowdDensity.toUpperCase()}** (Queue Time: **${g1.averageQueueTimeMinutes} mins**) 🟢 *Fastest entry!*
* **Gate 4 (Hanu Gate)**: **${g4.status.toUpperCase()}** | Crowd: **${g4.crowdDensity.toUpperCase()}** (Queue Time: **${g4.averageQueueTimeMinutes} mins**) 🟡
* **Gate 2 (Verizon Gate)**: **${g2.status.toUpperCase()}** | Crowd: **${g2.crowdDensity.toUpperCase()}** (Queue Time: **${g2.averageQueueTimeMinutes} mins**) 🔴 *Crowded.*
* **Gate 3 (Pepsi Gate)**: **${g3.status.toUpperCase()}** 🔴 *TEMPORARILY CLOSED.* Please redirect your route to **Gate 4 (Hanu Gate)** for immediate access.`;
  }

  if (query.includes("food") || query.includes("vegetarian") || query.includes("vegan") || query.includes("halal") || query.includes("dietary") || query.includes("eat") || query.includes("concession") || query.includes("stall") || query.includes("stalls")) {
    return `Here are the active concessions and dietary dining options at MetLife Stadium:

1. **Verde Organic & Vegetarian (Near Section 117)**:
   * **Menu**: Vegetarian Wraps, Vegan Burgers, and Gluten-Free Salads.
   * **Status**: **${f2.status.toUpperCase()}** | Crowd: **${f2.crowdDensity.toUpperCase()}** 🟢 *Highly Recommended (Virtually no lines!).*
2. **Global Halal Kitchen (Near Section 131)**:
   * **Menu**: Halal Gyros, Falafel, and Hummus Platters.
   * **Status**: **${f3.status.toUpperCase()}** | Crowd: **${f3.crowdDensity.toUpperCase()}** 🔴 *Busy, but excellent quality.*
3. **Jersey Shore Eats (Near Section 104)**:
   * **Menu**: Classic hot dogs, french fries, and draft beer.
   * **Status**: **${f1.status.toUpperCase()}** | Crowd: **${f1.crowdDensity.toUpperCase()}** 🟡`;
  }

  if (query.includes("train") || query.includes("shuttle") || query.includes("bus") || query.includes("buses") || query.includes("taxi") || query.includes("uber") || query.includes("rideshare") || query.includes("transport") || query.includes("transit") || query.includes("parking") || query.includes("station")) {
    return `Here is the live status of Transit Hubs at MetLife Stadium:

* **NJ Transit Train Station (Outside Gate 1)**: Status: **ACTIVE** | Crowd: **HIGH** (Wait Time: **35 mins**). Expect heavy post-match queues; plan departures accordingly!
* **FIFA Official Shuttle Bus Zone (Lot G near Gate 2)**: Status: **ACTIVE** | Crowd: **LOW** (Wait Time: **8 mins**). Highly recommended for fast transport.
* **Rideshare Pickup Point (Lot D near Gate 4)**: Status: **ACTIVE** | Crowd: **MEDIUM** (Wait Time: **15 mins**). Safest zone for Uber, Lyft, and authorized taxis.`;
  }

  if (query.includes("eco") || query.includes("recycle") || query.includes("recycling") || query.includes("green") || query.includes("sustainability") || query.includes("water") || query.includes("refill") || query.includes("bottle") || query.includes("environment") || query.includes("compost") || query.includes("waste")) {
    return `Sustainable & Eco-friendly (Sustainability Stops) initiatives at MetLife Stadium:

* **Eco-Station Recycling Hubs (Near Sections 117 & 131)**: Provides convenient waste segregation bins (recycling/compost) and reusable cup returns to promote zero-waste matchdays.
* **Eco Water Bottle Refill Stations (Near Sections 105, 117, & 135)**: Features free chilled filtered water stations to encourage fans to bring and use reusable water bottles. Help us protect our planet!`;
  }

  return `Welcome to the MetLife Stadium Matchday Portal for the FIFA World Cup 2026! 

Currently:
* **Gates 1, 2, and 4** are open. **Gate 3** is closed.
* Excellent dining options include **Verde Organic & Vegetarian** near Section 117 (low crowd!) and **Global Halal Kitchen** near Section 131.
* Wheelchair-accessible entrances are available at Gates 1, 2, and 4, with the main ramp near Gate 4.
* Green Eco Water Refill Stations and recycling bins are located on the concourse levels.
* If you need specific transit routing, water refills, medical aid, or restroom locations, please ask!`;
}

/**
 * Minimizes context payload size sent to the Gemini API.
 * Trims internal database IDs, verbose structural boilerplate, and consolidates the
 * JSON representation of stadium entities. This saves input tokens, reduces latency,
 * and maintains robust context grounding.
 */
function pruneStadiumDataForAI(data: StadiumData) {
  return {
    stadiumInfo: data.stadiumInfo,
    gates: data.gates.map((g) => ({
      name: g.name,
      location: g.location,
      status: g.status,
      crowd: g.crowdDensity,
      queueTimeMinutes: g.averageQueueTimeMinutes,
      accessible: g.wheelchairAccessible,
      directions: g.directions,
    })),
    restrooms: data.restrooms.map((r) => ({
      name: r.name,
      location: r.location,
      gender: r.gender,
      accessible: r.wheelchairAccessible,
      babyChanging: r.hasBabyChangingTable,
      crowd: r.crowdDensity,
      queueTimeMinutes: r.queueTimeMinutes,
    })),
    foodStalls: data.foodStalls.map((f) => ({
      name: f.name,
      location: f.location,
      cuisine: f.cuisine,
      dietary: f.dietaryFlags,
      crowd: f.crowdDensity,
      status: f.status,
    })),
    medicalPoints: data.medicalPoints.map((m) => ({
      name: m.name,
      location: m.location,
      notes: m.accessibilityNotes,
      status: m.status,
    })),
    accessibilityRoutes: data.accessibilityRoutes,
    transitHubs: (data.transitHubs || []).map((t) => ({
      name: t.name,
      location: t.location,
      status: t.status,
      crowd: t.crowdDensity,
      waitTimeMinutes: t.waitTimeMinutes,
    })),
    sustainabilityStops: (data.sustainabilityStops || []).map((s) => ({
      name: s.name,
      location: s.location,
      features: s.features,
      crowd: s.crowdDensity,
    })),
  };
}

// 3. API: Multilingual Grounded Chat with Gemini
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "User message is required." });
    }

    // Retrieve live grounding stadium context
    const stadiumData = readStadiumData();

    // Prune the payload to conserve token window length and accelerate Gemini generation times
    const prunedContext = pruneStadiumDataForAI(stadiumData);

    /**
     * SYSTEM INSTRUCTION GROUNDING LOGIC:
     * We pass the pruned structured stadium-data JSON to the model within the systemInstruction.
     * This establishes strict grounding: the AI acts as a closed-world knowledge system,
     * answering only from this trusted dataset to eliminate hallucinations.
     */
    const systemInstruction = `
You are the "FIFA World Cup 2026 Multilingual Stadium Assistant," an expert concierge for MetLife Stadium.
Your primary objective is to assist fans navigating the stadium using ONLY the ground truth information provided below.

=== GROUND TRUTH STADIUM DATA ===
${JSON.stringify(prunedContext, null, 2)}
=================================

CRITICAL RULES:
1. MULTILINGUAL RESPONSE (LANGUAGE-DETECTION): Automatically detect the language of the user's message. Respond in the EXACT SAME language (e.g., if asked in Spanish, reply in Spanish; if in Hindi, reply in Hindi; if in English, reply in English).
2. TRUTH AND GROUNDING: Answer questions using ONLY the Ground Truth Stadium Data provided above. If the user asks about an area, service, directions, or parking lot NOT mentioned in the data, or asks you to speculate, politely decline or state that you do not have that specific information in your system. NEVER make up gates, food stalls, restrooms, or routes.
3. ACCESSIBILITY AWARENESS: If the user mentions a wheelchair, stroller, disability, difficulty walking, or being elderly, ALWAYS prioritize and recommend accessibility-friendly routes (e.g., ramps, lifts, level grounds) and specify wheelchair-accessible entrances or facilities (like Gate 1, Gate 4, Restroom 105) explicitly.
4. CROWD OPERATIONS & DENSITY AVOIDANCE: If the user asks about going to or using a location (e.g., Gate 2, Restroom 122, or Section 131 food stall) that currently has a "high" crowd density or long queue times, you MUST:
   - Warmly alert them about the high crowd density or queue.
   - Propose an alternative route or a nearby equivalent facility with "low" or "medium" density (e.g., if Gate 2 is crowded, suggest Gate 1 or Gate 4; if Restroom 122 is crowded, suggest Restroom 105 or 135; if food stall 3 is crowded, suggest food stall 2).
5. CLOSED FACILITIES: If the user asks about Gate 3 or any facility marked as "closed", clearly inform them that it is temporarily closed and redirect them to the nearest open alternative.
6. TRANSPORTATION & TRANSIT ASSISTANCE: Help fans locate Transit Hubs (e.g., NJ Transit train station, shuttle bus zones, and rideshare pickup zones), proactively alerting them of wait times and congestion levels.
7. SUSTAINABILITY & ECO-STOPS: Encourage green stadium actions! Recommend Eco-Station Recycling Hubs or Eco Water Bottle Refill Stations when fans ask about recycling, water stations, cups, or trash disposal.
8. TONE: Be professional, warm, encouraging, clear, and helpful. Use bullet points for steps to ensure high legibility.
9. STADIUM-SPECIFIC: Emphasize safe stadium operations, and keep responses concise so fans can quickly read them on their mobile devices. Do not mention any JSON keys, raw brackets, or backend terms.
`;

    try {
      const ai = getGeminiClient();
      // Keep only recent relevant messages in dialogue history to minimize payload overhead
      const chatHistory = history && Array.isArray(history) ? history.slice(-6) : [];
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...chatHistory.map((h: any) => ({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          })),
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
        },
      });

      const reply = response.text || "I apologize, but I could not formulate a reply. Please try again.";
      return res.json({ reply });
    } catch (apiErr: any) {
      console.warn("Gemini API call failed, generating localized grounded fallback:", apiErr.message || apiErr);
      const reply = generateFallbackResponse(message, stadiumData);
      return res.json({ reply });
    }

  } catch (err: any) {
    console.error("Error in /api/chat endpoint:", err);
    try {
      const stadiumData = readStadiumData();
      const reply = generateFallbackResponse(req.body.message, stadiumData);
      return res.json({ reply });
    } catch (fallbackErr) {
      res.status(500).json({ error: "Failed to generate AI response: " + err.message });
    }
  }
});

// Setup Vite development server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production build static assets from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FIFA Stadium Assistant backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
