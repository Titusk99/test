<template>
  <section class="skill-detail-page">

    <!-- ── États ── -->
    <div v-if="loading" class="state-msg">Chargement de l'annonce…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>

    <template v-else-if="skill">

      <!-- ── Retour ── -->
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Retour
      </button>

      <!-- ── Card principale ── -->
      <div class="detail-card">

        <!-- Header auteur -->
        <div class="detail-author">
          <div class="author-avatar" :style="{ background: avatarGrad }">
            {{ authorInitials }}
          </div>
          <div class="author-info">
            <strong class="author-name">{{ skill.user_id?.nom || 'Étudiant' }}</strong>
            <p v-if="skill.user_id?.bio" class="author-bio">{{ skill.user_id.bio }}</p>
          </div>
          <span class="detail-date">
            {{ new Date(skill.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
          </span>
        </div>

        <!-- Titre & description -->
        <h1 class="detail-title">{{ skill.titre }}</h1>
        <p class="detail-desc">{{ skill.description }}</p>

        <!-- Bandeau échange -->
        <div class="detail-exchange">
          <div class="exchange-side exchange-side--offer">
            <span class="exchange-label">Il / Elle offre</span>
            <span class="exchange-value">{{ skill.competence_offerte }}</span>
          </div>
          <div class="exchange-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
          </div>
          <div class="exchange-side exchange-side--seek">
            <span class="exchange-label">Il / Elle cherche</span>
            <span class="exchange-value">{{ skill.competence_recherchee }}</span>
          </div>
        </div>

        <!-- CTA -->
        <div class="detail-actions">
          <!-- C'est ma propre annonce -->
          <router-link v-if="isOwn" to="/profile" class="btn btn-outline">
            ✏️ Modifier mon annonce
          </router-link>

          <template v-else>
            <!-- Connecté : proposer un échange -->
            <button v-if="currentUser" class="btn btn-primary" @click="openRequest">
              Proposer un échange
            </button>
            <!-- Non connecté -->
            <router-link v-else to="/login" class="btn btn-primary">
              Se connecter pour proposer
            </router-link>

            <!-- Voir les profils compatibles -->
            <router-link :to="`/match?skill=${skill._id}`" class="btn btn-outline">
              🎯 Voir les matchs pour cette annonce
            </router-link>
          </template>
        </div>

      </div>

      <!-- ── Matchs compatibles (préview) ── -->
      <div v-if="matches.length > 0" class="matches-preview">
        <h2 class="matches-title">
          <span class="matches-badge">{{ matches.length }}</span>
          Annonce{{ matches.length > 1 ? 's' : '' }} compatible{{ matches.length > 1 ? 's' : '' }} trouvée{{ matches.length > 1 ? 's' : '' }}
        </h2>
        <p class="matches-subtitle">Ces étudiants ont exactement ce que tu cherches — et cherchent ce que tu offres.</p>

        <ul class="matches-list">
          <li v-for="(m, idx) in matches.slice(0, 4)" :key="m._id" class="match-card">
            <div class="match-header">
              <div class="match-avatar" :style="{ background: matchGrad(idx) }">
                {{ matchInitials(m.user_id?.nom) }}
              </div>
              <div class="match-meta">
                <strong>{{ m.user_id?.nom || 'Étudiant' }}</strong>
                <span class="match-score">
                  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 1l1.9 3.9L14 5.7l-3 2.9.7 4.1L8 10.5l-3.7 2.2.7-4.1-3-2.9 4.1-.8z"/></svg>
                  {{ m.compatibility_score }}% compatible
                </span>
              </div>
            </div>
            <div class="match-exchange">
              <span class="pill pill-purple">{{ m.competence_offerte }}</span>
              <span class="match-arrow">⇄</span>
              <span class="pill pill-cyan">{{ m.competence_recherchee }}</span>
            </div>
            <router-link :to="`/skills/${m._id}`" class="btn btn-ghost match-cta">Voir l'annonce</router-link>
          </li>
        </ul>

        <router-link v-if="matches.length > 4" :to="`/match?skill=${skill._id}`" class="btn btn-outline see-all-btn">
          Voir tous les {{ matches.length }} matchs →
        </router-link>
      </div>

    </template>

    <!-- ══ MODALE demande d'échange ══ -->
    <Teleport to="body">
      <div v-if="requestOpen" class="modal-overlay" @click.self="closeRequest">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" @click="closeRequest" aria-label="Fermer">✕</button>

          <div v-if="requestDone" class="req-success">
            <span class="req-success-icon">🎉</span>
            <h3>Demande envoyée !</h3>
            <p>{{ skill?.user_id?.nom }} recevra une notification.</p>
          </div>

          <template v-else>
            <h3>Proposer un échange</h3>
            <p class="req-subtitle">avec <strong>{{ skill?.user_id?.nom }}</strong></p>
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
import { skillsApi, matchApi, requestsApi } from '../api/index.js'

const route   = useRoute()
const skillId = route.params.id

const skill   = ref(null)
const matches = ref([])
const loading = ref(true)
const error   = ref(null)

const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
const currentUserId = currentUser?.id || currentUser?._id

const isOwn = computed(() =>
  skill.value && (skill.value.user_id?._id === currentUserId || skill.value.user_id?.id === currentUserId)
)

// ── Avatar ────────────────────────────────────────────────────
const avatarColors = [
  ['#7c3aed','#06b6d4'], ['#059669','#0ea5e9'],
  ['#d97706','#ef4444'], ['#db2777','#8b5cf6'],
]
const avatarGrad = computed(() => {
  const name = skill.value?.user_id?.nom || ''
  const idx  = name.charCodeAt(0) % avatarColors.length || 0
  const [a, b] = avatarColors[idx]
  return `linear-gradient(135deg, ${a}, ${b})`
})
const authorInitials = computed(() => {
  const n = skill.value?.user_id?.nom || '?'
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

const matchInitials = (nom) =>
  (nom || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

const matchGrad = (idx) => {
  const [a, b] = avatarColors[idx % avatarColors.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

// ── Chargement ────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [skillData, matchData] = await Promise.allSettled([
      skillsApi.getOne(skillId),
      matchApi.getMatchesForSkill(skillId),
    ])

    if (skillData.status === 'fulfilled') skill.value = skillData.value
    else throw skillData.reason

    if (matchData.status === 'fulfilled') {
      const raw = matchData.value
      matches.value = raw.matches ?? raw.data ?? []
    }
  } catch (err) {
    error.value = err.message || 'Impossible de charger cette annonce.'
  } finally {
    loading.value = false
  }
})

// ── Modale demande ────────────────────────────────────────────
const requestOpen    = ref(false)
const requestMessage = ref('')
const requesting     = ref(false)
const requestError   = ref(null)
const requestDone    = ref(false)

const openRequest  = () => { requestOpen.value = true; requestMessage.value = ''; requestError.value = null; requestDone.value = false }
const closeRequest = () => { requestOpen.value = false }

const submitRequest = async () => {
  if (!skill.value) return
  requesting.value = true
  requestError.value = null
  try {
    await requestsApi.send({
      skill_id:    skill.value._id,
      receiver_id: skill.value.user_id._id,
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
.skill-detail-page {
  max-width: 780px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Retour ── */
.back-btn {
  display: inline-flex; align-items: center; gap: .45rem;
  background: none; border: 1px solid var(--border);
  border-radius: var(--radius-full); padding: .45rem .9rem;
  font-size: .88rem; font-weight: 600; color: var(--text-muted);
  cursor: pointer; align-self: flex-start;
  transition: background .15s, color .15s, border-color .15s;
}
.back-btn svg { width: 16px; height: 16px; }
.back-btn:hover { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }

/* ── Card principale ── */
.detail-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Auteur */
.detail-author {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
}
.author-avatar {
  width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
  color: #fff; font-size: .88rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.author-info { flex: 1; }
.author-name { font-size: 1rem; font-weight: 700; color: var(--text-h); display: block; }
.author-bio  { font-size: .85rem; color: var(--text-muted); margin: .2rem 0 0; }
.detail-date { font-size: .8rem; color: var(--text-muted); white-space: nowrap; }

/* Titre & description */
.detail-title { font-size: clamp(1.4rem, 2.5vw, 2rem); margin: 0; }
.detail-desc  { color: var(--text-muted); line-height: 1.7; margin: 0; }

/* Bandeau échange */
.detail-exchange {
  display: flex; align-items: stretch;
  border-radius: var(--radius-lg); overflow: hidden;
  border: 1px solid var(--border);
}
.exchange-side {
  flex: 1; padding: 1.1rem 1.25rem;
  display: flex; flex-direction: column; gap: .3rem;
}
.exchange-side--offer { background: var(--accent-light); }
.exchange-side--seek  { background: var(--cyan-light); text-align: right; }
.exchange-label {
  font-size: .75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; opacity: .7;
}
.exchange-side--offer .exchange-label { color: var(--accent-dark); }
.exchange-side--seek  .exchange-label { color: #0e7490; }
.exchange-value { font-weight: 800; font-size: 1.05rem; }
.exchange-side--offer .exchange-value { color: var(--accent-dark); }
.exchange-side--seek  .exchange-value { color: #0e7490; }
.exchange-arrow {
  display: flex; align-items: center; justify-content: center; padding: 0 .75rem;
  background: linear-gradient(to right, var(--accent-light), var(--cyan-light));
  color: var(--accent);
}
.exchange-arrow svg { width: 22px; height: 22px; }

/* CTA */
.detail-actions { display: flex; gap: .85rem; flex-wrap: wrap; }

/* ── Matchs preview ── */
.matches-preview {
  display: flex; flex-direction: column; gap: 1.25rem;
}
.matches-title {
  display: flex; align-items: center; gap: .75rem;
  font-size: 1.2rem; margin: 0;
}
.matches-badge {
  background: var(--grad-primary); color: #fff;
  font-size: .82rem; font-weight: 800;
  padding: .2rem .65rem; border-radius: var(--radius-full);
}
.matches-subtitle { color: var(--text-muted); margin: -.75rem 0 0; font-size: .92rem; }

.matches-list {
  list-style: none; padding: 0; margin: 0;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.match-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1.1rem;
  display: flex; flex-direction: column; gap: .75rem;
  box-shadow: var(--shadow-card);
  transition: transform .18s, box-shadow .18s;
}
.match-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }

.match-header { display: flex; align-items: center; gap: .65rem; }
.match-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  color: #fff; font-size: .72rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.match-meta { display: flex; flex-direction: column; gap: .1rem; }
.match-meta strong { font-size: .9rem; color: var(--text-h); }
.match-score {
  display: flex; align-items: center; gap: .25rem;
  font-size: .78rem; font-weight: 700; color: var(--accent);
}

.match-exchange { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.match-arrow    { color: #c4b5fd; font-size: 1rem; }

.match-cta { font-size: .85rem; padding: .55rem .9rem; width: 100%; justify-content: center; }

.see-all-btn { align-self: flex-start; }

/* ── État ── */
.state-msg       { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
.state-msg.error { color: var(--red); }

/* ── Boutons ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: .75rem 1.35rem; border-radius: var(--radius-full); border: none;
  font-weight: 700; font-size: .93rem; cursor: pointer;
  transition: transform .18s, box-shadow .18s, background .18s;
  text-decoration: none;
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
  cursor: pointer; color: var(--text-muted);
  padding: .35rem .5rem; border-radius: 8px;
}
.modal-close:hover { background: #f3f4f6; }

.req-subtitle { color: var(--text-muted); font-size: .92rem; margin-bottom: 1.25rem; }
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
@media (max-width: 600px) {
  .detail-card  { padding: 1.25rem; }
  .detail-exchange { flex-direction: column; }
  .exchange-side--seek { text-align: left; }
  .exchange-arrow { padding: .5rem 0; justify-content: center; transform: rotate(90deg); }
  .detail-actions { flex-direction: column; }
  .detail-actions .btn { width: 100%; }
  .req-actions { flex-direction: column-reverse; }
  .req-actions .btn { width: 100%; }
  .matches-list { grid-template-columns: 1fr; }
}
</style>
