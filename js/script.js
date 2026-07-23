// --- icon/ フォルダ内の自作画像定義 ---
const AVATAR_PRESETS = [
  { id: 'icon1', name: 'アイコン1', src: 'icon/1.png' },
  { id: 'icon2', name: 'アイコン2', src: 'icon/2.png' },
  { id: 'icon3', name: 'アイコン3', src: 'icon/3.png' },
  { id: 'icon4', name: 'アイコン4', src: 'icon/4.png' },
  { id: 'icon5', name: 'アイコン5', src: 'icon/5.png' }
];

// 画像が読み込めなかった場合のフォールバック（予備）画像
const DEFAULT_FALLBACK_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%231f2937'/><circle cx='50' cy='35' r='18' fill='%23d4af37'/><path d='M20 85 Q50 55 80 85 Z' fill='%23d4af37'/></svg>";

let selectedAvatarIndex = 0;

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
  // --- 赤属性 (アタッカー特化) ---
  { name: "アリ",       cost: 1, atk: 400,  hp: 300,  element: "red",   image: "images/ant.jpg" },
  { name: "クワガタ",   cost: 2, atk: 700,  hp: 500,  element: "red",   image: "images/kuwagata.jpg" },
  { name: "カブトムシ", cost: 3, atk: 1000, hp: 700,  element: "red",   image: "images/kabuto.jpg" },
  { name: "スズメバチ", cost: 4, atk: 1400, hp: 900,  element: "red",   image: "images/suzu.jpg" },

  // --- 青属性 (ディフェンダー特化) ---
  { name: "アメンボ",   cost: 1, atk: 200,  hp: 500,  element: "blue",  image: "images/amen.jpg" },
  { name: "ゲンゴロウ", cost: 2, atk: 400,  hp: 700,  element: "blue",  image: "images/gengo.jpg" },
  { name: "タガメ",     cost: 3, atk: 600,  hp: 1100, element: "blue",  image: "images/tagame.png" },
  { name: "ミズカマキリ",cost: 4, atk: 900,  hp: 1500, element: "blue",  image: "images/mizu.png" },

  // --- 緑属性 (バランス型) ---
  { name: "バッタ",     cost: 1, atk: 300,  hp: 400,  element: "green", image: "images/bat.png" },
  { name: "キリギリス", cost: 2, atk: 500,  hp: 500,  element: "green", image: "images/ki.png" },
  { name: "カマキリ",   cost: 3, atk: 800,  hp: 800,  element: "green", image: "images/kama.png" },
  { name: "オニヤンマ", cost: 4, atk: 1100, hp: 1100, element: "green", image: "images/oni.png" },
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
  gameOver: false,
  winner: null,
  rematchState: { host: false, guest: false },
  players: {
    host: { deck: [], hand: [], field: [], food: [], mana: 0, territory: [], avatar: '' },
    guest: { deck: [], hand: [], field: [], food: [], mana: 0, territory: [], avatar: '' }
  }
};

