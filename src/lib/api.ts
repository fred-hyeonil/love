/**
 * API 통신을 위한 공통 유틸리티 파일
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

// 브라우저 콘솔에서 현재 연결된 백엔드 주소 확인용
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[apiFetch] BASE:", BASE);
}

/**
 * 커스텀 에러 클래스: API 응답이 성공(200~299)이 아닐 때 발생
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`API ${status} ${statusText} - ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

/**
 * fetch API를 래핑한 공통 함수
 * 1. 기본 헤더(JSON) 설정
 * 2. localStorage에서 토큰을 찾아 Authorization 헤더에 자동 추가
 * 3. 에러 발생 시 ApiError 던짐
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE}${path}`;
  const method = (options.method || "GET").toUpperCase();

  // 로그인 요청에는 Authorization 헤더를 넣지 않음 (백엔드 401 방지)
  const isLoginRequest = path === "/api/auth/login" && method === "POST";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.headers) {
    const incoming =
      options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string>);
    Object.assign(headers, incoming);
  }
  if (typeof window !== "undefined" && !isLoginRequest) {
    const token = localStorage.getItem("accessToken");
    const authHeader: Record<string, string> = token
      ? { Authorization: "Bearer " + token }
      : {};
    // eslint-disable-next-line no-console
    console.log("[apiFetch]", method, url, "authHeader:", token ? "Bearer " + token.slice(0, 20) + "..." : "(없음)");
    Object.assign(headers, authHeader);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (e) {
    // Failed to fetch: 서버 미실행, CORS, 네트워크 끊김 등
    const msg = e instanceof Error ? e.message : String(e);
    throw new ApiError(0, "NetworkError", msg);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, res.statusText, text);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

// ========== 1. 인증 & 세션 ==========

/** 로그인 요청 */
export interface LoginRequest {
  userId: string;
  password: string;
}

/** 로그인 응답 (백엔드가 accessToken + 세션 정보를 한 번에 내려줄 수 있음) */
export interface LoginResponse {
  accessToken: string;
  user?: SessionUser;
  partnerType?: SessionPartnerType;
  lastConversation?: SessionLastConversation | null;
  lastConversationMessages?: SessionConversationMessage[];
}

/** 세션 조회 응답 - GET /api/session */
export interface SessionUser {
  id: number;
  userId: string;
  name: string;
  birthDate: string;
}

export type PartnerTypeValue = string;

export interface SessionPartnerType {
  isSet: boolean;
  value: PartnerTypeValue;
}

export type ConversationMode = "SIMULATION" | "FREE_CHAT";

export interface SessionLastConversation {
  id: number;
  title: string;
  mode: ConversationMode;
  lastMessageAt: string;
}

export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export interface SessionConversationMessage {
  id: number;
  conversationId: number;
  role: MessageRole;
  content: string;
  clientMessageId: string | null;
  createdAt: string;
}

export interface SessionResponse {
  user: SessionUser;
  partnerType: SessionPartnerType;
  lastConversation: SessionLastConversation | null;
  lastConversationMessages: SessionConversationMessage[];
}

const SESSION_STORAGE_KEY = "appSession";

/** 로그인 직후 또는 앱 초기 진입 시 1회 호출. localStorage에 저장. */
export async function getSession(): Promise<SessionResponse> {
  const data = await apiFetch("/api/session");
  const session = data as SessionResponse;
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

/** localStorage에 저장된 세션 읽기 (없으면 null) */
export function getStoredSession(): SessionResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionResponse;
  } catch {
    return null;
  }
}

/**
 * 로그인: POST /api/auth/login
 * 요청 body는 반드시 { userId, password } (백엔드와 동일).
 * URL: /api/auth/login, Content-Type: application/json
 */
export async function login(body: LoginRequest): Promise<LoginResponse> {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ userId: body.userId, password: body.password }),
  });
  return data as LoginResponse;
}

// ========== 2. 성격 유형(테스트 결과) 저장 ==========

/**
 * 파트너 유형 저장 (설문 결과 또는 내 여자친구 고르기 선택)
 * - URL: POST /api/test-results/partner-type
 * - 인증 필수 (apiFetch가 Bearer 토큰 자동 첨부)
 * - Body: { "value": "저장할 유형 문자열" }
 * - 성공 후 GET /api/session 재호출로 상태 업데이트 권장
 */
export async function postPartnerType(value: string): Promise<void> {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new ApiError(400, "Bad Request", "value is required");
  }
  await apiFetch("/api/test-results/partner-type", {
    method: "POST",
    body: JSON.stringify({ value: trimmed }),
  });
}

// ========== 3. 대화(Conversation) ==========

export interface ConversationListItem {
  id: number;
  title: string;
  mode: ConversationMode;
  lastMessageAt: string;
}

/** GET /api/conversations */
export async function getConversations(): Promise<ConversationListItem[]> {
  const data = await apiFetch("/api/conversations");
  return data as ConversationListItem[];
}

export interface CreateConversationRequest {
  title: string;
  scenarioKey?: string | null;
  personaKey?: string | null;
}

export interface CreateConversationResponse {
  conversationId: number;
}

