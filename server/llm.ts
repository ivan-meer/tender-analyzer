import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing in environment secrets");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export async function generateContentWithRetry(
  ai: GoogleGenAI,
  options: {
    model: string;
    fallbackModels?: string[];
    contents: any;
    config?: any;
    maxRetriesPerModel?: number;
    timeoutMs?: number;
  }
) {
  const {
    model,
    fallbackModels = ["gemini-3.1-flash-lite", "gemini-flash-latest"],
    contents,
    config,
    maxRetriesPerModel = 0,
    timeoutMs = 12000,
  } = options;

  const deprecatedModels = new Set([
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-2.0-flash",
    "gemini-2.0-pro",
    "gemini-2.5-pro",
    "gemini-3.7-flash",
  ]);
  const rawList = ["gemini-3.1-flash-lite", "gemini-flash-latest", model, ...fallbackModels];
  const modelsToTry = Array.from(new Set(rawList.filter((m) => m && !deprecatedModels.has(m))));

  let lastError: any = null;

  for (let modelIdx = 0; modelIdx < modelsToTry.length; modelIdx++) {
    const currentModel = modelsToTry[modelIdx];
    const isLastModel = modelIdx === modelsToTry.length - 1;

    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const generatePromise = ai.models.generateContent({
          model: currentModel,
          contents,
          config,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout (${timeoutMs}ms) on model ${currentModel}`)), timeoutMs)
        );
        const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        const code = err?.status || err?.code;
        const isQuotaOrNotFound =
          code === 404 ||
          code === 429 ||
          msg.includes("404") ||
          msg.includes("NOT_FOUND") ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("quota");
        const isHighDemandOrUnavailable =
          code === 503 ||
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("Spikes in demand");
        const isTimeout = msg.includes("Timeout");
        const isTransient =
          isHighDemandOrUnavailable || isTimeout || msg.includes("EAI_AGAIN") || msg.includes("fetch failed");

        if (!isLastModel && (isHighDemandOrUnavailable || isQuotaOrNotFound || isTimeout)) {
          console.info(
            `[Gemini API] Model '${currentModel}' unavailable (${
              isHighDemandOrUnavailable ? "503 High Demand" : isTimeout ? "Timeout" : "Quota"
            }), seamlessly routing to fallback model '${modelsToTry[modelIdx + 1]}'...`
          );
          break;
        } else if (isLastModel) {
          console.info(`[Gemini API] Primary Gemini models completed, switching to multi-provider cascade...`);
        }

        if (isQuotaOrNotFound || isHighDemandOrUnavailable || isTimeout) {
          break;
        }

        if (isTransient && attempt < maxRetriesPerModel) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All Gemini model generation attempts failed.");
}

export interface UniversalLLMConfig {
  provider?: string;
  modelName?: string;
  apiKey?: string;
  baseUrl?: string;
  mistralApiKey?: string;
  temperature?: number;
  useMistralOcrForPdf?: boolean;
}

export function extractJsonFromLLMResponse(text: string): any {
  if (!text || typeof text !== "string") {
    throw new Error("Пустой ответ от ИИ модели.");
  }

  let clean = text.trim();

  // 1. Remove reasoning / thinking tags
  clean = clean.replace(/<\s*(think|thought)\s*>[\s\S]*?<\s*\/\s*(think|thought)\s*>/gi, "").trim();

  if (clean.includes("<think>") || clean.includes("<thought>")) {
    clean = clean.replace(/^<\s*(think|thought)\s*>[\s\S]*?(?:<\s*\/\s*(think|thought)\s*>|$)/gi, "").trim();
  }

  // 2. Extract content from markdown code blocks
  const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    clean = codeBlockMatch[1].trim();
  } else {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  // 3. Direct JSON parse
  try {
    return JSON.parse(clean);
  } catch (e1) {
    // 4. Fallback: locate JSON object {...} or array [...] boundaries
    const startObj = clean.indexOf("{");
    const endObj = clean.lastIndexOf("}");
    if (startObj !== -1 && endObj > startObj) {
      const candidate = clean.substring(startObj, endObj + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // continue
      }
    }

    const startArr = clean.indexOf("[");
    const endArr = clean.lastIndexOf("]");
    if (startArr !== -1 && endArr > startArr) {
      const candidate = clean.substring(startArr, endArr + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // continue
      }
    }

    throw new Error(`Не удалось распарсить JSON из ответа ИИ: ${(e1 as Error)?.message || e1}`);
  }
}

export async function executeDeepInfraCall(
  cfg: UniversalLLMConfig,
  options: {
    prompt: string | any[];
    systemInstruction?: string;
    imageParts?: Array<{ inlineData: { mimeType: string; data: string } }>;
    responseJsonFormat?: boolean;
    temperature?: number;
  },
  overrideModel?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = cfg.apiKey || process.env.DEEPINFRA_API_KEY || process.env.ZIPINFRA_API_KEY;
  if (!apiKey) {
    throw new Error("API ключ DeepInfra отсутствует в конфигурации сервера.");
  }
  const baseUrl = (cfg.baseUrl || process.env.DEFAULT_LLM_BASE_URL || "https://api.deepinfra.com/v1/openai").replace(/\/$/, "");
  const model = overrideModel || cfg.modelName || process.env.DEFAULT_LLM_MODEL || "meta-llama/Llama-3.3-70B-Instruct";
  const temperature = options.temperature ?? cfg.temperature ?? 0.2;

  const messages: any[] = [];
  let sysInstruction = options.systemInstruction || "";
  if (options.responseJsonFormat) {
    const jsonRequirement =
      "IMPORTANT: You MUST respond strictly in valid JSON matching the schema. Do not output reasoning text or commentary outside the JSON.";
    sysInstruction = sysInstruction ? `${sysInstruction}\n\n${jsonRequirement}` : jsonRequirement;
  }
  if (sysInstruction) {
    messages.push({ role: "system", content: sysInstruction });
  }

  let userContent: any = options.prompt;
  if (typeof options.prompt === "string") {
    userContent = options.prompt;
  } else if (Array.isArray(options.prompt)) {
    userContent = options.prompt.map((p) => (typeof p === "string" ? p : p.text || "")).join("\n");
  }
  messages.push({ role: "user", content: userContent });

  const requestBody: any = {
    model,
    messages,
    temperature,
  };

  const isReasonerModel = /reasoner|r1|o1|o3/i.test(model);
  if (options.responseJsonFormat && !isReasonerModel) {
    requestBody.response_format = { type: "json_object" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  let res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!res.ok && requestBody.response_format) {
    delete requestBody.response_format;
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepInfra API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  let reply =
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.message?.reasoning_content ||
    data.choices?.[0]?.text ||
    "";
  if (reply && typeof reply === "string") {
    reply = reply.replace(/<\s*(think|thought)\s*>[\s\S]*?<\s*\/\s*(think|thought)\s*>/gi, "").trim();
  }
  return { text: reply, modelUsed: `DeepInfra (${model})` };
}

export async function executeGeminiCall(
  cfg: UniversalLLMConfig,
  options: {
    prompt: string | any[];
    systemInstruction?: string;
    imageParts?: Array<{ inlineData: { mimeType: string; data: string } }>;
    responseJsonFormat?: boolean;
    temperature?: number;
  },
  overrideModel?: string
): Promise<{ text: string; modelUsed: string }> {
  const geminiKey = cfg.apiKey || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("API ключ Gemini отсутствует в конфигурации сервера.");
  }

  const ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  const model = overrideModel || (cfg.provider === "gemini" && cfg.modelName ? cfg.modelName : "gemini-3.1-flash-lite");
  const temperature = options.temperature ?? cfg.temperature ?? 0.2;

  let contents: any = options.prompt;
  if (options.imageParts && options.imageParts.length > 0) {
    contents = [
      ...options.imageParts,
      ...(typeof options.prompt === "string" ? [{ text: options.prompt }] : options.prompt),
    ];
  }

  const reqConfig: any = {
    temperature,
  };

  if (options.systemInstruction) {
    reqConfig.systemInstruction = options.systemInstruction;
  }

  if (options.responseJsonFormat) {
    reqConfig.responseMimeType = "application/json";
  }

  const response = await generateContentWithRetry(ai, {
    model,
    fallbackModels: ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"],
    contents,
    config: reqConfig,
  });

  return { text: response.text || "", modelUsed: `Gemini (${model})` };
}

export async function executeMistralCall(
  cfg: UniversalLLMConfig,
  options: {
    prompt: string | any[];
    systemInstruction?: string;
    responseJsonFormat?: boolean;
    temperature?: number;
  },
  overrideModel?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = cfg.apiKey || process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("API ключ Mistral отсутствует в конфигурации сервера.");
  }
  const model = overrideModel || cfg.modelName || "mistral-large-latest";
  const baseUrl = (cfg.baseUrl || "https://api.mistral.ai/v1").replace(/\/$/, "");
  const temperature = options.temperature ?? cfg.temperature ?? 0.2;

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }

  let userContent: any = options.prompt;
  if (typeof options.prompt === "string") {
    userContent = options.prompt;
  } else if (Array.isArray(options.prompt)) {
    userContent = options.prompt.map((p) => (typeof p === "string" ? p : p.text || "")).join("\n");
  }
  messages.push({ role: "user", content: userContent });

  const requestBody: any = {
    model,
    messages,
    temperature,
  };

  if (options.responseJsonFormat) {
    requestBody.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mistral API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "";
  return { text: reply, modelUsed: `Mistral (${model})` };
}

export async function executeOpenAICall(
  cfg: UniversalLLMConfig,
  options: {
    prompt: string | any[];
    systemInstruction?: string;
    responseJsonFormat?: boolean;
    temperature?: number;
  },
  overrideModel?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = cfg.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("API ключ OpenAI отсутствует в конфигурации сервера.");
  }
  const baseUrl = (cfg.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = overrideModel || cfg.modelName || "gpt-4o";
  const temperature = options.temperature ?? cfg.temperature ?? 0.2;

  const messages: any[] = [];
  let sysInstruction = options.systemInstruction || "";
  if (options.responseJsonFormat) {
    const jsonRequirement =
      "IMPORTANT: You MUST respond strictly in valid JSON matching the schema. Do not output reasoning text or commentary outside the JSON.";
    sysInstruction = sysInstruction ? `${sysInstruction}\n\n${jsonRequirement}` : jsonRequirement;
  }
  if (sysInstruction) {
    messages.push({ role: "system", content: sysInstruction });
  }

  let userContent: any = options.prompt;
  if (typeof options.prompt === "string") {
    userContent = options.prompt;
  } else if (Array.isArray(options.prompt)) {
    userContent = options.prompt.map((p) => (typeof p === "string" ? p : p.text || "")).join("\n");
  }
  messages.push({ role: "user", content: userContent });

  const requestBody: any = {
    model,
    messages,
    temperature,
  };

  const isReasonerModel = /o1|o3/i.test(model);
  if (options.responseJsonFormat && !isReasonerModel) {
    requestBody.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "";
  return { text: reply, modelUsed: `OpenAI (${model})` };
}

export async function callUniversalLLM(options: {
  llmConfig?: UniversalLLMConfig;
  prompt: string | any[];
  systemInstruction?: string;
  imageParts?: Array<{ inlineData: { mimeType: string; data: string } }>;
  responseJsonFormat?: boolean;
  temperature?: number;
}): Promise<{ text: string; modelUsed: string }> {
  const cfg = options.llmConfig || {};
  const provider = (cfg.provider || process.env.DEFAULT_LLM_PROVIDER || "gemini").toLowerCase();

  if (provider === "gemini") {
    try {
      return await executeGeminiCall(cfg, options);
    } catch (geminiErr: any) {
      console.info(
        `[Universal LLM] Gemini call transitioned (${geminiErr?.message}). Seamlessly executing fallback to DeepInfra / Mistral...`
      );

      try {
        const fallbackRes = await executeDeepInfraCall(cfg, options, "meta-llama/Llama-3.3-70B-Instruct");
        return { text: fallbackRes.text, modelUsed: `${fallbackRes.modelUsed} [Gemini Fallback]` };
      } catch (deepinfraErr: any) {
        console.info(`[Universal LLM] DeepInfra fallback transitioned: ${deepinfraErr?.message}. Trying Mistral...`);
      }

      try {
        const mistralRes = await executeMistralCall(cfg, options, "mistral-large-latest");
        return { text: mistralRes.text, modelUsed: `${mistralRes.modelUsed} [Gemini Fallback]` };
      } catch (mistralErr: any) {
        console.info(`[Universal LLM] Mistral fallback transitioned: ${mistralErr?.message}`);
      }

      try {
        const openaiRes = await executeOpenAICall(cfg, options, "gpt-4o");
        return { text: openaiRes.text, modelUsed: `${openaiRes.modelUsed} [Gemini Fallback]` };
      } catch (openaiErr: any) {
        console.info(`[Universal LLM] OpenAI fallback transitioned: ${openaiErr?.message}`);
      }

      throw geminiErr;
    }
  }

  if (provider === "deepinfra" || provider === "zipinfra") {
    try {
      return await executeDeepInfraCall(cfg, options);
    } catch (deepinfraErr: any) {
      console.info(
        `[Universal LLM] DeepInfra call transitioned (${deepinfraErr?.message}). Seamlessly executing fallback to Gemini...`
      );
      try {
        const geminiRes = await executeGeminiCall(cfg, options, "gemini-3.1-flash-lite");
        return { text: geminiRes.text, modelUsed: `${geminiRes.modelUsed} [DeepInfra Fallback]` };
      } catch (geminiErr: any) {
        console.info(`[Universal LLM] Gemini fallback notice: ${geminiErr?.message}`);
      }
      throw deepinfraErr;
    }
  }

  if (provider === "mistral") {
    try {
      return await executeMistralCall(cfg, options);
    } catch (mistralErr: any) {
      console.info(
        `[Universal LLM] Mistral call transitioned (${mistralErr?.message}). Seamlessly executing fallback to Gemini / DeepInfra...`
      );
      try {
        const geminiRes = await executeGeminiCall(cfg, options, "gemini-3.1-flash-lite");
        return { text: geminiRes.text, modelUsed: `${geminiRes.modelUsed} [Mistral Fallback]` };
      } catch {
        const deepinfraRes = await executeDeepInfraCall(cfg, options, "meta-llama/Llama-3.3-70B-Instruct");
        return { text: deepinfraRes.text, modelUsed: `${deepinfraRes.modelUsed} [Mistral Fallback]` };
      }
    }
  }

  if (provider === "openai") {
    try {
      return await executeOpenAICall(cfg, options);
    } catch (openaiErr: any) {
      console.info(
        `[Universal LLM] OpenAI call transitioned (${openaiErr?.message}). Seamlessly executing fallback to Gemini / DeepInfra...`
      );
      try {
        const geminiRes = await executeGeminiCall(cfg, options, "gemini-3.1-flash-lite");
        return { text: geminiRes.text, modelUsed: `${geminiRes.modelUsed} [OpenAI Fallback]` };
      } catch {
        const deepinfraRes = await executeDeepInfraCall(cfg, options, "meta-llama/Llama-3.3-70B-Instruct");
        return { text: deepinfraRes.text, modelUsed: `${deepinfraRes.modelUsed} [OpenAI Fallback]` };
      }
    }
  }

  return await executeGeminiCall(cfg, options);
}

export async function runMistralOcr(options: {
  documentBase64?: string;
  documentUrl?: string;
  mimeType?: string;
  apiKey?: string;
}): Promise<{ markdownText: string; pagesCount: number; pages?: any[]; modelUsed: string }> {
  const mistralApiKey = options.apiKey || process.env.MISTRAL_API_KEY;

  if (mistralApiKey) {
    try {
      let docPayload: any;
      if (options.documentUrl) {
        docPayload = { type: "document_url", document_url: options.documentUrl };
      } else if (options.documentBase64) {
        const rawData = options.documentBase64.replace(/^data:[^;]+;base64,/, "");
        const mime = options.mimeType || "application/pdf";
        docPayload = {
          type: mime.includes("pdf") ? "document_url" : "image_url",
          [mime.includes("pdf") ? "document_url" : "image_url"]: `data:${mime};base64,${rawData}`,
        };
      }

      if (docPayload) {
        const res = await fetch("https://api.mistral.ai/v1/ocr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mistralApiKey}`,
          },
          body: JSON.stringify({
            model: "mistral-ocr-latest",
            document: docPayload,
            include_image_base64: false,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const pages = data.pages || [];
          const markdownText = pages
            .map((p: any, idx: number) => `### Страница ${idx + 1}\n\n${p.markdown || ""}`)
            .join("\n\n---\n\n");

          return {
            markdownText: markdownText || data.text || "Текст извлечен успешно.",
            pagesCount: pages.length || 1,
            pages: pages.map((p: any) => ({ index: p.index, markdown: p.markdown, images: p.images })),
            modelUsed: "Mistral OCR (mistral-ocr-latest)",
          };
        } else {
          const errText = await res.text();
          console.warn(`[OCR] Mistral OCR API responded with status ${res.status}: ${errText}. Initiating OCR fallback...`);
        }
      }
    } catch (mistralOcrErr: any) {
      console.warn(`[OCR] Mistral OCR request failed (${mistralOcrErr?.message}). Initiating OCR fallback...`);
    }
  }

  const deepinfraKey = process.env.DEEPINFRA_API_KEY || process.env.ZIPINFRA_API_KEY;
  if (deepinfraKey && options.documentBase64) {
    try {
      const rawData = options.documentBase64.replace(/^data:[^;]+;base64,/, "");
      const mime = options.mimeType || "image/png";
      const deepinfraBaseUrl = (process.env.DEFAULT_LLM_BASE_URL || "https://api.deepinfra.com/v1/openai").replace(/\/$/, "");

      const visionRequestBody = {
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
        messages: [
          {
            role: "system",
            content:
              "Ты — высокоточный OCR-аналитик нормативной и тендерной документации. Твоя задача: детально и без пропусков распознать весь текст, пункты, параграфы, заголовки и таблицы из переданного изображения/документа. Выведи результат строго в чистом Markdown-формате с таблицами.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Распознай весь текст и таблицы документа в формате Markdown:" },
              { type: "image_url", image_url: { url: `data:${mime};base64,${rawData}` } },
            ],
          },
        ],
        temperature: 0.1,
      };

      const visionRes = await fetch(`${deepinfraBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepinfraKey}`,
        },
        body: JSON.stringify(visionRequestBody),
      });

      if (visionRes.ok) {
        const visionData = await visionRes.json();
        const extractedText = visionData.choices?.[0]?.message?.content || "";
        if (extractedText && extractedText.trim().length > 10) {
          return {
            markdownText: extractedText.trim(),
            pagesCount: 1,
            pages: [{ index: 1, markdown: extractedText.trim() }],
            modelUsed: "DeepInfra Vision OCR (Llama-3.2-11B-Vision) [Mistral Fallback]",
          };
        }
      }
    } catch (deepinfraVisionErr: any) {
      console.warn(`[OCR] DeepInfra Vision fallback error:`, deepinfraVisionErr?.message);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && options.documentBase64) {
    try {
      const rawData = options.documentBase64.replace(/^data:[^;]+;base64,/, "");
      const mime = options.mimeType || (options.documentBase64.includes("pdf") ? "application/pdf" : "image/png");

      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        fallbackModels: ["gemini-3.1-flash-lite", "gemini-flash-latest"],
        contents: [
          {
            inlineData: {
              mimeType: mime,
              data: rawData,
            },
          },
          {
            text: "Внимательно распознай и извлеки весь текст, пункты, параграфы и таблицы из этого документа/скана. Сохрани все цифры, штрафы, сроки и условия. Выведи результат в структурированном виде в формате Markdown.",
          },
        ],
        config: {
          temperature: 0.1,
          systemInstruction:
            "Ты — высокоточный OCR модуль распознавания юридических и закупочных документов (223-ФЗ, 44-ФЗ, ГК РФ). Восстанови структуру и текст с максимальной точностью.",
        },
      });

      const text = response.text || "";
      if (text.trim()) {
        return {
          markdownText: text.trim(),
          pagesCount: 1,
          pages: [{ index: 1, markdown: text.trim() }],
          modelUsed: "Gemini Vision OCR (gemini-3.7-flash) [Mistral Fallback]",
        };
      }
    } catch (geminiVisionErr: any) {
      console.warn(`[OCR] Gemini Vision fallback error:`, geminiVisionErr?.message);
    }
  }

  throw new Error("Не удалось выполнить OCR распознавание: сервисы OCR временно недоступны.");
}
