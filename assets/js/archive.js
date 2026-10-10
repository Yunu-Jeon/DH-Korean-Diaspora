// 문화권별 아카이브(archive.html?culture=koryo&aspect=eat): 측면 하나를 골라 장면·어휘를 탐색
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const params = new URLSearchParams(location.search); // 주소 매개변수
  const g = X.groupByKey(params.get('culture')) || A.groups[0]; // 문화권(없거나 틀리면 첫 문화권)
  let aspect = X.ASPECT_BY_KEY[params.get('aspect')] || X.ASPECTS[0]; // 측면(없으면 식)

  document.title = X.titleOf(g) + ' 아카이브 — 한 뿌리, 다른 땅'; // 탭 제목
  document.getElementById('switch-slot').appendChild(X.cultureSwitcher(g.id, function (gid) { return X.archiveUrl(gid, aspect); })); // 문화권 전환 메뉴(측면 유지)
  const head = document.getElementById('culture-head'); // 머리 자리
  head.className = 'culture-head ' + X.GROUP_CLASS[g.id]; // 문화권 색
  head.appendChild(el('p', { class: 'eyebrow' }, '문화권별 아카이브')); // 작은 머리글
  head.appendChild(el('h1', {}, X.titleOf(g))); // 문화권 이름
  ((X.display.groups || {})[g.id] || []).forEach(function (s) { head.appendChild(el('p', { class: 'lead' }, s.text)); }); // 화면용 소개 문장
  head.appendChild(el('p', { class: 'head-links' }, [el('a', { class: 'btn btn-primary', href: X.exhibitionUrl(g.id) }, '전시 서사 읽기 →'), el('a', { class: 'btn', href: X.itemUrl(g.id) }, '문화권 자료 정보')])); // 전시 서사와 문화권 상세로

  const tabs = document.getElementById('aspect-tabs'); // 측면 탭 자리
  const panel = document.getElementById('aspect-panel'); // 측면 내용 자리

  function scenesOf(a) { return A.scenes.filter(function (s) { return X.aspectOf(s) === a && X.groupsOf(s).indexOf(g.id) >= 0; }); } // 이 문화권·측면의 장면

  function drawTabs() { // 식·호·일·학 탭을 그리는 함수
    tabs.textContent = ''; // 지우기
    X.ASPECTS.forEach(function (a) { // 측면마다
      const i = X.ASPECT_INFO[a]; // 표시 정보
      const on = a === aspect; // 현재 측면인지
      const link = el('a', { class: 'aspect-tab', href: X.archiveUrl(g.id, a), 'aria-current': on ? 'true' : null }, [el('span', { class: 'aspect-ko' }, i.ko + '(' + i.hanja + ')'), el('span', { class: 'aspect-label' }, i.label), el('span', { class: 'aspect-count' }, scenesOf(a).length + '장면')]); // 한글·한자·뜻·장면 수
      link.addEventListener('click', function (e) { e.preventDefault(); aspect = a; history.replaceState(null, '', X.archiveUrl(g.id, a)); render(); document.getElementById('panel-title').focus(); }); // 페이지를 다시 열지 않고 바꿈(주소는 갱신)
      tabs.appendChild(link); // 추가
    }); // 측면 끝
  } // drawTabs 끝

  function render() { // 고른 측면의 내용을 그리는 함수
    drawTabs(); // 탭 상태 갱신
    document.getElementById('switch-slot').replaceChildren(X.cultureSwitcher(g.id, function (gid) { return X.archiveUrl(gid, aspect); })); // 전환 메뉴 주소도 현재 측면으로 갱신
    panel.textContent = ''; // 지우기
    const i = X.ASPECT_INFO[aspect]; // 표시 정보
    panel.appendChild(el('h2', { id: 'panel-title', tabindex: '-1' }, X.aspectName(aspect))); // 측면 제목
    panel.appendChild(el('p', { class: 'aspect-desc' }, i.desc)); // 측면 설명(UI 문구)
    const scenes = scenesOf(aspect); // 장면
    if (!scenes.length) panel.appendChild(el('p', { class: 'empty' }, '아직 자료를 찾지 못했습니다.')); // 빈 칸
    else { const grid = el('div', { class: 'card-grid' }); scenes.forEach(function (s) { grid.appendChild(X.sceneCard(s)); }); panel.appendChild(grid); } // 장면 카드 격자

    const extra = ((A.aspectLabels || {})[g.id + '|' + aspect] || []).map(function (id) { return X.byId.get(id); }); // 장면과 직접 이어지지 않은 이 측면의 어휘
    panel.appendChild(el('h3', { class: 'section-sub' }, '이 측면의 어휘')); // 소제목
    panel.appendChild(el('p', { class: 'hint' }, '이 측면의 생활 대상을 가리키지만 위 장면들과 직접 연결이 확인되지 않은 말입니다. 장면과 연결된 말은 각 카드의 ‘관련 어휘’에 있습니다.')); // 안내
    if (extra.length) { const wall = el('div', { class: 'word-grid' }); extra.forEach(function (l) { wall.appendChild(X.labelCard(l)); }); panel.appendChild(wall); } // 어휘 카드
    else panel.appendChild(el('p', { class: 'empty small' }, '따로 둔 어휘가 없습니다.')); // 없으면
    panel.appendChild(el('p', {}, el('a', { class: 'btn', href: X.collectionUrl(g.id, aspect) }, '컬렉션에서 이 문화권·측면 전체 보기 →'))); // 필터가 걸린 컬렉션으로
  } // render 끝

  const free = ((A.freeLabels || {})[g.id] || []).map(function (id) { return X.byId.get(id); }); // 가리키는 생활 대상이 없는 말
  const freeBox = document.getElementById('free-words'); // 자리
  if (free.length) { // 있으면
    freeBox.appendChild(el('h2', {}, '측면을 정하지 않은 말')); // 제목
    freeBox.appendChild(el('p', { class: 'hint' }, '호칭이나 활동을 가리키는 말처럼, 데이터에 가리키는 생활 대상이 없어 측면을 정할 근거가 없는 말입니다.')); // 안내
    const wall = el('div', { class: 'word-grid' }); // 카드 격자
    free.forEach(function (l) { wall.appendChild(X.labelCard(l)); }); // 어휘 카드
    freeBox.appendChild(wall); // 붙임
  } // 끝

  render(); // 처음 그리기
})(); // 즉시 실행 함수 끝
