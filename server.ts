import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { handleAdvisor, handleAnalyze, getSchemeDetailsForAdvisor } from "./src/advisorLogic";
import {
  isDairyCategory,
  buildDairyAnalysis,
  parseCsvDataLayer,
  formatCsvDataLayer,
} from "./src/dairyDataService";
import type { DairyAnalysisResult } from "./src/dairyDataService";
import {
  fetchMandiCommodityPrices,
  getSuggestedCommoditiesForCategory,
} from "./src/mandiDataService";
import { MEERUT_DATA, getTehsilMarketReach } from "./locationData";
import rawBlocksData from "./src/rawBlocksData.json";
import { testDbConnection, closeDbPool, getDbConfigStatus } from "./db";
import {
  saveBusinessComplete,
  getBusinessProfileById,
  getBusinessHistory,
  getSavedReportByCode,
  saveAdvisoryMessage,
  getAdvisoryHistoryBySession,
  logMarketScan,
} from "./src/db/businessRepository";

function categorizeGeminiError(err: any): { category: string; description: string } {
  const status = err?.status || err?.statusCode || 0;
  const msg = String(err?.message || err || "").toLowerCase();
  if (status === 429 || msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted")) {
    return { category: "QUOTA_EXCEEDED", description: "Rate limit or quota exhausted (HTTP 429)" };
  }
  if (status === 401 || status === 403 || msg.includes("401") || msg.includes("403") || msg.includes("permission_denied") || msg.includes("api_key")) {
    return { category: "AUTH_ERROR", description: "Authentication or credential error" };
  }
  if (msg.includes("timed out") || msg.includes("timeout") || msg.includes("abort")) {
    return { category: "TIMEOUT", description: "Request timed out" };
  }
  if (status === 404 || msg.includes("not found") || msg.includes("model")) {
    return { category: "INVALID_MODEL", description: "Model not found or unavailable" };
  }
  if (status >= 500) {
    return { category: "UPSTREAM_SERVER_ERROR", description: `Upstream Gemini server error (${status})` };
  }
  return { category: "GENERAL_ERROR", description: msg || "Unspecified Gemini error" };
}

function extractAmountFromText(text: string): number | null {
  if (!text) return null;
  const clean = text.toLowerCase().replace(/,/g, '');
  const lakhMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|लाख)/i);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;
  const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;
  const hazarMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:thousand|thousands|hazar|hazaar|हजार)/i);
  if (hazarMatch) return parseFloat(hazarMatch[1]) * 1000;
  const numMatch = clean.match(/(?:₹|rs\.?|inr)?\s*(\d{3,9})\b/i);
  if (numMatch) return parseFloat(numMatch[1]);
  return null;
}

if (typeof (process as any).loadEnvFile === "function") {
  try {
    (process as any).loadEnvFile();
  } catch {
    // Ignore if .env is missing or cannot be read
  }
}

let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI client:", err);
      return null;
    }
  }
  return genAIClient;
}

// Pre-index blocks data by district lowercase name for fast pan-India lookups
const panIndiaBlocksMap: Record<string, string[]> = {};

