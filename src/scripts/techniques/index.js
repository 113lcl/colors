/*
  Библиотека приёмов Undertow.
  Шесть простых интерактивных механик + накопление, доведённые до блеска и
  переиспользуемые во всех комнатах с разным «скином» под настроение ветки.
  Ни одна комната не изобретает свою игрушку — только берёт отсюда и перекрашивает.
*/

export { cursorSpot } from './cursor-spot.js'; // 1 — пятно за курсором с инерцией
export { magnetic } from './magnetic.js'; // 2 — притяжение к курсору
export { revealText } from './reveal-text.js'; // 3 — текст в своём темпе
export { dwell } from './dwell.js'; // 4 — реакция на удержание
export { scrollDrive } from './scroll-drive.js'; // 5 — скролл как единственный ввод
export { toggleScene } from './toggle-scene.js'; // 6 — переключатель «до/после»
export { accumulate, sinceLastVisit } from './accumulate.js'; // память между визитами
export { reduced, onFrame, lerp, clamp, seededRandom, memory, hasPointer } from './_util.js';
