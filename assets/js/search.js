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
  ['label', 'concept', 'scene'].forEach(function (type) { // 종류별로 묶어서 보여 줌
    const hits = results.filter(function (r) { return r.type === type; }); // 이 종류의 결과
    if (!hits.length) return; // 없으면 건너뜀
    box.appendChild(el('h2', {}, TYPE_NAME[type] + ' · ' + hits.length)); // 종류 소제목
    const list = el('div', { class: type === 'scene' ? 'grid' : 'word-wall' }); // 장면은 카드 격자, 나머지는 타일 벽
    hits.forEach(function (r) { // 결과마다
      const res = X.byId.get(r.id); // 자원
      let card; // 그릴 카드
      if (type === 'label') card = X.labelCard(res); // 어휘는 큰 글씨 타일
      else if (type === 'scene') card = X.sceneCard(res); // 장면은 그림 표지 카드
      else { // 생활 대상은 아이콘 타일
        card = el('article', { class: 'word-tile' }); // 타일 틀
        card.appendChild(window.ArchiveIcons.iconSvg(r.id)); // 아이콘
        card.appendChild(el('p', { class: 'word' }, el('a', { href: X.itemUrl(r.id) }, X.titleOf(res)))); // 이름
        card.appendChild(X.citeCompact(X.firstCites(res))); // 출처·쪽수
      } // 카드 종류 끝
      if (r.hit.kind === '이표기') (card.querySelector('.scene-body') || card).appendChild(el('span', { class: 'cite' }, '이표기 ‘' + r.hit.text + '’로 찾음')); // 이표기로 찾았으면 알려 줌
      list.appendChild(card); // 목록에 추가
    }); // 결과 끝
    box.appendChild(list); // 화면에 붙임
  }); // 종류 끝
})(); // 즉시 실행 함수 끝
