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
    lead.textContent = '‘' + X.titleOf(concept) + '’을(를) ' + howMany + ' 문화권에서는 이렇게 불렀습니다.'; // 안내 문장
    const box = document.getElementById('compare'); // 카드 자리
    byConcept[best.id].forEach(function (lab) { box.appendChild(X.labelCard(lab)); }); // 어휘 카드들
  } // drawCompare 끝

  function drawGroups() { // 문화권 카드를 그리는 함수
    const box = document.getElementById('group-cards'); // 카드 자리
    A.groups.forEach(function (g) { // 문화권마다
      const card = X.el('article', { class: 'card group-bar ' + X.GROUP_CLASS[g.id] }); // 문화권 색 띠 카드
      card.appendChild(X.el('h3', {}, X.el('a', { href: 'collection.html#' + g.id.split(':')[1] }, X.titleOf(g)))); // 이름(컬렉션의 해당 문화권으로)
      const first = X.asList(g['dcterms:description']).filter(function (d) { return d.value; })[0]; // 첫 설명 문장
      if (first) { card.appendChild(X.el('p', {}, first.value)); card.appendChild(X.citeNode(first.cite)); } // 설명과 출처
      const nScene = A.scenes.filter(function (s) { return X.groupsOf(s).indexOf(g.id) >= 0; }).length; // 이 문화권의 장면 수
      const nLabel = A.labels.filter(function (s) { return X.groupsOf(s).indexOf(g.id) >= 0; }).length; // 이 문화권의 어휘 수
      card.appendChild(X.el('p', { class: 'cite' }, '생활 장면 ' + nScene + ' · 어휘 ' + nLabel)); // 건수
      box.appendChild(card); // 카드 추가
    }); // 문화권 끝
  } // drawGroups 끝

  drawHeroMap(); // 히어로 지도 그리기
  drawCompare(); // 비교 카드 그리기
  drawGroups(); // 문화권 카드 그리기
})(); // 즉시 실행 함수 끝
