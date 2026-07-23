// --- Web Audio API 効果音 ---
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSE(type) {
  if (!audioCtx) return;
  try {
    if (type === 'attack') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === 'destroy') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch(e) {
    console.log("SE Error:", e);
  }
}

function triggerSE(type) {
  playSE(type);
  if (conn && conn.open) {
    conn.send({ type: 'SE', se: type });
  }
}

// --- カード定義データ ---
const CARD_DATA = [
  { name: "アリ", cost: 1, atk: 700, hp: 500, element: "red", image: "images/ant.jpg" },
  { name: "クワガタ", cost: 2, atk: 1300, hp: 800, element: "red", image: "images/kuwagata.jpg" },
  { name: "カブトムシ", cost: 3, atk: 1800, hp: 1300, element: "red", image: "images/kabuto.jpg" },
  { name: "スズメバチ", cost: 4, atk: 2500, hp: 1800, element: "red", image: "images/suzu.jpg" },
  { name: "アメンボ", cost: 1, atk: 400, hp: 800, element: "blue", image: "images/amen.jpg" },
  { name: "ゲンゴロウ", cost: 2, atk: 800, hp: 1300, element: "blue", image: "images/gengo.jpg" },
  { name: "タガメ", cost: 3, atk: 1200, hp: 2000, element: "blue", image: "images/tagame.png" },
  { name: "ミズカマキリ", cost: 4, atk: 1700, hp: 2700, element: "blue", image: "images/mizu.png" },
  { name: "バッタ", cost: 1, atk: 600, hp: 600, element: "green", image: "images/bat.png" },
  { name: "キリギリス", cost: 2, atk: 1000, hp: 1000, element: "green", image: "images/ki.png" },
  { name: "カマキリ", cost: 3, atk: 1500, hp: 1500, element: "green", image: "images/kama.png" },
  { name: "オニヤンマ", cost: 4, atk: 2100, hp: 2200, element: "green", image: "images/oni.png" },
];

// --- ゲーム状態変数 ---
let peer = null, conn = null;
let isHost = false;
let myRole = '';
let selectedHandIndex = null;
let selectedAttackerCardId = null;

let G = {
  turn: 'host',
  foodSetThisTurn: false,
  players: {
    host: { deck: [], hand: [], field: [], food: [], mana: 0, territory: [] },
    guest: { deck: [], hand: [], field: [], food: [], mana: 0, territory: [] }
  }
};

// --- PeerJS 接続処理 ---
const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const statusMsg = document.getElementById('status-msg');
const copyIdBtn = document.getElementById('host-id-btn');
const copyIdContainer = document.getElementById('copy-id-container');

function createPeer() {
  if (typeof Peer === 'undefined') {
    alert("PeerJSの読み込みに失敗しています。ネット接続を確認して再読み込みしてください。");
    return null;
  }
  const p = new Peer();
  p.on('error', err => {
    console.error("PeerJS Error:", err);
    statusMsg.innerText = "通信エラーが発生しました: " + err.type;
    statusMsg.style.color = "#e63946";
    btnCreate.disabled = false;
    btnJoin.disabled = false;
  });
  return p;
}

btnCreate.addEventListener('click', () => {
  initAudio();
  isHost = true;
  myRole = 'host';
  btnCreate.disabled = true;
  statusMsg.style.color = "#aaa";
  statusMsg.innerText = "ID発行中...";
  
  peer = createPeer();
  if (!peer) return;

  peer.on('open', id => {
    copyIdBtn.innerText = `📋 ${id}`;
    copyIdContainer.style.display = 'block';
    statusMsg.innerText = "IDをタップしてコピーし、相手に共有してください。";
    
    copyIdBtn.onclick = () => {
      navigator.clipboard.writeText(id).then(() => {
        alert("部屋IDをクリップボードにコピーしました！");
      }).catch(() => {
        alert("コピー用ID: " + id);
      });
    };
  });

  peer.on('connection', c => {
    conn = c;
    setupConnection();
  });
});

btnJoin.addEventListener('click', () => {
  const hostId = document.getElementById('join-id').value.trim();
  if (!hostId) return alert("相手のIDを入力してください");

  initAudio();
  isHost = false;
  myRole = 'guest';
  btnJoin.disabled = true;
  statusMsg.style.color = "#aaa";
  statusMsg.innerText = "接続中...";
  
  peer = createPeer();
  if (!peer) return;

  peer.on('open', () => {
    conn = peer.connect(hostId);
    setupConnection();
  });
});

