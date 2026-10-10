// 전시 「식탁 위의 말」: 문화권마다 생활 장면(가로 띠) → 그 장면을 부르던 말(큰 글씨 타일)
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const root = document.getElementById('exhibit'); // 전시 섹션 자리
  const toc = document.getElementById('exhibit-toc'); // 문화권 바로가기 자리

  A.groups.forEach(function (g, i) { // 문화권마다
    const key = g.id.split(':')[1]; // 'koryo' 같은 짧은 키
    const name = X.titleOf(g); // 문화권 이름
    toc.appendChild(el('a', { class: 'btn', href: '#ex-' + key }, name)); // 바로가기 링크

    const sec = el('section', { class: 'band ' + X.GROUP_CLASS[g.id], id: 'ex-' + key, 'aria-labelledby': 'exh-' + key }); // 문화권 띠
    const head = el('header', { class: 'band-head' }); // 띠 머리
    head.appendChild(el('span', { class: 'band-num', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0'))); // 큰 순서 숫자(장식)
    head.appendChild(el('h2', { id: 'exh-' + key }, name)); // 문화권 이름
    const intro = X.asList(g['dcterms:description']).filter(function (d) { return d.value; })[0]; // 첫 개요 문장
    if (intro) head.appendChild(el('p', { class: 'band-intro' }, [intro.value, ' ', X.citeCompact(intro.cite)])); // 한 문장 개요와 출처
    sec.appendChild(head); // 머리 붙임

    const scenes = A.scenes.filter(function (s) { return X.groupsOf(s).indexOf(g.id) >= 0; }); // 이 문화권의 장면
    sec.appendChild(el('h3', {}, '식탁의 장면 · ' + scenes.length)); // 장면 소제목
    sec.appendChild(el('p', { class: 'strip-hint' }, '옆으로 넘겨 보세요. 카드를 누르면 자세한 설명과 출처가 나옵니다.')); // 사용 안내
    const strip = el('div', { class: 'strip', tabindex: '0', role: 'region', 'aria-label': name + ' 생활 장면 목록(좌우로 스크롤)' }); // 키보드로도 스크롤할 수 있는 가로 띠
    scenes.forEach(function (s) { strip.appendChild(X.sceneCard(s)); }); // 장면 카드
    sec.appendChild(strip); // 띠 붙임

    const subjects = new Set(); // 장면이 다루는 생활 대상 ID 모음
    scenes.forEach(function (s) { X.asList(s['dcterms:subject']).forEach(function (v) { subjects.add(v.ref); }); }); // 대상 모으기
    const labels = A.labels.filter(function (l) { return X.groupsOf(l).indexOf(g.id) >= 0; }); // 이 문화권의 어휘
    const linked = labels.filter(function (l) { return l['dia:denotes'] && subjects.has(l['dia:denotes'].ref); }); // 장면의 대상을 가리키는 어휘
    const others = labels.filter(function (l) { return linked.indexOf(l) < 0; }); // 장면과 직접 이어지지 않는 어휘

    sec.appendChild(el('h3', {}, '그 장면을 부르던 말 · ' + linked.length)); // 어휘 소제목
    const wall = el('div', { class: 'word-wall' }); // 큰 글씨 타일 벽
    linked.forEach(function (l) { wall.appendChild(X.labelCard(l)); }); // 장면과 이어진 어휘 타일
    if (!linked.length) wall.appendChild(el('p', { class: 'cite' }, '이 장면들과 직접 이어진 어휘가 아직 없습니다.')); // 없으면 안내
    sec.appendChild(wall); // 벽 붙임
    if (others.length) { // 그 밖의 어휘가 있으면
      sec.appendChild(el('h3', {}, '이 문화권의 다른 말 · ' + others.length)); // 소제목
      const wall2 = el('div', { class: 'word-wall' }); // 타일 벽
      others.forEach(function (l) { wall2.appendChild(X.labelCard(l)); }); // 어휘 타일
      sec.appendChild(wall2); // 벽 붙임
    } // 그 밖의 어휘 끝
    root.appendChild(sec); // 띠를 화면에 붙임
  }); // 문화권 끝
})(); // 즉시 실행 함수 끝
