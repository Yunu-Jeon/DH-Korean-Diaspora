# 한 뿌리, 다른 땅

**One Root, Other Soils: An Archive of Korean Diaspora**

한인 디아스포라 생활문화·어휘 아카이브. 고려인·재일조선인·하와이 한인의 생활문화를 네 측면 — 식(食) 먹는 것, 호(呼) 부르는 것, 일(事) 일하는 것, 학(學) 배우는 것 — 과 그것을 부르던 말로 모읍니다.

빌드 없이 동작하는 정적 사이트입니다. 모든 경로는 상대 경로라 GitHub Pages의 저장소 하위 경로(`/DH-Korean-Diaspora/`)에서도 그대로 열립니다.

## 화면과 이동 구조

| 화면 | 파일 | 주소 예시 |
| --- | --- | --- |
| 홈: 소개 아래 큰 지도, 마커 프리뷰 → 문화권 아카이브 | `index.html` | `index.html` |
| 문화권별 아카이브: 한 문화권의 모든 정보(네 측면의 장면·어휘, 측면 없는 말, 생활 대상, 장소, 자료) | `archive.html` | `archive.html?culture=koryo#eat` |
| 전시 서사: 큐레이터 해설과 장면·어휘를 네 장으로 이어 읽기 | `exhibition.html` | `exhibition.html?culture=hawaii#call` |
| 검색 결과(이표기 포함, 종류·문화권 패싯) | `search.html` | `search.html?q=Kim%20Chee` |
| 개별 자원: 설명 → 관련 자원 → 자료 정보와 출처 → 전체 메타데이터 | `item.html` | `item.html?id=label:kim-chee` |
| 소개: 소개·기획 의도·참고문헌 | `about.html` | `about.html` |

- 상단 메뉴는 홈 · 고려인 · 재일조선인 · 하와이 한인 · 소개이고, 헤더에 검색창이 있습니다. 전시 서사는 문화권 아카이브의 ‘전시 서사 읽기’로 들어갑니다.
- 문화권 아카이브와 전시 서사 위에는 문화권 전환 메뉴가 고정되어 있고(모바일은 드롭다운), 전환해도 고른 측면이 유지됩니다.
- 오른쪽 아래 ‘아카이브 챗봇’ 버튼은 준비 중 안내만 보여 주며 입력은 막혀 있습니다.

## 폴더 구조

| 경로 | 내용 | GitHub |
| --- | --- | --- |
| `*.html` 6개 | 위 화면들 | 올림 |
| `assets/` | CSS, JavaScript(아이콘·챗봇 창 포함), 파비콘 SVG | 올림 |
| `site-data/archive.js` | 사이트가 읽는 공개용 데이터(스크립트로 생성) | 올림 |
| `ap/application-profile.md` | 응용 프로파일(데이터 설계) | 올림 |
| `scripts/` | 데이터 검사·화면 문안 검사·공개 데이터 내보내기 | 올림 |
| `data/` | 검수용 원본 데이터(클래스별 JSON, 화면 문안 `display_text.json`, 큐레이터 해설) | **올리지 않음** |
| `review/` | 내부 문서: `아카이브_전체정보.md`(범위·구조·건수·문화권별 내용·확인 필요·이용 조건), `전시문안_근거대조표.md` | **올리지 않음** |
| `uploads/` | 원문 PDF | **올리지 않음** |
| `image/` | 디자인 참고 이미지 | **올리지 않음** |

## 데이터·화면 문안을 고친 뒤 반영하기

원본 데이터를 고쳤으면 AP 카디널리티와 참조를 검사합니다(`dia:citation`도 채웁니다).

```bash
py scripts/check_data.py
```

화면 문안(`data/display_text.json`)이나 큐레이터 해설(`data/curator_notes.json`)을 고쳤으면 문체·근거를 검사하고 근거대조표를 다시 만듭니다.

```bash
py scripts/build_display.py
```

전체 정보 문서(`review/아카이브_전체정보.md`)를 다시 만듭니다.

```bash
py scripts/build_overview.py
```

마지막으로 공개용 데이터를 내보냅니다.

```bash
py scripts/export_site_data.py
```

- `display_text.json`의 장면 요약은 문장마다 `from`에 원본 `dcterms:description`의 몇 번째 값을 바꿔 썼는지 적습니다. 근거대조표는 이 번호를 따라 출처와 쪽수를 자동으로 채웁니다.
- 장면과 어휘의 연결은 AP의 참조(어휘 → `dia:denotes` → 생활 대상 ← `dcterms:subject` ← 장면)만 따릅니다.
- macOS/Linux에서는 `py` 대신 `python3`를 씁니다.

## 로컬에서 실행

저장소 폴더에서 로컬 서버를 띄우고 <http://localhost:8000> 을 엽니다.

```bash
py -m http.server 8000
```

## GitHub Pages 배포

1. 변경 사항을 `main` 브랜치에 커밋하고 푸시합니다(`site-data/archive.js`도 함께).
2. GitHub 저장소 → **Settings → Pages**로 갑니다.
3. **Build and deployment → Source**를 `Deploy from a branch`로, **Branch**를 `main` / `/ (root)`로 고르고 저장합니다.
4. 1~2분 뒤 `https://yunu-jeon.github.io/DH-Korean-Diaspora/` 에서 열립니다.

`.nojekyll` 파일이 있어 Jekyll 처리 없이 그대로 배포됩니다.

## 외부 라이브러리·서비스

- 지도: [Leaflet](https://leafletjs.com/) 1.9.4 (unpkg CDN), 타일 © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- 글꼴: Noto Sans KR, Noto Serif KR (Google Fonts)