function setupConnection() {
  if (!conn) return;

  conn.on('open', () => {
    statusMsg.innerText = "接続成功！ゲームを開始します...";
    document.getElementById('lobby').classList.add('hidden');
    document.getElementById('game-board').classList.remove('hidden');
    if (isHost) {
      initGame();
    }
  });

  conn.on('data', data => {
    handleNetworkData(data);
  });

  conn.on('close', () => {
    alert("相手との接続が切断されました。");
    location.reload();
  });
}

function sendState() {
  if (isHost) {
    conn.send({ type: 'SYNC', state: G });
    render();
  }
}

function sendAction(action, payload) {
  if (isHost) {
    processAction(myRole, action, payload);
  } else {
    conn.send({ type: 'ACTION', role: myRole, action, payload });
  }
}

function handleNetworkData(data) {
  if (data.type === 'SYNC') {
    G = data.state;
    render();
  } else if (data.type === 'ACTION' && isHost) {
    processAction(data.role, data.action, data.payload);
  } else if (data.type === 'SE') {
    playSE(data.se);
  }
}

// --- ゲームロジック ---
function createDeck() {
  let deck = [];
  let idCounter = 1;
  for (let i = 0; i < 20; i++) {
    let base = CARD_DATA[i % CARD_DATA.length];
    deck.push({ 
      ...base, 
      maxHp: base.hp, 
      id: myRole + '_' + (idCounter++) + '_' + Math.random().toString(36).substr(2, 4), 
      exhausted: false 
    });
  }
  return deck.sort(() => Math.random() - 0.5);
}

function initGame() {
  let hostDeck = createDeck();
  let guestDeck = createDeck();

  G.players.host.territory = hostDeck.splice(0, 6);
  G.players.host.hand = hostDeck.splice(0, 4);
  G.players.host.deck = hostDeck;
  G.players.host.food = [];

  G.players.guest.territory = guestDeck.splice(0, 6);
  G.players.guest.hand = guestDeck.splice(0, 4);
  G.players.guest.deck = guestDeck;
  G.players.guest.food = [];

  G.turn = 'host';
  startTurn('host');
}

function startTurn(role) {
  G.turn = role;
  G.foodSetThisTurn = false;
  let p = G.players[role];
  
  if (p.deck.length > 0) {
    p.hand.push(p.deck.pop());
  }

  p.mana = p.food.length;
  // ターン開始時：自分の場の虫を起こし＆HP全回復
  p.field.forEach(c => {
    c.exhausted = false;
    c.hp = c.maxHp; 
  });

  log(`${role === myRole ? 'あなた' : '相手'}のターン開始`);
  sendState();
}

function processAction(role, action, payload) {
  if (G.turn !== role) return;

  let p = G.players[role];
  let oppRole = role === 'host' ? 'guest' : 'host';
  let opp = G.players[oppRole];

  if (action === 'SET_FOOD') {
    if (G.foodSetThisTurn) return;
    let card = p.hand.splice(payload.handIndex, 1)[0];
    p.food.push(card);
    p.mana++;
    G.foodSetThisTurn = true;
    log(`${role === myRole ? 'あなた' : '相手'}は[${card.name}]をエサ場に置いた`);
  } 
  else if (action === 'PLAY_CARD') {
    let card = p.hand[payload.handIndex];
    if (p.mana >= card.cost) {
      p.mana -= card.cost;
      p.hand.splice(payload.handIndex, 1);
      card.exhausted = false;
      p.field.push(card);
      log(`${role === myRole ? 'あなた' : '相手'}は[${card.name}]を召喚！`);
    }
  }
  else if (action === 'ATTACK_BUG') {
    let attacker = p.field.find(c => c.id === payload.attackerId);
    let defender = opp.field.find(c => c.id === payload.defenderId);

    if (attacker && defender && !attacker.exhausted) {
      attacker.exhausted = true;
      
      let attAtk = calcAtk(attacker, defender);

      triggerSE('attack');

      defender.hp -= attAtk;

      log(`[${attacker.name}]の攻撃！ ${defender.name}に${attAtk}ダメージ！`);

      let hasDestroyed = false;
      if (defender.hp <= 0) {
        opp.field = opp.field.filter(c => c.id !== defender.id);
        log(`相手の[${defender.name}]を撃破！`);
        hasDestroyed = true;
      }

      if (hasDestroyed) {
        setTimeout(() => triggerSE('destroy'), 150);
      }
    }
  }
  else if (action === 'ATTACK_HERO') {
    let attacker = p.field.find(c => c.id === payload.attackerId);
    if (attacker && !attacker.exhausted) {
      attacker.exhausted = true;
      triggerSE('attack');

      if (opp.territory.length > 0) {
        let taken = opp.territory.pop();
        opp.hand.push(taken);
        log(`本体攻撃成功！[${attacker.name}]が縄張りを1枚削った！`);
      } else {
        triggerSE('destroy');
        log(`決着！ ${role === myRole ? 'あなた' : '相手'}の勝利！`);
        alert(`${role === myRole ? '勝利！' : '敗北...'}`);
      }
    }
  }
  else if (action === 'END_TURN') {
    startTurn(oppRole);
    return;
  }

  sendState();
}

