<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { skillsApi, favoritesApi, requestsApi } from '../api/index.js'

// ── Données ────────────────────────────────────────────────
const skills      = ref([])
const loading     = ref(true)
const error       = ref(null)
const favorites   = ref(new Set())
const page        = ref(1)
const totalPages  = ref(1)
const total       = ref(0)
const LIMIT       = 12

// ── Utilisateur connecté ───────────────────────────────────
const currentUser = computed(() => {
  const s = localStorage.getItem('user')
  return s ? JSON.parse(s) : null
})

const isOwn = (skill) =>
  currentUser.value && skill.user_id?._id === currentUser.value.id

// ── Modal demande d'échange ────────────────────────────────
const requestModal   = ref(null)   // skill ciblé
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

// ── Favoris ────────────────────────────────────────────────
const loadFavorites = async () => {
  try {
    const data = await favoritesApi.getMine()
    const list = data.data ?? data
    favorites.value = new Set(list.map(f => f.skill_id?._id ?? f.skill_id))
  } catch { /* non connecté */ }
}

const toggleFav = async (skillId) => {
  try {
    if (favorites.value.has(skillId)) {
      await favoritesApi.remove(skillId)
      favorites.value.delete(skillId)
    } else {
      await favoritesApi.add(skillId)
      favorites.value.add(skillId)
    }
    favorites.value = new Set(favorites.value)
  } catch { /* non connecté */ }
}

// ── Chargement paginé ──────────────────────────────────────
const loadPage = async (p = 1) => {
  loading.value = true
  error.value   = null
  try {
    const data     = await skillsApi.getAll(p, LIMIT)
    skills.value   = data.data ?? data
    totalPages.value = data.totalPages ?? 1
    total.value    = data.total ?? skills.value.length
    page.value     = p
    // Remonter en haut de la liste
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    error.value = err.message || 'Impossible de charger les annonces'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPage(1)
  loadFavorites()
})

// ── Pagination — pages visibles (avec ellipsis) ───────────
const visiblePages = computed(() => {
  const tp = totalPages.value
  const cp = page.value
  if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
  const pages = []
  if (cp <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', tp)
  } else if (cp >= tp - 3) {
    pages.push(1, '…', tp - 4, tp - 3, tp - 2, tp - 1, tp)
  } else {
    pages.push(1, '…', cp - 1, cp, cp + 1, '…', tp)
  }
  return pages
})

