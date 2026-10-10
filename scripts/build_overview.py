# 아카이브의 전체 정보(범위·구조·건수·문화권별 내용·확인 필요·이용 조건 등)를 마크다운 문서 하나로 만드는 스크립트
import json  # JSON 파일을 읽기 위한 모듈
import sys  # 콘솔 출력 인코딩을 맞추기 위한 모듈
from collections import Counter  # 건수를 세기 위한 자료구조
from datetime import date  # 만든 날짜를 적기 위한 모듈
from itertools import combinations  # 어휘를 두 개씩 짝지을 때 쓰는 함수
from pathlib import Path  # 경로를 다루기 위한 모듈

sys.stdout.reconfigure(encoding="utf-8")  # 윈도 콘솔에서도 한글이 깨지지 않게 함
ROOT = Path(__file__).resolve().parent.parent  # 저장소 루트
DATA = ROOT / "data"  # 원본 데이터 폴더
OUT = ROOT / "review" / "아카이브_전체정보.md"  # 결과 문서(공개하지 않음)
ASPECTS = ["먹는 것", "부르는 것", "일하는 것", "배우는 것"]  # 측면 값(순서)
LABEL = {"먹는 것": "식(食) — 먹는 것", "부르는 것": "호(呼) — 부르는 것", "일하는 것": "사(事) — 일하는 것", "배우는 것": "학(學) — 배우는 것"}  # 측면 표시 이름

def load(name):  # data 폴더의 JSON 하나를 읽는 함수
    return json.loads((DATA / name).read_text(encoding="utf-8"))  # UTF-8로 읽음


def as_list(v):  # 값을 항상 배열로 다루는 함수
    return v if isinstance(v, list) else [v]  # 배열이 아니면 감쌈


def groups_of(r):  # 자원의 문화권 ID 목록
    return [v["ref"] for v in as_list(r.get("dcterms:spatial", [])) if str(v.get("ref", "")).startswith("group:")]  # spatial 중 문화권만


def name(r):  # 자원 이름
    for k in ("skosxl:literalForm", "skos:prefLabel", "dcterms:title"):  # 이름 속성 후보
        if isinstance(r.get(k), dict) and r[k].get("value"):  # 값이 있으면
            return r[k]["value"]  # 그 값
    return r["id"]  # 없으면 ID


def pending_notes(r):  # 자원 안의 '확인 필요' 메모들
    out = [r.get("note", "")] if r.get("status") == "확인 필요" else []  # 자원 전체가 확인 필요면 그 메모
    for prop, val in r.items():  # 속성마다
        for v in as_list(val):  # 값마다
            if isinstance(v, dict) and v.get("status") == "확인 필요":  # 확인 필요 값이면
                out.append(f"{prop}: {v.get('note', '')}")  # 메모 추가
    return out  # 결과


groups = load("groups.json")  # 문화권
scenes = load("scenes.json")  # 생활 장면
labels = load("labels.json")  # 어휘
concepts = {c["id"]: c for c in load("concepts.json")}  # 생활 대상
places = {p["id"]: p for p in load("places.json")}  # 장소
materials = load("materials.json")  # 자료
refs = load("references.json")  # 출처
display = load("display_text.json")  # 화면 문안
notes = load("curator_notes.json")["notes"]  # 큐레이터 해설
others = load("others.json")["items"]  # 네 측면 밖
cands = load("materials_candidates.json")["items"]  # 1차 자료 후보
gname = {g["id"]: g["dcterms:title"]["value"] for g in groups}  # 문화권 ID → 이름
L = []  # 문서 줄 목록
w = L.append  # 줄 추가 함수 줄임