// --- ロビーアバター一覧生成 ---
function initAvatarSelection() {
  const container = document.getElementById('avatar-list');
  container.innerHTML = '';
  AVATAR_PRESETS.forEach((av, idx) => {
    let img = document.createElement('img');
    img.src = av.src;
    img.className = `avatar-option ${idx === selectedAvatarIndex ? 'selected' : ''}`;
    img.title = av.name;
    img.onerror = function() {
      this.onerror = null;
      this.src = DEFAULT_FALLBACK_SVG;
    };
    img.onclick = () => {
      selectedAvatarIndex = idx;
      document.querySelectorAll('.avatar-option').forEach((el, i) => {
        if (i === idx) el.classList.add('selected');
        else el.classList.remove('selected');
      });
    };
    container.appendChild(img);
  });
}
initAvatarSelection();

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
      G.players.host.avatar = AVATAR_PRESETS[selectedAvatarIndex].src;
      initGame();
    } else {
      conn.send({ 
        type: 'SET_AVATAR', 
        role: 'guest', 
        avatar: AVATAR_PRESETS[selectedAvatarIndex].src 
      });
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
  } else if (data.type === 'SET_AVATAR' && isHost) {
    G.players[data.role].avatar = data.avatar;
    sendState();
  } else if (data.type === 'SE') {
    playSE(data.se);
  } else if (data.type === 'LEAVE_GAME') {
    alert("相手が退室しました。ロビーへ戻ります。");
    location.reload();
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
  G.players.host.field = [];

  G.players.guest.territory = guestDeck.splice(0, 6);
  G.players.guest.hand = guestDeck.splice(0, 4);
  G.players.guest.deck = guestDeck;
  G.players.guest.food = [];
  G.players.guest.field = [];

  G.gameOver = false;
  G.winner = null;
  G.rematchState = { host: false, guest: false };

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
  p.field.forEach(c => {
    c.exhausted = false;
    c.hp = c.maxHp; 
  });

  log(`${role === myRole ? 'あなた' : '相手'}のターン開始`);
  sendState();
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
    if (opp.field.length > 0) return;

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
        G.gameOver = true;
        G.winner = role;
        log(`決着！ ${role === myRole ? 'あなた' : '相手'}の勝利！`);
      }
    }
  }
  else if (action === 'SURRENDER') {
    triggerSE('destroy');
    G.gameOver = true;
    G.winner = oppRole;
    log(`${role === myRole ? 'あなた' : '相手'}がサレンダーしました。`);
  }
  else if (action === 'END_TURN') {
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

// --- レンダリング ---
function render() {
  let isMyTurn = G.turn === myRole;
  let me = G.players[myRole];
  let oppRole = myRole === 'host' ? 'guest' : 'host';
  let opp = G.players[oppRole];

  // アバター表示更新
  const myAvEl = document.getElementById('my-avatar-img');
  const oppAvEl = document.getElementById('opp-avatar-img');
  
  if (me.avatar) myAvEl.src = me.avatar;
  myAvEl.onerror = function() { this.onerror = null; this.src = DEFAULT_FALLBACK_SVG; };

  if (opp.avatar) oppAvEl.src = opp.avatar;
  oppAvEl.onerror = function() { this.onerror = null; this.src = DEFAULT_FALLBACK_SVG; };

  // ターン発光エリア設定
  const myAreaEl = document.getElementById('my-area');
  const oppAreaEl = document.getElementById('opponent-area');
  if (isMyTurn && !G.gameOver) {
    myAreaEl.classList.add('active-turn');
    oppAreaEl.classList.remove('active-turn');
  } else if (!G.gameOver) {
    oppAreaEl.classList.add('active-turn');
    myAreaEl.classList.remove('active-turn');
  } else {
    myAreaEl.classList.remove('active-turn');
    oppAreaEl.classList.remove('active-turn');
  }

  document.getElementById('my-mana').innerText = me.mana;
  document.getElementById('my-food-count').innerText = me.food.length;
  document.getElementById('my-deck').innerText = me.deck.length;

  document.getElementById('opp-food-count').innerText = opp.food.length;
  document.getElementById('opp-deck').innerText = opp.deck.length;
  document.getElementById('opp-hand-count').innerText = opp.hand.length;

  const btnEnd = document.getElementById('btn-end-turn');
  btnEnd.disabled = !isMyTurn || G.gameOver;

  renderTerritory('my-territory', me.territory.length);
  renderTerritory('opp-territory', opp.territory.length);

  renderFoodZone('my-food', me.food, me.mana);
  renderFoodZone('opp-food', opp.food, opp.mana);

  // 手札
  const handEl = document.getElementById('my-hand');
  handEl.innerHTML = '';
  const handCount = me.hand.length;

  me.hand.forEach((card, idx) => {
    let cardEl = createCardEl(card);

    if (isMyTurn && me.mana >= card.cost && !G.gameOver) {
      cardEl.classList.add('playable');
    }

    if (selectedHandIndex === idx) {
      cardEl.classList.add('selected');
    }

    if (handCount > 1) {
      const mid = (handCount - 1) / 2;
      const angle = (idx - mid) * 4;
      const offsetY = Math.abs(idx - mid) * 2;
      cardEl.style.transform = `translateY(${offsetY}px) rotate(${angle}deg)`;
    }

    cardEl.onclick = (e) => {
      e.stopPropagation();
      if (!isMyTurn || G.gameOver) return;
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
    cardEl.onclick = (e) => {
      e.stopPropagation();
      if (!isMyTurn || card.exhausted || G.gameOver) return;
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
    if (selectedAttackerCardId && !G.gameOver) {
      cardEl.classList.add('targetable-hero');
      cardEl.onclick = (e) => {
        e.stopPropagation();
        sendAction('ATTACK_BUG', { attackerId: selectedAttackerCardId, defenderId: card.id });
        selectedAttackerCardId = null;
        render();
      };
    }
    oppFieldEl.appendChild(cardEl);
  });

  // 相手本体への攻撃
  const oppInfoBox = document.getElementById('opponent-info-box');
  if (selectedAttackerCardId && !G.gameOver && opp.field.length === 0) {
    oppInfoBox.classList.add('targetable-hero');
    oppInfoBox.onclick = (e) => {
      e.stopPropagation();
      sendAction('ATTACK_HERO', { attackerId: selectedAttackerCardId });
      selectedAttackerCardId = null;
      render();
    };
  } else {
    oppInfoBox.classList.remove('targetable-hero');
    oppInfoBox.onclick = null;
  }

  // リザルト画面
  const resultModal = document.getElementById('result-modal');
  if (G.gameOver && G.winner) {
    resultModal.classList.remove('hidden');
    const titleEl = document.getElementById('result-title');
    const msgEl = document.getElementById('result-msg');
    const statusEl = document.getElementById('rematch-status');
    const btnRematch = document.getElementById('btn-rematch');

    const isWinner = G.winner === myRole;
    if (isWinner) {
      titleEl.innerText = 'VICTORY';
      titleEl.className = 'victory';
      msgEl.innerText = 'あなたの勝利です！';
    } else {
      titleEl.innerText = 'DEFEAT';
      titleEl.className = 'defeat';
      msgEl.innerText = '敗北しました...';
    }

    const myRematch = G.rematchState[myRole];
    const oppRematch = G.rematchState[oppRole];

    if (myRematch && !oppRematch) {
      btnRematch.disabled = true;
      statusEl.innerText = '相手の回答を待っています...';
    } else if (!myRematch && oppRematch) {
      btnRematch.disabled = false;
      statusEl.innerText = '相手が再戦を希望しています！';
    } else {
      btnRematch.disabled = false;
      statusEl.innerText = '';
    }
  } else {
    resultModal.classList.add('hidden');
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

function renderFoodZone(elementId, cardArray, availableMana) {
  const el = document.getElementById(elementId);
  el.innerHTML = '';
  cardArray.forEach((card, idx) => {
    let cardEl = createCardEl(card);
    if (idx >= availableMana) {
      cardEl.classList.add('food-used');
    }
    el.appendChild(cardEl);
  });
}

// ★ スマホ最適化カード要素作成 ★
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
  if (selectedHandIndex !== null && !G.gameOver) {
    modal.classList.remove('hidden');
    let card = G.players[myRole].hand[selectedHandIndex];
    document.getElementById('action-modal-card-name').innerText = `[${card.name}] の操作`;
    document.getElementById('btn-act-food').disabled = G.foodSetThisTurn;
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

document.getElementById('btn-surrender').onclick = () => {
  if (G.gameOver) return;
  if (confirm("本当にサレンダー（降参）しますか？")) {
    selectedHandIndex = null;
    selectedAttackerCardId = null;
    toggleActionModal();
    sendAction('SURRENDER');
  }
};

document.getElementById('btn-rematch').onclick = () => {
  sendAction('REMATCH');
};

document.getElementById('btn-home').onclick = () => {
  if (conn && conn.open) {
    conn.send({ type: 'LEAVE_GAME' });
  }
  location.reload();
};