// --- マスターデータ ---
const BGM_PATH = 'music/1.mp3';

const AVATAR_PRESETS = [
  { id: 'icon1', name: 'アイコン1', src: 'icon/1.png' },
  { id: 'icon2', name: 'アイコン2', src: 'icon/2.png' },
  { id: 'icon3', name: 'アイコン3', src: 'icon/3.png' },
  { id: 'icon4', name: 'アイコン4', src: 'icon/4.png' },
  { id: 'icon5', name: 'アイコン5', src: 'icon/5.png' }
];

const DEFAULT_FALLBACK_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231f2937'/%3E%3Ccircle cx='50' cy='35' r='18' fill='%23d4af37'/%3E%3Cpath d='M20 85 Q50 55 80 85 Z' fill='%23d4af37'/%3E%3C/svg%3E";

const JUETI_COIN_CARD = {
  name: "樹液コイン",
  cost: 0,
  atk: 0,
  hp: 0,
  element: "green",
  ability: "coin",
  image: "images/jueki.jpg"
};

const CARD_DATA = [
  { name: "アリ",       cost: 1, atk: 2, hp: 1, element: "red",   ability: "draw",    image: "images/ant.jpg" },
  { name: "クワガタ",   cost: 2, atk: 3, hp: 3, element: "red",   ability: "",   image: "images/kuwagata.jpg" },
  { name: "カブトムシ", cost: 3, atk: 4, hp: 5, element: "red",   ability: "taunt",   image: "images/kabuto.jpg" },
   { name: "アカオニグモ", cost: 3, atk: 5, hp: 4, element: "red",   ability: "charge",  image: "images/aka.jpg" },
  { name: "スズメバチ", cost: 4, atk: 5, hp: 6, element: "red",   ability: "charge",  image: "images/suzu.jpg" },
  { name: "ムカデ",     cost: 5, atk: 6, hp: 7, element: "red",   ability: "", image: "images/omu.jpg" },
 { name: "女王バチ", cost: 6, atk: 8, hp: 7, element: "red",   ability: "charge",   image: "images/zyo.jpg" },

  { name: "アメンボ",   cost: 1, atk: 1, hp: 3, element: "blue",  ability: "",    image: "images/amen.jpg" },
  { name: "ゲンゴロウ", cost: 2, atk: 2, hp: 4, element: "blue",  ability: "drain",   image: "images/gengo.jpg" },
  { name: "タガメ",     cost: 3, atk: 2, hp: 6, element: "blue",  ability: "",   image: "images/tagame.png" },
  { name: "ミズカマキリ",cost: 4, atk: 4, hp: 8, element: "blue",  ability: "charge",  image: "images/mizu.png" },
    { name: "モルフォチョウ", cost: 4, atk: 2, hp: 7, element: "blue",  ability: "drain",   image: "images/mol.jpg" },
  { name: "タランチュラ",cost: 5, atk: 3, hp: 9,element: "blue",  ability: "", image: "images/tara.jpg" },
{ name: "ギラファ",   cost: 6, atk: 4, hp: 12, element: "blue",  ability: "",    image: "images/gira.jpg" },



  { name: "バッタ",     cost: 1, atk: 2, hp: 2, element: "green", ability: "",    image: "images/bat.png" },
  { name: "キリギリス", cost: 2, atk: 3, hp: 3, element: "green", ability: "drain",   image: "images/ki.png" },
  { name: "カマキリ",   cost: 3, atk: 4, hp: 4, element: "green", ability: "",  image: "images/kama.png" },
  { name: "オニヤンマ", cost: 4, atk: 5, hp: 6, element: "green", ability: "charge", image: "images/oni.png" },
  { name: "カミキリムシ", cost: 5, atk: 6, hp: 6, element: "green", ability: "",   image: "images/kami.jpg" },
 { name: "魔王カマキリ", cost: 6, atk: 8, hp: 8, element: "green", ability: "drain",   image: "images/mao.jpg" },

];
// --- グローバル状態変数 ---
let peer = null, conn = null;
let isHost = false;
let myRole = '';
let isVsCPU = false; 
let selectedHandIndex = null;
let selectedAttackerCardId = null;
let selectedAvatarIndex = 0;
let currentBiome = 'forest';
let myCustomDeckNames = [];
let lastRenderTurn = null;