function calcAtk(att, def) {
  let mul = 1;
  if (
    (att.element === 'red' && def.element === 'green') ||
    (att.element === 'green' && def.element === 'blue') ||
    (att.element === 'blue' && def.element === 'red')
  ) {
    mul = 2;
  }
  return att.atk * mul;
}

function log(msg) {
  document.getElementById('log').innerText = msg;
}

// --- レンダリング (UI描画・演出更新) ---
function render() {
  let isMyTurn = G.turn === myRole;
  let me = G.players[myRole];
  let oppRole = myRole === 'host' ? 'guest' : 'host';
  let opp = G.players[oppRole];

  // ターン発光エリア設定
  const myAreaEl = document.getElementById('my-area');
  const oppAreaEl = document.getElementById('opponent-area');
  if (isMyTurn) {
    myAreaEl.classList.add('active-turn');
    oppAreaEl.classList.remove('active-turn');
  } else {
    oppAreaEl.classList.add('active-turn');
    myAreaEl.classList.remove('active-turn');
  }

  document.getElementById('my-mana').innerText = me.mana;
  document.getElementById('my-food-count').innerText = me.food.length;
  document.getElementById('my-deck').innerText = me.deck.length;

  document.getElementById('opp-food-count').innerText = opp.food.length;
  document.getElementById('opp-deck').innerText = opp.deck.length;
  document.getElementById('opp-hand-count').innerText = opp.hand.length;

  const btnEnd = document.getElementById('btn-end-turn');
  btnEnd.disabled = !isMyTurn;

  renderTerritory('my-territory', me.territory.length);
  renderTerritory('opp-territory', opp.territory.length);

  // エサ場描画 (消費済みカードをグレーアウト表示)
  renderFoodZone('my-food', me.food, me.mana);
  renderFoodZone('opp-food', opp.food, opp.mana);

  // 手札（扇状配置 ＆ 召喚可能パルス発光）
  const handEl = document.getElementById('my-hand');
  handEl.innerHTML = '';
  const handCount = me.hand.length;

  me.hand.forEach((card, idx) => {
    let cardEl = createCardEl(card);

    // 自分のターン ＆ コストが足りる場合は輝き（パルス）アニメーション
    if (isMyTurn && me.mana >= card.cost) {
      cardEl.classList.add('playable');
    }

    if (selectedHandIndex === idx) {
      cardEl.classList.add('selected');
    }

    // 手札の扇形（アーチ状）配置計算
    if (handCount > 1) {
      const mid = (handCount - 1) / 2;
      const angle = (idx - mid) * 5; // 傾き角度
      const offsetY = Math.abs(idx - mid) * 3; // 上下オフセット
      cardEl.style.transform = `translateY(${offsetY}px) rotate(${angle}deg)`;
    }

    cardEl.onclick = () => {
      if (!isMyTurn) return;
      selectedHandIndex = (selectedHandIndex === idx) ? null : idx;
      selectedAttackerCardId = null;
      render();
      toggleActionModal();
    };
    handEl.appendChild(cardEl);
  });

  // 自分フィールド
  const myFieldEl = document.getElementById('my-field');
  myFieldEl.innerHTML = '';
  me.field.forEach(card => {
    let cardEl = createCardEl(card);
    if (card.id === selectedAttackerCardId) cardEl.classList.add('selected');
    cardEl.onclick = () => {
      if (!isMyTurn || card.exhausted) return;
      selectedAttackerCardId = (selectedAttackerCardId === card.id) ? null : card.id;
      selectedHandIndex = null;
      toggleActionModal();
      render();
    };
    myFieldEl.appendChild(cardEl);
  });

  // 相手フィールド
  const oppFieldEl = document.getElementById('opp-field');
  oppFieldEl.innerHTML = '';
  opp.field.forEach(card => {
    let cardEl = createCardEl(card);
    if (selectedAttackerCardId) {
      cardEl.classList.add('targetable-hero');
      cardEl.onclick = () => {
        sendAction('ATTACK_BUG', { attackerId: selectedAttackerCardId, defenderId: card.id });
        selectedAttackerCardId = null;
        render();
      };
    }
    oppFieldEl.appendChild(cardEl);
  });

  // 相手プレイヤー（本体へのダイレクトアタック指定）
  const oppInfoBox = document.getElementById('opponent-info-box');
  if (selectedAttackerCardId) {
    oppInfoBox.classList.add('targetable-hero');
    oppInfoBox.onclick = () => {
      sendAction('ATTACK_HERO', { attackerId: selectedAttackerCardId });
      selectedAttackerCardId = null;
      render();
    };
  } else {
    oppInfoBox.classList.remove('targetable-hero');
    oppInfoBox.onclick = null;
  }
}

