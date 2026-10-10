// 개별 자원 페이지: item.html?id=... 의 자원을 AP에 정한 속성 순서대로 보여 줌
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const box = document.getElementById('item'); // 내용 자리

  const ORDER = { // AP 3장의 클래스별 속성 순서와 화면 이름
    material: [['dcterms:title', '제목'], ['dcterms:type', '유형'], ['dcterms:date', '생산 연도'], ['dcterms:rights', '이용 조건'], ['dcterms:source', '원 소장처 링크'], ['dcterms:spatial', '문화권'], ['dcterms:relation', '관련 생활 장면'], ['dia:citation', '근거 출처와 쪽수']], // 자료
    scene: [['dcterms:title', '장면 제목'], ['dcterms:description', '설명'], ['dcterms:subject', '다루는 생활 대상'], ['dcterms:spatial', '장소·문화권'], ['dcterms:temporal', '시기'], ['dia:aspect', '생활문화의 측면'], ['dcterms:source', '근거 출처'], ['dia:citation', '근거 쪽수']], // 생활 장면
    concept: [['skos:prefLabel', '대표 이름'], ['skos:definition', '설명'], ['dia:aspect', '생활문화의 측면'], ['skos:exactMatch', '외부 전거'], ['dcterms:source', '근거 출처']], // 생활 대상
    label: [['skosxl:literalForm', '표기'], ['dia:variantForm', '이표기'], ['dia:gloss', '뜻'], ['dia:denotes', '가리키는 생활 대상'], ['dcterms:spatial', '쓰인 문화권'], ['dia:sourceLanguage', '기원 언어'], ['dia:etymologyNote', '어원 설명(연구자 해석)'], ['dcterms:source', '근거 출처'], ['dia:citation', '근거 쪽수']], // 어휘
    place: [['dcterms:title', '이름'], ['coords', '좌표'], ['dcterms:isPartOf', '상위 장소'], ['skos:exactMatch', '외부 전거']], // 장소
    group: [['dcterms:title', '이름'], ['dcterms:description', '이동 개요'], ['dcterms:spatial', '주요 장소'], ['dcterms:source', '근거 출처']], // 문화권
    reference: [['dcterms:creator', '저자'], ['dcterms:title', '제목'], ['dcterms:date', '발행 연도'], ['dcterms:isPartOf', '수록 학술지·단행본'], ['bibo:uri', '링크'], ['dcterms:accessRights', '접근 조건']] // 출처
  }; // ORDER 끝

  function cell(res, prop) { // 속성 하나의 값 칸을 만드는 함수
    if (prop === 'dia:citation') { // 근거 쪽수는 문자열 배열
      const c = X.citeNode(res[prop]); // 출처·쪽수 줄
      return c || el('span', { class: 'cite' }, '없음'); // 없으면 '없음'
    } // 근거 쪽수 끝
    if (prop === 'coords') { // 좌표는 위도·경도와 근거 표시
      const c = res.coords; // 좌표 값
      const d = el('div', {}, c.lat + ', ' + c.lon); // 위도, 경도
      const b = X.badgeFor(c); // 문헌 외 배지
      if (b) d.appendChild(b); // 있으면 붙임
      if (c.note) d.appendChild(el('span', { class: 'cite' }, c.note)); // 좌표 메모
      return d; // 좌표 칸을 돌려줌
    } // 좌표 끝
    const vals = X.asList(res[prop]); // 값 목록
    if (!vals.length) return el('span', { class: 'cite' }, '값 없음'); // 선택 속성이 비어 있으면 '값 없음'
    if (vals.length === 1) return X.valueNode(vals[0], prop); // 값이 하나면 그대로
    const ul = el('ul'); // 값이 여럿이면 목록
    vals.forEach(function (v) { ul.appendChild(el('li', {}, X.valueNode(v, prop))); }); // 값마다 항목
    return ul; // 목록을 돌려줌
  } // cell 끝

  function backlinks(id) { // 이 자원을 가리키는 다른 자원을 찾는 함수
    const out = []; // 결과
    ['scenes', 'labels', 'materials', 'groups', 'places', 'concepts'].forEach(function (key) { // 참조를 가질 수 있는 클래스마다
      A[key].forEach(function (res) { // 자원마다
        const hit = Object.keys(res).some(function (p) { return X.asList(res[p]).some(function (v) { return v && v.ref === id; }); }); // 어느 속성이든 이 ID를 가리키는지
        if (hit) out.push(res); // 가리키면 결과에 넣음
      }); // 자원 끝
    }); // 클래스 끝
    return out; // 결과를 돌려줌
  } // backlinks 끝

  function render(id) { // 자원 하나를 그리는 함수
    const res = X.byId.get(id); // 자원
    if (!res) { // 없는 ID면
      document.title = '찾을 수 없음 — 한 뿌리, 다른 흙'; // 탭 제목
      box.appendChild(el('h1', {}, '자원을 찾을 수 없습니다')); // 안내 제목
      box.appendChild(el('p', {}, ['주소를 확인하거나 ', el('a', { href: 'collection.html' }, '컬렉션'), '에서 찾아 주세요.'])); // 안내 문장
      return; // 끝
    } // 없는 ID 처리 끝
    const cls = X.classOf(id); // 클래스
    const title = X.titleOf(res); // 이름
    document.title = title + ' — 한 뿌리, 다른 흙'; // 탭 제목
    const gid = cls === 'group' ? id : X.groupsOf(res)[0]; // 색을 정할 문화권
    const hero = el('div', { class: 'item-hero ' + (X.GROUP_CLASS[gid] || '') }); // 그림 표지 + 제목 줄
    const mark = el('div', { class: 'mark', 'aria-hidden': 'true' }); // 그림 표지(장식)
    const subj = X.asList(res['dcterms:subject'])[0] || X.asList(res['dia:denotes'])[0]; // 장면의 대상 또는 어휘가 가리키는 대상
    const iconKey = cls === 'concept' ? id : (subj && subj.ref) || X.aspectOf(res) || ({ label: '부르는 것', reference: '배우는 것', group: '부르는 것' })[cls] || '먹는 것'; // 아이콘 고르기
    mark.appendChild(window.ArchiveIcons.iconSvg(iconKey)); // 아이콘
    hero.appendChild(mark); // 붙임
    const titleBox = el('div'); // 제목 묶음
    titleBox.appendChild(el('p', { class: 'eyebrow' }, X.CLASS_NAME[cls] + (res.class ? ' · ' + res.class : '') + (X.aspectOf(res) ? ' · ' + X.aspectOf(res) : ''))); // 클래스·측면 이름
    const form = res['skosxl:literalForm']; // 어휘면 표기 언어를 h1에 붙이기 위해
    titleBox.appendChild(el('h1', { lang: form ? form.lang : null }, title)); // 제목
    if (res.representation) titleBox.appendChild(el('span', { class: 'badge badge-lit', style: 'margin-left:0' }, res.representation)); // 문학 속 재현 표시
    hero.appendChild(titleBox); // 붙임
    box.appendChild(hero); // 화면에 붙임
    if (res.status === '확인 필요') box.appendChild(el('p', {}, [el('span', { class: 'badge badge-pending' }, '확인 필요'), ' ', res.note || ''])); // 자원 전체가 확인 필요면 안내
    if (res.scholarly === false) box.appendChild(el('p', {}, el('span', { class: 'badge badge-pending' }, '학술 근거 아님'))); // 소설 등 학술 근거가 아닌 출처 표시

    const table = el('table', { class: 'meta-table' }); // 메타데이터 표
    table.appendChild(el('caption', { class: 'sr-only' }, title + '의 메타데이터(AP 순서)')); // 표 설명(스크린리더용)
    const tbody = el('tbody'); // 표 본문
    ORDER[cls].forEach(function (pair) { // AP 순서대로
      const tr = el('tr'); // 한 줄
      tr.appendChild(el('th', { scope: 'row' }, [pair[1], el('small', {}, pair[0])])); // 속성 이름과 원래 속성 ID
      tr.appendChild(el('td', {}, cell(res, pair[0]))); // 값
      tbody.appendChild(tr); // 줄 추가
    }); // 속성 끝
    table.appendChild(tbody); // 본문 붙임
    box.appendChild(table); // 표를 화면에 붙임
    if (res.note) box.appendChild(el('p', { class: 'cite', style: 'margin-top:10px' }, '편집 메모: ' + res.note)); // 자원 메모

    if (cls === 'place' && window.L && res.coords) { // 장소면 작은 지도
      const m = el('div', { class: 'map map-small', style: 'margin-top:20px', 'aria-label': title + ' 위치 지도(근사 좌표)' }); // 지도 자리
      box.appendChild(m); // 붙임
      const map = L.map(m, { scrollWheelZoom: false }).setView([res.coords.lat, res.coords.lon], 6); // 지도 생성
      X.osmLayer().addTo(map); // OSM 타일과 저작자 표시
      L.circleMarker([res.coords.lat, res.coords.lon], { radius: 8 }).addTo(map); // 위치 표식
    } // 장소 지도 끝

    const back = backlinks(id); // 이 자원을 가리키는 것들
    if (cls === 'concept') { // 생활 대상이면 문화권별로 부르는 말을 나란히
      const labs = back.filter(function (r) { return X.classOf(r.id) === 'label'; }); // 이 대상을 가리키는 어휘
      if (labs.length) { // 있으면
        box.appendChild(el('h2', {}, '이 대상을 부르는 말')); // 소제목
        const grid = el('div', { class: 'compare' }); // 나란히 놓는 격자
        labs.forEach(function (l) { grid.appendChild(X.labelCard(l)); }); // 어휘 카드
        box.appendChild(grid); // 붙임
      } // 어휘 끝
    } // 생활 대상 끝
    const rest = back.filter(function (r) { return !(cls === 'concept' && X.classOf(r.id) === 'label'); }); // 위에서 보인 어휘를 뺀 나머지
    if (rest.length) { // 있으면
      box.appendChild(el('h2', {}, '이 자원과 이어진 것')); // 소제목
      const ul = el('ul', { class: 'plain-list' }); // 목록
      rest.forEach(function (r) { ul.appendChild(el('li', {}, [X.CLASS_NAME[X.classOf(r.id)] + ' · ', X.refLink(r.id)])); }); // 클래스 이름과 링크
      box.appendChild(ul); // 붙임
    } // 나머지 끝
    if (cls === 'reference') { // 출처면 이 출처를 근거로 쓴 자원 목록
      const used = []; // 결과
      ['scenes', 'labels', 'concepts', 'groups', 'materials'].forEach(function (key) { // 클래스마다
        A[key].forEach(function (r) { if (X.asList(r['dcterms:source']).some(function (v) { return v.ref === id; })) used.push(r); }); // source가 이 출처를 가리키면
      }); // 클래스 끝
      if (used.length) { // 있으면
        box.appendChild(el('h2', {}, '이 출처를 근거로 한 자원')); // 소제목
        const ul = el('ul', { class: 'plain-list' }); // 목록
        used.forEach(function (r) { ul.appendChild(el('li', {}, [X.CLASS_NAME[X.classOf(r.id)] + ' · ', X.refLink(r.id)])); }); // 링크
        box.appendChild(ul); // 붙임
      } // 결과 끝
    } // 출처 끝
  } // render 끝

  render(new URLSearchParams(location.search).get('id') || ''); // 주소의 id로 그리기
})(); // 즉시 실행 함수 끝
