# data/ 폴더의 JSON을 AP 규칙으로 검사하고, dia:citation을 채우고, 건수를 요약하는 스크립트
import json  # JSON 파일을 읽고 쓰기 위한 모듈
import sys  # 종료 코드와 콘솔 인코딩 설정에 쓰는 모듈
from collections import Counter, defaultdict  # 건수 세기와 묶음 만들기에 쓰는 자료구조
from itertools import combinations  # 문화권 두 개씩 짝을 만들 때 쓰는 함수
from pathlib import Path  # 경로를 다루기 위한 모듈

sys.stdout.reconfigure(encoding="utf-8")  # 윈도 콘솔에서도 한글이 깨지지 않게 출력 인코딩을 UTF-8로 맞춤
DATA = Path(__file__).resolve().parent.parent / "data"  # 저장소 루트의 data 폴더 경로

# AP 3장의 카디널리티: 클래스 파일 이름 → {속성: 카디널리티}
AP = {  # 클래스별 속성 규칙을 담은 사전
    "materials.json": {"dcterms:title": "1", "dcterms:type": "1", "dcterms:date": "0..1", "dcterms:rights": "1", "dcterms:source": "1", "dcterms:spatial": "1..n", "dcterms:relation": "0..n", "dia:citation": "0..n"},  # 자료
    "scenes.json": {"dcterms:title": "1", "dcterms:description": "1", "dcterms:subject": "1..n", "dcterms:spatial": "1..n", "dcterms:temporal": "0..1", "dia:lifeDomain": "1", "dcterms:source": "1..n", "dia:citation": "1..n"},  # 생활 장면
    "concepts.json": {"skos:prefLabel": "1", "skos:definition": "0..1", "dia:lifeDomain": "1", "skos:exactMatch": "0..1", "dcterms:source": "1..n"},  # 생활 대상
    "labels.json": {"skosxl:literalForm": "1", "dia:variantForm": "0..n", "dia:gloss": "1", "dia:denotes": "1", "dcterms:spatial": "1..n", "dia:sourceLanguage": "0..1", "dia:etymologyNote": "0..1", "dcterms:source": "1..n", "dia:citation": "1..n"},  # 어휘
    "places.json": {"dcterms:title": "1", "coords": "1", "dcterms:isPartOf": "0..1", "skos:exactMatch": "0..1"},  # 장소
    "groups.json": {"dcterms:title": "1", "dcterms:description": "1", "dcterms:spatial": "1..n", "dcterms:source": "1..n"},  # 문화권
    "references.json": {"dcterms:creator": "1..n", "dcterms:title": "1", "dcterms:date": "0..1", "dcterms:isPartOf": "0..1", "bibo:uri": "0..1", "dcterms:accessRights": "1"},  # 출처
}  # AP 사전 끝
CITED = {"materials.json", "scenes.json", "labels.json"}  # AP에 dia:citation 속성이 있는 클래스
MULTI_OK_FOR_ONE = {"dcterms:description"}  # 카디널리티 1이지만 문장을 나눠 배열로 적은 속성(합치면 값 하나)


def load(name):  # data 폴더의 JSON 하나를 읽는 함수
    return json.loads((DATA / name).read_text(encoding="utf-8"))  # UTF-8로 읽어 파이썬 객체로 바꿔 돌려줌


def as_list(v):  # 값이 하나든 배열이든 항상 배열로 다루기 위한 함수
    return v if isinstance(v, list) else [v]  # 배열이면 그대로, 아니면 한 칸짜리 배열로 감쌈


def is_pending(v):  # 값 객체가 '확인 필요' 상태인지 판단하는 함수
    return isinstance(v, dict) and v.get("status") == "확인 필요"  # status가 '확인 필요'면 참


data = {name: load(name) for name in AP}  # 클래스 파일 7개를 모두 읽어 둠
ids = {r["id"] for name in AP for r in data[name]}  # 모든 자원 ID를 모아 참조 검사에 씀
errors, pending = [], []  # 규칙 위반 목록과 '확인 필요' 목록

