// 컬렉션: 문화권을 넘나드는 전체 자원을 문화권·측면·클래스로 거르기(상태는 주소에 남김)
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const TYPES = [['scene', '생활 장면'], ['label', '어휘'], ['concept', '생활 대상'], ['material', '자료']]; // 거를 클래스
  const p = new URLSearchParams(location.search); // 주소 매개변수
  const state = { culture: p.get('culture') || 'all', aspect: p.get('aspect') || 'all', type: p.get('type') || 'all' }; // 현재 거르개 값(주소에서 되살림)

  function placedAspects(l) { // 어휘가 놓인 측면(장면 연결 또는 가리키는 대상의 측면, 데이터 참조만 사용)
    const out = []; // 결과
    A.scenes.forEach(function (s) { if ((A.sceneLabels[s.id] || []).indexOf(l.id) >= 0) out.push(X.aspectOf(s)); }); // 연결된 장면의 측면
    const den = l['dia:denotes'] && X.byId.get(l['dia:denotes'].ref); // 가리키는 대상
    if (den) out.push(X.aspectOf(den)); // 대상의 측면
    return out; // 결과(대상 없는 말은 빈 목록)
  } // placedAspects 끝

  function aspectsOf(r, t) { // 자원의 측면 값 목록
    if (t === 'scene' || t === 'concept') return [X.aspectOf(r)]; // 자기 측면
    if (t === 'label') return placedAspects(r); // 어휘
    return X.asList(r['dcterms:relation']).map(function (v) { return X.aspectOf(X.byId.get(v.ref)); }); // 자료는 관련 장면의 측면
  } // aspectsOf 끝

  function culturesOf(r, t) { // 자원의 문화권 키 목록
    if (t !== 'concept') return X.groupsOf(r).map(X.cultureKey); // spatial에서
    const out = new Set(); // 생활 대상은 그 대상을 다루는 장면·어휘에서
    A.scenes.concat(A.labels).forEach(function (x) { if (X.asList(x['dcterms:subject']).concat(X.asList(x['dia:denotes'])).some(function (v) { return v && v.ref === r.id; })) X.groupsOf(x).forEach(function (g) { out.add(X.cultureKey(g)); }); }); // 연결된 문화권
    return Array.from(out); // 배열
  } // culturesOf 끝

  function pills(boxId, key, options) { // 알약 버튼 묶음을 만드는 함수
    const box = document.getElementById(boxId); // 자리
    box.querySelectorAll('button').forEach(function (b) { b.remove(); }); // 다시 그릴 때 지우기
    [['all', '전체']].concat(options).forEach(function (o) { // 선택지마다
      const b = el('button', { type: 'button', class: 'pill', 'aria-pressed': String(state[key] === o[0]) }, o[1]); // 눌림 상태를 알리는 버튼
      b.addEventListener('click', function () { state[key] = o[0]; update(); }); // 고르면 갱신
      box.appendChild(b); // 추가
    }); // 끝
  } // pills 끝

  function drawFilters() { // 거르개 세 줄을 그리는 함수
    pills('f-culture', 'culture', A.groups.map(function (g) { return [X.cultureKey(g.id), X.titleOf(g)]; })); // 문화권
    pills('f-aspect', 'aspect', X.ASPECTS.map(function (a) { return [X.ASPECT_INFO[a].key, X.aspectName(a, true)]; })); // 측면(한글·한자 병기, 값은 기존 키)
    pills('f-type', 'type', TYPES); // 클래스
  } // drawFilters 끝

  function render() { // 결과를 그리는 함수
    const out = document.getElementById('results'); // 결과 자리
    out.textContent = ''; // 지우기
    const aspectValue = X.ASPECT_BY_KEY[state.aspect]; // 고른 측면 값
    let total = 0; // 결과 수
    TYPES.forEach(function (t) { // 클래스마다
      if (state.type !== 'all' && state.type !== t[0]) return; // 고른 클래스가 아니면 건너뜀
      const list = A[t[0] + 's'].filter(function (r) { return (state.culture === 'all' || culturesOf(r, t[0]).indexOf(state.culture) >= 0) && (state.aspect === 'all' || aspectsOf(r, t[0]).indexOf(aspectValue) >= 0); }); // 거르기
      if (!list.length) return; // 없으면 건너뜀
      total += list.length; // 수 더하기
      out.appendChild(el('h2', { class: 'section-sub' }, t[1] + ' ' + list.length)); // 소제목
      const grid = el('div', { class: t[0] === 'scene' ? 'card-grid' : 'word-grid' }); // 격자
      list.forEach(function (r) { grid.appendChild(t[0] === 'scene' ? X.sceneCard(r, { showCulture: true, showAspect: true }) : t[0] === 'label' ? X.labelCard(r, { showCulture: true }) : t[0] === 'concept' ? X.conceptCard(r) : X.materialCard(r)); }); // 카드
      out.appendChild(grid); // 붙임
    }); // 끝
    document.getElementById('result-count').textContent = '모두 ' + total + '건'; // 결과 수
    if (!total) out.appendChild(el('p', { class: 'empty' }, '조건에 맞는 자료를 아직 찾지 못했습니다. 거르개를 바꾸거나 초기화해 보세요.')); // 0건 안내
  } // render 끝

  function update() { // 상태를 주소에 남기고 다시 그리는 함수
    const q = new URLSearchParams(); // 새 매개변수
    Object.keys(state).forEach(function (k) { if (state[k] !== 'all') q.set(k, state[k]); }); // 전체가 아닌 값만
    history.replaceState(null, '', 'collection.html' + (q.toString() ? '?' + q : '')); // 주소 갱신(새로고침·공유 가능)
    drawFilters(); // 버튼 상태
    render(); // 결과
  } // update 끝

  document.getElementById('reset').addEventListener('click', function () { state.culture = 'all'; state.aspect = 'all'; state.type = 'all'; update(); }); // 필터 초기화
  update(); // 처음 그리기
})(); // 즉시 실행 함수 끝
