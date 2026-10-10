// 문화권별 아카이브(archive.html?culture=koryo&tab=eat&f=검색어)
// 정보가 늘어나도 다루기 쉽게: 탭으로 한 묶음씩, 문화권 안 거르기, 12개씩 '더 보기'
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const PAGE = 12; // 한 번에 보여 줄 카드 수
  const params = new URLSearchParams(location.search); // 주소 매개변수
  document.querySelectorAll('.main-nav a[data-archive]').forEach(function (a) { a.setAttribute('aria-current', 'page'); }); // 상단 메뉴에서 '아카이브'를 현재 위치로 표시
  if (!X.groupByKey(params.get('culture'))) { // 문화권을 아직 고르지 않았으면 고르는 화면을 보여 줌
    document.title = '아카이브 — 한 뿌리, 다른 땅'; // 탭 제목
    const head = document.getElementById('culture-head'); // 머리 자리
    head.className = 'culture-head'; // 기본 모양
    head.appendChild(el('p', { class: 'eyebrow' }, '아카이브')); // 작은 머리글
    head.appendChild(el('h1', {}, '문화권을 고르세요')); // 제목
    document.querySelector('.in-culture').hidden = true; // 거르기 입력칸은 숨김
    const box = el('div', { class: 'card-grid' }); // 문화권 카드 격자
    A.groups.forEach(function (gg) { // 문화권마다
      const n = function (list) { return list.filter(function (r) { return X.groupsOf(r).indexOf(gg.id) >= 0; }).length; }; // 이 문화권의 건수
      const intro = ((X.display.groups || {})[gg.id] || [])[0]; // 화면용 소개 첫 문장
      box.appendChild(el('article', { class: 'scene-card ' + X.GROUP_CLASS[gg.id] }, [ // 카드
        el('h2', { class: 'card-title' }, el('a', { href: X.archiveUrl(gg.id) }, X.titleOf(gg))), // 이름(링크)
        intro ? el('p', { class: 'card-text' }, intro.text) : null, // 소개
        el('p', { class: 'card-meta' }, '장면 ' + n(A.scenes) + ' · 어휘 ' + n(A.labels)), // 건수
        el('a', { class: 'more', href: X.archiveUrl(gg.id) }, X.titleOf(gg) + ' 아카이브 열기 →') // 들어가기
      ])); // 카드 끝
    }); // 문화권 끝
    document.getElementById('archive-body').appendChild(box); // 화면에 붙임
    return; // 문화권 화면은 그리지 않음
  } // 고르는 화면 끝
  const g = X.groupByKey(params.get('culture')); // 고른 문화권
  const mine = function (r) { return X.groupsOf(r).indexOf(g.id) >= 0; }; // 이 문화권의 자원인지
  const norm = function (s) { return String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ''); }; // 거르기용 글자 정규화

  // ----- 탭에 들어갈 자원 묶음(데이터의 참조만 사용) -----
  const conceptIds = new Set(); // 이 문화권의 장면·어휘가 가리키는 생활 대상
  A.scenes.filter(mine).forEach(function (s) { X.asList(s['dcterms:subject']).forEach(function (v) { conceptIds.add(v.ref); }); }); // 장면이 다루는 대상
  A.labels.filter(mine).forEach(function (l) { if (l['dia:denotes']) conceptIds.add(l['dia:denotes'].ref); }); // 어휘가 가리키는 대상
  const TABS = X.ASPECTS.map(function (a) { // 네 측면 탭
    const i = X.ASPECT_INFO[a]; // 표시 정보
    return { key: i.key, ko: i.ko + '(' + i.hanja + ')', label: i.label, desc: i.desc, aspect: a, items: A.scenes.filter(function (s) { return mine(s) && X.aspectOf(s) === a; }), kind: 'scene' }; // 장면 묶음
  }).concat([ // 측면 밖의 탭
    { key: 'words', ko: '말', label: '어휘 전체', desc: '이 문화권에서 쓰인 모든 말입니다. 이표기로도 거를 수 있습니다.', items: A.labels.filter(mine), kind: 'label' }, // 어휘
    { key: 'concepts', ko: '대상', label: '생활 대상', desc: '이 문화권의 장면과 말이 가리키는 음식·사물·일·제도입니다.', items: A.concepts.filter(function (c) { return conceptIds.has(c.id); }), kind: 'concept' }, // 생활 대상
    { key: 'places', ko: '장소', label: '장소', desc: '지도 좌표는 문헌에 없는 근사값입니다.', items: X.asList(g['dcterms:spatial']).map(function (v) { return X.byId.get(v.ref); }), kind: 'place' }, // 장소
    { key: 'materials', ko: '자료', label: '1차 자료', desc: '문헌 속에 인용된 1차 자료입니다. 이용 조건을 확인하기 전에는 이미지를 싣지 않습니다.', items: A.materials.filter(mine), kind: 'material' } // 자료
  ]); // 탭 끝
  const state = { tab: (TABS.filter(function (t) { return t.key === params.get('tab'); })[0] || TABS[0]).key, f: params.get('f') || '', shown: PAGE }; // 현재 탭·거르기어·보이는 수

  function textOf(r, kind) { // 거르기에 쓸 자원의 글(이름·요약·이표기·뜻)
    if (kind === 'scene') return X.titleOf(r) + ' ' + X.sceneSummary(r).join(' ') + ' ' + ((A.sceneLabels[r.id] || []).map(function (id) { return X.titleOf(X.byId.get(id)); }).join(' ')); // 장면: 제목·요약·관련 어휘
    if (kind === 'label') return X.titleOf(r) + ' ' + X.asList(r['dia:variantForm']).map(function (v) { return v.value; }).join(' ') + ' ' + r['dia:gloss'].value; // 어휘: 표기·이표기·뜻
    return X.titleOf(r) + ' ' + ((r['skos:definition'] || {}).value || ''); // 그 밖: 이름·설명
  } // textOf 끝

  function card(r, kind) { // 종류에 맞는 카드
    if (kind === 'scene') return X.sceneCard(r); // 장면
    if (kind === 'label') return X.labelCard(r); // 어휘
    if (kind === 'concept') return X.conceptCard(r); // 생활 대상
    if (kind === 'material') return X.materialCard(r); // 자료
    return el('article', { class: 'word-card' }, [el('p', { class: 'card-meta' }, '장소'), el('p', { class: 'word', style: 'font-size:1.2rem' }, el('a', { href: X.itemUrl(r.id) }, X.titleOf(r)))]); // 장소
  } // card 끝

  // ----- 머리와 공통 메뉴 -----
  document.title = X.titleOf(g) + ' 아카이브 — 한 뿌리, 다른 땅'; // 탭 제목
  const head = document.getElementById('culture-head'); // 머리 자리
  head.className = 'culture-head ' + X.GROUP_CLASS[g.id]; // 문화권 색
  head.appendChild(el('p', { class: 'eyebrow' }, '문화권별 아카이브')); // 작은 머리글
  head.appendChild(el('h1', {}, X.titleOf(g))); // 문화권 이름
  ((X.display.groups || {})[g.id] || []).forEach(function (s) { head.appendChild(el('p', { class: 'lead' }, s.text)); }); // 화면용 소개
  head.appendChild(el('p', { class: 'head-links' }, el('a', { class: 'btn btn-primary', href: X.exhibitionUrl(g.id) }, '전시 서사 읽기 →'))); // 전시 서사로

  const tabBox = document.getElementById('aspect-tabs'); // 탭 자리
  const panel = document.getElementById('archive-body'); // 내용 자리
  const filter = document.getElementById('in-culture'); // 문화권 안 거르기 입력칸
  filter.value = state.f; // 주소에 있던 거르기어 복원
  filter.placeholder = X.titleOf(g) + ' 안에서 거르기 (예: 김치, 빵)'; // 안내 글
  filter.addEventListener('input', function () { state.f = filter.value; state.shown = PAGE; save(); render(); }); // 입력하면 바로 거름

  function save() { // 상태를 주소에 남기는 함수(새로고침·공유 가능)
    const q = new URLSearchParams({ culture: X.cultureKey(g.id) }); // 문화권
    if (state.tab !== TABS[0].key) q.set('tab', state.tab); // 탭
    if (state.f) q.set('f', state.f); // 거르기어
    history.replaceState(null, '', 'archive.html?' + q); // 주소 갱신
    document.getElementById('switch-slot').replaceChildren(X.cultureSwitcher(g.id, function (gid) { return 'archive.html?culture=' + X.cultureKey(gid) + (state.tab !== TABS[0].key ? '&tab=' + state.tab : ''); })); // 문화권 전환 메뉴(같은 탭 유지)
  } // save 끝

  function matches(t) { const f = norm(state.f); return f ? t.items.filter(function (r) { return norm(textOf(r, t.kind)).indexOf(f) >= 0; }) : t.items; } // 거르기어에 맞는 자원

  function render() { // 탭과 내용을 그리는 함수
    tabBox.textContent = ''; // 탭 지우기
    TABS.forEach(function (t) { // 탭마다
      const n = matches(t).length; // 거른 뒤 건수
      const b = el('button', { type: 'button', class: 'aspect-tab' + (t.aspect ? '' : ' aspect-tab-sub'), 'aria-pressed': String(t.key === state.tab) }, [el('span', { class: 'aspect-ko' }, t.ko), el('span', { class: 'aspect-label' }, t.label), el('span', { class: 'aspect-count' }, n + '건')]); // 탭 버튼(건수 포함)
      b.addEventListener('click', function () { state.tab = t.key; state.shown = PAGE; save(); render(); document.getElementById('panel-title').focus(); }); // 탭 바꾸기
      tabBox.appendChild(b); // 추가
    }); // 탭 끝

    const t = TABS.filter(function (x) { return x.key === state.tab; })[0]; // 현재 탭
    const list = matches(t); // 보일 자원
    panel.textContent = ''; // 내용 지우기
    panel.appendChild(el('h2', { id: 'panel-title', tabindex: '-1' }, t.aspect ? X.aspectName(t.aspect) : t.label)); // 제목
    panel.appendChild(el('p', { class: 'aspect-desc' }, t.desc + (state.f ? ' — ‘' + state.f + '’로 거른 결과 ' + list.length + '건' : ''))); // 설명과 거른 결과 수
    if (!list.length) { panel.appendChild(el('p', { class: 'empty' }, state.f ? '거르기어에 맞는 자료가 없습니다.' : '아직 자료를 찾지 못했습니다.')); } // 빈 상태
    else { // 있으면
      const box = el('div', { class: t.kind === 'scene' ? 'card-grid' : 'word-grid' }); // 격자
      list.slice(0, state.shown).forEach(function (r) { box.appendChild(card(r, t.kind)); }); // 보이는 만큼 카드
      panel.appendChild(box); // 붙임
      if (list.length > state.shown) { const more = el('button', { type: 'button', class: 'btn more-btn' }, '더 보기 (' + (list.length - state.shown) + '건 남음)'); more.addEventListener('click', function () { const first = state.shown; state.shown += PAGE; render(); const next = panel.querySelectorAll('.card-grid > *, .word-grid > *')[first]; if (next) { const a = next.querySelector('a'); if (a) a.focus(); } }); panel.appendChild(more); } // 더 보기(새로 보인 첫 카드로 초점)
    } // 목록 끝
    if (t.aspect && !state.f) { // 측면 탭이면 장면과 직접 이어지지 않은 이 측면의 어휘도
      const extra = ((A.aspectLabels || {})[g.id + '|' + t.aspect] || []).map(function (id) { return X.byId.get(id); }); // 이 측면의 어휘
      if (extra.length) { panel.appendChild(el('h3', { class: 'section-sub' }, '이 측면의 어휘')); panel.appendChild(el('p', { class: 'hint' }, '이 측면의 생활 대상을 가리키지만 위 장면들과 직접 연결이 확인되지 않은 말입니다.')); const w = el('div', { class: 'word-grid' }); extra.forEach(function (l) { w.appendChild(X.labelCard(l)); }); panel.appendChild(w); } // 표시
    } // 끝
  } // render 끝

  save(); // 처음 주소·전환 메뉴
  render(); // 처음 그리기
})(); // 즉시 실행 함수 끝
