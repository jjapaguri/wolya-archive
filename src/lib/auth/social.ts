/**
 * 소셜 로그인 제공자 설정 — 카카오·네이버·구글.
 *
 * **서버 전용이다.** 앱 키가 들어 있는 환경변수를 읽는다. `NEXT_PUBLIC_` 접두사를
 * 쓰지 않으므로 클라이언트 번들에는 값이 들어가지 않는다 — 그러니 이 모듈을
 * "use client" 파일에서 import 하지 않는다. 화면은 서버 컴포넌트가 계산한
 * `enabledSocialProviders()` 결과를 props 로 받는다.
 *
 * ── 키가 없으면 버튼이 사라진다 ────────────────────────────────
 * 앱 키는 사람이 서버 `.env.local` 에 넣는다. 코드에는 키가 없고, 없는 상태로도
 * 빌드·배포가 통과해야 한다. 그래서 "설정됐는지" 를 런타임에 보고,
 * 안 됐으면 그 제공자는 목록에서 빠진다 = 버튼이 안 보인다.
 * **키를 채우고 재시작하면 코드 수정 없이 켜진다.**
 *
 * 사람이 각 콘솔에 등록해야 하는 값과 환경변수 이름은 PR 본문의 인수인계 목록에 있다.
 */

/**
 * 소셜 로그인 왕복 중 state 를 담아 두는 쿠키.
 * (route.ts 는 정해진 이름 말고 다른 것을 export 할 수 없어서 여기 둔다.)
 */
export const OAUTH_STATE_COOKIE = "wolya_oauth";
/** 동의 화면을 넘기기 충분한 시간. 길게 두면 그만큼 재생 공격 창이 열린다. */
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

