(function () {
  "use strict";

  /* ===================== icon image helper ===================== */
  function iconImg(name, extraClass) {
    return '<img src="images/icon-' + name + '.svg" class="img-icon' + (extraClass ? ' ' + extraClass : '') + '" alt="">';
  }

  /* ===================== card data ===================== */
  var TYPE_LABEL = { force: 'フォース', horse: '馬', item: 'アイテム', jockey: '騎手', situation: '状況' };
  var uidCounter = 0;
  function uid() { uidCounter++; return 'c' + uidCounter; }
  function makeCard(type, name, icon, stat, extra) {
    var c = { id: uid(), type: type, name: name, icon: icon, stat: stat };
    if (extra) for (var k in extra) c[k] = extra[k];
    return c;
  }
  var FORCE_IMG = 'images/force-icon.png';
  function forceCard(name) {
    var c = makeCard('force', name || 'フォース', iconImg('horse'), '');
    c.img = FORCE_IMG;
    return c;
  }
  // effectType: 'run_bonus' | 'guard_bonus' | 'draw' | 'discard_opponent' など。
  // 新しいアイテムを追加するときは、effectType/effectValue を指定するだけでよい
  // （分岐を増やす必要があるのは新しい effectType を作るときだけ。applyItemEffect を参照）。
  function itemCard(name, effect, code, effectType, effectValue) {
    return makeCard('item', name, iconImg('trophy'), effect, {
      code: code,
      effectType: effectType,
      effectValue: effectValue
    });
  }
  function jockeyCard(name, effect, code, effectType, effectValue) {
    return makeCard('jockey', name, iconImg('horse'), effect, { code: code, effectType: effectType, effectValue: effectValue });
  }
  function horseCard(name, en, run, guard, style, dist, fav, cost, surface) {
    return makeCard('horse', name, iconImg('horse'), '', {
      en: en, run: run, guard: guard, style: style, dist: dist, fav: fav, cost: cost || 2,
      surface: surface || ['芝']
    });
  }
  var KANKAN_IMG = 'images/kankan-icon.png';
  var KANKAN_ART = 'images/kankan-art.png';

  function situationCard(name, stat, img, artImg) {
    var c = makeCard('situation', name, iconImg('sun'), stat || '全馬 走破+1（仮）');
    if (img) c.img = img;
    c.artImg = artImg || (img && img.indexOf('kankan') >= 0 ? KANKAN_ART : (img || null));
    return c;
  }

  function goldShip() {
    var c = horseCard('ゴールドシップ', 'GOLD SHIP', 3, 1, '先行・差し', '中・長', '中山/京都/阪神・良', 2);
    c.img = 'images/horse-goldship.jpg';
    return c;
  }
  function rousham() {
    var c = horseCard('ローシャムパーク', 'ROUSHAM PARK', 3, 2, '先行・差し', '中', '中山/函館・良', 2);
    c.img = 'images/horse-rousham.jpg';
    return c;
  }
  function seferRasiel() {
    var c = horseCard('セファーラジエル', 'SAFER RASIEL', 3, 2, '先行・差し', '中・長', '中京・良', 2);
    c.img = 'images/horse-seferrasiel.jpg';
    return c;
  }

  function silkMobius() {
    var c = horseCard('シルクメビウス', 'SILK MOBIUS', 3, 2, '先行・差し', 'マイル・中', '京都・良/不良', 3, ['ダート']);
    c.img = 'images/horse-silkmobius.jpg';
    return c;
  }
  function seiunSky() {
    var c = horseCard('セイウンスカイ', 'SEIUN SKY', 3, 1, '逃げ・先行', '中・長', '京都/中山/札幌・良/稍重', 2);
    c.img = 'images/horse-seiunsky.jpg';
    return c;
  }
  function doDeuce() {
    var c = horseCard('ドウデュース', 'DO DEUCE', 5, 3, '先行・差し', '中', '東京/中山・良', 3);
    c.img = 'images/horse-dodeuce.jpg';
    return c;
  }
  function sonnig() {
    var c = horseCard('ゾンニッヒ', 'SONNIG', 2, 1, '先行・差し', '短・マイル', '札幌/函館・良/稍重', 1);
    c.img = 'images/horse-sonnig.png';
    return c;
  }
  // CPU側が走破時にランダムで使用する馬カードのプール
  var CPU_HORSE_POOL = [
    silkMobius,
    seiunSky,
    doDeuce,
    sonnig
  ];

  /* ---- アイテムカード（例。effectType/effectValue を変えるだけで種類を増やせる） ---- */
  function whip() {
    var c = itemCard('鞭', '自分の馬の走破数を+1する', 'SDF-074', 'run_bonus', 1);
    c.img = 'images/item-whip.png';
    return c;
  }
  function kutsuwa() {
    var c = itemCard('口輪', '使用した馬のフォース能力を使用できなくし、ガード値がプラスされていたらその効果をなくす。ガード値を-1する', 'FHS-048', 'guard_bonus', -1);
    c.img = 'images/item-kutsuwa.png';
    return c;
  }
  function eliteJockey() {
    var c = jockeyCard('エリートジョッキー', '自分の馬の走破数を+1する。ガード値を+1する', 'SDF-081', 'elite_jockey', 1);
    c.guardBonus = 1;
    c.img = 'images/elite-jockey.png';
    return c;
  }
  function veterinarian() {
    var c = itemCard('獣医師', 'ファームからノーマルフォースカードを1枚と、ゲームから除外されている自分の馬カードを1枚手札に戻してもよい', 'WEF-044', 'farm_recovery', 1);
    c.img = 'images/veterinarian.png';
    return c;
  }

  /* ===================== プレイヤー山札（40枚）構成 =====================
     - 状況カード: 1枚（かんかん照り）
     - アイテムカード: 3枚（エリートジョッキー, 鞭, 獣医師）
     - 馬カード: 17枚（ゴールドシップ×3, ローシャムパーク×3, セファーラジエル×3, シルクメビウス×2, セイウンスカイ×2, ドウデュース×2, ゾンニッヒ×2）
     - フォースカード: 19枚
     合計: 40枚
  ====================================================================== */
  var FREEPLAY_POOL = [
    // 状況カード（1枚 / 2.5%）
    function () { return situationCard('かんかん照り', '馬場状態を一段階良くする', KANKAN_IMG); },
    // アイテムカード（3枚 / 7.5%）
    function () { return eliteJockey(); },
    function () { return whip(); },
    function () { return veterinarian(); },
    // 馬カード（17枚 / 42.5%）
    function () { return goldShip(); },
    function () { return goldShip(); },
    function () { return goldShip(); },
    function () { return rousham(); },
    function () { return rousham(); },
    function () { return rousham(); },
    function () { return seferRasiel(); },
    function () { return seferRasiel(); },
    function () { return seferRasiel(); },
    function () { return silkMobius(); },
    function () { return silkMobius(); },
    function () { return seiunSky(); },
    function () { return seiunSky(); },
    function () { return doDeuce(); },
    function () { return doDeuce(); },
    function () { return sonnig(); },
    function () { return sonnig(); },
    // フォースカード（19枚 / 47.5%）
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); },
    function () { return forceCard(); }
  ];

  function createPlayerDeck40(forTutorial) {
    var deck = [
      // 1. 状況カード（1枚）
      function () { return situationCard('かんかん照り', '馬場状態を一段階良くする', KANKAN_IMG); },

      // 2. アイテムカード（3枚）
      function () { return eliteJockey(); },
      function () { return whip(); },
      function () { return veterinarian(); },

      // 3. 馬カード（17枚）
      function () { return goldShip(); },
      function () { return goldShip(); },
      function () { return goldShip(); },
      function () { return rousham(); },
      function () { return rousham(); },
      function () { return rousham(); },
      function () { return seferRasiel(); },
      function () { return seferRasiel(); },
      function () { return seferRasiel(); },
      function () { return silkMobius(); },
      function () { return silkMobius(); },
      function () { return seiunSky(); },
      function () { return seiunSky(); },
      function () { return doDeuce(); },
      function () { return doDeuce(); },
      function () { return sonnig(); },
      function () { return sonnig(); },

      // 4. フォースカード（19枚）
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); },
      function () { return forceCard(); }
    ];

    if (forTutorial) {
      // チュートリアル用：1枚目にエリートジョッキー、2枚目に状況カード、残り38枚をシャッフル
      var first = function () { return eliteJockey(); };
      var second = function () { return situationCard('かんかん照り', '馬場状態を一段階良くする', KANKAN_IMG); };
      var rest = deck.filter(function (fn, idx) {
        return idx !== 0 && idx !== 1;
      });
      for (var i = rest.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = rest[i];
        rest[i] = rest[j];
        rest[j] = temp;
      }
      return [first, second].concat(rest);
    } else {
      // 自分で操作（マニュアルモード）：最初のドローと次の2枚のドロー（計3枚）をフォースカードに確定
      var force1 = function () { return forceCard(); };
      var force2 = function () { return forceCard(); };
      var force3 = function () { return forceCard(); };
      var restManual = deck.slice(0, deck.length - 3);
      for (var k = restManual.length - 1; k > 0; k--) {
        var r = Math.floor(Math.random() * (k + 1));
        var tmp = restManual[k];
        restManual[k] = restManual[r];
        restManual[r] = tmp;
      }
      return [force1, force2, force3].concat(restManual);
    }
  }

  var playerDeck = [];
  function resetPlayerDeck(forTutorial) {
    playerDeck = createPlayerDeck40(forTutorial);
  }
  function resetDrawQueue() {
    resetPlayerDeck(true);
  }

  var nextDrawOverride = null;

  function getNextPlayerDrawCard() {
    if (nextDrawOverride) {
      var override = nextDrawOverride;
      nextDrawOverride = null;
      return typeof override === 'function' ? override() : override;
    }
    if (playerDeck && playerDeck.length > 0) {
      return playerDeck.shift()();
    }
    // 状況カードはデッキ全体で1枚限りのため、既に存在（場/手札/ファーム）する場合はフォールバックプールから除外
    var hasSituationAlready = (situation !== null) || hand.some(function (c) { return c.type === 'situation'; }) || farm.some(function (c) { return c.type === 'situation'; });
    var pool = FREEPLAY_POOL;
    if (hasSituationAlready) {
      pool = FREEPLAY_POOL.filter(function (fn) {
        var sample = fn();
        return sample.type !== 'situation';
      });
    }
    var maker = pool[Math.floor(Math.random() * pool.length)];
    return maker();
  }

  // 自分で操作モードでの相手（CPU）ドローキュー（既存のカード画像から組み合わせたデッキ）
  var cpuDrawQueue = [];
  function resetCpuDrawQueue() {
    cpuDrawQueue = [
      function () { return forceCard(); },       // 1手番目: フォース（走破コスト補充）
      function () { return sonnig(); },          // 2手番目: ゾンニッヒ（コスト1馬）
      function () { return whip(); },            // 3手番目: 鞭（走破ボーナス+1）
      function () { return forceCard(); },       // 4手番目: フォース
      function () { return veterinarian(); },    // 5手番目: 獣医師（ファーム回収）
      function () { return doDeuce(); },         // 6手番目: ドウデュース（走破5の強力馬）
      function () { return goldShip(); },        // 7手番目: ゴールドシップ
      function () { return sonnig(); },          // 8手番目: ゾンニッヒ（コスト1馬）
      function () { return forceCard(); },       // 9手番目: フォース
      function () { return rousham(); },         // 10手番目: ローシャムパーク
      function () { return forceCard(); },       // 11手番目: フォース
      function () { return eliteJockey(); },     // 12手番目: エリートジョッキー
      function () { return seferRasiel(); },     // 13手番目: セファーラジエル
      function () { return forceCard(); }        // 14手番目: フォース
    ];
  }

  function getNextCpuDrawCard() {
    if (cpuDrawQueue && cpuDrawQueue.length > 0) {
      return cpuDrawQueue.shift()();
    }
    var maker = FREEPLAY_POOL[Math.floor(Math.random() * FREEPLAY_POOL.length)];
    return maker();
  }

  function initCpuHandAndDeck() {
    // 相手の手札7枚（馬カード2枚、フォースカード3枚、アイテム2枚：既存カード画像で構成）
    cpuHand = [
      seiunSky(),      // セイウンスカイ (逃げ・先行 / 中・長, cost: 2, run: 3)
      silkMobius(),    // シルクメビウス (先行・差し / マイル・中, cost: 3, run: 3)
      forceCard(),     // フォースカード
      forceCard(),     // フォースカード
      forceCard(),     // フォースカード
      whip(),          // 鞭 (走破数+1)
      eliteJockey()    // エリートジョッキー (走破数+1, ガード+1)
    ];
    opponentHandCount = cpuHand.length;
    resetCpuDrawQueue();
  }

  /* ===================== game state ===================== */
  var hand = [];
  var farm = [];
  var oppFarm = [];
  var field = null;
  var fieldGuard = null; // 走破中の馬カードに対してガードが成立した時、その馬カードを重ねて表示する
  var opponentHandCount = 0;
  var LANES = [
    { key: 'nige', label: '逃げ', count: 0 },
    { key: 'senko', label: '先行', count: 0 },
    { key: 'sashi', label: '差し', count: 0 },
    { key: 'oikomi', label: '追込', count: 0 }
  ];
  function currentLane() {
    for (var i = 0; i < LANES.length; i++) { if (LANES[i].count > 0) return LANES[i]; }
    return null;
  }
  var gameReady = false;
  function totalDeck() {
    return LANES.reduce(function (sum, l) { return sum + l.count; }, 0);
  }
  function drawOneFromDeck() {
    var lane = currentLane();
    if (!lane) return null;
    lane.count--;
    if (gameReady) checkVictory();
    return lane;
  }
  // 相手（CPU）自身の山札（自分の山札とは別に、4つの距離エリアを持つ）
  var CPU_LANES = [
    { key: 'nige', label: '逃げ', count: 0 },
    { key: 'senko', label: '先行', count: 0 },
    { key: 'sashi', label: '差し', count: 0 },
    { key: 'oikomi', label: '追込', count: 0 }
  ];
  function cpuCurrentLane() {
    for (var i = 0; i < CPU_LANES.length; i++) { if (CPU_LANES[i].count > 0) return CPU_LANES[i]; }
    return null;
  }
  function cpuTotalDeck() {
    return CPU_LANES.reduce(function (sum, l) { return sum + l.count; }, 0);
  }
  function cpuDrawOneFromDeck() {
    var lane = cpuCurrentLane();
    if (!lane) return null;
    lane.count--;
    if (gameReady) checkVictory();
    return lane;
  }
  var situation = null;

  /* 本編ではこの情報を基準に、馬の適性を走破値へ反映する。 */
  var race = { racecourse: '東京', surface: '芝', distance: '中距離', trackCondition: '良' };
  function raceDistanceKey(value) {
    if (value === '短距離') return '短';
    if (value === 'マイル') return 'マイル';
    if (value === '中距離') return '中';
    return '長';
  }
  function styleMatchesCurrentArea(card) {
    var lane = currentLane();
    return !!(lane && (card.style || '').indexOf(lane.label) >= 0);
  }
  function runModifiers(card) {
    var mods = [];
    if ((card.surface || []).indexOf(race.surface) < 0) mods.push({ value: -1, label: '馬場不一致 -1' });
    if ((card.dist || '').indexOf(raceDistanceKey(race.distance)) < 0) mods.push({ value: -1, label: '距離不一致 -1' });
    if (styleMatchesCurrentArea(card)) mods.push({ value: 1, label: '脚質一致 +1' });
    return mods;
  }
  function effectiveRun(card, bonus) {
    return (card.run || 0) + (bonus || 0) + runModifiers(card).reduce(function (sum, mod) { return sum + mod.value; }, 0);
  }
  function renderRaceInfo() {
    var el = $('race-info');
    if (el) el.innerHTML = iconImg('flag', 'img-icon-inline') + ' ' + race.racecourse + '・' + race.surface + '・' + race.distance + '・' + race.trackCondition;
  }

  var interactionMode = null;   // 'draw' | 'select-force' | 'select-horse' | 'select-any' | 'freeplay' | null
  var selectionNeeded = 0;
  var selectionCount = 0;
  var actionResolve = null;
  var currentArrowTarget = null;

  /* ===================== Freeplay state ===================== */
  var canDraw = true;
  var runBonus = 0;
  var selectedHorse = null;
  var selectedForces = [];
  var phase = 'idle';
  var prevPhase = 'idle';
  var prevSelectedHorse = null;
  var prevSelectedForces = [];
  var cpuRunValue = 0;
  var cpuHorseCard = null; // CPU側が今の走破で使用している馬カード（自分の手札から選ばれる）
  var cpuHand = []; // CPU側の実際の手札（表には出さないが、走破できるかの判定に使う）
  var cpuRunBonus = 0; // CPUのアイテム等による走破ボーナス
  var cpuItemGuardBonus = 0; // CPUのアイテム等によるガードボーナス
  var cpuConsecutiveGuardCount = 0; // CPUが連続でガードした回数（2回連続で次はガード不可）
  var guardValue = 0;
  var itemGuardBonus = 0; // guard_bonus アイテムの効果を一時的に積んでおく変数
  var isCpuTurn = false;
  var hasRunThisTurn = false;
  var pendingFinishRun = null;
  var lastDrawer = null; // 'player' | 'cpu' — 山札を最後に引いたのはどちらか
  var gameTurn = 1; // ターン数（先攻1ターン目は1、以降増える）

  /* ===================== dom helpers ===================== */
  function $(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function buildCardEl(c) {
    var el = document.createElement('div');
    el.className = 'card type-' + c.type;
    el.dataset.id = c.id;

    if (c.img) {
      el.classList.add('card-real-art');
      el.style.backgroundImage = 'url(' + c.img + ')';
      el.innerHTML = '<div class="card-shine"></div>';
      return el;
    }

    var head = '<div class="card-head"><span class="card-type-tag">' + TYPE_LABEL[c.type] + '</span><span class="head-right">';
    if (c.type === 'horse') {
      head += '<span class="cost-badge">' + c.cost + '</span><span class="turf-badge"></span>';
    }
    head += '</span></div>';

    var art = '<div class="card-art"><span class="art-icon">' + c.icon + '</span>';
    if (c.type === 'horse') art += '<span class="art-en">' + c.en + '</span>';
    art += '</div>';

    var extra = '';
    if (c.type === 'horse') {
      var distActive = (c.dist || '').split('・');
      var styleActive = (c.style || '').split('・');
      var distChips = ['短', 'マイル', '中', '長'].map(function (d) {
        return '<span class="apt-chip' + (distActive.indexOf(d) >= 0 ? ' active' : '') + '">' + d + '</span>';
      }).join('');
      var styleMap = [['逃げ', 'nige'], ['先行', 'senko'], ['差し', 'sashi'], ['追込', 'oikomi']];
      var styleChips = styleMap.map(function (s) {
        var isActive = styleActive.indexOf(s[0]) >= 0;
        return '<span class="apt-chip style-chip' + (isActive ? ' active ' + s[1] : '') + '">' + s[0] + '</span>';
      }).join('');
      extra =
        '<div class="apt-block">' +
        '<div class="apt-label">適正距離</div><div class="apt-row">' + distChips + '</div>' +
        '<div class="apt-label">脚質</div><div class="apt-row">' + styleChips + '</div>' +
        '</div>' +
        '<div class="card-fav">得意 ' + c.fav + '</div>' +
        '<div class="card-stats">' +
        '<span class="pill run">走破' + c.run + '</span>' +
        '<span class="pill guard">ガード' + c.guard + '</span>' +
        '</div>';
    } else if (c.type === 'item' || c.type === 'jockey' || c.type === 'situation') {
      extra = '<div class="card-effect">' + c.stat + '</div>';
    } else if (c.type === 'force') {
      extra = '<div class="card-flavor">走破のコストになる基本カード</div>';
    }

    el.innerHTML = head + '<div class="card-name">' + c.name + '</div>' + art + extra + '<div class="card-shine"></div>';
    return el;
  }

  function layoutHandFan() {
    var row = $('hand-row');
    var cards = row.querySelectorAll('.card');
    var n = cards.length;
    var zone = $('zone-hand');
    var isManyCards = n >= 8;
    if (zone) {
      zone.classList.toggle('has-many-cards', isManyCards);
    }
    if (!n) return;
    var rowW = row.clientWidth || row.offsetWidth || 340;
    var cardW = cards[0].offsetWidth || 98;
    var isMobile = typeof window !== 'undefined' && window.innerWidth < 860;
    var maxSpread = isManyCards ? Math.min(22, 3.0 * (n - 1)) : Math.min(28, 5 * (n - 1));
    var angleStep = n > 1 ? maxSpread / (n - 1) : 0;
    // 8枚以上のときやモバイル時はカードを潰さず十分な間隔を確保してスクロール可能に
    var idealGapRatio = isMobile ? 0.38 : (isManyCards ? 0.46 : 0.62);
    var minGapRatio = isMobile ? 0.20 : (isManyCards ? 0.42 : 0.20);
    var idealGap = cardW * idealGapRatio;
    var totalWidthIdeal = idealGap * (n - 1) + cardW;
    var gap = idealGap;
    if (!isMobile && !isManyCards && totalWidthIdeal > rowW * 0.97 && n > 1) {
      gap = Math.max(cardW * minGapRatio, (rowW * 0.97 - cardW) / (n - 1));
    }
    var center = (n - 1) / 2;
    cards.forEach(function (el, i) {
      var offset = i - center;
      var rot = offset * angleStep;
      var x = offset * gap;
      var y = Math.abs(offset) * Math.abs(offset) * (isMobile ? 0.7 : (isManyCards ? 0.65 : 1.15));
      el.style.setProperty('--fan-x', x.toFixed(1) + 'px');
      el.style.setProperty('--fan-rot', rot.toFixed(2) + 'deg');
      el.style.setProperty('--fan-y', y.toFixed(1) + 'px');
      el.style.zIndex = String(Math.round(100 - Math.abs(offset) * 2));
    });
    if (isMobile || isManyCards) {
      requestAnimationFrame(function () {
        if (row.scrollWidth > row.clientWidth && row.scrollLeft === 0) {
          row.scrollLeft = Math.max(0, (row.scrollWidth - row.clientWidth) / 2);
        }
        updateHandNavState();
      });
    }
  }

  function updateHandNavState() {
    var row = $('hand-row');
    var prevBtn = $('hand-prev');
    var nextBtn = $('hand-next');
    if (!row || !prevBtn || !nextBtn) return;
    var canScroll = row.scrollWidth > row.clientWidth + 4;
    var atStart = row.scrollLeft <= 4;
    var atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
    prevBtn.classList.toggle('nav-disabled', !canScroll || atStart);
    nextBtn.classList.toggle('nav-disabled', !canScroll || atEnd);
  }

  function renderHand() {
    var row = $('hand-row');
    row.innerHTML = '';
    var isGuardSelect = (phase === 'guard_select');
    document.body.classList.toggle('guard-selecting', isGuardSelect);
    var distKey = race ? raceDistanceKey(race.distance) : '';

    hand.forEach(function (c) {
      var el = buildCardEl(c);
      if (isGuardSelect) {
        var isHorse = (c.type === 'horse');
        var isDistMatch = isHorse && ((c.dist || '').indexOf(distKey) >= 0);
        el.classList.add(isHorse && isDistMatch ? 'selectable' : 'disabled');
        if (isHorse) {
          // ガード選択中：ガード値が大きく一目でわかる専用バッジを表示
          var gBadge = document.createElement('div');
          gBadge.className = 'card-guard-floating-badge' + (isDistMatch ? ' is-valid' : ' is-invalid');
          gBadge.innerHTML =
            '<span class="guard-icon">' + iconImg('shield') + '</span>' +
            '<span class="guard-lbl">ガード</span>' +
            '<span class="guard-val">' + (c.guard || 0) + '</span>' +
            (!isDistMatch ? '<span class="guard-dist-warn">距離外</span>' : '<span class="guard-dist-ok">適性○</span>');
          el.appendChild(gBadge);
        }
      } else if (interactionMode === 'select-force') {
        el.classList.add(c.type === 'force' ? 'selectable' : 'disabled');
      } else if (interactionMode === 'select-horse') {
        el.classList.add(c.type === 'horse' ? 'selectable' : 'disabled');
      } else if (phase === 'select_horse') {
        el.classList.add(c.type === 'horse' ? 'selectable' : 'disabled');
      } else if (phase === 'select_force') {
        el.classList.add(c.type === 'force' ? 'selectable' : 'disabled');
      } else if (phase === 'select_item') {
        var isHorseSupport = c.type === 'item' || c.type === 'jockey';
        var isRunModifier = c.effectType === 'run_bonus' || c.effectType === 'run_penalty';
        el.classList.add(isHorseSupport && (prevPhase !== 'support_choice' || isRunModifier) ? 'selectable' : 'disabled');
      } else if (phase === 'select_item_idle') {
        var isEligibleIdleCard = c.type === 'item' &&
          c.effectType !== 'run_bonus' && c.effectType !== 'run_penalty';
        el.classList.add(isEligibleIdleCard ? 'selectable' : 'disabled');
      } else if (phase === 'select_situation') {
        el.classList.add(c.type === 'situation' ? 'selectable' : 'disabled');
      } else if (phase === 'support_choice') {
        el.classList.add('disabled');
      } else if (interactionMode === 'select-any' || (interactionMode === 'freeplay' && !isCpuTurn)) {
        el.classList.add('selectable');
      }
      row.appendChild(el);
    });
    layoutHandFan();
    var zone = $('zone-hand');
    if (zone) {
      zone.classList.toggle('has-cards', hand.length > 0);
      zone.classList.toggle('has-many-cards', hand.length >= 8);
    }
    document.body.classList.toggle('has-hand-cards', hand.length > 0);
  }
  window.addEventListener('resize', function () { layoutHandFan(); adjustFieldDiagonalLayout(); });

  function renderFarm() {
    var pile = $('farm-pile');
    var shown = farm.slice(-2);
    if (!shown.length) {
      pile.innerHTML = '';
    } else {
      var html = '<div class="farm-stack">';
      shown.forEach(function (c, i) {
        var cls = 'farm-mini type-' + c.type + (i === shown.length - 1 ? ' farm-back-0' : ' farm-back-1');
        if (c.img) {
          html += '<div class="' + cls + ' farm-mini-img" style="background-image:url(' + c.img + ')"></div>';
        } else {
          html += '<div class="' + cls + '">' + c.icon + '</div>';
        }
      });
      html += '</div>';
      pile.innerHTML = html;
    }
    $('farm-count').textContent = String(farm.length);
  }

  function renderOppFarm() {
    var pile = $('opp-farm-pile');
    if (!pile) return;
    var shown = oppFarm.slice(-2);
    if (!shown.length) {
      pile.innerHTML = '';
    } else {
      var html = '<div class="farm-stack">';
      shown.forEach(function (c, i) {
        var cls = 'farm-mini type-' + c.type + (i === shown.length - 1 ? ' farm-back-0' : ' farm-back-1');
        if (c.img) {
          html += '<div class="' + cls + ' farm-mini-img" style="background-image:url(' + c.img + ')"></div>';
        } else {
          html += '<div class="' + cls + '">' + c.icon + '</div>';
        }
      });
      html += '</div>';
      pile.innerHTML = html;
    }
    var countEl = $('opp-farm-count');
    if (countEl) countEl.textContent = String(oppFarm.length);
  }

  function renderField() {
    var body = $('field-body');
    var isHorseSelect = (phase === 'select_horse' && !isCpuTurn && !!field);
    if (body) {
      body.classList.toggle('selectable-horse', isHorseSelect);
    }
    if (field) {
      var selCls = isHorseSelect ? ' selectable is-field-selectable' : '';
      var badgeHtml = isHorseSelect ? '<div class="field-reuse-badge">' + iconImg('reload', 'img-icon-inline') + 'タップで続けて走破</div>' : '';
      if (field.img) {
        body.innerHTML =
          '<div class="field-mini-wrap">' + badgeHtml +
          '<div class="field-mini field-mini-img' + selCls + '" style="background-image:url(' + field.img + ')"></div></div>';
      } else {
        body.innerHTML =
          '<div class="field-mini-wrap">' + badgeHtml +
          '<div class="field-mini type-horse' + selCls + '">' +
          '<span class="stat-badge stat-badge-run" title="走破">' + field.run + '</span>' +
          '<span class="stat-badge stat-badge-guard" title="ガード">G' + field.guard + '</span>' +
          '<span class="fm-icon">' + field.icon + '</span>' +
          '<span class="fm-name">' + field.name + '</span>' +
          '</div></div>';
      }
    } else {
      body.innerHTML = '<div class="field-placeholder"></div>';
    }
    renderFieldOpp();
  }

  // 相手の馬カード置き場（自分の走破カード置き場とは重ならない別枠のスロット）。
  // CPUが走破に使っている馬カード、またはガードに使った馬カードをここに表示する
  function renderFieldOpp() {
    var body = $('field-body-opp');
    if (!body) return;
    var card = fieldGuard || cpuHorseCard;
    if (card) {
      var tagHtml = fieldGuard ? '<div class="field-opp-tag">' + iconImg('shield', 'img-icon-inline') + 'ガード G' + (fieldGuard.guard || 0) + '</div>' : '';
      if (card.img) {
        body.innerHTML = tagHtml +
          '<div class="field-mini-wrap"><div class="field-mini field-mini-img" style="background-image:url(' + card.img + ')"></div></div>';
      } else {
        body.innerHTML = tagHtml +
          '<div class="field-mini-wrap"><div class="field-mini type-horse">' +
          '<span class="stat-badge stat-badge-run" title="走破">' + card.run + '</span>' +
          '<span class="stat-badge stat-badge-guard" title="ガード">G' + card.guard + '</span>' +
          '<span class="fm-icon">' + card.icon + '</span>' +
          '<span class="fm-name">' + card.name + '</span>' +
          '</div></div>';
      }
    } else {
      body.innerHTML = '<div class="field-placeholder field-placeholder-opp"></div>';
    }
  }

  /* 状況カード：field-image-wrapの背景に、イラスト部分のみを表示（確認はボタンからのみ可能） */
  function renderSituation() {
    var bg = $('field-situation-bg');
    if (!bg) return;
    if (!situation) {
      bg.classList.remove('active');
      bg.innerHTML = '';
      return;
    }
    bg.classList.add('active');
    var btnHtml = '<button type="button" class="field-situation-check-btn" title="状況カードの詳細を確認する"><span class="check-btn-icon">' + iconImg('search') + '</span><span class="check-btn-label">状況カードを確認する</span></button>';
    var artSrc = situation.artImg || situation.img;
    if (artSrc) {
      bg.innerHTML =
        '<div class="field-situation-card" style="background-image:url(' + artSrc + ');">' +
        '<div class="card-shine"></div>' +
        btnHtml +
        '</div>';
    } else {
      bg.innerHTML =
        '<div class="field-situation-card card type-situation" style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding:16px; background:rgba(20,30,48,0.72);">' +
        '<div class="card-art" style="font-size:72px; text-align:center;">' + situation.icon + '</div>' +
        '<div class="card-shine"></div>' +
        btnHtml +
        '</div>';
    }
    var checkBtn = bg.querySelector('.field-situation-check-btn');
    if (checkBtn) {
      checkBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        Haptics.tap();
        CardCloseup.show(situation, { label: '状況カード' });
      });
    }
  }

  function renderDeckLanes() {
    var wrap = $('lanes');
    var active = currentLane();
    var maxLaneCount = 8;
    wrap.innerHTML = LANES.map(function (lane) {
      var isActive = active && lane.key === active.key;
      var isEmpty = lane.count <= 0;
      var cls = 'lane' + (isEmpty ? ' empty' : '') + (isActive ? ' active' : '');
      var t = Math.max(0, Math.min(1, lane.count / maxLaneCount));
      // カードが1枚もない状態（配布前・引き切った後）は、うっすらカード裏面が
      // 見えてしまわないよう、カード画像自体を出さない空の枠にする
      var stackHtml = isEmpty ? '' :
        '<div class="lane-stack" style="--stack-t:' + t.toFixed(2) + '">' +
        '<div class="lane-card-back lane-back-2"></div>' +
        '<div class="lane-card-back lane-back-1"></div>' +
        '<div class="lane-card-back lane-back-0"><span class="lane-badge">' + lane.count + '</span></div>' +
        '</div>';
      return (
        '<div class="' + cls + '" data-lane="' + lane.key + '">' +
        '<span class="slot-bracket tl"></span><span class="slot-bracket tr"></span>' +
        '<span class="slot-bracket bl"></span><span class="slot-bracket br"></span>' +
        stackHtml +
        '<div class="lane-label">' + lane.label + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function deckSourceRect() {
    var el = document.querySelector('.lane.active .lane-stack');
    return el ? el.getBoundingClientRect() : $('lanes').getBoundingClientRect();
  }
  function cpuDeckSourceRect() {
    var el = document.querySelector('.opp-lane.active .lane-stack');
    return el ? el.getBoundingClientRect() : $('opp-lanes').getBoundingClientRect();
  }

  function renderOpponentDeck() {
    var wrap = $('opp-lanes');
    if (!wrap) return;
    var active = cpuCurrentLane();
    var maxLaneCount = 8;
    wrap.innerHTML = CPU_LANES.map(function (lane) {
      var isActive = active && lane.key === active.key;
      var isEmpty = lane.count <= 0;
      var cls = 'opp-lane' + (isEmpty ? ' empty' : '') + (isActive ? ' active' : '');
      var t = Math.max(0, Math.min(1, lane.count / maxLaneCount));
      var stackHtml = isEmpty ? '' :
        '<div class="lane-stack" style="--stack-t:' + t.toFixed(2) + '">' +
        '<div class="lane-card-back lane-back-2"></div>' +
        '<div class="lane-card-back lane-back-1"></div>' +
        '<div class="lane-card-back lane-back-0"><span class="lane-badge">' + lane.count + '</span></div>' +
        '</div>';
      return (
        '<div class="' + cls + '" data-lane="' + lane.key + '">' +
        '<span class="slot-bracket tl"></span><span class="slot-bracket tr"></span>' +
        '<span class="slot-bracket bl"></span><span class="slot-bracket br"></span>' +
        stackHtml +
        '<div class="lane-label">' + lane.label + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderAll() {
    renderHand(); renderFarm(); renderOppFarm(); renderField(); renderSituation(); renderDeckLanes(); renderOpponentDeck();
    updateOpponentHandDisplay();
    updateCommandButtons();
    adjustFieldDiagonalLayout();
  }

  // 画面サイズによっては、CSSだけで組んだ対角配置（自分／相手の馬カード置き場）が
  // 山札の列と重なってしまうことがあるため、実際の表示位置を測って重なりを検出し、
  // その分だけ追加でずらす（CSSの計算だけに頼らない安全策）
  function adjustFieldDiagonalLayout() {
    var zoneFieldEl = $('zone-field');

    // デスクトップ（860px以上）では 3D パース変換後に getBoundingClientRect() が
    // 実レイアウト位置と乖離するため、重なり補正を行うと逆に大きなスペースが生まれる。
    // デスクトップは grid の row-gap で十分なスペースを確保しているのでスキップする。
    if (typeof window !== 'undefined' && window.innerWidth >= 860) {
      if (zoneFieldEl) {
        zoneFieldEl.style.setProperty('--field-opp-extra-shift', '0px');
        zoneFieldEl.style.setProperty('--field-extra-shift', '0px');
      }
      return;
    }

    var oppDeckEl = $('zone-opp-deck');
    var fieldOppEl = $('field-body-opp');
    var deckEl = $('zone-deck');
    var fieldEl = $('field-body');
    if (!zoneFieldEl || !oppDeckEl || !fieldOppEl || !deckEl || !fieldEl) return;

    // 先に補正をリセットしてから素の位置を測る（前回の補正が残ったまま測ると
    // 毎回ずれが行ったり来たりしてしまうため）
    zoneFieldEl.style.setProperty('--field-opp-extra-shift', '0px');
    zoneFieldEl.style.setProperty('--field-extra-shift', '0px');

    var oppDeckRect = oppDeckEl.getBoundingClientRect();
    var fieldOppRect = fieldOppEl.getBoundingClientRect();
    var deckRect = deckEl.getBoundingClientRect();
    var fieldRect = fieldEl.getBoundingClientRect();
    if (oppDeckRect.width === 0 || fieldOppRect.width === 0 || deckRect.width === 0 || fieldRect.width === 0) return;

    // 相手の馬カード置き場が、相手の山札列と重なっていれば下にずらす
    // （#zone-field に設定することで、枠自体とブラケット装飾の両方に伝わる）
    var overlapTop = oppDeckRect.bottom - fieldOppRect.top;
    zoneFieldEl.style.setProperty('--field-opp-extra-shift', (overlapTop > 0 ? (overlapTop + 8) : 0) + 'px');

    // 自分の馬カード置き場が、自分の山札列と重なっていれば上にずらす
    var overlapBottom = fieldRect.bottom - deckRect.top;
    zoneFieldEl.style.setProperty('--field-extra-shift', (overlapBottom > 0 ? -(overlapBottom + 8) : 0) + 'px');
  }

  function updateOpponentHandDisplay() {
    var el = $('opponent-hand-count');
    if (el) el.textContent = opponentHandCount;
  }

  function setZoneActive(zoneId, active) {
    var z = $(zoneId);
    if (!z) return;
    z.classList.toggle('zone-active', !!active);
  }
  function clearZoneActive() {
    ['zone-opponent', 'zone-situation', 'zone-deck', 'zone-field', 'field-body', 'zone-farm', 'zone-hand'].forEach(function (id) {
      setZoneActive(id, false);
    });
    $('zone-deck').classList.remove('tappable');
  }

  /* ===================== arrow coach mark ===================== */
  function pointArrowAt(targetEl) {
    if (!targetEl) return hideArrow();
    var arrow = $('arrow');
    arrow.hidden = false;
    var r = targetEl.getBoundingClientRect();
    var narratorTop = $('narrator') ? $('narrator').getBoundingClientRect().top : window.innerHeight;
    var arrowH = 64, arrowW = 42;
    var top, flip;
    if (r.top - arrowH - 12 > 56) {
      top = r.top - arrowH - 6;
      flip = false;
    } else {
      top = Math.min(r.bottom + 6, narratorTop - arrowH - 6);
      flip = true;
    }
    var left = r.left + r.width / 2 - arrowW / 2;
    left = Math.max(6, Math.min(left, window.innerWidth - arrowW - 6));
    arrow.style.top = top + 'px';
    arrow.style.left = left + 'px';
    arrow.classList.toggle('arrow-flip', flip);
    currentArrowTarget = targetEl;
  }
  function hideArrow() {
    $('arrow').hidden = true;
    currentArrowTarget = null;
  }
  window.addEventListener('resize', function () {
    if (currentArrowTarget) pointArrowAt(currentArrowTarget);
  });

  /* ===================== narrator / progress ===================== */
  var narratorHistory = [];
  var narratorHistoryIndex = -1;

  function renderNarratorAt(idx) {
    narratorHistoryIndex = idx;
    var textEl = $('narrator-text');
    if (textEl) textEl.innerHTML = narratorHistory[idx] || '';
    updateNarratorNavButtons();
  }
  function updateNarratorNavButtons() {
    var backBtn = $('narrator-back');
    var fwdBtn = $('narrator-forward');
    var hasBack = narratorHistoryIndex > 0;
    var hasForward = narratorHistoryIndex < narratorHistory.length - 1;
    if (backBtn) backBtn.style.display = hasBack ? 'inline-block' : 'none';
    if (fwdBtn) fwdBtn.style.display = hasForward ? 'inline-block' : 'none';
    var narratorEl = $('narrator');
    if (narratorEl) narratorEl.classList.toggle('viewing-history', hasForward);
  }
  function setNarrator(html) {
    narratorHistory.push(html);
    renderNarratorAt(narratorHistory.length - 1);
  }

  var waitNextResolve = null;

  function showNextButton(show) {
    var narratorEl = $('narrator');
    if (narratorEl) narratorEl.classList.toggle('can-advance', !!show);
    // 「タップで進む」の文言は廃止。待ち受け中は画面全体がタップ／クリックで進む。
    // （iOS Safari は cursor:pointer でない要素のタップを document まで click として伝えないため、
    //   待ち受け中だけ body にクラスを付けて CSS で全要素を pointer 扱いにする）
    document.body.classList.toggle('awaiting-next', !!show);
    var oldBtn = $('narrator-next');
    if (oldBtn) oldBtn.style.display = 'none';
  }

  function advanceNarrator() {
    if (waitNextResolve) {
      var r = waitNextResolve;
      waitNextResolve = null;
      showNextButton(false);
      try { Haptics.tap(); } catch (e) {}
      r();
    }
  }

  function waitNext() {
    return new Promise(function (resolve) {
      waitNextResolve = resolve;
      showNextButton(true);
    });
  }

  // 吹き出し（ナレーター）自体のクリック・タップで次に進む
  var narratorEl = $('narrator');
  if (narratorEl) {
    narratorEl.addEventListener('click', function (e) {
      if (waitNextResolve) {
        e.stopPropagation();
        advanceNarrator();
      }
    });
  }

  // 「次へ」待ち受け中は、画面上のどこをタップ／クリックしても次に進める
  // （カードや設定ボタン、ポップアップなど個別操作が必要な要素は除外）
  document.addEventListener('click', function (e) {
    if (!waitNextResolve) return;
    if (e.target.closest('button, .card, .popup-box, #settings-overlay, #banner-overlay, .drag-handle, .lane, .opp-lane, .field-body, .field-body-opp, .farm-pile, #situation-body')) return;
    advanceNarrator();
  });

  var backBtn = $('narrator-back');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (narratorHistoryIndex > 0) {
        Haptics.tap();
        renderNarratorAt(narratorHistoryIndex - 1);
      }
    });
  }
  var fwdBtn = $('narrator-forward');
  if (fwdBtn) {
    fwdBtn.addEventListener('click', function () {
      if (narratorHistoryIndex < narratorHistory.length - 1) {
        Haptics.tap();
        renderNarratorAt(narratorHistoryIndex + 1);
      }
    });
  }

  var STEP_TOTAL = 16;
  function setProgress(step) {
    var pct = Math.min(100, (step / STEP_TOTAL) * 100);
    var cur = Math.min(step, STEP_TOTAL);
    var fillEl = $('track-fill');
    var horseEl = $('track-horse');
    if (fillEl) fillEl.style.width = pct + '%';
    if (horseEl) horseEl.style.left = pct + '%';

    var curEl = $('step-current');
    if (curEl) {
      curEl.textContent = cur;
    } else {
      var labelEl = $('step-label');
      if (labelEl) labelEl.textContent = 'STEP ' + cur + ' / ' + STEP_TOTAL;
    }

    var flagEl = $('track-flag');
    if (flagEl) {
      flagEl.classList.toggle('goal-reached', cur >= STEP_TOTAL);
    }
  }

  function showBanner(text, maxWait, horseCard, subText) {
    var overlay = $('banner-overlay');
    var box = $('banner-box');
    var cardBackdrop = $('banner-card-backdrop');
    var stage = $('banner-stage');
    var hasCard = false;
    var isGuard = text.indexOf('ガード') >= 0;
    if (cardBackdrop) {
      cardBackdrop.innerHTML = '';
      var targetCard = horseCard || ((text.indexOf('走破成功') >= 0 || text.indexOf('走破！') >= 0 || isGuard) ? (fieldGuard || field || selectedHorse || cpuHorseCard || goldShip()) : null);
      if (targetCard) {
        var cEl = buildCardEl(targetCard);
        cEl.classList.add('banner-horse-card');
        cardBackdrop.appendChild(cEl);
        cardBackdrop.style.display = 'block';
        hasCard = true;
      } else {
        cardBackdrop.style.display = 'none';
      }
    }
    if (stage) {
      stage.classList.toggle('has-card', hasCard);
      stage.classList.toggle('is-guard', isGuard && hasCard);
    }
    if (overlay) {
      overlay.classList.toggle('has-card', hasCard);
      overlay.classList.toggle('is-guard', isGuard && hasCard);
    }
    var isFreeplay = (interactionMode === 'freeplay');
    var waitClick = isFreeplay || isGuard;
    var tapHintHtml = '';
    var subHtml = subText ? '<div class="banner-sub-caption">' + subText + '</div>' : '';
    box.innerHTML = '<span class="banner-shine"></span>' + subHtml + '<span class="banner-box-text">' + text + '</span>' + tapHintHtml;
    box.classList.add('show');
    overlay.classList.add('active');
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        overlay.removeEventListener('click', finish);
        if (timer) clearTimeout(timer);
        box.classList.remove('show');
        overlay.classList.remove('active');
        if (stage) {
          stage.classList.remove('has-card');
          stage.classList.remove('is-guard');
        }
        if (overlay) {
          overlay.classList.remove('has-card');
          overlay.classList.remove('is-guard');
        }
        if (cardBackdrop) {
          cardBackdrop.style.display = 'none';
          cardBackdrop.innerHTML = '';
        }
        setTimeout(resolve, 250);
      }
      overlay.addEventListener('click', finish);
      // マニュアル操作（freeplay）またはガード表示時は秒数自動スキップせず、ユーザーのタップ／クリック操作で次へ進む
      var timer = waitClick ? null : setTimeout(finish, maxWait || 3200);
    });
  }

  /* 汎用案内・指示ポップアップ（走破ドロー・手札破棄など） */
  function showNoticePopup(title, desc, btnText) {
    var popup = $('notice-action-popup');
    var titleEl = $('notice-action-title');
    var descEl = $('notice-action-desc');
    var btnEl = $('notice-action-btn');
    if (!popup) return Promise.resolve();
    if (titleEl) titleEl.innerHTML = title;
    if (descEl) descEl.innerHTML = desc;
    if (btnEl) btnEl.textContent = btnText || 'OK';
    popup.style.display = 'flex';

    return new Promise(function (resolve) {
      var finished = false;
      function onConfirm(e) {
        if (finished) return;
        finished = true;
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        popup.removeEventListener('click', onConfirm);
        if (btnEl) btnEl.removeEventListener('click', onConfirm);
        popup.style.display = 'none';
        resolve();
      }
      popup.addEventListener('click', onConfirm);
      if (btnEl) btnEl.addEventListener('click', onConfirm);
    });
  }

  /* ===================== デュエルリンクス風 ターンチェンジ演出 ===================== */
  function showTurnChange(type) {
    var overlay = $('turn-change-overlay');
    var label = $('turn-change-label');
    if (!overlay || !label) return Promise.resolve();

    var isOpp = (type === 'opp' || type === 'cpu' || type === '相手のターン' || type === '相手' || type === 'CPU');
    label.textContent = isOpp ? '相手のターン' : 'あなたのターン';

    overlay.classList.remove('show', 'is-opp', 'is-player');
    void overlay.offsetWidth; // 強制リフローでアニメーションをリセット

    overlay.classList.add('show', isOpp ? 'is-opp' : 'is-player');

    var sfx = (typeof SoundFX !== 'undefined' ? SoundFX : window.SoundFX);
    if (sfx) {
      if (typeof sfx.turnChange === 'function') {
        sfx.turnChange();
      } else if (typeof sfx.shimmer === 'function') {
        sfx.shimmer();
      }
    }

    return new Promise(function (resolve) {
      setTimeout(function () {
        overlay.classList.remove('show');
        setTimeout(resolve, 100);
      }, 2100);
    });
  }

  function showOpponentBubble(text, durationMs) {
    var b = $('opponent-bubble');
    if (!b) return Promise.resolve();
    b.textContent = text;
    b.classList.add('show');
    var ms = durationMs !== undefined ? durationMs : (text.indexOf('思考中') >= 0 ? 2500 : 1300);
    return sleep(ms).then(function () { b.classList.remove('show'); });
  }

  /* ===================== fly / move animation ===================== */
  function flyGhost(sourceEl, destRect, scaleOverride) {
    return new Promise(function (resolve) {
      if (!sourceEl) { resolve(); return; }
      var srcRect = sourceEl.getBoundingClientRect();
      var ghost = sourceEl.cloneNode(true);
      var isCpuCard = sourceEl.classList.contains('ghost-cpu-card') ||
        !!(sourceEl.closest && sourceEl.closest('#field-body-opp, #zone-opp-farm, #opp-farm-pile, .field-body-opp'));
      ghost.className = sourceEl.className + ' ghost';
      ghost.style.position = 'fixed';
      ghost.style.left = srcRect.left + 'px';
      ghost.style.top = srcRect.top + 'px';
      ghost.style.width = srcRect.width + 'px';
      ghost.style.height = srcRect.height + 'px';
      ghost.style.margin = '0';
      ghost.style.zIndex = '90';
      if (isCpuCard) ghost.style.transform = 'rotate(180deg)';
      ghost.style.transition = 'transform .48s cubic-bezier(.3,.7,.35,1), opacity .48s';
      document.body.appendChild(ghost);
      requestAnimationFrame(function () {
        var dx = (destRect.left + destRect.width / 2) - (srcRect.left + srcRect.width / 2);
        var dy = (destRect.top + destRect.height / 2) - (srcRect.top + srcRect.height / 2);
        var scale = scaleOverride || Math.max(0.45, Math.min(destRect.width / srcRect.width, 1));
        var rot = isCpuCard ? ' rotate(180deg)' : '';
        ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')' + rot;
        ghost.style.opacity = '0.7';
      });
      setTimeout(function () { ghost.remove(); resolve(); }, 480);
    });
  }

  function cardElById(id) {
    return document.querySelector('.card[data-id="' + id + '"]');
  }

  function makeDeckDummy(deckRect) {
    var dummy = document.createElement('div');
    dummy.className = 'deck-card';
    dummy.style.position = 'fixed';
    dummy.style.left = deckRect.left + 'px';
    dummy.style.top = deckRect.top + 'px';
    dummy.style.width = deckRect.width + 'px';
    dummy.style.height = deckRect.height + 'px';
    dummy.style.transform = 'none';
    document.body.appendChild(dummy);
    return dummy;
  }

  function makeCardDummy(card, startRect) {
    var dummy = document.createElement('div');
    dummy.className = 'farm-mini type-' + card.type;
    dummy.style.position = 'fixed';
    dummy.style.left = startRect.left + 'px';
    dummy.style.top = startRect.top + 'px';
    dummy.style.width = startRect.width + 'px';
    dummy.style.height = startRect.height + 'px';
    dummy.style.borderRadius = '6px';
    dummy.style.fontSize = '16px';
    dummy.style.zIndex = '1000';
    if (card.img) {
      dummy.classList.add('farm-mini-img');
      dummy.style.backgroundImage = 'url(' + card.img + ')';
    } else {
      dummy.textContent = card.icon;
    }
    document.body.appendChild(dummy);
    return dummy;
  }

  function makeSmallCardDummy(deckRect) {
    var dummy = document.createElement('div');
    dummy.className = 'deck-card';
    dummy.style.position = 'fixed';
    dummy.style.left = deckRect.left + 'px';
    dummy.style.top = deckRect.top + 'px';
    dummy.style.width = (deckRect.width * 0.7) + 'px';
    dummy.style.height = (deckRect.height * 0.7) + 'px';
    dummy.style.transform = 'none';
    document.body.appendChild(dummy);
    return dummy;
  }

  function makeCpuCardDummy(card, startRect) {
    var el = buildCardEl(card);
    el.classList.add('ghost-cpu-card');
    el.style.position = 'fixed';
    el.style.left = (startRect.left || 200) + 'px';
    el.style.top = (startRect.top || 40) + 'px';
    el.style.width = '64px';
    el.style.height = '90px';
    el.style.zIndex = '950';
    el.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.55)';
    el.style.pointerEvents = 'none';
    el.style.transform = 'none';
    document.body.appendChild(el);
    return el;
  }

  function flyCpuCard(card, destRect, scale) {
    var handEl = $('opponent-hand-display') || $('zone-opponent');
    var startRect = handEl ? handEl.getBoundingClientRect() : { left: 200, top: 40, width: 80, height: 30 };
    var dummy = makeCpuCardDummy(card, startRect);
    var p = flyGhost(dummy, destRect, scale || 0.85);
    dummy.remove();
    return p;
  }

  /* ===================== 馬カード解説（大きく表示＋部位ハイライト） ===================== */
  // ringId: 'ring-cost'（左上のコスト）／'ring-stats'（下部の走破数・ガード値）／null（枠なし）
  var cardExplainOpen = false;
  function cardExplainShow(card) {
    var layer = $('card-explain');
    var slot = $('card-explain-card');
    if (!layer || !slot) return;
    cardExplainRing(null);
    slot.innerHTML = '';
    var el = buildCardEl(card);
    slot.appendChild(el);
    // ナレーター吹き出しの上端までを使って、馬カードが被らない最大サイズにする
    var nar = $('narrator');
    var narTop = nar ? nar.getBoundingClientRect().top : window.innerHeight - 150;
    var padBottom = Math.max(90, window.innerHeight - narTop + 10);
    var avail = window.innerHeight - 56 - padBottom;
    var hMax = Math.min(avail, (window.innerWidth * 0.86) / 0.704, 560);
    layer.style.paddingBottom = padBottom + 'px';
    layer.style.setProperty('--ce-h', Math.max(220, Math.floor(hMax)) + 'px');
    layer.setAttribute('aria-hidden', 'false');
    layer.classList.add('show');
    cardExplainOpen = true;
  }
  function cardExplainRing(ringId) {
    ['ring-cost', 'ring-stats', 'ring-run', 'ring-guard'].forEach(function (id) {
      var r = $(id);
      if (r) r.classList.toggle('on', id === ringId);
    });
  }
  function cardExplainHide() {
    var layer = $('card-explain');
    if (!layer) return;
    cardExplainRing(null);
    layer.classList.remove('show');
    layer.setAttribute('aria-hidden', 'true');
    cardExplainOpen = false;
  }

  /* ===================== explanation step ===================== */
  function explainStep(targetEl, zoneId, text) {
    if (zoneId) setZoneActive(zoneId, true);
    if (targetEl && targetEl.classList) targetEl.classList.add('highlighted');
    setNarrator(text);
    return waitNext().then(function () {
      if (targetEl && targetEl.classList) targetEl.classList.remove('highlighted');
      if (zoneId) setZoneActive(zoneId, false);
    });
  }

  /* ===================== interactive waits ===================== */
  function waitDrawTap(zoneId) {
    interactionMode = 'draw';
    setZoneActive(zoneId, true);
    $('zone-deck').classList.add('tappable');
    return new Promise(function (resolve) { actionResolve = resolve; });
  }

  function waitSelect(mode, count) {
    interactionMode = mode;
    selectionNeeded = count;
    selectionCount = 0;
    renderHand();
    return new Promise(function (resolve) { actionResolve = resolve; });
  }

  function shakeCard(id) {
    var el = cardElById(id);
    if (!el) return;
    el.classList.add('shake');
    Haptics.warn();
    setTimeout(function () { el.classList.remove('shake'); }, 400);
  }

  var toastTimer = null;
  function hideToast() {
    var toast = $('game-toast');
    if (toast) {
      toast.classList.remove('show');
      toast.style.display = 'none';
    }
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
  }

  function formatJapaneseToastText(msg) {
    if (!msg || typeof msg !== 'string') return '';
    // すでにspanタグ等を含む場合はそのまま
    if (/<[a-z][\s\S]*>/i.test(msg)) return msg;

    // 「あと X 枚」「フォースカード」「を選んでください」などの語句を文節単位でインラインブロック保護
    return msg
      .replace(/(あと\s*\d+\s*枚)/g, '<span class="u-nowrap">$1</span>')
      .replace(/(フォースカード|馬カード|アイテムカード|状況カード|フォース)/g, '<span class="u-nowrap">$1</span>')
      .replace(/(を選んでください|を選ぼう|をタップしてね|をファームに送ろう)/g, '<span class="u-nowrap">$1</span>');
  }

  function showToast(msg, duration) {
    var toast = $('game-toast');
    if (!toast) return;
    toast.innerHTML = formatJapaneseToastText(msg);
    toast.style.display = '';
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (toast) {
        toast.classList.remove('show');
        setTimeout(function () {
          if (toast && !toast.classList.contains('show')) toast.style.display = 'none';
        }, 260);
      }
    }, duration || 2400);
  }

  /* ===================== コマンドバー制御 ===================== */
  function updateFabDisplay() {
    var fab = $('cmd-fab');
    if (!fab) return;
    var badge = $('cmd-fab-badge');
    var menu = $('cmd-menu');
    var isOpen = menu && menu.classList.contains('open');

    if (isOpen) {
      if (badge) badge.textContent = 'CLOSE';
      fab.classList.add('open');
      fab.classList.remove('cpu-turn');
    } else if (isCpuTurn) {
      if (badge) badge.textContent = 'OPPONENT';
      fab.classList.remove('open');
      fab.classList.add('cpu-turn');
    } else {
      if (badge) badge.textContent = 'COMMAND';
      fab.classList.remove('open');
      fab.classList.remove('cpu-turn');
    }
  }

  function updateCommandButtons() {
    var btns = document.querySelectorAll('.cmd-menu-btn');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      var cmd = btn.dataset.cmd;
      btn.disabled = false;
      if (isCpuTurn) { btn.disabled = true; return; }
      if (cmd === 'run') {
        if (phase !== 'idle') btn.disabled = true;
        if (canDraw) btn.disabled = true;
        if (hasRunThisTurn) btn.disabled = true;
        // 馬やフォース不足時もクリック可能にし、cmdRun()側で「フォースカードが不足しています」等の案内を出す
      }
      if (cmd === 'situation') {
        if (phase !== 'idle' || canDraw || isCpuTurn) btn.disabled = true;
        var hasSituation = hand.some(function (c) { return c.type === 'situation'; });
        if (!hasSituation) btn.disabled = true;
      }
      if (cmd === 'item') {
        if (phase !== 'idle') btn.disabled = true;
        if (canDraw) btn.disabled = true;
        var hasUsableItem = hand.some(function (c) {
          return c.type === 'item' && c.effectType !== 'run_bonus' && c.effectType !== 'run_penalty';
        });
        if (!hasUsableItem) btn.disabled = true;
      }
      if (cmd === 'hand') {
        if (isCpuTurn) btn.disabled = true;
      }
      if (cmd === 'end') {
        if (canDraw) btn.disabled = true;
        if (phase === 'select_horse' || phase === 'select_force' || phase === 'discard_select') btn.disabled = true;
        if (isCpuTurn) btn.disabled = true;
      }
    });
    updateFabDisplay();
  }

  /* ===================== コマンドバーの初期位置（画面右下に固定） ===================== */
  function showCommandBar(show) {
    var bar = $('command-bar');
    if (!bar) return;
    bar.hidden = !show;
    bar.classList.toggle('hidden', !show);
    bar.style.display = show ? 'flex' : 'none';
    if (show) {
      updateCommandButtons();
      updateFabDisplay();
    }
  }

  /* ===================== コマンド実行 ===================== */
  function cmdDraw() {
    if (!canDraw || !currentLane() || isCpuTurn) return;
    canDraw = false;
    var drawCount = (gameTurn === 1) ? 1 : 2;
    drawFreeplayCard(drawCount);
    updateCommandButtons();
  }

  function cmdRun() {
    if (phase !== 'idle' || isCpuTurn || hasRunThisTurn || canDraw) return;
    var forces = hand.filter(function (c) { return c.type === 'force'; });
    var horses = hand.filter(function (c) { return c.type === 'horse'; });
    var canRunField = !!(field && forces.length >= (field.cost || 2));
    var canRunHand = horses.some(function (h) { return forces.length >= (h.cost || 2); });

    if (!field && horses.length === 0) {
      showToast('手札に馬カードがありません');
      setNarrator('手札に馬カードがありません。');
      Haptics.warn();
      return;
    }
    if (!canRunField && !canRunHand) {
      showToast('フォースカードが不足しています');
      var reqCost = field ? (field.cost || 2) : Math.min.apply(null, horses.map(function (h) { return h.cost || 2; }));
      setNarrator(iconImg('warning', 'img-icon-inline') + 'コストとなる<b>フォースカードが不足しています</b>。（必要: ' + reqCost + '枚 / 手札: ' + forces.length + '枚）');
      Haptics.warn();
      return;
    }

    var popup = $('run-select-horse-popup');
    var descEl = $('run-select-horse-desc');
    var okBtn = $('run-select-horse-ok');
    var cancelBtn = $('run-select-horse-cancel');

    if (descEl) {
      if (field) {
        descEl.innerHTML = '<div class="popup-lead">走破させる馬カードを選んでください。</div><div class="popup-subtext">場にいる「<b>' + field.name + '</b>」で続けて走破するか、手札の馬カードを選んで入れ替えます。</div>';
      } else {
        descEl.innerHTML = '<div class="popup-lead">走破させる<b>馬カード</b>を手札から選んでください。</div><div class="popup-subtext">（選んだ馬のコスト分のフォースカードを支払って走破します）</div>';
      }
    }

    if (popup && okBtn && cancelBtn) {
      popup.style.display = 'flex';

      var newOk = okBtn.cloneNode(true);
      var newCancel = cancelBtn.cloneNode(true);
      okBtn.parentNode.replaceChild(newOk, okBtn);
      cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

      newOk.addEventListener('click', function () {
        popup.style.display = 'none';
        hasRunThisTurn = true;
        phase = 'select_horse';
        selectedHorse = null;
        selectedForces = [];
        runBonus = 0;
        if (field) {
          setNarrator('場にいる<b>【' + field.name + '】</b>（コスト: ' + (field.cost || 2) + '）で再び走破するか、手札の別の馬を選んで入れ替えてください。<br><span style="color:var(--gold-2);font-size:12px;font-weight:700;">（場の馬をタップ、または手札の馬をタップ）</span>');
        } else {
          setNarrator('走破する<b>馬カード</b>を手札から選んでタップしてください。');
        }
        renderAll();
      });

      newCancel.addEventListener('click', function () {
        popup.style.display = 'none';
      });
    } else {
      hasRunThisTurn = true;
      phase = 'select_horse';
      selectedHorse = null;
      selectedForces = [];
      runBonus = 0;
      if (field) {
        setNarrator('場にいる<b>【' + field.name + '】</b>（コスト: ' + (field.cost || 2) + '）で再び走破するか、手札の別の馬を選んで入れ替えてください。<br><span style="color:var(--gold-2);font-size:12px;font-weight:700;">（場の馬をタップ、または手札の馬をタップ）</span>');
      } else {
        setNarrator('走破する<b>馬カード</b>を手札から選んでタップしてください。');
      }
      renderAll();
    }
  }

  var pendingAfterField = null;

  function runSupportCards() {
    return hand.filter(function (c) {
      return (c.type === 'item' || c.type === 'jockey') &&
        (c.effectType === 'run_bonus' || c.effectType === 'run_penalty' || c.effectType === 'elite_jockey');
    });
  }

  function beginForceSelection() {
    phase = 'select_force';
    prevPhase = null;
    selectedForces = [];
    var currentRunHorse = selectedHorse || field;
    var cost = currentRunHorse ? (currentRunHorse.cost || 2) : 2;
    var horseName = (currentRunHorse && currentRunHorse.name) ? currentRunHorse.name : '馬カード';
    setNarrator('<b>' + horseName + '</b>のコスト分のフォースカードを捨ててください。（残り ' + cost + ' 枚）');
    showToast('馬カードのコスト分のフォースカードを捨ててください');
    renderAll();
  }

  function offerRunSupport() {
    var supports = runSupportCards();
    if (!supports.length) {
      if (pendingAfterField) {
        var fn = pendingAfterField;
        pendingAfterField = null;
        fn();
      } else {
        beginForceSelection();
      }
      return;
    }
    phase = 'support_choice';
    renderAll();
    var hName = (field && field.name) ? field.name : (selectedHorse ? selectedHorse.name : 'この馬');
    $('run-support-desc').innerHTML =
      '<b>' + hName + '</b> の走破値を増減できるカードが ' + supports.length + ' 枚あります。使いますか？';
    hideToast();
    $('run-support-popup').style.display = 'flex';
  }

  function closeRunSupportChoice(useCard) {
    $('run-support-popup').style.display = 'none';
    if (useCard) {
      prevPhase = 'field_support';
      prevSelectedHorse = selectedHorse;
      prevSelectedForces = selectedForces.slice();
      phase = 'select_item';
      setNarrator('走破値を変える<b>アイテム／騎手カード</b>を選んでタップしてください。');
      renderAll();
    } else {
      if (pendingAfterField) {
        var fn = pendingAfterField;
        pendingAfterField = null;
        fn();
      } else {
        beginForceSelection();
      }
    }
  }

  function cmdItem() {
    if (phase !== 'select_force' || isCpuTurn || canDraw) return;
    var items = hand.filter(function (c) { return c.type === 'item' || c.type === 'jockey'; });
    if (items.length === 0) { setNarrator('手札にアイテムがありません。'); return; }
    prevPhase = phase;
    prevSelectedHorse = selectedHorse;
    prevSelectedForces = selectedForces.slice();
    phase = 'select_item';
    setNarrator('馬を支援する<b>アイテム／騎手カード</b>を選んでタップしてください。使わない場合は、フォースの選択を続けます。');
    renderAll();
  }

  function activateSituationCard(card) {
    if (!card || card.type !== 'situation') return;
    hand = hand.filter(function (c) { return c.id !== card.id; });
    situation = card;
    race.trackCondition = '良';
    phase = 'idle';

    var el = cardElById(card.id);
    var dest = $('field-situation-bg') || $('field-image-wrap');
    var destRect = dest ? dest.getBoundingClientRect() : null;

    // 手札からの即座の除外と背景への反映
    renderSituation();
    renderHand();
    renderRaceInfo();
    renderAll();

    function finish() {
      SoundFX.shimmer();
      Haptics.place();
      var isFreeplay = (interactionMode === 'freeplay');
      var sitDetail = CardCloseup.formatCardDetail ? CardCloseup.formatCardDetail(card) : (card.name || '');
      var toastHtml = sitDetail + (isFreeplay ? '<div class="closeup-tap-wrap"><span class="banner-tap-hint">画面をタップ／クリックして次へ進む</span></div>' : '');
      CardCloseup.show(card, {
        label: iconImg('sun', 'img-icon-inline') + '状況カード発動！',
        toast: toastHtml,
        autoHideMs: isFreeplay ? null : 1500
      });
      setNarrator('状況カード「<b>' + card.name + '</b>」を発動しました！（馬場状態: <b>' + race.trackCondition + '</b>）');
      showToast('状況カード「' + card.name + '」を発動！', 'info', 2400);
      checkHintsAvailable();
    }

    if (el && destRect) {
      flyGhost(el, destRect, 0.85).then(finish);
    } else {
      finish();
    }
  }

  function cmdSituation() {
    if (phase !== 'idle' || isCpuTurn || canDraw) return;
    var situations = hand.filter(function (c) { return c.type === 'situation'; });
    if (!situations.length) {
      showToast('手札に状況カードがありません');
      setNarrator('手札に状況カードがありません。');
      Haptics.warn();
      return;
    }
    if (situations.length === 1) {
      activateSituationCard(situations[0]);
    } else {
      prevPhase = phase;
      phase = 'select_situation';
      setNarrator('使う<b>状況カード</b>を選んでタップしてください。');
      renderAll();
    }
  }

  function cmdHand() {
    if (isCpuTurn) return;
    HandViewer.open();
  }

  function cmdEndTurn() {
    if (phase === 'select_horse' || phase === 'select_force' || isCpuTurn || canDraw) return;
    endTurn();
  }

  /* ===================== ターン終了 / CPUターン ===================== */
  function endTurn() {
    phase = 'idle';
    selectedHorse = null;
    selectedForces = [];
    runBonus = 0;
    canDraw = true;
    isCpuTurn = true;
    showCommandBar(false);
    setNarrator(iconImg('brain', 'img-icon-inline') + '<b>CPUのターンです。</b>');
    renderAll();
    showTurnChange('相手のターン').then(function () {
      setNarrator(iconImg('brain', 'img-icon-inline') + 'CPU思考中…');
      showOpponentBubble('思考中…', 2500);
      sleep(2500).then(function () {
        cpuTurn();
      });
    });
  }

  // プレイヤーのターン開始処理（2ターン目以降は各2枚ドロー）
  function startPlayerTurn() {
    gameTurn++;
    showCommandBar(true);
    isCpuTurn = false;
    canDraw = true;
    phase = 'idle';
    hasRunThisTurn = false;
    fieldGuard = null;
    selectedHorse = null;
    selectedForces = [];
    runBonus = 0;
    renderAll();
    checkVictory();
    if (!victoryShown) cmdDraw();
  }

  // CPU側の手札のうち、指定タイプの枚数を数える
  function cpuHandCountOfType(type) {
    return cpuHand.filter(function (c) { return c.type === type; }).length;
  }

  // CPU側が山札からカードを1枚引く（アニメーション付き）
  async function cpuDrawOneCardWithAnimation() {
    if (!cpuCurrentLane()) {
      showOpponentBubble('山札がありません');
      return null;
    }
    var deckRect = cpuDeckSourceRect();
    var oppHandEl = $('opponent-hand-display') || $('zone-opponent');
    var oppHandRect = oppHandEl ? oppHandEl.getBoundingClientRect() : { left: 200, top: 40, width: 80, height: 30 };

    var dummy = makeSmallCardDummy(deckRect);
    if (window.SoundFX && typeof SoundFX.cardSlide === 'function') SoundFX.cardSlide();
    var p = flyGhost(dummy, oppHandRect, 0.6);
    dummy.remove();
    await p;

    var card = getNextCpuDrawCard();
    cpuHand.push(card);
    opponentHandCount = cpuHand.length;
    cpuDrawOneFromDeck();
    lastDrawer = 'cpu';

    renderOpponentDeck();
    updateOpponentHandDisplay();
    showOpponentBubble('ドロー！');
    if (window.SoundFX && typeof SoundFX.cardSlide === 'function') SoundFX.cardSlide();
    return card;
  }

  function cpuDrawOneCard() {
    if (!cpuCurrentLane()) return null;
    var card = getNextCpuDrawCard();
    cpuHand.push(card);
    opponentHandCount = cpuHand.length;
    cpuDrawOneFromDeck();
    return card;
  }

  // CPU の手札の中から、コスト分のフォースカードも揃っている馬カードを選ぶ（無ければ null）
  function cpuPickRunnableHorse() {
    var horses = cpuHand.filter(function (c) { return c.type === 'horse'; });
    if (!horses.length) return null;
    // 走破値が高い馬、または適性が合う馬を優先
    horses.sort(function (a, b) {
      var runA = effectiveRun(a, cpuRunBonus);
      var runB = effectiveRun(b, cpuRunBonus);
      return runB - runA;
    });
    for (var i = 0; i < horses.length; i++) {
      var h = horses[i];
      if (cpuHandCountOfType('force') >= (h.cost || 2)) return h;
    }
    return null;
  }

  // CPUが手札のアイテムカードを使用するロジック（アニメーション・消費付き）
  // mode:
  //   'recovery' … 馬を出す前。走破できる馬がいない時だけ、獣医師でファームからフォース／馬を回収する
  //   'support'  … 馬カードをフィールドに出した後。走破・ガードを高めるアイテム／ジョッキーを使う
  async function cpuPlayItemIfApplicable(mode) {
    var runnableHorse = cpuPickRunnableHorse();
    var cpuItem = null;

    if (mode === 'support') {
      // 馬カードを出した後に、走破ボーナスを高める鞭やエリートジョッキーを使う
      cpuItem = cpuHand.find(function (c) {
        return (c.type === 'item' || c.type === 'jockey') && c.effectType !== 'farm_recovery';
      });
    } else if (runnableHorse) {
      // 走破できる馬がいる場合、アイテムは馬を出した後に使うので、ここでは何もしない
      cpuItem = null;
    } else {
      // 走破できる馬がいない場合、獣医師があればファームからフォースや馬を回収して走破を狙う
      cpuItem = cpuHand.find(function (c) {
        return c.effectType === 'farm_recovery' && oppFarm.some(function (fc) { return fc.type === 'force' || fc.type === 'horse'; });
      });
    }

    if (!cpuItem) return;

    // 手札から実際に消費
    var idx = cpuHand.findIndex(function (c) { return c.id === cpuItem.id; });
    if (idx >= 0) cpuHand.splice(idx, 1);
    opponentHandCount = cpuHand.length;
    updateOpponentHandDisplay();

    // 効果説明テキストの組み立て
    var effectDesc = cpuItem.stat || '';
    if (cpuItem.effectType === 'run_bonus') {
      effectDesc = '走破数 +' + cpuItem.effectValue;
    } else if (cpuItem.effectType === 'elite_jockey') {
      effectDesc = '走破数 +1 / ガード +1';
    } else if (cpuItem.effectType === 'farm_recovery') {
      effectDesc = 'ファームからフォース／馬を手札に回収';
    } else if (cpuItem.effectType === 'guard_bonus') {
      effectDesc = 'ガード +' + cpuItem.effectValue;
    }

    if (window.SoundFX && typeof SoundFX.shimmer === 'function') SoundFX.shimmer();
    showOpponentBubble('アイテム「' + cpuItem.name + '」発動！');
    setNarrator(iconImg('bolt', 'img-icon-inline') + '相手が手札からアイテム「<b>' + cpuItem.name + '</b>」を使用！（効果: <b>' + effectDesc + '</b>）');
    showToast('相手が「' + cpuItem.name + '」を発動！ (' + effectDesc + ')', 'info', 2400);

    // アイテムカードの強調バナー表示（何を使ったか全体に大きく表示）
    await showBanner('相手がアイテム発動！', 2200, cpuItem, '【' + cpuItem.name + '】 ' + effectDesc);

    // アイテムカードがファームへ送られるアニメーション演出
    var farmZone = $('opp-farm-pile') || $('zone-opp-farm') || $('zone-farm');
    var farmRect = farmZone ? farmZone.getBoundingClientRect() : { left: 350, top: 200, width: 80, height: 110 };
    if (window.SoundFX && typeof SoundFX.deal === 'function') SoundFX.deal();
    await flyCpuCard(cpuItem, farmRect, 0.75);

    oppFarm.push(cpuItem);
    renderOppFarm();

    // アイテム効果の適用と結果の明示
    if (cpuItem.effectType === 'run_bonus') {
      cpuRunBonus += cpuItem.effectValue;
      showToast('相手の走破数 +' + cpuItem.effectValue, 'info', 2200);
      setNarrator('相手の走破数が <b>+' + cpuItem.effectValue + '</b> アップ！（実効走破に加算）');
    } else if (cpuItem.effectType === 'elite_jockey') {
      cpuRunBonus += 1;
      cpuItemGuardBonus += 1;
      showToast('相手の走破数+1、ガード+1！', 'info', 2200);
      setNarrator('相手の走破数とガード値がそれぞれ <b>+1</b> アップ！');
    } else if (cpuItem.effectType === 'farm_recovery') {
      var recovered = null;
      var fIdx = oppFarm.findIndex(function (c) { return c.type === 'force' && c.id !== cpuItem.id; });
      if (fIdx >= 0) {
        recovered = oppFarm.splice(fIdx, 1)[0];
      } else {
        var hIdx = oppFarm.findIndex(function (c) { return c.type === 'horse' && c.id !== cpuItem.id; });
        if (hIdx >= 0) recovered = oppFarm.splice(hIdx, 1)[0];
      }
      if (recovered) {
        var oppHandEl = $('opponent-hand-display') || $('zone-opponent');
        var oppHandRect = oppHandEl ? oppHandEl.getBoundingClientRect() : { left: 200, top: 40, width: 80, height: 30 };
        var dummy = makeCpuCardDummy(recovered, farmRect);
        if (window.SoundFX && typeof SoundFX.deal === 'function') SoundFX.deal();
        var pRec = flyGhost(dummy, oppHandRect, 0.65);
        dummy.remove();
        await pRec;
        cpuHand.push(recovered);
        opponentHandCount = cpuHand.length;
        renderAll();
        showOpponentBubble('「' + recovered.name + '」を手札に回収！');
        setNarrator('相手が「' + cpuItem.name + '」の効果でファームから「<b>' + recovered.name + '</b>」を手札に回収しました。');
        showToast('相手がファームから「' + recovered.name + '」を回収！', 'info', 2400);
      }
    } else if (cpuItem.effectType === 'guard_bonus') {
      cpuItemGuardBonus += cpuItem.effectValue;
      showToast('相手のガードボーナス +' + cpuItem.effectValue, 'info', 2200);
    }

    renderAll();
    await sleep(500);
  }

  // CPUが手札からフォースカードを支払って馬カードを走破させるロジック（場の馬の続けて走破・入れ替えに対応）
  async function cpuPlayHorseIfApplicable() {
    var farmZone = $('opp-farm-pile') || $('zone-opp-farm') || $('zone-farm');
    var farmRect = farmZone ? farmZone.getBoundingClientRect() : { left: 350, top: 200, width: 80, height: 110 };
    var oppFieldEl = $('field-body-opp') || $('zone-field');
    var fieldRect = oppFieldEl ? oppFieldEl.getBoundingClientRect() : { left: 240, top: 140, width: 70, height: 100 };

    var cpuForceCount = cpuHandCountOfType('force');
    var handHorse = cpuPickRunnableHorse();
    var chosenHorse = null;
    var isReusingField = false;

    if (cpuHorseCard) {
      var fieldCost = cpuHorseCard.cost || 2;
      var canReuseField = (cpuForceCount >= fieldCost);
      var fieldRun = effectiveRun(cpuHorseCard, cpuRunBonus);
      var handRun = handHorse ? effectiveRun(handHorse, cpuRunBonus) : -999;

      if (handHorse && handRun > fieldRun) {
        // 手札により強い馬がいるので入れ替える
        chosenHorse = handHorse;
        isReusingField = false;
      } else if (canReuseField) {
        // 場の馬でそのまま続けて走破（コスト分のフォースがある場合のみ）
        chosenHorse = cpuHorseCard;
        isReusingField = true;
      } else if (handHorse) {
        // 場の馬のコストは払えないが手札の馬が出せる場合
        chosenHorse = handHorse;
        isReusingField = false;
      }
    } else {
      if (handHorse) {
        chosenHorse = handHorse;
        isReusingField = false;
      }
    }

    if (!chosenHorse) {
      setNarrator(iconImg('brain', 'img-icon-inline') + '相手は走破できる馬カードとコスト分のフォースカード（手札フォース: ' + cpuForceCount + '枚）が揃っていないため、ターンを終了しました。（相手の手札: ' + cpuHand.length + '枚）');
      showOpponentBubble('ターンエンド');
      await sleep(1000);
      showTurnChange('あなたのターン').then(function () {
        startPlayerTurn();
      });
      return;
    }

    var cost = chosenHorse.cost || 2;

    if (isReusingField) {
      showOpponentBubble('「' + chosenHorse.name + '」で続けて走破！');
      setNarrator(iconImg('brain', 'img-icon-inline') + '相手が手札から<b>フォースカード ' + cost + '枚</b> を支払い、場にいる「<b>' + chosenHorse.name + '</b>」で再び走破を宣言！');
      showToast('相手がフォース ' + cost + '枚を支払い【' + chosenHorse.name + '】で続けて走破！', 'info', 2600);

      // コスト分のフォースカードを手札から消費し、1枚ずつ相手ファームへ送る演出
      for (var i = 0; i < cost; i++) {
        var fIdx = cpuHand.findIndex(function (c) { return c.type === 'force'; });
        if (fIdx >= 0) {
          var fc = cpuHand.splice(fIdx, 1)[0];
          opponentHandCount = cpuHand.length;
          updateOpponentHandDisplay();
          if (window.SoundFX && typeof SoundFX.cardSlide === 'function') SoundFX.cardSlide();
          await flyCpuCard(fc, farmRect, 0.75);
          oppFarm.push(fc);
          renderOppFarm();
          if (farmZone) {
            farmZone.classList.add('deal-flash');
            setTimeout(function (el) { if (el) el.classList.remove('deal-flash'); }, 300, farmZone);
          }
          try { Haptics.place(); } catch (e) {}
          await sleep(220);
        }
      }
    } else {
      // 新しい馬を手札から出す（すでに場の馬がいればファームへ送る）
      var oldHorse = cpuHorseCard;
      if (oldHorse) {
        var oldFieldEl = document.querySelector('#field-body-opp .field-mini') || $('field-body-opp');
        if (oldFieldEl) flyGhost(oldFieldEl, farmRect, 0.8);
        oppFarm.push(oldHorse);
        renderOppFarm();
      }

      showOpponentBubble('「' + chosenHorse.name + '」で走破！');
      var oldMsg = oldHorse ? ('場の「<b>' + oldHorse.name + '</b>」をファームに送り、') : '';
      setNarrator(iconImg('brain', 'img-icon-inline') + '相手が手札から<b>フォースカード ' + cost + '枚</b> を支払い、' + oldMsg + '「<b>' + chosenHorse.name + '</b>」で走破を宣言！');
      showToast('相手がフォース ' + cost + '枚を支払い【' + chosenHorse.name + '】で走破！', 'info', 2600);

      // コスト分のフォースカードを手札から消費
      for (var j = 0; j < cost; j++) {
        var fIdx2 = cpuHand.findIndex(function (c) { return c.type === 'force'; });
        if (fIdx2 >= 0) {
          var fc2 = cpuHand.splice(fIdx2, 1)[0];
          opponentHandCount = cpuHand.length;
          updateOpponentHandDisplay();
          if (window.SoundFX && typeof SoundFX.cardSlide === 'function') SoundFX.cardSlide();
          await flyCpuCard(fc2, farmRect, 0.75);
          oppFarm.push(fc2);
          renderOppFarm();
          if (farmZone) {
            farmZone.classList.add('deal-flash');
            setTimeout(function (el) { if (el) el.classList.remove('deal-flash'); }, 300, farmZone);
          }
          try { Haptics.place(); } catch (e) {}
          await sleep(220);
        }
      }

      // 馬カードを手札から消費し、相手フィールドへ出す演出
      var hIdx = cpuHand.findIndex(function (c) { return c.id === chosenHorse.id; });
      if (hIdx >= 0) cpuHand.splice(hIdx, 1);
      opponentHandCount = cpuHand.length;
      updateOpponentHandDisplay();

      if (window.SoundFX && typeof SoundFX.cardSlide === 'function') SoundFX.cardSlide();
      await flyCpuCard(chosenHorse, fieldRect, 0.88);

      cpuHorseCard = chosenHorse;
    }

    renderField();

    // 馬カードを出した後に、アイテムカード／ジョッキーを使う（走破・ガードの補正はここで加算）
    await sleep(500);
    await cpuPlayItemIfApplicable('support');

    cpuRunValue = effectiveRun(chosenHorse, cpuRunBonus);
    var cpuMods = runModifiers(chosenHorse).map(function (mod) { return mod.label; }).join(' / ') || '適性補正なし';
    setNarrator(iconImg('brain', 'img-icon-inline') + '相手の「<b>' + chosenHorse.name + '</b>」 基礎 ' + chosenHorse.run + (cpuRunBonus ? '、アイテム +' + cpuRunBonus : '') + '、' + cpuMods + ' → 実効走破 <b>' + cpuRunValue + '</b>');
    renderAll();

    if (cpuRunValue <= 0) {
      setNarrator(iconImg('brain', 'img-icon-inline') + '相手の実効走破値が0以下のため走破失敗。あなたの番です。');
      showOpponentBubble('走破失敗…');
      oppFarm.push(cpuHorseCard);
      cpuHorseCard = null;
      renderAll();
      await sleep(800);
      showTurnChange('あなたのターン').then(function () {
        startPlayerTurn();
      });
      return;
    }

    // バナー表示後、プレイヤーのガード選択ポップアップを表示
    await showBanner('相手が走破宣言！', 2400, chosenHorse, '「' + chosenHorse.name + '」 馬の走破数 ' + cpuRunValue);
    showGuardPopup(cpuRunValue, chosenHorse);
  }

  async function cpuTurn() {
    itemGuardBonus = 0;
    cpuRunBonus = 0;
    cpuItemGuardBonus = 0;

    // 1. 相手のドロー演出（後攻1ターン目以降はお互いに各2枚ずつドロー）
    await sleep(300);
    var cpuDrawCount = 2;
    for (var i = 0; i < cpuDrawCount; i++) {
      if (cpuCurrentLane()) {
        await cpuDrawOneCardWithAnimation();
        if (i < cpuDrawCount - 1) await sleep(220);
      }
    }

    // ドロー完了後：手札を見て次の手を考える「思考中…」の吹き出しとナレーター
    await sleep(400);
    setNarrator(iconImg('brain', 'img-icon-inline') + '相手プレイヤーがドローした手札を確認して考え中…');
    await showOpponentBubble('思考中…', 2500);

    // 2. 走破できる馬がいない時だけ、獣医師で回収してから走破を狙う（馬を出す前に必要な唯一のアイテム）
    await cpuPlayItemIfApplicable('recovery');

    await sleep(600);

    // 3. フォースカードを支払って馬カードを出す → 出した後にアイテムカードを使う → 走破判定
    await cpuPlayHorseIfApplicable();
  }

  function showGuardPopup(runValue, horseCard) {
    hideToast();
    var popup = $('guard-popup');
    var slot = $('guard-horse-slot');
    if (slot) {
      slot.innerHTML = '';
      if (horseCard) {
        var cEl = buildCardEl(horseCard);
        slot.appendChild(cEl);
      }
    }
    var titleEl = $('guard-title');
    if (titleEl) {
      titleEl.innerHTML = horseCard ? ('相手が「<b>' + horseCard.name + '</b>」で走破！') : '相手が走破してきました！';
    }

    // 内訳（基礎、アイテム上昇、適性補正）の組み立て
    var breakdownParts = [];
    if (horseCard) {
      breakdownParts.push('基礎 ' + horseCard.run);
      if (cpuRunBonus > 0) {
        breakdownParts.push('<span style="color:#047857;background:rgba(16,185,129,0.18);padding:1px 6px;border-radius:4px;font-weight:800;">アイテム +' + cpuRunBonus + '</span>');
      }
      var mods = runModifiers(horseCard);
      mods.forEach(function (m) {
        breakdownParts.push(m.label);
      });
    }
    var breakdownHtml = '';
    if (breakdownParts.length > 1 || cpuRunBonus > 0) {
      breakdownHtml = '<div class="popup-breakdown">' +
        '内訳: ' + breakdownParts.join(' ＋ ') + ' ＝ 実効走破 <b class="popup-highlight-value">' + runValue + '</b>' +
        '</div>';
    }

    var distKey = race ? raceDistanceKey(race.distance) : '';
    var canGuard = hand.some(function (c) {
      return c.type === 'horse' && (!distKey || (c.dist || '').indexOf(distKey) >= 0);
    });
    var descEl = $('guard-desc');
    var btnsEl = $('guard-btns');
    popup.style.display = 'flex';

    if (canGuard) {
      descEl.innerHTML =
        '<div class="popup-lead">相手の走破を手札の馬カードでガードしますか？</div>' +
        '<div class="popup-subtext">（相手の走破数以上のガード値で守ると、相手の走破馬をファーム送りにできます）</div>' +
        '<div class="popup-stat-row">相手の実効走破値: <b class="popup-highlight-value">' + runValue + '</b></div>' +
        breakdownHtml;
      btnsEl.innerHTML =
        '<button class="btn-guard" id="guard-yes">ガードする</button>' +
        '<button class="btn-skip" id="guard-no">ガードしない</button>';

      $('guard-yes').addEventListener('click', function () {
        popup.style.display = 'none';
        phase = 'guard_select';
        setNarrator(iconImg('shield', 'img-icon-inline') + '<b>ガードする馬カード</b>を選んでタップしてください。<br><span class="banner-tap-hint narrator-tap-hint">（カードの上に表示されている ' + iconImg('shield', 'img-icon-inline') + 'ガード値 が相手のドローを減らす数値です）</span>');
        renderAll();
      });
      $('guard-no').addEventListener('click', function () {
        popup.style.display = 'none';
        guardValue = 0;
        itemGuardBonus = 0;
        executeCpuDraw(cpuRunValue);
      });
    } else {
      descEl.innerHTML =
        '<div class="popup-stat-row">相手の実効走破値: <b class="popup-highlight-value">' + runValue + '</b></div>' +
        breakdownHtml +
        '<div class="popup-subtext">（手札にガード可能な馬カードがありません）</div>';
      btnsEl.innerHTML =
        '<button class="btn-guard" id="guard-ok">OK（相手がドロー）</button>';

      $('guard-ok').addEventListener('click', function () {
        popup.style.display = 'none';
        guardValue = 0;
        itemGuardBonus = 0;
        executeCpuDraw(cpuRunValue);
      });
    }
  }

  function selectGuard(card) {
    if (phase !== 'guard_select') return;
    if (card.type !== 'horse') { shakeCard(card.id); return; }
    if ((card.dist || '').indexOf(raceDistanceKey(race.distance)) < 0) {
      setNarrator('この馬は今回の<b>' + race.distance + '</b>をガードできません。距離適性を確認してください。');
      shakeCard(card.id);
      return;
    }
    var guardVal = (card.guard || 0) + itemGuardBonus;
    itemGuardBonus = 0;
    guardValue = guardVal;
    var el = cardElById(card.id);
    if (el) {
      el.style.pointerEvents = 'none';
      el.classList.add('selected');
      var farmRect = $('zone-farm').getBoundingClientRect();
      flyGhost(el, farmRect).then(function () {
        hand = hand.filter(function (c) { return c.id !== card.id; });
        farm.push(card);
        phase = 'idle';
        renderAll();
        var cpuRun = cpuRunValue;
        var myGuard = guardVal;
        var actualDraw = Math.max(0, cpuRun - myGuard);
        var isFullyDefended = (actualDraw === 0);

        var calcSubHtml =
          '<div class="guard-calc-formula">' +
          '<span class="guard-calc-pill pill-run">相手の走破数 <b>' + cpuRun + '</b></span>' +
          '<span class="guard-calc-op">−</span>' +
          '<span class="guard-calc-pill pill-guard">自分のガード数 <b>' + myGuard + '</b></span>' +
          '<span class="guard-calc-op">＝</span>' +
          (isFullyDefended ?
            '<span class="guard-calc-pill pill-result-win">完全防御 (0)</span>' :
            '<span class="guard-calc-pill pill-result-lose">相手ドロー <b>' + actualDraw + '枚</b></span>'
          ) +
          '</div>';

        var guardTitle = isFullyDefended ?
          '自分がガード！ 走破を完全に防いだ！' :
          ('自分がガード！ 相手のドローを' + myGuard + '枚減少！');

        setNarrator(iconImg('shield', 'img-icon-inline') + '<b>【' + card.name + '】でガード！</b> 相手の走破数 <b>' + cpuRun + '</b> − 自分のガード数 <b>' + myGuard + '</b> ＝ ' + (isFullyDefended ? '相手の走破を完全に阻止！' : '相手のドローが <b>' + actualDraw + '枚</b> に減少。'));
        showBanner(guardTitle, 3200, card, calcSubHtml).then(function () {
          executeCpuDraw(cpuRunValue - guardVal);
        });
      });
    }
  }

  function executeCpuDraw(drawCount) {
    var actualDraw = Math.max(0, drawCount);
    if (actualDraw <= 0) {
      var horseName = cpuHorseCard ? cpuHorseCard.name : '馬';
      setNarrator(iconImg('shield', 'img-icon-inline') + 'ガード値 <b>' + guardValue + '</b> で相手の走破（走破値 <b>' + cpuRunValue + '</b>）を完全に防いだ！ 相手の「<b>' + horseName + '</b>」はファームへ送られます。');
      showOpponentBubble('防がれたか…！');
      var pHorse = Promise.resolve();
      if (cpuHorseCard) {
        var oppFieldEl = document.querySelector('#field-body-opp .field-mini') || $('field-body-opp');
        var farmZone = $('opp-farm-pile') || $('zone-opp-farm') || $('zone-farm');
        var farmRect = farmZone ? farmZone.getBoundingClientRect() : { left: 350, top: 200, width: 80, height: 110 };
        if (oppFieldEl) {
          pHorse = flyGhost(oppFieldEl, farmRect, 0.9).then(function () {
            oppFarm.push(cpuHorseCard);
            cpuHorseCard = null;
            renderAll();
          });
        } else {
          oppFarm.push(cpuHorseCard);
          cpuHorseCard = null;
          renderAll();
        }
      }
      pHorse.then(function () {
        sleep(800).then(function () {
          showTurnChange('あなたのターン').then(function () {
            startPlayerTurn();
          });
        });
      });
      return;
    }
    var maxDraw = Math.min(actualDraw, cpuTotalDeck());
    var cpuDiscardCount = Math.max(0, maxDraw - 1);
    var cpuReason = (guardValue > 0) ?
      ('走破 <b>' + cpuRunValue + '</b> − ガード <b>' + guardValue + '</b> ＝ 走破数 <b>' + actualDraw + '</b>') :
      ('走破数が <b>' + actualDraw + '</b>（ガードなし）');
    setNarrator('相手（CPU）は走破に成功しました。' + cpuReason + ' だから山札から <b>' + maxDraw + '枚</b> 引きます。その後、走破数−1枚（<b>' + cpuDiscardCount + '枚</b>）をファームに捨てます。走破した馬はフィールドに残ります。');
    showOpponentBubble('走破成功！');

    var horse = cpuHorseCard || goldShip();
    showBanner('走破成功！', 2600, horse, '相手（CPU）は走破に成功しました<br><b>馬の走破数 ' + actualDraw + '</b>').then(function () {
      var chain = Promise.resolve();
      var handEl = $('opponent-hand-display') || $('zone-opponent');
      var opponentRect = handEl ? handEl.getBoundingClientRect() : { left: 200, top: 20, width: 80, height: 30 };
      for (var i = 0; i < maxDraw; i++) {
        (function () {
          chain = chain.then(function () {
            var deckRect = cpuDeckSourceRect();
            var dummy = makeSmallCardDummy(deckRect);
            var p = flyGhost(dummy, opponentRect, 0.6);
            dummy.remove();
            return p.then(function () {
              var card = getNextCpuDrawCard();
              cpuHand.push(card);
              opponentHandCount = cpuHand.length;
              cpuDrawOneFromDeck();
              lastDrawer = 'cpu';
              renderOpponentDeck();
              updateOpponentHandDisplay();
              if (window.SoundFX && typeof SoundFX.cardSlide === 'function') SoundFX.cardSlide();
              return sleep(140);
            });
          });
        })();
      }
      chain.then(function () {
        // 走破成功時：走破数 - 1 枚を手札から捨てる（プレイヤーと同ルール）
        var discardCount = Math.max(0, maxDraw - 1);
        var needDiscard = Math.min(discardCount, cpuHand.length);

        function cpuPickCardToDiscard() {
          if (!cpuHand.length) return null;
          // 1. アイテムカード（既に使わなかったもの）
          var itemIdx = cpuHand.findIndex(function (c) { return c.type === 'item'; });
          if (itemIdx >= 0) return cpuHand.splice(itemIdx, 1)[0];

          // 2. 馬カードが複数あれば、走破値の低い馬を捨てる
          var horses = cpuHand.filter(function (c) { return c.type === 'horse'; });
          if (horses.length > 1) {
            horses.sort(function (a, b) { return (a.run || 0) - (b.run || 0); });
            var worstHorse = horses[0];
            var hIdx = cpuHand.findIndex(function (c) { return c.id === worstHorse.id; });
            if (hIdx >= 0) return cpuHand.splice(hIdx, 1)[0];
          }

          // 3. フォースカードが4枚以上あればフォースを捨てる
          var forces = cpuHand.filter(function (c) { return c.type === 'force'; });
          if (forces.length >= 4) {
            var fIdx = cpuHand.findIndex(function (c) { return c.type === 'force'; });
            if (fIdx >= 0) return cpuHand.splice(fIdx, 1)[0];
          }

          // 4. その他は末尾のカードを捨てる
          return cpuHand.pop();
        }

        var discardChain = Promise.resolve();
        if (needDiscard > 0) {
          setNarrator('相手（CPU）は走破ルールに従い、手札から <b>' + needDiscard + '枚</b> を相手ファームに送ります…');
          var farmZone = $('opp-farm-pile') || $('zone-opp-farm') || $('zone-farm');
          var farmRect = farmZone ? farmZone.getBoundingClientRect() : { left: 350, top: 200, width: 80, height: 110 };

          for (var d = 0; d < needDiscard; d++) {
            (function (idx) {
              discardChain = discardChain.then(function () {
                var discarded = cpuPickCardToDiscard();
                if (!discarded) return;
                var currentHandEl = $('opponent-hand-display') || $('zone-opponent');
                var currentHandRect = currentHandEl ? currentHandEl.getBoundingClientRect() : { left: 200, top: 20, width: 80, height: 30 };
                var dummy = makeCpuCardDummy(discarded, currentHandRect);
                var p = flyGhost(dummy, farmRect, 0.75);
                dummy.remove();
                return p.then(function () {
                  oppFarm.push(discarded);
                  opponentHandCount = cpuHand.length;
                  renderOppFarm();
                  updateOpponentHandDisplay();
                  if (window.SoundFX && typeof SoundFX.cardSlide === 'function') SoundFX.cardSlide();
                  return sleep(220);
                });
              });
            })(d);
          }
        }

        return discardChain.then(function () {
          // 走破成功時：走破した馬は相手フィールドに残る（ファームへ送らない）
          var horseName = cpuHorseCard ? cpuHorseCard.name : '馬';
          var endMsg = needDiscard > 0
            ? (iconImg('brain', 'img-icon-inline') + '相手のターン終了！ 手札を ' + needDiscard + '枚 捨てました（相手の残り手札: ' + cpuHand.length + '枚）。走破した「<b>' + horseName + '</b>」はフィールドに残ります。あなたの番です。')
            : (iconImg('brain', 'img-icon-inline') + '相手のターン終了！ 走破した「<b>' + horseName + '</b>」はフィールドに残ります。あなたの番です。');
          setNarrator(endMsg);
          if (needDiscard > 0) {
            showToast('相手が手札を' + needDiscard + '枚捨てました', 'info', 2200);
          }
          return sleep(700).then(function () {
            return showTurnChange('あなたのターン').then(function () {
              startPlayerTurn();
            });
          });
        });
      });
    });
  }

  /* ===================== 走破実行（相手ガード付き） ===================== */
  function executeRun() {
    if (!selectedHorse && field) selectedHorse = field;
    if (!selectedHorse || isCpuTurn) return;
    var totalRun = effectiveRun(selectedHorse, runBonus);
    var horseInPlay = selectedHorse;
    var modifierText = runModifiers(selectedHorse).map(function (mod) { return mod.label; }).join(' / ') || '適性補正なし';

    setNarrator('<b>' + horseInPlay.name + '</b> で走破！ 基礎走破 ' + horseInPlay.run + '、' + modifierText + (runBonus ? '、アイテム +' + runBonus : '') + ' → 実効走破 <b>' + totalRun + '</b>。<br><span class="banner-tap-hint narrator-tap-hint">画面をタップ／クリックして次へ進む</span>');

    /* STEP 3: 相手が考える → STEP 4: 走破成功/失敗の結果表示 */
    function afterField() {
      if (!isCpuTurn) {
        hideToast();
        var thinkingPopup = $('opponent-thinking-popup');
        if (thinkingPopup) {
          var titleEl = thinkingPopup.querySelector('.popup-title');
          var descEl = thinkingPopup.querySelector('.popup-desc');
          if (titleEl) titleEl.innerHTML = iconImg('shield', 'img-icon-inline') + 'ガード確認';
          if (descEl) descEl.innerHTML = '相手プレイヤーがガードをするか考えています…';
          thinkingPopup.style.display = 'flex';
        }
        setNarrator('相手プレイヤーがガードをするか考えています…（2.5秒）');
        return sleep(2500).then(function () {
          if (thinkingPopup) thinkingPopup.style.display = 'none';

          // 相手の手札に、現在の距離適性に合う馬カードがあるか確認
          var distKey = raceDistanceKey(race.distance);
          var guardHorses = cpuHand.filter(function (c) {
            return c.type === 'horse' && (c.dist || '').indexOf(distKey) >= 0;
          });

          // 相手がガードを2回連続でしたら、次はガードを選択しない（3回連続ガード防止）
          var canConsecutiveGuard = (cpuConsecutiveGuardCount < 2);
          var shouldGuard = canConsecutiveGuard && guardHorses.length > 0 && (Math.random() < 0.33);

          if (!shouldGuard) {
            cpuConsecutiveGuardCount = 0; // ガードしなかった場合は連続カウントをリセット
            showOpponentBubble('ガードしません', 2500);
            setNarrator('相手プレイヤーはガードを選択しませんでした。');

            var noticePromise = Promise.resolve();
            if (thinkingPopup) {
              var titleEl = thinkingPopup.querySelector('.popup-title');
              var descEl = thinkingPopup.querySelector('.popup-desc');
              if (titleEl) titleEl.innerHTML = iconImg('shield', 'img-icon-inline') + 'ガード確認';
              if (descEl) {
                descEl.innerHTML = '<b class="popup-highlight-title">相手プレイヤーはガードを選択しませんでした</b><span class="banner-tap-hint">画面をタップ／クリックして次へ進む</span>';
              }
              thinkingPopup.style.display = 'flex';
              noticePromise = new Promise(function (resolve) {
                var done = false;
                var timer = null;
                function finish() {
                  if (done) return;
                  done = true;
                  if (timer) clearTimeout(timer);
                  thinkingPopup.removeEventListener('click', finish);
                  thinkingPopup.style.display = 'none';
                  resolve();
                }
                thinkingPopup.addEventListener('click', finish);
                timer = setTimeout(finish, 2200);
              });
            }

            return noticePromise.then(function () {
              if (totalRun <= 0) {
                return showBanner('走破失敗').then(function () {
                  setNarrator(iconImg('cross', 'img-icon-inline') + '実効走破値 ' + totalRun + ' はガード値 0 を上回れず、走破失敗。');
                  return sendHorseToFarmAndReset();
                });
              }
              return showBanner('走破成功！', 3200, horseInPlay, '走破に成功しました<br>馬の走破数 ' + totalRun).then(function () {
                setNarrator('相手はガードをしませんでした。走破成功です！');
                return continueRunLogic(totalRun, false, 0);
              });
            });
          } else {
            cpuConsecutiveGuardCount++; // ガード成立で連続カウントを加算
            // ガード値の高い馬、または走破値が控えめな馬を優先してガードに使用
            guardHorses.sort(function (a, b) { return (b.guard || 0) - (a.guard || 0); });
            var guardHorse = guardHorses[0];

            // 相手の手札から実際に消費
            var ghIdx = cpuHand.findIndex(function (c) { return c.id === guardHorse.id; });
            if (ghIdx >= 0) cpuHand.splice(ghIdx, 1);
            opponentHandCount = cpuHand.length;
            updateOpponentHandDisplay();

            showOpponentBubble('「' + guardHorse.name + '」でガード！');

            // 相手手札からフィールドへガード馬が飛ぶ演出
            var oppFieldEl = $('field-body-opp') || $('zone-field');
            var fieldRect = oppFieldEl ? oppFieldEl.getBoundingClientRect() : { left: 240, top: 140, width: 70, height: 100 };
            return flyCpuCard(guardHorse, fieldRect, 0.85).then(function () {
              fieldGuard = guardHorse;
              renderField();
              var guardVal = (guardHorse.guard || 0) + cpuItemGuardBonus;
              cpuItemGuardBonus = 0;
              var isBreached = (totalRun > guardVal);
              var runDistance = isBreached ? (totalRun - guardVal) : 0;

              // 「自分の走破数 − 相手のガード数」を視覚的に明示する計算式パネル
              var calcSubHtml =
                '<div class="guard-calc-formula">' +
                '<span class="guard-calc-pill pill-run">自分の走破数 <b>' + totalRun + '</b></span>' +
                '<span class="guard-calc-op">−</span>' +
                '<span class="guard-calc-pill pill-guard">相手のガード数 <b>' + guardVal + '</b></span>' +
                '<span class="guard-calc-op">＝</span>' +
                (isBreached ?
                  '<span class="guard-calc-pill pill-result-win">走破 <b>' + runDistance + '</b></span>' :
                  '<span class="guard-calc-pill pill-result-lose">防がれた (0)</span>'
                ) +
                '</div>';

              var bannerTitle = isBreached ?
                ('相手のガードを突破！ 実効走破 <b>' + runDistance + '</b>') :
                ('相手がガード！ 走破を防がれました');

              return showBanner(bannerTitle, 3500, guardHorse, calcSubHtml).then(function () {
                if (!isBreached) {
                  setNarrator(iconImg('cross', 'img-icon-inline') + '<b>走破失敗。</b> 自分の走破数 <b>' + totalRun + '</b> − 相手のガード数 <b>' + guardVal + '</b> ≦ 0 のため防がれました。走破した<b>【' + horseInPlay.name + '】</b>はファームへ送られます。');
                  return sendHorseToFarmAndReset();
                } else {
                  setNarrator(iconImg('shield', 'img-icon-inline') + '<b>ガード突破！</b> 自分の走破数 <b>' + totalRun + '</b> − 相手のガード数 <b>' + guardVal + '</b> ＝ <b>実効走破 ' + runDistance + '</b>。ガードを突破しました！');
                  return sleep(900).then(function () { return continueRunLogic(runDistance, true, guardVal); });
                }
              });
            });
          }
        });
      }
      return continueRunLogic(totalRun, false, 0);
    }

    /* STEP 5: 成功時の報酬ドロー＋捨て札 */
    function continueRunLogic(finalRun, usedGuard, usedGuardVal) {
      var drawCount = Math.min(finalRun, totalDeck());
      var discardCount = Math.max(0, drawCount - 1);
      if (drawCount <= 0) {
        setNarrator('走破値が0になったため、カードを引けませんでした。');
        return sendHorseToFarmAndReset();
      }

      var reason = usedGuard ?
        ('実効走破 <b>' + totalRun + '</b> − ガード <b>' + usedGuardVal + '</b> ＝ 走破数 <b>' + finalRun + '</b>') :
        ('<b>' + (horseInPlay ? horseInPlay.name : '馬') + '</b>の走破数が <b>' + finalRun + '</b>（基礎 ' + (horseInPlay ? horseInPlay.run : '') + (modifierText ? '、' + modifierText : '') + (runBonus ? '、アイテム +' + runBonus : '') + '）');

      setNarrator(reason + ' だから山札から <b>' + drawCount + '枚</b> 引きます。その後、走破数−1枚（<b>' + discardCount + '枚</b>）をファームに捨てます。走破した馬はフィールドに残ります。');
      showToast('走破数 ' + finalRun + '枚ドロー → 走破数−1（' + discardCount + '枚）捨て', 'info', 3000);

      var noticeTitle = usedGuard ? '走破ドロー（ガード突破）' : '走破ドロー';
      var noticeDesc = '';
      if (usedGuard) {
        noticeDesc =
          '<div class="popup-guard-calc-box">' +
          '<div class="calc-explain-lead">相手のガード（<b>' + usedGuardVal + '</b>）を突破しました！</div>' +
          '<div class="guard-calc-formula">' +
          '<span class="guard-calc-pill pill-run">自分の走破数 <b>' + totalRun + '</b></span>' +
          '<span class="guard-calc-op">−</span>' +
          '<span class="guard-calc-pill pill-guard">相手のガード数 <b>' + usedGuardVal + '</b></span>' +
          '<span class="guard-calc-op">＝</span>' +
          '<span class="guard-calc-pill pill-result-win">引く枚数 <b>' + drawCount + '枚</b></span>' +
          '</div>' +
          '</div>' +
          '走破数からガード数を引いた差分（<b>' + drawCount + '枚</b>）カードを山札から引きます。';
      } else {
        noticeDesc = '走破数分（<b>' + drawCount + '枚</b>）カードを引きます。';
      }

      // 1. 走破したら走破数分カードを引きますのポップアップ
      return showNoticePopup(
        noticeTitle,
        noticeDesc,
        'カードを引く（' + drawCount + '枚）'
      ).then(function () {
        var chain = Promise.resolve();
        for (var i = 0; i < drawCount; i++) {
          (function () {
            chain = chain.then(function () {
              var deckRect = deckSourceRect();
              var handRect = $('hand-row').getBoundingClientRect();
              var dummy = makeDeckDummy(deckRect);
              return flyGhost(dummy, handRect).then(function () {
                dummy.remove();
                hand.push(getNextPlayerDrawCard());
                drawOneFromDeck();
                lastDrawer = 'player';
                renderAll();
                if (window.SoundFX && typeof SoundFX.deal === 'function') SoundFX.deal();
                return sleep(140);
              });
            });
          })();
        }
        return chain.then(function () {
          var need = Math.min(discardCount, hand.length);
          if (need > 0) {
            // 2. 走破後には、走破数ー１枚のカードを捨ててくださいのポップアップ
            return showNoticePopup(
              iconImg('trash', 'img-icon-inline') + '手札を捨てる',
              '走破数−1枚（<b>' + need + '枚</b>）のカードを捨ててください。',
              'カードを選ぶ'
            ).then(function () {
              phase = 'discard_select';
              selectionNeeded = need;
              selectionCount = 0;
              pendingFinishRun = function () { finishRun(finalRun, usedGuard, usedGuardVal); };
              setNarrator('走破数 ' + finalRun + ' − 1 ＝ <b>' + need + '枚</b> を手札から選んでファームに捨ててください。（残り ' + need + ' 枚）');
              renderAll();
            });
          } else {
            finishRun(finalRun, usedGuard, usedGuardVal);
          }
        });
      });
    }

    function finishRun(finalRun, usedGuard, usedGuardVal) {
      var discardCount = Math.max(0, finalRun - 1);
      var horseName = (field && field.name) ? field.name : ((horseInPlay && horseInPlay.name) ? horseInPlay.name : '馬');
      var msg = '<b>走破成功！</b> ' + finalRun + '枚引いて、走破数−1枚（' + discardCount + '枚）をファームに送りました。走破した<b>【' + horseName + '】</b>はフィールドに残ります。';
      if (usedGuard) msg += ' <span style="font-size:12px;color:var(--rail-dim)">（相手ガード' + usedGuardVal + 'を突破）</span>';
      setNarrator(msg);
      keepHorseOnFieldAndReset();
    }

    /* 走破成功時：走破した馬はフィールドに残し、相手のガード馬のみ相手ファームへ送る */
    function keepHorseOnFieldAndReset() {
      var pG = Promise.resolve();
      if (fieldGuard) {
        var oppFarmZone = $('opp-farm-pile') || $('zone-opp-farm') || $('zone-farm');
        var oppFarmRect = oppFarmZone ? oppFarmZone.getBoundingClientRect() : { left: 350, top: 200, width: 80, height: 110 };
        var guardEl = document.querySelector('#field-body-opp .field-mini') || document.querySelector('.field-guard-card');
        pG = (guardEl) ? flyGhost(guardEl, oppFarmRect) : Promise.resolve();
      }
      return pG.then(function () {
        if (fieldGuard) { oppFarm.push(fieldGuard); fieldGuard = null; }
        phase = 'idle'; selectedHorse = null; selectedForces = []; runBonus = 0; canDraw = false;
        renderAll();
        checkVictory();
        if (!victoryShown) {
          if (interactionMode === 'freeplay') {
            return sleep(1200).then(function () {
              if (!victoryShown && !isCpuTurn) {
                endTurn();
              }
            });
          } else {
            checkHintsAvailable();
          }
        }
      });
    }

    /* ガード等で走破失敗時：走破した馬をファームへ送る */
    function sendHorseToFarmAndReset() {
      var farmRect = $('zone-farm').getBoundingClientRect();
      var fieldEl = document.querySelector('#field-body .field-mini');
      var p = (field && fieldEl) ? flyGhost(fieldEl, farmRect) : Promise.resolve();
      if (fieldGuard) {
        var oppFarmZone = $('opp-farm-pile') || $('zone-opp-farm') || $('zone-farm');
        var oppFarmRect = oppFarmZone ? oppFarmZone.getBoundingClientRect() : farmRect;
        var guardEl = document.querySelector('#field-body-opp .field-mini') || document.querySelector('.field-guard-card');
        var pG = (guardEl) ? flyGhost(guardEl, oppFarmRect) : Promise.resolve();
        p = Promise.all([p, pG]);
      }
      return p.then(function () {
        if (field) { farm.push(field); field = null; }
        if (fieldGuard) { oppFarm.push(fieldGuard); fieldGuard = null; }
        phase = 'idle'; selectedHorse = null; selectedForces = []; runBonus = 0; canDraw = false;
        renderAll();
        checkVictory();
        if (!victoryShown) {
          if (interactionMode === 'freeplay') {
            // 走破が完了したら結果メッセージの表示後に自動で相手のターンへ移行
            return sleep(1200).then(function () {
              if (!victoryShown && !isCpuTurn) {
                endTurn();
              }
            });
          } else {
            checkHintsAvailable();
          }
        }
      });
    }

    function proceedToRunSequence() {
      if (!isCpuTurn && runSupportCards().length > 0) {
        pendingAfterField = function () {
          totalRun = effectiveRun(horseInPlay, runBonus);
          afterField();
        };
        offerRunSupport();
      } else {
        afterField();
      }
    }

    // 馬カードを拡大表示し、ユーザーが画面をタップまたはクリックするまで待機
    var horseDetailText = CardCloseup.formatCardDetail ? CardCloseup.formatCardDetail(horseInPlay) : '';
    CardCloseup.show(horseInPlay, {
      label: '走破カード確認',
      toast: horseDetailText + '<div class="closeup-tap-wrap"><span class="banner-tap-hint">画面をタップ／クリックして次へ進む</span></div>'
    }).then(function () {
      proceedToRunSequence();
    });
  }

  /* ===================== アイテム効果の適用 ===================== */
  // カードごとの effectType に応じて処理を分岐する。
  // 新しい効果タイプを追加する場合はここに case を増やすだけでよい。
  function applyItemEffect(card) {
    var isFreeplay = (interactionMode === 'freeplay');
    var itemDetail = CardCloseup.formatCardDetail ? CardCloseup.formatCardDetail(card) : (card.name || '');
    var toastHtml = itemDetail + (isFreeplay ? '<div class="closeup-tap-wrap"><span class="banner-tap-hint">画面をタップ／クリックして次へ進む</span></div>' : '');
    CardCloseup.show(card, {
      label: (card.type === 'jockey' ? '騎手' : 'アイテム') + '発動！',
      toast: toastHtml,
      autoHideMs: isFreeplay ? null : 1200
    });
    var msg = 'アイテム「' + card.name + '」を使った！';
    switch (card.effectType) {
      case 'run_bonus':
        runBonus += card.effectValue;
        msg += ' 自分の馬の走破数 +' + card.effectValue;
        break;
      case 'guard_bonus':
        itemGuardBonus += card.effectValue;
        msg += ' ガード +' + card.effectValue + '（次にガードする時に加算されます）';
        break;
      case 'elite_jockey':
        runBonus += 1;
        itemGuardBonus += 1;
        msg += ' 自分の馬の走破数 +1、ガード +1！';
        break;
      case 'farm_recovery':
        var recoveredForce = null;
        var recoveredHorse = null;
        for (var fi = 0; fi < farm.length; fi++) {
          if (!recoveredForce && farm[fi].type === 'force') {
            recoveredForce = farm.splice(fi, 1)[0];
            fi--;
            continue;
          }
          if (!recoveredHorse && farm[fi].type === 'horse') {
            recoveredHorse = farm.splice(fi, 1)[0];
            fi--;
            continue;
          }
        }
        var recNames = [];
        if (recoveredForce) { hand.push(recoveredForce); recNames.push(recoveredForce.name); }
        if (recoveredHorse) { hand.push(recoveredHorse); recNames.push(recoveredHorse.name); }
        if (recNames.length > 0) {
          msg += ' ファームから【' + recNames.join('・') + '】を手札に戻した！';
        } else {
          msg += ' ファームに対象のカードがありませんでした。';
        }
        break;
      case 'draw':
        var drawn = 0;
        for (var i = 0; i < card.effectValue; i++) {
          if (!currentLane()) break;
          hand.push(getNextPlayerDrawCard());
          drawOneFromDeck();
          drawn++;
        }
        msg += drawn > 0 ? (' 手札を' + drawn + '枚引いた！') : ' 山札が残っていなかった…';
        break;
      case 'discard_opponent':
        var before = opponentHandCount;
        opponentHandCount = Math.max(0, opponentHandCount - card.effectValue);
        msg += ' 相手の手札を' + (before - opponentHandCount) + '枚減らした！';
        break;
      default:
        msg += ' 効果を発動！';
    }
    setNarrator(msg);
  }

  function onHandCardClick(id) {
    var card = hand.filter(function (c) { return c.id === id; })[0];
    if (!card) return;
    var el = cardElById(id);
    Haptics.select();

    // チュートリアル中等の waitSelect モード処理（interactionModeが明示的に 'select-force' / 'select-horse' / 'select-any' の場合）
    if (interactionMode && interactionMode !== 'freeplay' && interactionMode !== 'draw') {
      if (interactionMode === 'select-force' && card.type !== 'force') { shakeCard(id); return; }
      if (interactionMode === 'select-horse' && card.type !== 'horse') { shakeCard(id); return; }

      var toField2 = (interactionMode === 'select-horse');
      var destId2 = toField2 ? 'zone-field' : 'zone-farm';
      var destEl2 = $(destId2);
      var destRect2 = destEl2 ? destEl2.getBoundingClientRect() : null;

      hand = hand.filter(function (c) { return c.id !== id; });
      if (toField2) {
        if (field) farm.push(field);
        field = card;
      } else {
        farm.push(card);
      }
      selectionCount++;

      if (el && destRect2) {
        el.style.pointerEvents = 'none';
        el.classList.add('selected');
        flyGhost(el, destRect2);
      }

      renderAll();
      Haptics.place();

      if (selectionCount >= selectionNeeded) {
        var resolve = actionResolve;
        interactionMode = null;
        actionResolve = null;
        setTimeout(function () { if (resolve) resolve(); }, 150);
      }
      return;
    }

    if (interactionMode === 'draw') return;

    if (phase === 'guard_select') {
      if (card.type === 'horse') {
        selectGuard(card);
      } else {
        shakeCard(id);
        setNarrator(iconImg('shield', 'img-icon-inline') + 'ガードには<b>馬カード</b>を選んでください。（フォースカードやアイテムではガードできません）');
      }
      return;
    }

    if (isCpuTurn) return;

    // --- プレイヤー通常操作フェーズ（phase基準で確実に判定） ---
    if (phase === 'discard_select') {
      var farmElD = $('zone-farm');
      var farmRectD = farmElD ? farmElD.getBoundingClientRect() : null;
      if (el && farmRectD) {
        el.style.pointerEvents = 'none';
        el.classList.add('selected');
        flyGhost(el, farmRectD);
      }
      hand = hand.filter(function (c) { return c.id !== id; });
      farm.push(card);
      renderAll();
      selectionCount++;
      var remaining = selectionNeeded - selectionCount;
      if (remaining > 0) {
        setNarrator('走破数−1枚（計 <b>' + selectionNeeded + '枚</b>）を捨てます。ファームに送るカードを選んでください。（残り <b>' + remaining + '枚</b>）');
      } else {
        phase = 'idle';
        var fn = pendingFinishRun;
        pendingFinishRun = null;
        if (fn) fn();
      }
      return;
    }

    if (phase === 'select_horse') {
      if (card.type !== 'horse') { shakeCard(id); return; }
      var cost = card.cost || 2;
      var forces = hand.filter(function (c) { return c.type === 'force'; });
      if (forces.length < cost) {
        showToast('フォースカードが不足しています（必要: ' + cost + '枚）');
        setNarrator(iconImg('warning', 'img-icon-inline') + 'コストとなる<b>フォースカードが不足しています</b>（必要: ' + cost + '枚 / 手札: ' + forces.length + '枚）');
        Haptics.warn();
        shakeCard(id);
        return;
      }

      selectedHorse = card;
      selectedForces = [];

      var oldFieldHorse = field;
      var farmElH = $('zone-farm');
      var fieldElH = $('zone-field');
      var farmRect = farmElH ? farmElH.getBoundingClientRect() : null;
      var fieldRect = fieldElH ? fieldElH.getBoundingClientRect() : null;

      // もしすでに場に馬がいた場合、前の馬をファームへ送る
      if (oldFieldHorse) {
        var oldFieldEl = document.querySelector('#field-body .field-mini');
        if (oldFieldEl && farmRect) flyGhost(oldFieldEl, farmRect, 0.8);
        farm.push(oldFieldHorse);
      }

      // 馬カードを手札からフィールドへ即座に移動
      hand = hand.filter(function (c) { return c.id !== card.id; });
      field = card;
      fieldGuard = null;
      phase = 'select_force';

      if (el && fieldRect) {
        el.style.pointerEvents = 'none';
        el.classList.add('selected');
        flyGhost(el, fieldRect);
      }

      renderAll();
      Haptics.place();
      if (window.SoundFX && typeof SoundFX.deal === 'function') SoundFX.deal();
      var horseName = card.name || '馬カード';
      var swapNote = oldFieldHorse ? ('（場にいた「<b>' + oldFieldHorse.name + '</b>」をファームに送りました）<br>') : '';
      setNarrator(swapNote + '<b>' + horseName + '</b>をフィールドに出しました！ コストとして手札から<b>フォースカードを' + cost + '枚</b>選んでファームに送ってください。（残り ' + cost + ' 枚）');
      showToast('【' + horseName + '】を出しました！ フォースカードを' + cost + '枚選んでください');
      return;
    }

    if (phase === 'select_force') {
      if (card.type !== 'force') {
        shakeCard(id);
        showToast('フォースカードを選んでください');
        return;
      }
      if (selectedForces.some(function (c) { return c.id === card.id; })) return;

      var currentRunHorse = selectedHorse || field;
      var cost = currentRunHorse ? (currentRunHorse.cost || 2) : 2;

      selectedForces.push(card);
      // 手札から同期的に即座に除外して、素早い連続タップによる競合や2重処理を完全に防ぐ
      hand = hand.filter(function (c) { return c.id !== card.id; });
      farm.push(card);

      var farmElF = $('zone-farm');
      var farmRectF = farmElF ? farmElF.getBoundingClientRect() : null;
      if (el && farmRectF) {
        el.style.pointerEvents = 'none';
        el.classList.add('selected');
        flyGhost(el, farmRectF);
      }

      renderAll();
      Haptics.place();
      if (window.SoundFX && typeof SoundFX.deal === 'function') SoundFX.deal();

      if (selectedForces.length >= cost) {
        // コストを支払いました。：まずトーストをしっかり表示し、消去完了後に走破ポップアップ（サポート確認等）へ進む
        phase = 'cost_paid';
        updateCommandButtons();
        showToast('コストを支払いました。走破します', 1400);
        sleep(1400).then(function () {
          hideToast();
          executeRun();
        });
      } else {
        var remaining = cost - selectedForces.length;
        var horseName = (currentRunHorse && currentRunHorse.name) ? currentRunHorse.name : '馬カード';
        setNarrator('<b>' + horseName + '</b>のコスト分のフォースカードを捨ててください。（残り <b>' + remaining + '</b> 枚）');
        showToast('あと ' + remaining + ' 枚フォースカードを選んでください');
        updateCommandButtons();
      }
      return;
    }

    if (phase === 'select_item') {
      if (card.type !== 'item' && card.type !== 'jockey') { shakeCard(id); return; }
      if ((prevPhase === 'support_choice' || prevPhase === 'field_support') &&
        card.effectType !== 'run_bonus' && card.effectType !== 'run_penalty' && card.effectType !== 'elite_jockey') {
        shakeCard(id); return;
      }
      hand = hand.filter(function (c) { return c.id !== card.id; });
      farm.push(card);
      applyItemEffect(card);
      phase = prevPhase;
      selectedHorse = prevSelectedHorse;
      selectedForces = prevSelectedForces.slice();
      renderAll();
      if (phase === 'support_choice' || phase === 'field_support') {
        if (runSupportCards().length > 0) {
          offerRunSupport();
        } else if (pendingAfterField) {
          var fnPost = pendingAfterField;
          pendingAfterField = null;
          fnPost();
        }
      } else if (phase === 'select_force') {
        var need = (selectedHorse ? selectedHorse.cost || 2 : 2) - selectedForces.length;
        if (need > 0) setNarrator('あと ' + need + ' 枚のフォースを選んでください。');
        else executeRun();
      } else if (phase === 'idle') {
        setNarrator($('narrator-text').innerHTML + '<br>続けてどうぞ。');
      }
      return;
    }

    if (phase === 'select_item_idle') {
      var isEligibleIdle = card.type === 'item' &&
        card.effectType !== 'run_bonus' && card.effectType !== 'run_penalty';
      if (!isEligibleIdle) { shakeCard(id); return; }
      hand = hand.filter(function (c) { return c.id !== card.id; });
      farm.push(card);
      applyItemEffect(card);
      phase = 'idle';
      renderAll();
      return;
    }

    if (phase === 'select_situation') {
      if (card.type !== 'situation') { shakeCard(id); return; }
      activateSituationCard(card);
      return;
    }

    if (phase === 'idle') {
      if (card.type === 'situation') {
        activateSituationCard(card);
        return;
      }
      CardCloseup.show(card, { label: 'カード詳細' });
      return;
    }
  }

  function onDeckClick() {
    if (interactionMode === 'draw') {
      var resolve = actionResolve;
      interactionMode = null;
      actionResolve = null;
      $('zone-deck').classList.remove('tappable');
      setZoneActive('zone-deck', false);
      resolve && resolve();
      return;
    }
    if (interactionMode === 'freeplay') {
      cmdDraw();
    }
  }

  function drawFreeplayCard(count) {
    var totalToDraw = typeof count === 'number' ? count : (gameTurn === 1 ? 1 : 2);
    if (!currentLane() || isCpuTurn) return;

    var actualCount = Math.min(totalToDraw, totalDeck());
    if (actualCount <= 0) return;

    var chain = Promise.resolve();
    for (var i = 0; i < actualCount; i++) {
      (function (idx) {
        chain = chain.then(function () {
          if (!currentLane()) return Promise.resolve();
          var drawnLaneKey = currentLane().key;
          var deckRect = deckSourceRect();
          var handRect = $('hand-row').getBoundingClientRect();
          var dummy = makeDeckDummy(deckRect);
          return flyGhost(dummy, handRect).then(function () {
            dummy.remove();
            var drawnCard = getNextPlayerDrawCard();
            hand.push(drawnCard);
            drawOneFromDeck();
            lastDrawer = 'player';
            renderAll();
            SoundFX.deal();
            var stackEl = document.querySelector('.lane[data-lane="' + drawnLaneKey + '"] .lane-stack');
            if (stackEl) {
              stackEl.classList.add('pulse');
              setTimeout(function () { stackEl.classList.remove('pulse'); }, 340);
            }
            if (idx < actualCount - 1) {
              return sleep(220);
            }
          });
        });
      })(i);
    }

    chain.then(function () {
      checkVictory();
      setNarrator(actualCount + '枚引いたよ！');
      if (!victoryShown) checkHintsAvailable();
    });
  }

  var victoryShown = false;
  function showVictoryScreen(youWin) {
    var overlay = $('victory-overlay');
    if (!overlay) return;
    overlay.classList.toggle('lose', !youWin);
    $('victory-icon').innerHTML = youWin ? iconImg('crown', 'img-icon-lg') : iconImg('defeat', 'img-icon-lg');
    $('victory-title').textContent = youWin ? 'VICTORY' : 'DEFEAT';
    $('victory-subtitle').textContent = youWin ? 'あなたの勝ち' : '相手の勝ち';
    $('victory-message').textContent = youWin ?
      '山札が0枚になった！ 先に山札を引ききったあなたの勝利！' :
      '相手の山札が先に0枚になった…また挑戦しよう。';
    // 紙吹雪（勝利時のみ）
    var confettiWrap = $('victory-confetti');
    confettiWrap.innerHTML = '';
    if (youWin) {
      var colors = ['#e3b23c', '#f4e6b8', '#7fd396', '#7ea3d9', '#e08fa0'];
      for (var i = 0; i < 60; i++) {
        var piece = document.createElement('span');
        piece.style.left = (Math.random() * 100) + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
        piece.style.animationDelay = (Math.random() * 0.8) + 's';
        confettiWrap.appendChild(piece);
      }
    }
    overlay.classList.add('show');
    $('free-hint').hidden = true;
    showCommandBar(false);
  }
  $('victory-restart').addEventListener('click', function () { location.reload(); });

  function checkVictory() {
    if (victoryShown || !gameReady) return;
    var playerDeckCount = totalDeck();
    var cpuDeckCount = cpuTotalDeck();
    if (playerDeckCount <= 0) {
      victoryShown = true;
      showVictoryScreen(true);
      return;
    }
    if (cpuDeckCount <= 0) {
      victoryShown = true;
      showVictoryScreen(false);
      return;
    }
  }

  /* ===================== 状況カードの使用可能ヒント ===================== */
  // アイテムカードは「使いますか？」の自動ポップアップを廃止し、プレイヤーが
  // 自分の意志でコマンドメニューのアイテムから使うかどうかを判断する形にした
  function checkHintsAvailable() {
    return checkSituationAvailableHint();
  }

  function checkSituationAvailableHint() {
    if (isCpuTurn || phase !== 'idle') return false;
    var hasSituation = hand.some(function (c) { return c.type === 'situation'; });
    if (hasSituation) {
      showSituationHintPopup();
      return true;
    }
    return false;
  }

  function showSituationHintPopup() {
    hideToast();
    var popup = $('situation-hint-popup');
    if (!popup) return;
    popup.style.display = 'flex';

    var yesBtn = $('situation-hint-yes');
    var noBtn = $('situation-hint-no');
    var newYes = yesBtn.cloneNode(true);
    var newNo = noBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    noBtn.parentNode.replaceChild(newNo, noBtn);

    newYes.addEventListener('click', function () {
      popup.style.display = 'none';
      cmdSituation();
    });
    newNo.addEventListener('click', function () {
      popup.style.display = 'none';
    });
  }

  // プレイヤーが自分の意志でアイテムカードを使う（コマンドメニューのアイテムから呼ばれる）
  function cmdItemIdle() {
    if (isCpuTurn || phase !== 'idle' || canDraw) return;
    var hasItem = hand.some(function (c) {
      return c.type === 'item' && c.effectType !== 'run_bonus' && c.effectType !== 'run_penalty';
    });
    if (!hasItem) { setNarrator('今使えるアイテムカードが手札にありません。'); return; }
    prevPhase = phase;
    phase = 'select_item_idle';
    setNarrator('使う<b>アイテムカード</b>を選んでタップしてください。');
    renderAll();
  }

  /* ===================== 効果音（Web Audio SE） ===================== */
  var SoundFX = (function () {
    var ctx = null;
    function getCtx() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function playCardDeal() {
      var c = getCtx();
      if (!c) return;
      try {
        var t0 = c.currentTime;
        var jitter = (Math.random() - 0.5);

        // ① フリック音：指ではじくような鋭いスナップ（アタックを急峻に）
        var n1 = Math.floor(c.sampleRate * 0.03);
        var buf1 = c.createBuffer(1, n1, c.sampleRate);
        var d1 = buf1.getChannelData(0);
        for (var i = 0; i < n1; i++) {
          d1[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n1, 3);
        }
        var src1 = c.createBufferSource();
        src1.buffer = buf1;
        var bp1 = c.createBiquadFilter();
        bp1.type = 'bandpass';
        bp1.frequency.value = 2800 + jitter * 700;
        bp1.Q.value = 3.4;
        var g1 = c.createGain();
        g1.gain.setValueAtTime(0.26, t0);
        g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.028);
        src1.connect(bp1); bp1.connect(g1); g1.connect(c.destination);
        src1.start(t0);

        // ② エア音：カードが空を切って滑るシュッという音（周波数を下向きにスイープ）
        var dur2 = 0.085 + Math.random() * 0.02;
        var n2 = Math.floor(c.sampleRate * dur2);
        var buf2 = c.createBuffer(1, n2, c.sampleRate);
        var d2 = buf2.getChannelData(0);
        for (var j = 0; j < n2; j++) { d2[j] = Math.random() * 2 - 1; }
        var src2 = c.createBufferSource();
        src2.buffer = buf2;
        var bp2 = c.createBiquadFilter();
        bp2.type = 'bandpass';
        bp2.frequency.setValueAtTime(5200 + jitter * 400, t0);
        bp2.frequency.exponentialRampToValueAtTime(1300, t0 + dur2);
        bp2.Q.value = 1.1;
        var g2 = c.createGain();
        g2.gain.setValueAtTime(0.001, t0);
        g2.gain.exponentialRampToValueAtTime(0.09, t0 + 0.012);
        g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur2);
        src2.connect(bp2); bp2.connect(g2); g2.connect(c.destination);
        src2.start(t0);

        // ③ 着地の一瞬の重み（低音のコツンという響き）
        var osc = c.createOscillator();
        var g3 = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(115 + jitter * 12, t0 + 0.018);
        g3.gain.setValueAtTime(0.0001, t0 + 0.018);
        g3.gain.exponentialRampToValueAtTime(0.055, t0 + 0.026);
        g3.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
        osc.connect(g3); g3.connect(c.destination);
        osc.start(t0 + 0.018); osc.stop(t0 + 0.1);
      } catch (e) { }
    }
    function playShimmer() {
      var c = getCtx();
      if (!c) return;
      try {
        var freqs = [1046.5, 1318.5, 1567.98];
        freqs.forEach(function (f, idx) {
          var osc = c.createOscillator();
          var g = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, c.currentTime + idx * 0.04);
          g.gain.setValueAtTime(0.001, c.currentTime + idx * 0.04);
          g.gain.exponentialRampToValueAtTime(0.07, c.currentTime + idx * 0.04 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + idx * 0.04 + 0.16);
          osc.connect(g); g.connect(c.destination);
          osc.start(c.currentTime + idx * 0.04);
          osc.stop(c.currentTime + idx * 0.04 + 0.18);
        });
      } catch (e) { }
    }
    function playFanfareJingle() {
      var c = getCtx();
      if (!c) return;
      try {
        var chord = [523.25, 659.25, 783.99, 1046.5];
        chord.forEach(function (f, idx) {
          var osc = c.createOscillator();
          var g = c.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, c.currentTime + idx * 0.035);
          g.gain.setValueAtTime(0.001, c.currentTime + idx * 0.035);
          g.gain.exponentialRampToValueAtTime(0.1, c.currentTime + idx * 0.035 + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + idx * 0.035 + 0.28);
          osc.connect(g); g.connect(c.destination);
          osc.start(c.currentTime + idx * 0.035);
          osc.stop(c.currentTime + idx * 0.035 + 0.3);
        });
      } catch (e) { }
    }
    function playTurnChange() {
      var c = getCtx();
      if (!c) return;
      try {
        var t0 = c.currentTime;
        // 低音の重厚なインパクト
        var osc = c.createOscillator();
        var g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, t0);
        osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.32);
        g.gain.setValueAtTime(0.22, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38);
        osc.connect(g); g.connect(c.destination);
        osc.start(t0);
        osc.stop(t0 + 0.4);

        // 高音の光るシマー・スウィープ
        var freqs = [880, 1174.66, 1760];
        freqs.forEach(function (f, idx) {
          var sOsc = c.createOscillator();
          var sG = c.createGain();
          sOsc.type = 'sine';
          sOsc.frequency.setValueAtTime(f, t0 + idx * 0.03);
          sG.gain.setValueAtTime(0.001, t0 + idx * 0.03);
          sG.gain.exponentialRampToValueAtTime(0.08, t0 + idx * 0.03 + 0.01);
          sG.gain.exponentialRampToValueAtTime(0.0001, t0 + idx * 0.03 + 0.22);
          sOsc.connect(sG); sG.connect(c.destination);
          sOsc.start(t0 + idx * 0.03);
          sOsc.stop(t0 + idx * 0.03 + 0.25);
        });
      } catch (e) { }
    }
    return {
      deal: playCardDeal,
      shimmer: playShimmer,
      fanfare: playFanfareJingle,
      turnChange: playTurnChange
    };
  })();
  window.SoundFX = SoundFX;

  /* ===================== 初期カード配布演出 ===================== */
  async function dealInitialCards(isManual, runId) {
    var laneCountPerZone = 8;
    var totalCards = 40; // 40枚デッキ（山札各8枚:32枚 + ファーム1枚 + 手札7枚）
    // 画面中央にデッキスタックを生成
    var centerEl = document.createElement('div');
    centerEl.className = 'deal-center-deck';
    centerEl.innerHTML =
      '<div class="deal-deck-stack">' +
      '<div class="deal-deck-back"></div>' +
      '<div class="deal-deck-badge" id="deal-deck-count">' + totalCards + '</div>' +
      '<div class="deal-deck-label">DECK (' + totalCards + '枚)</div>' +
      '</div>';
    document.body.appendChild(centerEl);

    var countBadge = centerEl.querySelector('#deal-deck-count');
    var currentCount = totalCards;

    function updateDeckCount(val) {
      currentCount = val;
      if (countBadge) {
        countBadge.textContent = String(val);
        countBadge.style.animation = 'none';
        void countBadge.offsetHeight;
        countBadge.style.animation = 'badgePop .2s cubic-bezier(.34,1.56,.64,1)';
      }
    }

    function flyDealGhost(destRect, speedMs, card) {
      var duration = speedMs || 240;
      var cRect = centerEl.getBoundingClientRect();
      var ghost = document.createElement('div');
      ghost.className = 'deal-ghost-fast';
      ghost.style.left = cRect.left + 'px';
      ghost.style.top = cRect.top + 'px';
      ghost.style.width = cRect.width + 'px';
      ghost.style.height = cRect.height + 'px';
      if (card) {
        // 手札に来るカードは、裏面ではなく実際のカード面を飛ばす
        ghost.classList.add('deal-ghost-face');
        if (card.img) {
          ghost.classList.add('has-img');
          ghost.style.backgroundImage = 'url(' + card.img + ')';
        } else {
          ghost.style.backgroundImage = 'none';
          ghost.textContent = card.icon || '';
        }
      }
      document.body.appendChild(ghost);

      return new Promise(function (resolve) {
        requestAnimationFrame(function () {
          var dx = (destRect.left + destRect.width / 2) - (cRect.left + cRect.width / 2);
          var dy = (destRect.top + destRect.height / 2) - (cRect.top + cRect.height / 2);
          var scale = Math.max(0.4, Math.min(destRect.width / cRect.width, 1));
          ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';
          ghost.style.opacity = '0.85';
        });
        setTimeout(function () {
          ghost.remove();
          resolve();
        }, duration);
      });
    }

    await sleep(300);
    if (runId && runId !== tutorialRunId) { centerEl.remove(); return; }

    // ① 4つの距離エリア（各8枚）へ配る
    if (!isManual) {
      setNarrator('40枚のデッキから、まずは<b>各8枚（計32枚）</b>を4つの距離エリア（山札）に配るよ。');
    }
    var laneKeys = ['nige', 'senko', 'sashi', 'oikomi'];
    for (var li = 0; li < laneKeys.length; li++) {
      if (runId && runId !== tutorialRunId) { centerEl.remove(); return; }
      var lKey = laneKeys[li];
      var laneObj = LANES.find(function (l) { return l.key === lKey; });
      var laneEl = document.querySelector('.lane[data-lane="' + lKey + '"]');
      var laneRect = laneEl ? laneEl.getBoundingClientRect() : $('lanes').getBoundingClientRect();

      // 各レーンへテンポよくカードが飛ぶ
      for (var step = 0; step < 2; step++) {
        flyDealGhost(laneRect, isManual ? 140 : 180);
        await sleep(isManual ? 40 : 80);
      }
      laneObj.count = laneCountPerZone;
      updateDeckCount(currentCount - laneCountPerZone);
      renderDeckLanes();
      if (laneEl) {
        laneEl.classList.add('deal-flash');
        setTimeout(function (el) { if (el) el.classList.remove('deal-flash'); }, 350, laneEl);
      }
      Haptics.place();
      await sleep(isManual ? 80 : 180);
    }

    await sleep(isManual ? 180 : 350);
    if (runId && runId !== tutorialRunId) { centerEl.remove(); return; }

    // ② 残り8枚のうち1枚をファームへ配る
    if (!isManual) {
      setNarrator('残り8枚のうち、<b>1枚はファーム</b>に置かれるよ。');
    }
    var farmZone = $('zone-farm');
    var farmRect = farmZone.getBoundingClientRect();
    var starterFarm = [kutsuwa()];
    for (var fi = 0; fi < starterFarm.length; fi++) {
      if (runId && runId !== tutorialRunId) { centerEl.remove(); return; }
      await flyDealGhost(farmRect, 220);
      farm.push(starterFarm[fi]);
      updateDeckCount(currentCount - 1);
      renderFarm();
      if (farmZone) {
        farmZone.classList.add('deal-flash');
        setTimeout(function (el) { if (el) el.classList.remove('deal-flash'); }, 300, farmZone);
      }
      Haptics.place();
      await sleep(isManual ? 90 : 150);
    }

    await sleep(isManual ? 180 : 350);
    if (runId && runId !== tutorialRunId) { centerEl.remove(); return; }

    // ③ 最後の7枚を手札へ配る
    if (!isManual) {
      setNarrator('そして最後の<b>7枚が手札</b>に来るよ！');
    }
    var handZone = $('hand-row');
    var handRect = handZone.getBoundingClientRect();
    var starterHand = [
      forceCard(),
      forceCard(),
      forceCard(),
      goldShip(),
      rousham(),
      seferRasiel(),
      whip()
    ];

    for (var hi = 0; hi < starterHand.length; hi++) {
      if (runId && runId !== tutorialRunId) { centerEl.remove(); return; }
      await flyDealGhost(handRect, 220, starterHand[hi]);
      hand.push(starterHand[hi]);
      updateDeckCount(currentCount - 1);
      renderHand();
      Haptics.place();
      await sleep(isManual ? 80 : 120);
    }

    if (handZone) {
      handZone.classList.add('deal-flash');
      setTimeout(function (el) { if (el) el.classList.remove('deal-flash'); }, 400, handZone);
    }

    centerEl.classList.add('hide');
    setTimeout(function () { centerEl.remove(); }, 350);
    await sleep(350);
  }

  function rewardDraw(n) {
    var chain = Promise.resolve();
    for (var i = 0; i < n; i++) {
      (function (i) {
        chain = chain.then(function () {
          var deckRect = deckSourceRect();
          var handRect = $('hand-row').getBoundingClientRect();
          var dummy = makeDeckDummy(deckRect);
          return flyGhost(dummy, handRect).then(function () {
            dummy.remove();
            hand.push(getNextPlayerDrawCard());
            drawOneFromDeck();
            renderAll();
            SoundFX.deal();
            return sleep(160);
          });
        });
      })(i);
    }
    return chain;
  }


  function findHandCardClosestToCenter(matcher) {
    var matches = [];
    var centerIdx = (hand.length - 1) / 2;
    for (var i = 0; i < hand.length; i++) {
      var c = hand[i];
      var ok = typeof matcher === 'function' ? matcher(c) : (c.type === matcher);
      if (ok) {
        matches.push({ card: c, dist: Math.abs(i - centerIdx) });
      }
    }
    if (!matches.length) return null;
    matches.sort(function (a, b) { return a.dist - b.dist; });
    return matches[0].card;
  }

  function scrollHandCardToCenter(el) {
    var row = $('hand-row');
    if (!row || !el) return;
    var rowRect = row.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    var offset = (elRect.left + elRect.width / 2) - (rowRect.left + rowRect.width / 2);
    row.scrollBy({ left: offset, behavior: 'smooth' });
  }

  /* ===================== main tutorial flow ===================== */
  var tutorialRunId = 0;

  async function runTutorial() {
    var myRunId = ++tutorialRunId;
    cardExplainHide();
    document.body.classList.remove('manual-mode');
    var modeOpts = document.querySelectorAll('#mode-switch .mode-opt');
    modeOpts.forEach(function (opt) {
      opt.classList.toggle('active', opt.dataset.mode === 'tutorial');
    });
    showCommandBar(false); // チュートリアル中は循環矢印（コマンドバー）を非表示
    $('narrator').style.display = '';

    // 初期状態をクリア
    gameReady = false;
    victoryShown = false;
    LANES.forEach(function (l) { l.count = 0; });
    CPU_LANES.forEach(function (l) { l.count = 8; }); // 相手は最初から自分の山札（各8枚）を持っている
    farm = [];
    oppFarm = [];
    hand = [];
    cpuHand = [];
    opponentHandCount = 0;
    field = null;
    fieldGuard = null;
    cpuHorseCard = null;
    situation = null;
    gameTurn = 1;
    cpuConsecutiveGuardCount = 0;
    resetPlayerDeck(true);
    renderAll();

    setNarrator('ようこそ、<b>フォース オブ ザ ホース</b>の世界へ！');
    setProgress(0);
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    setNarrator('40枚のカードデッキを使って対戦するよ。まずは対戦の準備をしよう！');
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    // STEP 0: 40枚デッキからの初期カード配布
    setProgress(1);
    showNextButton(false);
    await dealInitialCards(false, myRunId);
    if (myRunId !== tutorialRunId) return;
    gameReady = true;
    setNarrator('手札（7枚）・ファーム（1枚）・山札（各8枚）が揃ったね！ それぞれのカードの役割を見ていこう。');
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    // STEP 1: フォースカード（中央に近いカードを紹介して見やすくする）
    setProgress(2);
    var targetForce = findHandCardClosestToCenter('force');
    var forceEl = targetForce ? cardElById(targetForce.id) : null;
    if (forceEl) scrollHandCardToCenter(forceEl);
    if (targetForce) cardExplainShow(targetForce);
    await explainStep(forceEl, null, 'このカードが<b>フォースカード</b>だ！ お気に入りの馬を走破させるとき、コストとして使うんだ。');
    cardExplainHide();
    if (myRunId !== tutorialRunId) return;

    // STEP 2: 馬カード（中央に近いカードを紹介）
    setProgress(3);
    var targetHorse = findHandCardClosestToCenter('horse');
    var horseEl = targetHorse ? cardElById(targetHorse.id) : null;
    if (horseEl) scrollHandCardToCenter(horseEl);
    // 馬カードを画面に大きく出して、各部の見方を順番に解説する
    if (targetHorse) cardExplainShow(targetHorse);
    await explainStep(horseEl, null, 'このカードが<b>馬カード</b>だ！ このカードを使って相手と勝負するよ。');
    if (myRunId !== tutorialRunId) { cardExplainHide(); return; }

    cardExplainRing('ring-cost');
    await explainStep(null, null, '馬の左上に書かれているのが<b>カードのコスト</b>だ。<br>馬を走らせるには、この数値分の<b>フォースカード</b>が必要なんだ。');
    if (myRunId !== tutorialRunId) { cardExplainHide(); return; }

    cardExplainRing('ring-stats');
    await explainStep(null, null, 'そして下に書かれている<b>走破数</b>と<b>ガード値</b>を使って対戦するんだ。');
    cardExplainHide();
    if (myRunId !== tutorialRunId) return;

    // STEP 3: アイテムカード（中央に近いカードを紹介）
    setProgress(4);
    var targetItem = findHandCardClosestToCenter(function (c) { return c.type === 'item' || c.type === 'jockey'; });
    var itemEl = targetItem ? cardElById(targetItem.id) : null;
    if (itemEl) scrollHandCardToCenter(itemEl);
    if (targetItem) cardExplainShow(targetItem);
    await explainStep(itemEl, null, '次はアイテムカードを紹介するよ。<b>アイテムカード</b>は走破のタイミングで、自分と相手が交互に好きな枚数だけ使える、競走馬をサポートするカードなんだ。');
    cardExplainHide();
    if (myRunId !== tutorialRunId) return;

    // STEP 4: ファーム
    setProgress(5);
    await explainStep($('zone-farm'), 'zone-farm', 'ここが<b>ファーム</b>だ。使い終わったカードを置く場所だよ。');
    if (myRunId !== tutorialRunId) return;

    // STEP 5: 相手のファーム
    setProgress(6);
    await explainStep($('zone-opp-farm'), 'zone-opp-farm', 'ここが<b>相手のファーム</b>だ。相手が使い終わったカードや捨て札が置かれる場所だよ。');
    if (myRunId !== tutorialRunId) return;

    // STEP 6: 距離エリア(山札) / 勝利条件（メッセージを2つに分割）
    setProgress(7);
    await explainStep($('zone-deck'), 'zone-deck', 'ここが<b>距離エリア（山札）</b>だ。山札は「逃げ」「先行」「差し」「追込」の4つのエリアに各8枚ずつ配られているよ。');
    if (myRunId !== tutorialRunId) return;

    setNarrator('<b>逃げから順番に</b>引いていき、先行、差し、追込と4つの山札を<b>先にすべて引ききったプレイヤーの勝ち</b>だよ！');
    showNextButton(true);
    await waitNext();
    hideArrow();
    if (myRunId !== tutorialRunId) return;

    // STEP 7: 実際に走破してみよう（ポップアップは削除し、自然に進行）
    setProgress(8);
    setNarrator('それじゃあ、<b>実際に走破してみよう！</b>');
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    // STEP 8: 走破させたい馬カードを選んでフィールドに出す
    setProgress(9);
    setNarrator('まずは<b>走破させたい馬カード</b>を選んでタップしてね。対戦フィールドに出すよ。');
    setZoneActive('field-body', true);
    showNextButton(false);
    await waitSelect('select-horse', 1);
    setZoneActive('field-body', false);
    if (myRunId !== tutorialRunId) return;

    // STEP 9: 選んだ馬に必要なフォースカードをファームへ送る（馬カードを大きく表示＋コスト数をハイライト）
    setProgress(10);
    var targetFieldCard = field || targetHorse || goldShip();
    var runHorseCost = targetFieldCard ? (targetFieldCard.cost || 2) : 2;
    var horseName = targetFieldCard ? targetFieldCard.name : 'この馬';

    // 馬カードを大きく表示し、左上のコスト数をハイライト
    cardExplainShow(targetFieldCard);
    cardExplainRing('ring-cost');
    setNarrator('<b>' + horseName + '</b>を走破させるコストとして、<b>フォースカードを' + runHorseCost + '枚</b>選んで、手札からファームに送ろう。');
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) { cardExplainHide(); return; }

    // カード解説を閉じて手札を選択させる
    cardExplainHide();
    setNarrator('手札から<b>フォースカードを' + runHorseCost + '枚</b>選んで、ファームに送ろう。カードをタップしてね。');
    setZoneActive('zone-farm', true);
    showNextButton(false);
    await waitSelect('select-force', runHorseCost);
    setZoneActive('zone-farm', false);
    if (myRunId !== tutorialRunId) return;

    // STEP 10: 相手のガード確認
    setProgress(11);
    setNarrator('<b>フォースカードをコストとして支払った</b>ので、馬を<b>走破させられる</b>よ。');
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;
    setNarrator('ここで相手にこの馬の<b>走破</b>（このカードゲームでの走破は他のカードゲームで言う<b>攻撃</b>に近いかな。）を<b>ガード</b>するか確認しよう');
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;
    setNarrator('相手：「<b>ガードしません</b>」');
    await showOpponentBubble('ガードしません', 2500);
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    // STEP 11: 走破成功 → 報酬ドロー（馬カードを大きく表示＋走破数をハイライト）
    setProgress(12);
    var runCard = field || targetHorse || goldShip();
    var runCount = runCard ? (runCard.run || 3) : 3;
    setNarrator('やった、<b>走破成功だ！</b> 走破に成功したら、馬カードの走破数ぶんだけ山札からカードを引くよ。');
    await showBanner('走破成功！', 2600, runCard, '走破に成功しました<br>馬の走破数 ' + runCount);
    if (myRunId !== tutorialRunId) return;

    // 馬カードを大きく表示し、走破数部分をハイライト
    cardExplainShow(runCard);
    cardExplainRing('ring-run');

    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) { cardExplainHide(); return; }

    setNarrator('走破数は <b>' + runCount + '</b>。山札から ' + runCount + ' 枚引くよ。');
    cardExplainHide();
    hideArrow();
    await rewardDraw(runCount);
    if (myRunId !== tutorialRunId) return;
    setNarrator('走破成功後の手札調整として、引いた枚数マイナス1枚、つまり <b>' + (runCount - 1) + '枚</b> をファームに捨てよう。カードをタップしてね。');
    showNextButton(false);
    setZoneActive('zone-farm', true);
    await waitSelect('select-any', runCount - 1);
    setZoneActive('zone-farm', false);
    if (myRunId !== tutorialRunId) return;

    // STEP 13: 走破後の馬のルール
    setProgress(14);
    setNarrator('走破に成功した馬カードは、そのまま<b>フィールドに残る</b>よ！ 次のターンもフォースを払えば同じ馬で走破できるし、手札の別の馬と入れ替えて走破することもできるんだ。');
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    setNarrator('ただし、相手に<b>走破数と同じかそれ以上のガード値</b>で守られた場合は、走破馬がファームに送られてしまうから覚えておこう！');
    showNextButton(true);
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    // STEP 14: 繰り返しメッセージ
    setProgress(15);
    setNarrator('これを交互に繰り返して、カードを全て山札から引ききったら勝ちなんだ。');
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    // STEP 15: 自由プレイへ
    setProgress(16);
    setNarrator('次は実際に自分でカードを使ってみよう。ここから先は自由に操作できるよ！');
    await waitNext();
    if (myRunId !== tutorialRunId) return;

    startFreePlay();
  }

  function startFreePlay() {
    interactionMode = 'freeplay';
    hideArrow();
    clearZoneActive();
    $('zone-deck').classList.add('tappable');
    $('narrator').style.display = 'none';
    document.body.classList.add('manual-mode');
    var modeOpts = document.querySelectorAll('#mode-switch .mode-opt');
    modeOpts.forEach(function (opt) {
      opt.classList.toggle('active', opt.dataset.mode === 'manual');
    });
    if (typeof window._setTilt === 'function') {
      window._setTilt(0);
    }
    $('step-label').textContent = '自分で操作';
    phase = 'idle';
    selectedHorse = null;
    selectedForces = [];
    runBonus = 0;
    itemGuardBonus = 0;
    cpuRunBonus = 0;
    cpuItemGuardBonus = 0;
    cpuConsecutiveGuardCount = 0;
    canDraw = true;
    isCpuTurn = false;
    hasRunThisTurn = false;
    gameTurn = 1; // 先攻1ターン目
    // 相手（CPU）の初期手札とデッキを既存カード画像から初期化
    initCpuHandAndDeck();
    cpuHorseCard = null;
    if (cpuTotalDeck() <= 0) CPU_LANES.forEach(function (l) { l.count = 8; });
    renderRaceInfo();
    showNextButton(false);
    $('free-hint').hidden = true;
    showCommandBar(true); // 自分で操作する段階になったらコマンドバーを表示
    renderAll();
    resetPlayerDeck(false);
    cmdDraw(); // 先攻1ターン目：1枚ドロー
  }

  /* ===================== 自分で操作（ナレーターなし・完全手動プレイモード） ===================== */
  async function startManualMode() {
    cardExplainHide();
    var myRunId = ++tutorialRunId; // 進行中の処理を中断し新しいIDを発行
    interactionMode = 'freeplay';
    if (typeof window._setTilt === 'function') {
      window._setTilt(0);
    }
    hideArrow();
    clearZoneActive();
    $('zone-deck').classList.remove('tappable');
    $('narrator').style.display = 'none';
    document.body.classList.add('manual-mode');
    var modeOpts = document.querySelectorAll('#mode-switch .mode-opt');
    modeOpts.forEach(function (opt) {
      opt.classList.toggle('active', opt.dataset.mode === 'manual');
    });
    showCommandBar(false); // 配布中はコマンドバーを一旦隠す

    // 盤面を一旦初期化（カードを空にしてから配り始める）
    gameReady = false;
    victoryShown = false;
    LANES.forEach(function (l) { l.count = 0; });
    CPU_LANES.forEach(function (l) { l.count = 8; });
    farm = [];
    oppFarm = [];
    hand = [];
    initCpuHandAndDeck();
    field = null;
    fieldGuard = null;
    cpuHorseCard = null;
    situation = null;

    phase = 'idle';
    selectedHorse = null;
    selectedForces = [];
    runBonus = 0;
    itemGuardBonus = 0;
    cpuRunBonus = 0;
    cpuItemGuardBonus = 0;
    canDraw = false;
    isCpuTurn = false;
    hasRunThisTurn = false;
    gameTurn = 1; // 先攻1ターン目

    setProgress(16);
    $('step-label').textContent = '自分で操作';
    renderRaceInfo();
    renderAll();

    // 40枚デッキ配布演出を実行（テンポよく山札・ファーム・手札へ配布）
    await dealInitialCards(true, myRunId);
    if (myRunId !== tutorialRunId) return;
    gameReady = true;

    // 配布完了後に手動プレイ開始
    $('zone-deck').classList.add('tappable');
    canDraw = true;
    showCommandBar(true);
    renderAll();
    resetPlayerDeck(false);
    cmdDraw(); // 先攻1ターン目：1枚ドロー
  }

  function startTutorialMode() {
    tutorialRunId++;
    document.body.classList.remove('manual-mode');
    if (typeof window._setTilt === 'function') {
      window._setTilt(10);
    }
    var modeOpts = document.querySelectorAll('#mode-switch .mode-opt');
    modeOpts.forEach(function (opt) {
      opt.classList.toggle('active', opt.dataset.mode === 'tutorial');
    });
    $('narrator').style.display = '';
    showCommandBar(false);
    runTutorial();
  }

  /* ===================== BGM（音源ファイル再生 / シームレスループ / トラック選択） ===================== */
  var BGM_TRACKS = {
    'system_overdrive': { name: 'System Overdrive 2', src: 'System_Overdrive-2.mp3?v=1' },
    'banners_opt': { name: 'Banners in the Gale (Opt 2分オーケストラArr.)', src: 'audio/bgm_banners_gale_opt.wav?v=4' },
    'grandprix': { name: 'Grand Prix Royale (栄光)', src: 'audio/bgm_grand_prix.wav?v=3' }
  };

  var currentBgmTrackKey = 'system_overdrive';
  try {
    var savedTrack = localStorage.getItem('foth_bgm_track');
    if (savedTrack === 'banners') savedTrack = 'banners_opt';
    if (savedTrack && BGM_TRACKS[savedTrack]) {
      currentBgmTrackKey = savedTrack;
    } else {
      currentBgmTrackKey = 'system_overdrive';
    }
  } catch (e) { }

  var BGM = (function () {
    var TARGET_VOLUME = 0.40;
    var FADE_IN_MS = 1000;
    var FADE_OUT_MS = 500;

    var audioCtx = null;
    var gainNode = null;
    var sourceNode = null;
    var buffers = {}; // trackKey -> audioBuffer cache
    var isPlaying = false;
    var fallbackAudio = null;

    function getAudioContext() {
      if (!audioCtx) {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          gainNode = audioCtx.createGain();
          gainNode.gain.value = 0;
          gainNode.connect(audioCtx.destination);
        }
      }
      return audioCtx;
    }

    function loadBuffer(trackKey) {
      trackKey = trackKey || currentBgmTrackKey;
      if (buffers[trackKey]) return Promise.resolve(buffers[trackKey]);
      var trackInfo = BGM_TRACKS[trackKey] || BGM_TRACKS['system_overdrive'];
      var ctx = getAudioContext();
      if (!ctx) return Promise.resolve(null);
      return fetch(trackInfo.src)
        .then(function (res) { return res.arrayBuffer(); })
        .then(function (arrBuf) { return ctx.decodeAudioData(arrBuf); })
        .then(function (decoded) {
          buffers[trackKey] = decoded;
          return decoded;
        })
        .catch(function () { return null; });
    }

    // Preload current track buffer
    try { loadBuffer(currentBgmTrackKey); } catch (e) {}

    function start(trackKey) {
      if (trackKey) currentBgmTrackKey = trackKey;
      isPlaying = true;
      var ctx = getAudioContext();
      var activeTrack = currentBgmTrackKey;
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(function () {});
        }
        loadBuffer(activeTrack).then(function (buf) {
          if (!isPlaying || currentBgmTrackKey !== activeTrack) return;
          if (buf) {
            if (sourceNode) {
              try { sourceNode.stop(); sourceNode.disconnect(); } catch (e) {}
            }
            sourceNode = ctx.createBufferSource();
            sourceNode.buffer = buf;
            sourceNode.loop = true; // Web Audio API による完全シームレス（隙間ゼロ）ループ
            sourceNode.connect(gainNode);
            sourceNode.start(0);

            var now = ctx.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(TARGET_VOLUME, now + FADE_IN_MS / 1000);
          } else {
            startFallback(activeTrack);
          }
        });
      } else {
        startFallback(activeTrack);
      }
    }

    function startFallback(trackKey) {
      var trackInfo = BGM_TRACKS[trackKey] || BGM_TRACKS['system_overdrive'];
      if (fallbackAudio) {
        fallbackAudio.pause();
        fallbackAudio = null;
      }
      fallbackAudio = new Audio(trackInfo.src);
      fallbackAudio.loop = true;
      fallbackAudio.preload = 'auto';
      fallbackAudio.volume = TARGET_VOLUME;
      var p = fallbackAudio.play();
      if (p && p.catch) p.catch(function () {});
    }

    function stop() {
      isPlaying = false;
      var ctx = getAudioContext();
      if (ctx && gainNode && sourceNode) {
        var now = ctx.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + FADE_OUT_MS / 1000);
        setTimeout(function () {
          if (!isPlaying && sourceNode) {
            try { sourceNode.stop(); sourceNode.disconnect(); sourceNode = null; } catch (e) {}
          }
        }, FADE_OUT_MS + 60);
      }
      if (fallbackAudio) {
        fallbackAudio.pause();
      }
    }

    function setTrack(trackKey) {
      if (!BGM_TRACKS[trackKey]) return;
      currentBgmTrackKey = trackKey;
      try { localStorage.setItem('foth_bgm_track', trackKey); } catch (e) {}
      updateBgmTrackButtons();
      if (isPlaying && bgmEnabled) {
        start(trackKey);
      }
    }

    return {
      start: start,
      stop: stop,
      setTrack: setTrack,
      getCurrentTrack: function () { return currentBgmTrackKey; }
    };
  })();

  var bgmEnabled = true;
  try {
    var savedBgm = localStorage.getItem('foth_bgm_enabled');
    if (savedBgm !== null) bgmEnabled = savedBgm === '1';
  } catch (e) { }

  function updateBgmButton() {
    var btn = $('bgm-toggle');
    if (!btn) return;
    btn.innerHTML = bgmEnabled
      ? (iconImg('sound-on', 'img-icon-inline') + 'BGM (ON)')
      : (iconImg('sound-off', 'img-icon-inline') + 'BGM (OFF)');
    btn.classList.toggle('is-off', !bgmEnabled);
  }
  updateBgmButton();

  function updateBgmTrackButtons() {
    var opts = document.querySelectorAll('#bgm-track-select .bgm-track-opt');
    opts.forEach(function (opt) {
      opt.classList.toggle('active', opt.dataset.track === currentBgmTrackKey);
    });
  }
  updateBgmTrackButtons();

  if ($('bgm-toggle')) {
    $('bgm-toggle').addEventListener('click', function () {
      Haptics.tap();
      bgmEnabled = !bgmEnabled;
      try { localStorage.setItem('foth_bgm_enabled', bgmEnabled ? '1' : '0'); } catch (e) { }
      updateBgmButton();
      if (bgmEnabled) BGM.start(); else BGM.stop();
    });
  }

  // BGM 楽曲選択ボタン
  var trackOpts = document.querySelectorAll('#bgm-track-select .bgm-track-opt');
  trackOpts.forEach(function (btn) {
    btn.addEventListener('click', function () {
      Haptics.tap();
      var tKey = this.dataset.track;
      if (tKey) {
        BGM.setTrack(tKey);
        if (!bgmEnabled) {
          bgmEnabled = true;
          try { localStorage.setItem('foth_bgm_enabled', '1'); } catch (e) {}
          updateBgmButton();
          BGM.start(tKey);
        }
        var info = BGM_TRACKS[tKey];
        showToast('BGM変更: ' + (info ? info.name : tKey), 'info', 2200);
      }
    });
  });

  // ブラウザの自動再生制限のため、最初のユーザー操作をきっかけに再生を開始する
  document.addEventListener('click', function initBgmOnFirstTap() {
    if (bgmEnabled) BGM.start();
    document.removeEventListener('click', initBgmOnFirstTap);
  }, { once: true });

  /* ===================== events ===================== */
  var suppressNextHandClick = false;
  var lastHandCardTapTime = 0;
  var handTouchTapId = null;
  var handTouchStartX = 0;
  var handTouchStartY = 0;
  var handTouchStartTime = 0;

  var handRowEl = $('hand-row');
  if (handRowEl) {
    // スマホでの1回タップを最速・確実に拾うタッチリスナー（ブラウザの合成click遅延・微小ブレによるclick消失を完全回避）
    handRowEl.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { handTouchTapId = null; return; }
      var touch = e.touches[0];
      var cardEl = touch.target && touch.target.closest ? touch.target.closest('.card') : null;
      if (!cardEl) { handTouchTapId = null; return; }
      handTouchTapId = cardEl.dataset.id;
      handTouchStartX = touch.clientX;
      handTouchStartY = touch.clientY;
      handTouchStartTime = Date.now();
    }, { passive: true });

    handRowEl.addEventListener('touchend', function (e) {
      if (!handTouchTapId) return;
      var touch = e.changedTouches && e.changedTouches[0];
      if (!touch) { handTouchTapId = null; return; }
      var dx = Math.abs(touch.clientX - handTouchStartX);
      var dy = Math.abs(touch.clientY - handTouchStartY);
      var dt = Date.now() - handTouchStartTime;
      var targetId = handTouchTapId;
      handTouchTapId = null;

      // 短時間の指離し（300ms以内）かつ指の移動が14px以内で、長押し拡大が発動していない場合のみシングルタップとして実行
      if (dx < 14 && dy < 14 && dt < 320 && !suppressNextHandClick) {
        lastHandCardTapTime = Date.now();
        onHandCardClick(targetId);
      }
    }, { passive: true });

    handRowEl.addEventListener('touchcancel', function () {
      handTouchTapId = null;
    }, { passive: true });

    handRowEl.addEventListener('click', function (e) {
      // 直前のtouchstart/touchendで処理済みの場合は重複呼び出しをスキップ
      if (Date.now() - lastHandCardTapTime < 500) {
        suppressNextHandClick = false;
        return;
      }
      var el = e.target.closest ? e.target.closest('.card') : null;
      if (!el) return;
      if (suppressNextHandClick) { suppressNextHandClick = false; return; }
      onHandCardClick(el.dataset.id);
    });
  }

  // カード詳細拡大表示（スマホ長押し＆PC右クリック）
  (function setupCardInspection() {
    var pressTimer = null;
    var pressedTarget = null;
    var touchStartX = 0, touchStartY = 0;
    var LONG_PRESS_MS = 320; // スマホでの快適な長押し判定時間（約0.32秒）

    function getCardFromEvent(target) {
      if (!target || !target.closest) return null;
      // 1. 手札カード
      var handCardEl = target.closest('#hand-row .card, .hand-fan-container .card, #zone-hand .card');
      if (handCardEl) {
        var hCard = hand.find(function (c) { return c.id === handCardEl.dataset.id; });
        return hCard ? { card: hCard, label: '手札カード詳細' } : null;
      }
      // 2. 対戦フィールドの馬カード
      var fieldEl = target.closest('#zone-field, #field-body');
      if (fieldEl && field) {
        return { card: field, label: '対戦フィールド' };
      }
      // 2-2. 相手フィールドの馬／ガード馬カード
      var oppFieldEl = target.closest('#field-body-opp, #zone-opponent .field-body-opp, #zone-opponent');
      if (oppFieldEl) {
        var oppCard = fieldGuard || cpuHorseCard;
        if (oppCard) return { card: oppCard, label: fieldGuard ? '相手ガード馬' : '相手フィールドの馬' };
      }
      // 3. 自分のファームのカード
      var farmEl = target.closest('#zone-farm');
      if (farmEl && farm.length > 0) {
        return { card: farm[farm.length - 1], label: '自分のファーム（最新カード）' };
      }
      // 3-2. 相手のファームのカード
      var oppFarmEl = target.closest('#zone-opp-farm');
      if (oppFarmEl && oppFarm.length > 0) {
        return { card: oppFarm[oppFarm.length - 1], label: '相手のファーム（最新カード）' };
      }
      // 4. 状況カード（確認ボタンまたは枠全体）
      var sitEl = target.closest('#zone-situation, .field-situation-box, .field-situation-check-btn');
      if (sitEl && situation) {
        return { card: situation, label: '状況カード' };
      }
      // 5. モーダル内カード（ファーム確認、手札確認）
      var modalItemEl = target.closest('.farm-card-item');
      if (modalItemEl && modalItemEl.dataset.id) {
        var cardId = modalItemEl.dataset.id;
        var foundM = hand.find(function (c) { return c.id === cardId; }) ||
                     farm.find(function (c) { return c.id === cardId; }) ||
                     oppFarm.find(function (c) { return c.id === cardId; });
        if (foundM) return { card: foundM, label: 'カード詳細' };
      }
      // 6. 一般の .card 要素（データ属性 data-id を持つもの）
      var genCardEl = target.closest('.card');
      if (genCardEl && genCardEl.dataset.id) {
        var gId = genCardEl.dataset.id;
        var foundG = hand.find(function (c) { return c.id === gId; }) ||
                     (field && field.id === gId ? field : null) ||
                     (fieldGuard && fieldGuard.id === gId ? fieldGuard : null) ||
                     (cpuHorseCard && cpuHorseCard.id === gId ? cpuHorseCard : null) ||
                     (situation && situation.id === gId ? situation : null) ||
                     farm.find(function (c) { return c.id === gId; }) ||
                     oppFarm.find(function (c) { return c.id === gId; });
        if (foundG) return { card: foundG, label: 'カード詳細' };
      }
      return null;
    }

    // --- PC用：右クリック（contextmenu）による即時拡大プレビュー ---
    document.addEventListener('contextmenu', function (e) {
      // closeup-layerが開いている時は右クリックでも閉じる
      var layer = $('closeup-layer');
      if (layer && layer.classList.contains('show')) {
        e.preventDefault();
        CardCloseup.hide();
        return;
      }
      var info = getCardFromEvent(e.target);
      if (info && info.card) {
        e.preventDefault();
        Haptics.tap();
        CardCloseup.show(info.card, { label: info.label });
      }
    });

    // --- スマホ用：長押し（touchstart / touchend / touchmove） ---
    function onTouchStart(e) {
      if (e.touches && e.touches.length !== 1) return;
      var touch = e.touches ? e.touches[0] : null;
      if (!touch) return;
      var info = getCardFromEvent(e.target);
      if (!info || !info.card) return;

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      pressedTarget = info;

      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        if (pressedTarget && pressedTarget.card) {
          suppressNextHandClick = true;
          try { Haptics.tap(); } catch (err) {}
          CardCloseup.show(pressedTarget.card, { label: pressedTarget.label });
        }
        pressTimer = null;
      }, LONG_PRESS_MS);
    }

    function onTouchMove(e) {
      if (!pressTimer) return;
      var touch = e.touches ? e.touches[0] : null;
      if (!touch) return;
      var dx = Math.abs(touch.clientX - touchStartX);
      var dy = Math.abs(touch.clientY - touchStartY);
      if (dx > 12 || dy > 12) {
        clearTimeout(pressTimer);
        pressTimer = null;
        pressedTarget = null;
      }
    }

    function onTouchEnd() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      pressedTarget = null;
    }

    // --- PC用：マウス左ボタン長押し（mousedown / mousemove / mouseup） ---
    var mouseTimer = null;
    var mouseTarget = null;
    var mouseStartX = 0, mouseStartY = 0;

    document.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return; // 左クリックのみ
      var info = getCardFromEvent(e.target);
      if (!info || !info.card) return;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
      mouseTarget = info;

      if (mouseTimer) clearTimeout(mouseTimer);
      mouseTimer = setTimeout(function () {
        if (mouseTarget && mouseTarget.card) {
          Haptics.tap();
          CardCloseup.show(mouseTarget.card, { label: mouseTarget.label });
        }
        mouseTimer = null;
        mouseTarget = null;
      }, LONG_PRESS_MS);
    });

    document.addEventListener('mousemove', function (e) {
      if (!mouseTimer) return;
      var dx = Math.abs(e.clientX - mouseStartX);
      var dy = Math.abs(e.clientY - mouseStartY);
      if (dx > 10 || dy > 10) {
        clearTimeout(mouseTimer);
        mouseTimer = null;
        mouseTarget = null;
      }
    });

    document.addEventListener('mouseup', function () {
      if (mouseTimer) {
        clearTimeout(mouseTimer);
        mouseTimer = null;
      }
      mouseTarget = null;
    });

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
  })();

  $('zone-deck').addEventListener('click', onDeckClick);
  if ($('restart-btn')) $('restart-btn').addEventListener('click', function () { location.reload(); });
  $('run-support-yes').addEventListener('click', function () {
    Haptics.tap();
    closeRunSupportChoice(true);
  });
  $('run-support-no').addEventListener('click', function () {
    Haptics.tap();
    closeRunSupportChoice(false);
  });

  var handPrevBtn = $('hand-prev');
  var handNextBtn = $('hand-next');
  var handRowEl = $('hand-row');
  if (handPrevBtn) {
    handPrevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      Haptics.tap();
      if (handRowEl) {
        handRowEl.scrollBy({ left: -180, behavior: 'smooth' });
        setTimeout(updateHandNavState, 220);
      }
    });
  }
  if (handNextBtn) {
    handNextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      Haptics.tap();
      if (handRowEl) {
        handRowEl.scrollBy({ left: 180, behavior: 'smooth' });
        setTimeout(updateHandNavState, 220);
      }
    });
  }
  if (handRowEl) {
    handRowEl.addEventListener('scroll', function () {
      updateHandNavState();
    }, { passive: true });
    handRowEl.addEventListener('wheel', function (e) {
      if (hand.length >= 8 || window.innerWidth < 860) {
        var delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        if (delta !== 0) {
          e.preventDefault();
          handRowEl.scrollLeft += delta;
          updateHandNavState();
        }
      }
    }, { passive: false });
  }

  $('cmd-fab').addEventListener('click', function (e) {
    e.stopPropagation();
    Haptics.tap();
    var menu = $('cmd-menu');
    var willOpen = !menu.classList.contains('open');
    menu.classList.toggle('open', willOpen);
    updateFabDisplay();
  });
  $('command-bar').addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.cmd-menu-btn') : null;
    if (!btn || btn.disabled) return;
    Haptics.tap();
    var cmd = btn.dataset.cmd;
    if (cmd === 'run') cmdRun();
    else if (cmd === 'situation') cmdSituation();
    else if (cmd === 'item') cmdItemIdle();
    else if (cmd === 'hand') cmdHand();
    else if (cmd === 'end') cmdEndTurn();
    $('cmd-menu').classList.remove('open');
    updateFabDisplay();
  });
  // メニューの外側をタップしたら閉じる
  document.addEventListener('click', function (e) {
    var menu = $('cmd-menu');
    if (!menu || !menu.classList.contains('open')) return;
    if (e.target.closest && e.target.closest('#command-bar')) return;
    menu.classList.remove('open');
    updateFabDisplay();
  });

  // フィールドの馬をタップしたときの処理（続けて走破選択や詳細表示）
  var fieldBodyEl = $('field-body');
  if (fieldBodyEl) {
    fieldBodyEl.addEventListener('click', function (e) {
      if (suppressNextHandClick) { suppressNextHandClick = false; return; }
      if (!field || isCpuTurn) return;
      if (phase === 'select_horse') {
        var cost = field.cost || 2;
        var forces = hand.filter(function (c) { return c.type === 'force'; });
        if (forces.length < cost) {
          showToast('フォースカードが不足しています（必要: ' + cost + '枚）');
          setNarrator(iconImg('warning', 'img-icon-inline') + '【' + field.name + '】の続けて走破に必要な<b>フォースカードが不足しています</b>（必要: ' + cost + '枚 / 手札: ' + forces.length + '枚）');
          Haptics.warn();
          return;
        }
        selectedHorse = field;
        selectedForces = [];
        phase = 'select_force';
        renderAll();
        Haptics.place();
        setNarrator('場にいる<b>【' + field.name + '】</b>で再び走破します！ コストとして手札から<b>フォースカードを' + cost + '枚</b>選んでファームに送ってください。（残り ' + cost + ' 枚）');
        showToast('【' + field.name + '】で続けて走破！ フォースカードを' + cost + '枚選んでください');
      } else if (phase === 'idle') {
        CardCloseup.show(field, { label: 'フィールドの馬' });
      }
    });
  }

  /* ===================== ファームカード一覧モーダル ===================== */
  var FarmViewer = (function () {
    var overlayEl = null;

    function getOrCreateModal() {
      if (overlayEl) return overlayEl;
      overlayEl = document.createElement('div');
      overlayEl.id = 'farm-viewer-modal';
      overlayEl.className = 'farm-viewer-overlay';
      overlayEl.setAttribute('role', 'dialog');
      overlayEl.setAttribute('aria-modal', 'true');
      overlayEl.setAttribute('aria-hidden', 'true');
      overlayEl.innerHTML =
        '<div class="farm-viewer-panel">' +
        '  <div class="farm-viewer-head">' +
        '    <div class="farm-viewer-title-wrap">' +
        '      <span class="farm-viewer-icon" id="farm-viewer-icon">' + iconImg('sprout') + '</span>' +
        '      <div class="farm-viewer-title" id="farm-viewer-title">ファーム一覧</div>' +
        '    </div>' +
        '    <button class="farm-viewer-close" id="farm-viewer-close" type="button" aria-label="閉じる">' + iconImg('close') + '</button>' +
        '  </div>' +
        '  <div class="farm-viewer-stats" id="farm-viewer-stats"></div>' +
        '  <div class="farm-viewer-body" id="farm-viewer-cards"></div>' +
        '  <div class="farm-viewer-foot">' +
        '    <div class="farm-viewer-hint">※ カードをタップすると詳細を確認できます</div>' +
        '    <button class="farm-viewer-btn" id="farm-viewer-ok-btn" type="button">閉じる</button>' +
        '  </div>' +
        '</div>';

      document.body.appendChild(overlayEl);

      function closeModal() {
        overlayEl.classList.remove('show');
        overlayEl.setAttribute('aria-hidden', 'true');
      }

      overlayEl.addEventListener('click', function (e) {
        if (e.target === overlayEl) closeModal();
      });

      var closeBtn = overlayEl.querySelector('#farm-viewer-close');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);

      var okBtn = overlayEl.querySelector('#farm-viewer-ok-btn');
      if (okBtn) okBtn.addEventListener('click', closeModal);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlayEl.classList.contains('show')) {
          closeModal();
        }
      });

      return overlayEl;
    }

    function open(type) {
      var isPlayer = (type !== 'opp');
      var cardList = isPlayer ? farm.slice() : oppFarm.slice();
      var modal = getOrCreateModal();
      var iconEl = modal.querySelector('#farm-viewer-icon');
      var titleEl = modal.querySelector('#farm-viewer-title');
      var statsEl = modal.querySelector('#farm-viewer-stats');
      var cardsEl = modal.querySelector('#farm-viewer-cards');

      if (iconEl) iconEl.innerHTML = isPlayer ? iconImg('sprout') : iconImg('farm');
      if (titleEl) titleEl.textContent = (isPlayer ? '自分のファーム' : '相手のファーム') + '（全 ' + cardList.length + ' 枚）';

      // 種類別カウントのサマリーバッジ
      var horseCount = cardList.filter(function (c) { return c.type === 'horse'; }).length;
      var forceCount = cardList.filter(function (c) { return c.type === 'force'; }).length;
      var itemCount = cardList.filter(function (c) { return c.type === 'item' || c.type === 'jockey'; }).length;
      var sitCount = cardList.filter(function (c) { return c.type === 'situation'; }).length;

      var statsHtml =
        '<span class="fv-stat-chip type-horse">馬 ' + horseCount + '</span>' +
        '<span class="fv-stat-chip type-force">フォース ' + forceCount + '</span>' +
        '<span class="fv-stat-chip type-item">アイテム ' + itemCount + '</span>' +
        (sitCount > 0 ? '<span class="fv-stat-chip type-situation">状況 ' + sitCount + '</span>' : '');
      if (statsEl) statsEl.innerHTML = statsHtml;

      // カード一覧の描画
      if (!cardList.length) {
        cardsEl.innerHTML = '<div class="farm-viewer-empty">現在ファームにカードはありません</div>';
      } else {
        cardsEl.innerHTML = '';
        // 直近に置かれたカード（配列の末尾）から順に表示（新しい順）
        var reversed = cardList.slice().reverse();
        reversed.forEach(function (card, index) {
          var itemEl = document.createElement('div');
          itemEl.className = 'farm-viewer-card-item type-' + card.type;
          itemEl.setAttribute('role', 'button');
          itemEl.setAttribute('tabindex', '0');
          itemEl.title = card.name + '（タップして詳細表示）';

          var artHtml = '';
          if (card.img) {
            artHtml = '<div class="fv-card-thumb has-img" style="background-image:url(' + card.img + ');"></div>';
          } else {
            artHtml = '<div class="fv-card-thumb">' + (card.icon || iconImg('card')) + '</div>';
          }

          var statHtml = '';
          if (card.type === 'horse') {
            statHtml = '<div class="fv-card-stat"><span class="fv-stat-cost">コスト ' + (card.cost || 2) + '</span><span class="fv-stat-run">走破数 ' + (card.run || 0) + '</span><span class="fv-stat-guard">ガード ' + (card.guard || 0) + '</span></div>';
          } else if (card.type === 'item' || card.type === 'jockey') {
            statHtml = '<div class="fv-card-stat fv-stat-text">' + (card.stat || '効果あり') + '</div>';
          } else if (card.type === 'force') {
            statHtml = '<div class="fv-card-stat fv-stat-text">走破コスト用</div>';
          } else if (card.type === 'situation') {
            statHtml = '<div class="fv-card-stat fv-stat-text">' + (card.stat || '状況効果') + '</div>';
          }

          var orderNum = cardList.length - index;
          itemEl.innerHTML =
            artHtml +
            '<div class="fv-card-info">' +
            '  <div class="fv-card-name-row">' +
            '    <span class="fv-card-order">#' + orderNum + '</span>' +
            '    <span class="fv-card-name">' + (card.name || 'カード') + '</span>' +
            '  </div>' +
            statHtml +
            '</div>';

          itemEl.addEventListener('click', function (e) {
            e.stopPropagation();
            try { Haptics.tap(); } catch (err) {}
            CardCloseup.show(card, { label: (isPlayer ? '自分のファーム' : '相手のファーム') + ' #' + orderNum });
          });

          cardsEl.appendChild(itemEl);
        });
      }

      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      try { Haptics.tap(); } catch (err) {}
    }

    return {
      open: open
    };
  })();

  /* ===================== 手札カード一覧モーダル ===================== */
  var HandViewer = (function () {
    var overlayEl = null;

    function getOrCreateModal() {
      if (overlayEl) return overlayEl;
      overlayEl = document.createElement('div');
      overlayEl.id = 'hand-viewer-modal';
      overlayEl.className = 'farm-viewer-overlay';
      overlayEl.setAttribute('role', 'dialog');
      overlayEl.setAttribute('aria-modal', 'true');
      overlayEl.setAttribute('aria-hidden', 'true');
      overlayEl.innerHTML =
        '<div class="farm-viewer-panel">' +
        '  <div class="farm-viewer-head">' +
        '    <div class="farm-viewer-title-wrap">' +
        '      <span class="farm-viewer-icon" id="hand-viewer-icon">' + iconImg('card') + '</span>' +
        '      <div class="farm-viewer-title" id="hand-viewer-title">自分の手札</div>' +
        '    </div>' +
        '    <button class="farm-viewer-close" id="hand-viewer-close" type="button" aria-label="閉じる">' + iconImg('close') + '</button>' +
        '  </div>' +
        '  <div class="farm-viewer-stats" id="hand-viewer-stats"></div>' +
        '  <div class="farm-viewer-body" id="hand-viewer-cards"></div>' +
        '  <div class="farm-viewer-foot">' +
        '    <div class="farm-viewer-hint">※ カードをタップすると詳細を確認できます</div>' +
        '    <button class="farm-viewer-btn" id="hand-viewer-ok-btn" type="button">閉じる</button>' +
        '  </div>' +
        '</div>';

      document.body.appendChild(overlayEl);

      function closeModal() {
        overlayEl.classList.remove('show');
        overlayEl.setAttribute('aria-hidden', 'true');
      }

      overlayEl.addEventListener('click', function (e) {
        if (e.target === overlayEl) closeModal();
      });

      var closeBtn = overlayEl.querySelector('#hand-viewer-close');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);

      var okBtn = overlayEl.querySelector('#hand-viewer-ok-btn');
      if (okBtn) okBtn.addEventListener('click', closeModal);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlayEl.classList.contains('show')) {
          closeModal();
        }
      });

      return overlayEl;
    }

    function open() {
      var cardList = hand.slice();
      var modal = getOrCreateModal();
      var iconEl = modal.querySelector('#hand-viewer-icon');
      var titleEl = modal.querySelector('#hand-viewer-title');
      var statsEl = modal.querySelector('#hand-viewer-stats');
      var cardsEl = modal.querySelector('#hand-viewer-cards');

      if (iconEl) iconEl.innerHTML = iconImg('card');
      if (titleEl) titleEl.textContent = '自分の手札（全 ' + cardList.length + ' 枚）';

      // 種類別カウントのサマリーバッジ
      var horseCount = cardList.filter(function (c) { return c.type === 'horse'; }).length;
      var forceCount = cardList.filter(function (c) { return c.type === 'force'; }).length;
      var itemCount = cardList.filter(function (c) { return c.type === 'item' || c.type === 'jockey'; }).length;
      var sitCount = cardList.filter(function (c) { return c.type === 'situation'; }).length;

      var statsHtml =
        '<span class="fv-stat-chip type-horse">馬 ' + horseCount + '</span>' +
        '<span class="fv-stat-chip type-force">フォース ' + forceCount + '</span>' +
        '<span class="fv-stat-chip type-item">アイテム ' + itemCount + '</span>' +
        (sitCount > 0 ? '<span class="fv-stat-chip type-situation">状況 ' + sitCount + '</span>' : '');
      if (statsEl) statsEl.innerHTML = statsHtml;

      // カード一覧の描画
      if (!cardList.length) {
        cardsEl.innerHTML = '<div class="farm-viewer-empty">現在手札にカードはありません</div>';
      } else {
        cardsEl.innerHTML = '';
        cardList.forEach(function (card, index) {
          var itemEl = document.createElement('div');
          itemEl.className = 'farm-viewer-card-item type-' + card.type;
          itemEl.setAttribute('role', 'button');
          itemEl.setAttribute('tabindex', '0');
          itemEl.title = card.name + '（タップして詳細表示）';

          var artHtml = '';
          if (card.img) {
            artHtml = '<div class="fv-card-thumb has-img" style="background-image:url(' + card.img + ');"></div>';
          } else {
            artHtml = '<div class="fv-card-thumb">' + (card.icon || iconImg('card')) + '</div>';
          }

          var statHtml = '';
          if (card.type === 'horse') {
            statHtml = '<div class="fv-card-stat"><span class="fv-stat-cost">コスト ' + (card.cost || 2) + '</span><span class="fv-stat-run">走破数 ' + (card.run || 0) + '</span><span class="fv-stat-guard">ガード ' + (card.guard || 0) + '</span></div>';
          } else if (card.type === 'item' || card.type === 'jockey') {
            statHtml = '<div class="fv-card-stat fv-stat-text">' + (card.stat || '効果あり') + '</div>';
          } else if (card.type === 'force') {
            statHtml = '<div class="fv-card-stat fv-stat-text">走破コスト用</div>';
          } else if (card.type === 'situation') {
            statHtml = '<div class="fv-card-stat fv-stat-text">' + (card.stat || '状況効果') + '</div>';
          }

          var orderNum = index + 1;
          itemEl.innerHTML =
            artHtml +
            '<div class="fv-card-info">' +
            '  <div class="fv-card-name-row">' +
            '    <span class="fv-card-order">#' + orderNum + '</span>' +
            '    <span class="fv-card-name">' + (card.name || 'カード') + '</span>' +
            '  </div>' +
            statHtml +
            '</div>';

          itemEl.addEventListener('click', function (e) {
            e.stopPropagation();
            try { Haptics.tap(); } catch (err) {}
            CardCloseup.show(card, { label: '手札カード詳細 #' + orderNum });
          });

          cardsEl.appendChild(itemEl);
        });
      }

      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      try { Haptics.tap(); } catch (err) {}
    }

    return {
      open: open
    };
  })();

  // 自分のファームをクリックしたときの処理
  var farmZoneEl = $('zone-farm');
  if (farmZoneEl) {
    farmZoneEl.addEventListener('click', function (e) {
      if (suppressNextHandClick) { suppressNextHandClick = false; return; }
      if (phase === 'select_force' || phase === 'discard_select') return; // 手札から送るフェーズ中は干渉しない
      FarmViewer.open('player');
    });
  }

  // 相手のファームをクリックしたときの処理
  var oppFarmZoneEl = $('zone-opp-farm');
  if (oppFarmZoneEl) {
    oppFarmZoneEl.addEventListener('click', function (e) {
      if (suppressNextHandClick) { suppressNextHandClick = false; return; }
      FarmViewer.open('opp');
    });
  }

  var oppFieldBodyEl = $('field-body-opp');
  if (oppFieldBodyEl) {
    oppFieldBodyEl.addEventListener('click', function () {
      var target = fieldGuard || cpuHorseCard;
      if (target) {
        CardCloseup.show(target, { label: fieldGuard ? '相手のガード馬' : '相手フィールドの馬' });
      }
    });
  }
  (function setupHoloShine() {
    var MAX_TILT = 8; // degrees
    function updateFromPoint(el, clientX, clientY) {
      var r = el.getBoundingClientRect();
      var px = (clientX - r.left) / r.width;   // 0..1
      var py = (clientY - r.top) / r.height;   // 0..1
      px = Math.max(0, Math.min(1, px));
      py = Math.max(0, Math.min(1, py));
      var rx = (0.5 - py) * MAX_TILT * 2; // tilt up/down
      var ry = (px - 0.5) * MAX_TILT * 2; // tilt left/right
      el.style.setProperty('--holo-x', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--holo-y', (py * 100).toFixed(1) + '%');
      el.style.setProperty('--holo-rx', rx.toFixed(2) + 'deg');
      el.style.setProperty('--holo-ry', ry.toFixed(2) + 'deg');
      el.style.setProperty('--holo-op', '1');
    }
    function reset(el) {
      el.style.setProperty('--holo-op', '0');
      el.style.setProperty('--holo-rx', '0deg');
      el.style.setProperty('--holo-ry', '0deg');
      el.classList.remove('holo-active');
    }
    function findCard(target) { return target && target.closest ? target.closest('.hand-row .card') : null; }
    var activeEl = null;
    $('hand-row').addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      var el = document.elementFromPoint(t.clientX, t.clientY);
      var card = findCard(el);
      if (activeEl && activeEl !== card) { reset(activeEl); }
      if (card) { card.classList.add('holo-active'); updateFromPoint(card, t.clientX, t.clientY); activeEl = card; }
    }, { passive: true });
    $('hand-row').addEventListener('touchend', function () { if (activeEl) { reset(activeEl); activeEl = null; } }, { passive: true });
    $('hand-row').addEventListener('mousemove', function (e) {
      var card = findCard(e.target);
      if (activeEl && activeEl !== card) { reset(activeEl); }
      if (card) { card.classList.add('holo-active'); updateFromPoint(card, e.clientX, e.clientY); activeEl = card; }
    });
    $('hand-row').addEventListener('mouseleave', function () { if (activeEl) { reset(activeEl); activeEl = null; } });
  })();

  /* ===================== haptic feedback ===================== */
  var Haptics = (function () {
    var supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    function fire(pattern) { if (supported) { try { navigator.vibrate(pattern); } catch (e) { } } }
    return {
      tap: function () { fire(8); },        // light UI tap (buttons)
      select: function () { fire(12); },    // card selected / lifted
      place: function () { fire([10, 30, 16]); }, // card lands on the field
      warn: function () { fire([16, 40, 16, 40, 16]); } // invalid action / shake
    };
  })();

  /* ===================== perspective toggle ===================== */
  (function setupPerspectiveToggle() {
    var btn = $('perspective-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      Haptics.tap();
      var on = document.body.classList.toggle('field-3d');
      btn.classList.toggle('is-on', on);
    });
  })();

  /* ===================== mobile settings panel (angle / depth / zoom) ===================== */
  (function setupSettingsPanel() {
    var gear = $('settings-gear');
    var overlay = $('settings-overlay');
    if (!gear || !overlay) return;
    var closeBtn = $('settings-close');
    var tiltRange = $('tilt-range');
    var tiltValue = $('tilt-value');
    var depthRange = $('depth-range');
    var depthValue = $('depth-value');
    var zoomRange = $('zoom-range');
    var zoomValue = $('zoom-value');
    var bgOpacityRange = $('bg-opacity-range');
    var bgOpacityValue = $('bg-opacity-value');
    var touchToggle = $('touch-tilt-toggle');

    var resetBtn = $('settings-reset');
    var presetBtns = overlay.querySelectorAll('.preset-btn[data-angle]');
    var legacyChips = document.querySelectorAll('#tilt-select .tilt-opt[data-angle]');

    function computeDefaultZoom() {
      return (typeof window !== 'undefined' && window.innerWidth < 860) ? 100 : 114;
    }
    var userAdjustedZoom = false;
    var userAdjustedDepth = false;
    var DEFAULTS = { tilt: 10, depth: 1300, zoom: computeDefaultZoom() };
    var baseTilt = DEFAULTS.tilt;

    // ---- 傾き角度に連動した自動パースペクティブ計算 ----------------------
    // rotateX(θ) + perspective(P) で下端(50% 100%)を軸に傾けると、軸から
    // 距離 d だけ離れた要素は d * sin(θ) だけ奥（-Z方向）へ押し出され、
    // 画面上では P / (P + d*sinθ) 倍に縮んで見える（遠近圧縮）。
    // P を固定したまま θ だけ大きくすると sinθ が急増し、軸から遠い1行目
    // （相手の馬カード列）ほど強く圧縮されて枠が重なってしまう。
    // そこで「10°・1300px」を基準に sinθ/P の比が常に一定になるよう P を
    // 角度に応じて自動的に引き伸ばし、どの角度でも10°時と同じ縮み具合＝
    // 同じレイアウト比率を保つようにする。
    var TILT_REF_DEG = 25; // 基準(25°で1300px)は据え置き。初期角度を変えても各角度の見え方は変わらない
    var TILT_REF_PERSPECTIVE = DEFAULTS.depth;
    var TILT_REF_SIN = Math.sin(TILT_REF_DEG * Math.PI / 180);
    var DEPTH_MIN = 500;
    var DEPTH_MAX = 3000;

    function autoPerspectiveForTilt(deg) {
      var d = Math.max(0, Number(deg) || 0);
      if (d <= 0) return TILT_REF_PERSPECTIVE;
      var ratio = Math.sin(d * Math.PI / 180) / TILT_REF_SIN;
      var px = TILT_REF_PERSPECTIVE * ratio;
      return Math.round(Math.max(DEPTH_MIN, Math.min(DEPTH_MAX, px)) / 10) * 10;
    }

    function applyTiltVar(deg) {
      var d = Math.max(0, Math.min(60, Number(deg) === 0 ? 0 : (Number(deg) || 0)));
      document.body.style.setProperty('--tilt-angle', d + 'deg');
      var isDesktop = typeof window !== 'undefined' && window.innerWidth >= 860;

      // 傾き角度（0°〜60°）に応じて余白・隙間ができないよう、
      // 3D遠近短縮（rotateX）に合わせてフィールド・ナレーター・手札を連続的・動的に引き上げる
      var shiftY;
      var nTop, nBottom;
      var hTop, hShift, hScale;

      if (isDesktop) {
        // デスクトップ計算:
        // 0°: shiftY=0, nTop=-10, nBottom=14, hTop=6, hShift=0 (gap ~22px)
        // 10° (Flat): shiftY=-180, nTop=-20, nBottom=10, hTop=0, hShift=-10 (gap ~30px)
        // 25° (Perspective): shiftY=-285, nTop=-30, nBottom=6, hTop=-8, hShift=-20 (gap ~32px)
        // 60° (High Tilt): shiftY=-470, nTop=-48, nBottom=0, hTop=-24, hShift=-45 (gap ~38px)
        if (d <= 0) {
          shiftY = 0;
          nTop = -10;
          nBottom = 14;
          hTop = 6;
          hShift = 0;
        } else if (d <= 10) {
          var r0 = d / 10;
          shiftY = -r0 * 180;
          nTop = -10 - r0 * 10;
          nBottom = 14 - r0 * 4;
          hTop = 6 - r0 * 6;
          hShift = -r0 * 10;
        } else if (d <= 25) {
          var r1 = (d - 10) / 15;
          shiftY = -180 - r1 * 105;
          nTop = -20 - r1 * 10;
          nBottom = 10 - r1 * 4;
          hTop = 0 - r1 * 8;
          hShift = -10 - r1 * 10;
        } else {
          var r2 = (d - 25) / 35;
          shiftY = -285 - r2 * 185;
          nTop = -30 - r2 * 18;
          nBottom = 6 - r2 * 6;
          hTop = -8 - r2 * 16;
          hShift = -20 - r2 * 25;
        }
        hScale = 1.0 + Math.min(0.08, (d / 25) * 0.04);
      } else {
        // モバイル計算:
        // 0°: shiftY=0, nTop=0, nBottom=10, hShift=0 (gap ~14px)
        // 10° (Flat): shiftY=-45, nTop=-3, nBottom=8, hShift=-10 (gap ~30px)
        // 25° (Perspective): shiftY=-75, nTop=-6, nBottom=6, hShift=-22 (gap ~32px)
        // 60° (High Tilt): shiftY=-195, nTop=-18, nBottom=0, hShift=-60 (gap ~35px)
        if (d <= 0) {
          shiftY = 0;
          nTop = 0;
          nBottom = 10;
          hShift = 0;
        } else if (d <= 10) {
          var rm0 = d / 10;
          shiftY = -rm0 * 45;
          nTop = -rm0 * 3;
          nBottom = 10 - rm0 * 2;
          hShift = -rm0 * 10;
        } else if (d <= 25) {
          var rm1 = (d - 10) / 15;
          shiftY = -45 - rm1 * 30;
          nTop = -3 - rm1 * 3;
          nBottom = 8 - rm1 * 2;
          hShift = -10 - rm1 * 12;
        } else {
          var rm2 = (d - 25) / 35;
          shiftY = -75 - rm2 * 120;
          nTop = -6 - rm2 * 12;
          nBottom = 6 - rm2 * 6;
          hShift = -22 - rm2 * 38;
        }
        hTop = 0;
        hScale = 1.0 + Math.min(0.12, (d / 25) * 0.08);
      }

      document.body.style.setProperty('--field-tilt-shift-y', shiftY.toFixed(1) + 'px');
      document.body.style.setProperty('--field-tilt-margin-bottom', '0px');
      document.body.style.setProperty('--narrator-margin-top', nTop.toFixed(1) + 'px');
      document.body.style.setProperty('--narrator-margin-bottom', nBottom.toFixed(1) + 'px');
      document.body.style.setProperty('--hand-margin-top', hTop.toFixed(1) + 'px');
      document.body.style.setProperty('--hand-shift-y', hShift.toFixed(1) + 'px');
      document.body.style.setProperty('--hand-tilt-scale', hScale.toFixed(2));

      // ユーザーが「奥行き」スライダーを手動操作していない限り、傾き角度に
      // 連動してパースペクティブ距離を自動調整し、10°時と同じ見た目比率を維持する
      if (!userAdjustedDepth) {
        var autoPx = autoPerspectiveForTilt(d);
        document.body.style.setProperty('--field-perspective', autoPx + 'px');
        if (depthRange) depthRange.value = autoPx;
        if (depthValue) depthValue.textContent = autoPx + 'px';
      }
      var rounded = Math.round(d);
      document.body.dataset.tilt = String(rounded);
      document.body.classList.toggle('tilt-20-plus', d >= 18);
      if (typeof adjustFieldDiagonalLayout === 'function') adjustFieldDiagonalLayout();
    }

    function setTilt(deg) {
      deg = Math.max(0, Math.min(60, Number(deg) === 0 ? 0 : (Number(deg) || 0)));
      baseTilt = deg;
      applyTiltVar(deg);
      if (tiltRange) tiltRange.value = deg;
      if (tiltValue) tiltValue.textContent = deg + '°';
      presetBtns.forEach(function (b) { b.classList.toggle('active', Number(b.dataset.angle) === deg); });
      legacyChips.forEach(function (o) { o.classList.toggle('active', o.dataset.angle === String(deg)); });
    }
    window._setTilt = setTilt;
    function setDepth(px) {
      px = Math.max(DEPTH_MIN, Math.min(DEPTH_MAX, Number(px) || DEFAULTS.depth));
      document.body.style.setProperty('--field-perspective', px + 'px');
      if (depthRange) depthRange.value = px;
      if (depthValue) depthValue.textContent = px + 'px';
    }
    function setZoom(pct) {
      var minPct = 100;
      pct = Math.max(minPct, Math.min(200, Number(pct) || DEFAULTS.zoom));
      if (zoomRange) {
        zoomRange.min = String(minPct);
        zoomRange.value = pct;
      }
      if (zoomValue) zoomValue.textContent = pct + '%';
      if (FieldCamera && typeof FieldCamera.setBaseScale === 'function') {
        FieldCamera.setBaseScale(pct / 100);
      }
    }

    function setBgOpacity(pct) {
      pct = Math.max(10, Math.min(100, Number(pct) || 80));
      document.body.style.setProperty('--bg-field-opacity', (pct / 100).toFixed(2));
      if (bgOpacityRange) bgOpacityRange.value = pct;
      if (bgOpacityValue) bgOpacityValue.textContent = pct + '%';
      try {
        localStorage.setItem('foth_bg_opacity', pct);
      } catch (e) {}
    }

    setTilt(DEFAULTS.tilt);
    setDepth(DEFAULTS.depth);
    setZoom(DEFAULTS.zoom);

    var initialBgOpacity = 80;
    try {
      var savedOp = localStorage.getItem('foth_bg_opacity');
      if (savedOp !== null && savedOp !== undefined) {
        var n = Number(savedOp);
        if (!isNaN(n) && n >= 10 && n <= 100) initialBgOpacity = n;
      }
    } catch (e) {}
    setBgOpacity(initialBgOpacity);

    window.addEventListener('resize', function () {
      applyTiltVar(baseTilt);
      if (!userAdjustedZoom) {
        DEFAULTS.zoom = computeDefaultZoom();
        setZoom(DEFAULTS.zoom);
      }
    });

    gear.addEventListener('click', function () {
      Haptics.tap();
      overlay.classList.add('show');
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        Haptics.tap();
        overlay.classList.remove('show');
      });
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.classList.remove('show');
    });

    // タブ切替 (ゲーム設定 / 視点・カメラ)
    var tabBtns = overlay.querySelectorAll('.settings-tab-btn');
    var tabContents = overlay.querySelectorAll('.settings-tab-content');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        Haptics.tap();
        var target = btn.dataset.tab;
        tabBtns.forEach(function (b) {
          var isCurrent = (b === btn);
          b.classList.toggle('active', isCurrent);
          b.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
        });
        tabContents.forEach(function (c) {
          c.classList.toggle('active', c.dataset.tab === target);
        });
      });
    });

    presetBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        Haptics.tap();
        setTilt(b.dataset.angle);
      });
    });
    legacyChips.forEach(function (b) {
      b.addEventListener('click', function () {
        Haptics.tap();
        setTilt(b.dataset.angle);
      });
    });
    if (tiltRange) tiltRange.addEventListener('input', function () { setTilt(tiltRange.value); });
    if (depthRange) depthRange.addEventListener('input', function () {
      userAdjustedDepth = true;
      setDepth(depthRange.value);
    });
    if (zoomRange) {
      zoomRange.addEventListener('input', function () {
        userAdjustedZoom = true;
        setZoom(zoomRange.value);
      });
    }
    if (bgOpacityRange) {
      bgOpacityRange.addEventListener('input', function () {
        setBgOpacity(bgOpacityRange.value);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        Haptics.tap();
        userAdjustedZoom = false;
        userAdjustedDepth = false;
        DEFAULTS.zoom = computeDefaultZoom();
        setTilt(DEFAULTS.tilt);
        setDepth(DEFAULTS.depth);
        setZoom(DEFAULTS.zoom);
        setBgOpacity(80);
        if (touchToggle) touchToggle.checked = true;
        pointerTiltEnabled = true;
      });
    }

  })();

  /* ===================== field theme switch (Cyber / Dark / Nature) ===================== */
  (function setupThemeSwitch() {
    var switchWrap = $('theme-switch');
    if (!switchWrap) return;
    var opts = switchWrap.querySelectorAll('.theme-opt');

    function applyTheme(theme) {
      document.body.classList.remove('field-cyber', 'field-white', 'field-nature', 'theme-cyber', 'field-racetrack');

      if (theme === 'racetrack') {
        document.body.classList.add('field-racetrack');
        document.body.dataset.theme = 'racetrack';
      } else if (theme === 'nature' || theme === 'classic') {
        document.body.classList.add('field-nature');
        document.body.dataset.theme = 'nature';
      } else if (theme === 'cyber') {
        document.body.classList.add('theme-cyber');
        document.body.dataset.theme = 'cyber';
      } else if (theme === 'dark') {
        // dark theme (standard)
        document.body.classList.add('field-cyber');
        document.body.dataset.theme = 'dark';
      } else {
        // fallback (e.g. legacy 'white' saved in localStorage)
        theme = 'cyber';
        document.body.classList.add('theme-cyber');
        document.body.dataset.theme = 'cyber';
      }

      opts.forEach(function (opt) {
        var optTheme = opt.dataset.theme;
        var match = (optTheme === theme) ||
                    (theme === 'nature' && optTheme === 'classic') ||
                    (theme === 'classic' && optTheme === 'nature');
        opt.classList.toggle('active', match);
      });

      try {
        localStorage.setItem('foth_theme', theme);
      } catch (e) {}

      try {
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
      } catch (e) {}
    }

    var initialTheme = 'cyber';
    try {
      var saved = localStorage.getItem('foth_theme');
      if (saved && saved !== 'white') initialTheme = saved;
    } catch (e) {}
    applyTheme(initialTheme);

    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        Haptics.tap();
        applyTheme(opt.dataset.theme);
      });
    });
  })();

  /* ===================== mode switch (スライドスイッチ: チュートリアル / 自分で操作) ===================== */
  (function setupModeSwitch() {
    var switchWrap = $('mode-switch');
    if (!switchWrap) return;
    var opts = switchWrap.querySelectorAll('.mode-opt');

    // 自分で操作モードのコマンドバーは、3D傾き(rotateX)・ズーム(scale)がかかる
    // .field-image-wrap の外（<body>直下）へ出して、位置・大きさを画面に固定する。
    // （transform を持つ祖先の中に置くと position:fixed も変形に巻き込まれるため）
    function placeCommandBar(manual) {
      var bar = $('command-bar');
      var wrap = $('field-image-wrap');
      if (!bar || !wrap) return;
      if (manual) {
        if (bar.parentNode !== document.body) document.body.appendChild(bar);
      } else if (bar.parentNode !== wrap) {
        var deck = $('zone-deck');
        if (deck && deck.parentNode === wrap) wrap.insertBefore(bar, deck);
        else wrap.appendChild(bar);
      }
    }

    function applyMode(mode) {
      placeCommandBar(mode === 'manual');
      document.body.classList.toggle('manual-mode', mode === 'manual');
      opts.forEach(function (opt) {
        opt.classList.toggle('active', opt.dataset.mode === mode);
      });
      if (mode === 'manual') {
        startManualMode();
      } else {
        startTutorialMode();
      }
    }

    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        Haptics.tap();
        applyMode(opt.dataset.mode);
      });
    });
  })();

  /* ===================== pinch-to-zoom (field mat) ===================== */
  var FieldCamera = (function () {
    var el = $('field-image-wrap');
    if (!el) return { pulseTo: function () { }, focusRect: function () { }, reset: function () { }, setBaseScale: function () { }, isBusy: function () { return false; } };
    var isMobile = function () { return typeof window !== 'undefined' && window.innerWidth < 860; };
    var baseScale = isMobile() ? 1.0 : 1.14;
    function getMinScale() {
      // 最小倍率を1.0（100%）に固定
      return 1.0;
    }
    var MAX_SCALE = 2.6;
    var state = { scale: baseScale, tx: 0, ty: 0 };
    var busy = false; // true while a scripted camera animation is running

    function apply(withTransition) {
      el.style.transition = withTransition ? 'transform .22s ease' : 'none';
      el.style.transformOrigin = '50% 100%';
      el.style.transform = 'translate(' + state.tx + 'px,' + state.ty + 'px) scale(' + state.scale + ')';
      el.style.zIndex = state.scale > 1.01 ? '30' : '';

      // 倍率（scale）に応じてフィールド底面の差分を動的に詰めて余白を解消
      var h = el.offsetHeight || 600;
      var scaleShiftY = (state.scale < 1.0) ? (state.scale - 1.0) * h * 0.88 : 0;
      document.body.style.setProperty('--field-scale-shift-y', scaleShiftY.toFixed(1) + 'px');
    }
    function clamp() {
      var maxPanX = Math.max(0, (el.offsetWidth * (state.scale - 1)) / 2);
      var maxPanY = Math.max(0, (el.offsetHeight * (state.scale - 1)) / 2);
      state.tx = Math.max(-maxPanX, Math.min(maxPanX, state.tx));
      state.ty = Math.max(-maxPanY, Math.min(maxPanY, state.ty));
    }
    function reset(withTransition) {
      state.scale = baseScale; state.tx = 0; state.ty = 0;
      apply(withTransition !== false);
    }
    // pulseTo / focusRect: カード着地時やカード連打・ダブルタップ時の自動ズームインは
    // スマホでの画面巨大化・見切れバグを引き起こすため完全に無効化
    function pulseTo(rect, opts) { /* no-op */ }
    function focusRect(rect, scale) { /* no-op */ }

    el.style.transformOrigin = '50% 100%';
    el.style.touchAction = 'manipulation';

    // 設定画面のスライダー（CAMERA ZOOM）からのみ倍率変更を許可
    function setBaseScale(scale) {
      var minScale = getMinScale();
      scale = Math.max(minScale, Math.min(MAX_SCALE, scale));
      baseScale = scale;
      state.scale = scale; state.tx = 0; state.ty = 0;
      clamp();
      apply(true);
    }

    return {
      pulseTo: pulseTo,
      focusRect: focusRect,
      reset: reset,
      setBaseScale: setBaseScale,
      isBusy: function () { return busy; }
    };
  })();

  // iOS Safari等でのページ全体の二本指ピンチズーム縮小を完全防止
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gestureend', function (e) { e.preventDefault(); }, { passive: false });

  /* ===================== card closeup layer ===================== */
  var CardCloseup = (function () {
    var layer = $('closeup-layer');
    var slot = $('closeup-card');
    var labelEl = $('closeup-label');
    var toastEl = $('closeup-toast');
    var hideTimer = null;
    var onCloseResolver = null;
    var onCloseCallback = null;

    function formatCardDetail(card) {
      if (!card) return '';
      if (card.type === 'horse') {
        var html = '<div class="closeup-name-row"><span class="closeup-card-name">' + card.name + '</span>' +
          (card.en ? ' <span class="closeup-card-en">' + card.en + '</span>' : '') + '</div>';
        html += '<div class="closeup-stats-box">' +
          '<span class="closeup-stat-chip"><span class="chip-k">コスト</span> <b class="chip-v cost-v">' + (card.cost || 2) + '</b></span>' +
          '<span class="closeup-stat-chip"><span class="chip-k">走破数</span> <b class="chip-v run-v">' + card.run + '</b></span>' +
          '<span class="closeup-stat-chip"><span class="chip-k">' + iconImg('shield', 'img-icon-inline') + 'ガード値</span> <b class="chip-v guard-v">' + (card.guard || 0) + '</b></span>' +
          '</div>';
        var traits = [];
        if (card.style) traits.push('脚質: <b>' + card.style + '</b>');
        if (card.dist) traits.push('適正距離: <b>' + card.dist + '</b>');
        if (card.fav) traits.push('得意: <b>' + card.fav + '</b>');
        if (traits.length) {
          html += '<div class="closeup-trait-row">' + traits.join(' ｜ ') + '</div>';
        }
        return html;
      }
      if (card.type === 'force') {
        return '<div class="closeup-name-row"><span class="closeup-card-name">フォースカード</span></div>' +
          '<div class="closeup-effect-text">馬カードを走破させるときのコストとして使用する基本カード。</div>';
      }
      if (card.type === 'item' || card.type === 'jockey') {
        var supportLabel = card.type === 'jockey' ? '騎手' : 'アイテム';
        return '<div class="closeup-name-row"><span class="closeup-card-name">' + card.name + '</span>' +
          '<span class="closeup-type-badge">' + supportLabel + '</span></div>' +
          '<div class="closeup-effect-text">' + (card.stat || '') + '</div>' +
          '<div class="closeup-timing-hint">走破宣言のタイミングで使用可能</div>';
      }
      if (card.type === 'situation') {
        return '<div class="closeup-name-row"><span class="closeup-card-name">' + card.name + '</span>' +
          '<span class="closeup-type-badge type-situation">状況カード</span></div>' +
          '<div class="closeup-effect-text">' + (card.stat || '') + '</div>';
      }
      return card.name || '';
    }

    function show(card, opts) {
      if (!card) return Promise.resolve();
      opts = opts || {};
      slot.innerHTML = '';
      slot.appendChild(buildCardEl(card));
      labelEl.innerHTML = opts.label || 'カード詳細';

      var detailHtml = opts.toast || formatCardDetail(card);
      toastEl.innerHTML = detailHtml;
      toastEl.style.display = detailHtml ? '' : 'none';

      // 既存の発動ボタンがあれば除去
      var oldBtn = layer.querySelector('.closeup-action-btn');
      if (oldBtn) oldBtn.remove();

      // 手札の状況カードで詳細表示中なら、ここから直接発動できるボタンを表示
      if (card.type === 'situation' && !opts.autoHideMs && !isCpuTurn && hand.some(function (c) { return c.id === card.id; })) {
        var actBtn = document.createElement('button');
        actBtn.className = 'closeup-action-btn btn-guard';
        actBtn.style.cssText = 'margin-top:14px;padding:9px 24px;font-size:13.5px;font-weight:700;border-radius:8px;cursor:pointer;pointer-events:auto;box-shadow:0 4px 12px rgba(227,178,60,0.4);border:1.5px solid var(--gold);';
        actBtn.innerHTML = iconImg('sun', 'img-icon-inline') + 'この状況カードを発動する';
        actBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          hide();
          activateSituationCard(card);
        });
        layer.appendChild(actBtn);
      }

      layer.classList.add('show');
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      if (opts.autoHideMs) {
        hideTimer = setTimeout(hide, opts.autoHideMs);
      }

      onCloseCallback = opts.onClose || null;
      return new Promise(function (resolve) {
        onCloseResolver = resolve;
      });
    }

    function hide() {
      layer.classList.remove('show');
      var oldBtn = layer.querySelector('.closeup-action-btn');
      if (oldBtn) oldBtn.remove();
      suppressNextHandClick = false;
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      if (onCloseResolver) {
        var r = onCloseResolver;
        onCloseResolver = null;
        r();
      }
      if (onCloseCallback) {
        var cb = onCloseCallback;
        onCloseCallback = null;
        cb();
      }
    }

    layer.addEventListener('click', function (e) {
      hide();
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        hide();
      }
    });

    return { show: show, hide: hide, formatCardDetail: formatCardDetail };
  })();



  /* ===================== フィールド背景の放射状サイバー飛沫・スピードストリーム ===================== */
  var FieldSplash = (function () {
    var canvas = $('field-splash-canvas');
    if (!canvas) return { init: function () { }, setMode: function () { } };
    var ctx = canvas.getContext('2d');
    if (!ctx) return { init: function () { }, setMode: function () { } };

    var width = 0, height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var SPLASH_COUNT = 80;
    var WIND_COUNT = 46;
    var mode = 'off'; // 'off' | 'splash' | 'wind'

    function resize() {
      var rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* ---------- 飛沫（下から上へ駆け上がるスピードライン） ---------- */
    function createSplashParticle(randomProgress) {
      // 放射角度: 上向き (-Math.PI / 2) を中心に、上・奥へ扇状に広がる (約 -155°〜 -25°)
      var angleSpread = Math.PI * 0.72;
      var angle = (-Math.PI / 2) + (Math.random() - 0.5) * angleSpread;

      // サイバーカラーのバリエーション: 白 60%、サイバーシアン 25%、ネオンミント 15%
      var rnd = Math.random();
      var colorType = rnd < 0.60 ? 'white' : (rnd < 0.85 ? 'cyan' : 'mint');

      return {
        angle: angle,
        progress: randomProgress !== undefined ? randomProgress : 0,
        speed: 0.007 + Math.random() * 0.009,
        baseW: 3.0 + Math.random() * 4.0,
        baseH: 14 + Math.random() * 20,
        colorType: colorType,
        originOffsetX: (Math.random() - 0.5) * 60,
        originOffsetY: (Math.random() - 0.5) * 16,
        alphaOffset: 0.45 + Math.random() * 0.18 // 薄く上品な透明度（最大約0.5）
      };
    }

    function drawSplashFrame() {
      // 起点: 画面下部中央よりさらに下（重なりが目立つ発生源は画面外に出す）
      var originX = width * 0.5;
      var originY = height * 1.22;
      var maxDist = Math.hypot(width * 0.65, height * 1.25);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.progress += p.speed;

        if (p.progress >= 1.0) {
          particles[i] = createSplashParticle(0);
          continue;
        }

        // 下（手前）から上（奥）へ駆け上がる移動
        var t = Math.pow(p.progress, 1.55);
        var dist = maxDist * t;
        var x = originX + p.originOffsetX * (1 - t * 0.6) + Math.cos(p.angle) * dist;
        var y = originY + p.originOffsetY * (1 - t * 0.6) + Math.sin(p.angle) * dist;

        // 手前でしっかり、奥へ行くにつれてスピードラインのようにスッと伸びる
        var scale = 0.95 - t * 0.45;
        var rx = p.baseW * scale;
        var ry = p.baseH * (scale * 0.8 + t * 1.3);

        // 透明度（下部でふんわり湧き上がり、中間で適度に光り、上部奥でスッと消滅）
        var alpha = Math.min(1, p.progress / 0.1) * Math.max(0, 1 - Math.pow(p.progress, 2.6)) * p.alphaOffset;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.angle - Math.PI / 2);

        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, rx), Math.max(2, ry), 0, 0, Math.PI * 2);

        if (p.colorType === 'cyan') {
          ctx.fillStyle = 'rgba(62, 224, 255, ' + (alpha * 0.95).toFixed(3) + ')';
        } else if (p.colorType === 'mint') {
          ctx.fillStyle = 'rgba(0, 255, 190, ' + (alpha * 0.85).toFixed(3) + ')';
        } else {
          ctx.fillStyle = 'rgba(230, 248, 255, ' + (alpha * 0.9).toFixed(3) + ')';
        }
        ctx.fill();

        // 粒の中心にほんのりコアハイライト
        if (scale > 0.65) {
          ctx.beginPath();
          ctx.ellipse(0, 0, rx * 0.45, ry * 0.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.65).toFixed(3) + ')';
          ctx.fill();
        }

        ctx.restore();
      }
    }

    /* ---------- 風（左から右へ流れる、暗い緑を混ぜた風のライン） ---------- */
    function createWindParticle(randomProgress) {
      var rnd = Math.random();
      // 白 45%、暗い緑 40%、サイバーシアン 15%
      var colorType = rnd < 0.45 ? 'white' : (rnd < 0.85 ? 'green' : 'cyan');
      return {
        progress: randomProgress !== undefined ? randomProgress : 0,
        speed: 0.0035 + Math.random() * 0.0055,
        laneY: Math.random(), // 0〜1（画面高さに対する通過位置）
        tilt: (-6 + Math.random() * 14) * Math.PI / 180, // わずかに右下がり〜右上がり
        length: 26 + Math.random() * 46,
        thickness: 1.6 + Math.random() * 2.6,
        wobbleAmp: 5 + Math.random() * 16,
        wobbleFreq: 0.8 + Math.random() * 1.4,
        wobblePhase: Math.random() * Math.PI * 2,
        colorType: colorType,
        alphaOffset: 0.22 + Math.random() * 0.22
      };
    }

    function drawWindFrame(elapsed) {
      var travel = width * 1.35;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.progress += p.speed;
        if (p.progress >= 1.0) {
          particles[i] = createWindParticle(0);
          continue;
        }
        var t = p.progress;
        var x = -width * 0.18 + t * travel;
        var y = p.laneY * height + Math.sin(t * Math.PI * 2 * p.wobbleFreq + p.wobblePhase) * p.wobbleAmp;

        // 左右の端でふわっと現れ、ふわっと消える（吹き抜ける風のイメージ）
        var alpha = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) * p.alphaOffset;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.tilt);

        ctx.beginPath();
        ctx.ellipse(0, 0, p.length / 2, p.thickness / 2, 0, 0, Math.PI * 2);

        if (p.colorType === 'green') {
          ctx.fillStyle = 'rgba(40, 92, 58, ' + (alpha * 0.9).toFixed(3) + ')';
        } else if (p.colorType === 'cyan') {
          ctx.fillStyle = 'rgba(62, 224, 255, ' + (alpha * 0.85).toFixed(3) + ')';
        } else {
          ctx.fillStyle = 'rgba(226, 238, 228, ' + (alpha * 0.8).toFixed(3) + ')';
        }
        ctx.fill();

        ctx.restore();
      }
    }

    function seedParticles() {
      particles = [];
      if (mode === 'splash') {
        for (var i = 0; i < SPLASH_COUNT; i++) particles.push(createSplashParticle(Math.random()));
      } else if (mode === 'wind') {
        for (var j = 0; j < WIND_COUNT; j++) particles.push(createWindParticle(Math.random()));
      }
    }

    function init() {
      resize();
      requestAnimationFrame(loop);
    }

    function loop() {
      if (mode === 'off') {
        requestAnimationFrame(loop);
        return;
      }
      if (width === 0 || height === 0) {
        resize();
        requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      if (mode === 'splash') drawSplashFrame();
      else if (mode === 'wind') drawWindFrame();

      requestAnimationFrame(loop);
    }

    function setMode(m) {
      mode = (m === 'splash' || m === 'wind') ? m : 'off';
      canvas.style.display = (mode === 'off') ? 'none' : '';
      seedParticles();
      if (width && height) ctx.clearRect(0, 0, width, height);
    }

    window.addEventListener('resize', resize);

    return { init: init, setMode: setMode };
  })();

  /* ===================== boot ===================== */
  // スマホ表示時の安全な初期スクロール（初回1回のみ、手札とナレーターが見える位置へ自動スクロール）
  var initialMobileScrolled = false;
  function safeInitialMobileScroll() {
    if (initialMobileScrolled) return;
    if (window.innerWidth > 859) return; // モバイル（859px以下）のみ対象。PC・大画面時はスクロールなし
    var board = $('board');
    if (!board) return;
    initialMobileScrolled = true;

    function doScroll() {
      if (board.scrollHeight > board.clientHeight) {
        var maxScroll = board.scrollHeight - board.clientHeight;
        // 一番下までスクロールせず、ナレーターと手札の間のスペースを詰めるため少し上（50px手前）で止める
        board.scrollTop = Math.max(0, maxScroll - 50);
      }
    }

    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 60);
    setTimeout(doScroll, 250);
  }

  window._showBanner = showBanner;
  window._goldShip = goldShip;
  window._showToast = showToast;
  window._hideToast = hideToast;
  window._showGuardPopup = showGuardPopup;
  window._doDeuce = doDeuce;
  window._silkMobius = silkMobius;
  window._seiunSky = seiunSky;
  window._sonnig = sonnig;
  window._HandViewer = HandViewer;
  window._FarmViewer = FarmViewer;
  window._getHand = function () { return hand; };
  window._setHand = function (h) { hand = h; };
  window._situationCard = situationCard;
  window._activateSituationCard = activateSituationCard;
  window._getSituation = function () { return situation; };
  window._getPhase = function () { return phase; };
  window._getInteractionMode = function () { return interactionMode; };
  window._renderAll = renderAll;
  window._FieldCamera = FieldCamera;

  renderAll();
  runTutorial();
  safeInitialMobileScroll();

})();
