// 문화권별 아카이브(archive.html?culture=koryo): 한 문화권의 모든 정보를 한 페이지에 모음
// 순서: 소개 → 식·호·일·학 네 측면(장면 카드 + 이 측면의 어휘) → 측면을 정하지 않은 말 → 생활 대상 → 장소 → 자료
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const g = X.groupByKey(new URLSearchParams(location.search).get('culture')) || A.groups[0]; // 문화권(없거나 틀리면 첫 문화권)
  const mine = function (r) { return X.groupsOf(r).indexOf(g.id) >= 0; }; // 이 문화권의 자원인지

  document.title = X.titleOf(g) + ' 아카이브 — 한 뿌리, 다른 땅'; // 탭 제목
  document.querySelectorAll('.main-nav a[data-culture]').forEach(function (a) { if (a.getAttribute('data-culture') === X.cultureKey(g.id)) a.setAttribute('aria-current', 'page'); }); // 상단 메뉴에서 현재 문화권 표시
  document.getElementById('switch-slot').appendChild(X.cultureSwitcher(g.id, function (gid) { return X.archiveUrl(gid) + location.hash; })); // 문화권 전환 메뉴(보던 측면 위치 유지)

  const head = document.getElementById('culture-head'); // 머리 자리
  head.className = 'culture-head ' + X.GROUP_CLASS[g.id]; // 문화권 색
  head.appendChild(el('p', { class: 'eyebrow' }, '문화권별 아카이브')); // 작은 머리글
  head.appendChild(el('h1', {}, X.titleOf(g))); // 문화권 이름
  ((X.display.groups || {})[g.id] || []).forEach(function (s) { head.appendChild(el('p', { class: 'lead' }, s.text)); }); // 화면용 소개 문장
  head.appendChild(el('p', { class: 'head-links' }, el('a', { class: 'btn btn-primary', href: X.exhibitionUrl(g.id) }, '전시 서사 읽기 →'))); // 전시 서사로

  const nav = document.getElementById('aspect-tabs'); // 바로가기 자리
  function scenesOf(a) { return A.scenes.filter(function (s) { return X.aspectOf(s) === a && mine(s); }); } // 이 문화권·측면의 장면
  X.ASPECTS.forEach(function (a) { const i = X.ASPECT_INFO[a]; nav.appendChild(el('a', { class: 'aspect-tab', href: '#' + i.key }, [el('span', { class: 'aspect-ko' }, i.ko + '(' + i.hanja + ')'), el('span', { class: 'aspect-label' }, i.label), el('span', { class: 'aspect-count' }, scenesOf(a).length + '장면')])); }); // 네 측면으로 바로 가기

  const body = document.getElementById('archive-body'); // 본문 자리
  function grid(items, make, cls) { const box = el('div', { class: cls }); items.forEach(function (r) { box.appendChild(make(r)); }); return box; } // 카드 격자 만들기

  X.ASPECTS.forEach(function (a) { // 측면마다
    const i = X.ASPECT_INFO[a]; // 표시 정보
    const sec = el('section', { class: 'chapter', id: i.key, 'aria-labelledby': 'h-' + i.key }); // 측면 영역
    sec.appendChild(el('h2', { id: 'h-' + i.key }, X.aspectName(a))); // 측면 제목
    sec.appendChild(el('p', { class: 'aspect-desc' }, i.desc)); // 측면 설명(UI 문구)
    const scenes = scenesOf(a); // 장면
    sec.appendChild(scenes.length ? grid(scenes, function (s) { return X.sceneCard(s); }, 'card-grid') : el('p', { class: 'empty' }, '아직 자료를 찾지 못했습니다.')); // 장면 카드(관련 어휘 포함)
    const extra = ((A.aspectLabels || {})[g.id + '|' + a] || []).map(function (id) { return X.byId.get(id); }); // 장면과 직접 이어지지 않은 이 측면의 어휘
    if (extra.length) { sec.appendChild(el('h3', { class: 'section-sub' }, '이 측면의 어휘')); sec.appendChild(el('p', { class: 'hint' }, '이 측면의 생활 대상을 가리키지만 위 장면들과 직접 연결이 확인되지 않은 말입니다.')); sec.appendChild(grid(extra, function (l) { return X.labelCard(l); }, 'word-grid')); } // 있으면 표시
    body.appendChild(sec); // 붙임
  }); // 측면 끝

  function section(id, title, hint, list, make, cls) { // 측면 밖 정보 묶음을 만드는 함수
    if (!list.length) return; // 없으면 만들지 않음
    const sec = el('section', { class: 'chapter', id: id, 'aria-labelledby': 'h-' + id }, [el('h2', { id: 'h-' + id }, title)]); // 영역
    if (hint) sec.appendChild(el('p', { class: 'hint' }, hint)); // 안내
    sec.appendChild(grid(list, make, cls)); // 카드
    body.appendChild(sec); // 붙임
  } // section 끝

  section('words', '측면을 정하지 않은 말', '호칭이나 활동을 가리키는 말처럼, 데이터에 가리키는 생활 대상이 없어 측면을 정할 근거가 없는 말입니다.', ((A.freeLabels || {})[g.id] || []).map(function (id) { return X.byId.get(id); }), function (l) { return X.labelCard(l); }, 'word-grid'); // 측면 없는 말
  const conceptIds = new Set(); // 이 문화권의 장면·어휘가 가리키는 생활 대상
  A.scenes.filter(mine).forEach(function (s) { X.asList(s['dcterms:subject']).forEach(function (v) { conceptIds.add(v.ref); }); }); // 장면이 다루는 대상
  A.labels.filter(mine).forEach(function (l) { if (l['dia:denotes']) conceptIds.add(l['dia:denotes'].ref); }); // 어휘가 가리키는 대상
  section('concepts', '생활 대상', '이 문화권의 장면과 말이 가리키는 음식·사물·일·제도입니다.', A.concepts.filter(function (c) { return conceptIds.has(c.id); }), function (c) { return X.conceptCard(c); }, 'word-grid'); // 생활 대상
  const placeIds = X.asList(g['dcterms:spatial']).map(function (v) { return v.ref; }); // 이 문화권의 장소
  section('places', '장소', '지도 좌표는 문헌에 없는 근사값입니다.', placeIds.map(function (id) { return X.byId.get(id); }), function (p) { return el('article', { class: 'word-card' }, [el('p', { class: 'card-meta' }, '장소'), el('p', { class: 'word', style: 'font-size:1.2rem' }, el('a', { href: X.itemUrl(p.id) }, X.titleOf(p)))]); }, 'word-grid'); // 장소
  section('materials', '자료', '문헌 속에 인용된 1차 자료입니다. 이용 조건을 확인하기 전에는 이미지를 싣지 않습니다.', A.materials.filter(mine), function (m) { return X.materialCard(m); }, 'word-grid'); // 자료

  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); } // 주소에 측면이 있으면 그곳으로
})(); // 즉시 실행 함수 끝
