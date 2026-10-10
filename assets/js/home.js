// 메인 페이지: 히어로 지도, '같은 대상, 다른 이름', 문화권 카드
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터

  function drawHeroMap() { // 세 문화권 위치만 단순하게 찍는 지도를 그리는 함수
    const box = document.getElementById('hero-map'); // 지도 자리
    if (!window.L || !box) return; // 지도 라이브러리가 없으면 그리지 않음
    const map = L.map(box, { // 지도 생성
      zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, // 확대·이동을 막아 그림처럼 보이게 함
      boxZoom: false, keyboard: false, touchZoom: false, tap: false, attributionControl: true // 키보드 초점도 받지 않게 함(자세한 탐색은 컬렉션에서)
    }); // 지도 생성 끝
    X.osmLayer().addTo(map); // OSM 타일과 저작자 표시
    const pts = []; // 화면 맞춤에 쓸 좌표 목록
    A.groups.forEach(function (g) { // 문화권마다
      const place = X.representativePlace(g.id); // 생활 장면이 가장 많이 가리키는 대표 장소
      const c = [place.coords.lat, X.wrapLon(place.coords.lon)]; // 대표 위치(하와이는 날짜변경선 보정)
      pts.push(c); // 좌표 목록에 추가
      const color = getComputedStyle(document.documentElement).getPropertyValue('--' + g.id.split(':')[1]).trim(); // 문화권 색
      L.circleMarker(c, { radius: 9, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1, interactive: false }) // 점 표시
        .bindTooltip(X.titleOf(g), { permanent: true, direction: 'top', offset: [0, -8], className: 'map-label' }) // 늘 보이는 이름표
        .addTo(map); // 지도에 추가
    }); // 문화권 끝
    X.fitWhenReady(map, pts, [60, 60]); // 세 점이 모두 보이게 맞춤(상자 크기가 정해진 뒤에도 다시)
  } // drawHeroMap 끝

  function drawCompare() { // 여러 문화권에서 다르게 불리는 생활 대상 하나를 골라 보여 주는 함수
    const byConcept = {}; // 생활 대상 → 어휘 목록
    A.labels.forEach(function (lab) { // 어휘마다
      const den = lab['dia:denotes']; // 가리키는 대상
      if (den && den.ref) (byConcept[den.ref] = byConcept[den.ref] || []).push(lab); // 대상별로 묶음
    }); // 묶기 끝
    let best = null; // 문화권 수가 가장 많은 대상
    Object.keys(byConcept).forEach(function (cid) { // 대상마다
      const groups = new Set(); // 그 대상을 부르는 문화권들
      byConcept[cid].forEach(function (lab) { X.groupsOf(lab).forEach(function (g) { groups.add(g); }); }); // 문화권 모음
      if (!best || groups.size > best.n) best = { id: cid, n: groups.size }; // 더 많으면 바꿈
    }); // 대상 끝
    if (!best || best.n < 2) return; // 둘 이상 문화권에 걸친 대상이 없으면 그리지 않음
    const concept = X.byId.get(best.id); // 고른 생활 대상
    const lead = document.getElementById('compare-lead'); // 안내 문장 자리
    const howMany = { 2: '두', 3: '세' }[best.n] || String(best.n); // 문화권 수를 우리말 수사로
    lead.textContent = '‘' + X.titleOf(concept) + '’ 하나를 ' + howMany + ' 문화권에서는 이렇게 불렀습니다.'; // 안내 문장
    const box = document.getElementById('compare'); // 나무 그림 자리
    const leaves = byConcept[best.id]; // 갈래가 될 어휘들
    const root = X.el('a', { class: 'tree-root', href: X.itemUrl(best.id) }); // 뿌리: 생활 대상(자원 페이지 링크)
    if (window.ArchiveIcons) root.appendChild(window.ArchiveIcons.iconSvg(best.id)); // 대상 아이콘
    root.appendChild(document.createTextNode(X.titleOf(concept))); // 대상 이름
    box.appendChild(root); // 뿌리 붙임
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); // 뿌리에서 갈래로 뻗는 선(장식)
    svg.setAttribute('class', 'tree-lines'); // 스타일용 클래스
    svg.setAttribute('viewBox', '0 0 100 56'); // 가로 100 기준 좌표
    svg.setAttribute('preserveAspectRatio', 'none'); // 화면 너비에 맞게 늘림
    svg.setAttribute('aria-hidden', 'true'); // 장식이므로 읽지 않음
    let paths = ''; // 선 경로 모음
    leaves.forEach(function (lab, i) { // 갈래마다
      const x = (i + 0.5) * 100 / leaves.length; // 그 타일 가운데의 가로 위치
      paths += '<path d="M50 0 C50 30 ' + x + ' 26 ' + x + ' 56" fill="none" stroke="currentColor" stroke-width="1.2" vector-effect="non-scaling-stroke"/>'; // 뿌리에서 타일로 휘어 내려가는 선(숫자만 들어감)
    }); // 갈래 끝
    svg.innerHTML = paths; // 선 넣기
    box.appendChild(svg); // 선 붙임
    const row = X.el('div', { class: 'tree-leaves', style: '--n:' + leaves.length }); // 갈래 타일 줄
    leaves.forEach(function (lab) { row.appendChild(X.labelCard(lab)); }); // 어휘 타일
    box.appendChild(row); // 줄 붙임
  } // drawCompare 끝

  function drawGroups() { // 문화권 타일을 그리는 함수(글은 줄이고 숫자로 보여 줌)
    const box = document.getElementById('group-cards'); // 타일 자리
    A.groups.forEach(function (g) { // 문화권마다
      const tile = X.el('article', { class: 'group-tile ' + X.GROUP_CLASS[g.id] }); // 문화권 색 타일
      tile.appendChild(X.el('h3', {}, X.el('a', { href: 'collection.html#' + g.id.split(':')[1] }, X.titleOf(g)))); // 이름(타일 전체가 컬렉션 링크)
      const nScene = A.scenes.filter(function (s) { return X.groupsOf(s).indexOf(g.id) >= 0; }).length; // 이 문화권의 장면 수
      const nLabel = A.labels.filter(function (s) { return X.groupsOf(s).indexOf(g.id) >= 0; }).length; // 이 문화권의 어휘 수
      const nPlace = X.asList(g['dcterms:spatial']).length; // 이 문화권의 장소 수
      const stats = X.el('p', { class: 'group-stats' }); // 숫자 줄
      [[nScene, '생활 장면'], [nLabel, '어휘'], [nPlace, '장소']].forEach(function (s) { stats.appendChild(X.el('span', {}, [X.el('b', {}, String(s[0])), s[1]])); }); // 숫자와 이름
      tile.appendChild(stats); // 숫자 줄 붙임
      box.appendChild(tile); // 타일 추가
    }); // 문화권 끝
  } // drawGroups 끝

  drawHeroMap(); // 히어로 지도 그리기
  drawCompare(); // 나무 그림 그리기
  drawGroups(); // 문화권 타일 그리기
})(); // 즉시 실행 함수 끝
