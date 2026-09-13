export const en = {
  meta: {
    title: "Refella — AI loyalty & referrals over WhatsApp",
    description:
      "Refella is an AI loyalty and referral manager that brings customers back and turns recommendations into sales — entirely inside the messaging apps your customers already use.",
    ogAlt: "Refella — loyalty and referrals that live in the chat",
  },
  nav: {
    pillars: "Platform",
    journey: "How it works",
    referrals: "Referrals",
    faq: "FAQ",
    cta: "Try it on WhatsApp",
    menu: "Menu",
    close: "Close menu",
  },
  hero: {
    eyebrow: "Engage · Retain · Grow",
    title: "the assistant that actually",
    titleAccent: "brings customers back.",
    subtitle:
      "An AI loyalty and referral manager that helps businesses bring customers back and turn recommendations into sales — all through messaging apps.",
    primaryCta: "text Refella",
    secondaryCta: "see how it works",
    whatsappMessage: "Hi Refella — I'd like to try the demo for my business.",
    story: [
      { k: "divider", from: "", text: "Today", act: 0 },
      { k: "msg", from: "customer", text: "Hi! Do you have a table for 2 tonight?", act: 0 },
      { k: "msg", from: "business", text: "Hi Aisha 👋 We do — 19:30 or 21:00. Last time you sat on the terrace, want me to keep that?", act: 0 },
      { k: "msg", from: "customer", text: "Terrace at 19:30 please", act: 0 },
      { k: "msg", from: "business", text: "Booked ✅ See you tonight.", act: 0 },
      { k: "divider", from: "", text: "3 weeks later", act: 1 },
      { k: "msg", from: "business", text: "Morning Aisha ☕ Tuesday breakfast is 20% off today — and you're one visit from a free dessert.", act: 1 },
      { k: "msg", from: "customer", text: "Ooh. Save me the terrace table", act: 1 },
      { k: "msg", from: "business", text: "Done. Dessert unlocks after this one 🍰", act: 1 },
      { k: "divider", from: "", text: "After the visit", act: 2 },
      { k: "msg", from: "business", text: "Glad you loved it! Give a friend 15% off their first dinner and earn credit toward yours?", act: 2 },
      { k: "msg", from: "customer", text: "Yes, send it", act: 2 },
      { k: "link", from: "business", text: "refella.app/r/aisha", act: 2 },
      { k: "divider", from: "", text: "2 days later", act: 2 },
      { k: "msg", from: "business", text: "Dana booked Saturday from your link 🎉 ₸6,200 credit is on your account.", act: 2 },
    ],
    floaters: [
    { from: "business", text: "u said no doordash this week 🙂" },
    { from: "customer", text: "bro it's been a day" },
    { from: "business", text: "table's yours at 19:30. terrace, like always" },
  ],
    proofPoints: [
      "Live in a day with a QR code",
      "No app for your customers",
      "Revenue attributed per referral",
    ],
  },
  sectors: {
    title: "Built for businesses that live on repeat visits and word of mouth",
    items: [
      "Restaurants",
      "Cafés",
      "Clothing brands",
      "Salons & barbers",
      "Clinics",
      "Fitness studios",
      "Service providers",
    ],
  },
  pillars: {
    eyebrow: "The platform",
    title: "Three connected capabilities, one conversation",
    subtitle:
      "Most tools give you a chatbot, a punch card, or a referral link. Refella runs all three off one customer profile, so every answer, reward and introduction knows about the others.",
    items: [
      {
        tag: "Engage",
        title: "Be there the moment they ask",
        description:
          "Answer questions from your approved business information, collect private feedback before it becomes a public review, help with orders and bookings, and hand off to a person the moment it matters.",
        features: [
          "Answers grounded in your menu, prices and policies",
          "Private feedback capture, routed to the right manager",
          "Order and booking assistance in the chat",
          "Staff tipping with a built-in payment flow",
          "Human handoff with full conversation context",
        ],
      },
      {
        tag: "Retain",
        title: "Give them a reason to come back",
        description:
          "Loyalty that needs no card and no app. Refella tracks qualifying activity, remembers preferences, and sends offers people actually opted into — timed to how each customer really behaves.",
        features: [
          "Loyalty balances tracked and redeemed in chat",
          "Preferences and visit history on every profile",
          "Permission-based offers, never spam",
          "Win-back messages when a regular goes quiet",
          "Rewards applied automatically at checkout",
        ],
      },
      {
        tag: "Grow",
        title: "Turn a recommendation into a booking",
        description:
          "Asking for referrals is awkward. Refella asks at the right moment, writes the message, welcomes the friend, helps them book or buy, and pays out only once the visit actually happens.",
        features: [
          "Personal referral link for every customer",
          "Ready-to-forward message, one tap to share",
          "Referred friends greeted and guided to a booking",
          "Attribution from introduction to paid visit",
          "Rewards released only on qualifying activity",
        ],
      },
    ],
  },
  journey: {
    eyebrow: "The customer journey",
    title: "What your customer sees. What Refella handles.",
    subtitle:
      "One chat thread carries the whole relationship — from the first scan to the fifth friend they bring in.",
    columnCustomer: "Customer experience",
    columnSystem: "What Refella handles",
    steps: [
      {
        moment: "Join",
        customer:
          "Scans a QR code on the table, receipt or mirror and starts a chat with their name and phone number.",
        system:
          "Creates the customer profile, invites them into the loyalty program, and captures a clear opt-in for updates.",
      },
      {
        moment: "Engage",
        customer:
          "Asks a question, shares what they liked, or flags something that went wrong.",
        system:
          "Answers from approved business information, records the feedback against the profile, and involves staff when needed.",
      },
      {
        moment: "Recognize staff",
        customer: "Asks to tip a favourite chef, stylist or server.",
        system:
          "Identifies the staff member and opens a payment flow, with tips reported per person.",
      },
      {
        moment: "Earn & redeem",
        customer: "Checks their rewards and uses a benefit on the spot.",
        system:
          "Tracks qualifying activity, applies the loyalty reward, and keeps the balance honest across visits.",
      },
      {
        moment: "Return",
        customer:
          "Gets a relevant offer — a discounted breakfast on the morning they usually come in.",
        system:
          "Sends permission-based messages informed by stated preferences and real visit history.",
      },
      {
        moment: "Refer",
        customer:
          "Forwards a ready-made message with their personal referral link to a friend.",
        system:
          "Attributes the introduction and helps the friend book or buy in the same conversation.",
      },
      {
        moment: "Get rewarded",
        customer: "Receives credit after their friend's first visit.",
        system:
          "Verifies completion, applies the referral reward, and reports the revenue attributed to that introduction.",
      },
    ],
  },
  referral: {
    eyebrow: "The referral experience",
    title: "Sharing that takes one tap",
    subtitle:
      "Here is the whole loop at a salon — the same shape works for a dinner reservation, a fitting appointment or a service call.",
    steps: [
      {
        title: "Ask at the right moment",
        body:
          "Right after a satisfied appointment, the assistant offers: “Give a friend 15% off their first visit, and get credit toward your next one.”",
      },
      {
        title: "Make sharing effortless",
        body:
          "Maya gets a short, ready-to-forward message with her personal referral link. No screenshots, no codes to remember, no app.",
      },
      {
        title: "Welcome the friend",
        body:
          "Her friend opens the link and lands in a conversation that already knows why they're there: “Maya recommended you. Do you have appointments this Saturday?”",
      },
      {
        title: "Help them decide",
        body:
          "The assistant answers questions on services and prices from approved information, checks connected availability, and completes the booking — handing off to staff when it needs a person.",
      },
      {
        title: "Track the result",
        body:
          "Once the friend's appointment is completed, Maya is credited automatically and the salon sees the revenue attributed to that introduction.",
      },
    ],
  },
  outcomes: {
    eyebrow: "Why it works",
    title: "Channels people actually read",
    subtitle:
      "Email campaigns and loyalty apps compete for attention nobody has. A message thread your customer opened themselves is a different conversation entirely.",
    items: [
      {
        stat: "0",
        unit: "apps",
        label: "for your customers to download",
        body:
          "Everything happens in the messaging app already open on their phone. Adoption is a QR code, not an install.",
      },
      {
        stat: "1",
        unit: "profile",
        label: "behind every interaction",
        body:
          "Questions, feedback, tips, loyalty and referrals all write to one customer record — so offers are informed, not guessed.",
      },
      {
        stat: "100%",
        unit: "",
        label: "of referrals attributed to revenue",
        body:
          "Every introduction is tracked from the shared link to the completed visit, so you reward real outcomes and can see what word of mouth is worth.",
      },
    ],
  },
  chat: {
    title: "A conversation, not a campaign",
    caption: "Live preview",
    thread: [
      { from: "customer", text: "Hi! Do you have a table for 2 tonight?" },
      {
        from: "business",
        text: "Hi Aisha 👋 We do — 19:30 or 21:00. Last time you sat on the terrace, want me to keep that?",
      },
      { from: "customer", text: "Terrace at 19:30 please" },
      {
        from: "business",
        text: "Booked ✅ You're 1 visit away from a free dessert. Want to give a friend 15% off their first dinner and earn credit toward yours?",
      },
      { from: "customer", text: "Yes, send it" },
      {
        from: "business",
        text: "Here's your link — just forward it 👇 refella.app/r/aisha",
      },
    ],
  },
  faq: {
    eyebrow: "Questions",
    title: "What businesses ask us first",
    items: [
      {
        q: "Which messaging apps do you support?",
        a: "WhatsApp, iMessage, Telegram and Instagram. Most businesses start with WhatsApp because that's where their customers already message them, and add the others once the flow is working.",
      },
      {
        q: "Do my customers need to install anything?",
        a: "No. They scan a QR code and a chat opens in the app they already use. They start with their name and phone number — that's the entire onboarding.",
      },
      {
        q: "Will the AI say something wrong about my business?",
        a: "It answers from business information you approve — your menu, services, prices, hours and policies. When a question falls outside that, or a customer is unhappy, it hands the conversation to a person with the full context instead of guessing.",
      },
      {
        q: "How do you stop this from becoming spam?",
        a: "Every customer opts in explicitly when they join, offers are sent based on stated preferences and real visit history, and opting out takes one message. The point is relevance — a discounted breakfast on the morning they usually come in, not a blast to everyone.",
      },
      {
        q: "How is a referral actually attributed?",
        a: "Each customer gets a personal referral link. When a friend opens it, the introduction is attributed to them, and the reward is only released once the friend's visit or purchase is verified as complete. You see the revenue tied to each introduction.",
      },
      {
        q: "How does staff tipping work?",
        a: "A customer can ask to tip a specific chef, stylist or server. Refella identifies the staff member and opens a payment flow, and tips are reported per person so recognition lands with the right people.",
      },
      {
        q: "How long does setup take?",
        a: "Most businesses are live within a day. You connect a number, we load your approved business information and loyalty rules, and you put the QR code on tables, receipts or mirrors.",
      },
      {
        q: "What about my customers' data?",
        a: "Customers opt in for what they receive and can withdraw it at any time. Their data stays tied to your business and is used to serve them — preferences, visit history and rewards — not sold or shared.",
      },
    ],
  },
  finalCta: {
    title: "See it work on your own business",
    subtitle:
      "Open a chat and try the assistant the way your customers would. If it fits, we'll have you live with your own number, rules and rewards within a day.",
    primaryCta: "Try it on WhatsApp",
    secondaryCta: "Book a demo",
    whatsappMessage:
      "Hi Refella — I'd like to try the demo. My business is:",
    note: "No card required. A real conversation, not a form.",
  },
  footer: {
    tagline: "Loyalty and referrals that live in the chat.",
    productTitle: "Product",
    companyTitle: "Company",
    legalTitle: "Legal",
    product: {
      engage: "Engage",
      retain: "Retain",
      grow: "Grow",
      journey: "How it works",
    },
    company: {
      contact: "Contact",
      faq: "FAQ",
    },
    legal: {
      privacy: "Privacy",
      terms: "Terms",
    },
    rights: "All rights reserved.",
  },
  navMenu: [
    { title: "Engage", body: "Answers, feedback and tips in the chat" },
    { title: "Retain", body: "Loyalty and offers they opted into" },
    { title: "Grow", body: "Referrals tracked to real revenue" },
    { title: "Channels", body: "WhatsApp, iMessage, Telegram, Instagram" },
  ],
  statement: {
    title: "See the whole loop.",
    subtitle: "One chat. Every customer remembered, brought back, and multiplied.",
    note: "from first scan to fifth friend",
  },
  integrations: {
    title: "Lives in the apps your customers already use.",
    subtitle:
      "No download, no loyalty card, no new account. Refella works inside the messaging apps already open on their phone — and connects to the booking, POS and payment tools you already run.",
    apps: ["WhatsApp", "iMessage", "Telegram", "Instagram"],
  },
  mocks: {
    privacy: {
      thread: [
        { from: "customer", text: "stop sending me the breakfast offers" },
        { from: "business", text: "Done — offers are off. Your rewards still work, and I'll only reply when you write first." },
      ],
      note: "Opted out · preferences updated instantly",
    },
    app: {
      customersLabel: "Customers",
      customers: [
        { name: "Aisha K.", meta: "Terrace · 4 visits" },
        { name: "Maya R.", meta: "2 referrals · 1 pending" },
        { name: "Daniyar T.", meta: "Quiet for 38 days" },
        { name: "Elena V.", meta: "Free dessert ready" },
      ],
      referralsLabel: "Referrals",
      referralsAmount: "₸214,000",
      referralsCaption: "attributed this month",
      loyaltyLabel: "Loyalty",
      loyaltyCaption: "4 of 5 visits · dessert unlocks next",
      prefersLabel: "Prefers",
      prefersTags: ["Terrace", "No spicy", "19:30"],
      qrTitle: "Scan to join",
      qrCaption: "no app needed",
    },
    engage: {
      label: "Live chat",
      thread: [
        { from: "customer", text: "Is the lamb on the menu tonight?" },
        { from: "business", text: "Yes — slow-cooked, served until 22:00. Shall I hold a table?" },
        { from: "customer", text: "The soup was cold last time though" },
        { from: "business", text: "Sorry about that — I've passed it to Rustam, our floor manager." },
      ],
      footer: "Private feedback logged · routed to manager",
    },
    retain: {
      loyaltyLabel: "Loyalty",
      loyaltyCount: "4 / 5 visits",
      loyaltyCaption: "One more visit unlocks a free dessert",
      tags: ["Comes Tuesdays", "Breakfast", "Terrace", "Opted in"],
      thread: [
        { from: "business", text: "Morning Daniyar ☕ Tuesday breakfast is 20% off today — hold your usual table?" },
        { from: "customer", text: "Yes please" },
      ],
    },
    grow: {
      thread: [
        { from: "business", text: "Give a friend 15% off their first visit and earn credit toward your next one?" },
        { from: "customer", text: "Send it 👍" },
      ],
      linkLabel: "refella.app/r/maya",
      linkCaption: "Ready to forward · one tap",
      rows: [
        { name: "Dana", state: "Booked Saturday", done: false },
        { name: "Arman", state: "Visit completed · ₸18,400", done: true },
      ],
    },
  },
  phone: {
    typing: "typing…",
    composer: "Message",
  },
  channels: {
    lead: "meet Refella, an assistant that lives in your customers'",
    tail: "and brings them back around the clock.",
  },
  capabilities: {
    eyebrow: "Capabilities",
    title: "pick what Refella runs for you. it starts today.",
    all: "everything",
  },
  cards: {
    privacy: {
      tag: "Privacy",
      title: "their data stays theirs.",
      body: "Every customer opts in when they join and can withdraw it in one message. Their preferences, visits and rewards serve your business only — never sold, never shared.",
    },
  },
};

export type Dictionary = typeof en;
