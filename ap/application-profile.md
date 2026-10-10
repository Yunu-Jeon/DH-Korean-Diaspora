# 응용 프로파일(AP) — 식탁 위의 말

> 이 문서는 아카이브의 데이터 설계다. Claude Code는 이 문서를 바꾸지 않고 그대로 구현한다.
> 각 결정 옆의 "근거"는 기획안 3장(필수 속성과 근거)에 그대로 쓴다.
> `Yunu-Jeon`, `DH-Korean-Diaspora`은 배포 전에 실제 값으로 바꾼다.

## 1. 사용 어휘(vocabulary)

| 접두어 | 어휘 | Omeka S | 근거 |
| --- | --- | --- | --- |
| dcterms | Dublin Core Terms | 기본 포함 | 가장 널리 쓰이는 기술 어휘 |
| dctype | Dublin Core Type | 기본 포함 | 자료 유형 구분 |
| bibo | Bibliographic Ontology | 기본 포함 | 학술 문헌 기술 |
| foaf | Friend of a Friend | 기본 포함 | 집단(문화권) 기술 |
| skos | SKOS | 가져와야 함 | 생활 대상을 개념으로, 외부 전거 연결 |
| skosxl | SKOS-XL | 가져와야 함 | 이름표(어휘)를 독립 자원으로 다루는 표준. 말과 대상을 분리한다는 설계와 맞음 |
| dia | 커스텀 어휘 | 직접 만듦 | 표준에 없는 속성. 네임스페이스: `https://Yunu-Jeon.github.io/DH-Korean-Diaspora/ns#` |

## 2. 클래스 (7개)

| 클래스 | 표준 클래스 | 근거 |
| --- | --- | --- |
| 자료 | dctype:Text / dctype:StillImage / dctype:MovingImage | 실물 1차 사료. 유형별로 기본 어휘의 클래스를 씀 |
| 생활 장면 | dia:Scene (커스텀) | 관습·생활상에 대한 서사 단위로, 사건(Event)이나 개념(Concept) 어느 쪽에도 맞지 않음 |
| 생활 대상 | skos:Concept | 음식·생활 사물을 "가리켜지는 개념"으로 둠 |
| 어휘 | skosxl:Label | 같은 대상을 부르는 여러 말을 각각 독립 자원으로 기술 |
| 장소 | dcterms:Location | 기본 어휘로 충분 |
| 문화권 | foaf:Group | 고려인·재일조선인·하와이 한인을 사람들의 집단으로 봄 |
| 출처 | bibo:AcademicArticle / bibo:Thesis / bibo:Document | 논문·학위논문·기타 문서 |

## 3. 클래스별 속성

카디널리티: 1 = 필수·1개, 0..1 = 선택·1개, 1..n = 필수·여러 개, 0..n = 선택·여러 개

### 자료
| 속성 | 의미 | 카디널리티 | 값 | 근거 |
| --- | --- | --- | --- | --- |
| dcterms:title | 제목 | 1 | 문자열 | |
| dcterms:type | 유형 | 1 | 신문 지면 / 사진 / 문서 / 영상 | |
| dcterms:date | 생산 연도 | 0..1 | 날짜 | 1차 자료는 연도 미상이 많아 필수로 두면 넣을 수 없는 자료가 생김. 없으면 화면에 "연도 미상" |
| dcterms:rights | 이용 조건 | 1 | 문자열 | IIIF·재배포 가능 여부 판단의 기준 |
| dcterms:source | 원 소장처 링크 | 1 | URI | |
| dcterms:spatial | 문화권 | 1..n | 문화권 자원 | |
| dcterms:relation | 관련 생활 장면 | 0..n | 생활 장면 자원 | 자료 하나가 여러 장면의 증거가 될 수 있음 |
| dia:citation | 근거 출처와 쪽수 | 0..n | "출처ID:쪽" 문자열 | 문헌 속에 인용된 자료일 때 |

### 생활 장면
| 속성 | 의미 | 카디널리티 | 값 | 근거 |
| --- | --- | --- | --- | --- |
| dcterms:title | 장면 제목 | 1 | 문자열 | |
| dcterms:description | 설명 | 1 | 문자열 | 원문을 옮기지 않고 바꿔 씀 |
| dcterms:subject | 다루는 생활 대상 | 1..n | 생활 대상 자원 | |
| dcterms:spatial | 장소·문화권 | 1..n | 장소 또는 문화권 자원 | |
| dcterms:temporal | 시기 | 0..1 | 문자열 | |
| dia:lifeDomain | 생활 영역 | 1 | 의 / 식 / 주 | 이번 학기는 '식'만 채우고 의·주는 확장용으로 남김 |
| dcterms:source | 근거 출처 | 1..n | 출처 자원 | 근거 없는 장면을 막음 |
| dia:citation | 근거 쪽수 | 1..n | "출처ID:쪽" 문자열 | |

