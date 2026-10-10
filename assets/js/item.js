// 개별 자원(item.html?id=...): 제목 → 읽기 쉬운 설명 → 관련 자원 → 자료 정보와 출처(접힘) → 전체 메타데이터(접힘)
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const box = document.getElementById('item'); // 내용 자리

  const ORDER = { // AP 3장의 클래스별 속성 순서(전체 메타데이터에서 그대로 씀)
    material: [['dcterms:title', '제목'], ['dcterms:type', '유형'], ['dcterms:date', '생산 연도'], ['dcterms:rights', '이용 조건'], ['dcterms:source', '원 소장처 링크'], ['dcterms:spatial', '문화권'], ['dcterms:relation', '관련 생활 장면'], ['dia:citation', '근거 출처와 쪽수']], // 자료
    scene: [['dcterms:title', '장면 제목'], ['dcterms:description', '설명'], ['dcterms:subject', '다루는 생활 대상'], ['dcterms:spatial', '장소·문화권'], ['dcterms:temporal', '시기'], ['dia:aspect', '생활문화의 측면'], ['dcterms:source', '근거 출처'], ['dia:citation', '근거 쪽수']], // 생활 장면
    concept: [['skos:prefLabel', '대표 이름'], ['skos:definition', '설명'], ['dia:aspect', '생활문화의 측면'], ['skos:exactMatch', '외부 전거'], ['dcterms:source', '근거 출처']], // 생활 대상
    label: [['skosxl:literalForm', '표기'], ['dia:variantForm', '이표기'], ['dia:gloss', '뜻'], ['dia:denotes', '가리키는 생활 대상'], ['dcterms:spatial', '쓰인 문화권'], ['dia:sourceLanguage', '기원 언어'], ['dia:etymologyNote', '어원 설명(연구자 해석)'], ['dcterms:source', '근거 출처'], ['dia:citation', '근거 쪽수']], // 어휘
    place: [['dcterms:title', '이름'], ['coords', '좌표'], ['dcterms:isPartOf', '상위 장소'], ['skos:exactMatch', '외부 전거']], // 장소
    group: [['dcterms:title', '이름'], ['dcterms:description', '이동 개요'], ['dcterms:spatial', '주요 장소'], ['dcterms:source', '근거 출처']], // 문화권
    reference: [['dcterms:creator', '저자'], ['dcterms:title', '제목'], ['dcterms:date', '발행 연도'], ['dcterms:isPartOf', '수록 학술지·단행본'], ['bibo:uri', '링크'], ['dcterms:accessRights', '접근 조건']] // 출처
  }; // ORDER 끝

  function val(res, prop) { const v = X.asList(res[prop]).filter(function (x) { return x && x.value; }); return v.length ? v.map(function (x) { return x.value; }).join(', ') : ''; } // 속성의 글자 값들

  function cell(res, prop) { // 전체 메타데이터 표의 값 칸
    if (prop === 'dia:citation') return X.citeLine(res[prop]) || el('span', { class: 'cite' }, '없음'); // 근거 쪽수
    if (prop === 'coords') { const c = res.coords; return el('div', {}, [c.lat + ', ' + c.lon, X.badgeFor(c), c.note ? el('span', { class: 'cite' }, c.note) : null]); } // 좌표
    const vs = X.asList(res[prop]); // 값 목록
    if (!vs.length) return el('span', { class: 'cite' }, '값 없음'); // 빈 선택 속성
    if (vs.length === 1) return X.valueNode(vs[0], prop); // 값 하나
    return el('ul', {}, vs.map(function (v) { return el('li', {}, X.valueNode(v, prop)); })); // 값 여럿
  } // cell 끝

  function related(title, ids) { // '이 대상을 부르는 말' 같은 관련 자원 묶음
    if (!ids.length) return null; // 없으면 그리지 않음
    const list = el('div', { class: 'word-grid' }); // 격자
    ids.forEach(function (id) { const r = X.byId.get(id); const c = X.classOf(id); list.appendChild(c === 'scene' ? X.sceneCard(r, { showCulture: true }) : c === 'label' ? X.labelCard(r, { showCulture: true }) : c === 'concept' ? X.conceptCard(r) : el('article', { class: 'word-card' }, [el('p', { class: 'card-meta' }, X.CLASS_NAME[c]), el('p', { class: 'word', style: 'font-size:1.2rem' }, X.refLink(id))])); }); // 카드
    return el('section', { class: 'related' }, [el('h2', {}, title), list]); // 묶음
  } // related 끝

  function add(node) { if (node) box.appendChild(node); } // 비어 있지 않을 때만 붙이는 함수

  function render(id) { // 자원 하나를 그리는 함수
    const res = X.byId.get(id); // 자원
    if (!res) { document.title = '찾을 수 없음 — 한 뿌리, 다른 땅'; box.appendChild(el('h1', {}, '자원을 찾을 수 없습니다')); box.appendChild(el('p', {}, ['주소를 확인하거나 ', el('a', { href: 'index.html' }, '홈'), '에서 문화권을 골라 찾아 주세요.'])); return; } // 없는 ID
    const cls = X.classOf(id); // 클래스
    const title = X.titleOf(res); // 이름
    document.title = title + ' — 한 뿌리, 다른 땅'; // 탭 제목
    const gids = cls === 'group' ? [id] : X.groupsOf(res); // 관련 문화권

    // 1. 제목·자원 유형·중요한 자료 성격
    const head = el('header', { class: 'item-head ' + (X.GROUP_CLASS[gids[0]] || '') }); // 머리
    head.appendChild(el('p', { class: 'eyebrow' }, [X.CLASS_NAME[cls], X.aspectOf(res) ? ' · ' + X.aspectName(X.aspectOf(res), true) : ''].join(''))); // 유형·측면
    const form = res['skosxl:literalForm']; // 어휘 표기
    head.appendChild(el('h1', { lang: form ? form.lang : null }, title)); // 제목
    const fl = X.flags(res); // 문학 속 재현·확인 필요
    if (res.scholarly === false) fl.push(el('span', { class: 'badge badge-pending' }, '학술 근거 아님')); // 소설 등
    if (res.status === '확인 필요') fl.push(el('span', { class: 'badge badge-pending' }, '내용 미추출')); // 열람하지 못한 문헌
    if (cls === 'material') fl.push(el('span', { class: 'badge' }, '이용 조건: ' + (val(res, 'dcterms:rights') || '확인 필요'))); // 권리 상태는 위에 노출
    if (fl.length) head.appendChild(el('p', { class: 'flags' }, fl)); // 배지 줄
    box.appendChild(head); // 붙임

    // 2. 읽기 쉬운 설명과 주요 정보
    const main = el('section', { class: 'item-body panel' }); // 설명 영역
    if (cls === 'scene') X.sceneSummary(res).forEach(function (t) { main.appendChild(el('p', { class: 'readable' }, t)); }); // 장면: 화면용 요약
    if (cls === 'group') ((X.display.groups || {})[id] || []).forEach(function (s) { main.appendChild(el('p', { class: 'readable' }, s.text)); }); // 문화권: 화면용 소개
    if (cls === 'label') { main.appendChild(el('p', { class: 'readable' }, res['dia:gloss'].value)); const vf = val(res, 'dia:variantForm'); if (vf) main.appendChild(el('p', {}, '이표기: ' + vf)); } // 어휘: 뜻·이표기
    if (cls === 'concept' && val(res, 'skos:definition')) main.appendChild(el('p', { class: 'readable' }, val(res, 'skos:definition'))); // 생활 대상: 설명
    const facts = []; // 주요 정보(값이 있는 것만)
    if (val(res, 'dcterms:temporal')) facts.push(['시기', val(res, 'dcterms:temporal')]); // 시기
    if (cls === 'label' && res['dia:sourceLanguage']) facts.push(['기원 언어', X.LANG_NAME[res['dia:sourceLanguage'].value] || res['dia:sourceLanguage'].value]); // 기원 언어
    if (cls === 'label' && val(res, 'dia:etymologyNote')) facts.push(['어원 설명(연구자 해석)', val(res, 'dia:etymologyNote')]); // 어원(해석임을 이름에 밝힘)
    if (cls === 'reference') { facts.push(['저자', val(res, 'dcterms:creator')]); if (val(res, 'dcterms:isPartOf')) facts.push(['수록', val(res, 'dcterms:isPartOf')]); facts.push(['접근 조건', val(res, 'dcterms:accessRights')]); } // 출처 정보
    if (cls === 'material') { facts.push(['유형', val(res, 'dcterms:type')]); facts.push(['생산 연도', val(res, 'dcterms:date') || '연도 미상']); } // 자료 정보
    if (facts.length) main.appendChild(el('dl', { class: 'facts' }, facts.reduce(function (a, f) { return a.concat([el('dt', {}, f[0]), el('dd', {}, f[1])]); }, []))); // 정보 목록
    if (gids.length) main.appendChild(el('p', { class: 'head-links' }, gids.map(function (g) { return el('a', { class: 'btn', href: X.archiveUrl(g) + (X.aspectOf(res) ? '#' + X.ASPECT_INFO[X.aspectOf(res)].key : '') }, X.titleOf(X.byId.get(g)) + ' 아카이브로'); }))); // 관련 문화권 아카이브로 가는 경로
    if (main.childNodes.length) box.appendChild(main); // 붙임

    // 3. 관련 자원(데이터의 참조만 따름)
    const ref = function (v) { return v && v.ref; }; // 참조 ID 꺼내기
    if (cls === 'scene') { add(related('이 장면을 부르던 말', A.sceneLabels[id] || [])); add(related('다루는 생활 대상', X.asList(res['dcterms:subject']).map(ref))); } // 장면
    if (cls === 'concept') { add(related('이 대상을 부르는 말', A.labels.filter(function (l) { return ref(l['dia:denotes']) === id; }).map(function (l) { return l.id; }))); add(related('관련 생활 장면', A.scenes.filter(function (s) { return X.asList(s['dcterms:subject']).some(function (v) { return v.ref === id; }); }).map(function (s) { return s.id; }))); } // 생활 대상
    if (cls === 'label') { // 어휘
      const den = ref(res['dia:denotes']); // 가리키는 대상
      if (den) add(related('가리키는 생활 대상', [den])); // 대상
      add(related('이 말이 쓰인 생활 장면', A.scenes.filter(function (s) { return (A.sceneLabels[s.id] || []).indexOf(id) >= 0; }).map(function (s) { return s.id; }))); // 연결된 장면
      if (den) { const others = A.labels.filter(function (l) { return l.id !== id && ref(l['dia:denotes']) === den && X.groupsOf(l).some(function (g) { return gids.indexOf(g) < 0; }); }).map(function (l) { return l.id; }); add(related('같은 대상을 다른 문화권에서 부르는 말', others)); } // 확인된 교차 탐색만
    } // 어휘 끝
    if (cls === 'place') add(related('이 장소가 나오는 생활 장면', A.scenes.filter(function (s) { return X.asList(s['dcterms:spatial']).some(function (v) { return v.ref === id; }); }).map(function (s) { return s.id; }))); // 장소
    if (cls === 'reference') add(related('이 출처를 근거로 한 생활 장면', A.scenes.filter(function (s) { return X.asList(s['dcterms:source']).some(function (v) { return v.ref === id; }); }).map(function (s) { return s.id; }))); // 출처
    if (cls === 'material') add(related('관련 생활 장면', X.asList(res['dcterms:relation']).map(ref))); // 자료

    // 4. 자료 정보와 출처(접힘)
    const src = el('details', { class: 'fold' }, [el('summary', {}, '자료 정보와 출처')]); // 펼침 영역
    const cites = X.allCites(res); // 모든 근거
    if (cites.length) src.appendChild(el('p', {}, X.citeLine(cites))); // 출처와 쪽수 한 줄
    else src.appendChild(el('p', { class: 'cite' }, '이 자원에 기록된 근거 쪽수가 없습니다.')); // 없으면
    if (res.note) src.appendChild(el('p', { class: 'cite' }, '편집 메모: ' + res.note)); // 편집 메모
    src.appendChild(el('p', { class: 'cite' }, '전체 참고문헌은 ' + '소개 페이지에 있습니다. ')); // 안내
    src.lastChild.appendChild(el('a', { href: 'about.html#sources' }, '참고문헌 보기')); // 링크
    box.appendChild(src); // 붙임

    // 5. 전체 메타데이터(접힘, AP 순서)
    const meta = el('details', { class: 'fold' }, [el('summary', {}, '전체 메타데이터 (AP 순서)')]); // 펼침 영역
    const table = el('table', { class: 'meta-table' }, [el('caption', { class: 'sr-only' }, title + '의 전체 메타데이터')]); // 표
    const tbody = el('tbody'); // 표 본문
    ORDER[cls].forEach(function (pair) { tbody.appendChild(el('tr', {}, [el('th', { scope: 'row' }, [pair[1], el('small', {}, pair[0])]), el('td', {}, cell(res, pair[0]))])); }); // AP 속성 순서대로
    table.appendChild(tbody); // 붙임
    meta.appendChild(table); // 붙임
    box.appendChild(meta); // 붙임

    if (cls === 'place' && window.L && res.coords) { const m = el('div', { class: 'map-small', 'aria-label': title + ' 위치(근사 좌표)' }); box.appendChild(m); const map = L.map(m, { scrollWheelZoom: true }).setView([res.coords.lat, res.coords.lon], 6); X.osmLayer().addTo(map); L.circleMarker([res.coords.lat, res.coords.lon], { radius: 8 }).addTo(map); box.appendChild(el('p', { class: 'cite' }, '좌표는 문헌에 없는 근사값입니다(지도 표시용).')); } // 장소 지도
  } // render 끝

  render(new URLSearchParams(location.search).get('id') || ''); // 주소의 id로 그리기
})(); // 즉시 실행 함수 끝
