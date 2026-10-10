// 검색 결과 페이지: 어휘·생활 대상·생활 장면을 이표기까지 찾고, 0건이면 비슷한 표기를 제안
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const el = X.el; // 요소 만들기 도구
  const box = document.getElementById('search-results'); // 결과 자리
  const q = (new URLSearchParams(location.search).get('q') || '').trim(); // 검색어
  const TYPE_NAME = { label: '어휘', concept: '생활 대상', scene: '생활 장면' }; // 결과 종류 이름

  if (!q) { // 검색어가 없으면
    box.appendChild(el('p', {}, '헤더의 검색창에 찾을 말을 입력해 주세요.')); // 안내
    return; // 끝
  } // 빈 검색어 끝
  document.getElementById('search-title').textContent = '‘' + q + '’ 검색 결과'; // 제목에 검색어 표시
  document.title = q + ' 검색 — 한 뿌리, 다른 흙'; // 탭 제목

  const results = X.search(q); // 검색 실행
  if (!results.length) { // 결과가 0건이면
    box.appendChild(el('p', {}, '찾은 결과가 없습니다.')); // 안내
    const sug = X.suggest(q); // 비슷한 표기
    if (sug.length) { // 제안할 것이 있으면
      const p = el('p', {}, '혹시 이 표기를 찾으셨나요? '); // 제안 문장
      sug.forEach(function (s, i) { // 제안마다
        if (i) p.appendChild(document.createTextNode(' · ')); // 구분점
        p.appendChild(el('a', { href: 'search.html?q=' + encodeURIComponent(s.text) }, s.text)); // 그 표기로 다시 검색하는 링크
      }); // 제안 끝
      box.appendChild(p); // 붙임
    } else { // 제안할 것도 없으면
      box.appendChild(el('p', {}, ['비슷한 표기도 찾지 못했습니다. ', el('a', { href: 'collection.html' }, '컬렉션'), '에서 둘러볼 수 있습니다.'])); // 안내
    } // 제안 끝
    return; // 끝
  } // 0건 처리 끝

  box.appendChild(el('p', { class: 'cite' }, results.length + '건')); // 건수
  const list = el('div', { class: 'grid' }); // 결과 격자
  results.forEach(function (r) { // 결과마다
    const res = X.byId.get(r.id); // 자원
    const card = el('article', { class: 'card group-bar ' + (X.GROUP_CLASS[X.groupsOf(res)[0]] || '') }); // 결과 카드
    const meta = X.groupChips(res); // 문화권 칩
    meta.insertBefore(el('span', { class: 'chip' }, TYPE_NAME[r.type]), meta.firstChild); // 종류 칩을 앞에
    card.appendChild(meta); // 칩 줄
    card.appendChild(el('h3', {}, el('a', { href: X.itemUrl(r.id) }, X.titleOf(res)))); // 이름 링크
    card.appendChild(el('p', { class: 'cite' }, r.hit.kind + '에서 찾음: ' + r.hit.text)); // 무엇으로 찾았는지(이표기 등)
    if (r.type === 'label') card.appendChild(el('p', {}, res['dia:gloss'].value)); // 어휘면 뜻
    card.appendChild(X.citeNode(X.firstCites(res))); // 출처·쪽수
    list.appendChild(card); // 격자에 추가
  }); // 결과 끝
  box.appendChild(list); // 화면에 붙임
})(); // 즉시 실행 함수 끝