w("# 한 뿌리, 다른 땅 — 아카이브 전체 정보")  # 제목
w("")  # 빈 줄
w(f"> 내부 문서입니다. `py scripts/build_overview.py`로 data/에서 다시 만듭니다. 만든 날: {date.today().isoformat()}")  # 안내
w("")  # 빈 줄
w("## 1. 개요")  # 절 제목
w("")  # 빈 줄
w("- **제목:** 한 뿌리, 다른 땅: 한인 디아스포라 생활문화·어휘 아카이브 / One Root, Other Soils: An Archive of Korean Diaspora")  # 제목
w(f"- **홈 문구:** {display['home']['headline']}: {display['home']['subline']}")  # 홈 문구
w("- **범위:** 고려인·재일조선인·하와이 한인 × 식(食)·호(呼)·사(事)·학(學)")  # 범위
w("- **저장소:** https://github.com/Yunu-Jeon/DH-Korean-Diaspora (GitHub Pages는 아직 켜지 않음)")  # 저장소
w("")  # 빈 줄
w("## 2. 사이트 구조")  # 절 제목
w("")  # 빈 줄
w("| 화면 | 주소 | 내용 |")  # 표 머리
w("| --- | --- | --- |")  # 표 구분
w("| 홈 | `index.html` | 제목, 소개·기획 의도, 큰 지도(휠 확대·축소, 전체 범위 버튼, 마커 프리뷰 → 문화권 페이지), 참고문헌 |")  # 홈
w("| 문화권 페이지 | `archive.html?culture=koryo` 등 | 지도에서 고르면 바로 전시 서사: 식→호→일→학 네 장의 큐레이터 해설·장면 카드(관련 어휘)·이 측면의 어휘 |")  # 문화권
w("| 검색 | `search.html?q=…` | 어휘·생활 대상·장면을 이표기까지 찾기, 종류·문화권 패싯, 0건이면 비슷한 표기 제안 |")  # 검색
w("| 개별 자원 | `item.html?id=…` | 설명 → 관련 자원 → 자료 정보와 출처(접힘) → 전체 메타데이터(AP 순서, 접힘) |")  # 자원
w("| 예전 주소 | `about.html`, `exhibition.html` | 홈의 소개 / 문화권 페이지로 자동 이동 |")  # 예전 주소
w("")  # 빈 줄
w("상단: 로고·제목(홈으로)과 긴 검색창. 문화권 페이지 위쪽에 ‘전체 지도 보기’ 버튼. 오른쪽 아래 ‘아카이브 챗봇’(준비 중, 입력 비활성).")  # 메뉴
w("")  # 빈 줄
w("## 3. 데이터 구조(AP 요약)")  # 절 제목
w("")  # 빈 줄
w("| 클래스 | 표준 클래스 | 건수 |")  # 표 머리
w("| --- | --- | --- |")  # 표 구분
for k, std, n in [("자료", "dctype:Text / StillImage / MovingImage", len(materials)), ("생활 장면", "dia:Scene", len(scenes)), ("생활 대상", "skos:Concept", len(concepts)), ("어휘", "skosxl:Label", len(labels)), ("장소", "dcterms:Location", len(places)), ("문화권", "foaf:Group", len(groups)), ("출처", "bibo:AcademicArticle / Thesis / Document", len(refs))]:  # 클래스마다
    w(f"| {k} | `{std}` | {n} |")  # 한 줄
w("")  # 빈 줄
w("- 모든 값에 근거 출처와 쪽수(`cite`)를 붙이고, 문헌이 보고한 사실(`보고`)과 해석(`해석`)을 구분했습니다.")  # 기록 규칙
w("- 장면과 어휘의 연결은 AP 참조(어휘 → `dia:denotes` → 생활 대상 ← `dcterms:subject` ← 장면)만 따릅니다.")  # 연결 규칙
w("- 화면용 제목·요약은 `data/display_text.json`, 큐레이터 해설은 `data/curator_notes.json`에 따로 둡니다. 문장별 근거는 `review/전시문안_근거대조표.md`에 있습니다.")  # 문안 파일
w("")  # 빈 줄
w("### 측면 × 문화권 (생활 장면 수)")  # 소제목
w("")  # 빈 줄
cells = Counter((s["dia:aspect"]["value"], g) for s in scenes for g in groups_of(s))  # 칸별 장면 수
w("| 측면 | " + " | ".join(gname[g["id"]] for g in groups) + " |")  # 표 머리
w("| --- | " + " | ".join("---" for _ in groups) + " |")  # 표 구분
for a in ASPECTS:  # 측면마다
    w(f"| {LABEL[a]} | " + " | ".join(str(cells[(a, g['id'])]) for g in groups) + " |")  # 한 줄
