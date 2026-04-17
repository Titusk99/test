<template>
  <div class="home">

    <!-- ══ HERO ══════════════════════════════════════════ -->
    <div class="hero">
      <div class="hero-content">
        <span class="hero-badge">100% étudiant · 100% gratuit</span>
        <h1>Échange tes compétences,<br><span class="hero-gradient">booste ta carrière</span></h1>
        <p>Tu maîtrises React mais tu veux apprendre Python ? Trouve un étudiant EFREI qui fait l'inverse et échangez vos savoirs.</p>
        <div class="hero-actions">
          <router-link to="/register" class="btn btn-primary">
            Commencer gratuitement
          </router-link>
          <router-link to="/skills" class="btn-hero-outline">
            Voir les annonces →
          </router-link>
        </div>
        <div class="hero-stats">
          <div class="stat"><strong>{{ stats.utilisateurs }}</strong><span>étudiants</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>{{ stats.annonces }}</strong><span>annonces</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>{{ stats.echanges }}</strong><span>échanges réalisés</span></div>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-card-demo">
          <div class="demo-card">
            <div class="demo-avatar demo-avatar--a">WD</div>
            <div class="demo-info">
              <span class="demo-title">React → Python</span>
              <span class="demo-sub">2h/semaine · visio</span>
            </div>
            <span class="pill pill-green">✓ Match</span>
          </div>
          <div class="demo-card demo-card--2">
            <div class="demo-avatar demo-avatar--b">SG</div>
            <div class="demo-info">
              <span class="demo-title">UI/UX → Node.js</span>
              <span class="demo-sub">3h/semaine · présentiel</span>
            </div>
            <span class="pill pill-orange">Nouveau</span>
          </div>
          <div class="demo-card demo-card--3">
            <div class="demo-avatar demo-avatar--c">TK</div>
            <div class="demo-info">
              <span class="demo-title">Data Sc. → DevOps</span>
              <span class="demo-sub">1h/semaine · async</span>
            </div>
            <span class="pill pill-cyan">En cours</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ COMMENT ÇA MARCHE ══════════════════════════════ -->
    <div class="steps-section">
      <div class="steps-inner">
        <div class="steps-header">
          <h2>Comment ça marche</h2>
          <p>Trois étapes pour trouver ton partenaire d'échange idéal</p>
        </div>
        <div class="steps">
          <div class="step">
            <div class="step-icon step-icon--1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
              </svg>
            </div>
            <h3>Crée ton profil</h3>
            <p>Inscris-toi en 30 secondes et renseigne ce que tu sais faire et ce que tu veux apprendre.</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-icon step-icon--2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h3>Trouve un match</h3>
            <p>Notre moteur de matching te propose automatiquement des étudiants complémentaires.</p>
          </div>
          <div class="step-arrow">→</div>
          <div class="step">
            <div class="step-icon step-icon--3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <h3>Échange et progresse</h3>
            <p>Contacte-le via la messagerie et organisez votre premier échange en temps réel.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ FEATURES ═══════════════════════════════════════ -->
    <div class="features-section">
      <div class="features-inner">
        <div class="features-header">
          <h2>Tout ce dont tu as besoin</h2>
          <p>Une plateforme pensée pour les étudiants EFREI</p>
        </div>
        <div class="features">
          <div class="feature-card feature-card--red">
            <div class="feature-icon">🎯</div>
            <h3>Matching intelligent</h3>
            <p>L'algorithme analyse tes compétences offertes et recherchées pour te proposer les meilleures correspondances.</p>
          </div>
          <div class="feature-card feature-card--orange">
            <div class="feature-icon">💬</div>
            <h3>Messagerie temps réel</h3>
            <p>Communique en direct avec tes partenaires via Socket.io, sans quitter la plateforme.</p>
          </div>
          <div class="feature-card feature-card--teal">
            <div class="feature-icon">⭐</div>
            <h3>Évaluations et confiance</h3>
            <p>Chaque échange peut être évalué. Construis ta réputation et identifie les partenaires fiables.</p>
          </div>
          <div class="feature-card feature-card--green">
            <div class="feature-icon">🔒</div>
            <h3>100% sécurisé</h3>
            <p>JWT, bcrypt, Helmet, rate limiting. Tes données t'appartiennent, hébergées localement.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ CTA FINAL ══════════════════════════════════════ -->
    <div class="cta-section">
      <div class="cta-band">
        <h2>Prêt(e) à booster tes compétences ?</h2>
        <p>Rejoins les étudiants EFREI qui s'entraident et progressent ensemble.</p>
        <router-link to="/register" class="btn btn-primary">Créer mon compte gratuitement</router-link>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statsApi } from '../api/index.js'

