/*
  Единственный источник правды по карте сайта.
  Отсюда берут данные: страницы комнат, блок выходов, краулер и e2e-тесты.
  Менять карту нужно здесь, а не в двадцати местах.
*/

export const BRANCHES = {
  white: {
    name: 'Белая',
    feel: 'спокойствие, забота',
    colour: 'var(--c-white)',
    connective: 'journey',
    entry: 'cloud',
    label: 'выдохнуть',
  },
  green: {
    name: 'Зелёная',
    feel: 'тепло, свежесть',
    colour: 'var(--c-green)',
    connective: 'journey',
    entry: 'sage',
    label: 'то, что накопилось',
  },
  blue: {
    name: 'Синяя',
    feel: 'меланхолия, дистанция',
    colour: 'var(--c-blue)',
    connective: 'journey',
    entry: 'deep',
    label: 'всё дальше',
  },
  black: {
    name: 'Чёрная',
    feel: 'неуют, тревога',
    colour: 'var(--c-black)',
    connective: 'journey',
    entry: 'anthracite',
    label: 'не сейчас',
  },
  red: {
    name: 'Красная',
    feel: 'напряжение',
    connective: 'flashes',
    colour: 'var(--c-red)',
    entry: 'orange',
    label: 'на секунду',
  },
};

