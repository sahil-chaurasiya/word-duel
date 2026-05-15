const WORD_LISTS = {
  Animals: [
    "ant","ape","bat","bee","cat","cod","cow","cub","doe","dog","eel","elk","emu",
    "ewe","fly","fox","gnu","hen","hog","jay","koi","pig","ram","rat","yak",
    "bear","bird","boar","buck","bull","clam","colt","crab","crow","deer","dove",
    "duck","fawn","flea","frog","gnat","goat","hare","hawk","ibis","kite","lamb",
    "lark","loon","lynx","mare","mink","mole","moth","mule","newt","pony","puma",
    "slug","swan","toad","vole","wasp","wolf","worm","wren",
    "adder","bison","cobra","crane","dingo","eagle","egret","finch","gecko","goose",
    "grebe","hippo","horse","hyena","jaguar","koala","lemur","llama","macaw",
    "moose","mouse","otter","panda","parrot","quail","raven","rhino","robin",
    "shark","sheep","shrew","skunk","sloth","snail","snipe","squid","stork",
    "swift","tapir","tiger","trout","viper","whale","zebra",
    "aardvark","albatross","alligator","anaconda","anteater","antelope","armadillo",
    "baboon","badger","buffalo","buzzard","caribou","cheetah","chicken","chipmunk",
    "dolphin","donkey","echidna","elephant","flamingo","gazelle","gerbil","gibbon","gorilla",
    "hamster","iguana","impala","jellyfish","kangaroo","leopard","lobster","manatee",
    "meerkat","mongoose","monitor","narwhal","ocelot","octopus","ostrich","panther",
    "peacock","pelican","penguin","piranha","platypus","porcupine","porpoise",
    "raccoon","reindeer","salamander","scorpion","seahorse","sparrow","squirrel",
    "starfish","sturgeon","swallow","termite","tortoise","toucan","vulture","walrus",
    "warthog","wolverine","woodpecker","crocodile","rhinoceros","chimpanzee","orangutan"
  ],
  Countries: [
    "chad","cuba","fiji","iran","iraq","laos","mali","oman","peru","togo",
    "china","egypt","france","ghana","greece","haiti","india","italy","japan",
    "kenya","libya","nepal","niger","qatar","spain","sudan","syria","tonga",
    "wales","yemen",
    "angola","belize","bhutan","brazil","brunei","canada","cyprus","denmark",
    "ecuador","eritrea","ethiopia","finland","georgia","germany","grenada",
    "hungary","iceland","ireland","israel","jamaica","jordan","kuwait","latvia",
    "lebanon","lesotho","liberia","malawi","mexico","monaco","mongolia","morocco",
    "myanmar","namibia","nigeria","norway","pakistan","panama","poland","portugal",
    "romania","rwanda","senegal","serbia","slovakia","somalia","sweden","taiwan",
    "thailand","tunisia","turkey","uganda","ukraine","uruguay","vietnam","zambia",
    "zimbabwe",
    "afghanistan","argentina","australia","azerbaijan","bangladesh","cambodia",
    "cameroon","colombia","comoros","croatia","djibouti","dominica","honduras",
    "indonesia","kazakhstan","kyrgyzstan","luxembourg","madagascar","malaysia",
    "maldives","mauritius","mozambique","nicaragua","paraguay","philippines",
    "singapore","slovenia","srilanka","tanzania","tajikistan","venezuela"
  ],
  Movies: [
    "it","up","us","get","her","jaws","bull","heat","hook","lion","luca","mulan",
    "nope","prey","soul","thor","tron","wall","alien","blade","coco","crash","dune",
    "fargo","fury","hugo","hunt","tenet","terminator","venom","wonder","zombieland",
    "revenant","platoon","silence","snatch","traffic","requiem","stardust","twilight",
    "tangled","taken","split","speed","seven","scream","rush","room","road","rain"
  ],
  Fruits: [
    "fig","acai","date","kiwi","lime","pear","plum",
    "apple","avocado","berry","cherry","grape","guava","lemon","mango",
    "melon","olive","papaya","peach","prune",
    "almond","banana","cashew","citrus","damson","durian","feijoa","lychee",
    "orange","pawpaw","quince","raisin","tomato",
    "apricot","coconut","cumquat","dragonfruit","kumquat",
    "pineapple","plantain","pomelo","rambutan","soursop","starfruit",
    "tamarind","tangerine","watermelon","blackberry","blueberry","boysenberry",
    "breadfruit","cantaloupe","clementine","elderberry","gooseberry","grapefruit",
    "jackfruit","loganberry","mulberry","nectarine","persimmon",
    "pomegranate","raspberry","strawberry"
  ],
  Sports: [
    "ski","run","box","row","swim","golf","polo","judo","surf","dive",
    "rugby","chess","fencing","hiking","hockey","karate","squash","tennis",
    "archery","bowling","cricket","croquet","curling","cycling","darts","discus",
    "fishing","football","frisbee","hurling","javelin","jogging","jujitsu",
    "kayaking","lacrosse","marathon","netball","parkour","rowing",
    "sailing","shooting","skating","skiing","softball",
    "swimming","triathlon","volleyball","wrestling","badminton","basketball",
    "biathlon","bobsled","climbing","equestrian","gymnastics","handball","luge",
    "snowboard","taekwondo","waterpolo","weightlifting"
  ],
  Foods: [
    "pie","jam","egg","ham","oat","yam","bun","dip",
    "cake","chip","chop","clam","corn","crab","dosa","fish","flan",
    "kale","lamb","leek","naan","pita","pork","rice","roll",
    "roti","soup","stew","taco","tofu","wonton","bacon","bagel","basil",
    "bread","broth","burrito","candy","cereal","cheese","chicken","chili",
    "chips","cobbler","cookie","crepe","curry","custard","donut","dumpling",
    "falafel","fritter","garlic","gelato","gnocchi","granola","gravy",
    "hotdog","hummus","kebab","lasagna","lentil","macaroni",
    "meatball","muffin","mushroom","mustard","noodle","omelet","onion","oyster",
    "paella","pancake","pasta","pepper","pickle","pizza","polenta",
    "popcorn","potato","pretzel","pudding","quinoa","ravioli","risotto","salad",
    "salmon","salsa","sandwich","sausage","scones","shrimp","spaghetti","sushi",
    "tartare","tempura","tiramisu","tortilla","truffle","waffle","yogurt"
  ],
  Elements: [
    "tin","iron","gold","neon","lead","zinc",
    "argon","boron","radon","xenon",
    "barium","carbon","cobalt","copper","helium","iodine","nickel","oxygen",
    "radium","silver","sodium","sulfur",
    "arsenic","bismuth","bromine","caesium","calcium","chromium",
    "erbium","fluorine","gallium","hafnium","iridium","krypton",
    "lithium","mercury","niobium","osmium","palladium","phosphorus",
    "platinum","plutonium","potassium","rhenium","rhodium","rubidium",
    "samarium","scandium","selenium","silicon","strontium","tantalum","tellurium",
    "thallium","thorium","titanium","tungsten","uranium",
    "vanadium","yttrium","zirconium","aluminum","antimony",
    "beryllium","cadmium","chlorine","dysprosium",
    "europium","germanium","hydrogen","lanthanum","lutetium","magnesium","manganese",
    "neodymium","neptunium","nitrogen"
  ],
  Vehicles: [
    "bus","car","jet","van","auto","boat","cart","jeep","limo","ship","tank","tram",
    "barge","blimp","buggy","canoe","coach","drone","ferry","glider",
    "kayak","liner","lorry","moped","plane","train","truck","yacht",
    "aircraft","airship","ambulance","bicycle","bulldozer","caravan","chopper",
    "cruiser","dinghy","fighter","gondola","helicopter","hovercraft",
    "locomotive","monorail","motorboat","motorcycle",
    "scooter","snowmobile","spacecraft","speedboat","submarine",
    "tanker","taxicab","tractor","tramcar","tricycle","tugboat",
    "warship","wheelchair","zeppelin"
  ]
};

