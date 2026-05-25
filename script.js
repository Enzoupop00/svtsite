document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. EFFET ARRIÈRE-PLAN : BULLES (CONSERVÉ)
    // ==========================================
    const bubblesContainer = document.getElementById('bubbles');
    function generateBubble() {
        if(!bubblesContainer) return;
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        const size = Math.random() * 20 + 6;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 6 + 6}s`;
        bubblesContainer.appendChild(bubble);
        setTimeout(() => bubble.remove(), 10000);
    }
    setInterval(generateBubble, 450);

    // Éléments du DOM d'Authentification / Sessions
    const authContainer = document.getElementById('auth-container');
    const mainApp = document.getElementById('main-app');
    const authUsernameInput = document.getElementById('auth-username');
    const authError = document.getElementById('auth-error');
    const btnLogin = document.getElementById('btn-login');
    const displayProfileName = document.getElementById('display-profile-name');
    const btnLogout = document.getElementById('btn-logout');

    // Éléments Mini-jeu Solo d'origine
    const btnStartClicker = document.getElementById('btn-start-clicker');
    const selectDifficulty = document.getElementById('select-difficulty');
    const clickerArena = document.getElementById('clicker-arena');
    const clickerScoreDisplay = document.getElementById('clicker-score');
    const clickerTimerDisplay = document.getElementById('clicker-timer');

    // Éléments Réseau / Lobby
    const inviteSearchInput = document.getElementById('invite-search-username');
    const btnSendInvite = document.getElementById('btn-send-invite');
    const inviteStatus = document.getElementById('invite-status');
    const incomingInviteBox = document.getElementById('incoming-invite-box');
    const challengerName = document.getElementById('challenger-name');
    const btnAcceptMatch = document.getElementById('btn-accept-match');
    const btnRefuseMatch = document.getElementById('btn-refuse-match');
    const leaderboardUl = document.getElementById('leaderboard-ul');
    const leaderboardSearchFilter = document.getElementById('leaderboard-search-filter');

    // Éléments Match Multi
    const arenaMatchWrapper = document.getElementById('arena-match-wrapper');
    const matchMyScoreDisplay = document.getElementById('match-my-score');
    const matchOppScoreDisplay = document.getElementById('match-opp-score');
    const matchTimerDisplay = document.getElementById('match-timer');
    const matchClickerArena = document.getElementById('match-clicker-arena');

    // Variables globales
    let myUsername = "";
    let socket = null;
    let onlinePlayers = [];
    let currentMatch = null; 
    let myScore = 0;
    let oppScore = 0;
    let matchInterval = null;
    let spawnInterval = null;

    // Variables du Jeu Solo d'origine
    let soloScore = 0;
    let soloTimeLeft = 0;
    let soloSpawnIntervalId;
    let soloCountdownIntervalId;
    let soloIsPlaying = false;
    const trashItems = ['🍼', '🛍️', '🥤', '📦'];
    const creatureItems = ['🪼', '🐟', '🐠', '🦀', '🐙'];
    const difficultySettings = {
        easy: { time: 60, spawnRate: 950 },
        medium: { time: 45, spawnRate: 650 },
        hard: { time: 30, spawnRate: 350 }
    };

    // ==========================================
    // 2. PERSISTANCE DE CONNEXION AUTOMATIQUE
    // ==========================================
    const savedName = localStorage.getItem('oceania_pseudo');
    if (savedName) {
        initMultiplayer(savedName);
    }

    btnLogin.addEventListener('click', () => {
        const username = authUsernameInput.value.trim().toLowerCase().replace(/\s+/g, '');
        if (username.length < 3) {
            authError.textContent = "Votre pseudo doit faire au moins 3 caractères !";
            return;
        }
        initMultiplayer(username);
    });

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('oceania_pseudo');
        location.reload();
    });

    // ==========================================
    // 3. LOGIQUE RÉSEAU (RELAY PUBLIC WEBSOCKET)
    // ==========================================
    function initMultiplayer(username) {
        myUsername = username;
        localStorage.setItem('oceania_pseudo', username);
        
        authContainer.classList.add('hidden');
        mainApp.classList.remove('hidden');
        displayProfileName.textContent = myUsername.toUpperCase();

        // Connexion au réseau libre partagé
        socket = new WebSocket('wss://demo.piesocket.com/v3/channel_oceania_2026?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3YfV0w9IpIskB&notify_self=0');

        socket.onopen = () => {
            sendNetMessage("ping_presence", { user: myUsername });
        };

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleNetworkData(msg);
            } catch(e) { }
        };
    }

    function sendNetMessage(type, data) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: type, ...data }));
        }
    }

    function handleNetworkData(msg) {
        if (msg.type === "ping_presence") {
            if (!onlinePlayers.includes(msg.user) && msg.user !== myUsername) {
                onlinePlayers.push(msg.user);
                updatePlayersList();
            }
            sendNetMessage("reply_presence", { target: msg.user, user: myUsername });
        }

        if (msg.type === "reply_presence" && msg.target === myUsername) {
            if (!onlinePlayers.includes(msg.user)) {
                onlinePlayers.push(msg.user);
                updatePlayersList();
            }
        }

        if (msg.type === "invite_request" && msg.target === myUsername) {
            challengerName.textContent = msg.from.toUpperCase();
            incomingInviteBox.classList.remove('hidden');
            
            btnAcceptMatch.onclick = () => {
                incomingInviteBox.classList.add('hidden');
                sendNetMessage("invite_response", { target: msg.from, from: myUsername, status: "accepted" });
                setupMultiplayerGame(msg.from, false);
            };

            btnRefuseMatch.onclick = () => {
                incomingInviteBox.classList.add('hidden');
                sendNetMessage("invite_response", { target: msg.from, from: myUsername, status: "refused" });
            };
        }

        if (msg.type === "invite_response" && msg.target === myUsername) {
            if (msg.status === "accepted") {
                inviteStatus.style.color = "#2ed573";
                inviteStatus.textContent = "Match accepté ! Lancement de l'arène...";
                setupMultiplayerGame(msg.from, true);
            } else {
                inviteStatus.style.color = "#ff4757";
                inviteStatus.textContent = `${msg.from} a décliné le combat.`;
            }
        }

        if (msg.type === "score_update" && msg.target === myUsername) {
            oppScore = msg.score;
            matchOppScoreDisplay.textContent = oppScore;
        }

        if (msg.type === "timer_sync" && msg.target === myUsername) {
            matchTimerDisplay.textContent = msg.time + "s";
            if (msg.time <= 0) cleanEndMultiplayerMatch(msg.from);
        }
    }

    // ==========================================
    // 4. SYSTÈME DE FILTRE DE RECHERCHE DU LOBBY
    // ==========================================
    function updatePlayersList() {
        const filterQuery = leaderboardSearchFilter.value.trim().toLowerCase();
        leaderboardUl.innerHTML = "";

        const filtered = onlinePlayers.filter(name => name.includes(filterQuery));

        if (filtered.length === 0) {
            leaderboardUl.innerHTML = "<li style='color:#647b93; font-style:italic; font-size:0.9rem;'>Aucun éco-citoyen connecté avec ce pseudo...</li>";
            return;
        }

        filtered.forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div><span style="color:#2ed573; margin-right:5px;">🟢</span> ${player}</div>
                <button class="btn-game" style="padding: 4px 10px; font-size: 0.8rem;" onclick="document.getElementById('invite-search-username').value='${player}'">Sélectionner</button>
            `;
            leaderboardUl.appendChild(li);
        });
    }

    leaderboardSearchFilter.addEventListener('input', updatePlayersList);

    btnSendInvite.addEventListener('click', () => {
        const target = inviteSearchInput.value.trim().toLowerCase();
        if (target === myUsername) {
            inviteStatus.style.color = "#ff4757";
            inviteStatus.textContent = "Vous ne pouvez pas vous inviter vous-même !";
            return;
        }
        if(target === "") return;
        inviteStatus.style.color = "#ff9f43";
        inviteStatus.textContent = `Invitation envoyée à ${target}...`;
        sendNetMessage("invite_request", { target: target, from: myUsername });
    });

    // ==========================================
    // 5. FONCTIONNEMENT DU DUEL MULTIJOUEUR
    // ==========================================
    function setupMultiplayerGame(opponentName, isHost) {
        currentMatch = opponentName;
        myScore = 0;
        oppScore = 0;
        matchMyScoreDisplay.textContent = "0";
        matchOppScoreDisplay.textContent = "0";
        arenaMatchWrapper.classList.remove('hidden');
        matchClickerArena.innerHTML = "";

        if (isHost) {
            let gameTime = 20; 
            matchInterval = setInterval(() => {
                gameTime--;
                sendNetMessage("timer_sync", { target: opponentName, from: myUsername, time: gameTime });
                matchTimerDisplay.textContent = gameTime + "s";
                if (gameTime <= 0) {
                    clearInterval(matchInterval);
                    cleanEndMultiplayerMatch(opponentName);
                }
            }, 1000);
        }

        spawnInterval = setInterval(() => {
            const trash = document.createElement('div');
            trash.classList.add('ocean-entity');
            trash.textContent = '🍼';
            trash.style.left = `${Math.random() * 85 + 5}%`;
            trash.style.top = `${Math.random() * 70 + 15}%`;

            trash.addEventListener('mousedown', () => {
                myScore++;
                matchMyScoreDisplay.textContent = myScore;
                sendNetMessage("score_update", { target: opponentName, score: myScore });
                trash.remove();
            });

            matchClickerArena.appendChild(trash);
            setTimeout(() => trash.remove(), 1500);
        }, 600);
    }

    function cleanEndMultiplayerMatch(opponentName) {
        clearInterval(spawnInterval);
        clearInterval(matchInterval);
        
        let msg = "";
        if (myScore > oppScore) msg = `🏆 Victoire contre ${opponentName} (${myScore} - ${oppScore}) ! 🎉`;
        else if (myScore < oppScore) msg = `💀 Défaite face à ${opponentName} (${myScore} - ${oppScore}).`;
        else msg = `⚖️ Égalité parfaite (${myScore} partout) !`;

        alert(msg);
        arenaMatchWrapper.classList.add('hidden');
        inviteSearchInput.value = "";
        inviteStatus.textContent = "";
    }

    // ==========================================
    // 6. MINI-JEU 1 : LE NETTOYEUR (CONSERVÉ SOLO DIRECT)
    // ==========================================
    function spawnSoloEntity() {
        if (!soloIsPlaying) return;
        const entity = document.createElement('div');
        entity.classList.add('ocean-entity');
        
        const isTrash = Math.random() < 0.6;
        if (isTrash) {
            entity.textContent = trashItems[Math.floor(Math.random() * trashItems.length)];
            entity.dataset.type = "trash";
        } else {
            entity.textContent = creatureItems[Math.floor(Math.random() * creatureItems.length)];
            entity.dataset.type = "creature";
        }
        
        entity.style.left = `${Math.random() * 88 + 4}%`;
        entity.style.top = `${Math.random() * 70 + 15}%`;
        
        entity.addEventListener('mousedown', () => {
            if (entity.dataset.type === "trash") {
                soloScore += 1;
            } else {
                soloScore -= 2;
            }
            clickerScoreDisplay.textContent = soloScore;
            entity.remove();
        });

        clickerArena.appendChild(entity);
        setTimeout(() => entity.remove(), 2000);
    }

    function endSoloGame() {
        soloIsPlaying = false;
        clearInterval(soloSpawnIntervalId);
        clearInterval(soloCountdownIntervalId);
        btnStartClicker.disabled = false;
        btnStartClicker.textContent = "Relancer Mission Solo";
        clickerArena.innerHTML = `<div id='game-welcome-msg'><h3>Temps écoulé ! ⏱️</h3><p>Score final : ${soloScore} points.</p></div>`;
    }

    btnStartClicker.addEventListener('click', () => {
        soloIsPlaying = true;
        soloScore = 0;
        const diff = selectDifficulty.value;
        soloTimeLeft = difficultySettings[diff].time;

        btnStartClicker.disabled = true;
        btnStartClicker.textContent = "Nettoyage en cours...";
        clickerScoreDisplay.textContent = soloScore;
        clickerTimerDisplay.textContent = soloTimeLeft + "s";
        clickerArena.innerHTML = "";

        soloSpawnIntervalId = setInterval(spawnSoloEntity, difficultySettings[diff].spawnRate);
        soloCountdownIntervalId = setInterval(() => {
            soloTimeLeft--;
            clickerTimerDisplay.textContent = soloTimeLeft + "s";
            if (soloTimeLeft <= 0) endSoloGame();
        }, 1000);
    });

    // ==========================================
    // 7. SECURE PANNEAU ADMIN DRAGGABLE (CONSERVÉ)
    // ==========================================
    const btnAdminLock = document.getElementById('btn-admin-lock');
    const adminPanel = document.getElementById('admin-panel');
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    const adminPanelHeader = document.getElementById('admin-panel-header');
    const resetScoresBtn = document.getElementById('reset-scores-btn');

    btnAdminLock.addEventListener('click', () => {
        const code = prompt("Entrez le code administrateur :");
        if (code === "1234") adminPanel.classList.remove('hidden');
        else if (code !== null) alert("Code erroné !");
    });

    btnCloseAdmin.addEventListener('click', () => adminPanel.classList.add('hidden'));
    resetScoresBtn.addEventListener('click', () => {
        if(confirm("Voulez-vous vider vos données locales ?")) {
            localStorage.clear();
            location.reload();
        }
    });

    let isDragging = false, offsetX, offsetY;
    adminPanelHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - adminPanel.offsetLeft;
        offsetY = e.clientY - adminPanel.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        adminPanel.style.left = `${e.clientX - offsetX}px`;
        adminPanel.style.top = `${e.clientY - offsetY}px`;
    });
    document.addEventListener('mouseup', () => isDragging = false);

    // Maintien de la visibilité sur la liste des joueurs
    setInterval(() => {
        if(myUsername) sendNetMessage("ping_presence", { user: myUsername });
    }, 4000);
});
