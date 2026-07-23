// --- BGM 設定 ---
const BGM_PATH = 'music/1.mp3';
let bgmAudio = new Audio(BGM_PATH);
bgmAudio.loop = true;
bgmAudio.volume = 0.4;
let isBgmPlaying = false;

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

window.toggleBGM = function() {
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

// 🌋 自分の盤面テーマ設定 🌋
let currentBiome = 'forest';

window.changeBiome = function(biomeKey) {
  currentBiome = biomeKey;
  if (G && G.players && G.players[myRole]) {
    G.players[myRole].biome = biomeKey;
    sendState();
  }
};

// 💬 エモート機能 💬
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
  if (conn && conn.open) {
    conn.send({ type: 'EMOTE', text: text });
  }
};

function showEmoteBubble(elementId, text) {
  const bubble = document.getElementById(elementId);
  if (!bubble) return;
  bubble.innerText = text;
  bubble.classList.remove('hidden');

  setTimeout(() => {
    bubble.classList.add('hidden');
  }, 2200);
}

// 🚩 ターン開始バナー演出 🚩
function showTurnBanner(isMyTurn) {
  const banner = document.getElementById('turn-banner');
  const textEl = document.getElementById('turn-banner-text');
  if (!banner || !textEl) return;

  textEl.innerText = isMyTurn ? "次はあなたの番です" : "相手の番です";
  banner.classList.remove('hidden');

  setTimeout(() => {
    banner.classList.add('hidden');
  }, 1350);
}

// 💥 属性別攻撃VFX（赤=火/爪痕、青=水/波紋、緑=風/旋風） 💥
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

  setTimeout(() => {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 500);
}

// 💥 演出用エフェクト（ダメージ＆振動＆CRITICAL） 💥
function showDamageEffect(targetEl, text, isCritical = false) {
  if (!targetEl) return;

  targetEl.classList.add('card-hit-shake');
  setTimeout(() => targetEl.classList.remove('card-hit-shake'), 380);

  const rect = targetEl.getBoundingClientRect();

  if (isCritical) {
    const critEl = document.createElement('div');
    critEl.className = 'critical-popup';
    critEl.innerText = "⚡ CRITICAL 2x!!";
    critEl.style.left = (rect.left + rect.width / 2) + 'px';
    critEl.style.top = (rect.top - 15) + 'px';
    document.body.appendChild(critEl);

    setTimeout(() => {
      if (critEl.parentNode) critEl.parentNode.removeChild(critEl);
    }, 900);
  }

  const dmgEl = document.createElement('div');
  dmgEl.className = 'damage-popup';
  dmgEl.innerText = text;

  dmgEl.style.left = (rect.left + rect.width / 2) + 'px';
  dmgEl.style.top = (rect.top + rect.height / 3) + 'px';

  document.body.appendChild(dmgEl);

  setTimeout(() => {
    if (dmgEl.parentNode) dmgEl.parentNode.removeChild(dmgEl);
  }, 850);
}

// 💥 大型カード召喚インパクト 💥
function showSummonImpactEffect(targetEl) {
  if (!targetEl) return;

  const board = document.getElementById('game-board');
  if (board) {
    board.classList.add('screen-impact-shake');
    setTimeout(() => board.classList.remove('screen-impact-shake'), 450);
  }

  const rect = targetEl.getBoundingClientRect();
  const wave = document.createElement('div');
  wave.className = 'summon-shockwave';
  wave.style.left = (rect.left + rect.width / 2) + 'px';
  wave.style.top = (rect.top + rect.height / 2) + 'px';

  document.body.appendChild(wave);

  setTimeout(() => {
    if (wave.parentNode) wave.parentNode.removeChild(wave);
  }, 650);
}

