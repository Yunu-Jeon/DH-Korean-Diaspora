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


def groups_of(res):  # 자원이 속한 문화권 ID 목록을 구하는 함수
    return [v["ref"] for v in as_list(res.get("dcterms:spatial", [])) if str(v.get("ref", "")).startswith("group:")]  # spatial 중 문화권만


# 장면과 어휘의 연결: AP의 참조(어휘 → dia:denotes → 생활 대상 ← dcterms:subject ← 장면)만 따른다
concepts = {c["id"]: c for c in archive["concepts"]}  # 생활 대상 ID → 자원
scene_labels = {}  # 장면 ID → 직접 연결된 어휘 ID 목록
for s in archive["scenes"]:  # 장면마다
    subjects = {v.get("ref") for v in as_list(s.get("dcterms:subject", []))}  # 장면이 다루는 생활 대상
    scene_labels[s["id"]] = [l["id"] for l in archive["labels"] if (l.get("dia:denotes") or {}).get("ref") in subjects and set(groups_of(l)) & set(groups_of(s))]  # 그 대상을 가리키고 같은 문화권에서 쓰인 어휘
linked = {(lid, g, s["dia:aspect"]["value"]) for s in archive["scenes"] for lid in scene_labels[s["id"]] for g in groups_of(s)}  # (어휘, 문화권, 측면)으로 이미 장면에 붙은 자리
aspect_labels = {}  # "문화권|측면" → 장면과 직접 이어지지 않았지만 그 측면의 생활 대상을 가리키는 어휘 목록
free_labels = {}  # 문화권 → 가리키는 생활 대상이 없는 어휘 목록(측면을 정할 근거가 없음)
for l in archive["labels"]:  # 어휘마다
    den = (l.get("dia:denotes") or {}).get("ref")  # 가리키는 생활 대상
    for g in groups_of(l):  # 쓰인 문화권마다
        if den in concepts:  # 생활 대상이 있으면
            a = concepts[den]["dia:aspect"]["value"]  # 그 대상의 측면
            if (l["id"], g, a) not in linked:  # 같은 측면 장면에 붙지 않았으면
                aspect_labels.setdefault(f"{g}|{a}", []).append(l["id"])  # '이 측면의 어휘'로
        elif not den:  # 생활 대상이 없으면
            free_labels.setdefault(g, []).append(l["id"])  # 측면 없이 문화권 단위로
archive["sceneLabels"] = scene_labels  # 사이트에서 쓰도록 넣음
archive["aspectLabels"] = aspect_labels  # 사이트에서 쓰도록 넣음
archive["freeLabels"] = free_labels  # 사이트에서 쓰도록 넣음
archive["display"] = json.loads((DATA / "display_text.json").read_text(encoding="utf-8"))  # 화면용 문안(제목·요약, '-습니다'체)
archive["exported"] = date.today().isoformat()  # 내보낸 날짜를 기록

OUT.parent.mkdir(exist_ok=True)  # site-data 폴더가 없으면 만듦
body = json.dumps(archive, ensure_ascii=False, indent=1)  # 사람이 읽을 수 있게 들여쓴 JSON 문자열
OUT.write_text("// scripts/export_site_data.py가 만든 파일입니다. 직접 고치지 마세요.\nwindow.ARCHIVE = " + body + ";\n", encoding="utf-8")  # 스크립트 태그로 읽을 수 있는 JS로 저장
print(f"{OUT.relative_to(ROOT)} 저장: " + ", ".join(f"{k} {len(archive[k])}" for k in FILES) + f", 확인 필요 {len(pending)}")  # 결과 요약 출력
