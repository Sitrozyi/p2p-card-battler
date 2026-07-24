// --- BGM / SE ---
let bgmAudio = new Audio(BGM_PATH);
bgmAudio.loop = true; bgmAudio.volume = 0.4;
let isBgmPlaying = false;
let audioCtx = null;

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
    bgmAudio.play().then(() => { isBgmPlaying = true; updateBgmBtn(); }).catch(() => {});
  }
}

window.toggleBGM = function() {
  if (isBgmPlaying) { bgmAudio.pause(); isBgmPlaying = false; }
  else { bgmAudio.play(); isBgmPlaying = true; }
  updateBgmBtn();
};

function updateBgmBtn() {
  const btn = document.getElementById('btn-bgm-toggle');
  if (btn) btn.innerText = isBgmPlaying ? '🎵 BGM: ON' : '🔇 BGM: OFF';
}

function initAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch(e) {}
}

function playSE(type) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    if (type === 'attack') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === 'destroy') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch(e) {}
}

function triggerSE(type) {
  playSE(type);
  if (typeof conn !== 'undefined' && conn && conn.open) conn.send({ type: 'SE', se: type });
}

// --- エモート ---
window.toggleEmotePicker = function(e) {
  if (e) e.stopPropagation();
  const picker = document.getElementById('emote-picker');
  if (picker) picker.classList.toggle('hidden');
};

document.addEventListener('click', () => {
  const picker = document.getElementById('emote-picker');
  if (picker) picker.classList.add('hidden');
});

window.sendEmote = function(text) {
  const picker = document.getElementById('emote-picker');
  if (picker) picker.classList.add('hidden');
  showEmoteBubble('my-emote-bubble', text);
  if (typeof conn !== 'undefined' && conn && conn.open) conn.send({ type: 'EMOTE', text });
};

function showEmoteBubble(elementId, text) {
  const bubble = document.getElementById(elementId);
  if (!bubble) return;
  bubble.innerText = text; bubble.classList.remove('hidden');
  setTimeout(() => bubble.classList.add('hidden'), 2200);
}

// --- 演出・VFX ---
function showTurnBanner(isMyTurn) {
  const banner = document.getElementById('turn-banner');
  const textEl = document.getElementById('turn-banner-text');
  if (!banner || !textEl) return;
  textEl.innerText = isMyTurn ? "次はあなたの番です" : "相手の番です";
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 1350);
}

function playAttackVfx(targetEl, element) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  const container = document.createElement('div');
  container.className = 'vfx-container';
  container.style.left = (rect.left + rect.width / 2) + 'px';
  container.style.top = (rect.top + rect.height / 2) + 'px';

  const effectEl = document.createElement('div');
  if (element === 'red') effectEl.className = 'vfx-slash';
  else if (element === 'blue') effectEl.className = 'vfx-ripple';
  else if (element === 'green') effectEl.className = 'vfx-vortex';

  container.appendChild(effectEl);
  document.body.appendChild(container);
  setTimeout(() => { if (container.parentNode) container.parentNode.removeChild(container); }, 520);
}

function showDamageEffect(targetEl, text, isCritical = false) {
  if (!targetEl) return;
  targetEl.classList.add('card-hit-shake');
  setTimeout(() => targetEl.classList.remove('card-hit-shake'), 380);

  const rect = targetEl.getBoundingClientRect();
  if (isCritical) {
    const critEl = document.createElement('div');
    critEl.className = 'critical-popup'; critEl.innerText = "⚡ CRITICAL 2x!!";
    critEl.style.left = (rect.left + rect.width / 2) + 'px'; critEl.style.top = (rect.top - 15) + 'px';
    document.body.appendChild(critEl);
    setTimeout(() => { if (critEl.parentNode) critEl.parentNode.removeChild(critEl); }, 900);
  }

  const dmgEl = document.createElement('div');
  dmgEl.className = 'damage-popup'; dmgEl.innerText = text;
  dmgEl.style.left = (rect.left + rect.width / 2) + 'px'; dmgEl.style.top = (rect.top + rect.height / 3) + 'px';
  document.body.appendChild(dmgEl);
  setTimeout(() => { if (dmgEl.parentNode) dmgEl.parentNode.removeChild(dmgEl); }, 850);
}