let G = {
  turn: 'host',
  gameOver: false,
  winner: null,
  rematchState: { host: false, guest: false },
  players: {
    host: { deck: [], hand: [], field: [], mana: 0, maxMana: 0, territory: [], avatar: '', biome: 'forest' },
    guest: { deck: [], hand: [], field: [], mana: 0, maxMana: 0, territory: [], avatar: '', biome: 'forest' }
  }
};

// --- デッキ・データ処理 ---
function loadCustomDeck() {
  const saved = localStorage.getItem('bug_game_custom_deck');
  if (saved) {
    try {
      myCustomDeckNames = JSON.parse(saved);
    } catch(e) {}
  }
  if (!myCustomDeckNames || myCustomDeckNames.length !== 25) {
    resetDeckToDefaultData();
  }
  updateLobbyDeckCount();
}

function resetDeckToDefaultData() {
  myCustomDeckNames = [];
  for (let i = 0; i < 25; i++) {
    myCustomDeckNames.push(CARD_DATA[i % CARD_DATA.length].name);
  }
  saveCustomDeck();
}

function saveCustomDeck() {
  localStorage.setItem('bug_game_custom_deck', JSON.stringify(myCustomDeckNames));
  updateLobbyDeckCount();
}

function createDeckFromNames(nameList, role) {
  let deck = [];
  let idCounter = 1;
  nameList.forEach(name => {
    let base = CARD_DATA.find(c => c.name === name) || CARD_DATA[0];
    deck.push({ 
      ...base, 
      maxHp: base.hp, 
      ability: base.ability || null,
      id: role + '_' + (idCounter++) + '_' + Math.random().toString(36).substr(2, 4), 
      exhausted: false 
    });
  });
  return deck.sort(() => Math.random() - 0.5);
}

window.changeBiome = function(biomeKey) {
  currentBiome = biomeKey;
  if (G && G.players && G.players[myRole]) {
    G.players[myRole].biome = biomeKey;
    sendState();
  }
};
window.startCPUMode = function() {
  playBGM();
  loadCustomDeck();
  initAudio();

  isVsCPU = true;
  isHost = true;
  myRole = 'host';

  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('game-board').classList.remove('hidden');

  setTimeout(() => initFireflies(), 150);

  G.players.host.avatar = AVATAR_PRESETS[selectedAvatarIndex].src;
  G.players.host.biome = currentBiome;

  G.players.guest.avatar = AVATAR_PRESETS[1].src;
  G.players.guest.biome = 'forest';

  let cpuDeckNames = [];
  for (let i = 0; i < 25; i++) {
    cpuDeckNames.push(CARD_DATA[Math.floor(Math.random() * CARD_DATA.length)].name);
  }

  initGame(cpuDeckNames);
};

let cpuThinking = false;
function scheduleCPUTurn() {
  if (cpuThinking || G.gameOver || G.turn !== 'guest') return;
  cpuThinking = true;
  setTimeout(async () => {
    await runCPUTurn();
    cpuThinking = false;
  }, 600);
}

