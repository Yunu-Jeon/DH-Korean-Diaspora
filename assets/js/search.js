// 검색 결과: 어휘·생활 대상·생활 장면을 이표기까지 찾고, 종류·문화권 패싯으로 거름(주소로 복원 가능)
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const box = document.getElementById('search-results'); // 결과 자리
  const p = new URLSearchParams(location.search); // 주소 매개변수
  const q = (p.get('q') || '').trim(); // 검색어
  const state = { type: p.get('type') || 'all', culture: p.get('culture') || 'all' }; // 패싯 상태
  const TYPE_NAME = { label: '어휘', concept: '생활 대상', scene: '생활 장면' }; // 결과 종류 이름

  if (!q) { box.appendChild(el('p', {}, '헤더의 검색창에 찾을 말을 입력해 주세요.')); return; } // 빈 검색어 안내
  document.getElementById('search-title').textContent = '‘' + q + '’ 검색 결과'; // 제목
  document.title = q + ' 검색 — 한 뿌리, 다른 땅'; // 탭 제목
  const all = X.search(q); // 검색 실행

  function cultures(r) { return r.type === 'concept' ? [] : X.groupsOf(X.byId.get(r.id)).map(X.cultureKey); } // 결과의 문화권 키

  function facet(key, options) { // 패싯 버튼 줄
    const row = el('div', { class: 'pill-row', role: 'group', 'aria-label': key === 'type' ? '종류' : '문화권' }); // 줄
    [['all', '전체']].concat(options).forEach(function (o) { const b = el('button', { type: 'button', class: 'pill', 'aria-pressed': String(state[key] === o[0]) }, o[1]); b.addEventListener('click', function () { state[key] = o[0]; draw(); }); row.appendChild(b); }); // 버튼
    return row; // 줄
  } // facet 끝

  function draw() { // 결과를 그리는 함수
    const u = new URLSearchParams({ q: q }); // 주소 매개변수
    Object.keys(state).forEach(function (k) { if (state[k] !== 'all') u.set(k, state[k]); }); // 패싯 값
    history.replaceState(null, '', 'search.html?' + u); // 주소 갱신
    box.textContent = ''; // 지우기
    if (!all.length) { // 결과가 0건이면
      box.appendChild(el('p', {}, '찾은 결과가 없습니다.')); // 안내
      const sug = X.suggest(q); // 비슷한 표기
      if (sug.length) { const pp = el('p', {}, '혹시 이 표기를 찾으셨나요? '); sug.forEach(function (s, i) { if (i) pp.appendChild(document.createTextNode(' · ')); pp.appendChild(el('a', { href: 'search.html?q=' + encodeURIComponent(s.text) }, s.text)); }); box.appendChild(pp); } // 제안
      else box.appendChild(el('p', {}, ['비슷한 표기도 찾지 못했습니다. ', el('a', { href: 'index.html#map-section' }, '지도'), '에서 문화권을 골라 둘러볼 수 있습니다.'])); // 제안도 없음
      return; // 끝
    } // 0건 끝
    const filters = el('div', { class: 'filters panel' }, [facet('type', Object.keys(TYPE_NAME).map(function (k) { return [k, TYPE_NAME[k]]; })), facet('culture', A.groups.map(function (g) { return [X.cultureKey(g.id), X.titleOf(g)]; }))]); // 패싯 두 줄
    box.appendChild(filters); // 붙임
    const res = all.filter(function (r) { return (state.type === 'all' || r.type === state.type) && (state.culture === 'all' || cultures(r).indexOf(state.culture) >= 0); }); // 패싯 적용
    box.appendChild(el('p', { class: 'result-count' }, res.length + '건')); // 결과 수
    if (!res.length) { box.appendChild(el('p', { class: 'empty' }, '이 조건의 결과는 없습니다.')); return; } // 패싯 0건
    ['label', 'concept', 'scene'].forEach(function (t) { // 종류마다
      const hits = res.filter(function (r) { return r.type === t; }); // 이 종류
      if (!hits.length) return; // 없으면 건너뜀
      box.appendChild(el('h2', { class: 'section-sub' }, TYPE_NAME[t] + ' ' + hits.length)); // 소제목
      const grid = el('div', { class: t === 'scene' ? 'card-grid' : 'word-grid' }); // 격자
      hits.forEach(function (r) { // 결과마다
        const res2 = X.byId.get(r.id); // 자원
        const card = t === 'label' ? X.labelCard(res2, { showCulture: true }) : t === 'scene' ? X.sceneCard(res2, { showCulture: true, showAspect: true }) : X.conceptCard(res2); // 카드
        if (r.hit.kind === '이표기') card.appendChild(el('p', { class: 'hint' }, '이표기 ‘' + r.hit.text + '’로 찾음')); // 이표기로 찾았으면 알림
        grid.appendChild(card); // 추가
      }); // 끝
      box.appendChild(grid); // 붙임
    }); // 종류 끝
  } // draw 끝

  draw(); // 그리기
})(); // 즉시 실행 함수 끝
