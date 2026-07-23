// --- BGM 設定 ---
const BGM_PATH = 'music/1.mp3'; // music/ フォルダ内の音源を指定
let bgmAudio = new Audio(BGM_PATH);
bgmAudio.loop = true;
bgmAudio.volume = 0.4; // 音量 (0.0 〜 1.0)
let isBgmPlaying = false;

// 初回画面タップ時にBGM自動再生（ブラウザの自動再生制限対策）
function initBGMOnFirstTouch() {
  const startBgm = () => {
    playBGM();
    document.removeEventListener('click', startBgm);
    document.removeEventListener('touchstart', startBgm);
  };
  document.addEventListener('click', startBgm);
  document.addEventListener('touchstart', startBgm);
}

function playBGM() {
  if (!isBgmPlaying) {
    bgmAudio.play().then(() => {
      isBgmPlaying = true;
      updateBgmBtn();
    }).catch(e => {
      console.log("BGM Autoplay prevented:", e);
    });
  }
}

// BGM ON/OFF 切替
window.toggleBGM = function() {
  const btn = document.getElementById('btn-bgm-toggle');
  if (isBgmPlaying) {
    bgmAudio.pause();
    isBgmPlaying = false;
  } else {
    bgmAudio.play();
    isBgmPlaying = true;
  }
  updateBgmBtn();
};

function updateBgmBtn() {
  const btn = document.getElementById('btn-bgm-toggle');
  if (btn) {
    btn.innerText = isBgmPlaying ? '🎵 BGM: ON' : '🔇 BGM: OFF';
  }
}

// --- icon/ フォルダ内の自作画像定義 ---
const AVATAR_PRESETS = [
  { id: 'icon1', name: 'アイコン1', src: 'icon/1.png' },
  { id: 'icon2', name: 'アイコン2', src: 'icon/2.png' },
  { id: 'icon3', name: 'アイコン3', src: 'icon/3.png' },
  { id: 'icon4', name: 'アイコン4', src: 'icon/4.png' },
  { id: 'icon5', name: 'アイコン5', src: 'icon/5.png' }
];

const DEFAULT_FALLBACK_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%231f2937'/><circle cx='50' cy='35' r='18' fill='%23d4af37'/><path d='M20 85 Q50 55 80 85 Z' fill='%23d4af37'/></svg>";

let selectedAvatarIndex = 0;
let audioCtx = null;

function initAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch(e) {
    console.log("Audio Init Warning:", e);
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
  { name: "アリ",       cost: 1, atk: 400,  hp: 300,  element: "red",   image: "images/ant.jpg" },
  { name: "クワガタ",   cost: 2, atk: 600,  hp: 500,  element: "red",   image: "images/kuwagata.jpg" },
  { name: "カブトムシ", cost: 3, atk: 600, hp: 700,  element: "red",   image: "images/kabuto.jpg" },
  { name: "スズメバチ", cost: 4, atk: 1000, hp: 900,  element: "red",   image: "images/suzu.jpg" },
 { name: "オオムカデ", cost: 4, atk: 1500, hp: 1200,  element: "red",   image: "images/omu.jpg" },

  { name: "アメンボ",   cost: 1, atk: 200,  hp: 500,  element: "blue",  image: "images/amen.jpg" },
  { name: "ゲンゴロウ", cost: 2, atk: 400,  hp: 700,  element: "blue",  image: "images/gengo.jpg" },
  { name: "タガメ",     cost: 3, atk: 600,  hp: 1100, element: "blue",  image: "images/tagame.png" },
  { name: "ミズカマキリ",cost: 4, atk: 900,  hp: 1500, element: "blue",  image: "images/mizu.png" },
 { name: "タランチュラ", cost: 5, atk: 1000, hp: 2000,  element: "blue",   image: "images/tara.jpg" },

  { name: "バッタ",     cost: 1, atk: 300,  hp: 400,  element: "green", image: "images/bat.png" },
  { name: "キリギリス", cost: 2, atk: 500,  hp: 500,  element: "green", image: "images/ki.png" },
  { name: "カマキリ",   cost: 3, atk: 800,  hp: 800,  element: "green", image: "images/kama.png" },
  { name: "オニヤンマ", cost: 4, atk: 1000, hp: 1000, element: "green", image: "images/oni.png" },
   { name: "カミキリムシ", cost: 5, atk: 1400, hp: 1400,  element: "green",   image: "images/kami.jpg" },

];

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