async function runCPUTurn() {
  if (G.gameOver || G.turn !== 'guest') return;
  let cpu = G.players.guest;
  let opp = G.players.host;

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // 樹液コインがあれば使用
  let coinIdx = cpu.hand.findIndex(c => c.ability === 'coin');
  if (coinIdx !== -1) {
    processAction('guest', 'PLAY_CARD', { handIndex: coinIdx });
    render();
    await delay(500);
  }

  // コストが足りる限り手札からカードを出す
  let canPlay = true;
  while (canPlay && cpu.field.length < 5 && !G.gameOver) {
    let playableIndices = [];
    cpu.hand.forEach((c, idx) => {
      if (c.cost <= cpu.mana) playableIndices.push(idx);
    });

    if (playableIndices.length === 0) {
      canPlay = false;
    } else {
      playableIndices.sort((a, b) => cpu.hand[b].cost - cpu.hand[a].cost);
      let targetHandIndex = playableIndices[0];
      processAction('guest', 'PLAY_CARD', { handIndex: targetHandIndex });
      render();
      await delay(700);
    }
  }

  let attackers = cpu.field.filter(c => !c.exhausted);
  for (let attacker of attackers) {
    if (G.gameOver || G.turn !== 'guest') break;

    let oppTaunts = opp.field.filter(c => c.ability === 'taunt');
    let targetDefender = null;

    if (oppTaunts.length > 0) {
      targetDefender = oppTaunts[0];
    } else if (opp.field.length > 0) {
      targetDefender = opp.field.find(def => calcAtkMul(attacker, def) > 1) || opp.field[0];
    }

    if (targetDefender) {
      processAction('guest', 'ATTACK_BUG', { attackerId: attacker.id, defenderId: targetDefender.id });
      render();
      await delay(800);
    } else {
      processAction('guest', 'ATTACK_HERO', { attackerId: attacker.id });
      render();
      await delay(800);
    }
  }

  if (!G.gameOver && G.turn === 'guest') {
    processAction('guest', 'END_TURN');
    render();
  }
}
// --- WebRTC 通信制御 ---
window.createRoom = function() {
  playBGM();
  loadCustomDeck();
  const btnCreate = document.getElementById('btn-create');
  const statusMsg = document.getElementById('status-msg');
  const copyIdBtn = document.getElementById('host-id-btn');
  const copyIdContainer = document.getElementById('copy-id-container');

  if (btnCreate) btnCreate.disabled = true;
  if (copyIdContainer) copyIdContainer.style.display = 'block';
  if (copyIdBtn) copyIdBtn.innerText = "ID生成中...";
  if (statusMsg) {
    statusMsg.style.color = "#d4af37";
    statusMsg.innerText = "通信サーバーに接続しています...";
  }

  initAudio();
  isHost = true;
  myRole = 'host';

  if (typeof Peer === 'undefined') {
    alert("PeerJSが読み込まれていません。ページを再読み込みしてください。");
    if (btnCreate) btnCreate.disabled = false;
    return;
  }

  if (peer) {
    try { peer.destroy(); } catch(e) {}
  }

  const roomId = String(Math.floor(100000 + Math.random() * 900000));

  try {
    peer = new Peer(roomId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });
  } catch(err) {
    alert("Peer作成失敗: " + err.message);
    if (btnCreate) btnCreate.disabled = false;
    return;
  }

  peer.on('open', id => {
    if (copyIdBtn) copyIdBtn.innerText = `📋 ${id}`;
    if (statusMsg) {
      statusMsg.style.color = "#2a9d8f";
      statusMsg.innerText = "部屋が作成されました！IDをコピーして相手に共有してください。";
    }

    if (copyIdBtn) {
      copyIdBtn.onclick = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(id).then(() => {
            alert("部屋ID (" + id + ") をコピーしました！");
          }).catch(() => prompt("コピー用部屋ID:", id));
        } else {
          prompt("コピー用部屋ID:", id);
        }
      };
    }
  });

  peer.on('connection', c => {
    conn = c;
    setupConnection();
  });

  peer.on('error', err => {
    console.error("Peer Error:", err);
    if (btnCreate) btnCreate.disabled = false;
  });
};

window.joinRoom = function() {
  playBGM();
  loadCustomDeck();
  const btnJoin = document.getElementById('btn-join');
  const joinInput = document.getElementById('join-id');
  const statusMsg = document.getElementById('status-msg');

  const hostId = joinInput ? joinInput.value.trim() : '';
  if (!hostId) {
    alert("相手の部屋IDを入力してください");
    return;
  }

  if (statusMsg) {
    statusMsg.style.color = "#d4af37";
    statusMsg.innerText = `部屋 (${hostId}) へ接続中...`;
  }

  if (btnJoin) btnJoin.disabled = true;

  initAudio();
  isHost = false;
  myRole = 'guest';

  if (typeof Peer === 'undefined') {
    alert("PeerJSが読み込まれていません。");
    if (btnJoin) btnJoin.disabled = false;
    return;
  }

  if (peer) {
    try { peer.destroy(); } catch(e) {}
  }

  try {
    peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });
  } catch(err) {
    alert("Peer作成失敗: " + err.message);
    if (btnJoin) btnJoin.disabled = false;
    return;
  }

  peer.on('open', () => {
    conn = peer.connect(hostId);
    setupConnection();
  });

  peer.on('error', err => {
    console.error("Peer Error:", err);
    if (btnJoin) btnJoin.disabled = false;
  });
};

