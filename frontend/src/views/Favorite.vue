<script setup>
import { ref, computed, onMounted } from 'vue'
import { favoritesApi, requestsApi } from '../api/index.js'

const favorites = ref([])
const loading = ref(true)
const error = ref(null)
const requestModal = ref(null)
const requestMessage = ref('')
const requesting = ref(false)
const requestError = ref(null)
const requestDone = ref(false)

const currentUser = computed(() => {
  const stored = localStorage.getItem('user')
  return stored ? JSON.parse(stored) : null
})

const initials = (text) =>
  (text || '?').split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2)

const avatarColors = [
  ['#7c3aed', '#06b6d4'],
  ['#059669', '#0ea5e9'],
  ['#d97706', '#ef4444'],
  ['#db2777', '#8b5cf6'],
  ['#0891b2', '#10b981'],
]

const avatarGrad = (idx) => {
  const [a, b] = avatarColors[idx % avatarColors.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

const isOwn = (skill) => currentUser.value && skill.user_id?._id === currentUser.value.id

const loadFavorites = async () => {
  if (!currentUser.value) {
    favorites.value = []
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  try {
    const data = await favoritesApi.getMine()
    const list = data.data ?? data
    favorites.value = list
      .map((favorite) => favorite.skill_id)
      .filter(Boolean)
  } catch (err) {
    error.value = err.data?.message || err.message || 'Impossible de charger les favoris.'
  } finally {
    loading.value = false
  }
}

const removeFavorite = async (skillId) => {
  try {
    await favoritesApi.remove(skillId)
    favorites.value = favorites.value.filter((skill) => skill._id !== skillId)
  } catch (err) {
    error.value = err.data?.message || err.message || 'Impossible de retirer ce favori.'
  }
}

const openRequest = (skill) => {
  requestModal.value = skill
  requestMessage.value = ''
  requestError.value = null
  requestDone.value = false
}

const closeRequest = () => { requestModal.value = null }

const submitRequest = async () => {
  if (!requestModal.value) return
  requesting.value = true
  requestError.value = null

  try {
    await requestsApi.send({
      skill_id: requestModal.value._id,
      receiver_id: requestModal.value.user_id._id,
      message: requestMessage.value.trim() || undefined,
    })
    requestDone.value = true
    setTimeout(closeRequest, 1400)
  } catch (err) {
    requestError.value = err.data?.message || err.message || 'Erreur lors de l’envoi de la demande.'
  } finally {
    requesting.value = false
  }
}

onMounted(loadFavorites)
</script>

<template>
  <section class="favorites-page">
    <div class="favorites-hero">
      <div>
        <span class="page-badge">Favoris</span>
        <h1>Mes annonces favorites</h1>
        <p>Retrouve ici les annonces que tu as ajoutées en favori pour les retrouver facilement.</p>
      </div>
      <router-link to="/skills" class="btn btn-primary">Voir toutes les annonces</router-link>
    </div>

    <div v-if="loading" class="state-msg">Chargement…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <div v-else-if="!currentUser" class="state-msg">
      Tu dois te connecter pour afficher tes favoris.
      <router-link to="/login" class="btn btn-outline" style="margin-top: 1rem;">Se connecter</router-link>
    </div>

    <div v-else-if="favorites.length === 0" class="favorites-empty">
      <span class="favorites-empty-icon">💜</span>
      <p>Tu n'as pas encore ajouté d'annonce en favori.</p>
      <router-link to="/skills" class="btn btn-primary">Voir les annonces</router-link>
    </div>

    <ul v-else class="favorites-grid">
      <li v-for="(skill, idx) in favorites" :key="skill._id" class="sk-card">
        <div class="sk-card-header">
          <div class="sk-avatar" :style="{ background: avatarGrad(idx) }">
            {{ initials(skill.user_id?.nom) }}
          </div>
          <div class="sk-meta">
            <span class="sk-author">{{ skill.user_id?.nom || 'Étudiant' }}</span>
            <span class="sk-date">{{ new Date(skill.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) }}</span>
          </div>
          <button class="sk-fav-btn sk-fav-btn--active" @click.prevent="removeFavorite(skill._id)" title="Retirer des favoris">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
        </div>

        <div class="sk-body">
          <h2 class="sk-title">{{ skill.titre }}</h2>
          <p class="sk-desc">{{ skill.description || 'Aucune description fournie.' }}</p>
        </div>

        <div class="sk-exchange">
          <div class="sk-exchange-side sk-exchange-side--offer">
            <span class="sk-exchange-label">J'offre</span>
            <span class="sk-exchange-value">{{ skill.competence_offerte }}</span>
          </div>
          <div class="sk-exchange-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
          <div class="sk-exchange-side sk-exchange-side--seek">
            <span class="sk-exchange-label">Je cherche</span>
            <span class="sk-exchange-value">{{ skill.competence_recherchee }}</span>
          </div>
        </div>

        <div class="sk-footer">
          <button
            class="btn btn-primary sk-cta"
            @click="openRequest(skill)"
            :disabled="isOwn(skill)"
          >
            Proposer un échange
          </button>
        </div>
      </li>
    </ul>

    <Teleport to="body">
      <div v-if="requestModal" class="req-overlay" @click.self="closeRequest">
        <div class="req-modal" role="dialog" aria-modal="true">
          <button class="req-close" @click="closeRequest" aria-label="Fermer">✕</button>

          <div v-if="requestDone" class="req-success">
            <span class="req-success-icon">🎉</span>
            <h3>Demande envoyée !</h3>
            <p>{{ requestModal?.user_id?.nom }} recevra une notification et pourra accepter ton échange.</p>
          </div>

          <template v-else>
            <h3>Proposer un échange</h3>
            <p class="req-subtitle">
              Tu demandes un échange avec <strong>{{ requestModal.user_id?.nom }}</strong> pour :
            </p>

            <div class="req-skill-recap">
              <div class="req-recap-side req-recap-side--offer">
                <span class="req-recap-label">Il/Elle offre</span>
                <span class="req-recap-value">{{ requestModal.competence_offerte }}</span>
              </div>
              <span class="req-recap-arrow">⇄</span>
              <div class="req-recap-side req-recap-side--seek">
                <span class="req-recap-label">Il/Elle cherche</span>
                <span class="req-recap-value">{{ requestModal.competence_recherchee }}</span>
              </div>
            </div>

            <div class="req-field">
              <label for="req-message">Message (optionnel)</label>
              <textarea
                id="req-message"
                v-model="requestMessage"
                rows="3"
                maxlength="500"
                placeholder="Présente-toi rapidement et explique ce que tu proposes en échange…"
              ></textarea>
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

<style scoped>
.favorites-page { padding: 2rem 1rem; }
.favorites-hero {
  display: flex; justify-content: space-between; align-items: center;
  gap: 1.5rem; flex-wrap: wrap;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow-card);
  margin-bottom: 2rem;
}
.page-badge {
  display: inline-flex;
  padding: .3rem .8rem; border-radius: var(--radius-full);
  background: var(--accent-light); color: var(--accent-dark);
  font-size: .8rem; font-weight: 700; letter-spacing: .04em;
  margin-bottom: .6rem;
}
.favorites-hero h1 { margin: 0 0 .4rem; font-size: clamp(1.6rem, 2.5vw, 2.2rem); }
.favorites-hero p  { margin: 0; color: var(--text-muted); }
.state-msg { padding: 2rem; text-align: center; color: var(--text-muted); }
.state-msg.error { color: var(--red); }
.favorites-empty {
  text-align: center;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-xl);
  background: var(--surface);
}
.favorites-empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
.sk-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.sk-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  border-color: rgba(124,58,237,.28);
}
.sk-card-header {
  display: flex; align-items: center; gap: .75rem;
  padding: 1.1rem 1.1rem .75rem;
}
.sk-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  color: #fff; font-size: .75rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.sk-meta { flex: 1; display: flex; flex-direction: column; gap: .05rem; min-width: 0; }
.sk-author { font-weight: 700; font-size: .88rem; color: var(--text-h); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sk-date   { font-size: .76rem; color: var(--text-muted); }
.sk-fav-btn {
  width: 34px; height: 34px; border: none; flex-shrink: 0;
  background: transparent; border-radius: 50%;
  color: #f43f5e; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.sk-body { padding: 0 1.1rem .9rem; flex: 1; }
.sk-title {
  font-size: 1rem; font-weight: 700; line-height: 1.35;
  color: var(--text-h); margin: 0 0 .45rem;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sk-desc {
  font-size: .85rem; color: var(--text-muted); margin: 0; line-height: 1.55;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sk-exchange {
  display: flex; align-items: stretch;
  margin: 0 1.1rem .9rem;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
}
.sk-exchange-side { flex: 1; padding: .65rem .75rem; display: flex; flex-direction: column; gap: .15rem; }
.sk-exchange-side--offer { background: var(--accent-light); }
.sk-exchange-side--seek  { background: var(--cyan-light); text-align: right; }
.sk-exchange-label {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; opacity: .65;
}
.sk-exchange-side--offer .sk-exchange-label { color: var(--accent-dark); }
.sk-exchange-side--seek  .sk-exchange-label { color: #0e7490; }
.sk-exchange-value { font-weight: 700; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sk-exchange-side--offer .sk-exchange-value { color: var(--accent-dark); }
.sk-exchange-side--seek  .sk-exchange-value { color: #0e7490; }
.sk-exchange-arrow {
  display: flex; align-items: center; justify-content: center; padding: 0 .6rem;
  background: linear-gradient(to right, var(--accent-light), var(--cyan-light));
  color: var(--accent);
}
.sk-exchange-arrow svg { width: 18px; height: 18px; }
.sk-footer { padding: 0 1.1rem 1.1rem; }
.sk-cta { width: 100%; font-size: .88rem; padding: .65rem 1rem; justify-content: center; }
.req-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(15,12,41,.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.req-modal {
  background: #fff; border-radius: var(--radius-xl);
  padding: 2rem; width: 100%; max-width: 520px;
  max-height: 90vh; overflow-y: auto;
  position: relative; box-shadow: 0 32px 80px rgba(15,12,41,.22);
}
.req-close {
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none; cursor: pointer;
  font-size: 1rem; color: var(--text-muted);
  padding: .3rem .45rem; border-radius: 8px;
}
.req-close:hover { background: #f3f0ff; }
.req-modal h3 { margin: 0 0 .6rem; font-size: 1.25rem; }
.req-subtitle { margin: 0 0 1rem; color: var(--text-muted); font-size: .92rem; }
.req-skill-recap {
  display: flex; align-items: center; gap: .75rem;
  background: #faf5ff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: .85rem 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
}
.req-recap-side { flex: 1; display: flex; flex-direction: column; gap: .1rem; }
.req-recap-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
.req-recap-value { font-weight: 700; color: var(--text-h); font-size: .92rem; }
.req-recap-side--seek { text-align: right; }
.req-recap-arrow { color: var(--accent); font-size: 1.2rem; flex-shrink: 0; }
.req-field { display: grid; gap: .5rem; margin-bottom: 1rem; }
.req-field label { font-weight: 600; }
.req-field textarea {
  width: 100%; min-height: 100px; padding: 1rem;
  border-radius: 16px; border: 1px solid var(--border);
  background: #f9f8ff; color: var(--text); resize: vertical;
}
.req-char { font-size: .82rem; color: var(--text-muted); text-align: right; }
.req-error { margin: 0 0 1rem; color: var(--red); }
.req-actions { display: flex; gap: .75rem; justify-content: flex-end; }
.req-success { text-align: center; }
.req-success-icon { display: block; font-size: 2.1rem; margin-bottom: .9rem; }
@media (max-width: 640px) {
  .favorites-hero { flex-direction: column; align-items: stretch; }
  .favorites-hero .btn { width: 100%; justify-content: center; }
}
</style>