function showSummonImpactEffect(targetEl) {
  if (!targetEl) return;
  const board = document.getElementById('game-board');
  if (board) { board.classList.add('screen-impact-shake'); setTimeout(() => board.classList.remove('screen-impact-shake'), 450); }

  const rect = targetEl.getBoundingClientRect();
  const wave = document.createElement('div');
  wave.className = 'summon-shockwave';
  wave.style.left = (rect.left + rect.width / 2) + 'px'; wave.style.top = (rect.top + rect.height / 2) + 'px';
  document.body.appendChild(wave);
  setTimeout(() => { if (wave.parentNode) wave.parentNode.removeChild(wave); }, 650);
}

function shatterCard(targetEl) {
  if (!targetEl) return;
  const rect = targetEl.getBoundingClientRect();
  targetEl.classList.add('card-shattering');

  for (let i = 0; i < 14; i++) {
    const particle = document.createElement('div');
    particle.className = 'shatter-particle';
    particle.style.background = ['#e63946', '#ffb703', '#d4af37', '#1a1a1a', '#8b0000'][Math.floor(Math.random() * 5)];
    particle.style.left = (rect.left + Math.random() * rect.width) + 'px';
    particle.style.top = (rect.top + Math.random() * rect.height) + 'px';

    const angle = Math.random() * Math.PI * 2, distance = 40 + Math.random() * 70;
    particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--ty', `${Math.sin(angle) * distance + 20}px`);
    particle.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);

    document.body.appendChild(particle);
    setTimeout(() => { if (particle.parentNode) particle.parentNode.removeChild(particle); }, 650);
  }
}

function triggerFinishCutin(winnerRole) {
  const overlay = document.getElementById('finish-cutin');
  const avatarImg = document.getElementById('finish-avatar-img');
  const textTitle = document.getElementById('finish-text-title');
  if (!overlay || !avatarImg || !textTitle) return;

  const winnerPlayer = G.players[winnerRole];
  avatarImg.src = (winnerPlayer && winnerPlayer.avatar) ? winnerPlayer.avatar : DEFAULT_FALLBACK_SVG;
  textTitle.innerText = (winnerRole === myRole) ? "VICTORY" : "DEFEAT";

  overlay.classList.remove('hidden');
  setTimeout(() => { overlay.classList.add('hidden'); render(); }, 2200);
}

// --- 背景 Canvas アニメーション ---
let topParticles = [], bottomParticles = [], topFishGroup = { active: false, x: -100, y: 0, speed: 2 }, bottomFishGroup = { active: false, x: -100, y: 0, speed: 2 }, topLavaBubbles = [], bottomLavaBubbles = [], animTime = 0, isCanvasLoopRunning = false;