function setupConnection() {
  if (!conn) return;

  conn.on('open', () => {
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) statusMsg.innerText = "接続成功！ゲームを開始します...";
    
    document.getElementById('lobby').classList.add('hidden');
    document.getElementById('game-board').classList.remove('hidden');

    setTimeout(() => {
      initFireflies();
    }, 150);

    if (isHost) {
      G.players.host.avatar = AVATAR_PRESETS[selectedAvatarIndex].src;
      G.players.host.biome = currentBiome;
    } else {
      conn.send({ 
        type: 'SET_GUEST_INFO', 
        avatar: AVATAR_PRESETS[selectedAvatarIndex].src,
        biome: currentBiome,
        deckNames: myCustomDeckNames
      });
    }
  });

  conn.on('data', data => handleNetworkData(data));
  conn.on('close', () => {
    alert("相手との接続が切断されました。");
    location.reload();
  });
}

function sendState() {
  if (isVsCPU) {
    render();
    if (G.turn === 'guest' && !G.gameOver) {
      scheduleCPUTurn();
    }
    return;
  }
  if (isHost) {
    conn.send({ type: 'SYNC', state: G });
    render();
  }
}

function sendAction(action, payload) {
  if (isVsCPU) {
    processAction(myRole, action, payload);
  } else {
    if (isHost) {
      processAction(myRole, action, payload);
    } else {
      conn.send({ type: 'ACTION', role: myRole, action, payload });
    }
  }
}

function handleNetworkData(data) {
  if (data.type === 'SYNC') {
    G = data.state;
    if (lastRenderTurn !== G.turn && !G.gameOver) {
      showTurnBanner(G.turn === myRole);
      lastRenderTurn = G.turn;
    }
    render();
  } else if (data.type === 'ACTION' && isHost) {
    processAction(data.role, data.action, data.payload);
  } else if (data.type === 'SET_GUEST_INFO' && isHost) {
    G.players.guest.avatar = data.avatar;
    G.players.guest.biome = data.biome;
    initGame(data.deckNames);
  } else if (data.type === 'COIN_FLIP') {
    play3DCoinFlipAnimation(data.firstRole, data.secondRole);
  } else if (data.type === 'SE') {
    playSE(data.se);
  } else if (data.type === 'EMOTE') {
    showEmoteBubble('opp-emote-bubble', data.text);
  } else if (data.type === 'TARGET_LOCK') {
    handleRemoteTargetLock(data.attackerId, data.defenderId);
  } else if (data.type === 'EFFECT_BUG') {
    playAttackBugEffect(data.defenderId, data.damageText, data.isDestroyed, data.isCritical, data.element);
  } else if (data.type === 'EFFECT_SUMMON_IMPACT') {
    playSummonImpactByCardId(data.cardId);
  } else if (data.type === 'EFFECT_HERO') {
    const oppInfoBox = document.getElementById('opponent-info-box');
    if (oppInfoBox) showDamageEffect(oppInfoBox, 'ライフ-1!');
  } else if (data.type === 'LEAVE_GAME') {
    alert("相手が退室しました。ロビーへ戻ります。");
    location.reload();
  }
}

function handleRemoteTargetLock(attackerId, defenderId) {
  remoteLock.attackerId = attackerId;
  remoteLock.defenderId = defenderId;
  updateTargetArrow();
}

// --- ゲームルール進行処理 ---
function initGame(guestDeckNames = null) {
  let hostDeck = createDeckFromNames(myCustomDeckNames, 'host');
  let guestDeck = createDeckFromNames(guestDeckNames || myCustomDeckNames, 'guest');

  G.players.host.territory = hostDeck.splice(0, 6);
  G.players.host.hand = hostDeck.splice(0, 4);
  G.players.host.deck = hostDeck;
  G.players.host.field = [];
  G.players.host.mana = 0;
  G.players.host.maxMana = 0;

  G.players.guest.territory = guestDeck.splice(0, 6);
  G.players.guest.hand = guestDeck.splice(0, 4);
  G.players.guest.deck = guestDeck;
  G.players.guest.field = [];
  G.players.guest.mana = 0;
  G.players.guest.maxMana = 0;

  G.gameOver = false;
  G.winner = null;
  G.rematchState = { host: false, guest: false };

  const firstRole = Math.random() < 0.5 ? 'host' : 'guest';
  const secondRole = (firstRole === 'host') ? 'guest' : 'host';

  G.players[secondRole].hand.push({
    ...JUETI_COIN_CARD,
    maxHp: 0,
    id: secondRole + '_jueki_coin'
  });

  if (conn && conn.open) {
    conn.send({ type: 'COIN_FLIP', firstRole, secondRole });
  }

  play3DCoinFlipAnimation(firstRole, secondRole, () => {
    G.turn = firstRole;
    startTurn(firstRole);
  });
}

