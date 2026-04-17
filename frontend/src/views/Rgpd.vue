<template>
  <section class="rgpd-page">

    <!-- ── Hero ── -->
    <div class="rgpd-hero">
      <span class="rgpd-badge">Conformité RGPD</span>
      <h1>Politique de confidentialité</h1>
      <p>SkillSwap s'engage à protéger tes données personnelles conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679).</p>
      <p class="rgpd-date">Dernière mise à jour : avril 2026</p>
    </div>

    <!-- ── Sections ── -->
    <div class="rgpd-content">

      <div class="rgpd-card">
        <h2>🏢 Responsable du traitement</h2>
        <p>Le responsable du traitement est le projet étudiant <strong>SkillSwap</strong>, développé dans le cadre d'un projet de fil rouge à l'<strong>EFREI Paris</strong>. Pour toute question, contacte-nous via la page <router-link to="/contact">Contact</router-link>.</p>
      </div>

      <div class="rgpd-card">
        <h2>📋 Données collectées</h2>
        <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
        <ul>
          <li><strong>Données d'identité</strong> : nom, adresse email</li>
          <li><strong>Données de profil</strong> : bio, compétences offertes et recherchées, avatar</li>
          <li><strong>Données d'utilisation</strong> : annonces publiées, demandes d'échange, messages envoyés, évaluations, favoris</li>
          <li><strong>Données techniques</strong> : tokens d'authentification (JWT), logs de connexion</li>
        </ul>
      </div>

      <div class="rgpd-card">
        <h2>🎯 Finalités du traitement</h2>
        <ul>
          <li>Gestion de ton compte et authentification sécurisée</li>
          <li>Mise en relation entre étudiants pour l'échange de compétences</li>
          <li>Messagerie interne entre participants d'un échange accepté</li>
          <li>Système de matching et de recommandations d'annonces</li>
          <li>Amélioration du service et détection d'abus</li>
        </ul>
      </div>

      <div class="rgpd-card">
        <h2>⚖️ Base légale</h2>
        <p>Le traitement est fondé sur :</p>
        <ul>
          <li><strong>L'exécution du contrat</strong> (art. 6.1.b) : données nécessaires au fonctionnement du service</li>
          <li><strong>Le consentement</strong> (art. 6.1.a) : lors de ton inscription, tu acceptes les présentes conditions</li>
          <li><strong>L'intérêt légitime</strong> (art. 6.1.f) : sécurité et prévention des fraudes</li>
        </ul>
      </div>

      <div class="rgpd-card">
        <h2>🔒 Conservation des données</h2>
        <p>Tes données sont conservées pour la durée nécessaire au service :</p>
        <ul>
          <li>Données de compte : jusqu'à suppression du compte</li>
          <li>Messages et échanges : 2 ans après la fin de l'échange</li>
          <li>Logs de sécurité : 90 jours</li>
          <li>Tokens de connexion : durée de session (JWT expirant)</li>
        </ul>
      </div>

      <div class="rgpd-card">
        <h2>🌍 Transferts de données</h2>
        <p>Tes données sont stockées localement (MongoDB) et ne sont pas transférées à des tiers à des fins commerciales. Aucun transfert hors Union Européenne n'est effectué.</p>
      </div>

      <div class="rgpd-card rights-card">
        <h2>✅ Tes droits</h2>
        <p>Conformément au RGPD, tu disposes des droits suivants :</p>
        <div class="rights-grid">
          <div class="right-item">
            <span class="right-icon">👁️</span>
            <div>
              <strong>Droit d'accès</strong>
              <p>Consulter toutes tes données personnelles</p>
            </div>
          </div>
          <div class="right-item">
            <span class="right-icon">✏️</span>
            <div>
              <strong>Droit de rectification</strong>
              <p>Corriger tes informations depuis ton profil</p>
            </div>
          </div>
          <div class="right-item">
            <span class="right-icon">🗑️</span>
            <div>
              <strong>Droit à l'effacement</strong>
              <p>Supprimer ton compte et toutes tes données</p>
            </div>
          </div>
          <div class="right-item">
            <span class="right-icon">📦</span>
            <div>
              <strong>Droit à la portabilité</strong>
              <p>Exporter tes données au format JSON</p>
            </div>
          </div>
          <div class="right-item">
            <span class="right-icon">🚫</span>
            <div>
              <strong>Droit d'opposition</strong>
              <p>T'opposer au traitement de tes données</p>
            </div>
          </div>
          <div class="right-item">
            <span class="right-icon">⏸️</span>
            <div>
              <strong>Droit à la limitation</strong>
              <p>Limiter le traitement de tes données</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Export données ── -->
      <div class="rgpd-card export-card">
        <div class="export-info">
          <h2>📥 Exporter mes données personnelles</h2>
          <p>Télécharge l'intégralité de tes données personnelles (profil, annonces, échanges, messages, évaluations) au format JSON.</p>
        </div>
        <div class="export-action">
          <button
            class="btn btn-primary"
            @click="exportData"
            :disabled="exporting || !isLoggedIn"
          >
            <svg v-if="!exporting" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            {{ exporting ? 'Export en cours…' : 'Télécharger mes données' }}
          </button>
          <p v-if="!isLoggedIn" class="export-hint">
            <router-link to="/login">Connecte-toi</router-link> pour exporter tes données.
          </p>
          <p v-if="exportError" class="export-error">{{ exportError }}</p>
        </div>
      </div>

      <div class="rgpd-card">
        <h2>📞 Contact et réclamations</h2>
        <p>Pour exercer tes droits ou pour toute question relative à tes données personnelles, contacte-nous via la page <router-link to="/contact">Contact</router-link>.</p>
        <p>Si tu estimes que le traitement de tes données porte atteinte à tes droits, tu peux introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <strong>www.cnil.fr</strong>.</p>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { api } from '../api/index.js'

