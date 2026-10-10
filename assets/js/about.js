// 소개 페이지: 참고문헌 목록을 데이터에서 채움
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  const X = window.Archive; // 공통 기능 묶음
  const A = X.data; // 아카이브 데이터
  const el = X.el; // 요소 만들기 도구
  const list = document.getElementById('source-list'); // 참고문헌 자리
  A.references.forEach(function (ref) { // 출처마다
    const who = X.asList(ref['dcterms:creator']).map(function (v) { return v.value; }).join(', '); // 저자
    const year = ref['dcterms:date'] ? ' (' + ref['dcterms:date'].value + ')' : ''; // 연도
    const where = ref['dcterms:isPartOf'] && ref['dcterms:isPartOf'].value ? ' 『' + ref['dcterms:isPartOf'].value.replace(/[『』]/g, '') + '』' : ''; // 수록지
    const li = el('li', {}, [who + year + '. ', el('a', { href: X.itemUrl(ref.id) }, ref['dcterms:title'].value), where + '.']); // 한 항목
    if (ref.scholarly === false) li.appendChild(el('span', { class: 'badge badge-pending' }, '학술 근거 아님')); // 소설 표시
    if (ref.status === '확인 필요') li.appendChild(el('span', { class: 'badge badge-pending' }, '내용 미추출')); // 열람하지 못한 문헌
    list.appendChild(li); // 목록에 추가
  }); // 출처 끝
})(); // 즉시 실행 함수 끝
