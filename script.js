document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. GESTION DES BULLES DE FOND (SÉCURISÉE)
    // ==========================================
    const bubblesContainer = document.getElementById('bubbles');
    function generateBubble() {
        if (!bubblesContainer) return;
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
    if (bubblesContainer) {
        setInterval(generateBubble, 450);
    }

    // Sélections DOM Authentification & Carte
    const authContainer = document.getElementById('auth-container');
    const mainApp = document.getElementById('main-app');
    const authUsernameInput = document.getElementById('auth-username');
    const authError = document.getElementById('auth-error');
    const btnLogin = document.getElementById('btn-login');
    const displayProfileName = document.getElementById('display-profile-name');
    const displayProfileAvatar = document.getElementById('display-profile-avatar');
    const btnLogout = document.getElementById('btn-logout');
    
    // Éléments interactifs internes de la carte d'inscription
    const currentAvatarView = document.getElementById('current-avatar-view');
    const avatarOptions = document.querySelectorAll('.avatar-opt');

    // Variables de session
    let myUsername = "";
    let myAvatar = "🐢"; // Valeur par défaut
    let socket = null;
    let onlinePlayers = [];

    // Éléments restants (Mini-jeux / Salons)
    const btnStartClicker = document.getElementById('btn-start-clicker');
    const selectDifficulty = document.getElementById('select-difficulty');
    const clickerArena = document.getElementById('clicker-arena');
    const clickerScoreDisplay = document.getElementById('clicker-score');
    const clickerTimerDisplay = document.getElementById('clicker-timer');
    const inviteSearchInput = document.getElementById('invite-search-username');
    const btnSendInvite = document.getElementById('btn-send-invite');
    const inviteStatus = document.getElementById('invite-status');
    const leaderboardUl = document.getElementById('leaderboard-ul');
    const leaderboardSearchFilter = document.getElementById('leaderboard-search-filter');
    const arenaMatchWrapper = document.getElementById('arena-match-wrapper');
    const matchMyScoreDisplay = document.getElementById('match-my-score');
    const matchOppScoreDisplay = document.getElementById('match-opp-score');
    const matchTimerDisplay = document.getElementById('match-timer');
    const matchClickerArena = document.getElementById('match-clicker-arena');

    // ==========================================
    // 2. ANIMATION ET CHOIX DE L'AVATAR (CARD)
    // ==========================================
    avatarOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            avatarOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            
            myAvatar = opt.dataset.emoji;
            if (currentAvatarView) {
                currentAvatarView.textContent = myAvatar;
                // Petit effet de rebond lors du changement
                currentAvatarView.style.transform = 'scale(1.15)';
                setTimeout(() => currentAvatarView.style.transform = 'scale(1)', 250);
            }
        });
    });

    // ==========================================
    // 3. PERSISTANCE DE LA SESSION LOCALSTORAGE
    // ==========================================
    const savedName = localStorage.getItem('oceania_pseudo');
    const savedAvatar = localStorage.getItem('oceania_avatar');
    if (savedName) {
        if (savedAvatar) myAvatar = savedAvatar;
        initMultiplayer(savedName);
    }

    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            if (!authUsernameInput) return;
            const username = authUsernameInput.value.trim().toLowerCase().replace(/\s+/g, '');
            
            if (username.length < 3) {
                if (authError) authError.textContent = "Le nom doit contenir au moins 3 caractères !";
                return;
            }
            localStorage.setItem('oceania_avatar', myAvatar);
            initMultiplayer(username);
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('oceania_pseudo');
            localStorage.removeItem('oceania_avatar');
            location.reload();
        });
    }

    // ==========================================
    // 4. CONNEXION RÉSEAU & TRANSMISSION AVATAR
    // ==========================================
    function initMultiplayer(username) {
        myUsername = username;
        localStorage.setItem('oceania_pseudo', username);
        
        if (authContainer) authContainer.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        
        if (displayProfileName) displayProfileName.textContent = myUsername.toUpperCase();
        if (displayProfileAvatar) displayProfileAvatar.textContent = myAvatar;

        // Connexion au relais central
        socket = new WebSocket('wss://demo.piesocket.com/v3/channel_oceania_2026?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3YfV0w9IpIskB&notify_self=0');

        socket.onopen = () => {
            // On envoie notre pseudo ET notre totem choisi aux autres connectés
            sendNetMessage("ping_presence", { user: myUsername, avatar: myAvatar });
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
            // Trouver si le joueur est déjà répertorié
            const existing = onlinePlayers.find(p => p.name === msg.user);
            if (!existing && msg.user !== myUsername) {
                onlinePlayers.push({ name: msg.user, avatar: msg.avatar || "🐢" });
                updatePlayersList();
            }
            sendNetMessage("reply_presence", { target: msg.user, user: myUsername, avatar: myAvatar });
        }

        if (msg.type === "reply_presence" && msg.target === myUsername) {
            const existing = onlinePlayers.find(p => p.name === msg.user);
            if (!existing) {
                onlinePlayers.push({ name: msg.user, avatar: msg.avatar || "🐢" });
                updatePlayersList();
            }
        }

        // Système d'invitations et de duels
        if (msg.type === "invite_request" && msg.target === myUsername) {
            const incomingInviteBox = document.getElementById('incoming-invite-box');
            const challengerName = document.getElementById('challenger-name');
            const btnAcceptMatch = document.getElementById('btn-accept-match');
            const btnRefuseMatch = document.getElementById('btn-refuse-match');

            if (challengerName) challengerName.textContent = msg.from.toUpperCase();
            if (incomingInviteBox) incomingInviteBox.classList.remove('hidden');
            
            if (btnAcceptMatch) {
                btnAcceptMatch.onclick = () => {
                    if (incomingInviteBox) incomingInviteBox.classList.add('hidden');
                    sendNetMessage("invite_response", { target: msg.from, from: myUsername, status: "accepted" });
                    setupMultiplayerGame(msg.from, false);
                };
            }
            if (btnRefuseMatch) {
                btnRefuseMatch.onclick = () => {
                    if (incomingInviteBox) incomingInviteBox.classList.add('hidden');
                    sendNetMessage("invite_response", { target: msg.from, from: myUsername, status: "refused" });
                };
            }
        }

        if (msg.type === "invite_response" && msg.target === myUsername) {
            if (msg.status === "accepted") {
                if (inviteStatus) { inviteStatus.style.color = "#2ed573"; inviteStatus.textContent = "Défi accepté !"; }
                setupMultiplayerGame(msg.from, true);
            } else {
                if (inviteStatus) { inviteStatus.style.color = "#ff4757"; inviteStatus.textContent = `${msg.from} a fui.`; }
            }
        }

        if (msg.type === "score_update" && msg.target === myUsername) {
            oppScore = msg.score;
            if (matchOppScoreDisplay) matchOppScoreDisplay.textContent = oppScore;
        }

        if (msg.type === "timer_sync" && msg.target === myUsername) {
            if (matchTimerDisplay) matchTimerDisplay.textContent = msg.time + "s";
            if (msg.time <= 0) cleanEndMultiplayerMatch(msg.from);
        }
    }

    // ==========================================
    // 5. AFFICHAGE DE LA LISTE DES SURFEURS LOBBY
    // ==========================================
    function updatePlayersList() {
        if (!leaderboardUl) return;
        const filterQuery = leaderboardSearchFilter ? leaderboardSearchFilter.value.trim().toLowerCase() : "";
        leaderboardUl.innerHTML = "";

        const filtered = onlinePlayers.filter(p => p.name.includes(filterQuery));

        if (filtered.length === 0) {
            leaderboardUl.innerHTML = "<li style='color:#647b93; font-style:italic;'>Seul dans l'océan...</li>";
            return;
        }

        filtered.forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div><span style="font-size:1.2rem; margin-right:6px;">${player.avatar}</span> <strong>${player.name}</strong></div>
                <button class="btn-game" style="padding: 4px 10px; font-size: 0.8rem;" onclick="if(document.getElementById('invite-search-username')) document.getElementById('invite-search-username').value='${player.name}'">Cibler</button>
            `;
            leaderboardUl.appendChild(li);
        });
    }

    if (leaderboardSearchFilter) leaderboardSearchFilter.addEventListener('input', updatePlayersList);

    if (btnSendInvite) {
        btnSendInvite.addEventListener('click', () => {
            if (!inviteSearchInput) return;
            const target = inviteSearchInput.value.trim().toLowerCase();
            if (target === myUsername || target === "") return;
            sendNetMessage("invite_request", { target: target, from: myUsername });
        });
    }

    // ==========================================
    // 6. BLOC DE JEU EN DUEL MULTI (D'ORIGINE)
    // ==========================================
    let matchInterval = null;
    let spawnInterval = null;

    function setupMultiplayerGame(opponentName, isHost) {
        currentMatch = opponentName; myScore = 0; oppScore = 0;
        if (matchMyScoreDisplay) matchMyScoreDisplay.textContent = "0";
        if (matchOppScoreDisplay) matchOppScoreDisplay.textContent = "0";
        if (arenaMatchWrapper) arenaMatchWrapper.classList.remove('hidden');
        if (matchClickerArena) matchClickerArena.innerHTML = "";

        if (isHost) {
            let gameTime = 20; 
            matchInterval = setInterval(() => {
                gameTime--;
                sendNetMessage("timer_sync", { target: opponentName, from: myUsername, time: gameTime });
                if (matchTimerDisplay) matchTimerDisplay.textContent = gameTime + "s";
                if (gameTime <= 0) { clearInterval(matchInterval); cleanEndMultiplayerMatch(opponentName); }
            }, 1000);
        }

        spawnInterval = setInterval(() => {
            if (!matchClickerArena) return;
            const trash = document.createElement('div');
            trash.classList.add('ocean-entity');
            trash.textContent = '🍼';
            trash.style.left = `${Math.random() * 85 + 5}%`;
            trash.style.top = `${Math.random() * 70 + 15}%`;

            trash.addEventListener('mousedown', () => {
                myScore++;
                if (matchMyScoreDisplay) matchMyScoreDisplay.textContent = myScore;
                sendNetMessage("score_update", { target: opponentName, score: myScore });
                trash.remove();
            });
            matchClickerArena.appendChild(trash);
            setTimeout(() => { if(trash) trash.remove(); }, 1500);
        }, 600);
    }

    function cleanEndMultiplayerMatch(opponentName) {
        clearInterval(spawnInterval); clearInterval(matchInterval);
        alert(myScore > oppScore ? "🏆 Victoire !" : "💀 Défaite !");
        if (arenaMatchWrapper) arenaMatchWrapper.classList.add('hidden');
    }

    // Maintien du canal à jour
    setInterval(() => {
        if(myUsername) sendNetMessage("ping_presence", { user: myUsername, avatar: myAvatar });
    }, 4000);
});
