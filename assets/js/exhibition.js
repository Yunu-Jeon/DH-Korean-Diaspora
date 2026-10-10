// 예전 전시 서사 주소(exhibition.html?culture=…): 전시 서사를 문화권 페이지에 합쳤으므로 그곳으로 보냄
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  location.replace('archive.html' + location.search + location.hash); // 같은 문화권·장 위치로 이동(뒤로 가기 기록 없음)
})(); // 즉시 실행 함수 끝
