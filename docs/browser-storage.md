# 브라우저 저장소 가이드

웹 브라우저에서 클라이언트 사이드 데이터를 저장하는 세 가지 방법을 비교합니다.

## 비교표

| 특성 | localStorage | sessionStorage | Cookie |
|------|--------------|----------------|--------|
| **용량** | ~5MB | ~5MB | ~4KB |
| **유지 기간** | 영구 (직접 삭제 전까지) | 탭/브라우저 닫으면 삭제 | 만료일 설정 가능 |
| **공유 범위** | 같은 도메인 모든 탭 | 해당 탭만 | 같은 도메인 모든 탭 |
| **서버 전송** | X | X | O (매 요청마다 자동 전송) |
| **접근 방식** | JavaScript만 | JavaScript만 | JavaScript + HTTP 헤더 |

## 상세 설명

### localStorage

```javascript
// 저장
localStorage.setItem('key', 'value');

// 조회
const value = localStorage.getItem('key');

// 삭제
localStorage.removeItem('key');

// 전체 삭제
localStorage.clear();
```

**특징:**
- 브라우저를 닫아도 데이터 유지
- 사용자가 명시적으로 삭제하거나 코드로 삭제할 때까지 영구 보관
- 같은 도메인의 모든 탭에서 공유

**적합한 용도:**
- 사용자 설정 (다크모드, 언어 등)
- 로그인 없는 서비스에서 사용자 식별
- 오프라인 데이터 캐싱

---

### sessionStorage

```javascript
// 저장
sessionStorage.setItem('key', 'value');

// 조회
const value = sessionStorage.getItem('key');

// 삭제
sessionStorage.removeItem('key');
```

**특징:**
- 탭을 닫으면 데이터 삭제
- 같은 도메인이라도 다른 탭과 공유 안 됨
- 페이지 새로고침해도 유지

**적합한 용도:**
- 일회성 폼 데이터 임시 저장
- 단일 세션 내 상태 유지
- 민감한 임시 데이터

---

### Cookie

```javascript
// 저장 (JavaScript)
document.cookie = "key=value; max-age=3600; path=/";

// 저장 (HTTP 헤더 - 서버에서)
Set-Cookie: key=value; Max-Age=3600; HttpOnly; Secure

// 조회
const cookies = document.cookie; // "key1=value1; key2=value2"
```

**특징:**
- 모든 HTTP 요청에 자동으로 서버에 전송됨
- 만료일, 도메인, 경로 등 세부 설정 가능
- `HttpOnly` 설정 시 JavaScript에서 접근 불가 (XSS 방어)
- `Secure` 설정 시 HTTPS에서만 전송

**적합한 용도:**
- 서버 인증 (세션 ID, JWT 토큰)
- 서버에서 읽어야 하는 설정값
- 크로스 사이트 추적 (third-party cookie)

---

## 이 프로젝트에서의 사용

### 현재 localStorage 사용 위치

```typescript
// src/lib/utils.ts

// 1. 세션 ID - 중복 참여 방지
export function getSessionId(): string {
  let sessionId = localStorage.getItem('lucky_draw_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('lucky_draw_session_id', sessionId);
  }
  return sessionId;
}

// 2. 플레이어 이름 - 재방문 시 이름 기억
export function getPlayerName(): string | null {
  return localStorage.getItem('lucky_draw_player_name');
}
```

### localStorage를 선택한 이유

| 저장소 | 중복 참여 방지 가능? | 이유 |
|--------|---------------------|------|
| sessionStorage | X | 탭 닫으면 새 세션 → 다시 참여 가능 |
| localStorage | O | 탭 닫아도 세션 ID 유지 → 중복 체크 가능 |
| Cookie | O | 가능하지만 매 요청마다 서버 전송되어 불필요한 오버헤드 |

**결론:** 로그인 없이 "한 번만 참여" 정책을 유지하려면 localStorage가 적합

### 한계점

- 시크릿/프라이빗 모드: 브라우저 닫으면 삭제됨 → 재참여 가능
- 다른 브라우저: 별도 저장소 → 재참여 가능
- localStorage 직접 삭제: 개발자 도구에서 삭제 가능

완벽한 중복 방지가 필요하면 로그인 시스템이 필요하지만, 이벤트성 게임에서는 진입 장벽을 낮추는 것이 더 중요하므로 현재 방식 채택.

---

## 설정/옵션 데이터는 DB에 저장

이 프로젝트에서 **설정값은 localStorage가 아닌 데이터베이스**에 저장합니다:

| 데이터 | 저장 위치 | 이유 |
|--------|-----------|------|
| 스프라이트 설정 (spriteConfig) | `templates.sprite_config` | 관리자가 설정한 값을 모든 사용자가 동일하게 봐야 함 |
| 개별 오프셋 (offset_x, offset_y) | `template_slots`, `prizes` | 위와 동일 |
| 사용자 세션 ID | localStorage | 클라이언트별로 다른 값 |
| 플레이어 이름 | localStorage | 클라이언트별로 다른 값 |

**원칙:**
- 모든 사용자가 공유해야 하는 데이터 → DB
- 개별 사용자의 클라이언트 상태 → localStorage

---

## 보안 고려사항

### localStorage/sessionStorage
- XSS 공격에 취약 (JavaScript로 접근 가능)
- 민감한 정보 (비밀번호, 토큰 등) 저장 금지
- 반드시 클라이언트에서만 필요한 비민감 데이터만 저장

### Cookie
- `HttpOnly`: JavaScript 접근 차단 (XSS 방어)
- `Secure`: HTTPS에서만 전송
- `SameSite`: CSRF 공격 방어
  - `Strict`: 같은 사이트 요청에서만 전송
  - `Lax`: 외부 링크 클릭 시에도 전송 (기본값)
  - `None`: 모든 요청에 전송 (Secure 필수)

```javascript
// 보안 설정된 쿠키 예시
document.cookie = "token=abc123; Secure; SameSite=Strict; path=/";
```