function initFireflies() {
  const canvas = document.getElementById('firefly-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resizeCanvas();
  setTimeout(resizeCanvas, 100);
  window.addEventListener('resize', resizeCanvas);

  topParticles = Array.from({ length: 6 }, () => createBiomeParticle(canvas, true));
  bottomParticles = Array.from({ length: 6 }, () => createBiomeParticle(canvas, false));

  function createBiomeParticle(c, isTop) {
    const minY = isTop ? 0 : c.height / 2, maxY = isTop ? c.height / 2 : c.height;
    return {
      x: Math.random() * c.width, y: minY + Math.random() * (maxY - minY),
      radius: Math.random() * 3.5 + 1, alpha: Math.random() * 0.6 + 0.2,
      speedAlpha: Math.random() * 0.01 + 0.004, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.4 - 0.2
    };
  }

  if (isCanvasLoopRunning) return;
  isCanvasLoopRunning = true;

  function loop() {
    resizeCanvas(); ctx.clearRect(0, 0, canvas.width, canvas.height);
    animTime += 0.012;
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard || gameBoard.classList.contains('hidden')) {
      drawLobbyForestBackground(ctx, canvas);
    } else {
      let oppRole = myRole === 'host' ? 'guest' : 'host';
      let oppBiome = (G.players[oppRole] && G.players[oppRole].biome) ? G.players[oppRole].biome : 'forest';
      let myBiome = (G.players[myRole] && G.players[myRole].biome) ? G.players[myRole].biome : 'forest';
      const midY = canvas.height / 2;
      drawZoneBiome(ctx, canvas, 0, midY, oppBiome, topParticles, topFishGroup, topLavaBubbles, true);
      drawZoneBiome(ctx, canvas, midY, midY, myBiome, bottomParticles, bottomFishGroup, bottomLavaBubbles, false);
    }
    requestAnimationFrame(loop);
  }

  function drawLobbyForestBackground(ctx, canvas) {
    const w = canvas.width, h = canvas.height;
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0c1a11'); bgGrad.addColorStop(0.5, '#07100b'); bgGrad.addColorStop(1, '#030604');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#050f09'; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w + 30; x += 30) {
      ctx.quadraticCurveTo(x + Math.sin(animTime * 0.8 + x * 0.02) * 12, h - (h * 0.45 + Math.sin(x * 0.03) * 60), x + 30, h);
    }
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#020603'; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w + 20; x += 20) {
      const sway = Math.sin(animTime * 1.5 + x * 0.04) * 18, grassH = 80 + Math.sin(x * 0.08) * 35;
      ctx.quadraticCurveTo(x + sway / 2, h - grassH / 2, x + sway, h - grassH);
      ctx.quadraticCurveTo(x + sway + 5, h - grassH / 2, x + 20, h);
    }
    ctx.closePath(); ctx.fill();

    [...topParticles, ...bottomParticles].forEach(p => {
      p.x += p.vx; p.y += p.vy; p.alpha += p.speedAlpha;
      if (p.alpha <= 0.05 || p.alpha >= 0.85) p.speedAlpha *= -1;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(0.9, p.alpha));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#d4af37'; ctx.shadowBlur = 12; ctx.shadowColor = '#10b981';
      ctx.fill(); ctx.restore();
    });
  }

  function drawZoneBiome(ctx, canvas, startY, height, biome, particleArray) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, startY, canvas.width, height); ctx.clip();
    const endY = startY + height;
    const bgGrad = ctx.createLinearGradient(0, startY, 0, endY);

    if (biome === 'ocean') { bgGrad.addColorStop(0, 'rgba(8, 30, 48, 0.95)'); bgGrad.addColorStop(1, 'rgba(3, 15, 26, 0.98)'); }
    else if (biome === 'lava') { bgGrad.addColorStop(0, 'rgba(50, 10, 10, 0.95)'); bgGrad.addColorStop(1, 'rgba(20, 2, 2, 0.98)'); }
    else { bgGrad.addColorStop(0, 'rgba(16, 32, 20, 0.95)'); bgGrad.addColorStop(1, 'rgba(6, 16, 8, 0.98)'); }
    ctx.fillStyle = bgGrad; ctx.fillRect(0, startY, canvas.width, height);

    if (biome === 'forest') {
      ctx.fillStyle = '#040b06'; ctx.beginPath(); ctx.moveTo(0, endY);
      for (let x = 0; x <= canvas.width + 20; x += 25) {
        const sway = Math.sin(animTime * 1.8 + x * 0.05) * 14, grassH = 35 + Math.sin(x * 0.1) * 12;
        ctx.quadraticCurveTo(x + sway / 2, endY - grassH / 2, x + sway, endY - grassH);
        ctx.quadraticCurveTo(x + sway + 5, endY - grassH / 2, x + 25, endY);
      }
      ctx.closePath(); ctx.fill();
    }

    particleArray.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.alpha += p.speedAlpha;
      if (p.alpha <= 0.05 || p.alpha >= 0.8) p.speedAlpha *= -1;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < startY) p.y = startY + height; if (p.y > startY + height) p.y = startY;

      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(0.85, p.alpha));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981'; ctx.fill(); ctx.restore();
    });
    ctx.restore();
  }

  loop();
}

// --- ターゲットアロー ---
let targetedDefenderCardId = null;
let remoteLock = { attackerId: null, defenderId: null };

function drawTargetArrow(attackerEl, targetEl) {
  const pathEl = document.getElementById('arrow-path'), svgEl = document.getElementById('target-arrow-svg');
  if (!pathEl || !svgEl || !attackerEl || !targetEl) return;

  const svgRect = svgEl.getBoundingClientRect(), rect1 = attackerEl.getBoundingClientRect(), rect2 = targetEl.getBoundingClientRect();
  const x1 = rect1.left + rect1.width / 2 - svgRect.left, y1 = rect1.top + rect1.height / 2 - svgRect.top;
  const x2 = rect2.left + rect2.width / 2 - svgRect.left, y2 = rect2.top + rect2.height / 2 - svgRect.top;

  const dx = x2 - x1, dy = y2 - y1;
  const cx = (x1 + x2) / 2 - dy * 0.25, cy = (y1 + y2) / 2 + dx * 0.25;

  pathEl.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
  pathEl.classList.remove('hidden');
}