const stats = ref({ utilisateurs: '…', annonces: '…', echanges: '…' })

onMounted(async () => {
  try {
    const data = await statsApi.global()
    stats.value = {
      utilisateurs: data.plateforme.utilisateurs.total,
      annonces:     data.plateforme.annonces,
      echanges:     data.plateforme.echanges.total,
    }
  } catch { /* silencieux */ }
})
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ══════════════════════════════════════════════
   HERO — blanc, bold, style Malt
   ══════════════════════════════════════════════ */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  padding: 5rem 2rem 5rem;
  width: min(1120px, 100%);
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .28rem .85rem;
  border-radius: var(--radius-full);
  background: var(--primary-light);
  color: var(--primary-dark);
  font-size: .8rem; font-weight: 700;
  letter-spacing: .04em;
  margin-bottom: 1.5rem;
}

.hero-content h1 {
  color: var(--text);
  font-size: clamp(2.2rem, 3.8vw, 3.6rem);
  margin-bottom: 1.1rem;
  line-height: 1.1;
}
.hero-gradient {
  color: var(--primary);
}
.hero-content p {
  color: var(--text-sub);
  max-width: 480px;
  font-size: 1.05rem;
  margin-bottom: 2rem;
  line-height: 1.7;
}

.hero-actions { display: flex; gap: .85rem; flex-wrap: wrap; margin-bottom: 2.5rem; }
.btn-hero-outline {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .72rem 1.4rem;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border);
  color: var(--text-sub); font-weight: 600; font-size: .95rem;
  transition: border-color .15s, background .15s, color .15s;
}
.btn-hero-outline:hover { border-color: var(--text-sub); background: var(--bg-alt); color: var(--text); }

.hero-stats { display: flex; align-items: center; gap: 1.75rem; }
.stat { display: flex; flex-direction: column; }
.stat strong { font-size: 1.6rem; font-weight: 800; color: var(--text); line-height: 1; }
.stat span   { font-size: .78rem; color: var(--text-muted); margin-top: .2rem; font-weight: 500; }
.stat-divider { width: 1px; height: 36px; background: var(--border); }

