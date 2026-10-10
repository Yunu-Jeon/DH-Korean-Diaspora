// 모든 페이지가 함께 쓰는 데이터 조회·화면 조각·검색·대화창 기능
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드로 실수를 줄임

  const A = window.ARCHIVE; // site-data/archive.js가 넣어 둔 아카이브 데이터
  const CLASS_KEYS = ['materials', 'scenes', 'concepts', 'labels', 'places', 'groups', 'references']; // 클래스 7개의 데이터 키
  const byId = new Map(); // ID로 자원을 바로 찾기 위한 사전
  CLASS_KEYS.forEach(function (key) { // 클래스마다
    A[key].forEach(function (res) { byId.set(res.id, res); }); // 자원을 ID로 등록
  }); // 등록 끝

  const GROUP_CLASS = { 'group:koryo': 'group-koryo', 'group:zainichi': 'group-zainichi', 'group:hawaii': 'group-hawaii' }; // 문화권 ID → 색 클래스
  const LANG_NAME = { kor: '한국어', rus: '러시아어', jpn: '일본어', eng: '영어' }; // ISO 639-3 코드 → 한국어 이름
  const CLASS_NAME = { material: '자료', scene: '생활 장면', concept: '생활 대상', label: '어휘', place: '장소', group: '문화권', reference: '출처' }; // 클래스 → 화면 이름

  function asList(v) { // 값을 항상 배열로 다루기 위한 함수
    if (v === undefined || v === null) return []; // 값이 없으면 빈 배열
    return Array.isArray(v) ? v : [v]; // 배열이 아니면 한 칸짜리 배열로 감쌈
  } // asList 끝

  function classOf(id) { // ID로 클래스를 알아내는 함수
    const prefix = String(id).split(':')[0]; // 'label:kim-chee' → 'label'
    return CLASS_NAME[prefix] ? prefix : 'reference'; // 접두어가 없으면 출처(예: 'kwon2020')
  } // classOf 끝

  function titleOf(res) { // 자원의 이름을 고르는 함수
    if (!res) return ''; // 자원이 없으면 빈 문자열
    const keys = ['skosxl:literalForm', 'skos:prefLabel', 'dcterms:title']; // 클래스마다 이름 속성이 다름
    for (let i = 0; i < keys.length; i++) { // 이름 속성 후보마다
      const v = res[keys[i]]; // 그 속성 값
      if (v && v.value) return v.value; // 값이 있으면 그것을 이름으로 씀
    } // 반복 끝
    return res.id; // 이름이 없으면 ID를 씀
  } // titleOf 끝

  function itemUrl(id) { // 개별 자원 페이지 주소를 만드는 함수
    return 'item.html?id=' + encodeURIComponent(id); // 상대 경로로 만듦
  } // itemUrl 끝

  function el(tag, attrs, children) { // 요소를 안전하게 만드는 함수(데이터를 innerHTML로 넣지 않기 위해)
    const node = document.createElement(tag); // 요소 생성
    Object.keys(attrs || {}).forEach(function (k) { // 속성마다
      if (k === 'class') node.className = attrs[k]; // class는 className으로 넣음
      else if (k === 'text') node.textContent = attrs[k]; // text는 글자로만 넣음
      else if (attrs[k] !== undefined && attrs[k] !== null) node.setAttribute(k, attrs[k]); // 나머지는 속성으로 넣음
    }); // 속성 처리 끝
    asList(children).forEach(function (c) { // 자식마다
      if (c === null || c === undefined || c === false) return; // 빈 자식은 건너뜀
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); // 문자열은 글자 노드로 붙임
    }); // 자식 처리 끝
    return node; // 만든 요소를 돌려줌
  } // el 끝

  function refName(src) { // 출처 ID를 '저자(연도)' 꼴로 바꾸는 함수
    const ref = byId.get(src); // 출처 자원
    if (!ref) return src; // 모르는 출처면 ID 그대로
    const who = asList(ref['dcterms:creator'])[0]; // 첫 저자
    const year = ref['dcterms:date'] && ref['dcterms:date'].value; // 연도
    const roman = who && /\(([^,)]+)/.exec(who.value); // 괄호 안 로마자 이름이 있으면(예: Iwata-Weickgennant) 짧게 쓰려고 꺼냄
    return (roman ? roman[1] : who ? who.value : src) + (year ? '(' + String(year).slice(0, 4) + ')' : ''); // 예: 권기배(2020)
  } // refName 끝

  function citeNode(cites) { // "출처ID:쪽" 목록을 화면용 한 줄로 만드는 함수
    const list = asList(cites); // 배열로 맞춤
    if (!list.length) return null; // 근거가 없으면 아무것도 그리지 않음
    const span = el('span', { class: 'cite' }, '출처: '); // 출처 줄
    list.forEach(function (c, i) { // 근거마다
      const cut = c.indexOf(':'); // 출처ID와 쪽을 나누는 위치
      const src = cut < 0 ? c : c.slice(0, cut); // 출처ID
      const page = cut < 0 ? '' : c.slice(cut + 1); // 쪽(또는 웹 문헌의 절 이름)
      const where = /^\d/.test(page) ? ' ' + page + '쪽' : (page ? ' 「' + page + '」' : ''); // 숫자면 '쪽', 아니면 절 이름
      if (i) span.appendChild(document.createTextNode(' · ')); // 여러 개면 가운뎃점으로 구분
      if (byId.has(src)) span.appendChild(el('a', { href: itemUrl(src) }, refName(src))); // 출처 페이지로 링크
      else span.appendChild(document.createTextNode(src === 'sources.json' ? '문헌 목록(sources.json)' : src)); // 링크할 곳이 없으면 글자만
      span.appendChild(document.createTextNode(where)); // 쪽수 붙임
    }); // 근거 처리 끝
    return span; // 출처 줄을 돌려줌
  } // citeNode 끝

  function badgeFor(v) { // 값의 성격(해석·문헌 외·확인 필요)을 배지로 만드는 함수
    if (v.status === '확인 필요') return el('span', { class: 'badge badge-pending' }, '확인 필요'); // 확인 필요 배지
    if (v.basis === '해석') return el('span', { class: 'badge badge-interp', title: '문헌이 보고한 사실이 아니라 연구자의 해석' }, '연구자 해석'); // 해석 배지
    if (v.basis === '문헌 외') return el('span', { class: 'badge badge-pending', title: '문헌에 없는 값' }, '문헌 외'); // 문헌 외 배지
    return null; // 보고된 사실이면 배지 없음
  } // badgeFor 끝

  function refLink(id) { // 다른 자원을 가리키는 링크를 만드는 함수
    const res = byId.get(id); // 가리키는 자원
    const a = el('a', { href: itemUrl(id) }, titleOf(res) || id); // 이름을 글자로 한 링크
    if (GROUP_CLASS[id]) a.className = 'chip ' + GROUP_CLASS[id]; // 문화권이면 색 칩으로 보임
    return a; // 링크를 돌려줌
  } // refLink 끝

  function valueNode(v, prop) { // 값 객체 하나를 화면 조각으로 만드는 함수
    const wrap = el('div', { class: 'value' }); // 값을 담을 틀
    if (v.status === '확인 필요') { // 확인 필요 값이면
      wrap.appendChild(badgeFor(v)); // 배지
      if (v.note) wrap.appendChild(el('span', { class: 'cite' }, v.note)); // 사유 설명
      return wrap; // 값 자리는 비워 둠
    } // 확인 필요 처리 끝
    if (v.ref) wrap.appendChild(refLink(v.ref)); // 참조 값이면 링크
    else if (prop === 'dia:sourceLanguage') wrap.appendChild(document.createTextNode((LANG_NAME[v.value] || v.value) + ' (' + v.value + ')')); // 언어 코드는 이름과 함께
    else if (prop === 'bibo:uri') wrap.appendChild(el('a', { href: v.value, rel: 'noopener' }, v.value)); // 링크 값은 바깥 링크
    else wrap.appendChild(el('span', { lang: v.lang || null }, String(v.value))); // 그 밖에는 글자(언어 태그가 있으면 붙임)
    const b = badgeFor(v); // 성격 배지
    if (b) wrap.appendChild(b); // 있으면 붙임
    if (v.note) wrap.appendChild(el('span', { class: 'cite' }, '메모: ' + v.note)); // 값에 붙은 메모
    const c = citeNode(v.cite); // 출처·쪽수 줄
    if (c) wrap.appendChild(c); // 있으면 붙임
    return wrap; // 값 조각을 돌려줌
  } // valueNode 끝

  function groupsOf(res) { // 자원이 속한 문화권 ID 목록을 구하는 함수
    return asList(res['dcterms:spatial']).map(function (v) { return v.ref; }).filter(function (r) { return r && r.indexOf('group:') === 0; }); // spatial 중 문화권만 고름
  } // groupsOf 끝

  function groupChips(res) { // 자원의 문화권을 색 칩으로 만드는 함수
    const box = el('span', { class: 'meta' }); // 칩을 담을 틀
    groupsOf(res).forEach(function (g) { box.appendChild(refLink(g)); }); // 문화권마다 칩
    return box; // 칩 묶음을 돌려줌
  } // groupChips 끝

  function firstCites(res) { // 자원 전체의 근거(dia:citation 또는 source)를 모으는 함수
    if (res['dia:citation'] && res['dia:citation'].length) return res['dia:citation']; // AP의 dia:citation이 있으면 그것
    const out = []; // 모을 배열
    asList(res['dcterms:source']).forEach(function (v) { asList(v.cite).forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); }); }); // source의 cite를 중복 없이 모음
    return out; // 모은 근거를 돌려줌
  } // firstCites 끝

  function citeCompact(cites) { // 근거 목록을 '저자(연도) 쪽, 쪽' 한 줄로 줄여 보여 주는 함수
    const bySrc = {}; // 출처ID → 쪽 목록
    const order = []; // 출처가 처음 나온 순서
    asList(cites).forEach(function (c) { // 근거마다
      const cut = c.indexOf(':'); // 출처ID와 쪽을 나누는 위치
      const src = cut < 0 ? c : c.slice(0, cut); // 출처ID
      const page = cut < 0 ? '' : c.slice(cut + 1); // 쪽
      if (!bySrc[src]) { bySrc[src] = []; order.push(src); } // 처음 보는 출처면 등록
      if (page && bySrc[src].indexOf(page) < 0) bySrc[src].push(page); // 쪽을 중복 없이 추가
    }); // 근거 끝
    if (!order.length) return null; // 근거가 없으면 그리지 않음
    const span = el('span', { class: 'cite' }); // 출처 줄
    order.forEach(function (src, i) { // 출처마다
      if (i) span.appendChild(document.createTextNode(' · ')); // 구분점
      span.appendChild(byId.has(src) ? el('a', { href: itemUrl(src) }, refName(src)) : document.createTextNode(src)); // 출처 링크
      const pages = bySrc[src]; // 그 출처의 쪽들
      if (pages.length) span.appendChild(document.createTextNode(' ' + pages.join(', ') + (/^\d/.test(pages[0]) ? '쪽' : ''))); // 쪽수 붙임
    }); // 출처 끝
    return span; // 출처 줄을 돌려줌
  } // citeCompact 끝

  function labelCard(lab) { // 어휘 카드(큰 글씨 타일)를 만드는 함수
    const gid = groupsOf(lab)[0]; // 첫 문화권
    const card = el('article', { class: 'word-tile ' + (GROUP_CLASS[gid] || '') }); // 문화권 색 타일
    const form = lab['skosxl:literalForm']; // 표기 값
    card.appendChild(el('p', { class: 'word-group' }, titleOf(byId.get(gid)))); // 문화권 이름(작은 글씨)
    card.appendChild(el('p', { class: 'word', lang: form.lang }, el('a', { href: itemUrl(lab.id) }, form.value))); // 큰 글씨 표기(자원 페이지 링크)
    card.appendChild(el('p', { class: 'word-gloss' }, lab['dia:gloss'].value)); // 뜻(두 줄까지만 보임)
    card.appendChild(citeCompact(firstCites(lab))); // 출처·쪽수 한 줄
    return card; // 타일을 돌려줌
  } // labelCard 끝

  const ASPECTS = ['먹는 것', '부르는 것', '일하는 것', '배우는 것']; // 전시의 네 부분(순서대로)
  const ASPECT_KEY = { '먹는 것': 'eat', '부르는 것': 'call', '일하는 것': 'work', '배우는 것': 'learn' }; // 측면 → 주소용 짧은 키

  function aspectOf(res) { // 장면·생활 대상의 측면 값을 꺼내는 함수
    return res && res['dia:aspect'] ? res['dia:aspect'].value : ''; // 없으면 빈 문자열
  } // aspectOf 끝

  function sceneCard(sc) { // 생활 장면 카드(그림 표지 + 제목 + 한 문장)를 만드는 함수
    const gid = groupsOf(sc)[0]; // 첫 문화권
    const card = el('article', { class: 'scene-card ' + (GROUP_CLASS[gid] || '') }); // 카드 틀
    const subject = asList(sc['dcterms:subject'])[0]; // 첫 생활 대상(없을 수 있음)
    const aspect = aspectOf(sc); // 장면의 측면
    const cover = el('div', { class: 'scene-cover', 'aria-hidden': 'true' }); // 그림 표지(장식)
    if (window.ArchiveIcons) cover.appendChild(window.ArchiveIcons.iconSvg(subject ? subject.ref : aspect)); // 대상 아이콘, 대상이 없으면 측면 아이콘
    cover.appendChild(el('span', { class: 'cover-aspect' }, aspect)); // 측면 이름(작은 글씨)
    cover.appendChild(el('span', { class: 'cover-word' }, subject ? titleOf(byId.get(subject.ref)) : titleOf(byId.get(gid)))); // 대상 이름(없으면 문화권 이름)을 큰 글씨로
    card.appendChild(cover); // 표지 붙임
    const body = el('div', { class: 'scene-body' }); // 글 영역
    const meta = el('p', { class: 'scene-meta' }, titleOf(byId.get(gid))); // 문화권 이름
    if (sc['dcterms:temporal'] && sc['dcterms:temporal'].value) meta.appendChild(document.createTextNode(' · ' + sc['dcterms:temporal'].value)); // 시기
    if (sc.representation) meta.appendChild(el('span', { class: 'badge badge-lit' }, sc.representation)); // 문학 속 재현 표시
    body.appendChild(meta); // 메타 줄 붙임
    body.appendChild(el('h4', {}, el('a', { href: itemUrl(sc.id) }, titleOf(sc)))); // 제목(자원 페이지 링크)
    const first = asList(sc['dcterms:description']).filter(function (d) { return d.value; })[0]; // 첫 설명 문장
    if (first) body.appendChild(el('p', { class: 'scene-summary' }, first.value)); // 한 문장 요약
    body.appendChild(citeCompact(firstCites(sc))); // 출처·쪽수 한 줄
    card.appendChild(body); // 글 영역 붙임
    return card; // 카드를 돌려줌
  } // sceneCard 끝

  // ===== 검색 =====
  function normalize(s) { // 검색용으로 글자를 고르게 만드는 함수
    return String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\-_'’·.,()「」『』<>!?]/g, ''); // 대소문자·공백·문장부호 차이를 없앰
  } // normalize 끝

  function jamo(s) { // 한글 음절을 자모로 풀어 비슷한 표기를 찾기 쉽게 하는 함수
    let out = ''; // 결과 문자열
    for (const ch of s) { // 글자마다
      const code = ch.charCodeAt(0) - 0xac00; // 한글 음절 시작점으로부터의 거리
      if (code < 0 || code > 11171) { out += ch; continue; } // 한글 음절이 아니면 그대로
      out += String.fromCharCode(0x1100 + Math.floor(code / 588)); // 초성
      out += String.fromCharCode(0x1161 + Math.floor((code % 588) / 28)); // 중성
      if (code % 28) out += String.fromCharCode(0x11a7 + (code % 28)); // 종성이 있으면 종성
    } // 반복 끝
    return out; // 자모 문자열을 돌려줌
  } // jamo 끝

  function distance(a, b) { // 두 문자열의 편집 거리(레벤슈타인)를 구하는 함수
    const row = []; // 이전 줄 값
    for (let j = 0; j <= b.length; j++) row.push(j); // 첫 줄 초기화
    for (let i = 1; i <= a.length; i++) { // a의 글자마다
      let prev = row[0]; // 왼쪽 위 칸 값
      row[0] = i; // 첫 칸 갱신
      for (let j = 1; j <= b.length; j++) { // b의 글자마다
        const tmp = row[j]; // 다음 계산에 쓸 위 칸 값 보관
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); // 삭제·삽입·교체 중 최소
        prev = tmp; // 왼쪽 위 칸 값 이동
      } // 안쪽 반복 끝
    } // 바깥 반복 끝
    return row[b.length]; // 최종 거리
  } // distance 끝

  let INDEX = null; // 검색 색인(처음 쓸 때 만듦)
  function buildIndex() { // 어휘·생활 대상·생활 장면으로 검색 색인을 만드는 함수
    INDEX = []; // 색인 초기화
    A.labels.forEach(function (r) { // 어휘마다
      const terms = [{ text: r['skosxl:literalForm'].value, kind: '표기', name: true }]; // 표기
      asList(r['dia:variantForm']).forEach(function (v) { terms.push({ text: v.value, kind: '이표기', name: true }); }); // 이표기
      terms.push({ text: r['dia:gloss'].value, kind: '뜻' }); // 뜻
      INDEX.push({ id: r.id, type: 'label', terms: terms }); // 색인에 추가
    }); // 어휘 끝
    A.concepts.forEach(function (r) { // 생활 대상마다
      const terms = [{ text: r['skos:prefLabel'].value, kind: '대표 이름', name: true }]; // 대표 이름
      if (r['skos:definition'] && r['skos:definition'].value) terms.push({ text: r['skos:definition'].value, kind: '설명' }); // 설명
      INDEX.push({ id: r.id, type: 'concept', terms: terms }); // 색인에 추가
    }); // 생활 대상 끝
    A.scenes.forEach(function (r) { // 생활 장면마다
      const terms = [{ text: r['dcterms:title'].value, kind: '제목', name: true }]; // 제목
      asList(r['dcterms:description']).forEach(function (d) { if (d.value) terms.push({ text: d.value, kind: '설명' }); }); // 설명 문장
      INDEX.push({ id: r.id, type: 'scene', terms: terms }); // 색인에 추가
    }); // 생활 장면 끝
    INDEX.forEach(function (e) { e.terms.forEach(function (t) { t.norm = normalize(t.text); }); }); // 비교용 정규화 값을 미리 계산
  } // buildIndex 끝

  function search(q) { // 검색어로 결과를 찾는 함수
    if (!INDEX) buildIndex(); // 색인이 없으면 만듦
    const nq = normalize(q); // 검색어 정규화
    if (!nq) return []; // 빈 검색어면 결과 없음
    const out = []; // 결과 목록
    INDEX.forEach(function (e) { // 색인 항목마다
      let best = null; // 가장 잘 맞은 용어
      let score = 0; // 그 점수
      e.terms.forEach(function (t) { // 용어마다
        let s = 0; // 이 용어의 점수
        if (t.norm === nq) s = t.name ? 10 : 4; // 완전히 같으면 높은 점수
        else if (t.norm.indexOf(nq) >= 0) s = t.name ? 6 : 2; // 포함하면 중간 점수
        if (s > score) { score = s; best = t; } // 더 좋으면 바꿈
      }); // 용어 끝
      if (score) out.push({ id: e.id, type: e.type, score: score, hit: best }); // 맞은 항목만 결과에 넣음
    }); // 색인 끝
    return out.sort(function (a, b) { return b.score - a.score; }); // 점수 높은 순으로 정렬
  } // search 끝

  function suggest(q) { // 결과가 없을 때 비슷한 표기를 제안하는 함수
    if (!INDEX) buildIndex(); // 색인이 없으면 만듦
    const nq = jamo(normalize(q)); // 검색어를 자모까지 풀어 둠
    if (!nq) return []; // 빈 검색어면 제안 없음
    const seen = {}; // 같은 표기를 두 번 제안하지 않기 위한 표
    const cands = []; // 제안 후보
    INDEX.forEach(function (e) { // 색인 항목마다
      e.terms.forEach(function (t) { // 용어마다
        if (!t.name || seen[t.text]) return; // 이름류가 아니거나 이미 본 표기면 건너뜀
        seen[t.text] = true; // 본 표기로 표시
        const d = distance(nq, jamo(t.norm)); // 자모 단위 편집 거리
        const limit = Math.max(2, Math.ceil(nq.length * 0.4)); // 길이에 따라 허용 거리
        if (d <= limit) cands.push({ text: t.text, id: e.id, d: d }); // 가까우면 후보에 넣음
      }); // 용어 끝
    }); // 색인 끝
    return cands.sort(function (a, b) { return a.d - b.d; }).slice(0, 6); // 가까운 순으로 6개까지
  } // suggest 끝

  // ===== 헤더 공통 동작 =====
  function svgIcon(paths, size) { // 챗봇 버튼에 쓰는 작은 선 아이콘을 만드는 함수(미리 정한 도형만 넣음)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); // SVG 요소
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size); // 그림 칸 크기
    svg.setAttribute('aria-hidden', 'true'); // 장식이므로 읽지 않음
    svg.setAttribute('focusable', 'false'); // 초점을 받지 않음
    svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g>'; // 선 도형
    return svg; // 아이콘을 돌려줌
  } // svgIcon 끝

  const BOT_ICON = '<rect x="4" y="8" width="16" height="12" rx="4"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5c1.5 1 3.5 1 5 0"/>'; // 챗봇 얼굴 아이콘
  const SEND_ICON = '<path d="M4 12l16-8-6 16-2-6z"/>'; // 보내기(종이비행기) 아이콘

  function setupChat() { // 오른쪽 아래 챗봇 버튼과 채팅 창을 만들고 연결하는 함수
    const fab = el('button', { type: 'button', class: 'chat-fab', 'aria-expanded': 'false', 'aria-controls': 'chat-panel' }); // 떠 있는 챗봇 버튼
    const avatar = el('span', { class: 'avatar' }); // 동그란 챗봇 얼굴
    avatar.appendChild(svgIcon(BOT_ICON, 24)); // 얼굴 아이콘
    fab.appendChild(avatar); // 버튼에 붙임
    fab.appendChild(el('span', { class: 'label' }, '아카이브 챗봇')); // 버튼 이름
    fab.appendChild(el('span', { class: 'soon' }, '준비 중')); // 준비 중 표시
    const panel = el('section', { class: 'chat-panel', id: 'chat-panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'chat-title', hidden: '' }); // 채팅 창
    const head = el('div', { class: 'chat-head' }); // 창 머리
    const headAvatar = el('span', { class: 'avatar' }); // 머리의 챗봇 얼굴
    headAvatar.appendChild(svgIcon(BOT_ICON, 24)); // 얼굴 아이콘
    head.appendChild(headAvatar); // 붙임
    head.appendChild(el('div', {}, [el('h2', { id: 'chat-title' }, '아카이브 챗봇'), el('p', {}, '아카이브 자료로 답하는 챗봇')])); // 이름과 한 줄 소개
    const close = el('button', { type: 'button', class: 'close', 'aria-label': '채팅 창 닫기' }, '×'); // 닫기 버튼
    head.appendChild(close); // 붙임
    panel.appendChild(head); // 머리 붙임
    const log = el('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite' }); // 대화 내용 영역
    log.appendChild(el('p', { class: 'bubble' }, '준비 중입니다. 곧 이 아카이브의 자료를 바탕으로 질문에 답할 예정입니다.')); // 준비 중 안내(예시 답변은 넣지 않음)
    panel.appendChild(log); // 붙임
    const form = el('form', { class: 'chat-form' }); // 입력 줄
    form.appendChild(el('label', { class: 'sr-only', for: 'chat-input' }, '질문 입력(준비 중이라 쓸 수 없음)')); // 입력칸 이름
    form.appendChild(el('input', { id: 'chat-input', type: 'text', placeholder: '준비 중입니다', disabled: '' })); // 비활성 입력칸
    const send = el('button', { type: 'submit', disabled: '', 'aria-label': '보내기(준비 중)' }); // 비활성 보내기 버튼
    send.appendChild(svgIcon(SEND_ICON, 24)); // 종이비행기 아이콘
    form.appendChild(send); // 붙임
    form.addEventListener('submit', function (e) { e.preventDefault(); }); // 혹시 제출되어도 아무 일도 하지 않음
    panel.appendChild(form); // 붙임
    document.body.appendChild(fab); // 화면에 버튼 추가
    document.body.appendChild(panel); // 화면에 창 추가

    function open() { panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); close.focus(); } // 창 열기: 닫기 버튼으로 초점 이동
    function shut() { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); fab.focus(); } // 창 닫기: 챗봇 버튼으로 초점 복귀
    fab.addEventListener('click', open); // 버튼을 누르면 열기
    close.addEventListener('click', shut); // 닫기 버튼
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); }); // Esc로 닫기
    document.querySelectorAll('[data-chat]').forEach(function (b) { b.addEventListener('click', open); }); // 다른 곳의 챗봇 열기 버튼도 연결
  } // setupChat 끝

  function setupSearchBox() { // 헤더 검색창에 현재 검색어를 채워 두는 함수
    const q = new URLSearchParams(location.search).get('q'); // 주소의 q 값
    const input = document.getElementById('site-q'); // 헤더 검색 입력칸
    if (q && input) input.value = q; // 검색 결과 페이지에서는 검색어를 보여 줌
  } // setupSearchBox 끝

  function wrapLon(lon) { // 하와이처럼 서경인 곳을 아시아 쪽 지도에 이어 보이도록 경도를 바꾸는 함수
    return lon < 0 ? lon + 360 : lon; // 음수 경도는 360을 더함
  } // wrapLon 끝

  function osmLayer() { // OpenStreetMap 타일 레이어(저작자 표시 포함)를 만드는 함수
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { // OSM 타일 주소
      maxZoom: 18, // 최대 확대
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' // 저작자 표시
    }); // 레이어 끝
  } // osmLayer 끝

  function fitWhenReady(map, pts, padding) { // 지도 상자 크기가 정해진 뒤에도 다시 맞추는 함수(처음엔 크기가 0일 수 있음)
    function fit() { map.invalidateSize(); map.fitBounds(pts, { padding: padding }); } // 크기를 다시 재고 범위에 맞춤
    fit(); // 지금 한 번 맞춤
    window.addEventListener('load', fit); // 글꼴·스타일까지 다 읽힌 뒤 다시 맞춤
    if (window.ResizeObserver) new ResizeObserver(fit).observe(map.getContainer()); // 상자 크기가 바뀌면(화면 회전 등) 다시 맞춤
  } // fitWhenReady 끝

  function representativePlace(gid) { // 문화권의 장소 가운데 생활 장면이 가장 많이 가리키는 곳을 고르는 함수
    const g = byId.get(gid); // 문화권 자원
    const ids = asList(g['dcterms:spatial']).map(function (v) { return v.ref; }); // 문화권의 장소 ID
    let best = ids[0]; // 처음엔 첫 장소
    let bestN = -1; // 그 장소를 가리키는 장면 수
    ids.forEach(function (pid) { // 장소마다
      const p = byId.get(pid); // 장소 자원
      const parentId = p && p['dcterms:isPartOf'] ? p['dcterms:isPartOf'].ref : null; // 상위 장소
      const n = A.scenes.filter(function (s) { return asList(s['dcterms:spatial']).some(function (v) { return v.ref === pid || v.ref === parentId; }); }).length; // 이 장소(또는 상위 장소)를 가리키는 장면 수
      if (n > bestN) { best = pid; bestN = n; } // 더 많으면 바꿈
    }); // 장소 끝
    return byId.get(best); // 대표 장소 자원
  } // representativePlace 끝

  document.addEventListener('DOMContentLoaded', function () { // 문서가 준비되면
    setupChat(); // 챗봇 버튼과 채팅 창 만들기
    setupSearchBox(); // 검색창 채우기
  }); // 준비 처리 끝

  window.Archive = { // 페이지별 스크립트가 쓸 기능 묶음
    data: A, byId: byId, asList: asList, classOf: classOf, titleOf: titleOf, itemUrl: itemUrl, el: el, // 기본 도구
    citeNode: citeNode, valueNode: valueNode, badgeFor: badgeFor, refLink: refLink, refName: refName, // 값·출처 표시
    groupsOf: groupsOf, groupChips: groupChips, labelCard: labelCard, sceneCard: sceneCard, citeCompact: citeCompact, firstCites: firstCites, // 카드·칩
    search: search, suggest: suggest, wrapLon: wrapLon, osmLayer: osmLayer, // 검색·지도
    fitWhenReady: fitWhenReady, representativePlace: representativePlace, // 지도 맞춤·대표 장소
    ASPECTS: ASPECTS, ASPECT_KEY: ASPECT_KEY, aspectOf: aspectOf, // 네 측면
    GROUP_CLASS: GROUP_CLASS, CLASS_NAME: CLASS_NAME, LANG_NAME: LANG_NAME // 표시용 사전
  }; // 묶음 끝
})(); // 즉시 실행 함수 끝