### 생활 대상
| 속성 | 의미 | 카디널리티 | 값 | 근거 |
| --- | --- | --- | --- | --- |
| skos:prefLabel | 대표 이름(한국어) | 1 | 문자열(@ko) | |
| skos:definition | 설명 | 0..1 | 문자열 | |
| dia:lifeDomain | 생활 영역 | 1 | 의 / 식 / 주 | |
| skos:exactMatch | 외부 전거(Wikidata) | 0..1 | URI | 그라운딩 대상 |
| dcterms:source | 근거 출처 | 1..n | 출처 자원 | |

### 어휘
| 속성 | 의미 | 카디널리티 | 값 | 근거 |
| --- | --- | --- | --- | --- |
| skosxl:literalForm | 표기 | 1 | 문자열(언어 태그) | |
| dia:variantForm | 이표기 | 0..n | 문자열 | Kim Chee / 김치처럼 검색에 필요 |
| dia:gloss | 뜻 | 1 | 문자열 | |
| dia:denotes | 가리키는 생활 대상 | 1 | 생활 대상 자원 | 말과 대상 분리의 핵심 연결 |
| dcterms:spatial | 쓰인 문화권 | 1..n | 문화권 자원 | |
| dia:sourceLanguage | 기원 언어 | 0..1 | ISO 639-3 코드(rus, jpn, eng, kor) | dcterms:language는 "자원이 쓰인 언어"라 의미가 다름 |
| dia:etymologyNote | 어원 설명(연구자 해석) | 0..1 | 문자열 | 보고된 사실과 해석을 분리 |
| dcterms:source | 근거 출처 | 1..n | 출처 자원 | |
| dia:citation | 근거 쪽수 | 1..n | "출처ID:쪽" 문자열 | |

### 장소
| 속성 | 의미 | 카디널리티 | 값 | 근거 |
| --- | --- | --- | --- | --- |
| dcterms:title | 이름 | 1 | 문자열 | |
| (Mapping 모듈) | 좌표 | 1 | 위도·경도 | 정적 사이트에서는 lat, lon 값 |
| dcterms:isPartOf | 상위 장소 | 0..1 | 장소 자원 | 계층 확장 검색용 |
| skos:exactMatch | 외부 전거(GeoNames/Wikidata) | 0..1 | URI | 그라운딩 대상 |

### 문화권
| 속성 | 의미 | 카디널리티 | 값 | 근거 |
| --- | --- | --- | --- | --- |
| dcterms:title | 이름 | 1 | 문자열 | |
| dcterms:description | 이동 개요 | 1 | 문자열 | 이름 외 고유 정보가 있어 클래스로 둠 |
| dcterms:spatial | 주요 장소 | 1..n | 장소 자원 | |
| dcterms:source | 근거 출처 | 1..n | 출처 자원 | |

### 출처
| 속성 | 의미 | 카디널리티 | 값 | 근거 |
| --- | --- | --- | --- | --- |
| dcterms:creator | 저자 | 1..n | 문자열 | |
| dcterms:title | 제목 | 1 | 문자열 | |
| dcterms:date | 발행 연도 | 0..1 | 날짜 | 연윤희 논문처럼 미확인인 경우가 있음 |
| dcterms:isPartOf | 수록 학술지·단행본 | 0..1 | 문자열 | |
| bibo:uri | 링크 | 0..1 | URI | |
| dcterms:accessRights | 접근 조건 | 1 | 문자열 | 원문 공개 여부 |

## 4. AP에 담지 못한 것

- **쪽수:** dcterms:source는 문헌만 가리키므로, 쪽수는 dia:citation에 "출처ID:쪽" 문자열로 따로 적는다. 어느 출처의 쪽인지 구조적으로 연결되지 않는 한계가 있다.
- **어휘의 뜻:** SKOS-XL에서 이름표(Label)는 원래 뜻을 갖지 않고 개념(Concept)이 뜻을 가진다. 문화권마다 미묘하게 다른 뜻을 담으려고 어휘에 dia:gloss를 따로 두었다.
- **이표기의 맥락:** Kim Chee와 김치처럼 표기마다 쓰인 시기·매체가 다르지만, dia:variantForm은 문자열만 담는다.
- **사실과 해석:** 어원 설명만 dia:etymologyNote로 분리했고, 장면 설명 안의 해석은 구분하지 못한다.
- **인물:** 이용 시나리오에 인물 검색이 없어 클래스로 두지 않았다.
- **의복·주거:** dia:lifeDomain에 자리만 두고 이번 학기에는 채우지 않는다.