function clearTargetArrowVisualOnly() {
  const pathEl = document.getElementById('arrow-path');
  if (pathEl) { pathEl.setAttribute('d', ''); pathEl.classList.add('hidden'); }
  document.querySelectorAll('.targeted-lock-on').forEach(el => el.classList.remove('targeted-lock-on'));
}

function clearTargetArrow() {
  targetedDefenderCardId = null; remoteLock = { attackerId: null, defenderId: null };
  clearTargetArrowVisualOnly();
  if (typeof conn !== 'undefined' && conn && conn.open) conn.send({ type: 'TARGET_LOCK', attackerId: null, defenderId: null });
}

function updateTargetArrow() {
  if (selectedAttackerCardId && targetedDefenderCardId) {
    const attackerEl = document.querySelector(`.card[data-card-id="${selectedAttackerCardId}"]`);
    const defenderEl = (targetedDefenderCardId === 'HERO') ? document.getElementById('opponent-info-box') : document.querySelector(`.card[data-card-id="${targetedDefenderCardId}"]`);
    document.querySelectorAll('.targeted-lock-on').forEach(el => el.classList.remove('targeted-lock-on'));
    if (attackerEl && defenderEl) { defenderEl.classList.add('targeted-lock-on'); drawTargetArrow(attackerEl, defenderEl); }
    else clearTargetArrowVisualOnly();
  } else if (remoteLock.attackerId && remoteLock.defenderId) {
    const attackerEl = document.querySelector(`.card[data-card-id="${remoteLock.attackerId}"]`);
    let defenderEl = (remoteLock.defenderId === 'HERO') ? document.querySelector('#my-area .player-info') : document.querySelector(`.card[data-card-id="${remoteLock.defenderId}"]`);
    document.querySelectorAll('.targeted-lock-on').forEach(el => el.classList.remove('targeted-lock-on'));
    if (attackerEl && defenderEl) { defenderEl.classList.add('targeted-lock-on'); drawTargetArrow(attackerEl, defenderEl); }
    else clearTargetArrowVisualOnly();
  } else clearTargetArrowVisualOnly();
}

window.addEventListener('resize', updateTargetArrow);

// --- カード操作 ---
function attachCardInteraction(cardEl, cardData, clickHandler) {
  let longPressTimer = null, isLongPress = false;
  const startPress = () => {
    isLongPress = false;
    longPressTimer = setTimeout(() => { isLongPress = true; openCardPreview(cardData); if (navigator.vibrate) navigator.vibrate(40); }, 350);
  };
  const cancelPress = () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } };

  cardEl.addEventListener('touchstart', startPress, { passive: true });
  cardEl.addEventListener('touchend', e => { cancelPress(); if (isLongPress) { e.preventDefault(); e.stopPropagation(); } });
  cardEl.addEventListener('touchmove', cancelPress);
  cardEl.addEventListener('mousedown', startPress);
  cardEl.addEventListener('mouseup', cancelPress);
  cardEl.addEventListener('mouseleave', cancelPress);
  cardEl.onclick = e => { e.stopPropagation(); if (isLongPress) { isLongPress = false; return; } if (clickHandler) clickHandler(e); };
}

function openCardPreview(cardData) {
  const modal = document.getElementById('card-preview-modal');
  const container = document.getElementById('preview-card-container');
  const descEl = document.getElementById('preview-card-desc');
  if (!modal || !container || !descEl) return;

  container.innerHTML = '';
  container.appendChild(createCardEl(cardData, false));

  const abilityDescs = {
    taunt: "【挑発】相手はこのカードしか攻撃・ダイレクトアタックできない。",
    charge: "【速攻】召喚したターンにすぐ攻撃できる。",
    revenge: "【道連れ】このカードが撃破された時、攻撃してきた相手も道連れで撃破する。",
    drain: "【回復】攻撃した時、自身のHPを+3回復する。",
    draw: "【1ドロー】召喚した時、山札からカードを1枚引く。",
    coin: "【樹液コイン】コスト0。使うとこのターンの使用可能コストが+1増える。"
  };
  descEl.innerText = cardData.ability ? abilityDescs[cardData.ability] : "特殊能力なし";
  modal.classList.remove('hidden');
}

