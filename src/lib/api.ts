const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

// Dev debug: shows which base URL is being used in the browser console
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[apiFetch] BASE:", BASE);
}

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

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE}${path}`;
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[apiFetch]", options.method || "GET", url);
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, res.statusText, text);
  }

  // 응답이 비어있을 수도 있으니 안전하게
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}