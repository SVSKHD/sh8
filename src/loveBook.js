/* content for the birthday love book (SphLoveBook): a cover, 98 pages of
   "I love you" around the world with a few milestone notes, and a finale.
   Phrasings are speaker-neutral where a language genders the speaker. */

export const LOVE_LANGS = [
  ["English", "I love you"],
  ["Telugu", "నేను నిన్ను ప్రేమిస్తున్నాను"],
  ["French", "Je t'aime"],
  ["Kannada", "ನಾನು ನಿನ್ನನ್ನು ಪ್ರೀತಿಸುತ್ತೇನೆ"],
  ["Italian", "Ti amo"],
  ["Hindi", "मुझे तुमसे प्यार है"],
  ["Spanish", "Te quiero"],
  ["Tamil", "நான் உன்னை காதலிக்கிறேன்"],
  ["German", "Ich liebe dich"],
  ["Malayalam", "ഞാൻ നിന്നെ സ്നേഹിക്കുന്നു"],
  ["Portuguese", "Eu te amo"],
  ["Marathi", "माझं तुझ्यावर प्रेम आहे"],
  ["Japanese", "愛してる"],
  ["Bengali", "আমি তোমাকে ভালোবাসি"],
  ["Korean", "사랑해"],
  ["Gujarati", "હું તને પ્રેમ કરું છું"],
  ["Mandarin", "我爱你"],
  ["Punjabi", "ਮੈਨੂੰ ਤੇਰੇ ਨਾਲ ਪਿਆਰ ਹੈ"],
  ["Dutch", "Ik hou van jou"],
  ["Urdu", "مجھے تم سے محبت ہے"],
  ["Swedish", "Jag älskar dig"],
  ["Nepali", "म तिमीलाई माया गर्छु"],
  ["Greek", "Σ'αγαπώ"],
  ["Sinhala", "මම ඔයාට ආදරෙයි"],
  ["Russian", "Я тебя люблю"],
  ["Thai", "ฉันรักเธอ"],
  ["Turkish", "Seni seviyorum"],
  ["Arabic", "أحبك"],
  ["Polish", "Kocham cię"],
  ["Persian", "دوستت دارم"],
  ["Romanian", "Te iubesc"],
  ["Ukrainian", "Я тебе кохаю"],
  ["Norwegian", "Jeg elsker deg"],
  ["Georgian", "მიყვარხარ"],
  ["Danish", "Jeg elsker dig"],
  ["Armenian", "Ես քեզ սիրում եմ"],
  ["Finnish", "Minä rakastan sinua"],
  ["Indonesian", "Aku cinta kamu"],
  ["Hungarian", "Szeretlek"],
  ["Filipino", "Mahal kita"],
  ["Czech", "Miluji tě"],
  ["Swahili", "Nakupenda"],
  ["Croatian", "Volim te"],
  ["Zulu", "Ngiyakuthanda"],
  ["Slovak", "Ľúbim ťa"],
  ["Afrikaans", "Ek is lief vir jou"],
  ["Irish", "Is breá liom thú"],
  ["Catalan", "T'estimo"],
  ["Welsh", "Rwy'n dy garu di"],
  ["Basque", "Maite zaitut"],
  ["Icelandic", "Ég elska þig"],
  ["Lithuanian", "Aš tave myliu"],
  ["Latvian", "Es tevi mīlu"],
  ["Estonian", "Ma armastan sind"],
  ["Albanian", "Të dua"],
  ["Malay", "Saya cintakan awak"],
  ["Esperanto", "Mi amas vin"],
  ["Latin", "Te amo"],
];

export const BOOK_PAGES = 100;

/* Latin-script lines dance letter by letter; other scripts dance word by
   word (splitting them per character would break their joined shapes) */