window.closeCardPreview = function() {
  const modal = document.getElementById('card-preview-modal');
  if (modal) modal.classList.add('hidden');
};

// --- アバター ＆ デッキ画面 ---
function initAvatarSelection() {
  const container = document.getElementById('avatar-list');
  if (!container) return;
  container.innerHTML = '';
  AVATAR_PRESETS.forEach((av, idx) => {
    let img = document.createElement('img');
    img.src = av.src;
    img.className = `avatar-option ${idx === selectedAvatarIndex ? 'selected' : ''}`;
    img.title = av.name;
    img.onerror = function() { this.onerror = null; this.src = DEFAULT_FALLBACK_SVG; };
    img.onclick = () => {
      selectedAvatarIndex = idx;
      document.querySelectorAll('.avatar-option').forEach((el, i) => el.classList.toggle('selected', i === idx));
    };
    container.appendChild(img);
  });
}

function updateLobbyDeckCount() {
  const el = document.getElementById('lobby-deck-count');
  if (el) el.innerText = myCustomDeckNames.length;
}

window.openDeckBuilder = function() {
  loadCustomDeck();
  const selectEl = document.getElementById('biome-select');
  if (selectEl) selectEl.value = currentBiome;
  renderDeckBuilder();
  const modal = document.getElementById('deck-builder-modal');
  if (modal) modal.classList.remove('hidden');
};

window.saveAndCloseDeckBuilder = function() {
  if (myCustomDeckNames.length !== 25) { alert("デッキはちょうど25枚にしてください！（現在 " + myCustomDeckNames.length + " 枚）"); return; }
  saveCustomDeck();
  const modal = document.getElementById('deck-builder-modal');
  if (modal) modal.classList.add('hidden');
};

window.resetDeckToDefault = function() {
  if (confirm("標準の初期デッキ(25枚)に戻しますか？")) { resetDeckToDefaultData(); renderDeckBuilder(); }
};

function renderDeckBuilder() {
  const currentGrid = document.getElementById('current-deck-grid');
  const poolGrid = document.getElementById('card-pool-grid');
  const countEl = document.getElementById('deck-count-num');

  if (!currentGrid || !poolGrid) return;
  if (countEl) countEl.innerText = myCustomDeckNames.length;

  currentGrid.innerHTML = '';
  myCustomDeckNames.forEach((cardName, idx) => {
    let cardEl = createCardEl(CARD_DATA.find(c => c.name === cardName) || CARD_DATA[0], false);
    cardEl.onclick = () => { myCustomDeckNames.splice(idx, 1); renderDeckBuilder(); };
    currentGrid.appendChild(cardEl);
  });

  poolGrid.innerHTML = '';
  CARD_DATA.forEach(cardData => {
    let cardEl = createCardEl(cardData, false);
    const countInDeck = myCustomDeckNames.filter(n => n === cardData.name).length;
    cardEl.onclick = () => {
      if (myCustomDeckNames.length >= 25) { alert("デッキは25枚が上限です！"); return; }
      if (countInDeck >= 3) { alert("同じカードは3枚までしか入れられません！"); return; }
      myCustomDeckNames.push(cardData.name); renderDeckBuilder();
    };
    poolGrid.appendChild(cardEl);
  });
}

function play3DCoinFlipAnimation(firstRole, secondRole, callback) {
  const modal = document.getElementById('coin-modal');
  const coinEl = document.getElementById('coin-element');
  const resultText = document.getElementById('coin-result-text');
  if (!modal || !coinEl || !resultText) { if (callback && isHost) callback(); return; }

  modal.classList.remove('hidden'); resultText.innerText = "先攻・後攻を抽選中...";
  coinEl.style.transition = 'none'; coinEl.style.transform = 'rotateY(0deg)';

  setTimeout(() => {
    coinEl.style.transition = 'transform 1.6s cubic-bezier(0.15, 0.85, 0.35, 1.2)';
    const isMyFirst = (firstRole === myRole);
    coinEl.style.transform = `rotateY(${isMyFirst ? 2160 : 2340}deg)`;

    setTimeout(() => {
      resultText.innerText = isMyFirst ? "あなたは【先攻】です！" : "あなたは【後攻】です！（樹液コイン獲得）";
      setTimeout(() => { modal.classList.add('hidden'); if (callback && isHost) callback(); }, 1200);
    }, 1600);
  }, 50);
}

