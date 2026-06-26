import { GoogleGenerativeAI } from '@google/generative-ai';
import WebSocket from 'ws';
import * as dotenv from 'dotenv';
import { DbService } from './dbService';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

let ai: GoogleGenerativeAI | null = null;
try {
  if (apiKey) {
    ai = new GoogleGenerativeAI(apiKey);
    console.log('🟢 Gemini SDK가 API Key를 기반으로 활성화되었습니다.');
  } else {
    console.warn('⚠️ GEMINI_API_KEY 환경변수가 존재하지 않습니다. AI 기능이 비활성화되거나 오류가 발생할 수 있습니다.');
  }
} catch (error) {
  console.error('❌ Gemini SDK 초기화 실패:', error);
}

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: string;
  scamScore: number;
}

/**
 * 텍스트 메시지 및 프로필 소개글 유해성 실시간 가드 (Gemini Flash 기반)
 */
export async function checkTextSafety(text: string): Promise<SafetyCheckResult> {
  if (!ai) {
    const dangerKeywords = ['송금', '비트코인', '계좌', '외부메신저', '카톡아이디'];
    const matched = dangerKeywords.filter(keyword => text.includes(keyword));
    if (matched.length > 0) {
      return { isSafe: false, reason: `로컬 정규식 차단: 의심 키워드 (${matched.join(', ')}) 감지`, scamScore: 50 };
    }
    return { isSafe: true, scamScore: 0 };
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); // 최신 모델 동기화
    const prompt = `
    당신은 데이팅 앱 'korea aimasu'의 보안 필터링 AI입니다. 
    다음 대화 혹은 자기소개 텍스트를 보고, 스캠 사기(환전 유도, 투자 권유, 외부 연락처 강요), 언어 폭력, 음란 대화 여부를 엄격히 판단하십시오.
    결과는 반드시 JSON 형식으로만 출력하십시오:
    {
      "isSafe": boolean,
      "reason": string (유해하다고 판단한 사유, 안전하다면 빈 문자열),
      "scamScore": number (0~100 사이의 위험도 점수)
    }

    검사할 텍스트:
    "${text}"
    `;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text().trim();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as SafetyCheckResult;
      return result;
    }
    
    return { isSafe: true, scamScore: 0 };
  } catch (error) {
    console.error('⚠️ Gemini 텍스트 유해성 검증 중 오류 발생:', error);
    return { isSafe: true, scamScore: 0 };
  }
}

/**
 * Gemini Multimodal Live API WebSocket 세션 초기화 및 양방향 AI 통역 파이프라인 생성
 * @param clientWs 클라이언트(React Native)와 백엔드 간의 WebSocket 연결 인스턴스
 * @param userId 오디오 스트림 송신 사용자 고유 ID
 * @param roomId 통화가 이뤄지고 있는 룸 ID
 * @param translationDirection AI 통역 방향 ('KR_TO_JP' | 'JP_TO_KR' | 'NONE')
 * @param onAudioData 통역된 번역 오디오(Base64 PCM)가 생성되었을 때 호출되는 콜백
 * @param onForceDisconnect 유해 감지로 인한 통화 강제 파괴 콜백
 */
