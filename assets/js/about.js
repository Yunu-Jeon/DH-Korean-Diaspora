// 소개 페이지: AP 요약 표의 건수, 출처 목록, 아직 확인하지 못한 것
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구

  const AP_ROWS = [ // AP 2장의 클래스 요약: [이름, 표준 클래스, 설명, 데이터 키]
    ['자료', 'dctype:Text / StillImage / MovingImage', '신문 지면·사진·문서·영상 같은 1차 사료', 'materials'], // 자료
    ['생활 장면', 'dia:Scene', '먹고, 부르고, 일하고, 배우는 생활문화의 한 장면(측면 하나로 분류)', 'scenes'], // 생활 장면
    ['생활 대상', 'skos:Concept', '음식·생활 사물·일·교육 제도 등을 가리켜지는 개념으로', 'concepts'], // 생활 대상
    ['어휘', 'skosxl:Label', '같은 대상을 부르는 여러 말을 각각 독립 자원으로', 'labels'], // 어휘
    ['장소', 'dcterms:Location', '좌표와 상위 장소', 'places'], // 장소
    ['문화권', 'foaf:Group', '고려인·재일조선인·하와이 한인을 사람들의 집단으로', 'groups'], // 문화권
    ['출처', 'bibo:AcademicArticle / Thesis / Document', '논문·학위논문·기타 문서', 'references'] // 출처
  ]; // AP_ROWS 끝
  const tbody = document.getElementById('ap-table'); // 표 본문 자리
  AP_ROWS.forEach(function (r) { // 클래스마다
    tbody.appendChild(el('tr', {}, [el('th', { scope: 'row' }, r[0]), el('td', {}, el('code', {}, r[1])), el('td', {}, r[2]), el('td', {}, String(A[r[3]].length))])); // 한 줄
  }); // 클래스 끝

  const list = document.getElementById('source-list'); // 출처 목록 자리
  A.references.forEach(function (ref) { // 출처마다
    const who = X.asList(ref['dcterms:creator']).map(function (v) { return v.value; }).join(', '); // 저자
    const year = ref['dcterms:date'] ? ' (' + ref['dcterms:date'].value + ')' : ''; // 연도
    const where = ref['dcterms:isPartOf'] && ref['dcterms:isPartOf'].value ? ' 『' + ref['dcterms:isPartOf'].value.replace(/[『』]/g, '') + '』' : ''; // 수록지
    const li = el('li', {}, [who + year + '. ', el('a', { href: X.itemUrl(ref.id) }, ref['dcterms:title'].value), where + '.']); // 한 항목
    if (ref.scholarly === false) li.appendChild(el('span', { class: 'badge badge-pending' }, '학술 근거 아님')); // 소설 표시
    if (ref.status === '확인 필요') li.appendChild(el('span', { class: 'badge badge-pending' }, '내용 미추출')); // 열람하지 못한 문헌 표시
    list.appendChild(li); // 목록에 추가
  }); // 출처 끝

  const pend = document.getElementById('pending-list'); // 확인 필요 목록 자리
  A.pending.forEach(function (p) { // 항목마다
    const li = el('li', {}, p.text); // 내용
    if (p.id) { li.appendChild(document.createTextNode(' ')); li.appendChild(el('a', { href: X.itemUrl(p.id) }, '보기')); } // 해당 자원 링크
    pend.appendChild(li); // 목록에 추가
  }); // 항목 끝
  pend.appendChild(el('li', {}, '제목의 뜻, 호칭 설명, 메타데이터·요약문의 이용 조건은 작성 예정입니다.')); // 사용자 원고 대기 항목

  const others = document.getElementById('others-list'); // 네 측면 밖 목록 자리
  (A.others || []).forEach(function (o) { // 항목마다
    const g = X.byId.get(o.group); // 문화권
    others.appendChild(el('li', {}, [o.what + ' ', el('span', { class: 'badge' }, o.kind), el('span', { class: 'badge' }, X.titleOf(g)), X.citeLine(o.cite)])); // 내용·종류·문화권·출처
  }); // 항목 끝
})(); // 즉시 실행 함수 끝