function playAttackBugEffect(defenderId, damageText, isDestroyed, isCritical, element = 'red') {
  let targetCardEl = document.querySelector(`.card[data-card-id="${defenderId}"]`);
  if (targetCardEl) {
    playAttackVfx(targetCardEl, element);
    showDamageEffect(targetCardEl, damageText, isCritical);
    if (isDestroyed) shatterCard(targetCardEl);
  }
}

function playSummonImpactByCardId(cardId) {
  let targetCardEl = document.querySelector(`.card[data-card-id="${cardId}"]`);
  if (targetCardEl) showSummonImpactEffect(targetCardEl);
}

function log(msg) {
  const logEl = document.getElementById('log');
  if (logEl) logEl.innerText = msg;
}

// --- メインレンダラー ---
function render() {
  let isMyTurn = G.turn === myRole, me = G.players[myRole];
  let oppRole = myRole === 'host' ? 'guest' : 'host', opp = G.players[oppRole];

  const myAvEl = document.getElementById('my-avatar-img'), oppAvEl = document.getElementById('opp-avatar-img');
  if (myAvEl) { myAvEl.src = me.avatar || DEFAULT_FALLBACK_SVG; myAvEl.onerror = function() { this.src = DEFAULT_FALLBACK_SVG; }; }
  if (oppAvEl) { oppAvEl.src = opp.avatar || DEFAULT_FALLBACK_SVG; oppAvEl.onerror = function() { this.src = DEFAULT_FALLBACK_SVG; }; }

  // マナテキスト更新
  const myManaText = document.getElementById('my-mana-text');
  if (myManaText) myManaText.innerText = `${me.mana} / ${me.maxMana}`;

  const oppManaText = document.getElementById('opp-mana-text');
  if (oppManaText) oppManaText.innerText = `${opp.mana} / ${opp.maxMana}`;

  document.getElementById('my-deck').innerText = me.deck.length;
  document.getElementById('opp-deck').innerText = opp.deck.length;
  document.getElementById('opp-hand-count').innerText = opp.hand.length;

  const btnEnd = document.getElementById('btn-end-turn');
  if (btnEnd) btnEnd.disabled = !isMyTurn || G.gameOver;

  renderTerritory('my-territory', me.territory.length);
  renderTerritory('opp-territory', opp.territory.length);

  // マナジュエル表示の更新
  renderManaJewels('my-food', me.mana, me.maxMana);
  renderManaJewels('opp-food', opp.mana, opp.maxMana);

  // 手札
  const handEl = document.getElementById('my-hand');
  if (handEl) {
    handEl.innerHTML = '';
    me.hand.forEach((card, idx) => {
      let cardEl = createCardEl(card, false);
      if (isMyTurn && ((card.ability !== 'coin' && me.mana >= card.cost && me.field.length < 5) || card.ability === 'coin') && !G.gameOver) {
        cardEl.classList.add('playable');
      }
      if (selectedHandIndex === idx) cardEl.classList.add('selected');

      attachCardInteraction(cardEl, card, () => {
        if (!isMyTurn || G.gameOver) return;
        selectedHandIndex = (selectedHandIndex === idx) ? null : idx;
        selectedAttackerCardId = null; clearTargetArrow();
        render(); toggleActionModal();
      });
      handEl.appendChild(cardEl);
    });
  }

  // 自分フィールド
  const myFieldEl = document.getElementById('my-field');
  if (myFieldEl) {
    myFieldEl.innerHTML = '';
    me.field.forEach(card => {
      let cardEl = createCardEl(card, false);
      if (card.id === selectedAttackerCardId) cardEl.classList.add('selected');
      attachCardInteraction(cardEl, card, () => {
        if (!isMyTurn || card.exhausted || G.gameOver) return;
        selectedAttackerCardId = (selectedAttackerCardId === card.id) ? null : card.id;
        selectedHandIndex = null;
        if (!selectedAttackerCardId) clearTargetArrow();
        toggleActionModal(); render();
      });
      myFieldEl.appendChild(cardEl);
    });
  }

  // 相手フィールド
  const oppFieldEl = document.getElementById('opp-field');
  if (oppFieldEl) {
    oppFieldEl.innerHTML = '';
    opp.field.forEach(card => {
      let cardEl = createCardEl(card, false);
      if (selectedAttackerCardId && !G.gameOver) cardEl.classList.add('targetable-hero');
      attachCardInteraction(cardEl, card, () => {
        if (selectedAttackerCardId && !G.gameOver) {
          if (targetedDefenderCardId !== card.id) {
            targetedDefenderCardId = card.id;
            if (typeof conn !== 'undefined' && conn && conn.open) conn.send({ type: 'TARGET_LOCK', attackerId: selectedAttackerCardId, defenderId: card.id });
            log(`🎯 [${card.name}]をロックオン！ もう一度タップで攻撃！`); render();
          } else {
            sendAction('ATTACK_BUG', { attackerId: selectedAttackerCardId, defenderId: card.id });
            selectedAttackerCardId = null; clearTargetArrow(); render();
          }
        }
      });
      oppFieldEl.appendChild(cardEl);
    });
  }

  // 相手本体攻撃
  const oppInfoBox = document.getElementById('opponent-info-box');
  if (oppInfoBox) {
    if (selectedAttackerCardId && !G.gameOver && opp.field.length === 0) {
      oppInfoBox.classList.add('targetable-hero');
      oppInfoBox.onclick = (e) => {
        e.stopPropagation();
        if (targetedDefenderCardId !== 'HERO') {
          targetedDefenderCardId = 'HERO';
          if (typeof conn !== 'undefined' && conn && conn.open) conn.send({ type: 'TARGET_LOCK', attackerId: selectedAttackerCardId, defenderId: 'HERO' });
          log(`🎯 相手本体をロックオン！ もう一度タップでダイレクトアタック！`); render();
        } else {
          sendAction('ATTACK_HERO', { attackerId: selectedAttackerCardId });
          selectedAttackerCardId = null; clearTargetArrow(); render();
        }
      };
    } else { oppInfoBox.classList.remove('targetable-hero'); oppInfoBox.onclick = null; }
  }

  updateTargetArrow();

  // リザルトモーダル
  const resultModal = document.getElementById('result-modal');
  if (resultModal) {
    if (G.gameOver && G.winner) {
      resultModal.classList.remove('hidden');
      document.getElementById('result-title').innerText = (G.winner === myRole) ? 'VICTORY' : 'DEFEAT';
      document.getElementById('result-msg').innerText = (G.winner === myRole) ? 'あなたの勝利です！' : '敗北しました...';
    } else { resultModal.classList.add('hidden'); }
  }
}

