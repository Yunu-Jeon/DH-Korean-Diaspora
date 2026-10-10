// 예전 소개 주소(about.html): 소개를 홈으로 옮겼으므로 홈의 소개 위치로 보냄
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드
  location.replace('index.html#about'); // 뒤로 가기 기록을 남기지 않고 홈의 소개로 이동
})(); // 즉시 실행 함수 끝