// 💥 破片砕け散る演出 💥
function shatterCard(targetEl) {
  if (!targetEl) return;

  const rect = targetEl.getBoundingClientRect();
  targetEl.classList.add('card-shattering');

  const particleCount = 14;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'shatter-particle';

    const colors = ['#e63946', '#ffb703', '#d4af37', '#1a1a1a', '#8b0000'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    const px = rect.left + Math.random() * rect.width;
    const py = rect.top + Math.random() * rect.height;
    particle.style.left = px + 'px';
    particle.style.top = py + 'px';

    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 70;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance + 20;
    const rot = (Math.random() - 0.5) * 720;

    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--rot', `${rot}deg`);

    document.body.appendChild(particle);

    setTimeout(() => {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 650);
  }
}

// 🏆 フィニッシュ (決着) ど派手カットイン 🏆
function triggerFinishCutin(winnerRole) {
  const overlay = document.getElementById('finish-cutin');
  const avatarImg = document.getElementById('finish-avatar-img');
  const textTitle = document.getElementById('finish-text-title');

  if (!overlay || !avatarImg || !textTitle) return;

  const winnerPlayer = G.players[winnerRole];
  if (winnerPlayer && winnerPlayer.avatar) {
    avatarImg.src = winnerPlayer.avatar;
  } else {
    avatarImg.src = DEFAULT_FALLBACK_SVG;
  }

  const isWinner = winnerRole === myRole;
  textTitle.innerText = isWinner ? "VICTORY" : "DEFEAT";

  overlay.classList.remove('hidden');

  setTimeout(() => {
    overlay.classList.add('hidden');
    render();
  }, 2200);
}

// 🎨★ 超強化！上下分割バイオーム描画キャンバス ＆ リアルアニメーション ★🎨
let topParticles = [], bottomParticles = [];
let topFishGroup = { active: false, x: -100, y: 0, speed: 2 };
let bottomFishGroup = { active: false, x: -100, y: 0, speed: 2 };
let topLavaBubbles = [], bottomLavaBubbles = [];
let animTime = 0;
let isCanvasLoopRunning = false;

function initFireflies() {
  const canvas = document.getElementById('firefly-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const board = document.getElementById('game-board');
    if (board) {
      canvas.width = board.clientWidth || window.innerWidth;
      canvas.height = board.clientHeight || window.innerHeight;
    }
  }

  resizeCanvas();
  setTimeout(resizeCanvas, 100);
  window.addEventListener('resize', resizeCanvas);

  topParticles = Array.from({ length: 4 }, () => createBiomeParticle(canvas, true));
  bottomParticles = Array.from({ length: 4 }, () => createBiomeParticle(canvas, false));

  function createBiomeParticle(c, isTop) {
    const minY = isTop ? 0 : c.height / 2;
    const maxY = isTop ? c.height / 2 : c.height;
    return {
      x: Math.random() * c.width,
      y: minY + Math.random() * (maxY - minY),
      radius: Math.random() * 3 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      speedAlpha: Math.random() * 0.01 + 0.004,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.4 - 0.2
    };
  }

  if (isCanvasLoopRunning) return;
  isCanvasLoopRunning = true;

  function loop() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animTime += 0.012;

    let oppRole = myRole === 'host' ? 'guest' : 'host';
    let oppBiome = (G.players[oppRole] && G.players[oppRole].biome) ? G.players[oppRole].biome : 'forest';
    let myBiome = (G.players[myRole] && G.players[myRole].biome) ? G.players[myRole].biome : 'forest';

    const midY = canvas.height / 2;

    // 1. 画面上部 (相手バイオーム)
    drawZoneBiome(ctx, canvas, 0, midY, oppBiome, topParticles, topFishGroup, topLavaBubbles, true);

    // 2. 画面下部 (自分バイオーム)
    drawZoneBiome(ctx, canvas, midY, midY, myBiome, bottomParticles, bottomFishGroup, bottomLavaBubbles, false);

    requestAnimationFrame(loop);
  }

  function drawZoneBiome(ctx, canvas, startY, height, biome, particleArray, fishObj, lavaBubbleArray, isTop) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, startY, canvas.width, height);
    ctx.clip();

    const endY = startY + height;

    // 🔴 背景色の描画 (Canvas自身にグラデーションを直接描画して完全に透過・発光させる)
    const bgGrad = ctx.createLinearGradient(0, startY, 0, endY);
    if (biome === 'ocean') {
      bgGrad.addColorStop(0, 'rgba(8, 30, 48, 0.95)');
      bgGrad.addColorStop(1, 'rgba(3, 15, 26, 0.98)');
    } else if (biome === 'lava') {
      bgGrad.addColorStop(0, 'rgba(50, 10, 10, 0.95)');
      bgGrad.addColorStop(1, 'rgba(20, 2, 2, 0.98)');
    } else { // forest
      bgGrad.addColorStop(0, 'rgba(16, 32, 20, 0.95)');
      bgGrad.addColorStop(1, 'rgba(6, 16, 8, 0.98)');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, startY, canvas.width, height);

    // 🌳 1. 深夜の森林: 風でそよぐ草木シルエット ＆ 蛍の光
    if (biome === 'forest') {
      // 🌿 揺れる影草木シルエットを描画
      ctx.fillStyle = '#040b06';
      ctx.beginPath();
      ctx.moveTo(0, endY);

      for (let x = 0; x <= canvas.width + 20; x += 25) {
        const sway = Math.sin(animTime * 1.8 + x * 0.05) * 14;
        const grassH = 35 + Math.sin(x * 0.1) * 12;

        ctx.quadraticCurveTo(x + sway / 2, endY - grassH / 2, x + sway, endY - grassH);
        ctx.quadraticCurveTo(x + sway + 5, endY - grassH / 2, x + 25, endY);
      }
      ctx.closePath();
      ctx.fill();

      // フォグ感
      const fogGrad = ctx.createRadialGradient(canvas.width/2, startY + height/2, 10, canvas.width/2, startY + height/2, canvas.width*0.6);
      fogGrad.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
      fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, startY, canvas.width, height);
    }

    // 🌊 2. 深海の池: 魚群スイミング ＆ 水中光線 ＆ 透過バブル
    if (biome === 'ocean') {
      // 揺らめく水中レイ (屈折光)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      for (let i = 0; i < 3; i++) {
        const rayX = (canvas.width / 3) * i + Math.sin(animTime + i) * 30;
        ctx.beginPath();
        ctx.moveTo(rayX, startY);
        ctx.lineTo(rayX + 60, endY);
        ctx.lineTo(rayX + 110, endY);
        ctx.lineTo(rayX + 20, startY);
        ctx.closePath();
        ctx.fill();
      }

      // 🐟 魚群の泳ぎアニメーション
      if (!fishObj.active && Math.random() < 0.01) {
        fishObj.active = true;
        fishObj.x = -120;
        fishObj.y = startY + Math.random() * (height - 60) + 30;
        fishObj.speed = 2.2 + Math.random() * 1.2;
      }

      if (fishObj.active) {
        fishObj.x += fishObj.speed;
        ctx.fillStyle = '#020b14';

        for (let i = 0; i < 6; i++) {
          const fx = fishObj.x - (i % 3) * 22 - Math.floor(i / 3) * 12;
          const fy = fishObj.y + (i % 2 === 0 ? 1 : -1) * (i * 7) + Math.sin(animTime * 3 + i) * 6;
          const tailSway = Math.sin(animTime * 10 + i) * 6;

          // 魚の体
          ctx.beginPath();
          ctx.ellipse(fx, fy, 11, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // 尾びれ
          ctx.beginPath();
          ctx.moveTo(fx - 10, fy);
          ctx.lineTo(fx - 18, fy - 6 + tailSway);
          ctx.lineTo(fx - 18, fy + 6 + tailSway);
          ctx.closePath();
          ctx.fill();
        }

        if (fishObj.x > canvas.width + 150) fishObj.active = false;
      }
    }

    // 🌋 3. 灼熱の溶岩: どろどろマグマ流体 ＆ 気泡爆発ポッピング
    if (biome === 'lava') {
      // どろどろ流れるマグマ波
      ctx.fillStyle = '#220404';
      ctx.beginPath();
      ctx.moveTo(0, endY);

      for (let x = 0; x <= canvas.width + 10; x += 15) {
        const waveY = endY - 18 - Math.sin(animTime * 2 + x * 0.03) * 8 - Math.cos(animTime * 1.5 + x * 0.05) * 5;
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(canvas.width, endY);
      ctx.closePath();
      ctx.fill();

      // マグマ表面のネオン発光縁
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ef4444';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 💥 マグマ気泡ポッピング (ブクブク膨らんで弾ける)
      if (Math.random() < 0.02) {
        lavaBubbleArray.push({
          x: Math.random() * canvas.width,
          y: endY - 18,
          r: 2,
          maxR: Math.random() * 8 + 5
        });
      }

      lavaBubbleArray.forEach((b, idx) => {
        b.r += 0.4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffedd5';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 弾けた瞬間に火花散る
        if (b.r >= b.maxR) {
          for (let p = 0; p < 2; p++) {
            particleArray.push({
              x: b.x,
              y: b.y,
              radius: Math.random() * 2 + 1,
              alpha: 0.9,
              speedAlpha: -0.03,
              vx: (Math.random() - 0.5) * 2,
              vy: -(Math.random() * 2 + 1)
            });
          }
          lavaBubbleArray.splice(idx, 1);
        }
      });
    }

    // 粒子描画 (蛍 / 透過水泡 / 火の粉)
    particleArray.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += p.speedAlpha;

      if (p.alpha <= 0.05 || p.alpha >= 0.8) p.speedAlpha *= -1;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < startY) p.y = startY + height;
      if (p.y > startY + height) p.y = startY;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(0.85, p.alpha));

      if (biome === 'ocean') { // 水泡
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (biome === 'lava') { // 火の粉
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.3 ? '#f97316' : '#ef4444';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f97316';
        ctx.fill();
      } else { // 蛍
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.5 ? '#fef08a' : '#10b981';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
        ctx.fill();
      }
      ctx.restore();
    });

    ctx.restore();
  }

  loop();
}