function renderTerritory(elementId, count) {
  const el = document.getElementById(elementId);
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    let t = document.createElement('div');
    t.className = 'territory-card';
    el.appendChild(t);
  }
}

// エサ場カード描画（マナ消費状況に応じてグレー化）
function renderFoodZone(elementId, cardArray, availableMana) {
  const el = document.getElementById(elementId);
  el.innerHTML = '';
  cardArray.forEach((card, idx) => {
    let cardEl = createCardEl(card);
    // 未使用マナ分を超えたエサは消費済み(food-used)とする
    if (idx >= availableMana) {
      cardEl.classList.add('food-used');
    }
    el.appendChild(cardEl);
  });
}

function createCardEl(card) {
  const el = document.createElement('div');
  el.className = `card ${card.element} ${card.exhausted ? 'exhausted' : ''}`;
  
  const elemText = { red: '赤', blue: '青', green: '緑' }[card.element];
  const hpColor = (card.hp < card.maxHp) ? '#e63946' : '#2a9d8f';

  el.innerHTML = `
    <div class="card-header">
      <div class="card-cost">${card.cost}</div>
      <div class="card-element">${elemText}</div>
    </div>
    <img class="card-img" src="${card.image}" alt="${card.name}">
    <div class="card-name">${card.name}</div>
    <div class="card-stats">
      <span class="card-atk">P:${card.atk}</span>
      <span class="card-hp" style="color:${hpColor}">H:${card.hp}</span>
    </div>
  `;
  return el;
}

function toggleActionModal() {
  const modal = document.getElementById('action-modal');
  if (selectedHandIndex !== null) {
    modal.classList.remove('hidden');
    document.getElementById('btn-act-food').disabled = G.foodSetThisTurn;
    let card = G.players[myRole].hand[selectedHandIndex];
    document.getElementById('btn-act-play').disabled = G.players[myRole].mana < card.cost;
  } else {
    modal.classList.add('hidden');
  }
}

// --- UIイベント ---
document.getElementById('btn-act-food').onclick = () => {
  if (selectedHandIndex !== null) {
    sendAction('SET_FOOD', { handIndex: selectedHandIndex });
    selectedHandIndex = null;
    toggleActionModal();
  }
};

document.getElementById('btn-act-play').onclick = () => {
  if (selectedHandIndex !== null) {
    sendAction('PLAY_CARD', { handIndex: selectedHandIndex });
    selectedHandIndex = null;
    toggleActionModal();
  }
};

document.getElementById('btn-act-cancel').onclick = () => {
  selectedHandIndex = null;
  toggleActionModal();
  render();
};

document.getElementById('btn-end-turn').onclick = () => {
  selectedHandIndex = null;
  selectedAttackerCardId = null;
  toggleActionModal();
  sendAction('END_TURN');
};