let peer = null, conn = null;

window.createRoom = function() {
  playBGM(); loadCustomDeck();
  const btnCreate = document.getElementById('btn-create');
  const statusMsg = document.getElementById('status-msg');
  const copyIdBtn = document.getElementById('host-id-btn');
  const copyIdContainer = document.getElementById('copy-id-container');

  if (btnCreate) btnCreate.disabled = true;
  if (copyIdContainer) copyIdContainer.style.display = 'block';
  if (copyIdBtn) copyIdBtn.innerText = "ID生成中...";
  if (statusMsg) { statusMsg.style.color = "#d4af37"; statusMsg.innerText = "通信サーバーに接続しています..."; }

  initAudio(); isHost = true; myRole = 'host';

  if (typeof Peer === 'undefined') {
    alert("PeerJSが読み込まれていません。ページを再読み込みしてください。");
    if (btnCreate) btnCreate.disabled = false; return;
  }

  if (peer) { try { peer.destroy(); } catch(e) {} }
  const roomId = String(Math.floor(100000 + Math.random() * 900000));

  try {
    peer = new Peer(roomId, {
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
    });
  } catch(err) {
    alert("Peer作成失敗: " + err.message);
    if (btnCreate) btnCreate.disabled = false; return;
  }

  peer.on('open', id => {
    if (copyIdBtn) copyIdBtn.innerText = `📋 ${id}`;
    if (statusMsg) { statusMsg.style.color = "#2a9d8f"; statusMsg.innerText = "部屋を作成しました！IDを相手に共有してください。"; }
    if (copyIdBtn) {
      copyIdBtn.onclick = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(id).then(() => alert("部屋ID (" + id + ") をコピーしました！"))
            .catch(() => prompt("コピー用部屋ID:", id));
        } else { prompt("コピー用部屋ID:", id); }
      };
    }
  });

  peer.on('connection', c => { conn = c; setupConnection(); });
  peer.on('error', err => { console.error("Peer Error:", err); if (btnCreate) btnCreate.disabled = false; });
};

window.joinRoom = function() {
  playBGM(); loadCustomDeck();
  const btnJoin = document.getElementById('btn-join');
  const joinInput = document.getElementById('join-id');
  const statusMsg = document.getElementById('status-msg');

  const hostId = joinInput ? joinInput.value.trim() : '';
  if (!hostId) { alert("相手の部屋IDを入力してください"); return; }

  if (statusMsg) { statusMsg.style.color = "#d4af37"; statusMsg.innerText = `部屋 (${hostId}) へ接続中...`; }
  if (btnJoin) btnJoin.disabled = true;

  initAudio(); isHost = false; myRole = 'guest';

  if (typeof Peer === 'undefined') { alert("PeerJSが読み込まれていません。"); if (btnJoin) btnJoin.disabled = false; return; }
  if (peer) { try { peer.destroy(); } catch(e) {} }

  try {
    peer = new Peer({ config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } });
  } catch(err) { alert("Peer作成失敗: " + err.message); if (btnJoin) btnJoin.disabled = false; return; }

  peer.on('open', () => { conn = peer.connect(hostId); setupConnection(); });
  peer.on('error', err => { console.error("Peer Error:", err); if (btnJoin) btnJoin.disabled = false; });
};

function setupConnection() {
  if (!conn) return;
  conn.on('open', () => {
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) statusMsg.innerText = "接続成功！ゲームを開始します...";
    document.getElementById('lobby').classList.add('hidden');
    document.getElementById('game-board').classList.remove('hidden');

    setTimeout(() => initFireflies(), 150);

    if (isHost) {
      G.players.host.avatar = AVATAR_PRESETS[selectedAvatarIndex].src;
      G.players.host.biome = currentBiome;
    } else {
      conn.send({ type: 'SET_GUEST_INFO', avatar: AVATAR_PRESETS[selectedAvatarIndex].src, biome: currentBiome, deckNames: myCustomDeckNames });
    }
  });

  conn.on('data', data => handleNetworkData(data));
  conn.on('close', () => { alert("相手との接続が切断されました。"); location.reload(); });
}

function sendState() {
  if (isHost) { conn.send({ type: 'SYNC', state: G }); render(); }
}

function sendAction(action, payload) {
  if (isHost) processAction(myRole, action, payload);
  else conn.send({ type: 'ACTION', role: myRole, action, payload });
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
  } else if (data.type === 'EFFECT_LEGEND_SUMMON') { // ← これを追加！
    playLegendarySummonVfx(data.card);               // ← これを追加！
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