/*
  interactive: null — атмосферная комната (без ввода пользователя)
  иначе — имя приёма из библиотеки src/scripts/techniques/
  exits: слаги соседних комнат ТОЙ ЖЕ ветки (плюс всегда есть тихий путь к центру)
*/
export const ROOMS = [
  // ——— Белая: единое нарастающее путешествие, реакции полностью предсказуемы ———
  {
    branch: 'white',
    slug: 'cloud',
    title: 'Облачный',
    glyph: '雲',
    step: 1,
    interactive: 'dwell',
    exits: ['ivory', 'frost'],
    note: 'Форма выдыхает, если задержать на ней курсор дольше секунды.',
  },
  {
    branch: 'white',
    slug: 'ivory',
    title: 'Слоновая кость',
    glyph: '象牙',
    step: 2,
    interactive: 'reveal-text',
    exits: ['frost', 'sand'],
    note: 'Одна фраза на весь экран, тает и сменяется другой по клику.',
  },
  {
    branch: 'white',
    slug: 'frost',
    title: 'Морозный',
    glyph: '霜',
    step: 3,
    interactive: null,
    exits: ['sand', 'cloud'],
    note: 'Пустое пространство, где очень медленно проступают линии инея.',
  },
  {
    branch: 'white',
    slug: 'sand',
    title: 'Песочный',
    glyph: '砂',
    step: 4,
    interactive: 'scroll-drive',
    exits: ['cloud', 'ivory'],
    note: 'Бесконечный плавный скролл одного повторяющегося узора.',
  },

  // ——— Зелёная: тепло, мягкая пружина, предсказуемо ———
  {
    branch: 'green',
    slug: 'sage',
    title: 'Шалфейный',
    glyph: '芽',
    step: 1,
    interactive: 'accumulate',
    exits: ['mint', 'olive'],
    note: 'Форма чуть разрастается с каждым повторным заходом.',
  },
  {
    branch: 'green',
    slug: 'mint',
    title: 'Мятный',
    glyph: '息',
    step: 2,
    interactive: 'magnetic',
    exits: ['olive', 'chartreuse'],
    note: 'Деталь мягко пружинит и дышит вслед за курсором.',
  },
  {
    branch: 'green',
    slug: 'olive',
    title: 'Тёплый оливковый',
    glyph: '間',
    step: 3,
    interactive: null,
    exits: ['chartreuse', 'sage'],
    note: 'Сколько времени прошло с прошлого визита — тепло, а не как таймер.',
  },
  {
    branch: 'green',
    slug: 'chartreuse',
    title: 'Жёлто-зелёный',
    glyph: '萌',
    step: 4,
    interactive: null,
    exits: ['sage', 'mint'],
    note: 'Генеративный узор, каждый раз немного другой.',
  },

  // ——— Синяя: медленный дрейф, дистанция ———
  {
    branch: 'blue',
    slug: 'deep',
    title: 'Глубокий',
    glyph: '淵',
    step: 1,
    interactive: 'reveal-text',
    exits: ['turquoise', 'steel'],
    note: 'Текст очень медленно проявляется из темноты.',
  },
  {
    branch: 'blue',
    slug: 'turquoise',
    title: 'Бирюзовый',
    glyph: '水',
    step: 2,
    interactive: 'cursor-spot',
    exits: ['steel', 'dusk'],
    note: 'Почти невесомое движение, как отражения в воде.',
  },
  {
    branch: 'blue',
    slug: 'steel',
    title: 'Стальной',
    glyph: '遠',
    step: 3,
    interactive: null,
    exits: ['dusk', 'deep'],
    note: 'Абстрактная величина расстояния без единиц — просто масштаб.',
  },
  {
    branch: 'blue',
    slug: 'dusk',
    title: 'Сумеречный',
    glyph: '暮',
    step: 4,
    interactive: null,
    exits: ['deep', 'turquoise'],
    note: 'Почти неподвижная сцена с очень медленным дрейфом частиц.',
  },

  // ——— Чёрная: неуют; интерфейс ведёт себя не так ———
  {
    branch: 'black',
    slug: 'anthracite',
    title: 'Антрацит',
    glyph: '炭',
    step: 1,
    interactive: 'cursor-spot',
    exits: ['aubergine', 'ash'],
    note: 'Курсор отстаёт от мыши и на миг раздваивается.',
  },
  {
    branch: 'black',
    slug: 'aubergine',
    title: 'Баклажановый',
    glyph: '茄',
    step: 2,
    interactive: null,
    exits: ['ash', 'oxblood'],
    note: 'Текст каждый раз слегка переставлен местами.',
  },
  {
    branch: 'black',
    slug: 'ash',
    title: 'Пепельный',
    glyph: '灰',
    step: 3,
    interactive: null,
    exits: ['oxblood', 'anthracite'],
    note: 'Почти пустая комната; что-то шевелится на периферии.',
  },
  {
    branch: 'black',
    slug: 'oxblood',
    title: 'Оксблад',
    glyph: '血',
    step: 4,
    interactive: null,
    exits: ['anthracite', 'aubergine'],
    note: 'Обратный отсчёт без объяснений и обрывающаяся тишина.',
  },

  // ——— Красная: независимые вспышки, без нарастания ———
  {
    branch: 'red',
    slug: 'orange',
    title: 'Оранжевый',
    glyph: '脈',
    step: 0,
    interactive: null,
    exits: ['violet', 'yellow'],
    note: 'Пульс в ровном собственном ритме, лёгкое нетерпение.',
  },
  {
    branch: 'red',
    slug: 'violet',
    title: 'Фиолетовый',
    glyph: '刻',
    step: 0,
    interactive: 'dwell',
    exits: ['pink', 'orange'],
    note: 'Отсчёт, который ускоряется, если задержаться.',
  },
  {
    branch: 'red',
    slug: 'pink',
    title: 'Розовый',
    glyph: '声',
    step: 0,
    interactive: null,
    exits: ['yellow', 'violet'],
    note: 'Текст кричит крупно, а по смыслу — нежный.',
  },
  {
    branch: 'red',
    slug: 'yellow',
    title: 'Жёлтый',
    glyph: '閃',
    step: 0,
    interactive: 'toggle-scene',
    exits: ['orange', 'pink'],
    note: 'Мягкая, но резкая вспышка при взаимодействии.',
  },
];

export const roomPath = (branch, slug) => `/${branch}/${slug}/`;

export function getRoom(branch, slug) {
  return ROOMS.find((r) => r.branch === branch && r.slug === slug);
}

export function branchRooms(branch) {
  return ROOMS.filter((r) => r.branch === branch);
}

/* Выходы комнаты как готовые ссылки: соседи по ветке + тихий путь к центру. */
export function exitsFor(branch, slug) {
  const room = getRoom(branch, slug);
  if (!room) return [];
  return room.exits.map((s) => {
    const target = getRoom(branch, s);
    return { href: roomPath(branch, s), title: target.title, glyph: target.glyph };
  });
}

export const ALL_PATHS = ['/', '/colophon/', ...ROOMS.map((r) => roomPath(r.branch, r.slug))];
