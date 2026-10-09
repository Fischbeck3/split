// Split content: one entry per glass, each in its own place.
//
// Day No. 1 falls on LAUNCH, a local calendar date. The first days follow SCHEDULE in order.
// After that the game picks a glass by date and never serves the same glass two days running.
export const LAUNCH = '2026-10-08';
export const SCHEDULE = ['pub', 'beach', 'munich'];

// Fields
//   id          short unique name, saved with each result
//   name        the drink
//   label       the title of the day, shown on the card ("Pub night"); defaults to "<name> day"
//   line        one sentence under the title
//   scene       the place: 'pub', 'beach', 'munich' or 'bar'
//   vessel      the shape: 'tulip', 'nonic', 'tumbler', 'cup', 'mug', 'tall', 'bottle' or 'stein'
//   box         where the vessel sits, as fractions of the screen: top and bot edges; w and h cap its width
//   body        the drink's color, top then bottom
//   head        the foam color
//   headT       foam thickness, as a fraction of the vessel height
//   mark        what to split: 'letter', 'crown', 'crest', 'star', 'apple', 'shamrock', 'hop', 'bean' or 'leaf'
//   letter      the letter, when mark is 'letter'
//   markFill    mark colors
//   markStroke
//   target      how results name the mark ("the G")
//   markRange   where the center of the mark may sit, from the rim (0) down to the base (1)
//   markHRange  how tall the mark may be, as a fraction of the vessel height
//   speed       drink speed (1 is normal)
//   choppy      true or false fixes the wobble; leave it out and the date decides
//   bubbles     rising bubbles
export const THEMES = [
  {id: 'pub', name: 'Stout', label: 'Pub night', line: 'A stout in the corner of a dark pub. Split the G.', scene: 'pub', vessel: 'tulip',
    box: {top: 0.13, bot: 0.84, w: 0.34, h: 0.3}, body: ['#3a2416', '#0b0806'], head: '#f3e9cf', headT: 0.10,
    mark: 'letter', letter: 'G', markFill: '#f3e9cf', markStroke: '#1a110b', target: 'the G',
    markRange: [0.48, 0.64], markHRange: [0.10, 0.13], speed: 1, choppy: false},
  {id: 'beach', name: 'Beach lager', label: 'Beach day', line: 'A cold clear bottle in the sand, lime in the neck. The neck goes fast, the body goes slow. Split the crown.', scene: 'beach', vessel: 'bottle',
    box: {top: 0.06, bot: 0.84, w: 0.26, h: 0.19}, body: ['#f6e08f', '#ecc953'], head: '#fff9e2', headT: 0.015,
    mark: 'crown', markFill: '#e7b63b', markStroke: '#14306b', target: 'the crown',
    markRange: [0.52, 0.62], markHRange: [0.07, 0.09], speed: 1, choppy: true, bubbles: true},
  {id: 'munich', name: 'Festbier', label: 'Oktoberfest', line: 'A full liter in Munich with a big foam head. The line that counts is under the foam. Split the crest.', scene: 'munich', vessel: 'stein',
    box: {top: 0.2, bot: 0.84, w: 0.3, h: 0.36}, body: ['#f3bd45', '#d2891a'], head: '#fff8ea', headT: 0.14,
    mark: 'crest', markFill: '#2a67c9', markStroke: '#c9a24a', target: 'the crest',
    markRange: [0.5, 0.62], markHRange: [0.16, 0.2], speed: 0.75, choppy: false},
  {id: 'lager', name: 'Lager', line: 'Cold and golden. Split the star.', vessel: 'nonic', body: ['#f7c84f', '#dd961a'], head: '#fff8e6', headT: 0.08,
    mark: 'star', markFill: '#d8262c', markStroke: '#fff8e6', target: 'the star', bubbles: true},
  {id: 'pale', name: 'Pale ale', line: 'Hoppy and hazy. Split the hop.', vessel: 'tumbler', body: ['#e3902e', '#bf5f18'], head: '#f7efe0', headT: 0.07,
    mark: 'hop', markFill: '#5aa84a', markStroke: '#1d3b17', target: 'the hop'},
  {id: 'cider', name: 'Cider', line: 'Orchard day. Split the apple.', vessel: 'tulip', body: ['#f2d66f', '#d7ae36'], head: '#fbf6e3', headT: 0.035,
    mark: 'apple', markFill: '#d9372b', markStroke: '#fff6ea', target: 'the apple', bubbles: true},
  {id: 'red', name: 'Red ale', line: 'Deep and malty. Split the shamrock.', vessel: 'nonic', body: ['#a53a26', '#5a1911'], head: '#f1e4cf', headT: 0.08,
    mark: 'shamrock', markFill: '#3f9a4b', markStroke: '#f1e4cf', target: 'the shamrock'},
  {id: 'coffee', name: 'Iced coffee', line: 'No alcohol needed. Split the bean.', vessel: 'cup', body: ['#8f5d38', '#45291a'], head: '#f6ecd9', headT: 0.09,
    mark: 'bean', markFill: '#3b2314', markStroke: '#f6ecd9', target: 'the bean'},
  {id: 'choc', name: 'Chocolate milk', line: 'Kids’ table. Split the M.', vessel: 'mug', body: ['#7f4e2d', '#55311e'], head: '#fff6ea', headT: 0.05,
    mark: 'letter', letter: 'M', markFill: '#fff6ea', markStroke: '#3a2114', target: 'the M'},
  {id: 'matcha', name: 'Matcha latte', line: 'Green and calm. Split the leaf.', vessel: 'tumbler', body: ['#93c86f', '#5c9b47'], head: '#f3f6ea', headT: 0.06,
    mark: 'leaf', markFill: '#245f2a', markStroke: '#f3f6ea', target: 'the leaf'},
  {id: 'cola', name: 'Cola', line: 'Fizz. Split the C.', vessel: 'tall', body: ['#4a2416', '#140a07'], head: '#dcc9b0', headT: 0.045,
    mark: 'letter', letter: 'C', markFill: '#e6382f', markStroke: '#fff3ea', target: 'the C', bubbles: true}
];