w("")  # 빈 줄
w("### 같은 생활 대상을 문화권마다 다르게 부르는 어휘")  # 소제목
w("")  # 빈 줄
by_c = {}  # 생활 대상 → [(문화권, 표기)]
for l in labels:  # 어휘마다
    den = (l.get("dia:denotes") or {}).get("ref")  # 가리키는 대상
    if den:  # 있으면
        for g in groups_of(l):  # 문화권마다
            by_c.setdefault(den, []).append((g, l["skosxl:literalForm"]["value"]))  # 추가
pairs = [(c, a, b) for c, items in by_c.items() for a, b in combinations(items, 2) if a[0] != b[0] and a[1] != b[1]]  # 문화권과 표기가 다른 쌍
w(f"모두 {len(pairs)}쌍입니다.")  # 쌍 수
w("")  # 빈 줄
for c, a, b in pairs:  # 쌍마다
    w(f"- {name(concepts[c])}: {a[1]}({gname[a[0]]}) ↔ {b[1]}({gname[b[0]]})")  # 한 줄
w("")  # 빈 줄

w("## 4. 문화권별 내용")  # 절 제목
for g in groups:  # 문화권마다
    gid = g["id"]  # 문화권 ID
    w("")  # 빈 줄
    w(f"### {gname[gid]}")  # 소제목
    w("")  # 빈 줄
    for s in display["groups"].get(gid, []):  # 화면용 소개
        w(s["text"])  # 문장
    w("")  # 빈 줄
    for a in ASPECTS:  # 측면마다
        sc = [s for s in scenes if s["dia:aspect"]["value"] == a and gid in groups_of(s)]  # 이 칸의 장면
        w(f"#### {LABEL[a]} — 장면 {len(sc)}")  # 소소제목
        w("")  # 빈 줄
        note = next((n for n in notes if n["group"] == gid and n["aspect"] == a), None)  # 큐레이터 해설
        if note:  # 있으면
            w(f"> 큐레이터 해설: {note['text']}")  # 인용 블록
            w("")  # 빈 줄
        if not sc:  # 장면이 없으면
            w("- 아직 자료를 찾지 못했습니다.")  # 빈 칸
        for s in sc:  # 장면마다
            d = display["scenes"].get(s["id"], {})  # 화면 문안
            flag = " *(문학 속 재현)*" if s.get("representation") else ""  # 재현 표시
            words = [name(l) for l in labels if (l.get("dia:denotes") or {}).get("ref") in {v.get("ref") for v in as_list(s.get("dcterms:subject", []))} and gid in groups_of(l)]  # 연결된 어휘
            w(f"- **{d.get('title', name(s))}**{flag} — " + " ".join(x["text"] for x in d.get("summary", [])) + (f" 〔관련 어휘: {', '.join(words)}〕" if words else ""))  # 한 줄
        w("")  # 빈 줄
    gl = [l for l in labels if gid in groups_of(l)]  # 이 문화권 어휘
    w(f"#### 어휘 {len(gl)}")  # 소소제목
    w("")  # 빈 줄
    w("| 표기 | 이표기 | 뜻 | 가리키는 생활 대상 |")  # 표 머리
    w("| --- | --- | --- | --- |")  # 표 구분
    for l in gl:  # 어휘마다
        den = (l.get("dia:denotes") or {}).get("ref")  # 대상
        w(f"| {name(l)} | {', '.join(v['value'] for v in as_list(l.get('dia:variantForm', [])) if v.get('value'))} | {l['dia:gloss']['value']} | {name(concepts[den]) if den else '없음(측면 미지정)'} |")  # 한 줄
    w("")  # 빈 줄
    w("#### 장소")  # 소소제목
    w("")  # 빈 줄
    w(", ".join(name(places[v["ref"]]) for v in as_list(g["dcterms:spatial"])) + " (좌표는 문헌 외 근사값)")  # 장소 목록
    w("")  # 빈 줄