/** POST /api/conversations - 새 대화 생성 */
export async function createConversation(
  body: CreateConversationRequest
): Promise<CreateConversationResponse> {
  const data = await apiFetch("/api/conversations", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data as CreateConversationResponse;
}

// ========== 4. 메시지 ==========

export interface ConversationMessage {
  id: number;
  conversationId: number;
  role: MessageRole;
  content: string;
  clientMessageId: string | null;
  createdAt: string;
}

/** GET /api/conversations/{conversationId}/messages */
export async function getConversationMessages(
  conversationId: number | string
): Promise<ConversationMessage[]> {
  const data = await apiFetch(
    `/api/conversations/${encodeURIComponent(String(conversationId))}/messages`
  );
  return data as ConversationMessage[];
}

/**
 * 메시지 전송 요청 (CreateMessageRequest)
 * FE 전송 시 role은 반드시 "USER"만 사용. "ASSISTANT"를 보내면 BE enum 매핑 오류 가능.
 */
export interface SendMessageBody {
  role: "USER" | "ASSISTANT";
  content: string;
  clientMessageId: string;
}

/** 메시지 전송 응답 (MessageResponse) */
export interface MessageResponse {
  id: number;
  conversationId: number;
  role: MessageRole;
  content: string;
  clientMessageId: string | null;
  createdAt: string;
}

/**
 * 자바가 Python 응답 받은 뒤 한 번에 내려주는 응답 (폴링 불필요)
 * POST /api/conversations/{conversationId}/messages 응답이 이 형태면 assistantMessage 로 바로 표시.
 */
export interface AddMessageResponse {
  userMessage: MessageResponse;
  assistantMessage: MessageResponse;
}

/** POST /api/conversations/{conversationId}/messages - 자바가 Python 끝날 때까지 대기 후 userMessage + assistantMessage 반환 가능 */
export async function sendConversationMessage(
  conversationId: number | string,
  body: SendMessageBody
): Promise<MessageResponse | AddMessageResponse> {
  const data = await apiFetch(
    `/api/conversations/${encodeURIComponent(String(conversationId))}/messages`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return data as MessageResponse | AddMessageResponse;
}

// ========== 5. 감정 분석 보고서 (Python report → 자바 전달 → 프론트) ==========

/** 메시지별 감정 분석 결과 (userReport.messages / assistantReport.messages) */
export interface ReportMessageItem {
  text: string;
  emotion: string;
  /** 해당 감정 확신도 퍼센트 (0~100) */
  confidence: number;
  /** 5종 감정 비율 0~1 (레거시) */
  scores?: Record<string, number>;
  /** 5종 감정 전부 퍼센트 0~100 – 차트/바에 그대로 사용 */
  scoresPct?: Record<string, number>;
}

/** 사용자/상대방 보고서 블록 (detailsJson 파싱 후) */
export interface ReportDetailBlock {
  summary: string;
  /** 감정별 횟수 – 막대그래프 등에 사용 (예: { "슬픔": 2, "분노": 1 }) */
  counts?: Record<string, number>;
  messages: ReportMessageItem[];
}

/** 사용자 중심 코칭 (details.userFocusReport) – "이렇게 말해보면 어때요?" 섹션 등 */
export interface UserFocusReport {
  /** 관찰 문장 목록 (선택) */
  insights?: string[];
  /** 코칭 추천 문장 – "이렇게 말해보면 어때요?" 박스에 순서대로 렌더 */
  coaching: string[];
  /** 감정 밸런스 (선택): userNegativeRatio, assistantNegativeRatio, difference, sentence 등 */
  emotionBalance?: { userNegativeRatio?: number; assistantNegativeRatio?: number; difference?: number; sentence?: string };
  /** 감정 기복 (선택): transitionCount, level, sentence 등 */
  volatility?: { transitionCount?: number; level?: string; sentence?: string };
  /** 습관 분석 등 그 외 필드는 인덱스 시그니처로 허용 */
  [key: string]: unknown;
}

/** 프론트에서 쓰는 파싱 후 구조 (detailsJson 파싱 결과) */
export interface ConversationReportResponse {
  summary: string;
  details: {
    userReport: ReportDetailBlock;
    assistantReport: ReportDetailBlock;
    /** 사용자 중심 코칭 – 백엔드(Python→자바)에서 전달. coaching 배열을 "이렇게 말해보면 어때요?"에 사용 */
    userFocusReport?: UserFocusReport;
  };
}

/** 자바가 실제로 내려주는 응답 (detailsJson 은 JSON 문자열) */
export interface ConversationReportRawResponse {
  summary: string;
  detailsJson: string;
}

/**
 * 대화 종료 후 감정 분석 보고서 요청.
 * - POST /api/conversations/{conversationId}/report
 * - Body 없음 (빈 객체). Headers: Content-Type, Authorization: Bearer {accessToken} (apiFetch가 객체로 첨부)
 * - 응답: summary + detailsJson(문자열) → detailsJson 파싱 후 반환
 */
export async function fetchConversationReportByConversationId(
  conversationId: number | string
): Promise<ConversationReportResponse> {
  const data = (await apiFetch(
    `/api/conversations/${encodeURIComponent(String(conversationId))}/report`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )) as ConversationReportRawResponse;

  let details: ConversationReportResponse["details"];
  try {
    details = JSON.parse(data.detailsJson || "{}") as ConversationReportResponse["details"];
  } catch {
    details = {
      userReport: { summary: "", counts: {}, messages: [] },
      assistantReport: { summary: "", counts: {}, messages: [] },
      userFocusReport: { insights: [], coaching: [] },
    };
  }
  if (!details.userFocusReport) {
    details.userFocusReport = { insights: [], coaching: [] };
  }
  return { summary: data.summary ?? "", details };
}

/**
 * (fallback) 대화 텍스트를 직접 보낼 때. 역시 apiFetch 사용 → Authorization 자동 첨부.
 */
export async function fetchConversationReport(
  userTexts: string[],
  assistantTexts: string[]
): Promise<ConversationReportResponse> {
  const data = await apiFetch("/api/emotion-analysis/conversation-report", {
    method: "POST",
    body: JSON.stringify({ userTexts, assistantTexts }),
  });
  return data as ConversationReportResponse;
}

export { SESSION_STORAGE_KEY };