export function createGeminiLiveSession(
  clientWs: WebSocket, 
  userId: string, 
  roomId: string,
  translationDirection: 'KR_TO_JP' | 'JP_TO_KR' | 'NONE',
  onAudioData: (base64Audio: string) => void,
  onForceDisconnect: (reason: string) => void
): WebSocket | null {
  if (!apiKey) {
    console.error('❌ Live API 연결 불가: GEMINI_API_KEY가 없습니다.');
    return null;
  }

  const geminiLiveUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  
  const geminiWs = new WebSocket(geminiLiveUrl);

  geminiWs.on('open', () => {
    console.log(`🟢 Gemini Live API WebSocket 연결이 개설되었습니다. (유저: ${userId}, 통역방향: ${translationDirection})`);
    
    let systemText = '';
    let responseModalities: string[] = ['text'];

    if (translationDirection === 'KR_TO_JP') {
      responseModalities = ['audio', 'text'];
      systemText = `당신은 한일 매칭 앱의 전문 동시통역사입니다. 입력되는 한국어 음성을 듣고 즉시 자연스럽고 친근한 일본어 음성으로 번역하여 말하십시오.
      번역 목적 이외의 어떠한 사담이나 설명도 대답하지 말고 즉각 통역 음성만 출력하십시오.
      단, 대화 중 심각한 금융 사기(송금 유도, 비트코인 거래 유도)나 폭언이 감지되면 즉시 통역을 중단하고 다음 JSON 메시지를 텍스트로 출력하십시오:
      {"alert": "WARN_SCAM", "reason": "스캠 의심 단어 감지"} 또는 {"alert": "TERMINATE_CALL", "reason": "심각한 욕설 및 유해 발언 감지"}`;
    } else if (translationDirection === 'JP_TO_KR') {
      responseModalities = ['audio', 'text'];
      systemText = `당신은 일한 매칭 앱의 전문 동시통역사입니다. 입력되는 일본어 음성을 듣고 즉시 자연스럽고 친근한 한국어 음성으로 번역하여 말하십시오.
      번역 목적 이외의 어떠한 사담이나 설명도 대답하지 말고 즉각 통역 음성만 출력하십시오.
      단, 대화 중 심각한 금융 사기(송금 유도, 비트코인 거래 유도)나 폭언이 감지되면 즉시 통역을 중단하고 다음 JSON 메시지를 텍스트로 출력하십시오:
      {"alert": "WARN_SCAM", "reason": "스캠 의심 단어 감지"} 또는 {"alert": "TERMINATE_CALL", "reason": "심각한 욕설 및 유해 발언 감지"}`;
    } else {
      // 통역 비활성화 시: 순수 보안 감시 모드로 작동 (침묵 지침)
      responseModalities = ['text'];
      systemText = `당신은 실시간 AI 보안관입니다. 통화를 청취하다가 유해 행위나 스캠이 감지되면 JSON 메시지만 텍스트로 대답하고, 평소에는 절대 말하지 마십시오.`;
    }

    const setupMessage = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: responseModalities,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: translationDirection === 'KR_TO_JP' ? 'Aoede' : 'Puck' // 남/여 목소리 다변화
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: systemText }]
        }
      }
    };

    geminiWs.send(JSON.stringify(setupMessage));
  });

  geminiWs.on('message', async (data: WebSocket.Data) => {
    try {
      const response = JSON.parse(data.toString());
      
      if (response.serverContent?.modelTurn?.parts) {
        for (const part of response.serverContent.modelTurn.parts) {
          
          // 1. 번역 오디오 스트림 수신 시 콜백 전달 (오디오-투-오디오)
          if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
            onAudioData(part.inlineData.data);
          }

          // 2. 보안 가드 텍스트 수신 시 실시간 차단 처리
          if (part.text) {
            console.log(`🤖 Gemini Live 분석 [User: ${userId}]: ${part.text}`);
            
            const alertMatch = part.text.match(/\{[\s\S]*\}/);
            if (alertMatch) {
              const alertObj = JSON.parse(alertMatch[0]);
              
              if (alertObj.alert === 'WARN_SCAM') {
                const status = await DbService.incrementScamScore(userId, 30, alertObj.reason || '스캠 키워드 언급');
                
                clientWs.send(JSON.stringify({
                  event: 'ai_guard_alert',
                  alert: 'WARN_SCAM',
                  reason: `${alertObj.reason} (누적 위험도: ${status.scamScore}점)`
                }));

                if (status.isBanned) {
                  onForceDisconnect(`누적 스캠 스코어 임계값 초과 (${status.scamScore}점)`);
                }

              } else if (alertObj.alert === 'TERMINATE_CALL') {
                await DbService.incrementScamScore(userId, 80, alertObj.reason || '심각한 정책 위반 발언');
                onForceDisconnect(alertObj.reason || '심각한 유해 및 스캠 대화 감지');
              }
            }
          }
        }
      }
    } catch (e) {
      // 바이너리 데이터 변환 오류 무시
    }
  });

  geminiWs.on('error', (err: Error) => {
    console.error(`❌ Gemini Live API WebSocket 에러 (${userId}):`, err);
    clientWs.send(JSON.stringify({ event: 'system_error', message: 'AI 실시간 가드/통역 모듈 연결 오류' }));
  });

  geminiWs.on('close', (code: number, reason: Buffer) => {
    console.log(`🔴 Gemini Live API WebSocket 연결 종료 (User: ${userId}, Code: ${code})`);
  });

  return geminiWs;
}