export const SOCIAL_PROVIDERS = ["kakao", "naver", "google"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export function isSocialProvider(value: string): value is SocialProvider {
  return (SOCIAL_PROVIDERS as readonly string[]).includes(value);
}

/** 화면에 쓰는 표기. 여기엔 비밀값이 없으므로 클라이언트로 내려도 된다. */
export const SOCIAL_LABELS: Record<SocialProvider, string> = {
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
};

type ProviderSpec = {
  /** 앱 키 환경변수 이름 */
  idEnv: string;
  secretEnv: string;
  /**
   * 제공자가 client_secret 을 필수로 요구하나.
   * 카카오는 콘솔에서 "보안 > Client Secret" 을 켠 경우에만 쓴다(기본 꺼짐).
   */
  secretRequired: boolean;
  authorizeUrl: string;
  tokenUrl: string;
  profileUrl: string;
  scope?: string;
};

const SPECS: Record<SocialProvider, ProviderSpec> = {
  kakao: {
    idEnv: "KAKAO_CLIENT_ID",
    secretEnv: "KAKAO_CLIENT_SECRET",
    secretRequired: false,
    authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
    profileUrl: "https://kapi.kakao.com/v2/user/me",
    // 이메일은 카카오 콘솔에서 동의항목을 켠 경우에만 온다. 안 와도 가입은 된다
    // (users.email 은 NULL 허용 — db/README.md 2단계 요점)
    scope: "account_email",
  },
  naver: {
    idEnv: "NAVER_CLIENT_ID",
    secretEnv: "NAVER_CLIENT_SECRET",
    secretRequired: true,
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
    tokenUrl: "https://nid.naver.com/oauth2.0/token",
    profileUrl: "https://openapi.naver.com/v1/nid/me",
  },
  google: {
    idEnv: "GOOGLE_CLIENT_ID",
    secretEnv: "GOOGLE_CLIENT_SECRET",
    secretRequired: true,
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
  },
};

export type SocialConfig = {
  provider: SocialProvider;
  clientId: string;
  clientSecret: string | null;
  spec: ProviderSpec;
};

/** 설정이 갖춰졌으면 config, 아니면 null. 이 함수가 곧 "버튼이 보이나" 의 판정이다. */
export function socialConfig(provider: SocialProvider): SocialConfig | null {
  const spec = SPECS[provider];
  const clientId = process.env[spec.idEnv]?.trim();
  const clientSecret = process.env[spec.secretEnv]?.trim() || null;

  if (!clientId) return null;
  if (spec.secretRequired && !clientSecret) return null;

  return { provider, clientId, clientSecret, spec };
}

/** 지금 켜져 있는 제공자 목록. 서버 컴포넌트에서 불러 화면에 내려준다. */
export function enabledSocialProviders(): SocialProvider[] {
  return SOCIAL_PROVIDERS.filter((provider) => socialConfig(provider) !== null);
}

/**
 * 콜백 주소. 제공자 콘솔에 **똑같은 문자열로** 등록돼 있어야 한다.
 *
 * `AUTH_BASE_URL` 을 넣어 두는 것을 권한다. 안 넣으면 요청 헤더로 유추하는데,
 * Nginx 설정이 바뀌면 값이 흔들려 제공자 쪽 등록값과 어긋날 수 있다.
 */
export function callbackUrl(provider: SocialProvider, requestUrl: URL, headers: Headers): string {
  return `${baseUrl(requestUrl, headers)}/api/auth/social/${provider}/callback`;
}

export function baseUrl(requestUrl: URL, headers: Headers): string {
  const configured = process.env.AUTH_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const proto = headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? requestUrl.host;
  return `${proto}://${host}`;
}

/** 제공자에게 보낼 인가 요청 주소. */
export function authorizeUrl(
  config: SocialConfig,
  redirectUri: string,
  state: string
): string {
  const url = new URL(config.spec.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  if (config.spec.scope) url.searchParams.set("scope", config.spec.scope);
  return url.toString();
}

export type SocialProfile = {
  /** 제공자가 주는 고유 id. `user_social_accounts.provider_user_id` 로 들어간다 */
  providerUserId: string;
  /** 제공자가 이메일을 안 줄 수 있다 (카카오 동의항목 미승인 등) */
  email: string | null;
  /**
   * 제공자가 그 이메일의 소유를 확인했나.
   *
   * **미확인 이메일로는 기존 계정에 붙이지 않는다.** 확인 안 된 주소를 믿고 연결하면
   * "남의 이메일을 적어 둔 소셜 계정" 으로 그 사람 계정에 올라탈 수 있다.
   */
  emailVerified: boolean;
  /** 없으면 호출부가 기본값을 넣는다 */
  name: string | null;
};

/**
 * 인가 코드 → 액세스 토큰.
 * 실패하면 null. **응답 본문을 로그에 찍지 않는다** — 토큰이 그대로 로그에 남는다.
 */
async function exchangeCode(
  config: SocialConfig,
  code: string,
  redirectUri: string,
  state: string
): Promise<string | null> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    code,
  });
  if (config.clientSecret) body.set("client_secret", config.clientSecret);
  // 네이버는 state 를 토큰 교환에서도 요구한다
  if (config.provider === "naver") body.set("state", state);

  try {
    const response = await fetch(config.spec.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    });
    if (!response.ok) return null;

    const json = (await response.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

/** 액세스 토큰 → 프로필. 실패하면 null. */
async function fetchProfile(
  config: SocialConfig,
  accessToken: string
): Promise<SocialProfile | null> {
  try {
    const response = await fetch(config.spec.profileUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const json: unknown = await response.json();
    return normalizeProfile(config.provider, json);
  } catch {
    return null;
  }
}

/** 제공자마다 응답 모양이 달라 여기서 하나로 맞춘다. */
function normalizeProfile(provider: SocialProvider, json: unknown): SocialProfile | null {
  if (typeof json !== "object" || json === null) return null;

  if (provider === "kakao") {
    const data = json as {
      id?: number | string;
      kakao_account?: {
        email?: string;
        is_email_verified?: boolean;
        profile?: { nickname?: string };
      };
    };
    if (data.id === undefined || data.id === null) return null;
    return {
      providerUserId: String(data.id),
      email: data.kakao_account?.email ?? null,
      // 카카오는 확인 여부를 따로 준다. 안 주면 미확인으로 본다
      emailVerified: data.kakao_account?.is_email_verified === true,
      name: data.kakao_account?.profile?.nickname ?? null,
    };
  }

  if (provider === "naver") {
    const data = json as {
      response?: { id?: string; email?: string; name?: string; nickname?: string };
    };
    const id = data.response?.id;
    if (!id) return null;
    return {
      providerUserId: String(id),
      email: data.response?.email ?? null,
      // 네이버는 확인 플래그를 주지 않는다. 네이버 계정 이메일은 가입 시 확인되므로 신뢰한다
      emailVerified: Boolean(data.response?.email),
      name: data.response?.name ?? data.response?.nickname ?? null,
    };
  }

  const data = json as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!data.sub) return null;
  return {
    providerUserId: data.sub,
    email: data.email ?? null,
    emailVerified: data.email_verified === true,
    name: data.name ?? null,
  };
}

/** 콜백 한 번에 필요한 것: 코드 → 토큰 → 프로필. */
export async function resolveSocialProfile(
  config: SocialConfig,
  code: string,
  redirectUri: string,
  state: string
): Promise<SocialProfile | null> {
  const accessToken = await exchangeCode(config, code, redirectUri, state);
  if (!accessToken) return null;
  return fetchProfile(config, accessToken);
}
