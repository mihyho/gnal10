# 사진전시 온라인 도록

순수 HTML/CSS/JS(빌드 도구 없음) 기반 온라인 도록. GitHub Pages에 정적 파일 그대로 배포합니다.

## 구조

```
index.html          모든 섹션(포스터/서문/챕터1~4)을 담은 단일 페이지, 하단 챕터 내비게이션
css/
  style.css          디자인 토큰, 반응형 레이아웃, 라이트박스/드로잉 패드 스타일
js/
  data.js            전시 정보 / 서문 / 챕터 서문 / 챕터1~3 캡션 / 사진 파일 매니페스트 / 챕터4 손글씨 캡션 매니페스트
  gallery.js         data.js → DOM 렌더링 (포스터, 서문, 챕터별 사진 그리드)
  lightbox.js         챕터 1~3: 확대 → 플립 캡션 인터랙션
  chapter4.js         챕터 4: 확대 → 플립되며 관람객 손글씨 캡션(정적 이미지) 표시
  main.js             엔트리포인트 (모듈 조립, 하단 내비 활성 상태)
photo/               실제 사진 파일
  ch4-captions/      챕터 4 손글씨 캡션 PNG (전시 종료 후 Firestore에서 내보낸 정적 파일)
```

빌드 스텝이 없으므로 `index.html`을 그대로 웹서버 루트에 올리면 동작합니다.

## 사진 넣는 법

사진은 `photo/` 폴더에 `ch1_이름_1.jpeg`처럼 **챕터_촬영자이름_순번** 형식 파일명으로 넣을 예정이라고 하셨는데,
파일명에 촬영자 이름이 섞여 있어 코드가 자동으로 유추할 수 없습니다. 대신 `js/data.js`의 `PHOTO_FILES`에
챕터별로 실제 파일명을 순서대로 채워 넣으면 됩니다.

```js
// js/data.js
export const PHOTO_FILES = {
  1: ['ch1_김민준_1.jpeg', 'ch1_김민준_2.jpeg', null, null, ...], // 10개
  2: [...], // 10개
  3: [...], // 10개
  4: [...], // 30개
};
```

- 배열의 **순서 = 도록에 표시되는 사진 순서**입니다.
- 아직 채우지 않은 자리(`null`)는 줄무늬 자리표시자 박스("PHOTO 01" 라벨)로 표시됩니다.
- 파일을 찾지 못하면 브라우저 콘솔에 경고가 뜨니, 배포 전에 콘솔을 한 번 확인하세요.
- 포스터 이미지는 `EXHIBIT_INFO.posterFile`에 파일명을 넣으면 됩니다.

**가로 사진 혼합 대응**: 그리드 썸네일과 라이트박스 모두 프레임 비율(4:5)은 고정하고 이미지는
`object-fit: contain`으로 표시합니다. 가로 사진은 위아래에 여백(레터박스)이 생기지만 잘리지 않고,
그리드도 깨지지 않습니다.

## 캡션 넣는 법 (챕터 1~3)

`photo/` 폴더에 넣어주실 `전체캡션.pdf`를 열어서, 각 챕터·사진 순서에 맞는 캡션 텍스트를
`js/data.js`의 `CHAPTER_CAPTIONS`에 순서대로 옮겨 적으면 됩니다.

```js
function makeCaptions(chapter, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${chapter}-${i + 1}`,
    caption: `사진 ${i + 1} 캡션 텍스트가 이 자리에 들어갑니다.`, // ← 이 문자열을 실제 캡션으로 교체
  }));
}
```

챕터 4는 텍스트 캡션이 없고, 전시 기간 중 관람객이 화면에 직접 그린 손글씨가 캡션 역할을 합니다.
전시가 끝난 뒤 실시간 입력은 껐고, 그동안 쌓인 손글씨를 `photo/ch4-captions/{photoId}.png`로
내보내 고정했습니다. 사진마다 남겨진 캡션 유무는 `js/data.js`의 `CHAPTER4_CAPTION_FILES`에서
관리합니다 (손글씨가 없는 사진은 `null`).

## 로컬에서 확인하기

ES 모듈(`type="module"`)을 쓰기 때문에 `index.html`을 파일로 그냥 더블클릭하면 브라우저 CORS 정책에
막혀 동작하지 않습니다. 간단한 로컬 서버로 열어주세요.

```bash
npx serve .
# 또는
python -m http.server 8000
```

## 챕터 4 손글씨 캡션 (아카이브됨)

전시 기간 중에는 Firebase(Firestore)의 `ch4-captions` 컬렉션에 관람객이 남긴 손글씨를 실시간으로
모아 모든 방문자에게 공유했습니다. 전시가 끝난 뒤 그 컬렉션 전체를 PNG로 내보내
`photo/ch4-captions/`에 커밋했고, 사이트는 더 이상 Firebase SDK나 DB를 사용하지 않습니다
(완전히 정적 사이트). 데이터 흐름은 아래와 같았습니다.

1. 관람객이 캔버스에 그린 손글씨를 `canvas.toDataURL('image/png')`로 만들어 Firestore
   `ch4-captions/{photoId}` 문서에 저장 (당시 보안 규칙은 git 히스토리의 `firestore.rules` 참고).
2. 전시 종료 후, Firestore REST API(`GET /v1/projects/{projectId}/databases/(default)/documents/ch4-captions`,
   공개 read 규칙 덕분에 인증 없이 조회 가능)로 컬렉션을 통째로 내보내 각 문서의 base64
   `imageData`를 디코딩해 `photo/ch4-captions/{photoId}.png`로 저장.
3. `js/chapter4.js`에서 Firebase/localStorage 연동 코드를 제거하고, `js/data.js`의
   `CHAPTER4_CAPTION_FILES` 매니페스트를 정적으로 읽어 라이트박스 뒷면에 표시하도록 변경.

## GitHub Pages 배포

빌드 스텝이 없으므로 GitHub Actions 없이 저장소 설정만으로 배포됩니다.

1. 이 폴더를 그대로 GitHub 저장소에 push합니다 (`index.html`이 저장소 루트에 있어야 함).
2. 저장소 Settings → Pages → Source를 **Deploy from a branch** 로, Branch를 `main` / `(root)` 로 설정합니다.
3. 몇 분 뒤 `https://<user>.github.io/<repo>/` 에서 확인할 수 있습니다.

모든 리소스 경로가 상대경로(`css/`, `js/`, `photo/`)라서 user page든 project page든 별도 설정 없이 그대로
동작합니다.

## 상태

전시(2026.08.07–09)가 종료되었고, 사진/캡션/포스터가 모두 채워진 완전한 정적 사이트입니다.
빌드 스텝도, 외부 서비스 연동(Firebase 등)도 없습니다.