// 🎯 スタイリッシュターゲットアロー (SVG描画 ＆ 通信同期) 🎯
let targetedDefenderCardId = null;
let remoteLock = { attackerId: null, defenderId: null };

function drawTargetArrow(attackerEl, targetEl) {
  const pathEl = document.getElementById('arrow-path');
  const svgEl = document.getElementById('target-arrow-svg');
  if (!pathEl || !svgEl || !attackerEl || !targetEl) return;

  const svgRect = svgEl.getBoundingClientRect();
  const rect1 = attackerEl.getBoundingClientRect();
  const rect2 = targetEl.getBoundingClientRect();

  const x1 = rect1.left + rect1.width / 2 - svgRect.left;
  const y1 = rect1.top + rect1.height / 2 - svgRect.top;
  const x2 = rect2.left + rect2.width / 2 - svgRect.left;
  const y2 = rect2.top + rect2.height / 2 - svgRect.top;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = (x1 + x2) / 2 - dy * 0.25;
  const cy = (y1 + y2) / 2 + dx * 0.25;

  pathEl.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
  pathEl.classList.remove('hidden');
}

function clearTargetArrowVisualOnly() {
  const pathEl = document.getElementById('arrow-path');
  if (pathEl) {
    pathEl.setAttribute('d', '');
    pathEl.classList.add('hidden');
  }
  document.querySelectorAll('.targeted-lock-on').forEach(el => el.classList.remove('targeted-lock-on'));
}

