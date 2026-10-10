// 메인(전시) 페이지: 지도에서 문화권 고르기 → 네 측면의 이야기(장면 → 그 장면을 부르던 말)
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const story = document.getElementById('story'); // 이야기 자리
  const buttonBox = document.getElementById('group-buttons'); // 지도 아래 버튼 자리
  const buttons = {}; // 문화권 ID → 버튼
  const pins = {}; // 문화권 ID → 지도 표식

  function keyOf(gid) { return gid.split(':')[1]; } // 'group:koryo' → 'koryo'

  function drawMap() { // 세 문화권을 이름표로 찍은 지도를 그리는 함수
    const box = document.getElementById('hero-map'); // 지도 자리
    if (!window.L || !box) return; // 지도 라이브러리가 없으면 그리지 않음(버튼으로는 고를 수 있음)
    const map = L.map(box, { scrollWheelZoom: false, zoomControl: true }); // 지도 생성(휠 확대는 꺼서 페이지 스크롤을 막지 않음)
    X.osmLayer().addTo(map); // OSM 타일과 저작자 표시
    const pts = []; // 화면 맞춤용 좌표
    A.groups.forEach(function (g) { // 문화권마다
      const place = X.representativePlace(g.id); // 장면이 가장 많이 가리키는 대표 장소
      const ll = [place.coords.lat, X.wrapLon(place.coords.lon)]; // 대표 좌표(하와이는 날짜변경선 보정)
      pts.push(ll); // 맞춤용 목록에 추가
      const icon = L.divIcon({ className: 'map-pin ' + X.GROUP_CLASS[g.id], html: '<span>' + X.titleOf(g).replace(/[<>&"]/g, '') + '</span>', iconSize: [0, 0] }); // 문화권 색 알약 이름표(꺾쇠 등은 지워 안전하게)
      const marker = L.marker(ll, { icon: icon, keyboard: true, title: X.titleOf(g) + ' 이야기 보기', alt: X.titleOf(g) }).addTo(map); // Tab으로 옮겨 Enter로 누를 수 있는 표식
      marker.on('click', function () { select(g.id, true); }); // 누르면 그 문화권을 고름
      pins[g.id] = marker; // 나중에 강조하려고 보관
    }); // 문화권 끝
    X.fitWhenReady(map, pts, [50, 50]); // 세 이름표가 모두 보이게 맞춤
  } // drawMap 끝

  function drawButtons() { // 지도 아래 문화권 버튼을 만드는 함수(키보드·화면읽기용 대안)
    A.groups.forEach(function (g) { // 문화권마다
      const b = el('button', { type: 'button', class: 'pill ' + X.GROUP_CLASS[g.id], 'aria-pressed': 'false' }, X.titleOf(g)); // 눌림 상태를 알리는 버튼
      b.addEventListener('click', function () { select(g.id, true); }); // 누르면 그 문화권을 고름
      buttonBox.appendChild(b); // 버튼 줄에 추가
      buttons[g.id] = b; // 보관
    }); // 문화권 끝
  } // drawButtons 끝

  function labelsFor(gid, aspect) { // 이 문화권·측면 자리에 놓을 어휘를 고르는 함수(내보내기 스크립트가 계산한 자리 사용)
    return A.labels.filter(function (l) { // 어휘마다
      return (A.labelPlacement[l.id] || []).some(function (p) { return p[0] === gid && p[1] === aspect; }); // 자리 목록에 (문화권, 측면)이 있으면
    }); // 거르기 끝
  } // labelsFor 끝

  function noteFor(gid, aspect) { // 큐레이터 해설 문단을 찾는 함수
    return (A.curatorNotes || []).filter(function (n) { return n.group === gid && n.aspect === aspect; })[0]; // 첫 번째 해설
  } // noteFor 끝

  function aspectSection(g, aspect, i) { // 측면 한 부분(해설 → 장면 → 말)을 만드는 함수
    const gid = g.id; // 문화권 ID
    const key = X.ASPECT_KEY[aspect]; // 주소용 짧은 키
    const sec = el('section', { class: 'aspect', id: keyOf(gid) + '-' + key, 'aria-labelledby': 'h-' + key }); // 측면 영역
    const title = el('div', { class: 'aspect-title' }); // 제목 줄
    title.appendChild(window.ArchiveIcons.iconSvg(aspect)); // 측면 아이콘
    const scenes = A.scenes.filter(function (s) { return X.aspectOf(s) === aspect && X.groupsOf(s).indexOf(gid) >= 0; }); // 이 칸의 장면
    title.appendChild(el('div', {}, [el('h3', { id: 'h-' + key }, (i + 1) + '. ' + aspect), el('span', { class: 'count' }, '장면 ' + scenes.length)])); // 번호·측면 이름·장면 수
    sec.appendChild(title); // 제목 줄 붙임

    const note = noteFor(gid, aspect); // 큐레이터 해설
    if (note) sec.appendChild(el('p', { class: 'curator' }, [el('span', { class: 'tag' }, '큐레이터 해설'), note.text])); // 해석임을 표시한 해설 문단

    if (!scenes.length) { // 장면이 없으면
      sec.appendChild(el('p', { class: 'empty' }, '아직 자료를 찾지 못했습니다.')); // 지어내지 않고 그대로 알림
      return sec; // 이 부분은 여기까지
    } // 빈 칸 처리 끝
    const strip = el('div', { class: 'strip', tabindex: '0', role: 'region', 'aria-label': g['dcterms:title'].value + ' ' + aspect + ' 장면 목록(좌우로 넘겨 보기)' }); // 키보드로도 넘길 수 있는 가로 띠
    scenes.forEach(function (s) { strip.appendChild(X.sceneCard(s)); }); // 장면 카드
    sec.appendChild(strip); // 띠 붙임

    sec.appendChild(el('h4', { class: 'sub' }, '그 장면을 부르던 말')); // 어휘 소제목
    const labels = labelsFor(gid, aspect); // 이 자리의 어휘
    if (labels.length) { // 있으면
      const wall = el('div', { class: 'word-wall' }); // 큰 글씨 카드 벽
      labels.forEach(function (l) { wall.appendChild(X.labelCard(l)); }); // 어휘 카드
      sec.appendChild(wall); // 붙임
    } else { // 없으면
      sec.appendChild(el('p', { class: 'empty' }, '아직 자료를 찾지 못했습니다.')); // 그대로 알림
    } // 어휘 끝
    return sec; // 측면 영역을 돌려줌
  } // aspectSection 끝

  function renderStory(gid) { // 고른 문화권의 이야기 전체를 그리는 함수
    const g = X.byId.get(gid); // 문화권 자원
    story.textContent = ''; // 이전 이야기 지우기
    story.className = 'story ' + X.GROUP_CLASS[gid]; // 문화권 색 적용
    const head = el('header', { class: 'story-head' }); // 이야기 머리
    head.appendChild(el('span', { class: 'big', 'aria-hidden': 'true' }, String(A.groups.indexOf(g) + 1).padStart(2, '0'))); // 큰 번호(장식)
    head.appendChild(el('h2', { id: 'story-title', tabindex: '-1' }, g['dcterms:title'].value + '의 이야기')); // 제목(선택 후 초점이 옮겨 옴)
    const intro = X.asList(g['dcterms:description']).filter(function (d) { return d.value; })[0]; // 첫 이동 개요
    if (intro) head.appendChild(el('p', {}, [intro.value, ' ', X.citeCompact(intro.cite)])); // 개요 한 문장과 출처
    story.appendChild(head); // 머리 붙임

    const nav = el('nav', { class: 'aspect-nav glass', 'aria-label': '네 부분 바로가기' }); // 측면 바로가기(떠 있는 알약 줄)
    X.ASPECTS.forEach(function (a, i) { nav.appendChild(el('a', { class: 'pill', href: '#' + keyOf(gid) + '-' + X.ASPECT_KEY[a] }, (i + 1) + ' ' + a)); }); // 네 알약
    story.appendChild(nav); // 붙임

    X.ASPECTS.forEach(function (a, i) { story.appendChild(aspectSection(g, a, i)); }); // 네 부분을 차례로

    const sw = el('div', { class: 'switch-group' }, '다른 문화권으로: '); // 다른 문화권으로 바로 넘어가기
    A.groups.forEach(function (o) { // 문화권마다
      if (o.id === gid) return; // 지금 문화권은 뺌
      const b = el('button', { type: 'button', class: 'pill ' + X.GROUP_CLASS[o.id] }, X.titleOf(o) + ' →'); // 넘어가기 버튼
      b.addEventListener('click', function () { select(o.id, true); }); // 누르면 그 문화권으로
      sw.appendChild(b); // 추가
    }); // 문화권 끝
    story.appendChild(sw); // 붙임
  } // renderStory 끝

  function select(gid, fromUser) { // 문화권을 고르는 함수
    if (!X.byId.get(gid)) return; // 모르는 ID면 무시
    Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-pressed', String(k === gid)); }); // 버튼 눌림 상태
    Object.keys(pins).forEach(function (k) { const e = pins[k].getElement(); if (e) e.classList.toggle('is-active', k === gid); }); // 지도 이름표 강조
    renderStory(gid); // 이야기 그리기
    if (fromUser) { // 사용자가 고른 경우
      history.replaceState(null, '', '#' + keyOf(gid)); // 주소에 선택을 남김(새로고침해도 유지)
      story.scrollIntoView({ block: 'start' }); // 이야기로 스크롤
      document.getElementById('story-title').focus({ preventScroll: true }); // 화면읽기·키보드 사용자를 위해 제목으로 초점 이동
    } // 사용자 선택 처리 끝
  } // select 끝

  drawButtons(); // 버튼 만들기
  drawMap(); // 지도 그리기
  const fromHash = location.hash.slice(1).split('-')[0]; // 주소의 #koryo 또는 #koryo-eat에서 문화권 키
  const start = A.groups.filter(function (g) { return keyOf(g.id) === fromHash; })[0] || A.groups[0]; // 주소에 있으면 그 문화권, 없으면 첫 문화권
  select(start.id, false); // 처음 이야기 그리기(스크롤은 하지 않음)
  if (location.hash.indexOf('-') > 0) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); } // #koryo-eat처럼 측면까지 있으면 그곳으로
})(); // 즉시 실행 함수 끝