// --- 修正後 startTurn ---
function startTurn(role) {
  G.turn = role;
  clearTargetArrow();
  let p = G.players[role];

  if (p.deck.length > 0) {
    p.hand.push(p.deck.pop());
  }

  p.maxMana = Math.min(10, (p.maxMana || 0) + 1);
  p.mana = p.maxMana;

  p.field.forEach(c => {
    c.exhausted = false;
    c.hp = c.maxHp; 
  });

  showTurnBanner(role === myRole);
  lastRenderTurn = role;

  log(`${role === myRole ? 'あなた' : '相手'}のターン開始`);
  
  // 状態送信と再描画
  sendState();

  // 【追記】CPU対戦かつCPUのターンの場合、自動思考を開始
  if (isVsCPU && role === 'guest' && !G.gameOver) {
    scheduleCPUTurn();
  }
}

function processAction(role, action, payload) {
  if (G.gameOver && action !== 'REMATCH') return;
  if (!G.gameOver && G.turn !== role && action !== 'SURRENDER') return;

  let p = G.players[role];
  let oppRole = role === 'host' ? 'guest' : 'host';
  let opp = G.players[oppRole];

  if (action === 'SET_FOOD') {
    if (G.foodSetThisTurn) return;
    let card = p.hand.splice(payload.handIndex, 1)[0];
    p.food.push(card);
    p.mana++;
    G.foodSetThisTurn = true;
    log(`${role === myRole ? 'あなた' : '相手'}は[${card.name}]をマナに置いた`);
  } 
 // --- js/api.js 内の processAction (PLAY_CARDの箇所) ---
  else if (action === 'PLAY_CARD') {
    let card = p.hand[payload.handIndex];

    if (card.ability === 'coin') {
      p.hand.splice(payload.handIndex, 1);
      p.mana += 1;
      log(`${role === myRole ? 'あなた' : '相手'}は【樹液コイン】を使用！コスト+1！`);
    } else {
      if (p.field.length >= 5) {
        log("フィールドには最高5枚までしか出せません！");
        return;
      }

      if (p.mana >= card.cost) {
        p.mana -= card.cost;
        p.hand.splice(payload.handIndex, 1);

        card.exhausted = (card.ability !== 'charge');
        p.field.push(card);

        // 🌟 コスト6以上：カード位置から属性エフェクト（炎の渦/水しぶき/木葉竜巻）が噴き出す
        if (card.cost >= 6) {
          setTimeout(() => {
            playHighCostSummonEffect(card.id, card.element);
            if (!isVsCPU && conn && conn.open) {
              conn.send({ type: 'EFFECT_HIGH_COST_SUMMON', cardId: card.id, element: card.element });
            }
          }, 80);
        }
        // 🌟 コスト5：通常の黄色い衝撃波演出
        else if (card.cost === 5) {
          setTimeout(() => {
            playSummonImpactByCardId(card.id);
            if (!isVsCPU && conn && conn.open) {
              conn.send({ type: 'EFFECT_SUMMON_IMPACT', cardId: card.id });
            }
          }, 100);
        }

        if (card.ability === 'draw' && p.deck.length > 0) {
          let drawn = p.deck.pop();
          p.hand.push(drawn);
          log(`${role === myRole ? 'あなた' : '相手'}は[${card.name}]を召喚！【1ドロー】！`);
        } else {
          log(`${role === myRole ? 'あなた' : '相手'}は[${card.name}]を召喚！`);
        }
      }
    }
  }
  else if (action === 'ATTACK_BUG') {
    let attacker = p.field.find(c => c.id === payload.attackerId);
    let defender = opp.field.find(c => c.id === payload.defenderId);

    let hasTaunt = opp.field.some(c => c.ability === 'taunt');
    if (hasTaunt && defender.ability !== 'taunt') {
      log("挑発（ガード）を持つカードを攻撃してください！");
      clearTargetArrow();
      return;
    }

    if (attacker && defender && !attacker.exhausted) {
      attacker.exhausted = true;
      let mul = calcAtkMul(attacker, defender);
      let attAtk = attacker.atk * mul;
      let isCritical = (mul > 1);

      triggerSE('attack');
      defender.hp -= attAtk;

      if (attacker.ability === 'drain') {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + 2);
      }

      let isDestroyed = defender.hp <= 0;
      let dmgText = `-${attAtk}`;

      let isRevengeDestroyed = false;
      if (isDestroyed && defender.ability === 'revenge') {
        attacker.hp = 0;
        isRevengeDestroyed = true;
      }

      playAttackBugEffect(defender.id, dmgText, isDestroyed, isCritical, attacker.element);

      if (conn && conn.open) {
        conn.send({ 
          type: 'EFFECT_BUG', 
          defenderId: defender.id, 
          damageText: dmgText, 
          isDestroyed: isDestroyed,
          isCritical: isCritical,
          element: attacker.element
        });
      }

      log(`[${attacker.name}]の攻撃！ ${defender.name}に${attAtk}ダメージ！${isCritical ? '⚡弱点ヒット!' : ''}`);
      clearTargetArrow();

      if (isDestroyed) {
        setTimeout(() => triggerSE('destroy'), 150);
        setTimeout(() => {
          opp.field = opp.field.filter(c => c.id !== defender.id);

          if (isRevengeDestroyed) {
            playAttackBugEffect(attacker.id, "道連れ!", true, false, 'red');
            p.field = p.field.filter(c => c.id !== attacker.id);
            log(`[${defender.name}]の【道連れ】！ [${attacker.name}]も道連れ！`);
          } else {
            log(`相手の[${defender.name}]を撃破！`);
          }
          sendState();
        }, 500);
        return;
      }
    }
  }
  else if (action === 'ATTACK_HERO') {
    let hasTaunt = opp.field.some(c => c.ability === 'taunt');
    if (hasTaunt) {
      log("挑発を持つカードが存在するため直接攻撃できません！");
      clearTargetArrow();
      return;
    }

    if (opp.field.length > 0) return;

    let attacker = p.field.find(c => c.id === payload.attackerId);
    if (attacker && !attacker.exhausted) {
      attacker.exhausted = true;
      triggerSE('attack');

      const oppInfoBox = document.getElementById('opponent-info-box');
      if (oppInfoBox) {
        playAttackVfx(oppInfoBox, attacker.element);
        showDamageEffect(oppInfoBox, 'ライフ-1!');
      }

      if (conn && conn.open) {
        conn.send({ type: 'EFFECT_HERO' });
      }

      clearTargetArrow();

      if (opp.territory.length > 0) {
        let taken = opp.territory.pop();
        opp.hand.push(taken);
        log(`本体攻撃成功！[${attacker.name}]がライフを1枚削った！`);
      } else {
        triggerSE('destroy');
        G.gameOver = true;
        G.winner = role;
        log(`決着！ ${role === myRole ? 'あなた' : '相手'}の勝利！`);
        triggerFinishCutin(role);
      }
    }
  }
  else if (action === 'SURRENDER') {
    triggerSE('destroy');
    clearTargetArrow();
    G.gameOver = true;
    G.winner = oppRole;
    log(`${role === myRole ? 'あなた' : '相手'}がサレンダーしました。`);
    triggerFinishCutin(oppRole);
  }
  else if (action === 'END_TURN') {
    clearTargetArrow();
    startTurn(oppRole);
    return;
  }
  else if (action === 'REMATCH') {
    G.rematchState[role] = true;
    if (G.rematchState.host && G.rematchState.guest) {
      initGame();
      return;
    }
  }

  sendState();
}

function calcAtkMul(att, def) {
  if (
    (att.element === 'red' && def.element === 'green') ||
    (att.element === 'green' && def.element === 'blue') ||
    (att.element === 'blue' && def.element === 'red')
  ) {
    return 2;
  }
  return 1;
}