function initAvatarSelection() {
  const container = document.getElementById('avatar-list');
  if (!container) return;
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

// 部屋作成関数
window.createRoom = function() {
  playBGM();
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
    if (statusMsg) {
      statusMsg.style.color = "#e63946";
      statusMsg.innerText = "エラー: PeerJS未読み込み";
    }
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
          }).catch(() => {
            prompt("コピー用部屋ID:", id);
          });
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
    if (statusMsg) {
      statusMsg.style.color = "#e63946";
      statusMsg.innerText = "通信エラー: " + (err.type === 'unavailable-id' ? 'ID重複。もう一度作成を押してください。' : (err.type || err));
    }
  });
};

// 部屋参加関数
window.joinRoom = function() {
  playBGM();
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
    if (statusMsg) {
      statusMsg.style.color = "#e63946";
      statusMsg.innerText = "接続エラー: 部屋IDが存在しないか通信に失敗しました。";
    }
  });
};

function setupConnection() {
  if (!conn) return;

  conn.on('open', () => {
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) statusMsg.innerText = "接続成功！ゲームを開始します...";
    
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
  const logEl = document.getElementById('log');
  if (logEl) logEl.innerText = msg;
}

function render() {
  let isMyTurn = G.turn === myRole;
  let me = G.players[myRole];
  let oppRole = myRole === 'host' ? 'guest' : 'host';
  let opp = G.players[oppRole];

  const myAvEl = document.getElementById('my-avatar-img');
  const oppAvEl = document.getElementById('opp-avatar-img');
  
  if (myAvEl) {
    if (me.avatar) myAvEl.src = me.avatar;
    myAvEl.onerror = function() { this.onerror = null; this.src = DEFAULT_FALLBACK_SVG; };
  }

  if (oppAvEl) {
    if (opp.avatar) oppAvEl.src = opp.avatar;
    oppAvEl.onerror = function() { this.onerror = null; this.src = DEFAULT_FALLBACK_SVG; };
  }

  const myAreaEl = document.getElementById('my-area');
  const oppAreaEl = document.getElementById('opponent-area');
  if (myAreaEl && oppAreaEl) {
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
  }

  document.getElementById('my-mana').innerText = me.mana;
  document.getElementById('my-food-count').innerText = me.food.length;
  document.getElementById('my-deck').innerText = me.deck.length;

  document.getElementById('opp-food-count').innerText = opp.food.length;
  document.getElementById('opp-deck').innerText = opp.deck.length;
  document.getElementById('opp-hand-count').innerText = opp.hand.length;

  const btnEnd = document.getElementById('btn-end-turn');
  if (btnEnd) btnEnd.disabled = !isMyTurn || G.gameOver;

  renderTerritory('my-territory', me.territory.length);
  renderTerritory('opp-territory', opp.territory.length);

  renderFoodZone('my-food', me.food, me.mana);
  renderFoodZone('opp-food', opp.food, opp.mana);

  const handEl = document.getElementById('my-hand');
  if (handEl) {
    handEl.innerHTML = '';
    const handCount = me.hand.length;

    me.hand.forEach((card, idx) => {
      let cardEl = createCardEl(card, false);

      if (isMyTurn && me.mana >= card.cost && !G.gameOver) {
        cardEl.classList.add('playable');
      }

      if (selectedHandIndex === idx) {
        cardEl.classList.add('selected');
      }

      if (handCount > 1) {
        const mid = (handCount - 1) / 2;
        const angle = (idx - mid) * 2.5;
        const liftY = Math.sin((1 - Math.abs(idx - mid) / (mid || 1)) * Math.PI / 2) * 5;
        cardEl.style.transform = `translateY(${-liftY}px) rotate(${angle}deg)`;
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
  }

  const myFieldEl = document.getElementById('my-field');
  if (myFieldEl) {
    myFieldEl.innerHTML = '';
    me.field.forEach(card => {
      let cardEl = createCardEl(card, false);
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
  }

  const oppFieldEl = document.getElementById('opp-field');
  if (oppFieldEl) {
    oppFieldEl.innerHTML = '';
    opp.field.forEach(card => {
      let cardEl = createCardEl(card, false);
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
  }

  const oppInfoBox = document.getElementById('opponent-info-box');
  if (oppInfoBox) {
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
  }

  const resultModal = document.getElementById('result-modal');
  if (resultModal) {
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
}

function renderTerritory(elementId, count) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    let t = document.createElement('div');
    t.className = 'territory-card';
    el.appendChild(t);
  }
}

function renderFoodZone(elementId, cardArray, availableMana) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';
  cardArray.forEach((card, idx) => {
    let cardEl = createCardEl(card, true);
    if (idx >= availableMana) {
      cardEl.classList.add('food-used');
    }
    el.appendChild(cardEl);
  });
}

function createCardEl(card, isFood = false) {
  const el = document.createElement('div');
  el.className = `card ${card.element} ${card.exhausted ? 'exhausted' : ''}`;
  
  const elemText = { red: '赤', blue: '青', green: '緑' }[card.element];

  if (isFood) {
    el.innerHTML = `
      <div class="card-header">
        <div class="card-cost">${card.cost}</div>
        <div class="card-element">${elemText}</div>
      </div>
      <img class="card-img" src="${card.image}" alt="${card.name}">
    `;
  } else {
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
  }
  return el;
}

function toggleActionModal() {
  const modal = document.getElementById('action-modal');
  if (!modal) return;
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

function initUIEvents() {
  const btnActFood = document.getElementById('btn-act-food');
  const btnActPlay = document.getElementById('btn-act-play');
  const btnActCancel = document.getElementById('btn-act-cancel');
  const btnEndTurn = document.getElementById('btn-end-turn');
  const btnSurrender = document.getElementById('btn-surrender');
  const btnRematch = document.getElementById('btn-rematch');
  const btnHome = document.getElementById('btn-home');

  if (btnActFood) {
    btnActFood.onclick = () => {
      if (selectedHandIndex !== null) {
        sendAction('SET_FOOD', { handIndex: selectedHandIndex });
        selectedHandIndex = null;
        toggleActionModal();
      }
    };
  }

  if (btnActPlay) {
    btnActPlay.onclick = () => {
      if (selectedHandIndex !== null) {
        sendAction('PLAY_CARD', { handIndex: selectedHandIndex });
        selectedHandIndex = null;
        toggleActionModal();
      }
    };
  }

  if (btnActCancel) {
    btnActCancel.onclick = () => {
      selectedHandIndex = null;
      toggleActionModal();
      render();
    };
  }

  if (btnEndTurn) {
    btnEndTurn.onclick = () => {
      selectedHandIndex = null;
      selectedAttackerCardId = null;
      toggleActionModal();
      sendAction('END_TURN');
    };
  }

  if (btnSurrender) {
    btnSurrender.onclick = () => {
      if (G.gameOver) return;
      if (confirm("本当にサレンダー（降参）しますか？")) {
        selectedHandIndex = null;
        selectedAttackerCardId = null;
        toggleActionModal();
        sendAction('SURRENDER');
      }
    };
  }

  if (btnRematch) {
    btnRematch.onclick = () => {
      sendAction('REMATCH');
    };
  }

  if (btnHome) {
    btnHome.onclick = () => {
      if (conn && conn.open) {
        conn.send({ type: 'LEAVE_GAME' });
      }
      location.reload();
    };
  }
}

function startApp() {
  initAvatarSelection();
  initUIEvents();
  initBGMOnFirstTouch();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}