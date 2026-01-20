export const siteConfig = {
  brand: {
    name: "Can I love ?",
    subtitle: "설렘을 기록하는 공간",
  },
  nav: [
    { label: "인트로", href: "/" },
    { label: "로그인", href: "/login" },
    { label: "회원가입", href: "/signup" },
    { label: "이상형", href: "/ideal" },
    { label: "설문", href: "/survey" },
    { label: "채팅", href: "/chat" },
  ],
  intro: {
    phaseOneText: "사랑에 빠진게 죄는 아니잖아",
    phaseTwoLine1: "나도 연애 잘하고 싶어 ...",
    phaseTwoLine2: "Can I love ?",
    cta: "시작하기",
  },
  login: {
    title: "다시 만나서 반가워요",
    subtitle: "짧은 로그인으로 감정 기록을 이어가요.",
    fields: [
      { id: "id", label: "ID", type: "text", placeholder: "아이디 입력" },
      { id: "password", label: "PW", type: "password", placeholder: "비밀번호 입력" },
    ],
    actions: [
      { label: "로그인", variant: "primary" },
      { label: "새로 가입", variant: "ghost" },
      { label: "Google Login", variant: "ghost" },
    ],
    mood: ["설렘", "연결", "안정", "배려"],
  },
  signup: {
    title: "♥ 회원가입 ♥",
    fields: [
      { id: "id", label: "ID", type: "text", placeholder: "아이디 입력" },
      { id: "password", label: "PW", type: "password", placeholder: "비밀번호 입력" },
      {
        id: "passwordConfirm",
        label: "PW 확인",
        type: "password",
        placeholder: "비밀번호 재입력",
      },
      { id: "nickname", label: "이름", type: "text", placeholder: "이름 입력" },
      {
        id: "birthdate",
        label: "생년월일",
        type: "text",
        placeholder: "YYYY.MM.DD",
      },
    ],
    cta: "회원가입",
  },
  ideal: {
    title: "내 여자친구 고르기...",
    subtitle: "마음이 끌리는 타입을 골라보세요.",
    choices: [
      { id: "princess", label: "공주", emoji: "👑", tags: ["#존중", "#우아"] },
      { id: "god", label: "신", emoji: "✨", tags: ["#카리스마", "#절대"] },
      { id: "doll", label: "인형", emoji: "🎀", tags: ["#귀요미", "#순정"] },
      { id: "circle", label: "동그라미", emoji: "⭕", tags: ["#포근함", "#안정"] },
      { id: "random", label: "random", emoji: "🎲", tags: ["#즉흥", "#모험"] },
    ],
  },
  survey: {
    title: "연애 성향 & 남성성 지표 테스트",
    subtitle: "당신의 연애 스타일과 성향을 정교하게 분석합니다.",
    archetypes: ["근육테토남", "앙큼계략남", "스윗에겐남", "예삐에삐남", "모솔남"],
    questions: [
      {
        id: "q1",
        text: "지금까지 연애한 횟수는?",
        options: ["0회", "1~2회", "3~5회", "6회 이상"],
      },
      {
        id: "q2",
        text: "데이트 약속 잡을 때 당신의 진짜 모습은?",
        options: [
          "이미 동선·식당·카페까지 다 머릿속에 있다",
          "대충 큰 그림만 그리고 상황 보면서 간다",
          "상대랑 계속 물어보면서 맞춘다",
          "나는 그냥 따라가기 담당이다",
        ],
      },
      {
        id: "q3",
        text: "마음에 드는 사람이 생기면 당신은?",
        options: [
          "각 재지 않고 바로 들이댄다",
          "분위기·타이밍 보다가 확신 들면 움직인다",
          "상대 반응부터 체크한다",
          "아무 말도 안 하고 혼자 망상만 한다",
        ],
      },
      {
        id: "q4",
        text: "소개팅에서 솔직히 제일 먼저 보는 건?",
        options: [
          "얼굴 보고 이미 절반은 결정된다",
          "대화 몇 마디면 감 온다",
          "취향·성향 맞는지가 중요하다",
          "그냥 같이 있어도 안 불편한지",
        ],
      },
      {
        id: "q5",
        text: "연애하다가 공기 싸해지면 당신은?",
        options: [
          "지금 바로 꺼내서 오늘 안에 끝낸다",
          "하루쯤 정리하고 얘기한다",
          "내가 먼저 사과하고 분위기 푼다",
          "아무 일 없는 척 시간이 해결해주길 기다린다",
        ],
      },
      {
        id: "q6",
        text: "연애하면서 제일 심장 쿵 내려앉았던 순간은?",
        options: [
          "아무 말 없이 자연스럽게 처음 뽀뽀했을 때",
          "고백하고 답 기다리던 그 몇 초",
          "나보다 상대가 날 더 신경 쓰는 게 느껴질 때",
          "새벽에 쓸데없이 진지해졌다가 감정 터질 때",
        ],
      },
      {
        id: "q7",
        text: "상대에게 잘해주고 싶을 때 당신의 방식은?",
        options: [
          "필요해 보이면 이유 없이 바로 해준다",
          "실용적인데 센스 있다는 말 듣는 걸로",
          "감정이 느껴지게 하나하나 준비",
          "굳이 뭘 주기보단 말과 태도로 표현",
        ],
      },
      {
        id: "q8",
        text: "연애 속도에 대한 당신의 솔직한 기준은?",
        options: [
          "느낌 왔으면 굳이 브레이크 걸 필요 없다",
          "서로 템포 맞춰가며 자연스럽게",
          "천천히 가야 덜 망한다",
          "상대가 편한 속도가 곧 정답이다",
        ],
      },
    ],
  },
  chat: {
    title: "메인 채팅",
    subtitle: "선택한 캐릭터와 솔루션을 나눠요.",
    sidebar: {
      title: "My Page",
      items: [
        "연애 report",
        "진지하게 상담받기",
        "카톡 내용 평가받기",
        "나를 위한 소개팅 추천",
      ],
      cta: "대화 종료",
    },
    character: {
      name: "동그라미",
      emoji: "⭕",
      description: "당신의 연애 파트너",
    },
    messages: [
      {
        id: "m1",
        speaker: "상대",
        time: "22:00",
        text: "영광아 너 이제부터 10시 통금이야",
      },
      {
        id: "m2",
        speaker: "나",
        time: "22:01",
        text: "또 왜그러는데 자기야 ..",
      },
      {
        id: "m3",
        speaker: "상대",
        time: "22:02",
        text: "너 지금 또라 했어? 너 잘못이 뭔지 몰라 ?",
      },
      {
        id: "m4",
        speaker: "나",
        time: "22:03",
        text: "미안해 ..",
      },
    ],
    quickReplies: ["문장 추천해줘", "다른 해결책 알려줘", "감정 정리 도와줘"],
  },
  decorations: {
    hearts: [
      { id: "h1", top: "12%", left: "6%", size: "text-2xl" },
      { id: "h2", top: "18%", right: "10%", size: "text-3xl" },
      { id: "h3", bottom: "14%", left: "12%", size: "text-xl" },
      { id: "h4", bottom: "18%", right: "8%", size: "text-2xl" },
    ],
  },
};

export type SiteConfig = typeof siteConfig;
