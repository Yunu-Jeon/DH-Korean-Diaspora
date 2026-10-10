# 검수한 data/의 클래스별 JSON을 사이트가 읽는 site-data/archive.js 하나로 내보내는 스크립트
import json  # JSON을 읽고 쓰기 위한 모듈
import sys  # 콘솔 출력 인코딩을 맞추기 위한 모듈
from datetime import date  # 내보낸 날짜를 기록하기 위한 모듈
from pathlib import Path  # 경로를 다루기 위한 모듈

sys.stdout.reconfigure(encoding="utf-8")  # 윈도 콘솔에서도 한글이 깨지지 않게 함
ROOT = Path(__file__).resolve().parent.parent  # 저장소 루트 경로
DATA = ROOT / "data"  # 검수용 원본 데이터 폴더(GitHub에 올리지 않음)
OUT = ROOT / "site-data" / "archive.js"  # 사이트가 읽는 파일(GitHub에 올림)
FILES = {  # 사이트 데이터의 키 → 원본 파일 이름
    "materials": "materials.json",  # 자료
    "scenes": "scenes.json",  # 생활 장면
    "concepts": "concepts.json",  # 생활 대상
    "labels": "labels.json",  # 어휘
    "places": "places.json",  # 장소
    "groups": "groups.json",  # 문화권
    "references": "references.json",  # 출처
}  # FILES 끝


def as_list(v):  # 값을 항상 배열로 다루기 위한 함수
    return v if isinstance(v, list) else [v]  # 배열이 아니면 한 칸짜리 배열로 감쌈


def title_of(res):  # 자원의 사람이 읽을 이름을 고르는 함수
    for key in ("skosxl:literalForm", "skos:prefLabel", "dcterms:title"):  # 클래스마다 이름 속성이 다름
        if isinstance(res.get(key), dict) and res[key].get("value"):  # 그 속성에 값이 있으면
            return res[key]["value"]  # 그 값을 이름으로 씀
    return res["id"]  # 이름이 없으면 ID를 씀


archive = {key: json.loads((DATA / name).read_text(encoding="utf-8")) for key, name in FILES.items()}  # 7개 클래스를 모두 읽음
pending = []  # 소개 페이지의 '아직 확인하지 못한 것' 목록
coord_count = 0  # 문헌 외 좌표를 쓴 장소 수
for key, items in archive.items():  # 클래스마다
    for res in items:  # 자원마다
        name = title_of(res)  # 자원 이름
        if res.get("status") == "확인 필요":  # 자원 전체가 확인 필요이면
            pending.append({"id": res["id"], "text": f"{name}: {res.get('note', '')}"})  # 목록에 추가
        for prop, val in res.items():  # 속성마다
            for v in as_list(val):  # 값마다
                if isinstance(v, dict) and v.get("status") == "확인 필요":  # 값이 확인 필요이면
                    pending.append({"id": res["id"], "text": f"{name} — {prop}: {v.get('note', '')}"})  # 목록에 추가
        if res.get("coords", {}).get("basis") == "문헌 외":  # 좌표가 문헌 밖 값이면
            coord_count += 1  # 개수만 셈(장소마다 따로 적지 않음)
if coord_count:  # 문헌 외 좌표가 하나라도 있으면
    pending.append({"id": None, "text": f"장소 {coord_count}곳의 좌표는 문헌에 없는 근사값이다(지도 표시용, 검수 필요)."})  # 한 줄로 요약해 추가
archive["pending"] = pending  # 확인 필요 목록을 데이터에 넣음
archive["curatorNotes"] = json.loads((DATA / "curator_notes.json").read_text(encoding="utf-8"))["notes"]  # 큐레이터 해설(해석, AP 밖)
archive["others"] = json.loads((DATA / "others.json").read_text(encoding="utf-8"))["items"]  # 네 측면 밖 내용 목록


def cites_of(res):  # 자원의 모든 값에 붙은 근거("출처ID:쪽")를 모으는 함수
    out = set()  # 결과 집합
    for val in res.values():  # 속성 값마다
        for v in as_list(val):  # 값 객체마다
            if isinstance(v, dict):  # 값 객체면
                out.update(v.get("cite", []))  # 근거를 모음
    return out  # 근거 집합을 돌려줌


def groups_of(res):  # 자원이 속한 문화권 ID 목록을 구하는 함수
    return [v["ref"] for v in as_list(res.get("dcterms:spatial", [])) if str(v.get("ref", "")).startswith("group:")]  # spatial 중 문화권만


placement = {}  # 어휘 ID → [[문화권, 측면], ...] (전시에서 어휘 카드를 놓을 자리)
for lab in archive["labels"]:  # 어휘마다
    den = (lab.get("dia:denotes") or {}).get("ref")  # 가리키는 생활 대상
    forms = [lab["skosxl:literalForm"]["value"]] + [v["value"] for v in as_list(lab.get("dia:variantForm", []))]  # 표기와 이표기
    spots = []  # 이 어휘의 자리 목록
    for g in groups_of(lab):  # 어휘가 쓰인 문화권마다
        scenes = [s for s in archive["scenes"] if g in groups_of(s)]  # 같은 문화권의 장면
        hit = [s for s in scenes if den and any(v.get("ref") == den for v in as_list(s.get("dcterms:subject", [])))]  # 규칙 1: 가리키는 대상을 다루는 장면
        if not hit:  # 없으면
            long_forms = [f for f in forms if len(f) >= 3]  # '재일'처럼 너무 짧은 표기는 아무 데나 걸리므로 뺌
            text = {s["id"]: s["dcterms:title"]["value"] + " " + " ".join(d.get("value", "") for d in as_list(s["dcterms:description"])) for s in scenes}  # 장면별 제목+설명 글
            count = {sid: sum(t.count(f) for f in long_forms) for sid, t in text.items()}  # 장면마다 표기가 나온 횟수
            best = max(count.values(), default=0)  # 가장 많이 나온 횟수
            hit = [s for s in scenes if best and count[s["id"]] == best]  # 규칙 2: 표기가 가장 많이 나오는 장면
        if not hit:  # 그래도 없으면
            hit = [s for s in scenes if cites_of(s) & cites_of(lab)]  # 규칙 3: 같은 문헌의 같은 쪽을 근거로 한 장면
        concept = next((c for c in archive["concepts"] if c["id"] == den), None)  # 가리키는 생활 대상 자원
        fallback = concept["dia:aspect"]["value"] if concept else "부르는 것"  # 장면이 없으면 대상의 측면, 대상도 없으면 '부르는 것'
        aspects = sorted({s["dia:aspect"]["value"] for s in hit}) or [fallback]  # 장면들의 측면
        spots += [[g, a] for a in aspects]  # 자리 추가
    placement[lab["id"]] = spots  # 결과 저장
archive["labelPlacement"] = placement  # 사이트에서 쓰도록 넣음
archive["exported"] = date.today().isoformat()  # 내보낸 날짜를 기록

OUT.parent.mkdir(exist_ok=True)  # site-data 폴더가 없으면 만듦
body = json.dumps(archive, ensure_ascii=False, indent=1)  # 사람이 읽을 수 있게 들여쓴 JSON 문자열
OUT.write_text("// scripts/export_site_data.py가 만든 파일입니다. 직접 고치지 마세요.\nwindow.ARCHIVE = " + body + ";\n", encoding="utf-8")  # 스크립트 태그로 읽을 수 있는 JS로 저장
print(f"{OUT.relative_to(ROOT)} 저장: " + ", ".join(f"{k} {len(archive[k])}" for k in FILES) + f", 확인 필요 {len(pending)}")  # 결과 요약 출력