function clearTargetArrow() {
  targetedDefenderCardId = null;
  remoteLock = { attackerId: null, defenderId: null };
  clearTargetArrowVisualOnly();

  if (conn && conn.open) {
    conn.send({ 
      type: 'TARGET_LOCK', 
      attackerId: null, 
      defenderId: null 
    });
  }
}

function updateTargetArrow() {
  if (selectedAttackerCardId && targetedDefenderCardId) {
    const attackerEl = document.querySelector(`.card[data-card-id="${selectedAttackerCardId}"]`);
    const defenderEl = (targetedDefenderCardId === 'HERO')
      ? document.getElementById('opponent-info-box')
      : document.querySelector(`.card[data-card-id="${targetedDefenderCardId}"]`);

    document.querySelectorAll('.targeted-lock-on').forEach(el => el.classList.remove('targeted-lock-on'));

    if (attackerEl && defenderEl) {
      defenderEl.classList.add('targeted-lock-on');
      drawTargetArrow(attackerEl, defenderEl);
    } else {
      clearTargetArrowVisualOnly();
    }
  } 
  else if (remoteLock.attackerId && remoteLock.defenderId) {
    const attackerEl = document.querySelector(`.card[data-card-id="${remoteLock.attackerId}"]`);
    let defenderEl = null;

    if (remoteLock.defenderId === 'HERO') {
      defenderEl = document.querySelector('#my-area .player-info');
    } else {
      defenderEl = document.querySelector(`.card[data-card-id="${remoteLock.defenderId}"]`);
    }

    document.querySelectorAll('.targeted-lock-on').forEach(el => el.classList.remove('targeted-lock-on'));

    if (attackerEl && defenderEl) {
      defenderEl.classList.add('targeted-lock-on');
      drawTargetArrow(attackerEl, defenderEl);
    } else {
      clearTargetArrowVisualOnly();
    }
  } 
  else {
    clearTargetArrowVisualOnly();
  }
}