if (Array.isArray(rawBlocksData)) {
  rawBlocksData.forEach((districtObj: any) => {
    if (districtObj && districtObj.name) {
      const key = districtObj.name.toLowerCase().trim();

      const blocks = Array.isArray(districtObj.blockList)
        ? districtObj.blockList.map((b: any) => {
            const name = typeof b === "string" ? b : (b.name || "");

            return name
              .toLowerCase()
              .split(" ")
              .map(
                (word: string) =>
                  word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(" ");
          })
        : [];

      panIndiaBlocksMap[key] = blocks;
    }
  });
}

async function startServer() {

  const app = express();

  // Use Render's assigned PORT in production, with 3000 as the local fallback
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // ================= CANONICAL API ROUTES =================

  // 1. Health & Status

  app.get("/api/health", async (_req, res) => {
    let dbStatus: { connected: boolean; version?: string; database?: string; error?: string } = {
      connected: false,
    };
    try {
      dbStatus = await testDbConnection();
    } catch {
      dbStatus = { connected: false, error: "Health check query failed" };
    }

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        configured: getDbConfigStatus().isConfigured,
        connected: dbStatus.connected,
        version: dbStatus.connected ? dbStatus.version : undefined,
        database: dbStatus.connected ? dbStatus.database : undefined,
        status: dbStatus.connected ? "connected" : (dbStatus.error ? "unreachable" : "unconfigured"),
      },
    });
  });

  app.get("/api/status", async (_req, res) => {
    let dbStatus = { connected: false };
    try {
      dbStatus = await testDbConnection();
    } catch {
      // Ignore
    }

    res.json({
      message: "Vyapaar AI API is running!",
      status: "success",
      gemini_configured: Boolean(process.env.GEMINI_API_KEY),
      database_configured: getDbConfigStatus().isConfigured,
      database_connected: dbStatus.connected,
    });
  });

  // ================= EXISTING API ROUTES =================

  // ================= EXISTING API ROUTES =================

  // Keep your existing routes below this point
  // 2. SAHYOGI AI Assistant
  // Canonical: POST /api/sahyogi
  // Alias: POST /api/smrity

  const sahyogiHandler = async (
    req: express.Request,
    res: express.Response
  ) => {
    try {
      const { message, context, language, lang } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({
          error: "Message is required"
        });
        return;
      }

      const languageMap: Record<string, string> = {
        hi: "Hindi",
        en: "English",
        hinglish: "Hinglish (conversational Hindi written in English/Latin script)",
        mr: "Marathi",
        bn: "Bengali",
        te: "Telugu",
        ta: "Tamil",
      };
      const rawLang = language || lang || "hi";
      const selectedLanguage = languageMap[rawLang] || rawLang || "Hindi";

      const getFallbackGreeting = () => {
        switch (rawLang) {
          case "bn":
            return "নমস্কার! আমি সহযোগী (SAHYOGI) — আপনার গ্রামীণ ব্যবসা সঙ্গী। ব্যবসার খরচ নিয়ন্ত্রণ করুন, সময়মতো ঋণের কিস্তি পরিশোধ করুন এবং সরাসরি গ্রাহকদের সাথে বিশ্বাস গড়ে তুলুন।";
          case "mr":
            return "नमस्कार! मी सहयोगी (SAHYOGI) आहे — आपला ग्रामीण व्यवसाय मित्र. सुरुवातीचा खर्च मर्यादित ठेवा, बँकेचे हप्ते वेळेवर भरा आणि ग्राहकांचा विश्वास संपादन करा.";
          case "te":
            return "నమస్కారం! నేను సహయోగి (SAHYOGI) — మీ గ్రామీణ వ్యాపార మిత్రుడు. ఖర్చులను అదుపులో ఉంచుకోండి, సమయానికి రుణ వాయిదాలు చెల్లించండి మరియు కస్టమర్ల విశ్వాసాన్ని పొందండి.";
          case "ta":
            return "வணக்கம்! நான் சஹயோகி (SAHYOGI) — உங்கள் வணிகத் தோழன். தொடக்கச் செலவுகளைக் கட்டுப்படுத்துங்கள், வங்கித் தவணைகளைச் சரியான நேரத்தில் செலுத்துங்கள் மற்றும் வாடிக்கையாளர் நம்பிக்கையைப் பெறுங்கள்.";
          case "en":
            return "Hello! I am SAHYOGI — your rural business companion. Keep your initial startup costs tight, service your bank EMIs on time, and build direct customer trust.";
          case "hi":
          default:
            return "नमस्ते! मैं सहयोगी (SAHYOGI) हूँ — आपका ग्रामीण व्यापार साथी। अपने व्यापार को सफल बनाने के लिए शुरुआती लागत नियंत्रित रखें, समय पर बैंक किश्त भरें, और ग्राहकों से सीधा संपर्क बनाकर विश्वास अर्जित करें।";
        }
      };

      const ai = getGeminiClient();
      if (!ai) {
        res.json({
          reply: getFallbackGreeting(),
          source: "fallback",
        });
        return;
      }

      let contextStr = "";
      if (context && typeof context === "object") {
        contextStr = `\nCurrent User Business Profile:\n${JSON.stringify(context, null, 2)}`;
        const cat = context.businessType || context.category || "";
        if (isDairyCategory(cat) || message.includes("Dist_Population") || message.includes("[CSV DATA LAYER]")) {
          const dData = buildDairyAnalysis({
            district: context.district || "Meerut",
            monthlyRevenue: context.monthlyRevenue || context.monthly_revenue,
            monthlyExpenses: context.monthlyExpenses || context.monthly_expenses,
            monthlyEmi: context.monthlyEmi || context.monthly_emi,
            projectCost: context.totalProjectCost || context.project_cost,
          });
          contextStr += `\n==== DAIRY SECTOR MACRO-DEMOGRAPHICS & MARKET GAP ====
[CSV DATA LAYER]
${dData.csv_data_layer}
Price Arbitrage: ${dData.price_arbitrage.explanation}
Demographic Targeting: ${dData.demographic_targeting.explanation}
Market Sizing: ${dData.market_sizing.explanation}`;
        }
      }

      const systemInstruction = `You are "SAHYOGI" (सहयोगी), a friendly, respectful, and practical AI business companion built for "Vyapaar AI".
Your purpose is to assist rural and semi-urban micro-entrepreneurs in India with honesty and clarity.
Core Guidelines:
- Ground your advice in the provided business profile. If a financial figure or metric is not provided, null, or zero, do not quote it as ₹0 or blank; simply state that detailed financial projections will be available once inputs are submitted or focus on practical guidance.
- Answer entirely in the requested language: ${selectedLanguage} (e.g. if Bengali, speak in natural Bengali script; if Marathi, speak in Marathi; if Telugu, speak in Telugu; if Tamil, speak in Tamil; if Hindi, speak in Hindi; if Hinglish, speak in Hinglish; if English, speak in English).
- When discussing government schemes, clearly state that loan eligibility is subject to official verification and sanction by the lending bank.
- Keep explanations simple, realistic, and encouraging, like a wise, trusted local business elder.
${contextStr}`;

      let reply = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        reply = response.text ? response.text.trim() : "";
      } catch (e1: any) {
        console.warn("Sahyogi gemini-3.8-flash error, retrying with fallback model:", e1?.message || e1);
        try {
          const response2 = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: message,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          reply = response2.text ? response2.text.trim() : "";
        } catch (e2: any) {
          console.warn("Sahyogi gemini-flash-latest error:", e2?.message || e2);
        }
      }

      if (!reply) {
        const fallback = handleAdvisor({
          question: message,
          business_name: context?.businessName || context?.business_name,
          category: context?.category || context?.businessType,
          language: selectedLanguage,
        });
        reply =
          fallback.answer || getFallbackGreeting();
      }

      res.json({ reply, source: "gemini" });
    } catch (error: any) {
      console.warn("Sahyogi Gemini call failed:", error?.message || error);
      const rawLang = req.body?.language || req.body?.lang || "hi";
      const fallback = handleAdvisor({
        question: req.body?.message || "",
        language: rawLang,
      });
      res.json({
        reply:
          fallback.answer ||
          (rawLang === "bn"
            ? "নমস্কার! ব্যবসা শুরু করার সময় নিজস্ব পুঁজি হিসাব করে খরচ করুন এবং সরকারি প্রকল্পের সহায়তা নিন।"
            : rawLang === "mr"
            ? "नमस्कार! व्यवसाय सुरू करताना भांडवल विचारपूर्वक वापरा आणि सरकारी योजनांचा योग्य लाभ घ्या."
            : rawLang === "te"
            ? "నమస్కారం! వ్యాపారం ప్రారంభించేటప్పుడు ఖర్చులను నియంత్రించండి మరియు ప్రభుత్వ పథకాల ప్రయోజనాలను పొందండి."
            : rawLang === "ta"
            ? "வணக்கம்! வணிகத்தைத் தொடங்கும் போது முதலீட்டை கவனமாக செலவிடுங்கள் மற்றும் அரசு திட்டங்களின் பலன்களைப் பெறுங்கள்."
            : "नमस्ते! अपने व्यापार को सफल बनाने के लिए शुरुआती लागत सीमित रखें और सरकारी योजनाओं के तहत मिलने वाले ऋण का सदुपयोग करें।"),
        source: "fallback",
      });
    }
  };

  app.post("/api/sahyogi", sahyogiHandler);
  app.post("/api/smrity", sahyogiHandler); // Backward-compatible alias

  // 3. Location Demographics & Market Reach (Canonical: GET /api/market-reach)
  const getMarketReachHandler = (req: express.Request, res: express.Response) => {
    const district =
      (req.query.district as string) ||
      (req.body?.district as string) ||
      "";
    const block =
      (req.query.block as string) ||
      (req.query.tehsil as string) ||
      (req.body?.block as string) ||
      (req.body?.tehsil as string) ||
      district;
    const radiusParam =
      req.query.radiusKm || req.query.radius_km || req.body?.radiusKm || req.body?.radius_km;
    const radiusKm = radiusParam ? parseFloat(String(radiusParam)) : 5;

    const reach = getTehsilMarketReach(district, block, radiusKm);
    res.json(reach);
  };

  app.get("/api/market-reach", getMarketReachHandler);
  app.post("/api/market-reach", getMarketReachHandler);
  app.get("/market-reach", getMarketReachHandler); // Compatibility alias
  app.post("/market-reach", getMarketReachHandler);

  // 4. Pan-India District Blocks / Tehsils (Canonical: GET /api/locations/tehsils)
  const getTehsilsHandler = (req: express.Request, res: express.Response) => {
    const district = ((req.query.district as string) || "").trim();
    if (!district) {
      res.json({
        district: "",
        has_verified_data: false,
        tehsils: [],
      });
      return;
    }

    const cleanLower = district.toLowerCase();

    // Check Meerut benchmark profile first
    if (cleanLower === "meerut") {
      res.json({
        district: MEERUT_DATA.district,
        has_verified_data: true,
        tehsils: Object.keys(MEERUT_DATA.tehsils),
        details: MEERUT_DATA.tehsils,
      });
      return;
    }

    // Check nationwide blocks database
    if (panIndiaBlocksMap[cleanLower] && panIndiaBlocksMap[cleanLower].length > 0) {
      res.json({
        district,
        has_verified_data: true,
        tehsils: panIndiaBlocksMap[cleanLower],
      });
      return;
    }

    // Fuzzy check
    const matchedKey = Object.keys(panIndiaBlocksMap).find(
      (k) => k === cleanLower || k.includes(cleanLower) || cleanLower.includes(k)
    );
    if (matchedKey && panIndiaBlocksMap[matchedKey].length > 0) {
      res.json({
        district,
        has_verified_data: true,
        tehsils: panIndiaBlocksMap[matchedKey],
      });
      return;
    }

    res.json({
      district,
      has_verified_data: false,
      tehsils: [],
    });
  };

  app.get("/api/locations/tehsils", getTehsilsHandler);
  app.get("/locations/tehsils", getTehsilsHandler); // Compatibility alias
  app.get("/api/location/meerut", (_req, res) => res.json(MEERUT_DATA)); // Reference dataset alias
  app.get("/api/location-data", (_req, res) => res.json({ districts: [MEERUT_DATA] }));

  // 5. Business Analysis (Canonical: POST /api/analyze)
  const analyzeHandler = async (req: express.Request, res: express.Response) => {
    try {
      const result = handleAnalyze(req.body);
      const business_category = req.body?.category || result.category || "General Enterprise";
      const district = (req.body?.district || result.district || "").trim();
      const block = (req.body?.block || result.block || district || "").trim();
      const radiusKm = req.body?.radius_km || req.body?.radiusKm || 5;
      const pin = req.body?.pin || "";

      // Demographics calculated dynamically using block and district
      const hyperLocalData = getTehsilMarketReach(district, block, Number(radiusKm));

      const projectCost =
        result.scheme_analysis?.project_cost ||
        (req.body?.investment != null && !isNaN(Number(req.body.investment)) ? Number(req.body.investment) / 0.1 : 0);

      // Preserve SIH26091 core scheme as authoritative route
      const schemeRoute =
        result.scheme_analysis?.scheme_name ||
        "Micro Finance Scheme";
      const schemeDetails =
        (result.scheme_analysis as any)?.message ||
        "SIH26091 Core Scheme Financing";

      // Populate calibrated block demographics
      if (result.hyper_local_profile) {
        result.hyper_local_profile.market_reach = {
          ...result.hyper_local_profile.market_reach,
          ...hyperLocalData,
          service_area: district ? `5–10 km radius covering ${block || district}, ${district}` : "5–10 km local catchment area",
          consumer_base: `${hyperLocalData.reachable_consumers.toLocaleString("en-IN")} reachable consumers (~${hyperLocalData.reachable_households.toLocaleString("en-IN")} households)`,
          consumer_base_status: hyperLocalData.consumer_base_status,
          data_source: hyperLocalData.data_source,
          reach_type: `${hyperLocalData.zone_classification} • ${block || "Local"} Catchment`,
        };
        if (hyperLocalData.dominant_local_clusters?.length) {
          (result.hyper_local_profile as any).dominant_clusters = hyperLocalData.dominant_local_clusters;
        }
        if (hyperLocalData.district_bottlenecks?.length) {
          (result.hyper_local_profile as any).district_bottlenecks = hyperLocalData.district_bottlenecks;
        }
      }

      // Language handling
      const languageMap: Record<string, string> = {
        hi: "Hindi",
        en: "English",
        hinglish: "Hinglish (conversational Hindi written in English/Latin script)",
        mr: "Marathi",
        bn: "Bengali",
        te: "Telugu",
        ta: "Tamil",
      };
      const rawLang = req.body?.selectedLanguage || req.body?.language || "Hindi";
      const selectedLanguage = languageMap[rawLang] || rawLang;

      const locationLabel = [block, district].filter(Boolean).join(", ") || "the specified local area";

      // Dairy sector macro-demographics & market gap layer integration
      // CRITICAL CONDITION: ONLY apply if category is Dairy & Milk Products
      let dairyPromptSection = "";
      let dairyAnalysisResult: DairyAnalysisResult | null = null;
      if (isDairyCategory(business_category)) {
        dairyAnalysisResult = buildDairyAnalysis({
          district,
          monthlyRevenue: req.body?.monthly_revenue ? Number(req.body.monthly_revenue) : (result.financial_analysis?.monthly_revenue ?? null),
          monthlyExpenses: req.body?.monthly_expenses ? Number(req.body.monthly_expenses) : (result.financial_analysis?.monthly_expenses ?? null),
          monthlyEmi: result.loan_affordability?.monthly_emi,
          projectCost,
        });

        result.dairy_analysis = dairyAnalysisResult;

        dairyPromptSection = `
CRITICAL INSTRUCTION FOR DAIRY CATEGORY:
==== DAIRY SECTOR MACRO-DEMOGRAPHICS & MARKET GAP ====
[CSV DATA LAYER]
${dairyAnalysisResult.csv_data_layer}

You must integrate the following into your market_summary:
- Price Arbitrage (from Price Layer): Compare the Local_Sourcing_Price (₹${dairyAnalysisResult.local_sourcing_price.toFixed(2)}/kg) to Nat_Retail_Avg (₹61.45/kg) and Nat_Wholesale_Avg (₹57.63/kg). ${dairyAnalysisResult.price_arbitrage.status === "Strong Sourcing Advantage" ? 'Since local cost is significantly lower, explicitly state they have a "Strong Sourcing Advantage" and should focus on volume.' : 'Since local cost is near or above the national average, warn them of "Margin Compression" and advise premium retail packaging.'}
- Demographic Targeting (from District Gap Layer): Analyze the Agri_Workers (${dairyAnalysisResult.agri_workers.toLocaleString("en-IN")}) relative to Dist_Population (${dairyAnalysisResult.dist_population.toLocaleString("en-IN")}). Since the district has a high concentration of agricultural workers, you MUST suggest a secondary B2B revenue stream tailored to farmers (e.g., selling cattle feed, urea, or tractor rentals).
- Market Sizing (from Integrated Dataset): Use the district population (${dairyAnalysisResult.dist_population.toLocaleString("en-IN")}) to mathematically validate if there are enough potential local buyers to support their proposed production scale and EMI payments.`;
      }

      const prompt = `You are an honest, experienced rural business advisor in India.
The user wants to start a ${business_category} business in ${locationLabel}${pin ? ` (PIN: ${pin})` : ""}.
Context: Estimated Catchment: ~${hyperLocalData.reachable_consumers} consumers; Zone: ${hyperLocalData.zone_classification}; Estimated Project Cost: ₹${projectCost}; Screened Scheme: ${schemeRoute}.
${dairyPromptSection}

Generate a market_summary consisting of EXACTLY TWO flowing paragraphs (about 6 to 8 sentences total):

Paragraph 1: Discuss the demand viability for a ${business_category} in ${locationLabel}. Note that actual local competition should be confirmed by a physical field visit, and discuss whether the local catchment can support steady sales. State clearly that scheme sanction is subject to official bank appraisal.${dairyAnalysisResult ? ` Incorporate Price Arbitrage (${dairyAnalysisResult.price_arbitrage.status === "Strong Sourcing Advantage" ? 'explicitly stating a "Strong Sourcing Advantage" and focusing on volume' : 'warning of "Margin Compression" and advising premium retail packaging'}) and Market Sizing (using district population of ${dairyAnalysisResult.dist_population.toLocaleString("en-IN")} to mathematically validate local buyers for production scale and EMI payments).` : ''}

Paragraph 2: Provide a practical, low-cost operational tip on how the entrepreneur can gain customer trust in rural/semi-urban markets (e.g., direct relationships, weekly market presence, quality consistency, fair pricing).${dairyAnalysisResult ? ` Suggest a secondary B2B revenue stream tailored to farmers (e.g., selling cattle feed, urea, or tractor rentals) given the high concentration of agricultural workers (${dairyAnalysisResult.agri_workers.toLocaleString("en-IN")} workers).` : ''}

STRICT CONSTRAINTS:
- Output exactly 2 flowing paragraphs separated by a single blank line.
- DO NOT use markdown symbols, asterisks (*), hashtags (#), or bullet points.
- Do NOT fabricate specific competitor shop counts; speak in realistic business terms.
- Write entirely in: ${selectedLanguage}`;

      let market_summary = "";
      try {
        const geminiClient = getGeminiClient();
        if (geminiClient) {
          let aiResponse;
          try {
            aiResponse = await geminiClient.models.generateContent({
              model: "gemini-3.8-flash",
              contents: prompt,
            });
          } catch (e1) {
            console.warn("gemini-3.8-flash error in analyze, retrying:", (e1 as any)?.message);
            aiResponse = await geminiClient.models.generateContent({
              model: "gemini-flash-latest",
              contents: prompt,
            });
          }
          market_summary = aiResponse.text ? aiResponse.text.trim().replace(/[*#_`]/g, "") : "";
        }
      } catch (geminiErr: any) {
        console.warn("Gemini market summary unavailable:", geminiErr?.message || geminiErr);
      }

      if (!market_summary) {
        if (dairyAnalysisResult) {
          if (rawLang === "bn") {
            market_summary = `দুগ্ধ খাত ম্যাক্রো-জনমিতি ও বাজার ব্যবধান রিপোর্ট:
১. মূল্যের সুযোগ: স্থানীয় দুধ সংগ্রহের হার (₹${dairyAnalysisResult.local_sourcing_price.toFixed(2)}/কেজি) জাতীয় পাইকারি গড় (₹${dairyAnalysisResult.nat_wholesale_avg.toFixed(2)}/কেজি) এর চেয়ে কম, যা লাভজনক ব্যবধান প্রদান করে।
২. কৃষক B2B লক্ষ্য: জেলায় ${dairyAnalysisResult.agri_workers.toLocaleString("en-IN")} জন কৃষি শ্রমিক রয়েছে। গোখাদ্য ও সম্পূরক বিক্রয় করে বাড়তি আয় তৈরি করুন।
৩. বাজার আকার: জেলার মোট জনসংখ্যা (${dairyAnalysisResult.dist_population.toLocaleString("en-IN")}) দ্বারা প্রমাণিত যে উৎপাদন ও ঋণের কিস্তি সহজেই সমন্বয় করা সম্ভব।`;
          } else if (rawLang === "mr") {
            market_summary = `दुग्ध व्यवसाय मॅक्रो-डेमोग्राफिक्स व बाजार अंतर अहवाल:
1. दर फरक: स्थानिक दुधाचा खरेदी दर (₹${dairyAnalysisResult.local_sourcing_price.toFixed(2)}/किलो) राष्ट्रीय घाऊक सरासरीपेक्षा (₹${dairyAnalysisResult.nat_wholesale_avg.toFixed(2)}/किलो) कमी असल्याने चांगला नफा उपलब्ध आहे.
2. शेतकरी B2B उद्दिष्ट: जिल्ह्यात ${dairyAnalysisResult.agri_workers.toLocaleString("en-IN")} शेतमजूर आहेत. पशुखाद्य व पूरक आहार पुरवून अतिरिक्त उत्पन्न मिळवा.
3. बाजार आकार: जिल्ह्याची एकूण लोकसंख्या (${dairyAnalysisResult.dist_population.toLocaleString("en-IN")}) हे सिद्ध करते की उत्पादनाची विक्री व बँकेचा हप्ता सहजपणे भरता येईल.`;
          } else if (rawLang === "te") {
            market_summary = `డైరీ రంగం స్థూల జనాభా & మార్కెట్ అంతరం నివేదిక:
1. ధర వ్యత్యాసం: స్థానిక పాల సేకరణ ధర (₹${dairyAnalysisResult.local_sourcing_price.toFixed(2)}/కిలో) జాతీయ సగటు కంటే తక్కువగా ఉండటం వల్ల మంచి లాభం లభిస్తుంది.
2. రైతు B2B లక్ష్యం: జిల్లాలో ${dairyAnalysisResult.agri_workers.toLocaleString("en-IN")} వ్యవసాయ కార్మికులు ఉన్నారు. పశుగ్రాసం, దాణా విక్రయాల ద్వారా అదనపు ఆదాయం పొందవచ్చు.
3. మార్కెట్ పరిమాణం: జిల్లా జనాభా (${dairyAnalysisResult.dist_population.toLocaleString("en-IN")}) ద్వారా ఉత్పత్తి అమ్మకాలు మరియు బ్యాంక్ EMI సులభంగా భరించవచ్చని రుజువవుతోంది.`;
          } else if (rawLang === "ta") {
            market_summary = `பால் பண்ணை துறை மேக்ரோ-மக்கள்தொகை & சந்தை இடைவெளி அறிக்கை:
1. விலை வேறுபாடு: உள்ளூர் பால் கொள்முதல் விலை (₹${dairyAnalysisResult.local_sourcing_price.toFixed(2)}/கிலோ) தேசிய மொத்த விலையை விட குறைவாக இருப்பதால் நல்ல லாபம் கிடைக்கும்.
2. விவசாயி B2B இலக்கு: மாவட்டத்தில் ${dairyAnalysisResult.agri_workers.toLocaleString("en-IN")} விவசாயத் தொழிலாளர்கள் உள்ளனர். கால்நடை தீவனம் விற்பனை செய்வதன் மூலம் கூடுதல் வருமானம் ஈட்டலாம்.
3. சந்தை அளவு: மாவட்ட மக்கள்தொகை (${dairyAnalysisResult.dist_population.toLocaleString("en-IN")}) உற்பத்தியை விற்று வங்கி தவணையை எளிதாக செலுத்த முடியும் என்பதை உறுதி செய்கிறது.`;
          } else if (rawLang === "hi") {
            market_summary = `${dairyAnalysisResult.summary_report_hi}`;
          } else {
            market_summary = `${dairyAnalysisResult.summary_report}`;
          }
        } else {
          switch (rawLang) {
            case "bn":
              market_summary = `স্থানীয় বাজারে ${business_category} ব্যবসার জন্য নিয়মিত ভোক্তা চাহিদা রয়েছে। এই অঞ্চলে সাফল্য প্রধানত সঠিক মূল্য নির্ধারণ এবং গ্রাহকদের আস্থার ওপর নির্ভর করবে। সরকারি ঋণ প্রকল্প (${schemeRoute}) এর আওতায় যোগ্যতা একটি প্রাথমিক পর্যালোচনা যার চূড়ান্ত অনুমোদন ব্যাংক যাচাইয়ের ওপর নির্ভরশীল।\n\nগ্রাহকদের বিশ্বাস দ্রুত অর্জন করতে প্রথম দিন থেকেই পণ্যের মান ও সঠিক সেবায় জোর দিন। আশেপাশের পরিবার ও দোকানদারদের সাথে সরাসরি যোগাযোগ রাখুন এবং বাজারে নিয়মিত উপস্থিতি নিশ্চিত করুন।`;
              break;
            case "mr":
              market_summary = `स्थानिक बाजारपेठेत ${business_category} साठी नियमित ग्राहक मागणी अपेक्षित आहे. या भागात यश प्रामुख्याने योग्य दर व ग्राहकांचा विश्वास यावर अवलंबून असेल. सरकारी कर्ज योजनेअंतर्गत (${schemeRoute}) पात्रता ही प्राथमिक तपासणी असून अंतिम मंजुरी बँकेच्या पडताळणीवर अवलंबून आहे.\n\nग्राहकांचा विश्वास संपादन करण्यासाठी पहिल्या दिवसापासून गुणवत्तेवर भर द्या. स्थानिक कुटुंबे व दुकानदारांशी थेट संबंध ठेवा आणि बाजारात नियमित उपस्थिती राखा.`;
              break;
            case "te":
              market_summary = `స్థానిక మార్కెట్‌లో ${business_category} కోసం స్థిరమైన డిమాండ్ ఉంది. సరసమైన ధరలు మరియు కస్టమర్ల నమ్మకం వ్యాపార విజయానికి కీలకం. ప్రభుత్వ రుణ పథకం (${schemeRoute}) కింద అర్హత ప్రాథమికమైనది మరియు తుది మంజూరు బ్యాంక్ పరిశీలనపై ఆధారపడి ఉంటుంది.\n\nకస్టమర్ల విశ్వాసాన్ని త్వరగా పొందడానికి నాణ్యమైన ఉత్పత్తులను అందించండి. స్థానిక కుటుంబాలతో నేరుగా సంబంధాలు కొనసాగించండి.`;
              break;
            case "ta":
              market_summary = `உள்ளூர் சந்தையில் ${business_category} தொழிலுக்கு நிலையான நுகர்வோர் தேவை உள்ளது. நியாயமான விலை மற்றும் வாடிக்கையாளர் நம்பிக்கை ஆகியவை வெற்றிக்கு முக்கியம். அரசு கடன் திட்டம் (${schemeRoute}) கீழ் தகுதி என்பது முதற்கட்ட சரிபார்ப்பு மட்டுமே, இறுதி ஒப்புதல் வங்கி ஆய்வுக்கு உட்பட்டது.\n\nவாடிக்கையாளர் நம்பிக்கையை விரைவாகப் பெற தரமான தயாரிப்புகளை வழங்குங்கள். உள்ளூர் குடும்பங்களுடன் நேரடி தொடர்பை பேணுங்கள்.`;
              break;
            case "hi":
              market_summary = `स्थानीय बाज़ार में ${business_category} के लिए नियमित उपभोक्ता माँग का अनुमान लगाया गया है। इस क्षेत्र में सफलता मुख्य रूप से उचित मूल्य निर्धारण और ग्राहकों के विश्वास पर निर्भर करेगी। सरकारी लोन योजना (${schemeRoute}) के तहत पात्रता एक प्रारंभिक स्क्रीनिंग है जिसकी अंतिम स्वीकृति बैंक सत्यापन पर निर्भर है।\n\nग्राहकों का विश्वास तेज़ी से बनाने के लिए पहले दिन से ही उत्पाद की गुणवत्ता और समय पर सेवा पर विशेष ध्यान दें। नज़दीकी परिवारों व स्थानीय दुकानदारों से सीधा संपर्क रखें और बाज़ार में अपनी नियमित उपस्थिति दर्ज कराएं।`;
              break;
            default:
              market_summary = `There is steady daily demand potential for ${business_category} across ${locationLabel}. Business viability will depend heavily on maintaining competitive pricing and building direct community trust. Note that government scheme (${schemeRoute}) alignment is a preliminary screening and final sanction depends on bank appraisal.\n\nTo build initial customer loyalty, focus on consistent product purity and transparent dealings rather than relying solely on foot traffic. Cultivating direct relationships with local families and neighborhood stores will generate reliable repeat business.`;
          }
        }
      }

      res.json({
        ...result,
        scheme_route: schemeRoute,
        scheme_details: schemeDetails,
        market_summary,
        feasibility_report: market_summary,
      });
    } catch (err: any) {
      console.error("Analyze error:", err);
      res.status(500).json({ error: err?.message || "Failed to analyze business" });
    }
  };

  app.post("/api/analyze", analyzeHandler);
  app.post("/analyze", analyzeHandler); // Compatibility alias

  // 6. Advisor Q&A (Canonical: POST /api/advisor)
  const advisorHandler = async (req: express.Request, res: express.Response) => {
    try {
      const message = (req.body?.message || req.body?.question || "").trim();
      const businessContext = req.body?.businessContext || req.body?.context || {};

      if (!message) {
        res.status(400).json({ error: "Message or question is required" });
        return;
      }

      const languageMap: Record<string, string> = {
        hi: "Hindi",
        en: "English",
        hinglish: "Hinglish (conversational Hindi written in English/Latin script)",
        mr: "Marathi",
        bn: "Bengali",
        te: "Telugu",
        ta: "Tamil",
      };
      const rawLang = req.body?.selectedLanguage || req.body?.language || "Hindi";
      const selectedLanguage = languageMap[rawLang] || rawLang;

      const bName = businessContext.businessName || "Your Enterprise";
      const bDistrict = businessContext.district || "Local Area";
      const bState = businessContext.state || "";
      const bScheme = businessContext.matchedScheme || "Government Credit Scheme";
      const bProjectCost =
        businessContext.totalProjectCost ??
        businessContext.project_cost ??
        businessContext.projectCost ??
        (businessContext.promoterMargin != null ? Number(businessContext.promoterMargin) / 0.1 : undefined);

      const bMarginVal =
        businessContext.promoterMargin ??
        businessContext.promoter_margin ??
        businessContext.margin_capital ??
        businessContext.investment ??
        (bProjectCost != null ? Number(bProjectCost) * 0.1 : undefined);

      const bLoanVal =
        businessContext.eligibleLoan ??
        businessContext.eligible_loan ??
        (bProjectCost != null && bMarginVal != null ? Number(bProjectCost) - Number(bMarginVal) : undefined);

      const bEmiVal =
        businessContext.monthlyEmi ??
        businessContext.monthly_emi ??
        undefined;

      const bInterestRate =
        businessContext.interestRate ??
        businessContext.loanInterestRate ??
        businessContext.interest_rate ??
        undefined;

      const bTenureMonths =
        businessContext.loanTenureMonths ??
        businessContext.loanTenure ??
        businessContext.tenure_months ??
        undefined;

      const bMoratoriumMonths =
        businessContext.moratoriumMonths ??
        businessContext.moratorium_months ??
        undefined;

      const bRevenue =
        businessContext.monthlyRevenue ??
        businessContext.monthly_revenue ??
        undefined;

      const bExpenses =
        businessContext.monthlyExpenses ??
        businessContext.monthly_expenses ??
        undefined;

      const bProfit =
        businessContext.monthlyProfit ??
        businessContext.monthly_profit ??
        undefined;

      const bRoi =
        businessContext.roiPercentage ??
        businessContext.roi_percentage ??
        undefined;

      const bAffordability =
        businessContext.affordabilityStatus ??
        businessContext.affordability_status ??
        "Requires Verification";

      const bFeasibility =
        businessContext.feasibilityVerdict ||
        businessContext.feasibility ||
        "Requires Verification";

      const bMarginStr =
        bMarginVal != null
          ? `₹${Number(bMarginVal).toLocaleString("en-IN")}`
          : "Not specified";
      const bLoanStr =
        bLoanVal != null
          ? `₹${Number(bLoanVal).toLocaleString("en-IN")}`
          : "Not specified";
      const bEmiStr =
        bEmiVal != null
          ? `₹${Number(bEmiVal).toLocaleString("en-IN")}`
          : "Not specified";
      const bProjectCostStr =
        bProjectCost != null
          ? `₹${Number(bProjectCost).toLocaleString("en-IN")}`
          : "Not specified";
      const bProfitStr =
        bProfit != null
          ? `₹${Number(bProfit).toLocaleString("en-IN")}`
          : "Not specified";

      const localMarketStr =
        businessContext.localMarketContext ||
        "Local Market Context: Live field scan data pending or not supplied.";

      const profileHeader = `PROFILE:
Business: ${bName} (${businessContext.businessType || "Enterprise"})
Location: ${bDistrict}${bState ? `, ${bState}` : ""} (Block: ${businessContext.block || bDistrict})
Total Project Cost: ${bProjectCostStr}
Promoter Margin (10%): ${bMarginStr}
Eligible Bank Loan (90%): ${bLoanStr}
Screened Scheme: ${bScheme} (Interest: ${bInterestRate != null ? `${bInterestRate}%` : "Lender determined / requires bank appraisal"}, Tenure: ${bTenureMonths != null ? `${bTenureMonths} months` : "Per scheme guidelines"}, Moratorium: ${bMoratoriumMonths != null ? `${bMoratoriumMonths} months` : "Per scheme guidelines"})
Monthly Loan EMI: ${bEmiStr}
Monthly Revenue: ${bRevenue != null ? `₹${Number(bRevenue).toLocaleString("en-IN")}` : "Not provided"}
Monthly Expenses: ${bExpenses != null ? `₹${Number(bExpenses).toLocaleString("en-IN")}` : "Not provided"}
Net Monthly Profit: ${bProfitStr}
Annual ROI: ${bRoi != null ? `${bRoi}%` : "Requires input"}
Feasibility: ${bFeasibility} | Affordability: ${bAffordability}
${localMarketStr}`;

      // ================= BACKEND DETERMINISTIC FINANCIAL ARITHMETIC =================
      // LLM MUST NOT PERFORM CORE FINANCIAL ARITHMETIC OR OVERRIDE THESE VALUES
      const numRevenue = bRevenue != null && !isNaN(Number(bRevenue)) ? Number(bRevenue) : null;
      const numExpenses = bExpenses != null && !isNaN(Number(bExpenses)) ? Number(bExpenses) : null;
      const numEmi = bEmiVal != null && !isNaN(Number(bEmiVal)) ? Number(bEmiVal) : null;

      const operatingSurplus = (numRevenue != null && numExpenses != null) ? numRevenue - numExpenses : null;
      const surplusAfterEmi = (operatingSurplus != null && numEmi != null) ? operatingSurplus - numEmi : null;
      const breakEvenRevenue = numExpenses != null ? numExpenses + (numEmi || 0) : null;

      // Dynamic Stress Testing Pre-Calculations
      const parsedAmount = extractAmountFromText(message);
      const isCostIncreaseQuery = /\b(?:costs?|expenses?|kharcha|kharch)\s*(?:increase|rise|grow|badh|badha|badhe|badhta)\b|\b(?:increase|badha|badhe)\s*(?:in\s*)?(?:costs?|expenses?|kharcha)\b/i.test(message) || /खर्च.*बढ़/.test(message);
      const isSalesDropQuery = /\b(?:sales?|revenue|bikri|kamai)\s*(?:drop|fall|decrease|down|lower|kam|ghat|gire)\b|\bwhat\s+if\s+sales\s+are\s+lower\b/i.test(message) || /(?:बिक्री|कमाई).*घट/.test(message);

      let stressCalculationText = "";
      if (isCostIncreaseQuery) {
        const delta = parsedAmount != null && parsedAmount > 0 ? parsedAmount : 5000;
        const curRev = numRevenue ?? 45000;
        const curExp = numExpenses ?? 22000;
        const curE = numEmi ?? 14835;
        const newExp = curExp + delta;
        const curSurplus = curRev - curExp;
        const newOpSurplus = curRev - newExp;
        const newSurplusAfter = newOpSurplus - curE;

        stressCalculationText = `
STRESS TEST PRE-CALCULATED SCENARIO (COST INCREASE):
- Current Stated Revenue: ₹${curRev.toLocaleString("en-IN")}
- Current Stated Operating Costs: ₹${curExp.toLocaleString("en-IN")}
- Monthly EMI: ₹${curE.toLocaleString("en-IN")}
- Cost Increase Tested: +₹${delta.toLocaleString("en-IN")}
- New Stressed Operating Costs: ₹${newExp.toLocaleString("en-IN")}
- Current Operating Surplus: ₹${curSurplus.toLocaleString("en-IN")}
- New Stressed Operating Surplus: ₹${newOpSurplus.toLocaleString("en-IN")}
- New Surplus After EMI: ₹${newSurplusAfter.toLocaleString("en-IN")}
- Serviceability Status: ${newSurplusAfter >= 0 ? `Mathematically serviceable with reduced buffer of ₹${newSurplusAfter.toLocaleString("en-IN")}` : "Deficit / cash flow strain risk"}
(Rule: Quote these exact figures; do not recalculate)`;
      } else if (isSalesDropQuery) {
        const curRev = numRevenue ?? 45000;
        const curExp = numExpenses ?? 22000;
        const curE = numEmi ?? 14835;
        let newRev: number;
        let dropDesc: string;
        if (parsedAmount != null && parsedAmount > 0 && parsedAmount < curRev) {
          if (parsedAmount <= 100) {
            newRev = Math.round(curRev * (1 - parsedAmount / 100));
            dropDesc = `${parsedAmount}% drop`;
          } else {
            newRev = curRev - parsedAmount;
            dropDesc = `₹${parsedAmount.toLocaleString("en-IN")} reduction`;
          }
        } else {
          newRev = Math.round(curRev * 0.7);
          dropDesc = "30% sales drop";
        }
        const newOpSurplus = newRev - curExp;
        const newSurplusAfter = newOpSurplus - curE;

        stressCalculationText = `
STRESS TEST PRE-CALCULATED SCENARIO (SALES DOWNTURN):
- Baseline Stated Revenue: ₹${curRev.toLocaleString("en-IN")}
- Stressed Revenue (${dropDesc}): ₹${newRev.toLocaleString("en-IN")}
- Current Stated Operating Costs: ₹${curExp.toLocaleString("en-IN")}
- Monthly EMI: ₹${curE.toLocaleString("en-IN")}
- New Stressed Operating Surplus: ₹${newOpSurplus.toLocaleString("en-IN")}
- New Surplus After EMI: ₹${newSurplusAfter.toLocaleString("en-IN")}
- Serviceability Status: ${newSurplusAfter >= 0 ? `Mathematically serviceable with reduced buffer of ₹${newSurplusAfter.toLocaleString("en-IN")}` : "Deficit / cash flow strain risk"}
(Rule: Quote these exact figures; do not recalculate)`;
      }

      // Check for scheme questions to inject official scheme dataset
      let schemeOfficialText = "";
      const isSchemeQuery = /\b(documents?|kagaz|dastavez|scheme|eligibility|guidelines|pmmy|pmegp|pmfme|mudra)\b/i.test(message) || /योजना|कागजात|दस्तावेज/.test(message);
      if (isSchemeQuery) {
        const schemeObj = getSchemeDetailsForAdvisor(bScheme, businessContext.businessType || businessContext.category);
        if (schemeObj) {
          schemeOfficialText = `
OFFICIAL GOVERNMENT SCHEME DATASET (JanSamarth / Official Ministry Rules):
- Scheme Name: ${schemeObj.scheme_name} (${schemeObj.short_name || schemeObj.scheme_id})
- Implementing Ministry/Agency: ${schemeObj.ministry || "Ministry of MSME"} / ${schemeObj.implementing_agency || "Member Lending Institutions"}
- Official Documents Required: ${(schemeObj.documents || []).join(", ")}
- Source Organization: ${schemeObj.official_source?.organization || "Official portal"} (Verified date: ${schemeObj.official_source?.verified_date || "2026-09-24"})
- Lender Rule Note: Official lending rate and sanction are determined by the financing bank under applicable scheme rules upon branch appraisal.`;
        }
      }

      // ================= DAIRY SECTOR MACRO-DEMOGRAPHICS & MARKET GAP =================
      // CRITICAL CONDITION: ONLY apply this specific demographic and pricing analysis if the user's business category
      // is "Dairy & Milk Products" (e.g., dairy farm, milk processing, ghee manufacturing). For all other businesses, ignore this section.
      const bCategory = businessContext.businessType || businessContext.category || req.body?.category || "";
      const hasCsvInQuery = message.includes("Dist_Population") || message.includes("[CSV DATA LAYER]");
      const isDairy = isDairyCategory(bCategory) || hasCsvInQuery;

      let dairyOfficialBlock = "";
      let dairyAnalysisData: DairyAnalysisResult | null = null;

      if (isDairy) {
        let customCsv = parseCsvDataLayer(message);
        if (!customCsv && businessContext.csvDataLayer) {
          customCsv = parseCsvDataLayer(businessContext.csvDataLayer);
        }

        let customSourcing = businessContext.localSourcingPrice || businessContext.sourcingPrice || null;
        if (!customSourcing) {
          const matchSourcing = message.match(/(?:sourcing|purchase|buying|procurement|cost|kharid)\s*(?:price|rate|cost)?\s*(?:is|at|of|mein)?\s*₹?\s*([0-9]+(?:\.[0-9]+)?)/i);
          if (matchSourcing) {
            customSourcing = Number(matchSourcing[1]);
          }
        }

        dairyAnalysisData = buildDairyAnalysis({
          district: bDistrict,
          customCsvData: customCsv,
          customSourcingPrice: customSourcing,
          monthlyRevenue: numRevenue,
          monthlyExpenses: numExpenses,
          monthlyEmi: numEmi,
          projectCost: bProjectCost,
        });

        dairyOfficialBlock = `
==== DAIRY SECTOR MACRO-DEMOGRAPHICS & MARKET GAP ====
[CSV DATA LAYER]
${dairyAnalysisData.csv_data_layer}

CRITICAL MANDATORY INSTRUCTIONS FOR DAIRY SECTOR:
1. Price Arbitrage (from Price Layer):
   - Compare Local_Sourcing_Price (₹${dairyAnalysisData.local_sourcing_price.toFixed(2)}/kg) to Nat_Retail_Avg (₹61.45/kg) and Nat_Wholesale_Avg (₹57.63/kg).
   - ${dairyAnalysisData.price_arbitrage.status === "Strong Sourcing Advantage" ? 'Since local cost is significantly lower, you MUST explicitly state that they have a "Strong Sourcing Advantage" and should focus on volume.' : 'Since local cost is near or above the national average, you MUST warn them of "Margin Compression" and advise premium retail packaging.'}

2. Demographic Targeting (from District Gap Layer):
   - Analyze Agri_Workers (${dairyAnalysisData.agri_workers.toLocaleString("en-IN")}) relative to Dist_Population (${dairyAnalysisData.dist_population.toLocaleString("en-IN")}).
   - Since the district has a high concentration of agricultural workers, you MUST suggest a secondary B2B revenue stream tailored to farmers (e.g., selling cattle feed, urea, or tractor rentals).

3. Market Sizing (from Integrated Dataset):
   - Use the district population (${dairyAnalysisData.dist_population.toLocaleString("en-IN")}) to mathematically validate if there are enough potential local buyers to support their proposed production scale and EMI payments.`;
      }

      const preCalculatedBlock = `
DETERMINISTIC PRE-CALCULATED METRICS (AUTHORITATIVE SOURCE OF TRUTH — NEVER RECALCULATE):
- Expected Monthly Revenue: ${numRevenue != null ? `₹${numRevenue.toLocaleString("en-IN")}` : "Not provided"}
- Monthly Operating Costs: ${numExpenses != null ? `₹${numExpenses.toLocaleString("en-IN")}` : "Not provided"}
- Operating Surplus Before EMI: ${operatingSurplus != null ? `₹${operatingSurplus.toLocaleString("en-IN")}` : "Not calculated"}
- Monthly Loan EMI: ${numEmi != null ? `₹${numEmi.toLocaleString("en-IN")}` : "Not calculated"}
- Surplus After EMI: ${surplusAfterEmi != null ? `₹${surplusAfterEmi.toLocaleString("en-IN")}` : "Not calculated"}
- Minimum Break-Even Revenue Needed: ${breakEvenRevenue != null ? `₹${breakEvenRevenue.toLocaleString("en-IN")}` : "Not calculated"}
${stressCalculationText}
${schemeOfficialText}
${dairyOfficialBlock}`;

      const systemInstruction = `You are SAHYOGI (सहयोगी), an intelligent, practical, and highly empathetic rural business advisor and mentor in India.
You have the following verified business and financial data in mind for this entrepreneur:

${profileHeader}
${preCalculatedBlock}

CORE OPERATIONAL RULES:
1. NEVER START RESPONSES WITH A BOILERPLATE PROFILE DUMP OR TEMPLATE.
   - DO NOT start by reciting: "For your business, Total Project Cost is X, Margin is Y, Loan is Z, Profit is W..."
   - The user already knows their business profile. Only cite specific figures if they directly explain the answer to the user's question!
2. THE ANSWER MUST BE DRIVEN EXCLUSIVELY BY THE USER'S EXACT QUESTION.
3. FOLLOW THIS 5-STEP REASONING PROCESS FOR EVERY QUESTION:
   Step 1: Identify what the user is actually asking.
   Step 2: Determine which existing business/project data is relevant to that question.
   Step 3: Use that data to reason about the question.
   Step 4: Answer the question directly in the very first sentence.
   Step 5: Only include other financial or profile information if it helps answer the question.

4. CRITICAL MATHEMATICAL RULE:
   - ALL NUMERICAL FINANCIAL ARITHMETIC IS ALREADY CALCULATED BY BACKEND LOGIC ABOVE.
   - DO NOT perform mental arithmetic or attempt to recalculate figures independently.
   - Quote and interpret the pre-calculated numbers provided above.

5. FINANCIALLY RESPONSIBLE AFFORDABILITY LANGUAGE:
   - Never say: "Yes, you can comfortably afford this" or "This is 100% risk free".
   - Instead, state clearly: "Based on the stated revenue of ₹X and operating costs of ₹Y, the business generates ₹Z before EMI and ₹W after EMI. The EMI is mathematically serviceable under these assumptions, but the remaining margin is limited and actual affordability will depend on sales fluctuations, additional expenses and other business costs."

SPECIFIC GUIDANCE FOR COMMON QUESTION TYPES:

1. MARGIN QUESTIONS (e.g. "Should I increase the margin cost?", "Should I invest more margin?"):
   - Discuss the trade-off directly:
     * Higher promoter margin means more money invested by the user upfront.
     * It reduces the required borrowing amount (below current ${bLoanStr}).
     * It reduces the monthly EMI (below current ${bEmiStr}) and total interest burden over the tenure.
     * CRITICAL RULE: Increasing margin does NOT automatically solve scheme eligibility! If the project cost exceeds the applicable government scheme limit (e.g. Mudra or PMEGP ceiling), contributing more margin will not make it eligible under that scheme — reducing the project size/scale to fit within the ceiling is what is required.
     * Advise keeping sufficient liquid emergency cash for working capital rather than locking all savings into margin.

2. RISK QUESTIONS (e.g. "What are the main risks for this business here?", "What could make this business fail?"):
   - Ground risks in the ACTUAL category (${businessContext.businessType || "enterprise"}) and location (${bDistrict}${bState ? `, ${bState}` : ""}):
     * For aquaculture / fish farming: water aeration, disease outbreak, feed costs, monsoon flooding, perishable transport.
     * For dairy / livestock: cattle disease, feed inflation, summer lactation drop, milk chilling.
     * For poultry: epidemic diseases, maize/feed volatility, heat stress, wholesale price swings.
     * For agriculture: rainfall irregularity, pest attacks, post-harvest mandi pricing, input costs.
     * For retail / trade: customer credit (udhaari) freezing working capital, slow inventory, competition.
   - DEBT SERVICING RULE:
     * DO NOT say there is a debt-servicing risk when loan is ₹0 or EMI is ₹0! Only discuss EMI risk if debt actually exists.

3. COST REDUCTION QUESTIONS (e.g. "How can I lower my initial setup cost?"):
   - Provide practical strategies: phased capacity rollout, leasing premises/equipment instead of buying, procuring tested refurbished machinery, scaling down initial pilot.
   - Explain how lowering project size directly cuts required 10% promoter margin and cuts monthly EMI.

4. SCHEME DOCUMENTS & RULES:
   - Use the official scheme documents list provided above. Mention that final approval and interest rate require official bank branch appraisal.

LANGUAGE & TONE:
- Respond naturally in: ${selectedLanguage}.
- If user asks in Hinglish, respond in natural, friendly Hinglish.
- If user asks in Hindi, respond in clear, respectful Hindi.
- Keep answers concise, direct, and conversational (this is spoken in Voice Mode).`;

      // Helper to generate deterministic fallback when Gemini is unavailable
      const runFallback = () => {
        const isDairyQuery = isDairy && (
          hasCsvInQuery ||
          /\b(dairy|milk|price arbitrage|sourcing advantage|margin compression|demographic targeting|agri_workers|market sizing|potential local buyers|cattle feed|secondary b2b|tractor rentals)\b/i.test(message)
        );

        if (isDairyQuery && dairyAnalysisData) {
          const answerText = selectedLanguage === "Hindi" || rawLang === "hi"
            ? dairyAnalysisData.summary_report_hi
            : dairyAnalysisData.summary_report;
          return { answer: answerText };
        }

        return handleAdvisor({
          question: message,
          business_name: bName,
          category: businessContext.businessType || businessContext.category,
          monthly_revenue: bRevenue,
          monthly_expenses: bExpenses,
          monthly_profit: bProfit,
          roi_percentage: bRoi,
          affordability_status: bAffordability,
          monthly_emi: bEmiVal,
          eligible_loan: bLoanVal,
          project_cost: bProjectCost,
          promoter_margin: bMarginVal,
          scheme_name: bScheme,
          interest_rate: bInterestRate,
          loan_tenure_months: bTenureMonths,
          moratorium_months: bMoratoriumMonths,
          local_demand: businessContext.localDemand,
          competition_level: businessContext.competitionLevel,
          feasibility: bFeasibility,
          district: bDistrict,
          state: bState,
          block: businessContext.block,
          language: selectedLanguage,
          history: req.body?.history,
        });
      };

      const geminiClient = getGeminiClient();
      if (!geminiClient) {
        const fallback = runFallback();
        res.json({
          reply: fallback.answer,
          answer: fallback.answer,
          text: fallback.answer,
          source: "fallback",
          fallbackReason: "API_KEY_UNCONFIGURED",
          dairy_analysis: isDairy ? dairyAnalysisData : undefined,
        });
        return;
      }

      // Build multi-turn conversational contents for Gemini
      const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
      const geminiContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      for (const item of rawHistory) {
        if (item && item.text && typeof item.text === "string") {
          const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
          geminiContents.push({
            role,
            parts: [{ text: item.text.trim() }],
          });
        }
      }
      geminiContents.push({
        role: "user",
        parts: [{ text: message }],
      });

      // Non-streaming response with robust timeout protection
      let answerText = "";
      let errorCategory = "";
      try {
        const primaryPromise = geminiClient.models.generateContent({
          model: "gemini-3.8-flash",
          contents: geminiContents as any,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini generateContent timed out")), 7000)
        );
        const response = await Promise.race([primaryPromise, timeoutPromise]);
        answerText = response.text ? response.text.trim() : "";
      } catch (genErr: any) {
        const errInfo = categorizeGeminiError(genErr);
        errorCategory = errInfo.category;
        console.warn(`[Advisor Gemini Primary Failed] Category: ${errInfo.category} - ${errInfo.description}`);
        try {
          const fallbackPromise = geminiClient.models.generateContent({
            model: "gemini-flash-latest",
            contents: geminiContents as any,
            config: {
              systemInstruction,
              temperature: 0.6,
            },
          });
          const fbTimeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini fallback model timed out")), 4000)
          );
          const fallbackAi = await Promise.race([fallbackPromise, fbTimeoutPromise]);
          answerText = fallbackAi.text ? fallbackAi.text.trim() : "";
        } catch (genErr2: any) {
          const errInfo2 = categorizeGeminiError(genErr2);
          errorCategory = errInfo2.category;
          console.warn(`[Advisor Gemini Fallback Failed] Category: ${errInfo2.category} - ${errInfo2.description}`);
        }
      }

      if (answerText) {
        res.json({
          answer: answerText,
          reply: answerText,
          text: answerText,
          source: "gemini",
          dairy_analysis: isDairy ? dairyAnalysisData : undefined,
        });
        return;
      }

      // Deterministic rule-based mentor fallback
      const fallback = runFallback();
      res.json({
        answer: fallback.answer,
        reply: fallback.answer,
        text: fallback.answer,
        source: "fallback",
        fallbackReason: errorCategory || "FALLBACK_CALLED",
        dairy_analysis: isDairy ? dairyAnalysisData : undefined,
      });
    } catch (err: any) {
      const errInfo = categorizeGeminiError(err);
      console.error(`[Advisor Top-Level Error] Category: ${errInfo.category} - ${errInfo.description}`);
      res.status(500).json({
        error: "Advisor service encountered an error",
        reply: "माफ़ कीजिए, अभी सलाहकार सेवा में समस्या आ रही है। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
        fallbackReason: errInfo.category,
      });
    }
  };

  app.post("/api/advisor", advisorHandler);
  app.post("/advisor", advisorHandler); // Compatibility alias
  app.post("/api/advisor-chat", advisorHandler); // Compatibility alias

  // 7. Udyam Registration Verification Route (Canonical: POST /api/verify-udyam)
  app.post("/api/verify-udyam", async (req: express.Request, res: express.Response) => {
    try {
      const { udyamNumber } = req.body;
      if (!udyamNumber || typeof udyamNumber !== "string") {
        res.status(400).json({
          success: false,
          error: "Udyam registration number is required",
        });
        return;
      }

      const cleanUdyam = udyamNumber.trim().toUpperCase();

      // Format check (e.g. UDYAM-XX-00-0000000)
      const udyamRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i;
      if (!udyamRegex.test(cleanUdyam)) {
        res.status(400).json({
          success: false,
          error: "Invalid Udyam Registration Number format. Expected format: UDYAM-XX-00-0000000",
        });
        return;
      }

      const apiKey = process.env.UDYAM_API_KEY;
      if (!apiKey) {
        // Honest response when external verification provider is unconfigured
        res.status(200).json({
          success: false,
          serviceConfigured: false,
          error: "Official Udyam verification API gateway is not configured on this server. Please enter your enterprise details manually below.",
        });
        return;
      }

      const providerUrl = "https://api.udyamverification.provider.com/v1/verify";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(providerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "x-api-key": apiKey,
          },
          body: JSON.stringify({ udyamNumber: cleanUdyam }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!response.ok) {
          res.status(502).json({
            success: false,
            error: "Government Udyam portal returned an error. Please enter your enterprise details manually.",
          });
          return;
        }

        const responseData = await response.json();
        if (responseData && responseData.enterpriseName) {
          res.json({
            success: true,
            enterpriseName: responseData.enterpriseName,
            classification: responseData.classification || "Micro",
            state: responseData.state || "",
            district: responseData.district || "",
            pincode: responseData.pincode || "",
          });
          return;
        }

        res.status(404).json({
          success: false,
          error: "No enterprise record found for the provided Udyam number.",
        });
      } catch (fetchErr: any) {
        clearTimeout(timer);
        res.status(503).json({
          success: false,
          error: "Udyam verification service is temporarily unreachable. Please enter your details manually.",
        });
      }
    } catch (error: any) {
      console.error("Udyam verification error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error during Udyam verification",
      });
    }
  });

  // 8. MySQL Database Integration Endpoints

  // Save Business Profile + Financial Record + Report Card Dossier
  app.post("/api/business/save", async (req: express.Request, res: express.Response) => {
    try {
      const { profile, financials, reportPayload } = req.body;

      if (!profile || typeof profile !== "object") {
        res.status(400).json({ success: false, error: "Missing or invalid profile object" });
        return;
      }
      if (!profile.business_name || !profile.business_name.trim()) {
        res.status(400).json({ success: false, error: "Business name is required" });
        return;
      }
      if (!profile.category || !profile.category.trim()) {
        res.status(400).json({ success: false, error: "Business category is required" });
        return;
      }
      if (!profile.state || !profile.state.trim() || !profile.district || !profile.district.trim()) {
        res.status(400).json({ success: false, error: "State and District are required" });
        return;
      }

      if (!financials || typeof financials !== "object") {
        res.status(400).json({ success: false, error: "Missing or invalid financials object" });
        return;
      }

      const status = getDbConfigStatus();
      const saveResult = await saveBusinessComplete(profile, financials, reportPayload);
      res.json({
        success: true,
        message: status.isConfigured
          ? "Business profile and financial dossier successfully saved to MySQL."
          : "Business profile and financial dossier successfully saved (in-memory mock store).",
        ...saveResult,
      });
    } catch (err: any) {
      console.error("[API Save Business Error]:", err?.message || err);
      res.status(500).json({
        success: false,
        error: "Failed to save business record to database. Please check input data and database connectivity.",
      });
    }
  });

  // Retrieve Business History (All saved evaluations in chronological order)
  app.get("/api/business/history", async (req: express.Request, res: express.Response) => {
    try {

      const businessName = req.query.businessName as string | undefined;
      const businessIdParam = req.query.businessId ? Number(req.query.businessId) : undefined;
      const district = req.query.district as string | undefined;

      const evaluations = await getBusinessHistory({
        businessName,
        businessId: businessIdParam,
        district,
      });

      res.json({
        success: true,
        count: evaluations.length,
        evaluations,
      });
    } catch (err: any) {
      console.error("[API Business History Error]:", err?.message || err);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve business evaluation history from database.",
        evaluations: [],
      });
    }
  });

  // Retrieve Business Profile and latest financial record by ID
  app.get("/api/business/:id", async (req: express.Request, res: express.Response) => {
    try {
      const idNum = parseInt(req.params.id, 10);
      if (isNaN(idNum) || idNum <= 0) {
        res.status(400).json({ success: false, error: "Invalid business ID. Must be a positive integer." });
        return;
      }

      const business = await getBusinessProfileById(idNum);
      if (!business) {
        res.status(404).json({ success: false, error: `No business profile found with ID ${idNum}` });
        return;
      }

      res.json({ success: true, data: business });
    } catch (err: any) {
      console.error("[API Get Business Error]:", err?.message || err);
      res.status(500).json({ success: false, error: "Failed to retrieve business profile from database." });
    }
  });

  // Retrieve saved dossier by report code (e.g. VAI-123456)
  app.get("/api/reports/:reportCode", async (req: express.Request, res: express.Response) => {
    try {
      const code = (req.params.reportCode || "").trim();
      if (!code) {
        res.status(400).json({ success: false, error: "Report code is required" });
        return;
      }

      const report = await getSavedReportByCode(code);
      if (!report) {
        res.status(404).json({ success: false, error: `No saved report dossier found for code ${code}` });
        return;
      }

      res.json({ success: true, data: report });
    } catch (err: any) {
      console.error("[API Get Report Error]:", err?.message || err);
      res.status(500).json({ success: false, error: "Failed to retrieve report dossier." });
    }
  });

  // Save Advisory Q&A Interaction
  app.post("/api/advisory/history", async (req: express.Request, res: express.Response) => {
    try {
      const { sessionToken, userQuery, aiResponse, businessId, language, modelSource } = req.body;
      if (!sessionToken || !userQuery || !aiResponse) {
        res.status(400).json({ success: false, error: "sessionToken, userQuery, and aiResponse are required." });
        return;
      }

      const historyId = await saveAdvisoryMessage(
        String(sessionToken),
        String(userQuery),
        String(aiResponse),
        businessId ? Number(businessId) : null,
        language || "hi",
        modelSource || "gemini"
      );

      res.json({ success: true, historyId });
    } catch (err: any) {
      console.error("[API Save Advisory History Error]:", err?.message || err);
      res.status(500).json({ success: false, error: "Failed to record advisory interaction." });
    }
  });

  // Get Advisory Q&A Interaction History
  app.get("/api/advisory/history", async (req: express.Request, res: express.Response) => {
    try {
      const sessionToken = (req.query.sessionToken as string || "").trim();
      if (!sessionToken) {
        res.status(400).json({ success: false, error: "sessionToken query parameter is required." });
        return;
      }

      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const history = await getAdvisoryHistoryBySession(sessionToken, limit);
      res.json({ success: true, history });
    } catch (err: any) {
      console.error("[API Get Advisory History Error]:", err?.message || err);
      res.status(500).json({ success: false, error: "Failed to retrieve advisory history." });
    }
  });

  // Log Market Scan Summary
  app.post("/api/market/scan-log", async (req: express.Request, res: express.Response) => {
    try {
      const { district, radiusMeters, competitorCount, bankCount, mandiCount, businessId, latitude, longitude } = req.body;
      if (!district) {
        res.status(400).json({ success: false, error: "district is required" });
        return;
      }

      const logId = await logMarketScan(
        String(district),
        Number(radiusMeters) || 10000,
        Number(competitorCount) || 0,
        Number(bankCount) || 0,
        Number(mandiCount) || 0,
        businessId ? Number(businessId) : null,
        latitude != null ? Number(latitude) : null,
        longitude != null ? Number(longitude) : null
      );

      res.json({ success: true, logId });
    } catch (err: any) {
      console.error("[API Log Market Scan Error]:", err?.message || err);
      res.status(500).json({ success: false, error: "Failed to log market scan summary." });
    }
  });

  // 9. data.gov.in Mandi Commodity Prices Endpoints (Resource ID: 9ef84268-d588-465a-a308-a864a43d0070)
  app.get("/api/mandi/prices", async (req: express.Request, res: express.Response) => {
    try {
      const commodity = req.query.commodity as string | undefined;
      const state = req.query.state as string | undefined;
      const district = req.query.district as string | undefined;
      const market = req.query.market as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const result = await fetchMandiCommodityPrices({
        commodity,
        state,
        district,
        market,
        limit,
        offset,
      });

      res.json(result);
    } catch (err: any) {
      console.error("[API Mandi Prices Error]:", err?.message || err);
      res.status(500).json({
        success: false,
        configured: Boolean(process.env.DATA_GOV_IN_API_KEY),
        resource_id: "9ef84268-d588-465a-a308-a864a43d0070",
        total: 0,
        count: 0,
        limit: 20,
        offset: 0,
        unit: "₹/Quintal",
        records: [],
        error: "Internal server error while retrieving Mandi commodity prices",
      });
    }
  });

  app.get("/api/mandi/suggestions", (req: express.Request, res: express.Response) => {
    try {
      const category = req.query.category as string | undefined;
      const suggestions = getSuggestedCommoditiesForCategory(category);
      res.json({ success: true, category, suggestions });
    } catch (err: any) {
      res.status(500).json({ success: false, suggestions: [] });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vyapaar AI Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal: string) => {
    console.log(`[Vyapaar AI Server] ${signal} signal received. Closing HTTP server & MySQL pool...`);
    server.close(async () => {
      await closeDbPool();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

startServer();