export const dancesByLetter = (text) => /^[\p{Script=Latin}\s'’!,.?-]+$/u.test(text);

/* pages[0] = cover, pages[1..98] = love, pages[99] = finale */
export function buildLoveBook({ name = "you", pet = "", from = "" } = {}) {
  const who = name || "you";
  const milestones = {
    25: { line: "25 pages in", sub: "and I've barely started" },
    50: { line: "Halfway", sub: "still falling for you, " + (pet || who) },
    75: { line: "75 pages", sub: "and not one of them is enough" },
    98: { line: "One more page…", sub: "the best one" },
  };
  const pages = [{ kind: "cover", line: who + "'s", sub: "birthday book", foot: from ? "with love, " + from : "" }];
  for (let n = 1; n < BOOK_PAGES - 1; n++) {
    if (milestones[n]) {
      pages.push({ kind: "milestone", n, ...milestones[n] });
      continue;
    }
    const [lang, line] = LOVE_LANGS[(n - 1) % LOVE_LANGS.length];
    // every 10th page says it in English with their pet name
    if (n % 10 === 0) pages.push({ kind: "love", n, line: "I love you", sub: pet || who, lang: "always" });
    else pages.push({ kind: "love", n, line, lang });
  }
  pages.push({
    kind: "finale",
    n: BOOK_PAGES,
    line: "Happy birthday",
    sub: who,
    foot: "100 pages, and still not enough." + (from ? " — " + from : ""),
  });
  return pages;
}

/* ---------- check-ins ----------
   At these pages the book stops and asks a little question; whichever
   answer they tap, a letter opens (each answer has its own lead-in line),
   and "Keep reading" carries on flipping. Keyed by page number as shown
   ("Page 10 of 100"), and by whose birthday it is — `default` is used for
   anyone without their own set.

   ✍️ DRAFTS — replace `body` (and anything else) with your own words.
   Blank lines in `body` become new paragraphs. */

export const BOOK_CHECKINS = {
  default: {
    10: {
      question: "Ten pages in… do you remember where all of this really started? ❤️",
      answers: [
        {
          label: "Kolkata? 👀",
          reply: "Yes. That city probably knows more about us than it should.",
        },
        {
          label: "Tell me 😌",
          reply: "Then let me tell you what was going on in my head back then.",
        },
      ],
      title: "Well… what did I have in mind when I met you in Kolkata?",
      body: "Honestly, I think I had an unrealised kind of love in me already. And somehow, the city, the timing, and you all came together at exactly the right moment. ❤️\n\nI don't know if you felt the same way, and maybe that's the whole point of it. Some things only make sense after they happen.\n\nWhen I met you, I thought I was simply going to show you my love. I didn't know you were going to hook me for life. 😌\n\nI still get angry sometimes, you know that. But whenever I talk to you, that ice on your tongue somehow cools me down. I realised that much later.\n\nMaybe Kolkata wasn't just where I met you.\n\nMaybe it was where I unknowingly met the person who was going to become impossible for me to leave.",
    },

    20: {
      question: "Twenty pages… did I actually have any expectations when I came to meet you?",
      answers: [
        {
          label: "You definitely did 😏",
          reply: "Maybe one. And you somehow never disappointed me.",
        },
        {
          label: "Tell me the truth 😌",
          reply: "Fine. There really wasn't much of an expectation.",
        },
      ],
      title: "I didn't expect much… except you to show up.",
      body: "Nope. Honestly, I didn't have some big expectation of what was going to happen.\n\nIt was much simpler than that.\n\nI just wondered… would you actually meet me or not?\n\nStrangely, you never disappointed me. ❤️\n\nI might have disappointed you at times, and I know that. But when it came to you, I never really had a list of expectations. I think I just wanted to see where this would go.\n\nAnd then somehow, it went everywhere.\n\nI don't even know when you stopped being someone I was meeting and became someone I was constantly thinking about.",
    },

    40: {
      question: "Forty pages… should I confess what I actually did to your life? 😏",
      answers: [
        {
          label: "I'm scared already 😂",
          reply: "You probably should be. But I have no regrets.",
        },
        {
          label: "Go on 😌",
          reply: "Fine. You already know half of this anyway.",
        },
      ],
      title: "I didn't just meet you. I hacked your life.",
      body: "Rather than changing my opinion about you, I think I did something much more dangerous.\n\nI hacked your life. Every possible way. 😂❤️\n\nAnd honestly? I'm glad I did.\n\nBecause somewhere along the way, you became part of my everyday thinking, my decisions, my plans, my happiness, my irritation… basically everything.\n\nAnd if you were serious about me, I knew I would definitely be serious about you.\n\nBut if you weren't, then all my seriousness wouldn't matter anyway.\n\nMaybe that was the risk I was willing to take.",
    },

    70: {
      question: "Seventy pages… do you know when I realised I was completely hooked? ❤️",
      answers: [
        {
          label: "Every time you got blocked? 😂",
          reply: "Exactly. And somehow I'm still here.",
        },
        {
          label: "Tell me 🥺",
          reply: "There wasn't really just one moment. That's the problem.",
        },
      ],
      title: "Somehow, I kept choosing you.",
      body: "Damn. This happened every time.\n\nEvery time I started feeling like, 'Okay, I'm really falling for this person.' ❤️\n\nAnd then came the blocking.\n\nThat one time, I genuinely thought, 'That's it. I'm done. I'm never seeing her face again.'\n\nAnd look at me now. 😂\n\nYou've blocked me more times than I'd like to admit, and somehow, idiotically, I'm still here. Again. And again. And again.\n\nMaybe that's what being hooked looks like.\n\nBecause despite all the anger, the chaos, the stupid fights and everything in between, there's always been something pulling me back to you.\n\nAnd maybe that something is simply… you.",
    },

    100: {
      question: "One hundred pages… do you know what makes you feel like home to me? 🏠❤️",
      answers: [
        {
          label: "Because I take care of you? 🥺",
          reply: "That too. But it's much more than that.",
        },
        {
          label: "Because I'm annoying? 😏",
          reply: "Annoyingly, yes. But that's not the whole answer.",
        },
      ],
      title: "You made me feel like I mattered.",
      body: "I think I felt like home when you started discussing your important plans with me and asking what I thought about them.\n\nYou made me feel important.\n\nAnd when I acted stupid, you didn't judge me. When I cried, you didn't judge me either. Somehow, you just made me feel like I was a kid who was allowed to be completely myself. 🥺\n\nThat's where I felt safe.\n\nI love that we plan things together. Every trip, every big decision, even things we probably never imagined planning together.\n\nAnd somehow, we even started talking about PawSattva and business together. ❤️\n\nYou became part of the plans without either of us realising how big that actually was.\n\nAnd yes, I love annoying you. I love watching you get irritated with me. 😂\n\nBut the stupidest part?\n\nWhen you aren't there to annoy me, I miss it terribly.",
    },

    130: {
      question: "One hundred and thirty pages… what scares me the most about loving you?",
      answers: [
        {
          label: "Losing me? 🥺",
          reply: "Maybe. But there's something even more specific.",
        },
        {
          label: "Nellore? 👀",
          reply: "You already know exactly where this is going.",
        },
      ],
      title: "Nellore.",
      body: "When you visit Nellore, that's probably one of the hardest phases for me.\n\nBecause somewhere inside me, I wish you would never have to leave.\n\nOr maybe, if you do leave, I want to be the person going with you.\n\nAs your husband. ❤️\n\nI know it sounds simple when I write it like that, but that's genuinely where my mind goes.\n\nI eagerly wait for the day when leaving isn't really leaving anymore.\n\nWhen we don't have to count the days until the next meeting.\n\nWhen being together isn't a visit.\n\nIt's just our life.",
    },

    160: {
      question: "One hundred and sixty pages… why do I still choose this chaos? ❤️",
      answers: [
        {
          label: "Because you're mad 😂",
          reply: "That is definitely part of it.",
        },
        {
          label: "Because you love me? 🥺",
          reply: "Exactly. But there's a little more to it.",
        },
      ],
      title: "Peace. Chaos. Happiness. Sadness. You.",
      body: "Honestly, I don't even know how to explain it properly.\n\nI feel like I've been hooked to you like a magnet.\n\nWith you, somehow, I get everything at once.\n\nPeace.\nChaos.\nHappiness.\nSadness.\nComfort.\nAnger.\nLaughter.\n\nAll in the same place. ❤️\n\nAnd strangely, I don't want a life where everything is perfectly calm all the time.\n\nI want the life where we can annoy each other, fight, laugh, make plans, apologise, cook, travel, work, dream and still come back to the same person at the end of the day.\n\nYou.",
    },

    200: {
      question: "Two hundred pages… have you ever wondered what my ordinary life with you looks like? 🥰",
      answers: [
        {
          label: "Tell me ❤️",
          reply: "It's actually much simpler than you might expect.",
        },
        {
          label: "Something dramatic? 😂",
          reply: "Nope. Just the kind of ordinary life I secretly want.",
        },
      ],
      title: "I don't dream of a perfect life. I dream of our normal life.",
      body: "When I imagine our future, I don't always picture some huge romantic moment.\n\nI picture something much more ordinary.\n\nI drop you somewhere.\nI pick you up.\nWe go to some restaurant.\nWe come home.\nWe talk about our day.\nWe annoy each other.\nWe take care of each other.\n\nAnd somehow, that feels like everything. ❤️\n\nThen I imagine a home filled with family, pets, kids, noise, chaos and probably a hundred things going wrong at the same time. 😂\n\nAnd yet, I think I'd still look at all of it and think…\n\n'Yeah. This is home.'",
    },

    240: {
      question: "Two hundred and forty pages… do you know what I hope you understand one day? ❤️",
      answers: [
        {
          label: "I'm listening 🥺",
          reply: "Then read this one slowly.",
        },
        {
          label: "You better make me emotional 😭",
          reply: "I wasn't planning to. But here we are.",
        },
      ],
      title: "I never knew I would want you.",
      body: "I've faced so many questions in my head.\n\nWhy wasn't it before?\nWhy didn't it happen then?\nWhy did we have to meet at that particular time?\nWhy not earlier?\nWhy not differently?\n\nAnd honestly, I don't have the answers.\n\nBecause before I met you in Kolkata, I never thought I would want you like this.\n\nI never thought you and I would have this kind of vibe.\n\nI never thought you would turn out to be someone so deep-rooted, someone who wasn't superficial, someone who could actually understand things beneath the surface.\n\nAnd maybe even now, what you see of me is only a very small part of everything I feel.\n\nI hope one day you realise that.\n\nMaybe you'll look back at all of this and finally understand that I didn't plan to fall for you.\n\nI just met you.\n\nAnd somehow, you became you. ❤️",
    },
  },
};

/* the check-ins for whoever's birthday it is, as { [pageNumber]: checkin } */
export const checkinsFor = (name) => BOOK_CHECKINS[name] || BOOK_CHECKINS.default || {};
