<template>
  <section class="match-page">

    <!-- ── Hero ── -->
    <div class="match-hero">
      <div>
        <span class="page-badge">🎯 Matching</span>
        <h1>Mes matchs</h1>
        <p>Les annonces dont la compétence offerte correspond à ce que tu cherches — et inversement.</p>
      </div>
    </div>

    <!-- ── Pas connecté ── -->
    <div v-if="!currentUser" class="empty-state">
      <span class="empty-icon">🔐</span>
      <h2>Connecte-toi pour voir tes matchs</h2>
      <p>Le matching compare ton profil avec les annonces disponibles.</p>
      <router-link to="/login" class="btn btn-primary">Se connecter</router-link>
    </div>

    <!-- ── Profil incomplet ── -->
    <div v-else-if="profileIncomplete" class="empty-state">
      <span class="empty-icon">📝</span>
      <h2>Complète ton profil</h2>
      <p>Renseigne tes <strong>compétences offertes</strong> et tes <strong>compétences recherchées</strong> pour que le matching fonctionne.</p>
      <router-link to="/profile" class="btn btn-primary">Compléter mon profil</router-link>
    </div>

    <template v-else>

      <!-- ── Explication du matching ── -->
      <div class="match-explain">
        <div class="explain-card explain-card--me">
          <span class="explain-label">Ce que j'offre</span>
          <span class="explain-value">{{ currentUser.competences_offertes || '—' }}</span>
        </div>
        <div class="explain-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
            stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
          <span>match</span>
        </div>
        <div class="explain-card explain-card--other">
          <span class="explain-label">Ce que je cherche</span>
          <span class="explain-value">{{ currentUser.competences_recherchees || '—' }}</span>
        </div>
      </div>

      <!-- ── États ── -->
      <div v-if="loading" class="state-msg">Recherche des meilleurs matchs…</div>
      <div v-else-if="error" class="state-msg error">{{ error }}</div>

      <!-- ── Aucun match ── -->
      <div v-else-if="matches.length === 0" class="empty-state">
        <span class="empty-icon">🔍</span>
        <h2>Aucun match pour l'instant</h2>
        <p>Personne ne correspond exactement à tes critères pour le moment. Reviens plus tard ou explore toutes les annonces.</p>
        <router-link to="/skills" class="btn btn-outline">Voir toutes les annonces</router-link>
      </div>

      <!-- ── Liste des matchs ── -->
      <div v-else>
        <p class="results-count">
          <strong>{{ matches.length }}</strong> match{{ matches.length > 1 ? 's' : '' }} trouvé{{ matches.length > 1 ? 's' : '' }}
        </p>

        <ul class="matches-grid">
          <li v-for="(m, idx) in matches" :key="m._id" class="match-card">

            <!-- Score compat -->
            <div class="compat-bar-wrap">
              <div class="compat-bar" :style="{ width: m.compatibility_score + '%' }"></div>
              <span class="compat-label">{{ m.compatibility_score }}% compatible</span>
            </div>

            <!-- Auteur -->
            <div class="match-author">
              <div class="match-avatar" :style="{ background: avatarGrad(idx) }">
                {{ initials(m.user_id?.nom) }}
              </div>
              <div>
                <strong class="match-name">{{ m.user_id?.nom || 'Étudiant' }}</strong>
                <span class="match-titre">{{ m.titre }}</span>
              </div>
            </div>

            <!-- Échange -->
            <div class="match-exchange">
              <div class="exchange-side exchange-side--offer">
                <span class="exchange-label">Il / Elle offre</span>
                <span class="exchange-value">{{ m.competence_offerte }}</span>
              </div>
              <div class="exchange-icon">⇄</div>
              <div class="exchange-side exchange-side--seek">
                <span class="exchange-label">Il / Elle cherche</span>
                <span class="exchange-value">{{ m.competence_recherchee }}</span>
              </div>
            </div>

            <!-- Pourquoi ce match -->
            <div class="match-reason">
              <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M8 1l1.9 3.9L14 5.7l-3 2.9.7 4.1L8 10.5l-3.7 2.2.7-4.1-3-2.9 4.1-.8z"/></svg>
              Il/elle offre <strong>{{ m.competence_offerte }}</strong> = ce que tu cherches ·
              cherche <strong>{{ m.competence_recherchee }}</strong> = ce que tu offres
            </div>

            <!-- Actions -->
            <div class="match-actions">
              <router-link :to="`/skills/${m._id}`" class="btn btn-ghost">Voir l'annonce</router-link>
              <button class="btn btn-primary" @click="openRequest(m)">Proposer un échange</button>
            </div>

          </li>
        </ul>
      </div>

    </template>

    <!-- ══ MODALE demande d'échange ══ -->
    <Teleport to="body">
      <div v-if="requestModal" class="modal-overlay" @click.self="closeRequest">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" @click="closeRequest" aria-label="Fermer">✕</button>

          <div v-if="requestDone" class="req-success">
            <span class="req-success-icon">🎉</span>
            <h3>Demande envoyée !</h3>
            <p>{{ requestModal?.user_id?.nom }} recevra une notification.</p>
          </div>

          <template v-else>
            <h3>Proposer un échange</h3>
            <p class="req-subtitle">avec <strong>{{ requestModal?.user_id?.nom }}</strong></p>
            <div class="req-recap">
              <span class="pill pill-purple">{{ requestModal?.competence_offerte }}</span>
              <span>⇄</span>
              <span class="pill pill-cyan">{{ requestModal?.competence_recherchee }}</span>
            </div>
            <div class="req-field">
              <label for="req-msg">Message (optionnel)</label>
              <textarea id="req-msg" v-model="requestMessage" rows="3" maxlength="500"
                placeholder="Présente-toi et explique ta motivation…"></textarea>
              <span class="req-char">{{ requestMessage.length }}/500</span>
            </div>
            <p v-if="requestError" class="req-error">{{ requestError }}</p>
            <div class="req-actions">
              <button class="btn btn-ghost" @click="closeRequest">Annuler</button>
              <button class="btn btn-primary" @click="submitRequest" :disabled="requesting">
                {{ requesting ? 'Envoi…' : 'Envoyer la demande' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { matchApi, requestsApi, usersApi } from '../api/index.js'

const route = useRoute()

// ── Utilisateur ───────────────────────────────────────────────
const currentUser = ref(null)
const storedUser  = localStorage.getItem('user')
if (storedUser) currentUser.value = JSON.parse(storedUser)

const profileIncomplete = computed(() =>
  currentUser.value && (!currentUser.value.competences_offertes?.trim() || !currentUser.value.competences_recherchees?.trim())
)

// ── Matchs ────────────────────────────────────────────────────
const matches = ref([])
const loading = ref(false)
const error   = ref(null)

// ── Helpers ───────────────────────────────────────────────────
const avatarColors = [
  ['#7c3aed','#06b6d4'], ['#059669','#0ea5e9'],
  ['#d97706','#ef4444'], ['#db2777','#8b5cf6'],
  ['#0891b2','#10b981'],
]
const avatarGrad = (idx) => {
  const [a, b] = avatarColors[idx % avatarColors.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}
const initials = (nom) =>
  (nom || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

// ── Chargement ────────────────────────────────────────────────
onMounted(async () => {
  if (!currentUser.value) return

  // Récupérer les données fraîches du profil pour éviter les désynchronisations LocalStorage
  try {
    const freshUser = await usersApi.getUser(currentUser.value.id || currentUser.value._id)
    currentUser.value = freshUser
  } catch (err) {
    console.warn('Impossible de rafraîchir le profil utilisateur:', err)
  }

  if (profileIncomplete.value) return

  // Si on arrive depuis /match?skill=xxx → matchs pour une annonce spécifique
  const skillId = route.query.skill
  loading.value = true
  try {
    const data = skillId
      ? await matchApi.getMatchesForSkill(skillId)
      : await matchApi.getMatches()
    matches.value = data.matches ?? data.data ?? []
  } catch (err) {
    error.value = err.message || 'Impossible de charger les matchs.'
  } finally {
    loading.value = false
  }
})

// ── Modale demande ────────────────────────────────────────────
const requestModal   = ref(null)
const requestMessage = ref('')
const requesting     = ref(false)
const requestError   = ref(null)
const requestDone    = ref(false)

const openRequest = (skill) => {
  requestModal.value   = skill
  requestMessage.value = ''
  requestError.value   = null
  requestDone.value    = false
}
const closeRequest = () => { requestModal.value = null }

const submitRequest = async () => {
  if (!requestModal.value) return
  requesting.value = true
  requestError.value = null
  try {
    await requestsApi.send({
      skill_id:    requestModal.value._id,
      receiver_id: requestModal.value.user_id._id,
      message:     requestMessage.value.trim() || undefined,
    })
    requestDone.value = true
    setTimeout(closeRequest, 1600)
  } catch (err) {
    requestError.value = err.data?.message || err.message || 'Erreur lors de l\'envoi'
  } finally {
    requesting.value = false
  }
}
</script>

<style scoped>
.match-page { padding: 1.5rem 1rem 3rem; display: flex; flex-direction: column; gap: 2rem; }

/* ── Hero ── */
.match-hero {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-xl); padding: 1.75rem 2rem;
  box-shadow: var(--shadow-card);
}
.page-badge {
  display: inline-flex; padding: .3rem .8rem; border-radius: var(--radius-full);
  background: var(--accent-light); color: var(--accent-dark);
  font-size: .8rem; font-weight: 700; letter-spacing: .04em; margin-bottom: .6rem;
}
.match-hero h1 { margin: 0 0 .4rem; font-size: clamp(1.6rem, 2.5vw, 2.2rem); }
.match-hero p  { margin: 0; color: var(--text-muted); }

/* ── Explication ── */
.match-explain {
  display: flex; align-items: center; gap: 1rem;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-card); flex-wrap: wrap;
}
.explain-card {
  flex: 1; min-width: 150px; padding: .9rem 1.1rem;
  border-radius: var(--radius); display: flex; flex-direction: column; gap: .3rem;
}
.explain-card--me    { background: var(--accent-light); }
.explain-card--other { background: var(--cyan-light); }
.explain-label {
  font-size: .75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; opacity: .7;
}
.explain-card--me    .explain-label { color: var(--accent-dark); }
.explain-card--other .explain-label { color: #0e7490; }
.explain-value { font-weight: 800; font-size: 1rem; }
.explain-card--me    .explain-value { color: var(--accent-dark); }
.explain-card--other .explain-value { color: #0e7490; }
.explain-arrow {
  display: flex; flex-direction: column; align-items: center; gap: .2rem;
  color: var(--accent); font-size: .72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .05em;
}

/* ── Grille matchs ── */
.results-count { color: var(--text-muted); font-size: .92rem; margin: -.5rem 0 0; }
.results-count strong { color: var(--text-h); }

.matches-grid {
  list-style: none; padding: 0; margin: 0;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.match-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1.35rem;
  display: flex; flex-direction: column; gap: 1rem;
  box-shadow: var(--shadow-card);
  transition: transform .18s, box-shadow .18s;
}
.match-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }

/* Barre compat */
.compat-bar-wrap {
  display: flex; align-items: center; gap: .75rem;
  background: #f5f3ff; border-radius: var(--radius-full);
  padding: .3rem .75rem; overflow: hidden; position: relative;
}
.compat-bar {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: var(--grad-primary); opacity: .15; border-radius: var(--radius-full);
  transition: width .4s ease;
}
.compat-label {
  font-size: .78rem; font-weight: 700; color: var(--accent-dark);
  position: relative; z-index: 1;
}

/* Auteur */
.match-author { display: flex; align-items: center; gap: .75rem; }
.match-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  color: #fff; font-size: .78rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.match-name  { display: block; font-weight: 700; color: var(--text-h); font-size: .95rem; }
.match-titre {
  display: block; font-size: .82rem; color: var(--text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;
}

/* Échange */
.match-exchange {
  display: flex; align-items: stretch; border-radius: var(--radius);
  overflow: hidden; border: 1px solid var(--border);
}
.exchange-side { flex: 1; padding: .65rem .75rem; display: flex; flex-direction: column; gap: .15rem; }
.exchange-side--offer { background: var(--accent-light); }
.exchange-side--seek  { background: var(--cyan-light); text-align: right; }
.exchange-label {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; opacity: .65;
}
.exchange-side--offer .exchange-label { color: var(--accent-dark); }
.exchange-side--seek  .exchange-label { color: #0e7490; }
.exchange-value { font-weight: 700; font-size: .9rem; }
.exchange-side--offer .exchange-value { color: var(--accent-dark); }
.exchange-side--seek  .exchange-value { color: #0e7490; }
.exchange-icon {
  display: flex; align-items: center; justify-content: center; padding: 0 .5rem;
  background: linear-gradient(to right, var(--accent-light), var(--cyan-light));
  color: var(--accent); font-size: 1rem;
}

/* Raison match */
.match-reason {
  font-size: .8rem; color: var(--text-muted); line-height: 1.5;
  background: #fafafa; border-radius: var(--radius-sm); padding: .55rem .75rem;
  display: flex; align-items: flex-start; gap: .35rem;
}
.match-reason svg { flex-shrink: 0; color: var(--accent); margin-top: .1rem; }
.match-reason strong { color: var(--text-h); }

/* Actions */
.match-actions { display: flex; gap: .65rem; }
.match-actions .btn { flex: 1; justify-content: center; font-size: .86rem; padding: .6rem .8rem; }

/* ── Empty ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: .75rem; text-align: center; padding: 3rem 1.5rem;
  background: var(--surface); border: 2px dashed var(--border);
  border-radius: var(--radius-xl);
}
.empty-icon { font-size: 3rem; }
.empty-state h2 { margin: 0; }
.empty-state p { color: var(--text-muted); max-width: 440px; margin: 0; }

/* ── État ── */
.state-msg       { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
.state-msg.error { color: var(--red); }

/* ── Boutons ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: .75rem 1.35rem; border-radius: var(--radius-full); border: none;
  font-weight: 700; font-size: .93rem; cursor: pointer;
  transition: transform .18s, box-shadow .18s, background .18s; text-decoration: none;
}
.btn:hover { transform: translateY(-2px); }
.btn-primary { background: var(--grad-primary); color: #fff; box-shadow: 0 4px 18px rgba(124,58,237,.3); }
.btn-primary:hover { box-shadow: 0 8px 24px rgba(124,58,237,.42); }
.btn-primary:disabled { opacity: .55; cursor: default; transform: none; }
.btn-outline { background: transparent; border: 2px solid var(--accent); color: var(--accent); }
.btn-outline:hover { background: var(--accent-light); }
.btn-ghost { background: #f1f0ff; color: var(--text); }
.btn-ghost:hover { background: #e5e2ff; }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal {
  background: var(--surface); border-radius: 24px; padding: 2rem;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  position: relative; box-shadow: 0 20px 60px rgba(0,0,0,.18);
}
.modal h3 { margin: 0 0 .4rem; font-size: 1.25rem; }
.modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none; font-size: 1.1rem;
  cursor: pointer; color: var(--text-muted); padding: .35rem .5rem; border-radius: 8px;
}
.modal-close:hover { background: #f3f4f6; }
.req-subtitle { color: var(--text-muted); font-size: .92rem; margin-bottom: .75rem; }
.req-recap { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.req-field { display: grid; gap: .4rem; }
.req-field label { font-weight: 700; font-size: .92rem; }
.req-field textarea {
  width: 100%; border: 1px solid var(--border); border-radius: 14px;
  padding: .8rem 1rem; font-family: var(--sans); font-size: .92rem;
  background: #faf7ff; resize: vertical; color: var(--text); box-sizing: border-box;
}
.req-field textarea:focus { outline: 2px solid var(--accent); border-color: transparent; }
.req-char  { font-size: .78rem; color: var(--text-muted); text-align: right; }
.req-error { color: var(--red); font-size: .9rem; margin: .5rem 0 0; }
.req-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
.req-success { text-align: center; padding: 1.5rem 0; }
.req-success-icon { font-size: 3rem; display: block; margin-bottom: .75rem; }
.req-success h3 { margin-bottom: .5rem; }
.req-success p  { color: var(--text-muted); margin: 0; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .match-hero { padding: 1.25rem; }
  .match-explain { flex-direction: column; }
  .explain-arrow { flex-direction: row; }
  .matches-grid { grid-template-columns: 1fr; }
  .match-actions { flex-direction: column; }
  .req-actions { flex-direction: column-reverse; }
  .req-actions .btn { width: 100%; }
}
</style>
