# 화면용 문안(data/display_text.json)을 검사하고, 문장마다 근거를 추적하는 '전시문안_근거대조표.md'를 만드는 스크립트
import json  # JSON 파일을 읽기 위한 모듈
import re  # 문장 수를 세기 위한 정규식 모듈
import sys  # 종료 코드와 콘솔 인코딩 설정에 쓰는 모듈
from pathlib import Path  # 경로를 다루기 위한 모듈

sys.stdout.reconfigure(encoding="utf-8")  # 윈도 콘솔에서도 한글이 깨지지 않게 함
ROOT = Path(__file__).resolve().parent.parent  # 저장소 루트
DATA = ROOT / "data"  # 원본 데이터 폴더(공개하지 않음)
OUT = ROOT / "review" / "전시문안_근거대조표.md"  # 내부 검수 문서(공개하지 않음)
DIRECT_READ = {"kwon2020", "kwak2007", "yeon", "lee2017", "iwata2020", "jung2012", "kimgo2010", "lee2014", "lee2012", "nfm2003", "imin2010", "ency_koryomal", "nara2017"}  # 이번 작업에서 원문(PDF·웹)을 직접 읽어 데이터를 만든 출처


def load(name):  # data 폴더의 JSON 하나를 읽는 함수
    return json.loads((DATA / name).read_text(encoding="utf-8"))  # UTF-8로 읽어 돌려줌


def as_list(v):  # 값을 항상 배열로 다루는 함수
    return v if isinstance(v, list) else [v]  # 배열이 아니면 감쌈


refs = {r["id"]: r for r in load("references.json")}  # 출처 ID → 출처 자원
scenes = {s["id"]: s for s in load("scenes.json")}  # 장면 ID → 장면 자원
groups = {g["id"]: g for g in load("groups.json")}  # 문화권 ID → 문화권 자원
text = load("display_text.json")  # 화면용 문안
notes = load("curator_notes.json")["notes"]  # 큐레이터 해설
ASPECT_LABEL = {"먹는 것": "식(食)", "부르는 것": "호(呼)", "일하는 것": "사(事)", "배우는 것": "학(學)"}  # 측면 표시 레이블
problems = []  # 검사에서 찾은 문제
rows = []  # 대조표의 줄들


def bib(src):  # 출처 ID를 '저자(연도), 제목' 꼴로 바꾸는 함수
    r = refs.get(src)  # 출처 자원
    if not r:  # 없으면
        return src  # ID 그대로
    who = ", ".join(v["value"] for v in as_list(r["dcterms:creator"]))  # 저자
    year = r.get("dcterms:date", {}).get("value", "연도 미상")  # 연도
    return f"{src} — {who}({year}), 「{r['dcterms:title']['value']}」"  # 합친 문자열


def split_cites(cites):  # "출처ID:쪽" 목록을 출처별 쪽 목록으로 나누는 함수
    out = {}  # 출처 → 쪽 목록
    for c in cites:  # 근거마다
        src, _, page = c.partition(":")  # 출처와 쪽 나누기
        out.setdefault(src, [])  # 처음이면 빈 목록
        if page and page not in out[src]:  # 쪽이 있고 처음이면
            out[src].append(page)  # 추가
    return out  # 결과


def check_sentence(where, s):  # 화면 문장의 문체·길이를 검사하는 함수
    if "…" in s or "..." in s:  # 말줄임표가 있으면
        problems.append(f"{where}: 말줄임표가 있음")  # 문제로 기록
    endings = re.findall(r"[^.?!]+[.?!]", s)  # 문장 단위로 나눔
    for e in endings:  # 문장마다
        if not re.search(r"(니다|니까)[.?!]$", e.strip()):  # '-습니다'체로 끝나지 않으면
            problems.append(f"{where}: '-습니다'체가 아님 → {e.strip()[:30]}")  # 문제로 기록


def add_row(place, tid, sentence, cites, kind, extra=""):  # 대조표에 한 줄을 추가하는 함수
    by_src = split_cites(cites)  # 출처별 쪽
    src_txt = "<br>".join(bib(s) for s in by_src) or "없음"  # 출처 칸
    page_txt = "<br>".join(f"{s}: {', '.join(p) or '쪽 없음'}" for s, p in by_src.items()) or "없음"  # 쪽 칸
    direct = all(s in DIRECT_READ for s in by_src) and by_src  # 모든 출처를 직접 읽었는지
    check = ("이번 데이터 추출 때 원문을 읽고 기록한 값에서 바꿔 씀. 화면 문장과 원문의 재대조는 미실시" if direct else "기존 데이터의 근거 연결만 확인, 원문 대조 필요") + (f". {extra}" if extra else "")  # 확인 사항 칸
    if not cites:  # 근거가 하나도 없으면
        problems.append(f"{tid}: 근거가 없는 문장(공개 전 검토 필요)")  # 문제로 기록
    rows.append([place, tid, sentence, src_txt, page_txt, kind, check])  # 줄 추가


def kind_of(values, lit):  # 바꿔 쓴 원본 값들의 성격으로 문장 성격을 정하는 함수
    if lit:  # 문학 작품을 다룬 장면이면
        return "문학 속 재현"  # 재현으로 표시
    if any(v.get("basis") == "해석" for v in values):  # 해석이 섞였으면
        return "문헌 저자의 해석"  # 해석으로 표시
    return "문헌에서 확인한 사실"  # 그 밖에는 사실


