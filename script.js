/* ==========================================
   STYLE DU SYSTÈME DE CARTE D'INSCRIPTION
   ========================================== */
.auth-card-wrapper {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    display: flex; justify-content: center; align-items: center;
    z-index: 5000;
    padding: 20px;
}

.auth-card {
    background: linear-gradient(135deg, rgba(6, 28, 56, 0.85) 0%, rgba(2, 12, 27, 0.95) 100%);
    border: 2px solid rgba(0, 210, 255, 0.35);
    border-radius: 24px;
    padding: 35px 30px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 210, 255, 0.15);
    backdrop-filter: blur(15px);
    position: relative;
    overflow: hidden;
    animation: cardEntrance 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes cardEntrance {
    from { transform: translateY(40px) scale(0.92); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
}

.auth-card::before {
    content: '';
    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(0, 210, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
}

.card-badge {
    position: absolute; top: 15px; right: 15px;
    background: rgba(0, 210, 255, 0.2);
    border: 1px solid #00d2ff;
    color: #00d2ff;
    font-size: 0.75rem;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.auth-card h2 {
    font-size: 2rem;
    color: #fff;
    text-align: left;
    margin-bottom: 8px;
    text-shadow: 0 2px 10px rgba(0, 210, 255, 0.3);
}

.card-subtitle {
    font-size: 0.9rem;
    color: #a2b7ca;
    line-height: 1.4;
    margin-bottom: 25px;
}

/* Section Avatar */
.avatar-preview-container {
    display: flex; justify-content: center; margin-bottom: 20px;
}

.avatar-circle {
    width: 80px; height: 80px;
    background: radial-gradient(circle, #0e3156 0%, #051429 100%);
    border: 3px solid #00d2ff;
    border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    font-size: 2.5rem;
    box-shadow: 0 0 20px rgba(0, 210, 255, 0.4);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.avatar-selector {
    margin-bottom: 25px;
}

.avatar-selector label {
    display: block; font-size: 0.85rem; color: #809bb3; margin-bottom: 8px; font-weight: 500;
}

.avatar-options {
    display: flex; justify-content: space-between; background: rgba(5, 18, 36, 0.6);
    padding: 8px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);
}

.avatar-opt {
    font-size: 1.6rem; cursor: pointer; padding: 5px; border-radius: 8px;
    transition: 0.2s; user-select: none;
}

.avatar-opt:hover { transform: scale(1.2); background: rgba(0, 210, 255, 0.15); }
.avatar-opt.active { background: rgba(0, 210, 255, 0.25); border: 1px solid #00d2ff; transform: scale(1.1); }

/* Formulaire Moderne Intégré */
.card-form { display: flex; flex-direction: column; gap: 20px; }

.input-group { position: relative; width: 100%; }

.input-group input {
    width: 100%; padding: 12px 5px;
    background: transparent; border: none;
    border-bottom: 2px solid rgba(0, 210, 255, 0.3);
    color: #fff; font-size: 1.1rem; outline: none; transition: 0.3s;
}

.input-group label {
    position: absolute; left: 5px; top: 12px; color: #6987a0;
    pointer-events: none; transition: 0.3s ease all; font-size: 1.05rem;
}

/* Effets Focus Input */
.input-group input:focus ~ label,
.input-group input:not(:placeholder-shown) ~ label {
    top: -12px; font-size: 0.85rem; color: #00d2ff; font-weight: bold;
}

.input-group input:focus { border-bottom-color: #00d2ff; }

/* Bouton Soumission Carte */
.btn-card-submit {
    position: relative; background: #00d2ff; color: #020c1b;
    border: none; padding: 15px; font-size: 1.05rem; font-weight: bold;
    border-radius: 12px; cursor: pointer; overflow: hidden; transition: 0.3s;
    box-shadow: 0 5px 15px rgba(0, 210, 255, 0.3);
}

.btn-card-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 210, 255, 0.5);
}

.error-msg { color: #ff4757; font-size: 0.85rem; font-weight: bold; text-align: center; min-height: 18px; }

/* Pilule de Profil Réduite (Navbar) */
.profile-pill {
    display: flex; align-items: center; background: rgba(5, 20, 39, 0.8);
    padding: 6px 12px; border-radius: 30px; border: 1px solid rgba(0, 210, 255, 0.2);
}

#btn-logout {
    background: rgba(255, 71, 87, 0.15); border: none; color: #ff4757;
    width: 24px; height: 24px; border-radius: 50%; display: flex;
    justify-content: center; align-items: center; font-weight: bold;
    cursor: pointer; margin-left: 10px; transition: 0.2s;
}
#btn-logout:hover { background: #ff4757; color: #fff; transform: scale(1.08); }