const exporting   = ref(false)
const exportError = ref(null)

const isLoggedIn = computed(() => !!localStorage.getItem('token'))

const exportData = async () => {
  exporting.value  = true
  exportError.value = null
  try {
    const data = await api.get('/rgpd/export')
    // Télécharger en JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `skillswap-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    exportError.value = err.message || 'Impossible d\'exporter les données.'
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.rgpd-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Hero ── */
.rgpd-hero {
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.rgpd-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: .3rem .85rem;
  border-radius: var(--radius-full);
  background: var(--primary-light);
  color: var(--primary-dark);
  font-size: .82rem;
  font-weight: 700;
}

.rgpd-hero h1 { margin: 0; font-size: clamp(1.6rem, 2.5vw, 2.4rem); }
.rgpd-hero p  { margin: 0; color: var(--text-sub); line-height: 1.7; max-width: 680px; }
.rgpd-date    { font-size: .82rem; color: var(--text-muted) !important; }

/* ── Content ── */
.rgpd-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Card ── */
.rgpd-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow-sm);
}

.rgpd-card h2 {
  font-size: 1.1rem;
  margin: 0 0 1rem;
  color: var(--text);
}

.rgpd-card p {
  color: var(--text-sub);
  line-height: 1.7;
  margin: 0 0 .75rem;
}
.rgpd-card p:last-child { margin-bottom: 0; }

.rgpd-card ul {
  margin: .5rem 0 0;
  padding-left: 1.25rem;
  color: var(--text-sub);
  line-height: 1.8;
}

.rgpd-card a {
  color: var(--primary);
  font-weight: 600;
  text-decoration: underline;
}

/* ── Rights grid ── */
.rights-card .rights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: .5rem;
}

.right-item {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  background: var(--bg-alt);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  padding: .9rem 1rem;
}

.right-icon { font-size: 1.4rem; flex-shrink: 0; }

.right-item strong {
  display: block;
  font-size: .92rem;
  color: var(--text);
  margin-bottom: .2rem;
}

.right-item p {
  font-size: .82rem;
  margin: 0;
  color: var(--text-muted);
  line-height: 1.4;
}

/* ── Export ── */
.export-card {
  background: linear-gradient(135deg, var(--primary-light) 0%, #fff 60%);
  border-color: rgba(232, 51, 61, .2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.export-info h2 { margin-bottom: .5rem; }
.export-info p  { max-width: 440px; }

.export-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: .5rem;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .75rem 1.5rem;
  border-radius: var(--radius-full);
  border: none;
  font-weight: 700;
  font-size: .95rem;
  cursor: pointer;
  transition: background .15s, opacity .15s, transform .15s;
  text-decoration: none;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: .5; cursor: default; }

.btn-primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 4px 14px rgba(232,51,61,.3);
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  box-shadow: 0 6px 20px rgba(232,51,61,.4);
}

.export-hint {
  font-size: .82rem;
  color: var(--text-muted);
  margin: 0;
}
.export-hint a { color: var(--primary); font-weight: 600; }
.export-error {
  font-size: .85rem;
  color: var(--red);
  margin: 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .rgpd-hero  { padding: 1.5rem 1.25rem; }
  .rgpd-card  { padding: 1.25rem; }
  .export-card { flex-direction: column; align-items: flex-start; }
  .export-action { align-items: stretch; width: 100%; }
  .export-action .btn { justify-content: center; }
  .rights-card .rights-grid { grid-template-columns: 1fr; }
}
</style>