# ----- 문화권 소개 -----
for gid, items in text["groups"].items():  # 문화권마다
    desc = as_list(groups[gid]["dcterms:description"])  # 원본 이동 개요
    for i, it in enumerate(items):  # 문장마다
        tid = f"G-{gid.split(':')[1]}-{i + 1}"  # 문안 ID
        src_vals = [desc[k] for k in it["from"] if k < len(desc)]  # 바꿔 쓴 원본 값
        if len(src_vals) != len(it["from"]):  # 없는 번호를 가리키면
            problems.append(f"{tid}: from 번호가 원본에 없음")  # 문제로 기록
        check_sentence(tid, it["text"])  # 문체 검사
        add_row(f"문화권 아카이브·전시 서사 머리 / {groups[gid]['dcterms:title']['value']}", tid, it["text"], sorted({c for v in src_vals for c in v.get("cite", [])}), kind_of(src_vals, False))  # 줄 추가

# ----- 장면 카드 -----
for sid, sc in scenes.items():  # 장면마다
    disp = text["scenes"].get(sid)  # 화면 문안
    if not disp:  # 문안이 없으면
        problems.append(f"{sid}: 화면 문안 없음")  # 문제로 기록
        continue  # 다음 장면
    desc = as_list(sc["dcterms:description"])  # 원본 설명
    lit = sc.get("representation") == "문학 속 재현"  # 문학 속 재현인지
    g = next(v["ref"] for v in sc["dcterms:spatial"] if v.get("ref", "").startswith("group:"))  # 문화권
    place = f"문화권 아카이브·전시 서사·컬렉션 카드 / {groups[g]['dcterms:title']['value']} / {ASPECT_LABEL[sc['dia:aspect']['value']]} / {sid}"  # 화면 위치
    rows.append([place, f"{sid}#title", disp["title"], "제목(UI 문구, 장면 내용을 요약한 이름)", "—", "UI 레이블", "원본 dcterms:title을 줄인 화면용 제목"])  # 제목 줄
    if len(disp["summary"]) > 2:  # 요약이 2문장보다 길면
        problems.append(f"{sid}: 요약이 2문장을 넘음")  # 문제로 기록
    for i, it in enumerate(disp["summary"]):  # 요약 문장마다
        tid = f"{sid}#s{i + 1}"  # 문안 ID
        src_vals = [desc[k] for k in it["from"] if k < len(desc) and desc[k].get("value")]  # 바꿔 쓴 원본 값(확인 필요 값은 제외)
        if len(src_vals) != len(it["from"]):  # 없는 번호나 확인 필요 값을 가리키면
            problems.append(f"{tid}: from 번호가 없거나 '확인 필요' 값을 가리킴")  # 문제로 기록
        check_sentence(tid, it["text"])  # 문체 검사
        pend = [d.get("note", "") for d in desc if d.get("status") == "확인 필요"]  # 이 장면의 확인 필요 사항
        add_row(place, tid, it["text"], sorted({c for v in src_vals for c in v.get("cite", [])}), kind_of(src_vals, lit), ("장면의 확인 필요: " + "; ".join(pend)) if pend else "")  # 줄 추가

# ----- 큐레이터 해설 -----
for i, n in enumerate(notes):  # 해설마다
    tid = f"C-{n['group'].split(':')[1]}-{i + 1}"  # 문안 ID
    check_sentence(tid, n["text"])  # 문체 검사
    cites = sorted({c for sid in n["scenes"] for d in as_list(scenes[sid]["dcterms:description"]) for c in d.get("cite", [])})  # 근거 장면들의 모든 근거
    add_row(f"전시 서사 / {groups[n['group']]['dcterms:title']['value']} / {ASPECT_LABEL[n['aspect']]}", tid, n["text"], cites, "큐레이터 해설", "근거 장면: " + ", ".join(n["scenes"]) + ". 여러 장면을 종합한 큐레이터의 해석이며, 개별 사실은 근거 장면의 문장에서 확인")  # 줄 추가

# ----- 홈 문구 -----
for k in ("headline", "subline", "intro"):  # 홈 문구마다
    rows.append(["홈 / 제목·소개", f"home#{k}", text["home"][k], "—", "—", "UI 레이블", "문헌 근거가 필요 없는 소개 문구"])  # 줄 추가

# ----- 문서 쓰기 -----
OUT.parent.mkdir(exist_ok=True)  # review 폴더 만들기
lines = ["# 전시문안 근거대조표", "", "> 내부 검수용 문서입니다. 공개 사이트에 넣지 않습니다. `py scripts/build_display.py`로 다시 만듭니다.", "", "| 화면 위치 | 문안 ID | 최종 문장 | 출처 | 쪽수 | 내용 성격 | 확인 사항 |", "| --- | --- | --- | --- | --- | --- | --- |"]  # 머리말과 표 머리
for r in rows:  # 줄마다
    lines.append("| " + " | ".join(str(c).replace("|", "\\|").replace("\n", " ") for c in r) + " |")  # 표 한 줄
lines += ["", "## 검사에서 나온 문제", ""] + ([f"- {p}" for p in problems] or ["- 없음"])  # 문제 목록
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")  # 파일 저장
print(f"{OUT.relative_to(ROOT)} 저장: {len(rows)}줄, 문제 {len(problems)}건")  # 결과 요약
for p in problems:  # 문제마다
    print("  ", p)  # 출력
sys.exit(1 if problems else 0)  # 문제가 있으면 실패 코드
