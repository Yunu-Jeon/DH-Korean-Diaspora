// 모든 페이지가 함께 쓰는 데이터 조회·화면 조각·검색·문화권 전환·챗봇 기능
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드로 실수를 줄임

  const A = window.ARCHIVE; // site-data/archive.js가 넣어 둔 아카이브 데이터
  const D = A.display || { scenes: {}, groups: {}, home: {} }; // 화면용 문안(제목·요약)
  const CLASS_KEYS = ['materials', 'scenes', 'concepts', 'labels', 'places', 'groups', 'references']; // 클래스 7개의 데이터 키
  const byId = new Map(); // ID로 자원을 바로 찾기 위한 사전
  CLASS_KEYS.forEach(function (key) { A[key].forEach(function (res) { byId.set(res.id, res); }); }); // 모든 자원을 ID로 등록

  const GROUP_CLASS = { 'group:koryo': 'group-koryo', 'group:zainichi': 'group-zainichi', 'group:hawaii': 'group-hawaii' }; // 문화권 ID → 색 클래스
  const LANG_NAME = { kor: '한국어', rus: '러시아어', jpn: '일본어', eng: '영어' }; // ISO 639-3 코드 → 한국어 이름
  const CLASS_NAME = { material: '자료', scene: '생활 장면', concept: '생활 대상', label: '어휘', place: '장소', group: '문화권', reference: '출처' }; // 클래스 → 화면 이름
  const ASPECTS = ['먹는 것', '부르는 것', '일하는 것', '배우는 것']; // 데이터의 dia:aspect 값(순서대로, 값 자체는 바꾸지 않음)
  const ASPECT_INFO = { // 측면 값 → 화면 표시(한글·한자 병기)와 주소용 키
    '먹는 것': { key: 'eat', hanja: '食', ko: '식', label: '먹는 것', desc: '음식과 재료, 명절·잔치의 상차림' }, // 식
    '부르는 것': { key: 'call', hanja: '呼', ko: '호', label: '부르는 것', desc: '섞이고 바뀐 말, 스스로와 남을 부르는 이름' }, // 호
    '일하는 것': { key: 'work', hanja: '事', ko: '일', label: '일하는 것', desc: '농장·콜호즈·가게·공장의 생업' }, // 일
    '배우는 것': { key: 'learn', hanja: '學', ko: '학', label: '배우는 것', desc: '학교와 언어 교육, 다음 세대에 전하는 일' } // 학
  }; // ASPECT_INFO 끝
  const ASPECT_BY_KEY = {}; // 주소용 키 → 측면 값
  ASPECTS.forEach(function (a) { ASPECT_BY_KEY[ASPECT_INFO[a].key] = a; }); // 거꾸로 찾는 표 만들기

  function asList(v) { // 값을 항상 배열로 다루기 위한 함수
    if (v === undefined || v === null) return []; // 값이 없으면 빈 배열
    return Array.isArray(v) ? v : [v]; // 배열이 아니면 한 칸짜리 배열로 감쌈
  } // asList 끝

  function classOf(id) { // ID로 클래스를 알아내는 함수
    const prefix = String(id).split(':')[0]; // 'label:kim-chee' → 'label'
    return CLASS_NAME[prefix] ? prefix : 'reference'; // 접두어가 없으면 출처(예: 'kwon2020')
  } // classOf 끝

  function titleOf(res) { // 자원의 이름을 고르는 함수(장면은 화면용 제목 우선)
    if (!res) return ''; // 자원이 없으면 빈 문자열
    if (D.scenes[res.id] && D.scenes[res.id].title) return D.scenes[res.id].title; // 장면의 화면용 제목
    const keys = ['skosxl:literalForm', 'skos:prefLabel', 'dcterms:title']; // 클래스마다 이름 속성이 다름
    for (let i = 0; i < keys.length; i++) { // 이름 속성 후보마다
      const v = res[keys[i]]; // 그 속성 값
      if (v && v.value) return v.value; // 값이 있으면 그것을 이름으로 씀
    } // 반복 끝
    return res.id; // 이름이 없으면 ID를 씀
  } // titleOf 끝

  function cultureKey(gid) { return String(gid).split(':')[1]; } // 'group:koryo' → 'koryo'
  function groupByKey(key) { return byId.get('group:' + key); } // 'koryo' → 문화권 자원
  function itemUrl(id) { return 'item.html?id=' + encodeURIComponent(id); } // 개별 자원 페이지 주소(상대 경로)
  function archiveUrl(gid, aspect) { return 'archive.html?culture=' + cultureKey(gid) + (aspect ? '#' + ASPECT_INFO[aspect].key : ''); } // 문화권 페이지 주소(측면은 # 위치)
  function exhibitionUrl(gid, aspect) { return archiveUrl(gid, aspect); } // 전시 서사는 문화권 페이지에 합쳐짐

  function el(tag, attrs, children) { // 요소를 안전하게 만드는 함수(데이터를 innerHTML로 넣지 않음)
    const node = document.createElement(tag); // 요소 생성
    Object.keys(attrs || {}).forEach(function (k) { // 속성마다
      if (k === 'class') node.className = attrs[k]; // class는 className으로 넣음
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) node.setAttribute(k, attrs[k]); // 나머지는 속성으로 넣음
    }); // 속성 처리 끝
    asList(children).forEach(function (c) { // 자식마다
      if (c === null || c === undefined || c === false) return; // 빈 자식은 건너뜀
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); // 문자열은 글자 노드로 붙임
    }); // 자식 처리 끝
    return node; // 만든 요소를 돌려줌
  } // el 끝

  function aspectOf(res) { return res && res['dia:aspect'] ? res['dia:aspect'].value : ''; } // 장면·생활 대상의 측면 값

  function aspectName(aspect, short) { // 측면 표시 이름 '식(食) — 먹는 것' 또는 짧게 '식(食) 먹는 것'
    const i = ASPECT_INFO[aspect]; // 표시 정보
    if (!i) return aspect; // 모르는 값이면 그대로
    return short ? i.ko + '(' + i.hanja + ') ' + i.label : i.ko + '(' + i.hanja + ') — ' + i.label; // 한글·한자·뜻 병기
  } // aspectName 끝

  function groupsOf(res) { // 자원이 속한 문화권 ID 목록
    return asList(res['dcterms:spatial']).map(function (v) { return v.ref; }).filter(function (r) { return r && r.indexOf('group:') === 0; }); // spatial 중 문화권만
  } // groupsOf 끝

  // ===== 출처 표시(개별 자원 화면의 접힘 영역에서만 씀) =====
  function refName(src) { // 출처 ID를 '저자(연도)' 꼴로 바꾸는 함수
    const ref = byId.get(src); // 출처 자원
    if (!ref) return src === 'sources.json' ? '문헌 목록(sources.json)' : src; // 모르는 출처
    const who = asList(ref['dcterms:creator'])[0]; // 첫 저자
    const year = ref['dcterms:date'] && ref['dcterms:date'].value; // 연도
    const roman = who && /\(([^,)]+)/.exec(who.value); // 괄호 안 로마자 이름이 있으면 짧게 씀
    return (roman ? roman[1] : who ? who.value : src) + (year ? '(' + String(year).slice(0, 4) + ')' : ''); // 예: 권기배(2020)
  } // refName 끝

  function pagesText(page) { return /^\d/.test(page) ? page + '쪽' : '「' + page + '」'; } // 숫자 쪽은 '쪽', 웹 문헌 절 이름은 낫표

  function citeLine(cites) { // 근거 목록을 '저자(연도) 쪽, 쪽 · …' 한 줄로 만드는 함수
    const bySrc = {}; // 출처 → 쪽 목록
    const order = []; // 출처 순서
    asList(cites).forEach(function (c) { // 근거마다
      const cut = c.indexOf(':'); // 나누는 위치
      const src = cut < 0 ? c : c.slice(0, cut); // 출처 ID
      const page = cut < 0 ? '' : c.slice(cut + 1); // 쪽
      if (!bySrc[src]) { bySrc[src] = []; order.push(src); } // 처음 보는 출처면 등록
      if (page && bySrc[src].indexOf(page) < 0) bySrc[src].push(page); // 쪽을 중복 없이 추가
    }); // 근거 끝
    if (!order.length) return null; // 근거가 없으면 그리지 않음
    const span = el('span', { class: 'cite' }); // 출처 줄
    order.forEach(function (src, i) { // 출처마다
      if (i) span.appendChild(document.createTextNode(' · ')); // 구분점
      span.appendChild(byId.has(src) ? el('a', { href: itemUrl(src) }, refName(src)) : document.createTextNode(refName(src))); // 출처 이름(링크)
      if (bySrc[src].length) span.appendChild(document.createTextNode(' ' + bySrc[src].map(pagesText).join(', ').replace(/쪽, /g, ', '))); // 쪽수
    }); // 출처 끝
    return span; // 출처 줄
  } // citeLine 끝

  function allCites(res) { // 자원의 모든 값에 붙은 근거를 모으는 함수
    const out = []; // 결과
    Object.keys(res).forEach(function (p) { asList(res[p]).forEach(function (v) { if (v && typeof v === 'object') asList(v.cite).forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); }); }); }); // 값마다 cite 모으기
    return out; // 결과
  } // allCites 끝

  function badgeFor(v) { // 값의 성격(해석·문헌 외·확인 필요)을 배지로 만드는 함수
    if (v.status === '확인 필요') return el('span', { class: 'badge badge-pending' }, '확인 필요'); // 확인 필요
    if (v.basis === '해석') return el('span', { class: 'badge badge-interp', title: '문헌이 보고한 사실이 아니라 해석' }, '해석'); // 해석
    if (v.basis === '문헌 외') return el('span', { class: 'badge badge-pending', title: '문헌에 없는 값' }, '문헌 외'); // 문헌 외
    return null; // 보고된 사실이면 배지 없음
  } // badgeFor 끝

  function refLink(id) { return el('a', { href: itemUrl(id) }, titleOf(byId.get(id)) || id); } // 다른 자원으로 가는 링크

  function valueNode(v, prop) { // 메타데이터 값 하나를 화면 조각으로 만드는 함수(전체 메타데이터용)
    const wrap = el('div', { class: 'value' }); // 값 틀
    if (v.status === '확인 필요') { wrap.appendChild(badgeFor(v)); if (v.note) wrap.appendChild(el('span', { class: 'cite' }, v.note)); return wrap; } // 확인 필요 값
    if (v.ref) wrap.appendChild(refLink(v.ref)); // 참조 값은 링크
    else if (prop === 'dia:sourceLanguage') wrap.appendChild(document.createTextNode((LANG_NAME[v.value] || v.value) + ' (' + v.value + ')')); // 언어 코드는 이름과 함께
    else if (prop === 'bibo:uri') wrap.appendChild(el('a', { href: v.value, rel: 'noopener' }, v.value)); // 바깥 링크
    else if (prop === 'dia:aspect') wrap.appendChild(document.createTextNode(aspectName(v.value) + ' (값: ' + v.value + ')')); // 측면은 표시 이름과 원래 값
    else wrap.appendChild(el('span', { lang: v.lang || null }, String(v.value))); // 그 밖에는 글자
    const b = badgeFor(v); // 성격 배지
    if (b) wrap.appendChild(b); // 있으면 붙임
    if (v.note) wrap.appendChild(el('span', { class: 'cite' }, '메모: ' + v.note)); // 메모
    const c = citeLine(v.cite); // 근거 줄
    if (c) wrap.appendChild(c); // 있으면 붙임
    return wrap; // 값 조각
  } // valueNode 끝

  // ===== 카드(출처 표기 없음) =====
  function sceneSummary(sc) { // 장면의 화면용 요약 문장 배열(없으면 원본 첫 문장)
    const d = D.scenes[sc.id]; // 화면 문안
    if (d && d.summary) return d.summary.map(function (s) { return s.text; }); // 화면용 요약
    const first = asList(sc['dcterms:description']).filter(function (x) { return x.value; })[0]; // 원본 첫 값
    return first ? [first.value] : []; // 대신 사용
  } // sceneSummary 끝

  function flags(res) { // 카드에 남겨야 하는 중요한 구분(문학 속 재현, 확인 필요)
    const out = []; // 결과
    if (res.representation) out.push(el('span', { class: 'badge badge-lit' }, res.representation)); // 문학 속 재현
    const pending = Object.keys(res).some(function (p) { return asList(res[p]).some(function (v) { return v && v.status === '확인 필요'; }); }); // 확인 필요 값이 있는지
    if (pending) out.push(el('span', { class: 'badge badge-pending' }, '확인 필요 있음')); // 확인 필요
    return out; // 배지 목록
  } // flags 끝

  function wordTags(labelIds) { // 장면 카드 안의 '관련 어휘' 작은 태그 줄
    if (!labelIds || !labelIds.length) return null; // 없으면 그리지 않음
    const box = el('p', { class: 'tags' }, [el('span', { class: 'tags-label' }, '관련 어휘')]); // 태그 줄
    labelIds.forEach(function (id) { const l = byId.get(id); box.appendChild(el('a', { class: 'tag', href: itemUrl(id), lang: l['skosxl:literalForm'].lang }, titleOf(l))); }); // 어휘 태그
    return box; // 태그 줄
  } // wordTags 끝

  function sceneCard(sc, opts) { // 생활 장면 카드: 보조 정보 → 제목 → 요약 → 관련 어휘 → 자세히 보기
    opts = opts || {}; // 선택 사항
    const gid = groupsOf(sc)[0]; // 문화권
    const card = el('article', { class: 'scene-card ' + (GROUP_CLASS[gid] || '') }); // 카드 틀(불투명)
    const meta = el('p', { class: 'card-meta' }); // 작은 보조 정보 줄
    if (window.ArchiveIcons) meta.appendChild(window.ArchiveIcons.iconSvg(aspectOf(sc))); // 작은 측면 아이콘
    const bits = []; // 보조 정보 조각
    if (opts.showCulture) bits.push(titleOf(byId.get(gid))); // 여러 문화권이 섞이는 화면에서만 문화권 표시
    if (opts.showAspect) bits.push(aspectName(aspectOf(sc), true)); // 여러 측면이 섞이는 화면에서만 측면 표시
    if (sc['dcterms:temporal'] && sc['dcterms:temporal'].value) bits.push(sc['dcterms:temporal'].value); // 시기
    meta.appendChild(document.createTextNode(bits.join(' · '))); // 보조 정보 글자
    flags(sc).forEach(function (b) { meta.appendChild(b); }); // 중요한 구분 배지
    card.appendChild(meta); // 붙임
    card.appendChild(el('h3', { class: 'card-title' }, el('a', { href: itemUrl(sc.id) }, titleOf(sc)))); // 장면 제목(링크)
    sceneSummary(sc).forEach(function (t) { card.appendChild(el('p', { class: 'card-text' }, t)); }); // 완결된 짧은 설명
    const tags = wordTags((A.sceneLabels || {})[sc.id]); // 직접 연결된 어휘
    if (tags) card.appendChild(tags); // 있으면 붙임
    card.appendChild(el('a', { class: 'more', href: itemUrl(sc.id), 'aria-label': titleOf(sc) + ' 장면 살펴보기' }, '장면 살펴보기 →')); // 자세히 보기
    return card; // 카드
  } // sceneCard 끝

  function labelCard(lab, opts) { // 어휘 카드: 큰 표기 + 뜻 + 자세히 보기
    opts = opts || {}; // 선택 사항
    const gid = groupsOf(lab)[0]; // 문화권
    const card = el('article', { class: 'word-card ' + (GROUP_CLASS[gid] || '') }); // 카드 틀
    const form = lab['skosxl:literalForm']; // 표기
    if (opts.showCulture) card.appendChild(el('p', { class: 'card-meta' }, groupsOf(lab).map(function (g) { return titleOf(byId.get(g)); }).join(' · '))); // 여러 문화권 화면에서만 문화권 표시
    card.appendChild(el('p', { class: 'word', lang: form.lang }, el('a', { href: itemUrl(lab.id) }, form.value))); // 큰 표기
    card.appendChild(el('p', { class: 'card-text' }, lab['dia:gloss'].value)); // 뜻
    return card; // 카드
  } // labelCard 끝

  function conceptCard(c, opts) { // 생활 대상 카드
    const card = el('article', { class: 'word-card' }); // 카드 틀
    card.appendChild(el('p', { class: 'card-meta' }, aspectName(aspectOf(c), true))); // 측면
    card.appendChild(el('p', { class: 'word' }, el('a', { href: itemUrl(c.id) }, titleOf(c)))); // 이름
    if (c['skos:definition'] && c['skos:definition'].value) card.appendChild(el('p', { class: 'card-text' }, c['skos:definition'].value)); // 설명
    return card; // 카드
  } // conceptCard 끝

  function materialCard(m) { // 자료 카드
    const card = el('article', { class: 'word-card' }); // 카드 틀
    card.appendChild(el('p', { class: 'card-meta' }, [groupsOf(m).map(function (g) { return titleOf(byId.get(g)); }).join(' · ') + ' · ' + (m['dcterms:type'] ? m['dcterms:type'].value : '')].concat(flags(m)))); // 문화권·유형·배지
    card.appendChild(el('p', { class: 'word', style: 'font-size:1.2rem' }, el('a', { href: itemUrl(m.id) }, titleOf(m)))); // 제목
    return card; // 카드
  } // materialCard 끝

  // ===== 문화권 전환 메뉴(상단 고정) =====
  function cultureSwitcher() { // 문화권 페이지 위쪽에 고정되는 '전체 지도 보기' 막대를 만드는 함수
    return el('nav', { class: 'culture-switch', 'aria-label': '지도로 돌아가기' }, el('a', { class: 'map-link', href: 'index.html#map-section' }, '← 전체 지도 보기')); // 눈에 띄는 버튼 하나
  } // cultureSwitcher 끝

  // ===== 검색 =====
  function normalize(s) { return String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\-_'’·.,()「」『』<>!?]/g, ''); } // 검색용으로 글자를 고르게 만듦

  function jamo(s) { // 한글 음절을 자모로 풀어 비슷한 표기를 찾기 쉽게 하는 함수
    let out = ''; // 결과
    for (const ch of s) { // 글자마다
      const code = ch.charCodeAt(0) - 0xac00; // 한글 음절 시작점으로부터의 거리
      if (code < 0 || code > 11171) { out += ch; continue; } // 한글 음절이 아니면 그대로
      out += String.fromCharCode(0x1100 + Math.floor(code / 588)) + String.fromCharCode(0x1161 + Math.floor((code % 588) / 28)); // 초성·중성
      if (code % 28) out += String.fromCharCode(0x11a7 + (code % 28)); // 종성
    } // 반복 끝
    return out; // 결과
  } // jamo 끝

  function distance(a, b) { // 두 문자열의 편집 거리
    const row = []; // 이전 줄
    for (let j = 0; j <= b.length; j++) row.push(j); // 첫 줄
    for (let i = 1; i <= a.length; i++) { // a의 글자마다
      let prev = row[0]; // 왼쪽 위
      row[0] = i; // 첫 칸
      for (let j = 1; j <= b.length; j++) { const tmp = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = tmp; } // 삭제·삽입·교체 중 최소
    } // 반복 끝
    return row[b.length]; // 거리
  } // distance 끝

  let INDEX = null; // 검색 색인
  function buildIndex() { // 어휘·생활 대상·생활 장면 색인(이표기는 데이터에 기록된 것만)
    INDEX = []; // 초기화
    A.labels.forEach(function (r) { // 어휘마다
      const t = [{ text: r['skosxl:literalForm'].value, kind: '표기', name: true }]; // 표기
      asList(r['dia:variantForm']).forEach(function (v) { t.push({ text: v.value, kind: '이표기', name: true }); }); // 이표기
      t.push({ text: r['dia:gloss'].value, kind: '뜻' }); // 뜻
      INDEX.push({ id: r.id, type: 'label', terms: t }); // 추가
    }); // 어휘 끝
    A.concepts.forEach(function (r) { INDEX.push({ id: r.id, type: 'concept', terms: [{ text: r['skos:prefLabel'].value, kind: '대표 이름', name: true }].concat(r['skos:definition'] ? [{ text: r['skos:definition'].value, kind: '설명' }] : []) }); }); // 생활 대상
    A.scenes.forEach(function (r) { INDEX.push({ id: r.id, type: 'scene', terms: [{ text: titleOf(r), kind: '제목', name: true }].concat(sceneSummary(r).map(function (s) { return { text: s, kind: '설명' }; })) }); }); // 장면(화면 문안)
    INDEX.forEach(function (e) { e.terms.forEach(function (t) { t.norm = normalize(t.text); }); }); // 비교용 값
  } // buildIndex 끝

  function search(q) { // 검색어로 결과를 찾는 함수
    if (!INDEX) buildIndex(); // 색인 만들기
    const nq = normalize(q); // 정규화
    if (!nq) return []; // 빈 검색어
    const out = []; // 결과
    INDEX.forEach(function (e) { // 항목마다
      let best = null; let score = 0; // 가장 잘 맞은 용어와 점수
      e.terms.forEach(function (t) { const s = t.norm === nq ? (t.name ? 10 : 4) : (t.norm.indexOf(nq) >= 0 ? (t.name ? 6 : 2) : 0); if (s > score) { score = s; best = t; } }); // 일치·포함 점수
      if (score) out.push({ id: e.id, type: e.type, score: score, hit: best }); // 맞은 항목만
    }); // 항목 끝
    return out.sort(function (a, b) { return b.score - a.score; }); // 점수순
  } // search 끝

  function suggest(q) { // 결과가 없을 때 비슷한 표기를 제안하는 함수
    if (!INDEX) buildIndex(); // 색인
    const nq = jamo(normalize(q)); // 자모로 풀기
    const seen = {}; const out = []; // 중복 방지와 결과
    INDEX.forEach(function (e) { e.terms.forEach(function (t) { if (!t.name || seen[t.text]) return; seen[t.text] = true; const d = distance(nq, jamo(t.norm)); if (d <= Math.max(2, Math.ceil(nq.length * 0.4))) out.push({ text: t.text, d: d }); }); }); // 가까운 표기
    return out.sort(function (a, b) { return a.d - b.d; }).slice(0, 6); // 가까운 순 6개
  } // suggest 끝

  // ===== 지도 도구 =====
  function wrapLon(lon) { return lon < 0 ? lon + 360 : lon; } // 하와이(서경)를 태평양 쪽으로 이어 보이게 경도 보정
  function osmLayer() { // OpenStreetMap 타일(저작자 표시 포함)
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }); // 타일 레이어
  } // osmLayer 끝
  function representativePlace(gid) { // 문화권의 장소 가운데 장면이 가장 많이 가리키는 곳(기존 대표 좌표)
    const ids = asList(byId.get(gid)['dcterms:spatial']).map(function (v) { return v.ref; }); // 장소 ID
    let best = ids[0]; let bestN = -1; // 처음 값
    ids.forEach(function (pid) { const p = byId.get(pid); const parent = p && p['dcterms:isPartOf'] ? p['dcterms:isPartOf'].ref : null; const n = A.scenes.filter(function (s) { return asList(s['dcterms:spatial']).some(function (v) { return v.ref === pid || v.ref === parent; }); }).length; if (n > bestN) { best = pid; bestN = n; } }); // 장면 수 비교
    return byId.get(best); // 대표 장소
  } // representativePlace 끝

  // ===== 챗봇 버튼과 채팅 창(준비 중) =====
  function svgIcon(paths) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); s.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g>'; return s; } // 미리 정한 도형만 넣는 작은 아이콘
  const BOT = '<rect x="4" y="8" width="16" height="12" rx="4"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5c1.5 1 3.5 1 5 0"/>'; // 챗봇 얼굴
  const SEND = '<path d="M4 12l16-8-6 16-2-6z"/>'; // 보내기
  function setupChat() { // 떠 있는 챗봇 버튼과 채팅 창을 만드는 함수
    const fab = el('button', { type: 'button', class: 'chat-fab', 'aria-expanded': 'false', 'aria-controls': 'chat-panel' }, [el('span', { class: 'avatar' }, svgIcon(BOT)), el('span', { class: 'label' }, '아카이브 챗봇'), el('span', { class: 'soon' }, '준비 중')]); // 버튼(글자 이름 포함)
    const close = el('button', { type: 'button', class: 'close', 'aria-label': '채팅 창 닫기' }, '×'); // 닫기
    const send = el('button', { type: 'submit', disabled: '', 'aria-label': '보내기(준비 중)' }, svgIcon(SEND)); // 비활성 보내기
    const form = el('form', { class: 'chat-form' }, [el('label', { class: 'sr-only', for: 'chat-input' }, '질문 입력(준비 중이라 쓸 수 없음)'), el('input', { id: 'chat-input', type: 'text', placeholder: '준비 중입니다', disabled: '' }), send]); // 입력 줄
    form.addEventListener('submit', function (e) { e.preventDefault(); }); // 제출해도 아무 일 없음
    const panel = el('section', { class: 'chat-panel', id: 'chat-panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'chat-title', hidden: '' }, [ // 채팅 창
      el('div', { class: 'chat-head' }, [el('span', { class: 'avatar' }, svgIcon(BOT)), el('div', {}, [el('h2', { id: 'chat-title' }, '아카이브 챗봇'), el('p', {}, '아카이브 자료로 답하는 챗봇')]), close]), // 창 머리
      el('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite' }, el('p', { class: 'bubble' }, '준비 중입니다. 곧 이 아카이브의 자료를 바탕으로 질문에 답할 예정입니다.')), // 준비 중 안내(예시 답변 없음)
      form // 입력 줄
    ]); // 창 끝
    document.body.appendChild(fab); // 버튼 추가
    document.body.appendChild(panel); // 창 추가
    function open() { panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); close.focus(); } // 열기
    function shut() { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.focus(); } // 닫기
    fab.addEventListener('click', open); // 버튼으로 열기
    close.addEventListener('click', shut); // 닫기 버튼
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); }); // Esc로 닫기
  } // setupChat 끝

  function setupSearchBox() { const q = new URLSearchParams(location.search).get('q'); ['site-q', 'page-q'].forEach(function (id) { const i = document.getElementById(id); if (q && i) i.value = q; }); } // 검색 결과 화면에서 검색어 유지

  document.addEventListener('DOMContentLoaded', function () { setupChat(); setupSearchBox(); }); // 문서가 준비되면 챗봇과 검색창 연결

  window.Archive = { // 페이지별 스크립트가 쓸 기능 묶음
    data: A, display: D, byId: byId, asList: asList, el: el, classOf: classOf, titleOf: titleOf, groupsOf: groupsOf, // 기본 도구
    itemUrl: itemUrl, archiveUrl: archiveUrl, exhibitionUrl: exhibitionUrl, cultureKey: cultureKey, groupByKey: groupByKey, // 주소
    ASPECTS: ASPECTS, ASPECT_INFO: ASPECT_INFO, ASPECT_BY_KEY: ASPECT_BY_KEY, aspectOf: aspectOf, aspectName: aspectName, // 측면
    sceneCard: sceneCard, labelCard: labelCard, conceptCard: conceptCard, materialCard: materialCard, sceneSummary: sceneSummary, flags: flags, // 카드
    citeLine: citeLine, allCites: allCites, valueNode: valueNode, badgeFor: badgeFor, refLink: refLink, refName: refName, // 출처·메타데이터
    cultureSwitcher: cultureSwitcher, search: search, suggest: suggest, wrapLon: wrapLon, osmLayer: osmLayer, representativePlace: representativePlace, // 탐색 도구
    GROUP_CLASS: GROUP_CLASS, CLASS_NAME: CLASS_NAME, LANG_NAME: LANG_NAME // 표시용 사전
  }; // 묶음 끝
})(); // 즉시 실행 함수 끝
