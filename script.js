document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // 1. GESTION DES BULLES DE FOND (SÉCURISÉE)
    // ==========================================
    var bubblesContainer = document.getElementById('bubbles');
    
    function generateBubble() {
        if (!bubblesContainer) { return; }
        
        var bubble = document.createElement('div');
        bubble.classList.add('bubble');
        var size = Math.random() * 20 + 6;
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = (Math.random() * 100) + '%';
        bubble.style.animationDuration = (Math.random() * 6 + 6) + 's';
        
        bubblesContainer.appendChild(bubble);
        
        setTimeout(function() {
            if (bubble) { bubble.remove(); }
        }, 10000);
    }
    
    if (bubblesContainer) {
        setInterval(generateBubble, 450);
    }

    // Sélections DOM Authentification & Carte
    var authContainer = document.getElementById('auth-container');
    var mainApp = document.getElementById('main-app');
    var authUsernameInput = document.getElementById('auth-username');
    var authError = document.getElementById('auth-error');
    var btnLogin = document.getElementById('btn-login');
    var displayProfileName = document.getElementById('display-profile-name');
    var displayProfileAvatar = document.getElementById('display-profile-avatar');
    var btnLogout = document.getElementById('btn-logout');
    
    // Éléments de la carte d'inscription
    var currentAvatarView = document.getElementById('current-avatar-view');
    var avatarOptions = document.querySelectorAll('.avatar-opt');

    // Variables de session
    var myUsername = "";
    var myAvatar = "🐢"; // Valeur par défaut
    var socket = null;
    var onlinePlayers = [];

    // Éléments des Mini-jeux & Lobby
    var btnStartClicker = document.getElementById('btn-start-clicker');
    var selectDifficulty = document.getElementById('select-difficulty');
    var clickerArena = document.getElementById('clicker-arena');
    var clickerScoreDisplay = document.getElementById('clicker-score');
    var clickerTimerDisplay = document.getElementById('clicker-timer');
    var inviteSearchInput = document.getElementById('invite-search-username');
    var btnSendInvite = document.getElementById('btn-send-invite');
    var inviteStatus = document.getElementById('invite-status');
    var leaderboardUl = document.getElementById('leaderboard-ul');
    var leaderboardSearchFilter = document.getElementById('leaderboard-search-filter');
    var arenaMatchWrapper = document.getElementById('arena-match-wrapper');
    var matchMyScoreDisplay = document.getElementById('match-my-score');
    var matchOppScoreDisplay = document.getElementById('match-opp-score');
    var matchTimerDisplay = document.getElementById('match-timer');
    var matchClickerArena = document.getElementById('match-clicker-arena');

    // Variables du mini-jeu solo
    var soloScore = 0;
    var soloTimeLeft = 0;
    var soloSpawnIntervalId = null;
    var soloCountdownIntervalId = null;
    var soloIsPlaying = false;
    var trashItems = ['🍼', '🛍️', '🥤', '📦'];
    var creatureItems = ['🪼', '🐟', '🐠', '🦀', '🐙'];
    var difficultySettings = {
        easy: { time: 60, spawnRate: 950 },
        medium: { time: 45, spawnRate: 650 },
        hard: { time: 30, spawnRate: 350 }
    };

    // Variables du duel réseau
    var currentMatch = null; 
    var myScore = 0;
    var oppScore = 0;
    var matchInterval = null;
    var spawnInterval = null;

    // ==========================================
    // 2. ANIMATION ET CHOIX DE L'AVATAR (CARD)
    // ==========================================
    avatarOptions.forEach(function(opt) {
        opt.addEventListener('click', function() {
            avatarOptions.forEach(function(o) { 
                o.classList.remove('active'); 
            });
            opt.classList.add('active');
            
            myAvatar = opt.getAttribute('data-emoji') || "🐢";
            if (currentAvatarView) {
                currentAvatarView.textContent = myAvatar;
                currentAvatarView.style.transform = 'scale(1.15)';
                setTimeout(function() {
                    currentAvatarView.style.transform = 'scale(1)';
                }, 250);
            }
        });
    });

    // ==========================================
    // 3. PERSISTANCE DE LA SESSION LOCALSTORAGE
    // ==========================================
    var savedName = localStorage.getItem('oceania_pseudo');
    var savedAvatar = localStorage.getItem('oceania_avatar');
    if (savedName) {
        if (savedAvatar) { myAvatar = savedAvatar; }
        initMultiplayer(savedName);
    }

    if (btnLogin) {
        btnLogin.addEventListener('click', function() {
            if (!authUsernameInput) { return; }
            var username = authUsernameInput.value.trim().toLowerCase().replace(/\s+/g, '');
            
            if (username.length < 3) {
                if (authError) { authError.textContent = "Le nom doit contenir au moins 3 caractères !"; }
                return;
            }
            localStorage.setItem('oceania_avatar', myAvatar);
            initMultiplayer(username);
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
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
        
        if (authContainer) { authContainer.classList.add('hidden'); }
        if (mainApp) { mainApp.classList.remove('hidden'); }
        
        if (displayProfileName) { displayProfileName.textContent = myUsername.toUpperCase(); }
        if (displayProfileAvatar) { displayProfileAvatar.textContent = myAvatar; }

        socket = new WebSocket('wss://demo.piesocket.com/v3/channel_oceania_2026?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3YfV0w9IpIskB&notify_self=0');

        socket.onopen = function() {
            sendNetMessage("ping_presence", { user: myUsername, avatar: myAvatar });
        };

        socket.onmessage = function(event) {
            try {
                var msg = JSON.parse(event.data);
                handleNetworkData(msg);
            } catch(e) { }
        };
    }

    function sendNetMessage(type, data) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            var payload = Object.assign({ type: type }, data);
            socket.send(JSON.stringify(payload));
        }
    }

    function handleNetworkData(msg) {
        if (msg.type === "ping_presence") {
            var found = false;
            for (var i = 0; i < onlinePlayers.length; i++) {
                if (onlinePlayers[i].name === msg.user) { found = true; break; }
            }
            if (!found && msg.user !== myUsername) {
                onlinePlayers.push({ name: msg.user, avatar: msg.avatar || "🐢" });
                updatePlayersList();
            }
            sendNetMessage("reply_presence", { target: msg.user, user: myUsername, avatar: myAvatar });
        }

        if (msg.type === "reply_presence" && msg.target === myUsername) {
            var foundReply = false;
            for (var j = 0; j < onlinePlayers.length; j++) {
                if (onlinePlayers[j].name === msg.user) { foundReply = true; break; }
            }
            if (!foundReply) {
                onlinePlayers.push({ name: msg.user, avatar: msg.avatar || "🐢" });
                updatePlayersList();
            }
        }

        if (msg.type === "invite_request" && msg.target === myUsername) {
            var incomingInviteBox = document.getElementById('incoming-invite-box');
            var challengerName = document.getElementById('challenger-name');
            var btnAcceptMatch = document.getElementById('btn-accept-match');
            var btnRefuseMatch = document.getElementById('btn-refuse-match');

            if (challengerName) { challengerName.textContent = msg.from.toUpperCase(); }
            if (incomingInviteBox) { incomingInviteBox.classList.remove('hidden'); }
            
            if (btnAcceptMatch) {
                btnAcceptMatch.onclick = function() {
                    if (incomingInviteBox) { incomingInviteBox.classList.add('hidden'); }
                    sendNetMessage("invite_response", { target: msg.from, from: myUsername, status: "accepted" });
                    setupMultiplayerGame(msg.from, false);
                };
            }
            if (btnRefuseMatch) {
                btnRefuseMatch.onclick = function() {
                    if (incomingInviteBox) { incomingInviteBox.classList.add('hidden'); }
                    sendNetMessage("invite_response", { target: msg.from, from: myUsername, status: "refused" });
                };
            }
        }

        if (msg.type === "invite_response" && msg.target === myUsername) {
            if (msg.status === "accepted") {
                if (inviteStatus) { inviteStatus.style.color = "#2ed573"; inviteStatus.textContent = "Défi accepté !"; }
                setupMultiplayerGame(msg.from, true);
            } else {
                if (inviteStatus) { inviteStatus.style.color = "#ff4757"; inviteStatus.textContent = msg.from + " a décliné."; }
            }
        }

        if (msg.type === "score_update" && msg.target === myUsername) {
            oppScore = msg.score;
            if (matchOppScoreDisplay) { matchOppScoreDisplay.textContent = oppScore; }
        }

        if (msg.type === "timer_sync" && msg.target === myUsername) {
            if (matchTimerDisplay) { matchTimerDisplay.textContent = msg.time + "s"; }
            if (msg.time <= 0) { cleanEndMultiplayerMatch(msg.from); }
        }
    }

    // ==========================================
    // 5. AFFICHAGE DE LA LISTE DES JOUEURS
    // ==========================================
    function updatePlayersList() {
        if (!leaderboardUl) { return; }
        var filterQuery = leaderboardSearchFilter ? leaderboardSearchFilter.value.trim().toLowerCase() : "";
        leaderboardUl.innerHTML = "";

        var count = 0;
        for (var i = 0; i < onlinePlayers.length; i++) {
            var player = onlinePlayers[i];
            if (player && player.name && player.name.toLowerCase().indexOf(filterQuery) !== -1) {
                count++;
                var li = document.createElement('li');
                li.innerHTML = '<div><span style="font-size:1.2rem; margin-right:6px;">' + (player.avatar || "🐢") + '</span> <strong>' + player.name + '</strong></div>' +
                               '<button class="btn-game" style="padding: 4px 10px; font-size: 0.8rem;" id="target-btn-' + i + '">Cibler</button>';
                leaderboardUl.appendChild(li);

                (function(name) {
                    var btn = document.getElementById('target-btn-' + i);
                    if (btn) {
                        btn.onclick = function() {
                            if (inviteSearchInput) { inviteSearchInput.value = name; }
                        };
                    }
                })(player.name);
            }
        }

        if (count === 0) {
            leaderboardUl.innerHTML = "<li style='color:#647b93; font-style:italic;'>Seul dans l'océan...</li>";
        }
    }

    if (leaderboardSearchFilter) {
        leaderboardSearchFilter.addEventListener('input', updatePlayersList);
    }

    if (btnSendInvite) {
        btnSendInvite.addEventListener('click', function() {
            if (!inviteSearchInput) { return; }
            var target = inviteSearchInput.value.trim().toLowerCase();
            if (target === myUsername || target === "") { return; }
            sendNetMessage("invite_request", { target: target, from: myUsername });
        });
    }

    // ==========================================
    // 6. BLOC DE JEU EN DUEL MULTIJOUEUR
    // ==========================================
    function setupMultiplayerGame(opponentName, isHost) {
        currentMatch = opponentName; myScore = 0; oppScore = 0;
        if (matchMyScoreDisplay) { matchMyScoreDisplay.textContent = "0"; }
        if (matchOppScoreDisplay) { matchOppScoreDisplay.textContent = "0"; }
        if (arenaMatchWrapper) { arenaMatchWrapper.classList.remove('hidden'); }
        if (matchClickerArena) { matchClickerArena.innerHTML = ""; }

        if (isHost) {
            var gameTime = 20; 
            matchInterval = setInterval(function() {
                gameTime--;
                sendNetMessage("timer_sync", { target: opponentName, from: myUsername, time: gameTime });
                if (matchTimerDisplay) { matchTimerDisplay.textContent = gameTime + "s"; }
                if (gameTime <= 0) { clearInterval(matchInterval); cleanEndMultiplayerMatch(opponentName); }
            }, 1000);
        }

        spawnInterval = setInterval(function() {
            if (!matchClickerArena) { return; }
            var trash = document.createElement('div');
            trash.classList.add('ocean-entity');
            trash.textContent = '🍼';
            trash.style.left = (Math.random() * 85 + 5) + '%';
            trash.style.top = (Math.random() * 70 + 15) + '%';

            trash.addEventListener('mousedown', function() {
                myScore++;
                if (matchMyScoreDisplay) { matchMyScoreDisplay.textContent = myScore; }
                sendNetMessage("score_update", { target: opponentName, score: myScore });
                trash.remove();
            });
            matchClickerArena.appendChild(trash);
            setTimeout(function() { if(trash) { trash.remove(); } }, 1500);
        }, 600);
    }

    function cleanEndMultiplayerMatch(opponentName) {
        clearInterval(spawnInterval); 
        clearInterval(matchInterval);
        alert(myScore > oppScore ? "🏆 Victoire !" : "💀 Défaite !");
        if (arenaMatchWrapper) { arenaMatchWrapper.classList.add('hidden'); }
    }

    // ==========================================
    // 7. MINI-JEU 1 : LE NETTOYEUR (SOLO)
    // ==========================================
    function spawnSoloEntity() {
        if (!soloIsPlaying || !clickerArena) return;
        var entity = document.createElement('div');
        entity.classList.add('ocean-entity');
        
        var isTrash = Math.random() < 0.6;
        if (isTrash) {
            entity.textContent = trashItems[Math.floor(Math.random() * trashItems.length)];
            entity.setAttribute('data-type', "trash");
        } else {
            entity.textContent = creatureItems[Math.floor(Math.random() * creatureItems.length)];
            entity.setAttribute('data-type', "creature");
        }
        
        entity.style.left = (Math.random() * 88 + 4) + '%';
        entity.style.top = (Math.random() * 70 + 15) + '%';
        
        entity.addEventListener('mousedown', function() {
            if (entity.getAttribute('data-type') === "trash") {
                soloScore += 1;
            } else {
                soloScore -= 2;
            }
            if (clickerScoreDisplay) { clickerScoreDisplay.textContent = soloScore; }
            entity.remove();
        });

        clickerArena.appendChild(entity);
        setTimeout(function() { if(entity) { entity.remove(); } }, 2000);
    }

    function endSoloGame() {
        soloIsPlaying = false;
        clearInterval(soloSpawnIntervalId);
        clearInterval(soloCountdownIntervalId);
        if (btnStartClicker) {
            btnStartClicker.disabled = false;
            btnStartClicker.textContent = "Relancer Mission Solo";
        }
        if (clickerArena) {
            clickerArena.innerHTML = "<div id='game-welcome-msg'><h3>Temps écoulé ! ⏱️</h3><p>Score final : " + soloScore + " points.</p></div>";
        }
    }

    if (btnStartClicker) {
        btnStartClicker.addEventListener('click', function() {
            soloIsPlaying = true;
            soloScore = 0;
            var diff = selectDifficulty ? selectDifficulty.value : "medium";
            soloTimeLeft = difficultySettings[diff].time;

            btnStartClicker.disabled = true;
            btnStartClicker.textContent = "Nettoyage...";
            if (clickerScoreDisplay) { clickerScoreDisplay.textContent = soloScore; }
            if (clickerTimerDisplay) { clickerTimerDisplay.textContent = soloTimeLeft + "s"; }
            if (clickerArena) { clickerArena.innerHTML = ""; }

            soloSpawnIntervalId = setInterval(spawnSoloEntity, difficultySettings[diff].spawnRate);
            soloCountdownIntervalId = setInterval(function() {
                soloTimeLeft--;
                if (clickerTimerDisplay) { clickerTimerDisplay.textContent = soloTimeLeft + "s"; }
                if (soloTimeLeft <= 0) { endSoloGame(); }
            }, 1000);
        });
    }

    // ==========================================
    // 8. PANNEAU ADMIN DRAGGABLE SÉCURISÉ
    // ==========================================
    var btnAdminLock = document.getElementById('btn-admin-lock');
    var adminPanel = document.getElementById('admin-panel');
    var btnCloseAdmin = document.getElementById('btn-close-admin');
    var adminPanelHeader = document.getElementById('admin-panel-header');
    var resetScoresBtn = document.getElementById('reset-scores-btn');

    if (btnAdminLock) {
        btnAdminLock.addEventListener('click', function() {
            var code = prompt("Entrez le code administrateur :");
            if (code === "1234" && adminPanel) { adminPanel.classList.remove('hidden'); }
            else if (code !== null) { alert("Code erroné !"); }
        });
    }

    if (btnCloseAdmin && adminPanel) {
        btnCloseAdmin.addEventListener('click', function() { adminPanel.classList.add('hidden'); });
    }

    if (resetScoresBtn) {
        resetScoresBtn.addEventListener('click', function() {
            if(confirm("Voulez-vous vider vos données locales ?")) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    var isDragging = false, offsetX, offsetY;
    if (adminPanelHeader && adminPanel) {
        adminPanelHeader.addEventListener('mousedown', function(e) {
            isDragging = true;
            offsetX = e.clientX - adminPanel.offsetLeft;
            offsetY = e.clientY - adminPanel.offsetTop;
        });
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            adminPanel.style.left = (e.clientX - offsetX) + 'px';
            adminPanel.style.top = (e.clientY - offsetY) + 'px';
        });
        document.addEventListener('mouseup', function() { isDragging = false; });
    }

    // Signal de présence constant
    setInterval(function() {
        if (myUsername) { sendNetMessage("ping_presence", { user: myUsername, avatar: myAvatar }); }
    }, 4000);
});
