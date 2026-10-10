// 컬렉션 페이지: 이야기 없이 전체 자료를 문화권·측면·클래스로 걸러 보기
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const state = { group: 'all', aspect: 'all', cls: 'all' }; // 지금 고른 거르개 값
  const CLASSES = [['scene', '생활 장면'], ['label', '어휘'], ['concept', '생활 대상'], ['material', '자료']]; // 거를 수 있는 클래스

  function makeFilter(boxId, key, options) { // 거르개 버튼 묶음을 만드는 함수
    const box = document.getElementById(boxId); // 묶음 자리
    const all = [['all', '전체']].concat(options); // 맨 앞에 '전체'
    all.forEach(function (o) { // 선택지마다
      const b = el('button', { type: 'button', class: 'pill ' + (X.GROUP_CLASS[o[0]] || ''), 'aria-pressed': String(state[key] === o[0]), 'data-v': o[0] }, o[1]); // 눌림 상태를 알리는 알약 버튼
      b.addEventListener('click', function () { // 누르면
        state[key] = o[0]; // 값 바꾸기
        box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-v') === o[0])); }); // 눌림 상태 갱신
        render(); // 결과 다시 그리기
        saveHash(); // 주소에 기억
      }); // 클릭 끝
      box.appendChild(b); // 추가
    }); // 선택지 끝
  } // makeFilter 끝

  function aspectsOf(res, cls) { // 자원의 측면 목록을 구하는 함수(어휘는 놓인 자리에서, 자료는 관련 장면에서)
    if (cls === 'scene' || cls === 'concept') return [X.aspectOf(res)]; // 장면·생활 대상은 자기 측면
    if (cls === 'label') return (A.labelPlacement[res.id] || []).map(function (p) { return p[1]; }); // 어휘는 전시에서 놓인 측면
    return X.asList(res['dcterms:relation']).map(function (v) { return X.aspectOf(X.byId.get(v.ref)); }); // 자료는 관련 장면의 측면
  } // aspectsOf 끝

  function groupsOfAny(res, cls) { // 자원의 문화권 목록(생활 대상은 그 대상을 다루는 장면·어휘에서)
    if (cls !== 'concept') return X.groupsOf(res); // 나머지는 spatial에서
    const out = new Set(); // 결과
    A.scenes.concat(A.labels).forEach(function (r) { // 장면과 어휘마다
      const hit = X.asList(r['dcterms:subject']).concat(X.asList(r['dia:denotes'])).some(function (v) { return v && v.ref === res.id; }); // 이 대상을 가리키는지
      if (hit) X.groupsOf(r).forEach(function (g) { out.add(g); }); // 가리키면 그 문화권 추가
    }); // 끝
    return Array.from(out); // 배열로 돌려줌
  } // groupsOfAny 끝

  function conceptCard(c) { // 생활 대상 카드(아이콘 + 이름)를 만드는 함수
    const card = el('article', { class: 'word-tile' }); // 타일 틀
    card.appendChild(window.ArchiveIcons.iconSvg(c.id)); // 아이콘
    card.appendChild(el('p', { class: 'word-group' }, '생활 대상 · ' + X.aspectOf(c))); // 종류와 측면
    card.appendChild(el('p', { class: 'word' }, el('a', { href: X.itemUrl(c.id) }, X.titleOf(c)))); // 이름
    card.appendChild(X.citeCompact(X.firstCites(c))); // 출처·쪽수
    return card; // 카드를 돌려줌
  } // conceptCard 끝

  function materialCard(m) { // 자료 카드를 만드는 함수
    const card = el('article', { class: 'word-tile ' + (X.GROUP_CLASS[X.groupsOf(m)[0]] || '') }); // 타일 틀
    card.appendChild(el('p', { class: 'word-group' }, '자료 · ' + (m['dcterms:type'] ? m['dcterms:type'].value : ''))); // 종류와 유형
    card.appendChild(el('p', { class: 'word', style: 'font-size:1.25rem' }, el('a', { href: X.itemUrl(m.id) }, X.titleOf(m)))); // 제목
    card.appendChild(X.citeCompact(X.firstCites(m))); // 출처·쪽수
    return card; // 카드를 돌려줌
  } // materialCard 끝

  function render() { // 거르개에 맞는 결과를 그리는 함수
    const out = document.getElementById('results'); // 결과 자리
    out.textContent = ''; // 지우기
    let total = 0; // 결과 수
    CLASSES.forEach(function (c) { // 클래스마다
      if (state.cls !== 'all' && state.cls !== c[0]) return; // 고른 클래스가 아니면 건너뜀
      const list = A[c[0] + 's'].filter(function (r) { // 자원 거르기
        const okG = state.group === 'all' || groupsOfAny(r, c[0]).indexOf(state.group) >= 0; // 문화권 맞는지
        const okA = state.aspect === 'all' || aspectsOf(r, c[0]).indexOf(state.aspect) >= 0; // 측면 맞는지
        return okG && okA; // 둘 다 맞으면 남김
      }); // 거르기 끝
      if (!list.length) return; // 없으면 이 클래스는 그리지 않음
      total += list.length; // 수 더하기
      out.appendChild(el('h2', { class: 'sub' }, c[1] + ' · ' + list.length)); // 클래스 소제목
      const box = el('div', { class: c[0] === 'scene' ? 'grid' : 'word-wall' }); // 장면은 카드 격자, 나머지는 타일 벽
      list.forEach(function (r) { // 자원마다
        if (c[0] === 'scene') box.appendChild(X.sceneCard(r)); // 장면 카드
        else if (c[0] === 'label') box.appendChild(X.labelCard(r)); // 어휘 카드
        else if (c[0] === 'concept') box.appendChild(conceptCard(r)); // 생활 대상 카드
        else box.appendChild(materialCard(r)); // 자료 카드
      }); // 자원 끝
      out.appendChild(box); // 붙임
    }); // 클래스 끝
    document.getElementById('result-count').textContent = '모두 ' + total + '건'; // 결과 수 표시
    if (!total) out.appendChild(el('p', { class: 'empty' }, '조건에 맞는 자료를 아직 찾지 못했습니다.')); // 0건 안내
  } // render 끝

  function saveHash() { // 거르개 상태를 주소에 남기는 함수
    history.replaceState(null, '', '#' + [state.group, state.aspect, state.cls].join('|')); // 예: #group:koryo|먹는 것|all
  } // saveHash 끝

  const saved = decodeURIComponent(location.hash.slice(1)).split('|'); // 주소에 남은 상태
  if (saved.length === 3) { state.group = saved[0]; state.aspect = saved[1]; state.cls = saved[2]; } // 있으면 되살림
  makeFilter('f-group', 'group', A.groups.map(function (g) { return [g.id, X.titleOf(g)]; })); // 문화권 거르개
  makeFilter('f-aspect', 'aspect', X.ASPECTS.map(function (a) { return [a, a]; })); // 측면 거르개
  makeFilter('f-class', 'cls', CLASSES); // 클래스 거르개
  render(); // 처음 그리기
})(); // 즉시 실행 함수 끝
