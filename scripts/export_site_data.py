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
archive["exported"] = date.today().isoformat()  # 내보낸 날짜를 기록

OUT.parent.mkdir(exist_ok=True)  # site-data 폴더가 없으면 만듦
body = json.dumps(archive, ensure_ascii=False, indent=1)  # 사람이 읽을 수 있게 들여쓴 JSON 문자열
OUT.write_text("// scripts/export_site_data.py가 만든 파일입니다. 직접 고치지 마세요.\nwindow.ARCHIVE = " + body + ";\n", encoding="utf-8")  # 스크립트 태그로 읽을 수 있는 JS로 저장
print(f"{OUT.relative_to(ROOT)} 저장: " + ", ".join(f"{k} {len(archive[k])}" for k in FILES) + f", 확인 필요 {len(pending)}")  # 결과 요약 출력
