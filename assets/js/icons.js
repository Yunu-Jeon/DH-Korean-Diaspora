// 생활 대상별 선 아이콘(SVG). 사진 대신 카드 표지에 쓰는 장식 그림
(function () { // 전역 이름이 섞이지 않도록 즉시 실행 함수로 감쌈
  'use strict'; // 엄격 모드

  const SHAPES = { // 아이콘 이름 → SVG 경로(48×48 칸, 선으로만 그림)
    bowl: '<path d="M7 24h34a17 17 0 0 1-34 0z"/><path d="M18 17c0-3 3-3 3-6M27 17c0-3 3-3 3-6"/>', // 김이 나는 그릇(밥·국)
    noodle: '<path d="M7 24h34a17 17 0 0 1-34 0z"/><path d="M29 5l-8 17M38 8l-11 15"/><path d="M13 28c3-2 5 2 8 0s5 2 8 0 5 2 7 0"/>', // 젓가락 걸친 국수 그릇
    cabbage: '<path d="M24 42c-10 0-16-8-16-18S15 6 24 6s16 8 16 18-6 18-16 18z"/><path d="M24 42V13M24 23l-7-6M24 30l8-7M24 36l-6-4"/>', // 배추 잎(김치)
    carrot: '<path d="M11 37L29 14a5 5 0 0 1 7 7L14 40z"/><path d="M33 12l3-7M35 15l7-3M20 30l3 2M25 24l3 2"/>', // 당근
    bread: '<path d="M7 31c0-10 7-16 17-16s17 6 17 16v6H7z"/><path d="M18 22l-2 7M25 20l-2 8M32 22l-2 7"/>', // 빵 한 덩이
    stack: '<rect x="8" y="30" width="32" height="5" rx="2.5"/><rect x="10" y="24" width="28" height="5" rx="2.5"/><rect x="12" y="18" width="24" height="5" rx="2.5"/><path d="M20 13c2-2 6-2 8 0"/>', // 겹친 블린
    dumpling: '<path d="M7 32c0-9 8-15 17-15s17 6 17 15z"/><path d="M16 20l2 4M24 17v5M32 20l-2 4"/>', // 만두
    grill: '<circle cx="24" cy="24" r="15"/><path d="M13 18h22M10 24h28M13 30h22"/><path d="M18 9c0-2 2-2 2-4M28 9c0-2 2-2 2-4"/>', // 석쇠 위 구이
    cup: '<path d="M14 12h20l-3 28H17z"/><path d="M15 20h18"/>', // 잔
    cube: '<path d="M10 18l14-8 14 8v14l-14 8-14-8z"/><path d="M10 18l14 8 14-8M24 26v14"/>', // 네모난 덩이(두부·떡)
    fish: '<path d="M5 24c7-9 19-11 29 0-10 11-22 9-29 0z"/><path d="M34 24l9-7v14z"/><circle cx="13" cy="22" r="1.5"/>', // 생선(대구)
    bottle: '<path d="M20 6h8v8l4 6v21H16V20l4-6z"/><path d="M16 27h16"/>', // 병(간장)
    potato: '<path d="M9 26c0-9 8-14 16-14s14 6 14 13-6 13-16 13S9 33 9 26z"/><path d="M19 22h.1M28 20h.1M25 30h.1"/>', // 감자
    round: '<circle cx="24" cy="24" r="16"/><path d="M15 21c3-3 6-3 9 0M24 29c3 3 6 3 9 0"/>', // 둥근 전
    strips: '<path d="M10 14c6 2 10 8 10 20M18 12c6 3 9 9 9 22M27 13c5 3 8 9 8 21"/>', // 말린 무 조각
    plate: '<ellipse cx="24" cy="30" rx="18" ry="7"/><path d="M12 28c3-4 6 0 9-3s6 1 9-2 5 1 7-1"/><path d="M20 20c1-3 4-4 7-3"/>', // 넓은 접시 요리
    jar: '<path d="M16 10h16l2 6c4 3 5 8 5 13 0 9-7 13-15 13S9 38 9 29c0-5 1-10 5-13z"/><path d="M14 16h20"/>', // 장독(된장)
    sprout: '<path d="M24 42V20"/><path d="M24 26c-6 0-10-4-11-10 6 0 10 4 11 10zM24 22c5 0 9-4 10-10-6 0-10 4-10 10z"/><path d="M12 42h24"/>', // 벼 싹(농사)
    speech: '<path d="M8 12h32v20H22l-9 8v-8H8z"/><path d="M15 20h18M15 26h11"/>', // 말풍선(부르는 것)
    tool: '<path d="M14 40L34 20"/><path d="M30 10c5 0 9 4 9 9l-5 1-5-5z"/><path d="M8 34l6 6"/>', // 농기구·연장(일하는 것)
    book: '<path d="M24 14c-4-3-10-4-16-3v26c6-1 12 0 16 3 4-3 10-4 16-3V11c-6-1-12 0-16 3z"/><path d="M24 14v26"/>' // 펼친 책(배우는 것)
  }; // SHAPES 끝

  const BY_ASPECT = { '먹는 것': 'bowl', '부르는 것': 'speech', '일하는 것': 'tool', '배우는 것': 'book' }; // 측면 → 아이콘 이름

  const BY_CONCEPT = { // 생활 대상 ID → 아이콘 이름
    'concept:kimchi': 'cabbage', 'concept:carrot-kimchi': 'carrot', 'concept:rice': 'bowl', 'concept:rice-in-water': 'bowl', // 김치·당근 김치·밥
    'concept:siraegi-soup': 'bowl', 'concept:noodle': 'noodle', 'concept:dumpling': 'dumpling', 'concept:russian-bread': 'bread', // 국·국수·만두·빵
    'concept:blin': 'stack', 'concept:tofu': 'cube', 'concept:chalttoek': 'cube', 'concept:soy-sauce': 'bottle', // 블린·두부·찰떡·간장
    'concept:potato': 'potato', 'concept:besbarmak': 'plate', 'concept:offal': 'grill', 'concept:offal-grill': 'grill', // 감자·베스바르마크·내장
    'concept:cod-muchim': 'fish', 'concept:mumallaengi': 'strips', 'concept:jeon': 'round', 'concept:cup': 'cup', // 대구무침·무말랭이·전·잔
    'concept:galbi': 'grill', 'concept:bulgogi': 'grill', 'concept:doenjang': 'jar', 'concept:rice-farming': 'sprout', // 갈비·불고기·된장·벼농사
    'concept:hangul-school': 'book', 'concept:ethnic-school': 'book' // 한글학교·민족학교
  }; // BY_CONCEPT 끝

  function iconSvg(key) { // 생활 대상 ID 또는 측면 이름에 맞는 아이콘 SVG 요소를 만드는 함수
    const name = BY_CONCEPT[key] || BY_ASPECT[key] || 'bowl'; // 대상 → 측면 순으로 찾고, 없으면 그릇 아이콘
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); // SVG 요소 생성
    svg.setAttribute('viewBox', '0 0 48 48'); // 그림 칸 크기
    svg.setAttribute('aria-hidden', 'true'); // 장식이므로 스크린리더가 읽지 않게 함
    svg.setAttribute('focusable', 'false'); // 키보드 초점을 받지 않게 함
    svg.setAttribute('class', 'icon'); // 스타일용 클래스
    svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + SHAPES[name] + '</g>'; // 미리 정한 도형만 넣음(데이터 문자열은 넣지 않음)
    return svg; // 아이콘을 돌려줌
  } // iconSvg 끝

  window.ArchiveIcons = { iconSvg: iconSvg }; // 다른 스크립트에서 쓰도록 내보냄
})(); // 즉시 실행 함수 끝
