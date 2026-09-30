This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Track catalog (Ver. 1.8.0)

The wiki includes 30 main race courses and 10 SNES sub-courses, for 40 unique
track pages. Battle courses, inter-course routes and alternate Grand Prix layouts
are not counted as additional tracks. Nintendo confirms the 10 sub-courses in its
[Ver. 1.8.0 update notes](https://en-americas-support.nintendo.com/app/answers/detail/a_id/68580).

- `data/track-catalog.json`: stable slugs, article URLs and original image metadata.
- `data/track-content.ts`: original short introductions, editorial categories,
  Grand Prix cups and parent-course relationships, based on the linked articles.
- `data/tracks.ts`: combines the catalog with the existing four track guides.
  New tracks have no invented difficulty rating or shortcut instructions;
  `difficulty: null` means not rated and remains visible with the All filter.
- `public/images/tracks/`: 40 local WebP course-selection images. These are
  course previews, not overhead route maps. Image rights belong to Nintendo;
  the file-description links in the catalog credit Super Mario Wiki as the source.

Images were retrieved on 2026-09-27 and converted without changing their dimensions.
Run `node scripts/download-track-images.mjs` to restore missing assets from the
catalog; existing files are preserved. The script uses the installed `sharp`
dependency supplied with Next.js. Keep the source links and image credits when
adding or replacing assets. A source credit does not change the original image rights.

Each new track needs a unique lowercase hyphenated slug, an entry in both data
files, and a matching local image. A SNES course's `parentSlug` must point to an
existing main course. Keep the four featured homepage courses stable; the full
catalog is available through `/tracks`.

## 숏컷 페이지 · 관리자 편집

40개 트랙 모두 `/tracks/[slug]/shortcuts`에서 영상, 준비 조건, 단계별 설명과
이미지를 볼 수 있습니다. 트랙의 Shortcuts 영역과 홈페이지 숏컷 카드에서 연결됩니다.
방문자는 읽기만 가능하고, 관리자 로그인 후 웹사이트에서 직접 추가·수정·삭제합니다.
‘저장·공개’를 누르면 다른 방문자에게도 반영됩니다. 기존 4개 가이드는 초기 내용으로
유지되며, 저장한 트랙은 클라우드 내용을 우선 표시합니다.

### 로컬 저장 설정

로컬에서 사용할 때는 `.env.local`에 `SHORTCUT_STORAGE=local`과
아래 Google 관리자 로그인 환경 변수를 설정합니다. Vercel Blob 연결 없이 내용 저장과
이미지·영상 업로드가 가능합니다. 환경 변수가 반영되지 않으면 개발 서버를 재시작합니다.
내용과 업로드 파일은 프로젝트의 `.shortcut-data/`에 보관되며 Git에 포함되지 않습니다.
서버를 다시 실행해도 유지됩니다. 백업할 때는 이 폴더 전체를 복사하세요.
로컬 미디어 주소는 해당 서버에서만 유효하므로 배포 시 파일도 별도로 이전해야 합니다.
Vercel 배포에서는 로컬 저장을 사용하지 않고 아래 Blob 설정을 사용합니다.

### Vercel 설정 (배포 시 필수)

1. Vercel 프로젝트의 Storage에서 **Public Vercel Blob** 저장소를 생성·연결합니다.
   이미지와 영상, 숏컷 설명은 공개 자료입니다. 서버 쓰기 토큰은 공개되지 않습니다.
2. 서버 환경 변수 `BLOB_READ_WRITE_TOKEN`이 연결되어 있는지 확인합니다.
   직접 업로드 토큰 발급에 필요하며 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.
3. 아래 Google OAuth 설정과 별도의 `ADMIN_SESSION_SECRET`을 설정합니다.
   Client secret과 세션 secret을 채팅이나 코드에 넣지 않습니다.
4. 환경 변수 적용 후 재배포합니다. 로컬 개발은 `.env.example`을 참고해 동일 값을 `.env.local`에 넣고 재시작합니다.
   Production과 Preview는 서로 다른 Blob 저장소와 세션 secret을 사용합니다.
5. 숏컷 페이지 → 관리자 로그인 → 내용 작성 → **저장·공개**.

저장소/Google 설정이 없으면 읽기 화면은 열리고 편집에 필요한 설정을 안내합니다.
API는 저장과 업로드 토큰 발급 시 서버에서 관리자 세션·Origin을 확인합니다.

### Google 관리자 로그인 설정

비밀번호 로그인은 제거했습니다. Google이 검증한 계정 ID(`sub`)가 서버의 `GOOGLE_ADMIN_SUB`와
정확히 일치하는 계정 한 개만 관리자로 허용합니다. 일반 Google 사용자의 로그인 성공은 관리자 권한이 아닙니다.
기존 비밀번호 쿠키도 새 세션으로 인정하지 않습니다. `SHORTCUT_ADMIN_PASSWORD`는 더 이상 사용하지 않습니다.

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 선택하고
   Google Auth Platform의 Branding/Audience를 설정합니다. Testing 상태라면 관리자 계정을 Test user로 추가합니다.
   Clients에서 **Web application** OAuth 클라이언트를 만들고 다음 redirect URI를 정확히 등록합니다.
   로컬: `http://localhost:3000/api/shortcut-admin/callback`.
   배포: `https://mario-kart-wiki.vercel.app/api/shortcut-admin/callback`.
   다른 도메인·포트·127.0.0.1을 쓰면 해당 주소도 별도로 등록하고 그 주소에서 로그인하세요.
2. `.env.local` 또는 Vercel 서버 환경 변수에 아래 값을 설정합니다. `NEXT_PUBLIC_` 접두사는 사용하지 않습니다.

```dotenv
GOOGLE_CLIENT_ID=발급된-ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=발급된-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/shortcut-admin/callback
ADMIN_SESSION_SECRET=독립적으로-생성한-32자-이상의-임의-secret
GOOGLE_ADMIN_SUB=
```

세션 secret은 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`로
생성할 수 있습니다. 개발·배포 환경에는 각각 별도 값을 사용합니다.

3. 서버를 재시작한 뒤 `/admin/content`에서 ‘Google 계정으로 관리자 로그인’을 누르고 **본인의 계정**으로
   인증합니다. `GOOGLE_ADMIN_SUB`가 비어 있는 최초 설정에서는 검증된 계정 ID를 텍스트로 보여줄 뿐,
   관리자 세션을 발급하지 않습니다. 표시된 `GOOGLE_ADMIN_SUB=...` 값을 환경 변수에 등록합니다.
   누구나 자신의 ID를 확인할 수 있지만 서버 설정 변경 권한 없이 관리자가 될 수 없습니다.
4. 재시작/재배포하고 다시 Google 로그인합니다. 등록된 계정만 편집·저장·업로드·백업이 가능합니다.
   다른 계정, 인증 취소, 만료/변조된 요청은 설명과 함께 차단됩니다.
5. 해당 Google 계정에서 패스키 또는 2단계 인증을 활성화합니다. 사이트가 Google의 MFA 설정 여부를
   강제하거나 매번 추가 인증을 요구하는 것은 아닙니다. 계정 설정은 직접 관리해야 합니다.

인증 코드는 서버에서 교환하며 `state`, `nonce`, PKCE(S256)로 로그인 요청을 연결합니다.
ID 토큰은 `jose`로 Google 공개키의 RSA 서명, issuer, audience, 만료, 발급 시각, nonce,
검증된 이메일을 확인합니다. 권한 판정은 이메일 대신 `sub`를 사용합니다. 로그인용 `openid email`
범위만 요청하며 Google access/refresh token은 저장하거나 브라우저에 전달하지 않습니다.
공식 흐름: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

OAuth 요청 쿠키는 HttpOnly/SameSite=Lax/10분으로 Google callback GET에서 사용할 수 있게 합니다.
관리자 세션은 별도 서명된 HttpOnly/SameSite=Strict 쿠키로 8시간 유지하며 HTTPS에서는 Secure를 사용합니다.
등록 계정 변경 또는 `ADMIN_SESSION_SECRET` 교체는 기존 세션을 무효화합니다. 로그아웃은 현재 브라우저의
쿠키를 삭제합니다. 이미 복사된 세션의 개별 서버측 폐기는 제공하지 않으므로 노출 시 secret을 교체하세요.
관리자 등록 전, OAuth 설정 오류, 인증 오류에서 비밀번호 로그인으로 돌아가는 우회 경로는 없습니다.

### 콘텐츠와 첨부 파일

- 영상: YouTube 일반/Shorts 링크, HTTPS 영상 직접 주소 또는 MP4/WebM/Ogg 업로드(100MB).
- 이미지: HTTPS 주소 또는 PNG/JPEG/WebP/GIF 업로드(10MB). 각 단계에 설명·이미지·캡션을
  넣고 단계를 추가/삭제/위로 이동할 수 있습니다. 미리보기에서 방문자 화면을 확인합니다.
- 파일은 브라우저에서 Blob으로 직접 업로드하므로 Vercel 함수의 요청 크기 제한을
  통과할 필요가 없습니다. 설명 JSON은 트랙당 2MB, 최대 100개 숏컷/숏컷당 100단계입니다.
- 업로드 즉시 공개 파일 URL이 생성되며 **저장·공개** 후 페이지에 연결됩니다.
  페이지에서 첨부를 제거해도 Blob 원본은 보존됩니다. 미사용 파일 정리는 Blob 관리 화면에서 합니다.
- 설명은 `shortcuts/content/[slug].json`, 미디어는 `shortcuts/media/[slug]/`에 저장됩니다.
  ETag 조건부 저장으로 다른 탭에서 수정한 내용을 덮어쓰지 않습니다.
- 백업 내보내기/불러오기는 해당 트랙의 설명과 미디어 **주소**를 보관합니다.
  미디어 바이너리는 포함하지 않으므로 원본 파일과 Blob 저장소도 따로 보관하세요.
- 공개 숏컷은 홈의 개수·카드, 검색 목록, 트랙 상세 요약과 숏컷 전용 페이지에 함께 반영됩니다.
  저장 이력이 없는 트랙만 기존 가이드를 사용하며, 전부 삭제해 저장하면 빈 목록을 유지합니다.
  ‘저장·공개’ 후 새로 이동하거나 새로고침하면 최신 내용을 읽습니다. 이미 열려 있는 다른 탭은 새로고침하세요.
- 편집기의 ‘목록용 요약’은 최대 240자까지 목록에 표시합니다. 비워 두면 첫 번째 비어 있지 않은
  단계 설명, 준비 조건 순서로 사용합니다. 검색은 공개 숏컷의 제목과 이 목록용 설명을 대상으로 합니다.
  숏컷 난이도는 직접 입력하며 미입력은 미평가입니다. 트랙 자체의 난이도와 목록 필터 기준은 그대로 유지됩니다.
  홈 카드와 트랙 상세의 링크는 해당 숏컷으로 직접 이동합니다.
- 기존 version 1 백업도 가져올 수 있습니다. 새 요약·난이도 필드는 선택 사항이며,
  해당 필드가 없는 과거 백업은 단계 설명으로 요약하고 난이도를 미평가로 표시합니다.

구현: `lib/shortcut-drafts.ts`(스키마), `lib/shortcut-server.ts`(인증·클라우드 저장),
`app/api/shortcut-admin`, `app/api/shortcut-upload`, `app/api/tracks/[slug]/shortcuts`,
`app/tracks/[slug]/shortcuts`(읽기·편집 화면).

[Vercel Blob SDK 문서](https://vercel.com/docs/vercel-blob/using-blob-sdk) ·
[직접 업로드 문서](https://vercel.com/docs/vercel-blob/client-upload)

### 브라우저 초안 · 공개 전 검증

- 관리자 편집 내용은 변경할 때마다 트랙별로 현재 브라우저에 자동 보관됩니다. ‘초안 보관’으로
  직접 보관할 수도 있습니다. 로그인 후 보관 시각을 확인하고 복구하거나 삭제할 수 있습니다.
  초안은 서버에 공개되지 않으며 다른 기기·브라우저에는 전달되지 않습니다.
- 미완성 이름·설명·입력 중인 주소도 초안과 JSON 백업에는 보관할 수 있습니다.
  ‘저장·공개’ 시 빈 숏컷 이름, 빈 단계 설명, 잘못된 미디어 주소를 검사하고 해당 입력 위치로 이동합니다.
  영상·이미지는 필수가 아닙니다. 서버에서도 같은 공개 검증을 수행합니다.
- 초안에는 작성 당시 공개본의 버전을 보관합니다. 이후 다른 탭에서 공개 내용을 변경했다면
  덮어쓰기를 차단하고 최신 내용을 확인하게 합니다. ‘내 초안으로 계속 편집’을 선택해도 즉시 공개되지 않으며
  다시 ‘저장·공개’를 눌러야 합니다. 성공적으로 공개하면 이 탭이 보관한 초안만 정리합니다.
- 다른 탭이 브라우저 초안을 변경한 경우 편집 내용을 유지하고 자동 덮어쓰기를 중단합니다.
  현재 내용의 백업을 내보낸 뒤 ‘브라우저 초안 확인’에서 복구 또는 삭제를 선택하세요.
  읽을 수 없는 초안은 원본을 내보낸 뒤 삭제할 수 있으며 자동으로 삭제하지 않습니다.
- 브라우저 저장 공간이 차단되거나 부족하면 보관 실패를 표시합니다. 자동 보관에 실패한 내용은
  JSON 백업으로 보관하세요. 브라우저 데이터를 지우면 초안도 삭제됩니다. 초안에는 미디어 주소만 포함됩니다.

### 검색 · 필터

- `/tracks`에서 컵, 메인/SNES 코스, 공략 작성 여부, 난이도(미평가 포함)를 조합합니다.
  공략 여부는 Browse 항목 기준입니다. Tracks는 구간·숏컷·메커닉·전략 중 하나라도 있으면 작성됨으로 표시합니다.
  콘텐츠별 화면에서도 Guide pending을 선택하면 미작성 트랙을 찾을 수 있습니다.
- 정렬은 기존 순서, 영문 이름 A–Z/Z–A를 지원합니다. 최근 수정순은 수정 시각 데이터가 없으므로 제공하지 않습니다.
  Cup은 실제 `cups` 값을 사용하며 SNES 서브 코스는 별도 Grand Prix 컵으로 분류하지 않습니다.
- `data/track-content.ts`의 트랙 항목에 선택 필드 `nameKo`(한글 이름), `aliases`(문자열 배열)를
  입력하면 검색에 포함됩니다. 등록된 한글 이름은 목록에도 표시됩니다. 이름과 별칭은 임의로 생성하지 않습니다.
  검색은 공백으로 구분한 모든 단어를 찾으며 대소문자와 Unicode 표기 차이를 정규화합니다.
  Tracks 검색에서도 일치한 공개 숏컷 제목·요약을 최대 3개 표시합니다.
- 검색어와 모든 필터·정렬은 URL에 보관합니다. Copy search link로 공유하고 Clear filters로 초기화합니다.
  초기화해도 Browse 선택은 유지됩니다. 미공개 브라우저 초안은 검색하지 않습니다.

### 페이지 구성 · 공략 데이터 입력

- `/mechanics`: 메카닉 목록, `/mechanics/[slug]`: 항목별 메카닉 설명과 관련 트랙.
- `/strategies`: 기본 전략과 트랙별 전략 선택.
- `/strategies/basic`, `/strategies/basic/[slug]`: 기본 전략 목록과 항목별 설명.
- `/strategies/tracks`: 40개 트랙에서 전략 페이지를 선택. `/tracks/[slug]/strategies`: 해당 트랙 전략.
- `/shortcuts`: 40개 트랙에서 숏컷 페이지를 선택. 기존 `/tracks/[slug]/shortcuts`의 관리자 편집,
  공개·초안·미디어 업로드·백업 기능은 그대로 사용합니다. 각 목록의 검색·필터·공유 URL도 유지합니다.
- 메카닉과 기본 전략의 설명은 `data/knowledge.ts`에서 `description`과
  `sections: [{ title, text }]`에 입력합니다. 기존 홈 소개 문구만 옮겼으며 상세 설명이 없는 항목은 작성 예정으로 표시합니다.
  트랙에만 등록된 추가 메카닉은 이름을 목록에 자동 연결합니다. 상세 설명을 추가하려면 같은 이름의 항목을 이 파일에 등록하세요.
- 트랙별 전략은 기존 `data/tracks.ts` 가이드의 `strategies` 배열을 사용합니다.
  새 트랙의 전략·메카닉 연결은 `data/track-content.ts`에서 해당 트랙의 선택 필드 `strategies`, `mechanics`에 입력할 수 있습니다.
  메카닉·전략의 웹 편집 기능은 이번 페이지 구성에 포함되지 않습니다.
- 기존 `/tracks?view=...` 링크도 유지합니다. 새 카테고리 목록은 미작성 트랙을 기본 표시하며
  공략 작성 여부로 걸러볼 수 있습니다. SNES 페이지도 개별 숏컷·전략 링크를 갖습니다.

### 관리자 콘텐츠 현황 (Step 6)

- `/admin/content`에서 등록된 Google 관리자 계정으로 로그인해 40개 트랙의 공개 숏컷 개수,
  작성 여부, 마지막 수정일(한국 시간), 영상·단계 이미지 등록 비율과 보완 항목을 확인합니다.
  숏컷 편집 화면에도 관리자 로그인 후 현황 링크가 표시됩니다.
- 검색과 작성 상태 필터로 다음에 작성하거나 보완할 트랙을 찾고 ‘편집 화면’으로 이동합니다.
  공개 저장본만 작성 완료로 계산하며, 저장 전 기존 가이드는 별도로 표시하고 공개 개수에는 포함합니다.
  브라우저 초안은 집계하지 않습니다. 미디어 미등록은 보완 대상으로 표시하지만 공개 필수 조건은 아닙니다.
- 공개 개수 0개는 기본적으로 ‘아직 조사하지 않음’입니다. 조사 후 ‘숏컷 없음 확인’을 눌러
  명시적으로 상태를 저장하며 ‘미조사로 변경’으로 되돌릴 수 있습니다. 빈 목록 삭제만으로 조사 완료를 추정하지 않습니다.
- 공개 저장 시 서버가 `updatedAt`을 기록합니다. 과거 저장본은 ‘기록 없음’이며 시각을 추정하지 않습니다.
  기존 version 1 백업은 계속 호환되며 `researchStatus`는 선택 필드입니다.
- ‘전체 설명 JSON 백업’은 40개 트랙의 공개 숏컷 설명, 미디어 주소, 조사 상태와 수정일을
  내보냅니다. `tracks[].content`는 기존 트랙별 가져오기 형식이며 저장본 유무는 `saved`로 구분합니다.
  미디어 원본과 브라우저 초안은 포함하지 않습니다. 전체 파일의 복원은 아래 Step 8 CLI를 사용합니다.
- 읽기 실패한 트랙은 ‘읽기 실패’로 표시하고 합계에서 제외합니다. 한 트랙이라도 읽지 못하면
  불완전한 전체 백업을 내보내지 않습니다. 현황·백업 API는 서버에서 관리자 권한을 확인합니다.

### 공유·검색 노출 (Step 7)

- Production: https://mario-kart-wiki.vercel.app (Vercel 프로젝트: `ohij/mario-kart-wiki`).
  공개 접속, 대표 주소·공유 메타데이터, 사이트맵·robots, PNG 공유 이미지 응답을 확인했습니다.
  로컬 `.shortcut-data/`는 배포하지 않습니다. 공개 사이트에서 저장·업로드하려면
  Vercel Blob을 연결해야 하며 로컬 설명·미디어 이전은 별도 작업입니다.

- 사이트 기본 제목·소개와 한국어 `lang="ko"`, `og:locale=ko_KR`를 설정합니다.
  UI·공략의 기본 작성 언어는 한국어이며 기존 영문 트랙명과 기술명은 유지합니다.
  한글 트랙명은 등록된 `nameKo`만 영문명과 함께 사용하며 임의 번역하지 않습니다.
  언어별 별도 페이지가 없으므로 `hreflang`으로 영어 번역 페이지를 선언하지 않습니다.
- 공개 페이지별 제목·설명·canonical·Open Graph·Twitter 카드를 설정합니다.
  트랙 공유 이미지는 기존 코스 선택 이미지를 출처·권리 표기와 함께 재사용하며,
  그 외 페이지는 `/share-image`의 1200×630 PNG 제목 카드를 사용합니다.
- `SITE_URL`에 실제 대표 origin(예: `https://your-domain.com`)을 **빌드 전** 설정합니다.
  경로·쿼리·인증 정보는 넣지 않습니다. Vercel에서는 미설정 시
  `VERCEL_PROJECT_PRODUCTION_URL`을 사용하며 임시 배포 주소인 `VERCEL_URL`은 사용하지 않습니다.
  대표 주소를 바꾸면 환경 변수 변경 후 다시 빌드·배포하세요.
- `/sitemap.xml`은 모든 공개 페이지와 40개 트랙의 정보·숏컷·전략 페이지를 포함합니다.
  관리자·API·검색 쿼리 URL은 제외하고 근거 없는 마지막 수정일은 생성하지 않습니다.
  검색 필터 URL의 canonical은 해당 기본 목록 URL입니다.
- `/robots.txt`는 production 대표 주소가 설정되면 공개 페이지를 허용하고 관리자·API를 제외합니다.
  로컬·Preview·대표 주소 미설정 상태는 검색 수집을 차단하고 사이트맵을 비웁니다.
  관리자 페이지는 항상 `noindex`이며 robots 설정은 API 인증을 대신하지 않습니다.
- 공개 숏컷은 서버에서 저장본을 읽어 내려주며 제목·준비 조건·요약·단계 설명·미디어가
  초기 HTML에 포함됩니다. 기존 SSR 읽기 구조를 유지하고 JavaScript 없이도 빈 목록을 안내합니다.
  브라우저 초안은 HTML·메타데이터·사이트맵에 포함하지 않습니다.
  공유 설명은 트랙 소개 기반으로 생성하므로 저장소 오류가 메타데이터 생성을 막지 않습니다.

### 검증 명령

- `npm test`: 초기 가이드 유지, 삭제, 요약·난이도, 기존 백업 호환성, 초안 복구·탭 충돌·공개 검증 검사.
- `npm run build` 후 `npm run test:integration`: 임시 로컬 저장 폴더와 별도 production 서버에서
  인증·저장·수정·삭제, 홈 집계, 검색, 상세 페이지와 직접 이동 링크를 검사합니다.
  기존 `.shortcut-data/`는 사용하지 않습니다. 실제 Blob 연결과 브라우저 조작은 별도 확인이 필요합니다.

### 배포·백업·회귀 검증 (Step 8)

각 단계 완료와 배포 전에 `npm run verify`를 실행합니다. lint → Next route 타입 생성 및
`tsc --noEmit` → 단위 테스트 → production build → HTTP 통합 테스트 순서입니다.
개별 실행은 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
`npm run test:integration`을 사용합니다. Google 토큰 검증에는 `jose`를 사용합니다.

자동 검증 범위:

- Google 로그인 성공·미등록 계정 차단, RSA 서명·issuer·audience·nonce·state·PKCE·만료 검사,
  최초 계정 ID 확인 시 권한 미발급, HttpOnly/SameSite 쿠키, 로그아웃, 세션 secret/등록 계정 교체.
- 비로그인·만료 세션의 저장/업로드 차단, 외부 origin과 프로토콜이 다른 origin 차단.
- 실제 로컬 파일 저장·재조회, 동시 저장의 한 명만 성공 및 409 충돌, 기존 가이드·빈 목록·조사 상태 유지.
- Blob 전송을 모의한 저장·재조회·ETag 조건부 쓰기 및 충돌. **실제 Blob 서비스 검증과는 구분합니다.**
- 이미지 원본 업로드·재조회, 영상 MIME/Range(206)/잘못된 Range(416), 빈 파일·미지원 MIME,
  이미지 10MB/영상 100MB 초과 차단 및 실패한 업로드 임시 파일 정리.
- 전체 백업 내보내기 → 변경 → 사전 점검(쓰기 없음) → 복원 → 설명·조사 상태·미디어 재조회.
  기존 JSON 해석·검색·페이지·메타데이터 검증도 함께 실행합니다.

테스트 서버는 OS 임시 폴더에서 실행하고 테스트용 Google 키·계정 ID·로컬 저장소를 사용합니다.
Google HTTP 응답만 test process preload에서 모의하며 ID 토큰의 실제 RSA 서명 검증은 실행합니다.
Production 코드에는 테스트용 인증 우회나 Google 검증 서버 변경 환경 변수가 없습니다.
사용자 `.shortcut-data/`나 실제 Blob에 쓰지 않습니다. HTTP 영상 fixture는 Range 전송을
검사하는 바이트 데이터이며, 실제 코덱 재생을 확인한 영상은 아닙니다.

#### 백업과 복구

1. 관리자 현황의 ‘전체 설명 JSON 백업’을 다운로드합니다. 브라우저 초안은 트랙 편집 화면에서
   따로 내보냅니다. 로컬 서버를 멈춘 뒤 `.shortcut-data/` 전체(특히 `media/`)를 별도 위치로 복사합니다.
   일관된 백업이 필요하면 작업자들의 공개 저장을 중단하고 백업하세요.
2. 로컬 파일 복구는 서버를 멈추고 기존 폴더를 다른 위치에 보관한 뒤 백업 폴더를 복사하고 재시작합니다.
   Blob 백업 JSON은 주소만 포함하므로 원본 미디어도 별도로 보관합니다.
3. 트랙 하나는 기존 ‘백업 불러오기’ → 미리보기 → ‘저장·공개’로 복구합니다.
   전체 백업은 아래 CLI로 먼저 점검하고 실제 복원합니다. 복원 대상 사이트에 Google 로그인 후,
   브라우저 개발자 도구의 Application → Cookies에서 `mkw-admin` 값을 확인하고
   `mkw-admin=쿠키값` 한 줄을 로컬 `.env.admin-session` 파일에 저장합니다. 이 파일은 `.env*` 규칙으로
   Git/배포에서 제외되며 관리자 권한을 가진 민감한 파일입니다. 공유하지 말고 사용 후 삭제하세요.
   HttpOnly이므로 페이지 JavaScript에서는 쿠키를 읽을 수 없습니다. 세션 만료 시 다시 로그인합니다.

```powershell
npm run shortcuts:maintenance -- restore --backup ./backups/content.json --base http://localhost:3000
npm run shortcuts:maintenance -- restore --backup ./backups/content.json --base http://localhost:3000 --cookie-file ./.env.admin-session --recovery ./backups/before-restore.json --apply
```

복원은 전체 40개 트랙의 schema·중복·공개 조건·용량을 먼저 검사합니다. `saved=true` 트랙만
최신 revision으로 저장하므로 기존 가이드가 임의로 공개 저장되지 않습니다. `saved=false` 트랙에
현재 서버의 저장본이 있더라도 삭제하지 않습니다. 따라서 이는 저장된 콘텐츠의 복원이며
저장소 전체를 과거 상태로 되돌리는 작업은 아닙니다. 로컬 저장소 전체의 정확한 복구는 폴더 백업을 사용합니다.
로컬 미디어 주소는 localhost 서버에서 해당 원본을 재조회할 수 있을 때만 복원을 허용합니다.

`--apply`는 전달한 Google 관리자 세션을 검증하고 **현재 서버 전체 백업을 새 recovery 파일로 저장한 다음** 쓰기를 시작합니다.
입력/기존 백업 파일을 덮어쓰지 않으며, 변경 후 트랙별 재조회가 일치하는지도 검사합니다.
다른 탭의 변경은 If-Match/409로 차단합니다. 여러 트랙의 복원은 원자적이지 않으므로 오류 시 즉시 중단하고
완료한 slug와 복구 백업 위치를 출력합니다. 원인을 해결한 뒤 재점검하세요. 저장 시각은 복원한 시각으로 갱신됩니다.

#### 로컬 미디어 → 배포 Blob 이전

1. 공개 저장을 잠시 중단하고 전체 JSON, 원본 `.shortcut-data/media/`, 브라우저 초안을 백업합니다.
2. 대상 public Blob 저장소의 `BLOB_READ_WRITE_TOKEN`을 CLI 환경 변수에 설정합니다.
3. 아래 사전 점검으로 누락 파일·경로·0 byte·용량을 검사한 뒤 `--apply`로 미디어를 올립니다.

```powershell
npm run shortcuts:maintenance -- migrate --backup ./backups/content.json --media ./.shortcut-data/media --out ./backups/blob-content.json
npm run shortcuts:maintenance -- migrate --backup ./backups/content.json --media ./.shortcut-data/media --out ./backups/blob-content.json --apply
```

동일 로컬 주소는 한 번만 업로드하고 HTTPS 주소로 바꾼 새 JSON을 만듭니다. 미디어 재조회도 검사합니다.
원본 파일·입력 백업·공개 설명은 변경하지 않습니다. 출력 파일은 새 경로여야 합니다. 실패하면
`migrationIncomplete: true`와 성공한 주소를 출력 파일에 남기며 이 파일은 복원용으로 거부됩니다.
실패 후 이미 업로드된 파일은 자동 삭제하지 않습니다. 기록을 보관하고 확인하세요.

4. 대상 배포에 Google OAuth 설정·`GOOGLE_ADMIN_SUB`·`ADMIN_SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN`, `SITE_URL`을
   설정하고 빌드·배포합니다. Vercel에서는 `SHORTCUT_STORAGE=local`을 사용하지 않습니다.
   `.shortcut-data/`와 `.env.local`은 배포/버전 관리에서 제외합니다.
5. `restore --backup ./backups/blob-content.json --base https://실제-도메인`으로 사전 점검하고,
   대상 사이트 Google 로그인 후 `--cookie-file`, 새 `--recovery` 경로와 `--apply`를 붙여 설명을 복원합니다.
6. 배포 화면에서 설명·이미지·영상과 관리자 로그아웃 후 읽기를 확인합니다. 확인 완료까지 원본을 보관합니다.
   코드 배포 롤백과 Blob 콘텐츠 복원은 별도 작업입니다.

#### 브라우저·배포 완료 조건과 이번 검증 기록

2026-09-29 로컬 production 검증에서 Google 인증 단위 테스트를 포함한 HTTP 통합 테스트,
lint·typecheck·build가 통과했습니다. 격리된 실제 브라우저에서 Enter로 로그인·오류 항목 이동,
빈 공개 저장의 오류 안내, 모바일 390×844 편집 화면의 가로 넘침 없음,
두 탭의 초안 경고와 공개 revision 충돌·초안 보존을 확인했습니다.
초안 충돌 시 잠긴 편집 도구 밖에서도 ‘현재 편집 내용 백업’을 사용할 수 있습니다.

배포 환경이 준비된 뒤 다음 항목을 완료해야 배포 검증 완료로 판단합니다.

- 별도 Preview/test Blob에서 이미지·실제 MP4/WebM 업로드 → 공개 저장 → 새 탭 재조회,
  영상 재생/탐색, 10MB/100MB 초과 파일 차단, ETag 충돌과 백업 복원 확인.
- HTTPS 로그인 쿠키의 Secure, 로그아웃·8시간 만료 후 저장/업로드 차단 확인.
  세션은 서명된 쿠키 방식으로, 로그아웃은 현재 브라우저 쿠키를 지웁니다. 이미 복사된 쿠키의
  서버측 폐기는 제공하지 않으며 세션 secret 또는 등록 Google 계정 변경 시 기존 세션이 무효화됩니다.
- 휴대폰 Safari/Chrome 및 360/390px 화면에서 탐색·로그인·편집·표 스크롤·미디어 재생 확인.
  키보드 Tab/Shift+Tab/Enter로 접근하고 포커스·입력 label·오류 안내를 확인.
- 전체 설명 백업과 미디어 원본을 복구 대상에 준비하고 복원 후 공개 화면을 재조회.
  Preview 검증 후 production에 같은 환경 변수를 설정해 배포하고 주요 공개 페이지를 확인.

이번 작업에서 실제 배포 변경·실제 Blob 쓰기·로컬 원본 이전은 실행하지 않았습니다.
현재 로컬 설정에는 Blob 토큰이 없으므로 외부 저장소 검증과 실기기 코덱 재생은 미확인입니다.