const CATEGORIES = Object.keys(WORD_LISTS);
const RARE_LETTERS = new Set(['q','x','z','j','k','v','w','y']);
const VERY_RARE = new Set(['q','x','z']);

function validateWord(word, category) {
  const w = word.toLowerCase().trim();
  if (!w || w.length < 2) return false;
  const list = WORD_LISTS[category];
  if (!list) return false;
  return list.includes(w);
}

function getRandomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

function getRandomWord(category, usedWords = []) {
  const list = WORD_LISTS[category] || [];
  const available = list.filter(w => !usedWords.includes(w));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function getWordsByLength(category, minLen, usedWords = []) {
  const list = WORD_LISTS[category] || [];
  const available = list.filter(w => w.length >= minLen && !usedWords.includes(w));
  if (available.length === 0) return getRandomWord(category, usedWords);
  return available[Math.floor(Math.random() * available.length)];
}

function calculateDamage(word, submissionTime, roundDuration) {
  if (!word) return 0;
  const w = word.toLowerCase();
  let damage = w.length;
  let rarebonus = 0;
  for (const ch of w) {
    if (VERY_RARE.has(ch)) rarebonus += 3;
    else if (RARE_LETTERS.has(ch)) rarebonus += 1;
  }
  damage += rarebonus;
  const ratio = Math.max(0, 1 - submissionTime / roundDuration);
  const speedBonus = Math.floor(ratio * 5);
  damage += speedBonus;
  return damage;
}

module.exports = {
  WORD_LISTS,
  CATEGORIES,
  validateWord,
  getRandomCategory,
  getRandomWord,
  getWordsByLength,
  calculateDamage
};