window.addEventListener('resize', updateTargetArrow);

// 🔍 スマホ対応カードタッチ・長押し 🔍
function attachCardInteraction(cardEl, cardData, clickHandler) {
  let longPressTimer = null;
  let isLongPress = false;

  const startPress = () => {
    isLongPress = false;
    longPressTimer = setTimeout(() => {
      isLongPress = true;
      openCardPreview(cardData);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 350);
  };

  const cancelPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  cardEl.addEventListener('touchstart', startPress, { passive: true });
  cardEl.addEventListener('touchend', (e) => {
    cancelPress();
    if (isLongPress) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
  cardEl.addEventListener('touchmove', cancelPress);

  cardEl.addEventListener('mousedown', startPress);
  cardEl.addEventListener('mouseup', cancelPress);
  cardEl.addEventListener('mouseleave', cancelPress);

  cardEl.onclick = (e) => {
    e.stopPropagation();
    if (isLongPress) {
      isLongPress = false;
      return;
    }
    if (clickHandler) clickHandler(e);
  };
}

function openCardPreview(cardData) {
  const modal = document.getElementById('card-preview-modal');
  const container = document.getElementById('preview-card-container');
  const descEl = document.getElementById('preview-card-desc');

  if (!modal || !container || !descEl) return;

  container.innerHTML = '';
  let cardEl = createCardEl(cardData, false);
  container.appendChild(cardEl);

  const abilityDescs = {
    taunt: "【挑発】相手はこのカードしか攻撃・ダイレクトアタックできない。",
    charge: "【速攻】召喚したターンにすぐ攻撃できる。",
    revenge: "【道連れ】このカードが撃破された時、攻撃してきた相手も道連れで撃破する。",
    drain: "【回復】攻撃した時、自身のHPを+300回復する。",
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

// --- アバターデータ ---
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

// 🪙 後攻ボーナス用カード「樹液コイン」マスターデータ
const JUETI_COIN_CARD = {
  name: "樹液コイン",
  cost: 0,
  atk: 0,
  hp: 0,
  element: "green",
  ability: "coin",
  image: "images/jueki.jpg"
};

// --- マスターカードデータ ---
const CARD_DATA = [
  { name: "アリ",       cost: 1, atk: 400,  hp: 300,  element: "red",   ability: "draw",    image: "images/ant.jpg" },
  { name: "クワガタ",   cost: 2, atk: 500,  hp: 500,  element: "red",   ability: "taunt",   image: "images/kuwagata.jpg" },
  { name: "カブトムシ", cost: 3, atk: 600,  hp: 700,  element: "red",   ability: "taunt",   image: "images/kabuto.jpg" },
  { name: "スズメバチ", cost: 4, atk: 800,  hp: 900,  element: "red",   ability: "charge",  image: "images/suzu.jpg" },
  { name: "ムカデ",     cost: 5, atk: 1200, hp: 1000, element: "red",   ability: "revenge", image: "images/omu.jpg" },

  { name: "アメンボ",   cost: 1, atk: 200,  hp: 500,  element: "blue",  ability: "draw",    image: "images/amen.jpg" },
  { name: "ゲンゴロウ", cost: 2, atk: 400,  hp: 700,  element: "blue",  ability: "drain",   image: "images/gengo.jpg" },
  { name: "タガメ",     cost: 3, atk: 600,  hp: 1000, element: "blue",  ability: "taunt",   image: "images/tagame.png" },
  { name: "ミズカマキリ",cost: 4, atk: 900,  hp: 1500, element: "blue",  ability: "charge",  image: "images/mizu.png" },
  { name: "タランチュラ",cost: 5, atk: 1000, hp: 1800, element: "blue",  ability: "revenge", image: "images/tara.jpg" },

  { name: "バッタ",     cost: 1, atk: 300,  hp: 400,  element: "green", ability: "draw",    image: "images/bat.png" },
  { name: "キリギリス", cost: 2, atk: 500,  hp: 500,  element: "green", ability: "drain",   image: "images/ki.png" },
  { name: "カマキリ",   cost: 3, atk: 800,  hp: 800,  element: "green", ability: "charge",  image: "images/kama.png" },
  { name: "オニヤンマ", cost: 4, atk: 1000, hp: 1000, element: "green", ability: "revenge", image: "images/oni.png" },
  { name: "カミキリムシ", cost: 5, atk: 1200, hp: 1200, element: "green", ability: "taunt",   image: "images/kami.jpg" },
];

let myCustomDeckNames = [];

function loadCustomDeck() {
  const saved = localStorage.getItem('bug_game_custom_deck');
  if (saved) {
    try {
      myCustomDeckNames = JSON.parse(saved);
    } catch(e) {}
  }

  if (!myCustomDeckNames || myCustomDeckNames.length !== 20) {
    resetDeckToDefaultData();
  }
  updateLobbyDeckCount();
}

function resetDeckToDefaultData() {
  myCustomDeckNames = [];
  for (let i = 0; i < 20; i++) {
    myCustomDeckNames.push(CARD_DATA[i % CARD_DATA.length].name);
  }
  saveCustomDeck();
}

function saveCustomDeck() {
  localStorage.setItem('bug_game_custom_deck', JSON.stringify(myCustomDeckNames));
  updateLobbyDeckCount();
}

function updateLobbyDeckCount() {
  const el = document.getElementById('lobby-deck-count');
  if (el) el.innerText = myCustomDeckNames.length;
}

window.openDeckBuilder = function() {
  loadCustomDeck();
  renderDeckBuilder();
  const modal = document.getElementById('deck-builder-modal');
  if (modal) modal.classList.remove('hidden');
};

window.saveAndCloseDeckBuilder = function() {
  if (myCustomDeckNames.length !== 20) {
    alert("デッキはちょうど20枚にしてください！（現在 " + myCustomDeckNames.length + " 枚）");
    return;
  }
  saveCustomDeck();
  const modal = document.getElementById('deck-builder-modal');
  if (modal) modal.classList.add('hidden');
};

window.resetDeckToDefault = function() {
  if (confirm("標準の初期デッキに戻しますか？")) {
    resetDeckToDefaultData();
    renderDeckBuilder();
  }
};

function renderDeckBuilder() {
  const currentGrid = document.getElementById('current-deck-grid');
  const poolGrid = document.getElementById('card-pool-grid');
  const countEl = document.getElementById('deck-count-num');

  if (!currentGrid || !poolGrid) return;
  if (countEl) countEl.innerText = myCustomDeckNames.length;

  currentGrid.innerHTML = '';
  myCustomDeckNames.forEach((cardName, idx) => {
    const cardData = CARD_DATA.find(c => c.name === cardName) || CARD_DATA[0];
    let cardEl = createCardEl(cardData, false);
    cardEl.onclick = () => {
      myCustomDeckNames.splice(idx, 1);
      renderDeckBuilder();
    };
    currentGrid.appendChild(cardEl);
  });

  poolGrid.innerHTML = '';
  CARD_DATA.forEach(cardData => {
    let cardEl = createCardEl(cardData, false);
    const countInDeck = myCustomDeckNames.filter(n => n === cardData.name).length;

    cardEl.onclick = () => {
      if (myCustomDeckNames.length >= 20) {
        alert("デッキは20枚が上限です！");
        return;
      }
      if (countInDeck >= 3) {
        alert("同じカードは3枚までしか入れられません！");
        return;
      }
      myCustomDeckNames.push(cardData.name);
      renderDeckBuilder();
    };
    poolGrid.appendChild(cardEl);
  });
}

// --- 通信・ゲーム状態 ---
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
    host: { deck: [], hand: [], field: [], food: [], mana: 0, territory: [], avatar: '', biome: 'forest' },
    guest: { deck: [], hand: [], field: [], food: [], mana: 0, territory: [], avatar: '', biome: 'forest' }
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
  });
};

// 部屋参加関数
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

let lastRenderTurn = null;

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

// 🪙 ゲーム初期化 ＆ コインフリップ ＆ 後攻特典「樹液コイン」配布
function initGame(guestDeckNames = null) {
  let hostDeck = createDeckFromNames(myCustomDeckNames, 'host');
  let guestDeck = createDeckFromNames(guestDeckNames || myCustomDeckNames, 'guest');

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

  const firstRole = Math.random() < 0.5 ? 'host' : 'guest';
  const secondRole = (firstRole === 'host') ? 'guest' : 'host';

  G.players[secondRole].hand.push({
    ...JUETI_COIN_CARD,
    maxHp: 0,
    id: secondRole + '_jueki_coin'
  });

  showCoinFlipAnimation(firstRole, () => {
    G.turn = firstRole;
    startTurn(firstRole);
  });
}

function showCoinFlipAnimation(firstRole, callback) {
  const modal = document.getElementById('coin-modal');
  const resultText = document.getElementById('coin-result-text');
  if (!modal || !resultText) {
    if (callback) callback();
    return;
  }

  modal.classList.remove('hidden');
  resultText.innerText = "先攻後攻を決めています...";

  setTimeout(() => {
    const isMyFirst = (firstRole === myRole);
    resultText.innerText = isMyFirst ? "あなたは【先攻】です！" : "あなたは【後攻】です！（樹液コイン獲得）";

    setTimeout(() => {
      modal.classList.add('hidden');
      if (callback) callback();
    }, 1200);
  }, 1400);
}

function startTurn(role) {
  G.turn = role;
  G.foodSetThisTurn = false;
  clearTargetArrow();
  let p = G.players[role];
  
  if (p.deck.length > 0) {
    p.hand.push(p.deck.pop());
  }

  p.mana = p.food.length;
  p.field.forEach(c => {
    c.exhausted = false;
    c.hp = c.maxHp; 
  });

  showTurnBanner(role === myRole);
  lastRenderTurn = role;

  log(`${role === myRole ? 'あなた' : '相手'}のターン開始`);
  sendState();
}

function playAttackBugEffect(defenderId, damageText, isDestroyed, isCritical, element = 'red') {
  const cards = document.querySelectorAll('.card');
  let targetCardEl = null;

  cards.forEach(c => {
    if (c.dataset.cardId === defenderId) {
      targetCardEl = c;
    }
  });

  if (targetCardEl) {
    playAttackVfx(targetCardEl, element);
    showDamageEffect(targetCardEl, damageText, isCritical);

    if (isDestroyed) {
      shatterCard(targetCardEl);
    }
  }
}

function playSummonImpactByCardId(cardId) {
  const cards = document.querySelectorAll('.card');
  cards.forEach(c => {
    if (c.dataset.cardId === cardId) {
      showSummonImpactEffect(c);
    }
  });
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

        if (card.cost >= 5) {
          setTimeout(() => {
            playSummonImpactByCardId(card.id);
            if (conn && conn.open) {
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
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + 300);
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

function log(msg) {
  const logEl = document.getElementById('log');
  if (logEl) logEl.innerText = msg;
}

function render() {
  let isMyTurn = G.turn === myRole;
  let me = G.players[myRole];
  let oppRole = myRole === 'host' ? 'guest' : 'host';
  let opp = G.players[oppRole];

  const myAreaEl = document.getElementById('my-area');
  const oppAreaEl = document.getElementById('opponent-area');

  // エリア要素を透かしてCanvas背景を描画可能にする
  if (myAreaEl) myAreaEl.style.background = 'transparent';
  if (oppAreaEl) oppAreaEl.style.background = 'transparent';

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

  // 手札
  const handEl = document.getElementById('my-hand');
  if (handEl) {
    handEl.innerHTML = '';
    const handCount = me.hand.length;

    me.hand.forEach((card, idx) => {
      let cardEl = createCardEl(card, false);

      const canPlayNormal = (card.ability !== 'coin' && me.mana >= card.cost && me.field.length < 5);
      const canPlayCoin = (card.ability === 'coin');

      if (isMyTurn && (canPlayNormal || canPlayCoin) && !G.gameOver) {
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

      attachCardInteraction(cardEl, card, () => {
        if (!isMyTurn || G.gameOver) return;
        selectedHandIndex = (selectedHandIndex === idx) ? null : idx;
        selectedAttackerCardId = null;
        clearTargetArrow();
        render();
        toggleActionModal();
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
        
        if (!selectedAttackerCardId) {
          clearTargetArrow();
        }
        
        toggleActionModal();
        render();
      });

      myFieldEl.appendChild(cardEl);
    });
  }

  // 🎯 相手フィールド（ダブルタップ ＆ ターゲットアロー同期） 🎯
  const oppFieldEl = document.getElementById('opp-field');
  if (oppFieldEl) {
    oppFieldEl.innerHTML = '';
    opp.field.forEach(card => {
      let cardEl = createCardEl(card, false);

      if (selectedAttackerCardId && !G.gameOver) {
        cardEl.classList.add('targetable-hero');
      }

      attachCardInteraction(cardEl, card, () => {
        if (selectedAttackerCardId && !G.gameOver) {
          if (targetedDefenderCardId !== card.id) {
            targetedDefenderCardId = card.id;

            if (conn && conn.open) {
              conn.send({ 
                type: 'TARGET_LOCK', 
                attackerId: selectedAttackerCardId, 
                defenderId: card.id 
              });
            }

            log(`🎯 [${card.name}]をロックオン！ もう一度タップで攻撃！`);
            render();
          } 
          else {
            sendAction('ATTACK_BUG', { attackerId: selectedAttackerCardId, defenderId: card.id });
            selectedAttackerCardId = null;
            clearTargetArrow();
            render();
          }
        }
      });

      oppFieldEl.appendChild(cardEl);
    });
  }

  // 🎯 相手本体への攻撃（ダブルタップ ＆ ターゲットアロー同期） 🎯
  const oppInfoBox = document.getElementById('opponent-info-box');
  if (oppInfoBox) {
    if (selectedAttackerCardId && !G.gameOver && opp.field.length === 0) {
      oppInfoBox.classList.add('targetable-hero');
      oppInfoBox.onclick = (e) => {
        e.stopPropagation();

        if (targetedDefenderCardId !== 'HERO') {
          targetedDefenderCardId = 'HERO';

          if (conn && conn.open) {
            conn.send({ 
              type: 'TARGET_LOCK', 
              attackerId: selectedAttackerCardId, 
              defenderId: 'HERO' 
            });
          }

          log(`🎯 相手本体をロックオン！ もう一度タップでダイレクトアタック！`);
          render();
        } else {
          sendAction('ATTACK_HERO', { attackerId: selectedAttackerCardId });
          selectedAttackerCardId = null;
          clearTargetArrow();
          render();
        }
      };
    } else {
      oppInfoBox.classList.remove('targetable-hero');
      oppInfoBox.onclick = null;
    }
  }

  updateTargetArrow();

  // リザルト表示処理
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
    let jewel = document.createElement('div');
    jewel.className = `emerald-jewel ${idx >= availableMana ? 'used' : ''}`;
    jewel.title = `${card.name} (コスト:${card.cost})`;

    attachCardInteraction(jewel, card, () => {
      openCardPreview(card);
    });

    el.appendChild(jewel);
  });
}

function createCardEl(card, isFood = false) {
  const el = document.createElement('div');
  const isHolo = (card.cost >= 5);
  el.className = `card ${card.element} ${card.exhausted ? 'exhausted' : ''} ${isHolo ? 'holographic' : ''}`;
  el.dataset.cardId = card.id;
  
  const elemText = { red: '赤', blue: '青', green: '緑' }[card.element];

  const abilityLabels = {
    taunt: "挑発",
    charge: "速攻",
    revenge: "道連れ",
    drain: "回復",
    draw: "1ドロー",
    coin: "コイン"
  };

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
    const abilityHtml = card.ability 
      ? `<div class="card-ability ${card.ability}">${abilityLabels[card.ability]}</div>`
      : `<div></div>`;

    el.innerHTML = `
      <div class="card-header">
        <div class="card-cost">${card.cost}</div>
        ${abilityHtml}
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
    let isFieldFull = G.players[myRole].field.length >= 5;

    document.getElementById('action-modal-card-name').innerText = `[${card.name}] の操作`;

    if (card.ability === 'coin') {
      document.getElementById('btn-act-food').disabled = true;
      const btnPlay = document.getElementById('btn-act-play');
      btnPlay.disabled = false;
      btnPlay.innerText = "使う (コスト+1)";
    } else {
      document.getElementById('btn-act-food').disabled = G.foodSetThisTurn;
      const btnPlay = document.getElementById('btn-act-play');
      btnPlay.disabled = (G.players[myRole].mana < card.cost) || isFieldFull;
      btnPlay.innerText = isFieldFull ? "場に出す (上限5枚)" : "場に出す";
    }
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
      clearTargetArrow();
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
        clearTargetArrow();
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
  loadCustomDeck();
  initAvatarSelection();
  initUIEvents();
  initBGMOnFirstTouch();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}