function renderTerritory(elementId, count) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    let t = document.createElement('div'); t.className = 'territory-card'; el.appendChild(t);
  }
}

function renderManaJewels(elementId, availableMana, maxMana) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < maxMana; i++) {
    let jewel = document.createElement('div');
    jewel.className = `emerald-jewel ${i >= availableMana ? 'used' : ''}`;
    jewel.title = `マナ (${availableMana}/${maxMana})`;
    el.appendChild(jewel);
  }
}

function createCardEl(card, isFood = false) {
  const el = document.createElement('div');
  
  const isEpic = (card.cost === 5);
  const isLegend = (card.cost >= 6);
  
  let holoClass = '';
  if (isLegend) {
    holoClass = 'holographic-legend';
  } else if (isEpic) {
    holoClass = 'holographic-epic';
  }

  el.className = `card ${card.element} ${card.exhausted ? 'exhausted' : ''} ${holoClass}`;
  if (card.id) el.dataset.cardId = card.id;

  const elemText = { red: '赤', blue: '青', green: '緑' }[card.element] || '';
  const abilityLabels = { taunt: "挑発", charge: "速攻", revenge: "道連れ", drain: "回復", draw: "1ドロー", coin: "コイン" };

  if (isFood) {
    el.innerHTML = `
      <div class="card-header">
        <div class="card-cost">${card.cost}</div>
        <div class="card-element">${elemText}</div>
      </div>
      <div class="card-img-container">
        <img class="card-img" src="${card.image}" alt="${card.name}">
      </div>
    `;
  } else {
    const maxHpVal = card.maxHp !== undefined ? card.maxHp : card.hp;
    const isHpDamaged = (card.hp < maxHpVal);
    const abilityHtml = card.ability ? `<div class="card-ability ${card.ability}">${abilityLabels[card.ability]}</div>` : `<div></div>`;

    el.innerHTML = `
      <div class="card-header">
        <div class="card-cost">${card.cost}</div>
        ${abilityHtml}
        <div class="card-element">${elemText}</div>
      </div>
      
      <div class="card-img-container">
        <img class="card-img" src="${card.image}" alt="${card.name}">
      </div>
      
      <div class="card-name">${card.name}</div>

      <div class="card-orb orb-atk" title="攻撃力">
        <span class="orb-val">${card.atk}</span>
      </div>
      
      <div class="card-orb orb-hp ${isHpDamaged ? 'damaged' : ''}" title="HP">
        <span class="orb-val">${card.hp}</span>
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
    let isFieldFull = G.players[myRole].field.length >= 5;
    document.getElementById('action-modal-card-name').innerText = `[${card.name}] の操作`;

    const btnFood = document.getElementById('btn-act-food');
    if (btnFood) btnFood.style.display = 'none';

    const btnPlay = document.getElementById('btn-act-play');
    if (card.ability === 'coin') {
      btnPlay.disabled = false;
      btnPlay.innerText = "使う (コスト+1)";
    } else {
      btnPlay.disabled = (G.players[myRole].mana < card.cost) || isFieldFull;
      btnPlay.innerText = isFieldFull ? "場に出す (上限5枚)" : "場に出す";
    }
  } else { modal.classList.add('hidden'); }
}

// --- UIイベント登録 ---
// ==========================================
// main.js (全体の起動制御とUIイベント)
// ==========================================

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
      if (!G.gameOver && G.turn === myRole) {
        selectedHandIndex = null;
        selectedAttackerCardId = null;
        clearTargetArrow();
        toggleActionModal();
        sendAction('END_TURN');
      }
    };
  }

  if (btnSurrender) {
    btnSurrender.onclick = () => {
      if (G.gameOver) return;
      if (confirm("本当にサレンダー（降参）しますか？")) {
        selectedHandIndex = null;
        selectedAttackerCardId = null;
        clearTargetArrow();
        toggleActionModal();
        sendAction('SURRENDER');
      }
    };
  }

  if (btnRematch) {
    btnRematch.onclick = () => {
      if (isVsCPU) {
        let cpuDeckNames = [];
        for (let i = 0; i < 25; i++) {
          cpuDeckNames.push(CARD_DATA[Math.floor(Math.random() * CARD_DATA.length)].name);
        }
        initGame(cpuDeckNames);
        render();
      } else {
        sendAction('REMATCH');
      }
    };
  }

  if (btnHome) {
    btnHome.onclick = () => {
      if (typeof conn !== 'undefined' && conn && conn.open) {
        conn.send({ type: 'LEAVE_GAME' });
      }
      location.reload();
    };
  }
}

function startApp() {
  loadCustomDeck();
  initAvatarSelection();
  initUIEvents();
  initBGMOnFirstTouch();
  initFireflies();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

function playHighCostSummonEffect(cardId, element) {
  const cardEl = document.querySelector(`.card[data-card-id="${cardId}"]`);
  if (!cardEl) return;

  const rect = cardEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  cardEl.classList.add('legend-card-landing');
  setTimeout(() => cardEl.classList.remove('legend-card-landing'), 500);

  const board = document.getElementById('game-board');
  if (board) {
    board.classList.add('legend-earthquake-shake');
    setTimeout(() => board.classList.remove('legend-earthquake-shake'), 600);
  }

  const anchor = document.createElement('div');
  anchor.className = 'vfx-card-anchor';
  anchor.style.left = centerX + 'px';
  anchor.style.top = centerY + 'px';

  const shockwave = document.createElement('div');
  shockwave.className = 'legend-ground-shockwave';
  
  if (element === 'red') {
    shockwave.style.borderColor = '#ff3300';
    shockwave.style.boxShadow = '0 0 20px #ff1100';
  } else if (element === 'blue') {
    shockwave.style.borderColor = '#38bdf8';
    shockwave.style.boxShadow = '0 0 20px #0284c7';
  } else {
    shockwave.style.borderColor = '#34d399';
    shockwave.style.boxShadow = '0 0 20px #10b981';
  }
  anchor.appendChild(shockwave);

  const auraEl = document.createElement('div');
  if (element === 'red') {
    auraEl.className = 'legend-aura-red';
  } else if (element === 'blue') {
    auraEl.className = 'legend-aura-blue';
  } else {
    auraEl.className = 'legend-aura-green';
  }
  anchor.appendChild(auraEl);

  document.body.appendChild(anchor);

  if (typeof triggerSE === 'function') {
    triggerSE('destroy');
  }

  setTimeout(() => {
    if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
  }, 750);
}