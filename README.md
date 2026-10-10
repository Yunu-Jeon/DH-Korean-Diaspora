# 한 뿌리, 다른 흙

**One Root, Other Soils: An Archive of Korean Diaspora Everyday Culture and Vocabulary**

한인 디아스포라 생활문화·어휘 아카이브. 고려인·재일조선인·하와이 한인의 생활문화를 네 측면(먹는 것·부르는 것·일하는 것·배우는 것)과 그것을 부르던 말로 보여 줍니다. 첫 화면의 흐름이 곧 전시입니다.

빌드 없이 동작하는 정적 사이트입니다. 모든 경로는 상대 경로입니다.

## 폴더 구조

| 경로 | 내용 | GitHub |
| --- | --- | --- |
| `index.html` 등 5개 | 홈(전시)·컬렉션·소개·개별 자원·검색 페이지 | 올림 |
| `assets/` | CSS, JavaScript(아이콘·챗봇 창 포함), 파비콘 SVG | 올림 |
| `site-data/archive.js` | 사이트가 읽는 데이터(아래 스크립트로 생성) | 올림 |
| `ap/application-profile.md` | 응용 프로파일(데이터 설계) | 올림 |
| `scripts/` | 데이터 검사·내보내기 스크립트 | 올림 |
| `data/` | 검수용 원본 데이터(클래스별 JSON) | **올리지 않음** |
| `uploads/` | 원문 PDF | **올리지 않음** |
| `image/` | 디자인 참고 이미지 | **올리지 않음** |

## 데이터를 고친 뒤 사이트에 반영하기

AP 카디널리티·참조를 검사하고 `dia:citation`을 채웁니다.

```bash
py scripts/check_data.py
```

`data/`를 `site-data/archive.js`로 내보냅니다.

```bash
py scripts/export_site_data.py
```

macOS/Linux에서는 `py` 대신 `python3`를 씁니다.

## 로컬에서 실행

데이터를 `<script>`로 읽기 때문에 `index.html`을 더블클릭해도 열립니다. 실제 배포 환경과 같게 보려면 저장소 폴더에서 로컬 서버를 띄웁니다.

```bash
py -m http.server 8000
```

브라우저에서 <http://localhost:8000> 을 엽니다.

## GitHub Pages 배포

1. 변경 사항을 `main` 브랜치에 커밋하고 푸시합니다.
2. GitHub 저장소 → **Settings → Pages**로 갑니다.
3. **Build and deployment → Source**를 `Deploy from a branch`로, **Branch**를 `main` / `/ (root)`로 고르고 저장합니다.
4. 1~2분 뒤 `https://yunu-jeon.github.io/DH-Korean-Diaspora/` 에서 열립니다.

`.nojekyll` 파일이 있어 Jekyll 처리 없이 그대로 배포됩니다.

## 외부 라이브러리·서비스

- 지도: [Leaflet](https://leafletjs.com/) 1.9.4 (unpkg CDN), 타일 © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- 글꼴: Noto Sans KR, Noto Serif KR (Google Fonts)