/**
 * 80점 미만의 매칭 결과에 대해 두 사용자가 가치관 차이를 어떻게 조율해야 하는지 Gemini 2.0 Flash로 어드바이스를 생성합니다.
 */
export async function generateMatchAdvice(
  u1: any,
  u2: any,
  score: number,
  details: any
): Promise<string> {
  const fallbackMessage = `두 분은 자녀 계획, 거주지 의향 혹은 종교관 등에서 소폭의 차이가 존재합니다. 서로의 다름을 인정하고, 배려하는 열린 대화를 나눠보실 것을 권장드립니다.`;

  if (!ai) {
    console.warn('⚠️ [Gemini Mock Mode] API Key가 없어 로컬 고정 가이드 문구를 리턴합니다.');
    return fallbackMessage;
  }

  try {
    const model = ai.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
    
    const getReligionText = (r: string) => {
      if (r === 'NONE') return '무교(なし)';
      if (r === 'CHRISTIAN') return '기독교(キリスト教)';
      if (r === 'BUDDHIST') return '불교(仏教)';
      if (r === 'CATHOLIC') return '천주교(カトリック)';
      return '기타(その他)';
    };

    const getResidenceText = (res: string) => {
      if (res === 'STAY_IN_KR') return '한국 거주 희망(韓国居住希望)';
      if (res === 'STAY_IN_JP') return '일본 거주 희망(日本居住希望)';
      return '상호 조율 가능(柔軟に対応可能)';
    };

    const getChildText = (c: string) => {
      if (c === 'WANT_CHILDREN') return '자녀를 원함(子供を希望)';
      if (c === 'NO_CHILDREN') return '자녀를 원치 않음(子供を希望しない)';
      return '상호 협의 필요(話し合いが必要)';
    };

    const getIncomeText = (inc: string) => {
      if (inc === 'YES') return '맞벌이 필수(共働き希望)';
      if (inc === 'NO') return '외벌이 선호(専業主婦/主夫希望)';
      return '상호 조율 가능(柔軟に対応可能)';
    };

    const prompt = `
    당신은 한일 양국 간 진지한 결혼을 조력하는 전문 커플 매니저이자 연애/상담 상담사 AI입니다.
    가치관 매칭 점수가 ${score}점으로 다소 낮게 나온 남녀 두 유저가 있습니다. 
    이 두 유저가 결혼 후 갈등을 겪지 않고, 첫 만남이나 대화 시 어떻게 이 차이점들을 조율해야 하는지 따뜻하고 정중한 어조의 가이드 코멘트를 생성하십시오.
    
    [유저 1의 조건]:
    - 자녀 계획: ${getChildText(u1.childPlan)}
    - 거주 희망: ${getResidenceText(u1.residenceWill)}
    - 종교: ${getReligionText(u1.religion)}
    - 맞벌이 여부: ${getIncomeText(u1.dualIncome)}
    
    [유저 2의 조건]:
    - 자녀 계획: ${getChildText(u2.childPlan)}
    - 거주 희망: ${getResidenceText(u2.residenceWill)}
    - 종교: ${getReligionText(u2.religion)}
    - 맞벌이 여부: ${getIncomeText(u2.dualIncome)}

    [가치관 점수 세부 분석 (최대 만점)]:
    - 거주지 의사: ${details.residenceScore} / 25점
    - 언어소통 능력: ${details.languageScore} / 25점
    - 자녀 계획: ${details.childPlanScore} / 20점
    - 종교 일치도: ${details.religionScore} / 15점
    - 맞벌이/경제관: ${details.economicScore} / 15점

    [지침]:
    1. 두 유저의 조건에서 서로 '다른 부분'을 명확히 짚어주되, 서로의 생각을 비난하지 않고 정중한 조언으로 승화시키십시오.
    2. 한국어와 일본어 사용자가 함께 보는 리포트이므로, 한국어로 작성한 후 그 아래에 일본어(丁寧語, 경어) 번역을 함께 덧붙여 주십시오.
    3. 구체적으로 "첫 통화나 대화 시 이 주제에 대해 어떻게 질문을 시작하면 좋을지" 질문 오프닝 팁을 하나씩 양국어로 제안하십시오.
    `;

    const response = await model.generateContent(prompt);
    return response.response.text().trim() || fallbackMessage;
  } catch (error) {
    console.error('⚠️ [Gemini Match Advice 에러] 로컬 폴백 텍스트 리턴:', error);
    return fallbackMessage;
  }
}
