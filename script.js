document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. EFFET ARRIÈRE-PLAN : BULLES CONTINUES
    // ==========================================
    const bubblesContainer = document.getElementById('bubbles');
    function generateBubble() {
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


    // ==========================================
    // 2. SIMULATEUR D'IMPACT ÉCOLOGIQUE
    // ==========================================
    const rangePlastic = document.getElementById('range-plastic');
    const rangeTemp = document.getElementById('range-temp');
    const valPlastic = document.getElementById('val-plastic');
    const valTemp = document.getElementById('val-temp');
    const ecoAquarium = document.getElementById('eco-aquarium');
    const ecoStatus = document.getElementById('eco-status');
    const ecoCoral = document.getElementById('eco-coral');
    const ecoTurtle = document.getElementById('eco-turtle');

    function runSimulator() {
        const plastic = parseInt(rangePlastic.value);
        const temp = parseInt(rangeTemp.value);

        const plasticText = ["Faible", "Modérée", "Critique"];
        valPlastic.textContent = plasticText[plastic];
        valTemp.textContent = `+${temp}°C`;

        let coral = "🪸 Récif sain et coloré.";
        let faune = "🐢 Les tortues nagent en sécurité.";
        let status = "Intact ✓";
        let color = "#00d2ff";
        let bg = "rgba(2, 10, 22, 0.8)";

        if (plastic >= 1) faune = "⚠ Danger : Plastiques confondus avec des méduses.";
        if (plastic === 2) faune = "💀 Critique : Mort par ingestion de micro-plastiques.";
        if (temp === 1) coral = "🪸 Début de stress thermique (Pâleur).";
        if (temp >= 2) coral = "🪸 Blanchissement massif des coraux.";
        if (temp === 3) coral = "🪺 Récif mort, effondrement de la biodiversité.";

        if ((plastic + temp) >= 2) { status = "Menacé ⚠"; color = "#ff9f43"; bg = "rgba(35, 20, 5, 0.8)"; }
        if ((plastic + temp) >= 4) { status = "DANGER CRITIQUE 🚨"; color = "#ff5252"; bg = "rgba(35, 5, 10, 0.8)"; }

        ecoStatus.textContent = status;
        ecoStatus.style.color = color;
        ecoCoral.textContent = coral;
        ecoTurtle.textContent = faune;
        ecoAquarium.style.borderColor = color;
        ecoAquarium.style.backgroundColor = bg;
    }
    rangePlastic.addEventListener('input', runSimulator);
    rangeTemp.addEventListener('input', runSimulator);


    // ==========================================
    // 3. MINI-JEU 1 : LE NETTOYEUR & LEADERBOARD GLOBAL
    // ==========================================
    const btnStartClicker = document.getElementById('btn-start-clicker');
    const selectDifficulty = document.getElementById('select-difficulty');
    const clickerArena = document.getElementById('clicker-arena');
    const clickerScoreDisplay = document.getElementById('clicker-score');
    const clickerTimerDisplay = document.getElementById('clicker-timer');
    const leaderboardUl = document.getElementById('leaderboard-ul');
    const btnClearScores = document.getElementById('btn-clear-scores');
    const tabButtons = document.querySelectorAll('.tab-btn');

    let clickerScore = 0;
    let timeLeft = 0;
    let spawnIntervalId;
    let countdownIntervalId;
    let isPlaying = false;
    let gameDifficulty = 'medium'; 
    let currentActiveTab = 'easy'; // Difficultée affichée sur le tableau

    const trashItems = ['🍼', '🛍️', '🥤', '📦'];
    const creatureItems = ['🪼', '🐟', '🐠', '🦀', '🐙'];

    const difficultySettings = {
        easy: { time: 60, spawnRate: 950, speed: '5.5s' },
        medium: { time: 45, spawnRate: 650, speed: '4.0s' },
        hard: { time: 30, spawnRate: 350, speed: '2.1s' }
    };

    // Charger le leaderboard global filtré par l'onglet sélectionné
    function renderLeaderboard(difficultyFilter) {
        let allScores = JSON.parse(localStorage.getItem('oceanGlobalScores')) || [];
        
        // Filtrer uniquement pour la difficulté demandée
        let filteredScores = allScores.filter(item => item.diff === difficultyFilter);
        
        leaderboardUl.innerHTML = "";
        
        if (filteredScores.length === 0) {
            leaderboardUl.innerHTML = "<li style='color:#647b93; font-style:italic; font-size:0.9rem;'>Aucun score enregistré dans cette catégorie.</li>";
            return;
        }

        // Tri décroissant et affichage du top 5
        filteredScores.sort((a, b) => b.score - a.score);
        let topFive = filteredScores.slice(0, 5);

        topFive.forEach((entry, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div><span class="rank">#${index + 1}</span> ${entry.name}</div>
                <div class="highlight">${entry.score} pts</div>
            `;
            leaderboardUl.appendChild(li);
        });
    }

    // Sauvegarde globale
    function saveGlobalScore(name, score, diff) {
        let allScores = JSON.parse(localStorage.getItem('oceanGlobalScores')) || [];
        allScores.push({ name: name, score: score, diff: diff });
        localStorage.setItem('oceanGlobalScores', JSON.stringify(allScores));
        
        // Basculer l'affichage du leaderboard sur l'onglet correspondant à la partie jouée
        currentActiveTab = diff;
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.tab === diff) btn.classList.add('active');
        });
        renderLeaderboard(currentActiveTab);
    }

    // Gestion du clic sur les onglets du leaderboard
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentActiveTab = button.dataset.tab;
            renderLeaderboard(currentActiveTab);
        });
    });

    function spawnOceanEntity() {
        if (!isPlaying) return;
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
        entity.style.animationDuration = difficultySettings[gameDifficulty].speed;
        
        entity.addEventListener('mousedown', () => {
            if (entity.dataset.type === "trash") {
                clickerScore += 1;
            } else {
                clickerScore -= 2;
                entity.style.transform = "scale(1.4) rotate(15deg)";
            }
            clickerScoreDisplay.textContent = clickerScore;
            entity.remove();
        });

        clickerArena.appendChild(entity);
        setTimeout(() => entity.remove(), 6000);
    }

    function endGame() {
        isPlaying = false;
        clearInterval(spawnIntervalId);
        clearInterval(countdownIntervalId);
        
        btnStartClicker.disabled = false;
        selectDifficulty.disabled = false;
        btnStartClicker.textContent = "Relancer la mission";
        
        clickerArena.innerHTML = `
            <div id='game-welcome-msg'>
                <h3 style='color:#00d2ff; margin-bottom:5px;'>Temps écoulé ! ⏱️</h3>
                <p>Score récolté : <span class='highlight'>${clickerScore} points</span>.</p>
            </div>
        `;

        setTimeout(() => {
            const playerName = prompt(`Partie finie (${gameDifficulty.toUpperCase()}) ! Score : ${clickerScore} pts.\nEntrez votre pseudonyme :`);
            if (playerName && playerName.trim() !== "") {
                saveGlobalScore(playerName.trim(), clickerScore, gameDifficulty);
            }
        }, 300);
    }

    btnStartClicker.addEventListener('click', () => {
        isPlaying = true;
        clickerScore = 0;
        gameDifficulty = selectDifficulty.value;
        timeLeft = difficultySettings[gameDifficulty].time;

        btnStartClicker.disabled = true;
        selectDifficulty.disabled = true;
        btnStartClicker.textContent = "Nettoyage en cours...";
        
        clickerScoreDisplay.textContent = clickerScore;
        clickerTimerDisplay.textContent = `${timeLeft}s`;
        clickerArena.innerHTML = "";

        spawnIntervalId = setInterval(spawnOceanEntity, difficultySettings[gameDifficulty].spawnRate);
        countdownIntervalId = setInterval(() => {
            timeLeft--;
            clickerTimerDisplay.textContent = `${timeLeft}s`;
            if (timeLeft <= 0) endGame();
        }, 1000);
    });

    btnClearScores.addEventListener('click', () => {
        if(confirm("Voulez-vous effacer l'intégralité de la base de données des scores ?")) {
            localStorage.removeItem('oceanGlobalScores');
            renderLeaderboard(currentActiveTab);
        }
    });

    // Initialisation du premier tableau de vision (Facile par défaut)
    renderLeaderboard(currentActiveTab);


    // ==========================================
    // 4. MINI-JEU 2 : LE GRAND QUIZ ÉVOLUTIF (15 QUESTIONS)
    // ==========================================
    const quizDatabase = {
        easy: [
            { q: "Quel déchet trouve-t-on en masse sur les plages ?", o: ["Les bouteilles en verre", "Les mégots et plastiques", "Les restes de bois artificiels"], a: 1 },
            { q: "Quel animal marin est célèbre pour manger des sacs plastiques en pensant que ce sont des méduses ?", o: ["La tortue marine", "Le requin blanc", "L'étoile de mer"], a: 0 },
            { q: "D'où provient la majorité de la pollution plastique des océans ?", o: ["Des navires de croisière", "De la terre ferme (fleuves et rivières)", "Des plates-formes pétrolières"], a: 1 },
            { q: "Que signifie le sigle 'Zéro Déchet' dans la protection de la nature ?", o: ["Tout brûler", "Réduire, réutiliser et recycler au maximum", "Jeter dans des poubelles violettes"], a: 1 },
            { q: "Les coraux sont considérés comme des :", o: ["Animaux marins vivants", "Plantes aquatiques colorées", "Roches minérales décoratives"], a: 0 }
        ],
        medium: [
            { q: "Quel pourcentage de l'oxygène de notre planète est généré par les océans (le phytoplancton) ?", o: ["Environ 20%", "Environ 50%", "Plus de 90%"], a: 1 },
            { q: "Qu'appelle-t-on le '7ème continent' ?", o: ["Un nouvel archipel volcanique", "Une immense zone d'accumulation de plastiques dans le Pacifique", "La calotte glaciaire de l'Arctique"], a: 1 },
            { q: "Quelle est la cause principale du blanchissement destructeur des coraux ?", o: ["Le manque de poissons", "L'élévation de la température marine", "Le passage des sous-marins"], a: 1 },
            { q: "Combien de temps met une bouteille plastique standard pour se dégrader ?", o: ["Environ 10 ans", "Environ 150 ans", "Environ 450 ans"], a: 2 },
            { q: "Quel est l'impact des microplastiques sur les poissons ?", o: ["Ils les aident à flotter", "Ils s'accumulent dans leur corps et les empoisonnent", "Ils purifient leur estomac"], a: 1 }
        ],
        hard: [
            { q: "Quel phénomène physique est lié à l'absorption massive de $CO_2$ anthropique par l'océan ?", o: ["L'acidification des eaux", "La désalinisation des courants", "La désoxygénation totale"], a: 0 },
            { q: "Quelle technique de pêche commerciale détruit lourdement les fonds sédimentaires ?", o: ["La pêche à la ligne plombée", "Le chalutage de fond", "La pêche à la senne de surface"], a: 1 },
            { q: "Quel polluant invisible mais mortel perturbe l'écolocalisation des baleines ?", o: ["La pollution sonore des moteurs", "Les ondes radioélectriques", "La luminosité côtière"], a: 0 },
            { q: "Quel pourcentage des espèces marines dépend directement de la survie des récifs coralliens ?", o: ["Moins de 5%", "Environ 25%", "Près de 80%"], a: 1 },
            { q: "Qu'est-ce que le 'Vortex de déchets' ?", o: ["Une tempête de plastique", "Un puissant courant circulaire qui emprisonne les débris", "Un trou noir océanique"], a: 1 }
        ]
    };

    let quizLevelsOrder = ['easy', 'medium', 'hard'];
    let currentLevelIndex = 0; // 0=Easy, 1=Medium, 2=Hard
    let currentQuestionIndex = 0; // 0 à 4 par niveau
    let globalQuizScore = 0;

    const quizQuestion = document.getElementById('quiz-question');
    const quizOptions = document.getElementById('quiz-options');
    const quizBox = document.getElementById('quiz-box');
    const quizResults = document.getElementById('quiz-results');
    const quizFinalScore = document.getElementById('quiz-final-score');
    const btnRestartQuiz = document.getElementById('btn-restart-quiz');
    const quizLevelIndicator = document.getElementById('quiz-level-indicator');
    const quizProgressIndicator = document.getElementById('quiz-progress-indicator');

    function loadEvolutiveQuestion() {
        let currentLevelKey = quizLevelsOrder[currentLevelIndex];
        let questionsList = quizDatabase[currentLevelKey];

        // Vérifie si on a épuisé les questions du niveau en cours
        if (currentQuestionIndex >= questionsList.length) {
            currentLevelIndex++; // Passe au niveau suivant
            currentQuestionIndex = 0; // Reset l'index interne
            
            if (currentLevelIndex >= quizLevelsOrder.length) {
                // FIN ABSOLUE DU QUIZ (15 questions faites)
                showQuizResults();
                return;
            }
            currentLevelKey = quizLevelsOrder[currentLevelIndex];
            questionsList = quizDatabase[currentLevelKey];
        }

        // Mises à jour des libellés de l'interface
        let levelNamesHTML = { easy: "<span style='color:#2ed573;'>Facile</span>", medium: "<span style='color:#ff9f43;'>Moyen</span>", hard: "<span style='color:#ff4757;'>Difficile ⚡</span>" };
        quizLevelIndicator.innerHTML = `Niveau : ${levelNamesHTML[currentLevelKey]}`;
        quizProgressIndicator.textContent = `Question ${currentQuestionIndex + 1} / 5`;

        const activeQuestionData = questionsList[currentQuestionIndex];
        quizQuestion.textContent = activeQuestionData.q;
        quizOptions.innerHTML = "";

        activeQuestionData.o.forEach((option, idx) => {
            const button = document.createElement('button');
            button.classList.add('btn-option');
            button.textContent = option;
            button.addEventListener('click', () => handleQuizAnswer(button, idx, activeQuestionData.a));
            quizOptions.appendChild(button);
        });
    }

    function handleQuizAnswer(button, selectedIdx, correctIdx) {
        const allButtons = quizOptions.querySelectorAll('.btn-option');
        allButtons.forEach(btn => btn.style.pointerEvents = 'none'); // Bloque les clics simultanés

        if (selectedIdx === correctIdx) {
            globalQuizScore++;
            button.classList.add('correct-flash');
        } else {
            button.classList.add('wrong-flash');
            allButtons[correctIdx].classList.add('correct-flash');
        }

        setTimeout(() => {
            currentQuestionIndex++;
            loadEvolutiveQuestion();
        }, 1200);
    }

    function showQuizResults() {
        quizBox.classList.add('hidden');
        quizResults.classList.remove('hidden');
        quizFinalScore.textContent = globalQuizScore;

        let badge = "";
        if (globalQuizScore <= 5) badge = "Niveau : Apprenti Moussaillon 🌊. Continuez à vous informer !";
        else if (globalQuizScore <= 10) badge = "Niveau : Gardien de la Mer 🐬. Très bonnes connaissances !";
        else if (globalQuizScore < 15) badge = "Niveau : Défenseur des Océans 🐋. Excellent score !";
        else badge = "Niveau : Dieu Poséidon 🔱. Perfection absolue, l'océan vous remercie !";
        
        document.getElementById('quiz-badge').textContent = badge;
    }

    btnRestartQuiz.addEventListener('click', () => {
        currentLevelIndex = 0;
        currentQuestionIndex = 0;
        globalQuizScore = 0;
        quizResults.classList.add('hidden');
        quizBox.classList.remove('hidden');
        loadEvolutiveQuestion();
    });

    // Lancement du quiz au chargement
    loadEvolutiveQuestion();


    // ==========================================
    // 5. NAV MOBILE & SCROLL REVEAL
    // ==========================================
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section');
    const reveals = document.querySelectorAll('.reveal');

    burger.addEventListener('click', () => {
        nav.classList.toggle('nav-active');
        burger.classList.toggle('toggle');
    });

    window.addEventListener('scroll', () => {
        let currentId = '';
        const topOfWindow = window.innerHeight;

        reveals.forEach(el => {
            if (el.getBoundingClientRect().top < topOfWindow - 100) el.classList.add('active');
        });

        sections.forEach(sec => {
            if (pageYOffset >= (sec.offsetTop - sec.clientHeight / 3)) currentId = sec.getAttribute('id');
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(currentId)) link.classList.add('active');
        });
    });
});
