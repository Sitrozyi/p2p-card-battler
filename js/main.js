// ==========================================
// main.js (起動エントリー ＆ イベントリスナー)
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