for name, rules in AP.items():  # 클래스 파일마다 반복
    for res in data[name]:  # 그 파일의 자원마다 반복
        rid = res["id"]  # 자원 ID
        for prop, card in rules.items():  # AP 속성마다 반복
            if prop == "dia:citation":  # dia:citation은 아래에서 자동으로 채우므로 건너뜀
                continue  # 다음 속성으로
            vals = [] if prop not in res else as_list(res[prop])  # 속성 값을 배열로 꺼냄(없으면 빈 배열)
            if card in ("1", "1..n") and not vals:  # 필수인데 값이 없으면
                errors.append(f"{name} {rid}: 필수 속성 {prop} 없음")  # 위반으로 기록
            if card in ("1", "0..1") and len(vals) > 1 and prop not in MULTI_OK_FOR_ONE:  # 1개만 허용인데 여러 개면
                errors.append(f"{name} {rid}: {prop}는 1개만 허용")  # 위반으로 기록
            for v in vals:  # 각 값에 대해
                if is_pending(v):  # '확인 필요' 값이면
                    pending.append(f"{name} {rid} {prop}: {v.get('note', '')}")  # 확인 필요 목록에 추가
                    continue  # 나머지 검사는 하지 않음
                if prop == "coords":  # 좌표 값은 출처 대신 근거 표시만 확인
                    continue  # 다음 값으로
                if not v.get("cite"):  # 근거 출처·쪽이 비어 있으면
                    errors.append(f"{name} {rid}: {prop} 값에 cite 없음")  # 위반으로 기록
                ref = v.get("ref")  # 다른 자원을 가리키는 값인지 확인
                if ref and ref not in ids:  # 가리키는 ID가 data에 없으면
                    errors.append(f"{name} {rid}: {prop}의 참조 {ref}를 찾을 수 없음")  # 위반으로 기록
        if res.get("status") == "확인 필요":  # 자원 전체가 '확인 필요'로 표시돼 있으면
            pending.append(f"{name} {rid}: {res.get('note', '')}")  # 확인 필요 목록에 추가
        if res.get("coords", {}).get("basis") == "문헌 외":  # 좌표가 문헌 밖 값이면
            pending.append(f"{name} {rid} coords: 좌표는 문헌 외 값(검수 필요)")  # 확인 필요 목록에 추가
        if name in CITED:  # dia:citation을 가지는 클래스면
            cites = sorted({c for prop in rules for v in as_list(res.get(prop, [])) if isinstance(v, dict) for c in v.get("cite", [])})  # 모든 값의 cite를 중복 없이 모음
            res["dia:citation"] = cites  # AP 속성 dia:citation으로 저장
            if not cites and AP[name]["dia:citation"] == "1..n":  # 필수인데 근거가 하나도 없으면
                errors.append(f"{name} {rid}: dia:citation 비어 있음")  # 위반으로 기록
    if name in CITED:  # dia:citation을 채운 파일이면
        (DATA / name).write_text(json.dumps(data[name], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")  # 채운 결과를 파일에 다시 씀

group_of = {}  # 자원 ID → 관련 문화권 집합
for name in ("scenes.json", "labels.json", "materials.json"):  # 문화권을 dcterms:spatial로 가진 클래스
    for res in data[name]:  # 자원마다
        group_of[res["id"]] = {v["ref"] for v in as_list(res.get("dcterms:spatial", [])) if isinstance(v, dict) and str(v.get("ref", "")).startswith("group:")}  # spatial 중 문화권 참조만 모음

print("== 클래스별 건수 ==")  # 제목 출력
for name in AP:  # 클래스 파일마다
    print(f"{name:18} {len(data[name])}")  # 파일 이름과 자원 수를 출력

print("\n== 문화권별 건수 (장면 / 어휘 / 자료) ==")  # 제목 출력
by_group = defaultdict(Counter)  # 문화권 → 클래스별 건수
for name in ("scenes.json", "labels.json", "materials.json"):  # 문화권을 가진 클래스마다
    for res in data[name]:  # 자원마다
        for g in group_of[res["id"]]:  # 그 자원의 문화권마다
            by_group[g][name] += 1  # 건수를 하나 더함
for g in sorted(by_group):  # 문화권 이름순으로
    c = by_group[g]  # 그 문화권의 건수
    print(f"{g:16} 장면 {c['scenes.json']} / 어휘 {c['labels.json']} / 자료 {c['materials.json']}")  # 한 줄로 출력


def count_pairs(labels):  # 같은 생활 대상을 다른 문화권에서 다르게 부르는 어휘 쌍을 세는 함수
    by_concept = defaultdict(list)  # 생활 대상 → (문화권, 표기) 목록
    for lab in labels:  # 어휘마다
        den = lab.get("dia:denotes", {})  # 가리키는 생활 대상 값
        if not den.get("ref"):  # 생활 대상이 아직 없으면
            continue  # 셀 수 없으므로 건너뜀
        for v in as_list(lab.get("dcterms:spatial", [])):  # 쓰인 문화권마다
            by_concept[den["ref"]].append((v["ref"], lab["skosxl:literalForm"]["value"]))  # (문화권, 표기)를 추가
    pairs = []  # 결과 쌍 목록
    for concept, items in by_concept.items():  # 생활 대상마다
        for (g1, f1), (g2, f2) in combinations(items, 2):  # 어휘를 두 개씩 짝지어
            if g1 != g2 and f1 != f2:  # 문화권이 다르고 표기도 다르면
                pairs.append((concept, f"{g1}:{f1}", f"{g2}:{f2}"))  # 한 쌍으로 기록
    return pairs  # 쌍 목록을 돌려줌


cands = load("labels_candidates.json")["items"]  # use 범위 밖이라 보류한 어휘 후보
p1 = count_pairs(data["labels.json"])  # 확정 어휘만으로 센 쌍
p2 = count_pairs(data["labels.json"] + cands)  # 후보까지 포함해 센 쌍
print(f"\n== 같은 생활 대상, 문화권마다 다른 어휘 ==\n확정 어휘만: {len(p1)}쌍")  # 확정 어휘 기준 쌍 수 출력
for p in p1:  # 각 쌍을
    print("  ", *p)  # 한 줄씩 출력
print(f"후보 포함 시: {len(p2)}쌍")  # 후보 포함 쌍 수 출력
for p in p2:  # 각 쌍을
    print("  ", *p)  # 한 줄씩 출력

print(f"\n== 확인 필요 ({len(pending)}) ==")  # 확인 필요 개수 출력
for line in pending:  # 각 항목을
    print("  ", line)  # 한 줄씩 출력
print(f"\n== AP 규칙 위반 ({len(errors)}) ==")  # 위반 개수 출력
for line in errors:  # 각 위반을
    print("  ", line)  # 한 줄씩 출력
sys.exit(1 if errors else 0)  # 위반이 있으면 실패 코드로 끝냄