// ── Helpers ────────────────────────────────────────────────
const initials = (str) =>
  (str || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

const avatarColors = [
  ['#7c3aed','#06b6d4'], ['#059669','#0ea5e9'],
  ['#d97706','#ef4444'], ['#db2777','#8b5cf6'],
  ['#0891b2','#10b981'],
]
const avatarGrad = (idx) => {
  const [a, b] = avatarColors[idx % avatarColors.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}
</script>

<template>
  <div class="skills-wrap">

    <!-- ── Skeleton ── -->
    <div v-if="loading" class="sk-loading">
      <div v-for="n in 6" :key="n" class="sk-skeleton"></div>
    </div>

    <p v-else-if="error" class="sk-error">{{ error }}</p>

    <!-- ── Vide ── -->
    <div v-else-if="skills.length === 0" class="sk-empty">
      <span class="sk-empty-icon">🔍</span>
      <p>Aucune annonce pour l'instant.<br>Sois le premier à proposer un échange !</p>
      <router-link to="/profile" class="btn btn-primary">Créer une annonce</router-link>
    </div>

    <!-- ── Grid ── -->
    <ul v-else class="skills-grid">
      <li v-for="(skill, idx) in skills" :key="skill._id" class="sk-card">

        <!-- Header -->
        <div class="sk-card-header">
          <div class="sk-avatar" :style="{ background: avatarGrad(idx) }">
            {{ initials(skill.user_id?.nom) }}
          </div>
          <div class="sk-meta">
            <span class="sk-author">{{ skill.user_id?.nom || 'Étudiant' }}</span>
            <span class="sk-date">
              {{ new Date(skill.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) }}
            </span>
          </div>
          <!-- Badge "ma annonce" -->
          <span v-if="isOwn(skill)" class="sk-own-badge">Mon annonce</span>
          <!-- Favori (si pas la sienne) -->
          <button
            v-else
            class="sk-fav-btn"
            :class="{ 'sk-fav-btn--active': favorites.has(skill._id) }"
            @click.prevent="toggleFav(skill._id)"
            :title="favorites.has(skill._id) ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          >
            <svg viewBox="0 0 24 24" :fill="favorites.has(skill._id) ? 'currentColor' : 'none'"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
        </div>

        <!-- Corps -->
        <div class="sk-body">
          <h2 class="sk-title">{{ skill.titre }}</h2>
          <p class="sk-desc">{{ skill.description }}</p>
        </div>

        <!-- Bandeau offre → cherche -->
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

        <!-- Footer CTA -->
        <div class="sk-footer">
          <router-link :to="`/skills/${skill._id}`" class="btn btn-ghost sk-cta-detail">
            Voir le détail
          </router-link>

          <!-- Cas 1 : c'est MON annonce -->
          <router-link v-if="isOwn(skill)" to="/profile" class="btn btn-ghost sk-cta">
            ✏️ Gérer
          </router-link>

          <!-- Cas 2 : connecté, annonce d'un autre -->
          <button v-else-if="currentUser" class="btn btn-primary sk-cta" @click="openRequest(skill)">
            Proposer un échange
          </button>

          <!-- Cas 3 : non connecté -->
          <router-link v-else to="/login" class="btn btn-outline sk-cta">
            Se connecter
          </router-link>
        </div>

      </li>
    </ul>

    <!-- ── Pagination ── -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        class="pg-btn"
        :disabled="page === 1 || loading"
        @click="loadPage(1)"
        title="Première page"
      >«</button>
      <button
        class="pg-btn"
        :disabled="page === 1 || loading"
        @click="loadPage(page - 1)"
      >‹ Précédent</button>

      <div class="pg-pages">
        <button
          v-for="p in visiblePages"
          :key="p"
          class="pg-num"
          :class="{ 'pg-num--active': p === page, 'pg-num--ellipsis': p === '…' }"
          :disabled="p === '…' || p === page || loading"
          @click="p !== '…' && loadPage(p)"
        >{{ p }}</button>
      </div>

      <button
        class="pg-btn"
        :disabled="page === totalPages || loading"
        @click="loadPage(page + 1)"
      >Suivant ›</button>
      <button
        class="pg-btn"
        :disabled="page === totalPages || loading"
        @click="loadPage(totalPages)"
        title="Dernière page"
      >»</button>

      <span class="pg-info">{{ total }} annonce{{ total > 1 ? 's' : '' }}</span>
    </div>

    <!-- ══ MODALE — Demande d'échange ══ -->
    <Teleport to="body">
      <div v-if="requestModal" class="req-overlay" @click.self="closeRequest">
        <div class="req-modal" role="dialog" aria-modal="true">
          <button class="req-close" @click="closeRequest" aria-label="Fermer">✕</button>

          <!-- Succès -->
          <div v-if="requestDone" class="req-success">
            <span class="req-success-icon">🎉</span>
            <h3>Demande envoyée !</h3>
            <p>{{ requestModal?.user_id?.nom }} recevra une notification et pourra accepter ton échange.</p>
          </div>

          <!-- Formulaire -->
          <template v-else>
            <h3>Proposer un échange</h3>
            <p class="req-subtitle">
              Tu demandes un échange avec <strong>{{ requestModal.user_id?.nom }}</strong> pour :
            </p>

            <!-- Rappel de l'annonce -->
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

  </div>
</template>

<style scoped>
.skills-wrap { width: 100%; }

/* ── Skeleton ── */
.sk-loading { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px,1fr)); gap: 1.25rem; }
.sk-skeleton {
  height: 290px; border-radius: var(--radius-lg);
  background: linear-gradient(90deg, var(--bg-alt) 25%, var(--border-light) 50%, var(--bg-alt) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Empty / Error ── */
.sk-error { color: var(--red); padding: 2rem; text-align: center; }
.sk-empty {
  text-align: center; padding: 4rem 2rem;
  background: var(--bg-alt); border-radius: var(--radius-xl);
  border: 2px dashed var(--border);
}
.sk-empty-icon { font-size: 2.5rem; display: block; margin-bottom: 1rem; }
.sk-empty p { color: var(--text-sub); margin-bottom: 1.5rem; }

/* ── Grid ── */
.skills-grid {
  list-style: none; padding: 0; margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px,1fr));
  gap: 1.25rem;
}

