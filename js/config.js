export const STORAGE_KEY = 'beopdang-v1';

// 목탁
export const MILESTONE = 108;
export const BONNOE = ['야근', '회의', '슬랙 알림', '월요병', '버그', '배포 공포', '리뷰 코멘트', '마감', '메일 폭탄', '현타',
  '잡념', '카톡', '긴급 요청', '스펙 변경', '빨간 CI', '레거시', '“잠깐 시간 되세요?”', '퇴근 5분 전 요청', '머지 충돌', '통장 잔고'];

// 향
export const MAX_STICKS = 3;
export const INCENSE_BURN_MS = 3 * 60 * 1000;

// 연등
export const LANTERN_TTL_MS = 5 * 60 * 1000;
export const LANTERN_FADE_MS = 2000;
export const MAX_LANTERNS_PER_PEER = 10;
export const MAX_WISH_LEN = 60;
export const MAX_BOW_GLOW = 10; // 합장 10번까지 연등이 더 밝아진다
export const LANTERN_COLORS = ['#ff6b5a', '#ffb347', '#ffe066', '#7bd389', '#7ab8ff', '#d78bff'];

// 입장
export const MAX_NAME_LEN = 10;
export const MAX_ROOM_LEN = 20;
export const DEFAULT_NAME = '익명의 불자';
export const ROOM_PARAM = 'room';

// 법당 라디오: BBS 불교방송 「독경_반야심경 (영인스님)」
export const YT_VIDEO_ID = 'bTizqvC5X9o';
export const YT_ORIGIN = 'https://www.youtube-nocookie.com'; // 쿠키를 덜 남기는 유튜브 공식 임베드 주소

// P2P
export const TRYSTERO_URL = 'https://cdn.jsdelivr.net/npm/trystero@0.25.4/+esm';
export const P2P_APP_ID = 'beopdang-online-v1';
export const PUBLIC_ROOM = 'main-hall';
// 기본값은 브라우저마다 릴레이를 무작위로 골라서 서로 못 만나는 경우가 생긴다 → 모두 같은 목록을 쓴다
export const P2P_RELAYS = [
  'wss://nos.lol',
  'wss://relay.damus.io',
  'wss://purplerelay.com',
  'wss://nostr-01.yakihonne.com',
  'wss://relay.mostro.network',
  'wss://nostr.vulpem.com',
];
export const HEARTBEAT_MS = 5000;
// 백그라운드 탭은 타이머가 1분에 한 번까지 느려지므로 넉넉하게 잡는다
export const PEER_TIMEOUT_MS = 75 * 1000;