w("## 5. 참고문헌")  # 절 제목
w("")  # 빈 줄
for r in refs:  # 출처마다
    who = ", ".join(v["value"] for v in as_list(r["dcterms:creator"]))  # 저자
    yr = r.get("dcterms:date", {}).get("value", "연도 미상")  # 연도
    part = f" 『{r['dcterms:isPartOf']['value'].strip('『』')}』" if r.get("dcterms:isPartOf", {}).get("value") else ""  # 수록지
    tag = " **(학술 근거 아님)**" if r.get("scholarly") is False else (" *(내용 미추출)*" if r.get("status") == "확인 필요" else "")  # 표시
    w(f"- `{r['id']}` {who} ({yr}). 「{r['dcterms:title']['value']}」{part}.{tag}")  # 한 줄
w("")  # 빈 줄

w("## 6. 아직 확인하지 못한 것")  # 절 제목
w("")  # 빈 줄
for coll in (scenes, labels, list(concepts.values()), materials, groups, refs):  # 클래스마다
    for r in coll:  # 자원마다
        for n in pending_notes(r):  # 확인 필요 메모마다
            w(f"- {name(r)} (`{r['id']}`) — {n}")  # 한 줄
w(f"- 장소 {sum(1 for p in places.values() if p.get('coords', {}).get('basis') == '문헌 외')}곳의 좌표는 문헌에 없는 근사값입니다.")  # 좌표
w("- 데이터 전체의 학술 검수는 아직 끝나지 않았습니다. 화면 문장과 원문의 재대조도 미실시입니다.")  # 검수 상태
w("")  # 빈 줄

w("## 7. 네 측면 밖에 남겨 둔 것")  # 절 제목
w("")  # 빈 줄
for o in others:  # 항목마다
    w(f"- {o['what']} — {o['kind']}, {gname[o['group']]} (근거: {', '.join(o['cite'])})")  # 한 줄
w("")  # 빈 줄

w("## 8. 1차 자료 후보")  # 절 제목
w("")  # 빈 줄
w(f"자료 클래스에 등록된 것 {len(materials)}건, 문헌 속에 인용된 후보 {len(cands)}건. 모두 이용 조건 미확인이라 사이트에 이미지를 싣지 않았습니다.")  # 요약
w("")  # 빈 줄
for c in cands:  # 후보마다
    w(f"- {c['title']} ({c['type']}, {c['date']}, {gname.get(c['group'], '')}) — 근거 {', '.join(c['cite'])}")  # 한 줄
w("")  # 빈 줄

w("## 9. 이용 조건과 작성 예정 원고")  # 절 제목
w("")  # 빈 줄
w("| 항목 | 상태 |")  # 표 머리
w("| --- | --- |")  # 표 구분
w("| 메타데이터 이용 조건 | 작성 예정 |")  # 메타데이터
w("| 요약문(장면 설명·뜻풀이·큐레이터 해설) 이용 조건 | 작성 예정. 원문을 옮기지 않고 바꿔 쓴 것이며 원 문헌의 저작권은 각 저자·발행처에 있음 |")  # 요약문
w("| 이미지 | 자료 사진은 싣지 않음(아이콘만 사용). nfm2003 사진은 저작권 확인 전 게재 금지 |")  # 이미지
w("| 제목의 뜻 | 작성 예정(사용자 원고) |")  # 제목의 뜻
w("| 호칭 설명 | 작성 예정(사용자 원고) |")  # 호칭
w("")  # 빈 줄

w("## 10. 갱신 방법")  # 절 제목
w("")  # 빈 줄
w("```bash")  # 코드 블록 시작
w("py scripts/check_data.py        # AP 카디널리티·참조 검사")  # 검사
w("py scripts/build_display.py     # 화면 문안 검사 + 근거대조표")  # 문안
w("py scripts/build_overview.py    # 이 문서")  # 이 문서
w("py scripts/export_site_data.py  # 공개용 site-data/archive.js")  # 내보내기
w("```")  # 코드 블록 끝

OUT.parent.mkdir(exist_ok=True)  # review 폴더 만들기
OUT.write_text("\n".join(L) + "\n", encoding="utf-8")  # 저장
print(f"{OUT.relative_to(ROOT)} 저장: {len(L)}줄")  # 결과
