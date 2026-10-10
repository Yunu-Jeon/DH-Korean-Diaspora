// 전시 「식탁 위의 말」: 문화권마다 생활 장면 → 그 장면을 부르던 말(어휘 카드)
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const root = document.getElementById('exhibit'); // 전시 섹션 자리
  const toc = document.getElementById('exhibit-toc'); // 문화권 바로가기 자리

  A.groups.forEach(function (g) { // 문화권마다
    const key = g.id.split(':')[1]; // 'koryo' 같은 짧은 키
    toc.appendChild(el('a', { class: 'btn ' + X.GROUP_CLASS[g.id], href: '#ex-' + key }, X.titleOf(g))); // 바로가기 링크

    const sec = el('section', { class: 'exhibit-section ' + X.GROUP_CLASS[g.id], id: 'ex-' + key, 'aria-labelledby': 'exh-' + key }); // 문화권 섹션
    const head = el('header'); // 섹션 머리
    head.appendChild(el('p', { class: 'eyebrow' }, '식탁 위의 말')); // 작은 머리글
    head.appendChild(el('h2', { id: 'exh-' + key, style: 'margin-top:0' }, X.titleOf(g))); // 문화권 이름
    const intro = X.asList(g['dcterms:description']).filter(function (d) { return d.value; })[0]; // 첫 개요 문장
    if (intro) head.appendChild(X.valueNode(intro)); // 개요와 출처
    sec.appendChild(head); // 머리 붙임

    const scenes = A.scenes.filter(function (s) { return X.groupsOf(s).indexOf(g.id) >= 0; }); // 이 문화권의 장면
    sec.appendChild(el('h3', {}, '식탁의 장면')); // 장면 소제목
    const sg = el('div', { class: 'grid' }); // 장면 카드 격자
    scenes.forEach(function (s) { sg.appendChild(X.sceneCard(s)); }); // 장면 카드
    sec.appendChild(sg); // 격자 붙임

    const subjects = new Set(); // 장면이 다루는 생활 대상 ID 모음
    scenes.forEach(function (s) { X.asList(s['dcterms:subject']).forEach(function (v) { subjects.add(v.ref); }); }); // 대상 모으기
    const labels = A.labels.filter(function (l) { return X.groupsOf(l).indexOf(g.id) >= 0; }); // 이 문화권의 어휘
    const linked = labels.filter(function (l) { return l['dia:denotes'] && subjects.has(l['dia:denotes'].ref); }); // 장면의 대상을 가리키는 어휘
    const others = labels.filter(function (l) { return linked.indexOf(l) < 0; }); // 장면과 직접 이어지지 않는 어휘

    const words = el('div', { class: 'exhibit-words' }); // 어휘 영역
    words.appendChild(el('h3', {}, '그 장면을 부르던 말')); // 어휘 소제목
    const wg = el('div', { class: 'grid-tight' }); // 어휘 카드 격자
    linked.forEach(function (l) { wg.appendChild(X.labelCard(l)); }); // 장면과 이어진 어휘 카드
    if (!linked.length) wg.appendChild(el('p', { class: 'cite' }, '이 장면들과 직접 이어진 어휘가 아직 없습니다.')); // 없으면 안내
    words.appendChild(wg); // 격자 붙임
    if (others.length) { // 그 밖의 어휘가 있으면
      words.appendChild(el('h3', { style: 'margin-top:24px' }, '이 문화권의 다른 식생활 어휘')); // 소제목
      const og = el('div', { class: 'grid-tight' }); // 격자
      others.forEach(function (l) { og.appendChild(X.labelCard(l)); }); // 어휘 카드
      words.appendChild(og); // 격자 붙임
    } // 그 밖의 어휘 끝
    sec.appendChild(words); // 어휘 영역 붙임
    root.appendChild(sec); // 섹션을 화면에 붙임
  }); // 문화권 끝
})(); // 즉시 실행 함수 끝
