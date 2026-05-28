import type { IncomingMessage, ServerResponse } from "http";
import { GoogleGenAI, Type } from "@google/genai";

// Lazy-loaded Gemini client to protect startup crash if the key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined on the server.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Function helper to extract raw body from IncomingMessage
function getRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Set headers
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Only POST requests are permitted on this route." }));
    return;
  }

  try {
    const rawBody = await getRequestBody(req);
    if (!rawBody) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Request body cannot be empty." }));
      return;
    }

    const { festival } = JSON.parse(rawBody);
    if (!festival) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Festival parameter is missing." }));
      return;
    }

    const ai = getGeminiClient();

    const district = festival.GUGUN_NM || "부산";
    const title = festival.MAIN_TITLE || festival.TITLE || "부산 축제";
    const place = festival.MAIN_PLACE || "부산";
    const subtitle = festival.SUBTITLE || "";
    const description = festival.ITEMCNTNTS || "";

    const systemInstruction = 
      "당신은 대한민국 최고의 부산 로컬 여행 가이드이자 여행 작가입니다. " +
      "사용자가 제공한 특정 축제의 장소, 내용, 구군 정보를 바탕으로 축제 관람과 근처의 관광 명소, 로컬 맛집을 엮은 최고의 알짜배기 1일 여행 계획을 구성해야 합니다. " +
      "사용자가 제공한 축제가 열리는 구군(예: 수영구, 해운대구, 금정구 등)에서 최대한 가깝거나 대중교통/도보로 이동 가능한 장소들을 추천하십시오. " +
      "추천 장소들은 구체적으로 실존하거나 해당 지역의 특성을 살린 아주 맛있는 먹거리(밀면, 돼지국밥, 회, 씨앗호떡 등)여야 합니다. " +
      "답변은 반드시 구조화된 JSON 데이터 스키마 형식에 맞춰 상세하게 한글로 리턴하십시오.";

    const prompt = `
=== 축제 상세정보 ===
축제 이름: ${title}
부제목/테마: ${subtitle}
개최 지역(구군): ${district}
개최 상세장소: ${place}
축제 소개글:
${description}

이 축제를 메인으로 삼아, 당일치기(아침부터 저녁까지) 부산 감성 알짜배기 1일 여행 일정을 세워주세요.
반드시 한국어로 자연스럽고 트렌디하고 상세하게 작성해 주시기 바랍니다.
    `;

    console.log(`[Gemini API] Requesting travel plan for: ${title} (${district})`);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            festivalOverview: { 
              type: Type.STRING, 
              description: "이 축제에서 꼭 봐야 할 핵심 볼거리나 가치를 트렌디하게 요약한 2-3줄의 한글 소개" 
            },
            nearbyAttractions: {
              type: Type.ARRAY,
              description: "축제 구역 및 인근 지역에서 함께 가볼 만한 대표 관광 포인트 3가지",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "명소 명칭" },
                  description: { type: Type.STRING, description: "명소에 대한 매력 설명 (로컬 감성)" },
                  distance: { type: Type.STRING, description: "축제장으로부터의 이동 소요시간 및 방법 (예: 도보 10분, 버스 15분)" },
                  category: { type: Type.STRING, description: "명소 카테고리 (예: 오션뷰 카페, 역사/문화, 일몰 명소)" }
                },
                required: ["name", "description", "distance", "category"]
              }
            },
            foodRecommendations: {
              type: Type.ARRAY,
              description: "해당 지역에서만 느낄 수 있는 대표 로컬 강추 맛집 및 먹거리 추천 2가지",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "식당 또는 먹거리 브랜드 명칭" },
                  menu: { type: Type.STRING, description: "추천 시그니처 메뉴" },
                  description: { type: Type.STRING, description: "음식의 맛과 식당의 매력 설명" },
                  reason: { type: Type.STRING, description: "해당 축제 여행 시 가야 하는 구체적인 추천 사유" }
                },
                required: ["name", "menu", "description", "reason"]
              }
            },
            itinerary: {
              type: Type.ARRAY,
              description: "시간대별 당일치기 코스 추천 타임라인 (상세히 4단계)",
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSlot: { type: Type.STRING, description: "예: '오전 (10:00 - 12:00)', '점심 (12:00 - 13:30)', '오후 (14:00 - 17:00)', '저녁 및 축제 절정 (18:00 - 21:00)'" },
                  activity: { type: Type.STRING, description: "수행할 활동 설명" },
                  tip: { type: Type.STRING, description: "해당 프레임의 꿀팁이나 동선 팁" }
                },
                required: ["timeSlot", "activity", "tip"]
              }
            },
            localTip: { 
              type: Type.STRING, 
              description: "교통 혼잡 여부, 주차 팁 또는 준비해가면 극락을 경험하는 아이템 등 부산 토박이의 꿀팁" 
            }
          },
          required: ["festivalOverview", "nearbyAttractions", "foodRecommendations", "itinerary", "localTip"]
        }
      }
    });

    const recommendationData = response.text;
    res.statusCode = 200;
    res.end(recommendationData);

  } catch (error: any) {
    console.error("[API Error] Recommendations engine failure:", error.message);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: "AI 여행 추천 일정을 생성하는 중 오류가 발생했습니다.",
        details: error.message,
      })
    );
  }
}
