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
    return (who ? who.value.split(' (')[0] : src) + (year ? '(' + String(year).slice(0, 4) + ')' : ''); // 예: 권기배(2020)
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

  function labelCard(lab) { // 어휘 카드를 만드는 함수
    const card = el('article', { class: 'card label-card ' + (GROUP_CLASS[groupsOf(lab)[0]] || '') }); // 첫 문화권 색을 씀
    card.appendChild(groupChips(lab)); // 문화권 칩
    const form = lab['skosxl:literalForm']; // 표기 값
    card.appendChild(el('p', { class: 'form', lang: form.lang }, el('a', { href: itemUrl(lab.id) }, form.value))); // 큰 글씨 표기(자원 페이지 링크)
    const variants = asList(lab['dia:variantForm']).map(function (v) { return v.value; }); // 이표기 목록
    if (variants.length) card.appendChild(el('p', { class: 'variants' }, '이표기 · ' + variants.join(', '))); // 이표기 줄
    card.appendChild(el('p', { class: 'gloss' }, lab['dia:gloss'].value)); // 뜻
    const den = lab['dia:denotes']; // 가리키는 생활 대상
    if (den && den.ref) card.appendChild(el('p', { class: 'cite' }, ['가리키는 대상: ', refLink(den.ref)])); // 대상 링크
    card.appendChild(citeNode(firstCites(lab))); // 출처·쪽수
    return card; // 카드를 돌려줌
  } // labelCard 끝

  function sceneCard(sc) { // 생활 장면 카드를 만드는 함수
    const card = el('article', { class: 'card scene-card group-bar ' + (GROUP_CLASS[groupsOf(sc)[0]] || '') }); // 문화권 색 띠
    const meta = groupChips(sc); // 문화권 칩
    if (sc['dcterms:temporal'] && sc['dcterms:temporal'].value) meta.appendChild(el('span', { class: 'chip' }, sc['dcterms:temporal'].value)); // 시기 칩
    card.appendChild(meta); // 칩 줄 붙임
    card.appendChild(el('h3', {}, el('a', { href: itemUrl(sc.id) }, titleOf(sc)))); // 제목(자원 페이지 링크)
    const ul = el('ul'); // 설명 문장 목록
    asList(sc['dcterms:description']).forEach(function (d) { // 설명 문장마다
      const li = el('li', {}, d.value); // 문장
      const b = badgeFor(d); // 해석 여부 배지
      if (b) li.appendChild(b); // 있으면 붙임
      li.appendChild(citeNode(d.cite)); // 문장별 출처·쪽수
      ul.appendChild(li); // 목록에 추가
    }); // 설명 처리 끝
    card.appendChild(ul); // 목록 붙임
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
  function setupAsk() { // '자료에게 묻기' 대화창을 연결하는 함수
    const dlg = document.getElementById('ask-dialog'); // 대화창 요소
    if (!dlg) return; // 없으면 아무것도 하지 않음
    let opener = null; // 대화창을 연 버튼(닫은 뒤 초점을 돌려주기 위해)
    document.querySelectorAll('[data-ask]').forEach(function (btn) { // 묻기 버튼마다
      btn.addEventListener('click', function () { // 누르면
        opener = btn; // 연 버튼 기억
        dlg.showModal(); // 모달 대화창 열기(Esc로 닫힘)
        dlg.querySelector('[data-close]').focus(); // 닫기 버튼으로 초점 이동
      }); // 클릭 처리 끝
    }); // 버튼 연결 끝
    dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); }); // 닫기 버튼
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); // 바깥 어두운 곳을 누르면 닫기
    dlg.addEventListener('close', function () { if (opener) opener.focus(); }); // 닫히면 연 버튼으로 초점 복귀
  } // setupAsk 끝

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
    setupAsk(); // 대화창 연결
    setupSearchBox(); // 검색창 채우기
  }); // 준비 처리 끝

  window.Archive = { // 페이지별 스크립트가 쓸 기능 묶음
    data: A, byId: byId, asList: asList, classOf: classOf, titleOf: titleOf, itemUrl: itemUrl, el: el, // 기본 도구
    citeNode: citeNode, valueNode: valueNode, badgeFor: badgeFor, refLink: refLink, refName: refName, // 값·출처 표시
    groupsOf: groupsOf, groupChips: groupChips, labelCard: labelCard, sceneCard: sceneCard, firstCites: firstCites, // 카드·칩
    search: search, suggest: suggest, wrapLon: wrapLon, osmLayer: osmLayer, // 검색·지도
    fitWhenReady: fitWhenReady, representativePlace: representativePlace, // 지도 맞춤·대표 장소
    GROUP_CLASS: GROUP_CLASS, CLASS_NAME: CLASS_NAME, LANG_NAME: LANG_NAME // 표시용 사전
  }; // 묶음 끝
})(); // 즉시 실행 함수 끝
