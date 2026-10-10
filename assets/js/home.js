// 홈: 제목·소개 아래 큰 지도. 마커 프리뷰의 버튼으로 문화권별 아카이브에 들어감
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const H = X.display.home || {}; // 홈 문구

  // 메인 문구(두 줄로 나눈 표제)는 HTML에 직접 적음 — display_text.json의 headline과 같은 문장
  document.getElementById('home-subline').textContent = H.subline || ''; // 둘째 줄
  document.getElementById('home-intro').textContent = H.intro || ''; // 짧은 소개


  function previewOf(g) { // 마커 프리뷰(이름·짧은 소개·아카이브 살펴보기 버튼)를 만드는 함수
    const intro = ((X.display.groups || {})[g.id] || [])[0]; // 화면용 소개 첫 문장
    return el('div', { class: 'preview' }, [ // 프리뷰 틀
      el('p', { class: 'preview-name' }, X.titleOf(g)), // 문화권 이름
      intro ? el('p', { class: 'preview-text' }, intro.text) : null, // 짧은 소개
      el('a', { class: 'btn btn-primary', href: X.archiveUrl(g.id) }, '아카이브 살펴보기 →') // 문화권 페이지로 가는 버튼
    ]); // 프리뷰 끝
  } // previewOf 끝

  function drawMap() { // 큰 지도를 그리는 함수
    const box = document.getElementById('map'); // 지도 자리
    if (!window.L) { box.appendChild(el('p', { class: 'map-error' }, '지도를 불러오지 못했습니다. 헤더의 검색창으로 자료를 찾을 수 있습니다.')); return; } // 라이브러리 실패 안내
    const map = L.map(box, { scrollWheelZoom: true, zoomControl: true, worldCopyJump: false }); // 휠만으로 확대·축소되는 지도
    const tiles = X.osmLayer(); // OSM 타일
    let failed = 0; // 타일 실패 수
    tiles.on('tileerror', function () { failed += 1; if (failed === 4) box.parentNode.insertBefore(el('p', { class: 'map-error', role: 'status' }, '지도 배경을 불러오지 못하고 있습니다. 문화권 이름표는 그대로 누를 수 있습니다.'), box.nextSibling); }); // 타일 실패 안내(한 번만)
    tiles.addTo(map); // 타일 붙임
    const pts = []; // 전체 범위용 좌표
    A.groups.forEach(function (g) { // 문화권마다
      const p = X.representativePlace(g.id); // 기존 대표 장소
      const ll = [p.coords.lat, X.wrapLon(p.coords.lon)]; // 날짜변경선 보정 좌표
      pts.push(ll); // 범위에 추가
      const icon = L.divIcon({ className: 'map-pin ' + X.GROUP_CLASS[g.id], html: '<span>' + X.titleOf(g).replace(/[<>&"]/g, '') + '</span>', iconSize: [0, 0] }); // 문화권 이름표 마커
      L.marker(ll, { icon: icon, keyboard: true, title: X.titleOf(g) + ' 소개 보기', alt: X.titleOf(g) }).addTo(map).bindPopup(previewOf(g), { maxWidth: 280, closeButton: true }); // 누르면 프리뷰 팝업(자동 스크롤 없음)
    }); // 문화권 끝
    const bounds = L.latLngBounds(pts); // 세 문화권이 모두 들어가는 범위
    function fitAll() { map.invalidateSize(); map.fitBounds(bounds, { padding: [60, 60] }); } // 전체 범위로 맞추는 함수
    const Home = L.Control.extend({ options: { position: 'topleft' }, onAdd: function () { const b = L.DomUtil.create('button', 'map-home'); b.type = 'button'; b.textContent = '전체 범위'; b.title = '세 문화권이 모두 보이게'; L.DomEvent.disableClickPropagation(b); L.DomEvent.on(b, 'click', fitAll); return b; } }); // '전체 범위 보기' 버튼
    map.addControl(new Home()); // 버튼 추가
    fitAll(); // 처음 범위
    window.addEventListener('load', fitAll); // 글꼴·스타일이 다 읽힌 뒤 다시 맞춤
    if (window.ResizeObserver) { let lastW = 0; new ResizeObserver(function () { if (box.clientWidth !== lastW) { lastW = box.clientWidth; fitAll(); } }).observe(box); } // 지도 상자 너비가 바뀌면(첫 배치·화면 회전) 다시 맞춤(휠 확대 뒤에는 건드리지 않음)
  } // drawMap 끝

  drawMap(); // 지도 그리기

  const refList = document.getElementById('source-list'); // 참고문헌 자리(홈 아래 소개 영역)
  A.references.forEach(function (ref) { // 출처마다
    const who = X.asList(ref['dcterms:creator']).map(function (v) { return v.value; }).join(', '); // 저자
    const year = ref['dcterms:date'] ? ' (' + ref['dcterms:date'].value + ')' : ''; // 연도
    const where = ref['dcterms:isPartOf'] && ref['dcterms:isPartOf'].value ? ' 『' + ref['dcterms:isPartOf'].value.replace(/[『』]/g, '') + '』' : ''; // 수록지
    const li = el('li', {}, [who + year + '. ', el('a', { href: X.itemUrl(ref.id) }, ref['dcterms:title'].value), where + '.']); // 한 항목
    if (ref.scholarly === false) li.appendChild(el('span', { class: 'badge badge-pending' }, '학술 근거 아님')); // 소설 표시
    if (ref.status === '확인 필요') li.appendChild(el('span', { class: 'badge badge-pending' }, '내용 미추출')); // 열람하지 못한 문헌
    refList.appendChild(li); // 목록에 추가
  }); // 출처 끝
})(); // 즉시 실행 함수 끝
