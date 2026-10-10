// 컬렉션 페이지: 문화권별 묶음 + Leaflet 지도에서 문화권 고르기
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const bar = document.getElementById('filter-bar'); // 문화권 버튼 줄
  const holder = document.getElementById('collection-groups'); // 문화권 묶음 자리
  const buttons = {}; // 키 → 버튼
  const sections = {}; // 문화권 ID → 섹션 요소
  let current = 'all'; // 지금 고른 문화권('all'은 전체)

  function keyOf(gid) { return gid.split(':')[1]; } // 'group:koryo' → 'koryo'

  function makeButton(key, text, cls) { // 문화권 고르기 버튼을 만드는 함수
    const b = el('button', { type: 'button', class: 'btn ' + (cls || ''), 'aria-pressed': 'false' }, text); // 눌림 상태를 알리는 토글 버튼
    b.addEventListener('click', function () { select(key, true); }); // 누르면 그 문화권을 고름
    bar.appendChild(b); // 버튼 줄에 추가
    buttons[key] = b; // 나중에 상태를 바꾸려고 보관
  } // makeButton 끝

  function select(key, fromUser) { // 문화권을 고르는 함수
    current = buttons[key] ? key : 'all'; // 모르는 키면 전체
    Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-pressed', String(k === current)); }); // 버튼 눌림 상태 갱신
    Object.keys(sections).forEach(function (gid) { sections[gid].hidden = !(current === 'all' || keyOf(gid) === current); }); // 고른 문화권만 보임
    if (fromUser) history.replaceState(null, '', current === 'all' ? location.pathname : '#' + current); // 주소에 선택 상태를 남김(뒤로 가기 기록은 늘리지 않음)
  } // select 끝

  function groupSection(g) { // 문화권 하나의 묶음을 만드는 함수
    const sec = el('section', { class: 'exhibit-section ' + X.GROUP_CLASS[g.id], id: 'sec-' + keyOf(g.id), 'aria-labelledby': 'h-' + keyOf(g.id) }); // 섹션 틀
    const head = el('header'); // 머리
    head.appendChild(el('h2', { id: 'h-' + keyOf(g.id) }, el('a', { href: X.itemUrl(g.id) }, X.titleOf(g)))); // 문화권 이름(자원 페이지 링크)
    X.asList(g['dcterms:description']).forEach(function (d) { head.appendChild(X.valueNode(d)); }); // 이동 개요 문장과 출처
    sec.appendChild(head); // 머리 붙임

    const scenes = A.scenes.filter(function (s) { return X.groupsOf(s).indexOf(g.id) >= 0; }); // 이 문화권의 장면
    sec.appendChild(el('h3', {}, '생활 장면 (' + scenes.length + ')')); // 장면 소제목
    const sg = el('div', { class: 'grid' }); // 장면 카드 격자
    scenes.forEach(function (s) { sg.appendChild(X.sceneCard(s)); }); // 장면 카드
    sec.appendChild(sg); // 격자 붙임

    const labels = A.labels.filter(function (s) { return X.groupsOf(s).indexOf(g.id) >= 0; }); // 이 문화권의 어휘
    sec.appendChild(el('h3', { style: 'margin-top:28px' }, '어휘 (' + labels.length + ')')); // 어휘 소제목
    const lg = el('div', { class: 'grid-tight' }); // 어휘 카드 격자
    labels.forEach(function (l) { lg.appendChild(X.labelCard(l)); }); // 어휘 카드
    sec.appendChild(lg); // 격자 붙임

    const places = X.asList(g['dcterms:spatial']).map(function (v) { return v.ref; }); // 이 문화권의 장소 ID
    sec.appendChild(el('h3', { style: 'margin-top:28px' }, '장소 (' + places.length + ')')); // 장소 소제목
    const pl = el('ul', { class: 'plain-list' }); // 장소 목록
    places.forEach(function (pid) { pl.appendChild(el('li', {}, X.refLink(pid))); }); // 장소 링크
    sec.appendChild(pl); // 목록 붙임
    return sec; // 섹션을 돌려줌
  } // groupSection 끝

  function drawMap() { // 장소를 문화권 색으로 찍고, 표식으로 문화권을 고르게 하는 지도
    const box = document.getElementById('collection-map'); // 지도 자리
    if (!window.L || !box) return; // 라이브러리가 없으면 그리지 않음
    const map = L.map(box, { scrollWheelZoom: false, worldCopyJump: false }); // 지도 생성(스크롤로 페이지가 내려가도록 휠 확대는 끔)
    X.osmLayer().addTo(map); // OSM 타일과 저작자 표시
    const pts = []; // 화면 맞춤용 좌표
    A.groups.forEach(function (g) { // 문화권마다
      const color = getComputedStyle(document.documentElement).getPropertyValue('--' + keyOf(g.id)).trim(); // 문화권 색
      X.asList(g['dcterms:spatial']).forEach(function (v) { // 장소마다
        const p = X.byId.get(v.ref); // 장소 자원
        if (!p || !p.coords) return; // 좌표가 없으면 건너뜀
        const ll = [p.coords.lat, X.wrapLon(p.coords.lon)]; // 날짜변경선 보정한 좌표
        pts.push(ll); // 맞춤용 목록에 추가
        const m = L.circleMarker(ll, { radius: 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.95 }).addTo(map); // 원 표식
        m.bindTooltip(X.titleOf(p) + ' · ' + X.titleOf(g)); // 마우스를 올리면 이름
        m.on('click', function () { // 표식을 누르면
          select(keyOf(g.id), true); // 그 문화권을 고름
          const popup = el('div', {}, [el('strong', {}, X.titleOf(p)), el('br'), el('a', { href: X.itemUrl(p.id) }, '장소 자세히 보기')]); // 장소 링크가 든 팝업 내용
          m.bindPopup(popup).openPopup(); // 팝업 열기
        }); // 클릭 처리 끝
      }); // 장소 끝
    }); // 문화권 끝
    X.fitWhenReady(map, pts, [30, 30]); // 모든 장소가 보이게 맞춤(상자 크기가 정해진 뒤에도 다시)
  } // drawMap 끝

  makeButton('all', '전체'); // 전체 버튼
  A.groups.forEach(function (g) { // 문화권마다
    makeButton(keyOf(g.id), X.titleOf(g), 'chip-btn ' + X.GROUP_CLASS[g.id]); // 문화권 버튼
    sections[g.id] = groupSection(g); // 섹션 만들기
    holder.appendChild(sections[g.id]); // 화면에 붙임
  }); // 문화권 끝
  drawMap(); // 지도 그리기
  select(location.hash.slice(1) || 'all', false); // 주소의 #koryo 같은 값으로 처음 상태를 정함
  window.addEventListener('hashchange', function () { select(location.hash.slice(1) || 'all', false); }); // 주소가 바뀌면 다시 고름
})(); // 즉시 실행 함수 끝
