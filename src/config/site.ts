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
    title: "회원가입 ♥",
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
    title: "7가지 문답으로 분류",
    subtitle: "개인 성향 파악을 위한 연애 문답이에요.",
    archetypes: ["테토", "테겐", "에토", "에겐", "모솔남"],
    questions: [
      {
        id: "q1",
        text: "데이트 약속을 잡을 때 당신의 스타일은?",
        options: ["계획표부터 짠다", "분위기에 맡긴다", "상대에게 맞춘다", "즉흥이 좋다"],
      },
      {
        id: "q2",
        text: "연락 텀이 길어졌을 때 가장 먼저 드는 생각은?",
        options: ["왜 늦지? 이유가 있을 거야", "바빠서 그런가 보다", "조금 불안하다", "먼저 연락한다"],
      },
      {
        id: "q3",
        text: "소개팅 자리에서 더 중요하게 보는 건?",
        options: ["첫인상", "대화 톤", "취향의 겹침", "태도/예의"],
      },
      {
        id: "q4",
        text: "다툼이 생겼을 때 당신은?",
        options: ["빠르게 해결", "시간을 두고 정리", "사과부터", "원인 분석"],
      },
      {
        id: "q5",
        text: "연애에서 가장 설레는 순간은?",
        options: ["첫 고백", "함께 여행", "서로의 배려", "깊은 대화"],
      },
      {
        id: "q6",
        text: "선물 취향은?",
        options: ["의미 있는 것", "실용적인 것", "감성 가득한 것", "깜짝 이벤트"],
      },
      {
        id: "q7",
        text: "연애의 이상적인 속도는?",
        options: ["천천히 알아가기", "적당히 빠르게", "느낌 오면 바로", "상대 페이스에 맞춤"],
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