/* Démo cards — sur fond clair */
.hero-visual { position: relative; }
.hero-card-demo { display: flex; flex-direction: column; gap: .85rem; }
.demo-card {
  display: flex; align-items: center; gap: .85rem;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: .9rem 1.1rem;
  box-shadow: var(--shadow-card);
  transition: transform .2s, box-shadow .2s;
}
.demo-card:hover { transform: translateX(4px); box-shadow: var(--shadow); }
.demo-card--2 { opacity: .9; }
.demo-card--3 { opacity: .75; }
.demo-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  font-weight: 800; font-size: .78rem; color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.demo-avatar--a { background: var(--primary); }
.demo-avatar--b { background: #10B981; }
.demo-avatar--c { background: #F97316; }
.demo-info { flex: 1; display: flex; flex-direction: column; gap: .1rem; }
.demo-title { font-weight: 700; font-size: .9rem; color: var(--text); }
.demo-sub   { font-size: .78rem; color: var(--text-muted); }

/* ══════════════════════════════════════════════
   SÉPARATEUR + LABEL SECTION
   ══════════════════════════════════════════════ */
.section-label {
  text-align: center;
  font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .12em;
  color: var(--primary);
  margin-bottom: -2rem;
  padding-top: 4rem;
}

/* ══════════════════════════════════════════════
   STEPS — fond alterné gris
   ══════════════════════════════════════════════ */
.steps-section {
  background: var(--bg-alt);
  padding: 5rem 2rem;
}
.steps-inner {
  width: min(1120px, 100%);
  margin: 0 auto;
}
.steps-header {
  text-align: center;
  margin-bottom: 3rem;
}
.steps-header h2 { margin-bottom: .5rem; }
.steps-header p { color: var(--text-sub); font-size: 1rem; margin: 0; }

.steps {
  display: flex; align-items: flex-start; justify-content: center;
  gap: 1.25rem; flex-wrap: wrap;
}
.step {
  flex: 1; min-width: 200px; max-width: 300px;
  background: #fff; border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: 1.75rem 1.5rem;
  box-shadow: var(--shadow-sm);
  text-align: center;
  position: relative;
}
.step h3 { margin: 1rem 0 .5rem; color: var(--text); }
.step p  { color: var(--text-sub); font-size: .92rem; margin: 0; line-height: 1.6; }
.step-arrow {
  font-size: 1.2rem; color: var(--text-muted);
  align-self: center; flex-shrink: 0;
  display: none;
}
.step-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--primary); color: #fff;
  font-size: .82rem; font-weight: 800;
  margin: 0 auto;
}
.step-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
}
.step-icon svg { width: 24px; height: 24px; }
.step-icon--1 { background: var(--primary-light); color: var(--primary); }
.step-icon--2 { background: var(--orange-light);  color: var(--orange); }
.step-icon--3 { background: var(--green-light);   color: var(--green); }

/* ══════════════════════════════════════════════
   FEATURES — fond blanc
   ══════════════════════════════════════════════ */
.features-section {
  padding: 5rem 2rem;
}
.features-inner {
  width: min(1120px, 100%);
  margin: 0 auto;
}
.features-header {
  text-align: center;
  margin-bottom: 3rem;
}
.features-header h2 { margin-bottom: .5rem; }
.features-header p { color: var(--text-sub); font-size: 1rem; margin: 0; }

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
.feature-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 1.75rem 1.5rem;
  border: 1px solid var(--border);
  transition: transform .2s, box-shadow .2s;
}
.feature-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
.feature-card h3 { margin: .85rem 0 .4rem; font-size: 1rem; color: var(--text); }
.feature-card p  { font-size: .9rem; margin: 0; color: var(--text-sub); line-height: 1.6; }
.feature-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; line-height: 1;
}

.feature-card--red    .feature-icon { background: var(--primary-light); }
.feature-card--orange .feature-icon { background: var(--orange-light); }
.feature-card--teal   .feature-icon { background: var(--teal-light); }
.feature-card--green  .feature-icon { background: var(--green-light); }

/* ══════════════════════════════════════════════
   CTA FINAL — fond foncé, style Malt
   ══════════════════════════════════════════════ */
.cta-section {
  background: #18181B;
  padding: 5rem 2rem;
}
.cta-band {
  width: min(700px, 100%);
  margin: 0 auto;
  text-align: center;
}
.cta-band h2 { color: #fff; margin-bottom: .75rem; font-size: clamp(1.6rem, 2.5vw, 2.2rem); }
.cta-band p  { color: #A1A1AA; margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.7; }

/* ── Responsive ── */
@media (min-width: 900px) { .step-arrow { display: block; } }

@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; padding: 3.5rem 1.5rem; gap: 2rem; }
  .hero-visual { display: none; }
  .features { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
}

@media (max-width: 600px) {
  .hero { padding: 2.5rem 1rem; }
  .steps-section, .features-section, .cta-section { padding: 3.5rem 1rem; }
  .steps { flex-direction: column; align-items: stretch; gap: .75rem; }
  .step { max-width: 100%; }
  .hero-stats { gap: 1.25rem; }
  .hero-stats .stat strong { font-size: 1.3rem; }
}

@media (max-width: 480px) {
  .hero-actions { flex-direction: column; }
  .hero-actions .btn,
  .hero-actions .btn-hero-outline { width: 100%; justify-content: center; }
  .features { grid-template-columns: 1fr; }
}
</style>
