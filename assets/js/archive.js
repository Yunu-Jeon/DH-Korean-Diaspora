// 문화권 페이지(archive.html?culture=koryo): 지도에서 문화권을 고르면 바로 전시 서사가 나옴
// 순서: 문화권 소개 → 식(食)·호(呼)·사(事)·학(學) 네 장(큐레이터 해설 → 장면 카드 → 이 측면의 어휘)
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const head = document.getElementById('culture-head'); // 머리 자리
  const story = document.getElementById('story'); // 이야기 자리
  const g = X.groupByKey(new URLSearchParams(location.search).get('culture')); // 고른 문화권

  document.getElementById('switch-slot').appendChild(X.cultureSwitcher()); // 위쪽 '전체 지도 보기' 막대

  if (!g) { // 문화권을 고르지 않고 들어온 경우: 지도로 안내
    document.title = '문화권 고르기 — 한 뿌리, 다른 땅'; // 탭 제목
    head.appendChild(el('h1', {}, '문화권을 고르세요')); // 제목
    const links = el('p', { class: 'head-links' }); // 문화권 링크 줄
    A.groups.forEach(function (gg) { links.appendChild(el('a', { class: 'btn', href: X.archiveUrl(gg.id) }, X.titleOf(gg))); }); // 문화권마다 버튼
    head.appendChild(links); // 붙임
    return; // 이야기는 그리지 않음
  } // 안내 끝

  document.title = X.titleOf(g) + ' — 한 뿌리, 다른 땅'; // 탭 제목
  head.className = 'culture-head ' + X.GROUP_CLASS[g.id]; // 문화권 색
  head.appendChild(el('p', { class: 'eyebrow' }, '전시 서사')); // 화면 성격
  head.appendChild(el('h1', {}, X.titleOf(g) + '의 이야기')); // 제목
  ((X.display.groups || {})[g.id] || []).forEach(function (s) { head.appendChild(el('p', { class: 'lead' }, s.text)); }); // 화면용 소개

  const nav = document.getElementById('aspect-tabs'); // 네 장 바로가기
  X.ASPECTS.forEach(function (a) { const i = X.ASPECT_INFO[a]; nav.appendChild(el('a', { class: 'aspect-tab', href: '#' + i.key }, [el('span', { class: 'aspect-ko' }, i.ko + '(' + i.hanja + ')'), el('span', { class: 'aspect-label' }, i.label)])); }); // 네 장으로 바로 이동

  X.ASPECTS.forEach(function (a, n) { // 측면마다 한 장
    const i = X.ASPECT_INFO[a]; // 표시 정보
    const sec = el('section', { class: 'chapter', id: i.key, 'aria-labelledby': 'h-' + i.key }); // 장
    sec.appendChild(el('p', { class: 'chapter-no', 'aria-hidden': 'true' }, String(n + 1).padStart(2, '0'))); // 장 번호(장식)
    sec.appendChild(el('h2', { id: 'h-' + i.key }, X.aspectName(a))); // 장 제목
    const note = (A.curatorNotes || []).filter(function (c) { return c.group === g.id && c.aspect === a; })[0]; // 큐레이터 해설
    if (note) sec.appendChild(el('div', { class: 'curator' }, [el('p', { class: 'curator-tag' }, '큐레이터 해설'), el('p', {}, note.text)])); // 해설(성격 표시, 인용 없음)
    const scenes = A.scenes.filter(function (s) { return X.aspectOf(s) === a && X.groupsOf(s).indexOf(g.id) >= 0; }); // 장면
    if (!scenes.length) sec.appendChild(el('p', { class: 'empty' }, '아직 자료를 찾지 못했습니다.')); // 빈 칸
    else { const grid = el('div', { class: 'card-grid' }); scenes.forEach(function (s) { grid.appendChild(X.sceneCard(s)); }); sec.appendChild(grid); } // 장면 카드(관련 어휘 포함)
    const extra = ((A.aspectLabels || {})[g.id + '|' + a] || []).map(function (id) { return X.byId.get(id); }); // 이 측면의 어휘
    if (extra.length) { sec.appendChild(el('h3', { class: 'section-sub' }, '이 측면의 어휘')); const wall = el('div', { class: 'word-grid' }); extra.forEach(function (l) { wall.appendChild(X.labelCard(l)); }); sec.appendChild(wall); } // 있으면 표시
    story.appendChild(sec); // 붙임
  }); // 측면 끝
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); } // 주소에 장이 있으면 그곳으로
})(); // 즉시 실행 함수 끝