/* ── Card ── */
.sk-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.sk-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
  border-color: #D4D4D8;
}

/* Header */
.sk-card-header {
  display: flex; align-items: center; gap: .75rem;
  padding: 1rem 1rem .75rem;
}
.sk-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  color: #fff; font-size: .74rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.sk-meta { flex: 1; display: flex; flex-direction: column; gap: .05rem; min-width: 0; }
.sk-author { font-weight: 700; font-size: .88rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sk-date   { font-size: .75rem; color: var(--text-muted); }

/* Badge "mon annonce" */
.sk-own-badge {
  flex-shrink: 0;
  padding: .22rem .6rem; border-radius: var(--radius-full);
  background: var(--bg-alt); color: var(--text-sub);
  font-size: .74rem; font-weight: 700;
  border: 1px solid var(--border);
}

/* Fav */
.sk-fav-btn {
  width: 32px; height: 32px; border: none; flex-shrink: 0;
  background: transparent; border-radius: 50%;
  color: var(--border); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: color .15s, background .15s;
}
.sk-fav-btn svg { width: 16px; height: 16px; }
.sk-fav-btn:hover { color: #F43F5E; background: #FFF1F2; }
.sk-fav-btn--active { color: #F43F5E; }

/* Corps */
.sk-body { padding: 0 1rem .85rem; flex: 1; }
.sk-title {
  font-size: .98rem; font-weight: 700; line-height: 1.35;
  color: var(--text); margin: 0 0 .4rem;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sk-desc {
  font-size: .84rem; color: var(--text-sub); margin: 0; line-height: 1.55;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* Bandeau offre ⇄ cherche */
.sk-exchange {
  display: flex; align-items: stretch;
  margin: 0 1rem .85rem;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
}
.sk-exchange-side { flex: 1; padding: .6rem .7rem; display: flex; flex-direction: column; gap: .12rem; }
.sk-exchange-side--offer { background: var(--primary-light); }
.sk-exchange-side--seek  { background: var(--teal-light); text-align: right; }
.sk-exchange-label {
  font-size: .68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; opacity: .7;
}
.sk-exchange-side--offer .sk-exchange-label { color: var(--primary-dark); }
.sk-exchange-side--seek  .sk-exchange-label { color: var(--teal); }
.sk-exchange-value {
  font-weight: 700; font-size: .86rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sk-exchange-side--offer .sk-exchange-value { color: var(--primary-dark); }
.sk-exchange-side--seek  .sk-exchange-value { color: var(--teal); }
.sk-exchange-arrow {
  display: flex; align-items: center; justify-content: center; padding: 0 .55rem;
  background: var(--bg-alt); color: var(--text-muted);
}
.sk-exchange-arrow svg { width: 16px; height: 16px; }

/* Footer card */
.sk-footer { padding: 0 1rem 1rem; display: flex; gap: .5rem; }
.sk-cta-detail {
  flex-shrink: 0; font-size: .83rem; padding: .55rem .8rem;
  background: var(--bg-alt); color: var(--text-sub);
  border: 1px solid var(--border); border-radius: var(--radius-full);
  transition: border-color .15s, color .15s;
}
.sk-cta-detail:hover { border-color: var(--text-sub); color: var(--text); }
.sk-cta { flex: 1; font-size: .88rem; padding: .6rem 1rem; justify-content: center; }

/* ══ Modal demande ══ */
.req-overlay {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(0,0,0,.38);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.req-modal {
  background: #fff; border-radius: var(--radius-xl);
  padding: 2rem; width: 100%; max-width: 480px;
  position: relative;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  max-height: 90vh; overflow-y: auto;
}
.req-close {
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none; font-size: 1rem;
  color: var(--text-muted); cursor: pointer;
  padding: .3rem .45rem; border-radius: var(--radius-sm); line-height: 1;
}
.req-close:hover { background: var(--bg-alt); }
.req-modal h3 { margin: 0 0 .4rem; font-size: 1.2rem; }
.req-subtitle { color: var(--text-sub); font-size: .92rem; margin-bottom: 1.25rem; }

.req-skill-recap {
  display: flex; align-items: center; gap: .75rem;
  background: var(--bg-alt); border: 1px solid var(--border);
  border-radius: var(--radius); padding: .85rem 1rem;
  margin-bottom: 1.25rem; flex-wrap: wrap;
}
.req-recap-side { display: flex; flex-direction: column; gap: .1rem; flex: 1; }
.req-recap-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }
.req-recap-value { font-weight: 700; color: var(--text); font-size: .92rem; }
.req-recap-side--seek { text-align: right; }
.req-recap-arrow { color: var(--text-muted); font-size: 1.1rem; flex-shrink: 0; }

.req-field { display: grid; gap: .4rem; margin-bottom: 1rem; }
.req-field label { font-weight: 700; font-size: .92rem; }
.req-field textarea {
  width: 100%; border: 1px solid var(--border); border-radius: var(--radius);
  padding: .8rem 1rem; font-family: var(--sans); font-size: .92rem;
  background: var(--bg-alt); resize: vertical; color: var(--text);
  box-sizing: border-box; transition: border-color .15s;
}
.req-field textarea:focus { outline: 2px solid var(--primary); border-color: transparent; }
.req-char { font-size: .78rem; color: var(--text-muted); text-align: right; }

.req-error { color: var(--red); font-size: .9rem; margin: 0 0 .75rem; }
.req-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }

.req-success { text-align: center; padding: 1.5rem 0; }
.req-success-icon { font-size: 2.5rem; display: block; margin-bottom: .75rem; }
.req-success h3 { margin-bottom: .5rem; }
.req-success p { color: var(--text-sub); margin: 0; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .skills-grid { grid-template-columns: 1fr; }
  .sk-loading  { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .req-modal { padding: 1.5rem 1.25rem; }
  .req-actions { flex-direction: column-reverse; gap: .5rem; }
  .req-actions .btn { width: 100%; justify-content: center; }
  .req-skill-recap { flex-direction: column; gap: .5rem; }
  .req-recap-side--seek { text-align: left; }
  .req-recap-arrow { display: none; }
}

/* ── Pagination ── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: .4rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.pg-btn {
  padding: .5rem .9rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-sub);
  font-size: .88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}
.pg-btn:hover:not(:disabled) {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}
.pg-btn:disabled { opacity: .35; cursor: default; }

.pg-pages { display: flex; gap: .3rem; }

.pg-num {
  min-width: 36px; height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-sub);
  font-size: .88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
  display: flex; align-items: center; justify-content: center;
}
.pg-num:hover:not(:disabled):not(.pg-num--active) {
  background: var(--bg-alt);
  border-color: var(--text-muted);
}
.pg-num--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  cursor: default;
  box-shadow: 0 2px 8px rgba(232,51,61,.3);
}
.pg-num--ellipsis { cursor: default; border-color: transparent; background: transparent; }

.pg-info {
  margin-left: .5rem;
  font-size: .82rem;
  color: var(--text-muted);
  font-weight: 500;
}

@media (max-width: 500px) {
  .pg-btn { padding: .45rem .65rem; font-size: .82rem; }
  .pg-info { width: 100%; text-align: center; margin: 0; }
}
</style>
