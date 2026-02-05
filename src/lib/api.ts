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
  
  // 브라우저 환경에서 토큰이 있으면 자동으로 헤더에 추가
  let authHeader = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // JWT 토큰이 있으면 Bearer 방식으로 헤더에 포함
      authHeader = { Authorization: `Bearer ${token}` };
    }
    // eslint-disable-next-line no-console
    console.log("[apiFetch]", options.method || "GET", url);
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader, // 자동 인증 헤더 추가
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // 백엔드에서 에러 응답(401 등)을 보내면 커스텀 에러 발생
    throw new ApiError(res.status, res.statusText, text);
  }

  // 응답 데이터의 타입에 따라 JSON 또는 텍스트로 안전하게 반환
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}
