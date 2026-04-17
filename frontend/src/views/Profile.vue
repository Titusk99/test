<template>
  <section class="profile-page">

    <!-- ── Hero ── -->
    <div class="profile-hero">
      <div>
        <span class="profile-badge">Mon profil</span>
        <h1>Votre profil</h1>
        <p>Retrouvez vos informations personnelles et vos compétences publiées sur SkillSwap.</p>
      </div>
      <div class="profile-action">
        <button class="btn btn-primary" @click="openEdit">Modifier le profil</button>
      </div>
    </div>

    <!-- ── Loader / Erreur ── -->
    <p v-if="loading" class="state-msg">Chargement...</p>
    <p v-else-if="fetchError" class="state-msg error">{{ fetchError }}</p>

    <!-- ── Cartes ── -->
    <div v-else class="profile-grid">

      <!-- Infos personnelles -->
      <article class="profile-card">
        <div class="card-header">
          <div class="avatar-circle">{{ initials }}</div>
          <h2>Informations</h2>
        </div>

        <div class="profile-row">
          <span class="label">Nom</span>
          <span class="value">{{ user.nom || '—' }}</span>
        </div>
        <div class="profile-row">
          <span class="label">Email</span>
          <span class="value">{{ user.email || '—' }}</span>
        </div>
        <div class="profile-row">
          <span class="label">Bio</span>
          <span class="value bio-value">{{ user.bio || 'Aucune bio renseignée.' }}</span>
        </div>
      </article>

      <!-- Compétences -->
      <article class="profile-card">
        <h2>Compétences</h2>

        <div class="profile-subcard">
          <h3>
            <span class="dot dot--offer"></span> Compétences offertes
          </h3>
          <p v-if="user.competences_offertes">{{ user.competences_offertes }}</p>
          <p v-else class="empty-hint">Aucune compétence offerte renseignée.</p>
        </div>

        <div class="profile-subcard">
          <h3>
            <span class="dot dot--seek"></span> Compétences recherchées
          </h3>
          <p v-if="user.competences_recherchees">{{ user.competences_recherchees }}</p>
          <p v-else class="empty-hint">Aucune compétence recherchée renseignée.</p>
        </div>
      </article>

      <!-- Mes annonces -->
      <article class="profile-card">
        <div class="card-header-row">
          <h2>Mes annonces</h2>
          <span class="count-badge">{{ mySkills.length }}</span>
        </div>

        <p v-if="mySkills.length === 0" class="empty-hint">Tu n'as pas encore d'annonces.</p>

        <ul v-else class="skills-list">
          <li v-for="skill in mySkills" :key="skill._id" class="skill-item">
            <div class="skill-info">
              <div class="skill-title-row">
                <strong>{{ skill.titre }}</strong>
                <span :class="['skill-status-badge', skill.statut === 'inactive' ? 'inactive' : 'active']">
                  {{ skill.statut === 'inactive' ? 'Inactive' : 'Active' }}
                </span>
              </div>
              <span class="skill-meta">Offre : {{ skill.competence_offerte }} · Recherche : {{ skill.competence_recherchee }}</span>
            </div>
            <div class="skill-actions">
              <button
                class="btn-icon btn-toggle"
                :title="skill.statut === 'inactive' ? 'Réactiver' : 'Désactiver'"
                @click="toggleSkillStatus(skill)"
              >{{ skill.statut === 'inactive' ? '▶️' : '⏸️' }}</button>
              <button class="btn-icon btn-edit" @click="startEditSkill(skill)" title="Modifier">✏️</button>
              <button class="btn-icon btn-del" @click="removeSkill(skill._id)" title="Supprimer">🗑️</button>
            </div>
          </li>
        </ul>

        <button class="btn btn-outline mt-1" @click="showNewSkill = true">+ Nouvelle annonce</button>
      </article>

    </div>

    <!-- ════════════════════════════════════
         MODALE — Modifier le profil
    ════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="editOpen" class="modal-overlay" @click.self="closeEdit">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button class="modal-close" @click="closeEdit" aria-label="Fermer">✕</button>
          <h2 id="modal-title">Modifier le profil</h2>

          <form @submit.prevent="saveProfile" class="edit-form">

            <div class="field">
              <label for="edit-nom">Nom</label>
              <input id="edit-nom" v-model="form.nom" type="text" required maxlength="80" />
            </div>

            <div class="field">
              <label for="edit-bio">Bio <small>(500 caractères max)</small></label>
              <textarea id="edit-bio" v-model="form.bio" maxlength="500" rows="3"
                placeholder="Décris ce que tu proposes ou ce que tu recherches…"></textarea>
              <span class="char-count">{{ form.bio.length }}/500</span>
            </div>

            <div class="field">
              <label for="edit-offre">Compétences offertes</label>
              <input id="edit-offre" v-model="form.competences_offertes" type="text"
                placeholder="ex: React, Node.js, UX Design" />
              <small class="hint">Sépare les compétences par des virgules</small>
            </div>

            <div class="field">
              <label for="edit-recherche">Compétences recherchées</label>
              <input id="edit-recherche" v-model="form.competences_recherchees" type="text"
                placeholder="ex: Python, Data Science, Figma" />
              <small class="hint">Sépare les compétences par des virgules</small>
            </div>

            <p v-if="saveError" class="error">{{ saveError }}</p>
            <p v-if="saveSuccess" class="success">{{ saveSuccess }}</p>

            <div class="form-actions">
              <button type="button" class="btn btn-ghost" @click="closeEdit">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════
         MODALE — Nouvelle / Modifier annonce
    ════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showNewSkill || editingSkill" class="modal-overlay" @click.self="closeSkillModal">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" @click="closeSkillModal" aria-label="Fermer">✕</button>
          <h2>{{ editingSkill ? 'Modifier l\'annonce' : 'Nouvelle annonce' }}</h2>

          <form @submit.prevent="saveSkill" class="edit-form">
            <div class="field">
              <label for="sk-titre">Titre</label>
              <input id="sk-titre" v-model="skillForm.titre" type="text" required maxlength="120"
                placeholder="ex: J'apprends React, tu m'apprends Python" />
            </div>
            <div class="field">
              <label for="sk-desc">Description</label>
              <textarea id="sk-desc" v-model="skillForm.description" rows="3"
                placeholder="Décris le format de l'échange (durée, visio, présentiel…)"></textarea>
            </div>
            <div class="field">
              <label for="sk-offre">Compétence offerte</label>
              <input id="sk-offre" v-model="skillForm.competence_offerte" type="text" required
                placeholder="ex: React" />
            </div>
            <div class="field">
              <label for="sk-recherche">Compétence recherchée</label>
              <input id="sk-recherche" v-model="skillForm.competence_recherchee" type="text" required
                placeholder="ex: Python" />
            </div>

            <p v-if="skillError" class="error">{{ skillError }}</p>
            <p v-if="skillSuccess" class="success">{{ skillSuccess }}</p>

            <div class="form-actions">
              <button type="button" class="btn btn-ghost" @click="closeSkillModal">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="skillSaving">
                {{ skillSaving ? 'Enregistrement…' : (editingSkill ? 'Mettre à jour' : 'Publier') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usersApi, skillsApi } from '../api/index.js'


// ── État principal ────────────────────────────────────────────────
const user      = ref({})
const mySkills  = ref([])
const loading   = ref(true)
const fetchError = ref(null)

// ── Modale profil ─────────────────────────────────────────────────
const editOpen   = ref(false)
const saving     = ref(false)
const saveError  = ref(null)
const saveSuccess = ref(null)
const form = ref({ nom: '', bio: '', competences_offertes: '', competences_recherchees: '' })

// ── Modale annonce ────────────────────────────────────────────────
const showNewSkill  = ref(false)
const editingSkill  = ref(null)
const skillSaving   = ref(false)
const skillError    = ref(null)
const skillSuccess  = ref(null)
const skillForm = ref({ titre: '', description: '', competence_offerte: '', competence_recherchee: '' })

// ── Computed ──────────────────────────────────────────────────────
const initials = computed(() => {
  const n = user.value.nom || ''
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
})

// ── Chargement initial ────────────────────────────────────────────
onMounted(async () => {
  const stored = localStorage.getItem('user')
  if (!stored) {
    fetchError.value = 'Tu n\'es pas connecté(e). Connecte-toi pour accéder à ton profil.'
    loading.value = false
    return
  }
  const { id } = JSON.parse(stored)
  try {
    const [userData, skillsData] = await Promise.all([
      usersApi.getUser(id),
      skillsApi.getMine(),
    ])
    user.value = userData
    mySkills.value = Array.isArray(skillsData) ? skillsData : (skillsData.data ?? [])
  } catch (err) {
    fetchError.value = err.message || 'Impossible de charger le profil.'
  } finally {
    loading.value = false
  }
})

// ── Édition profil ────────────────────────────────────────────────
const openEdit = () => {
  form.value = {
    nom: user.value.nom || '',
    bio: user.value.bio || '',
    competences_offertes: user.value.competences_offertes || '',
    competences_recherchees: user.value.competences_recherchees || '',
  }
  saveError.value = null
  saveSuccess.value = null
  editOpen.value = true
}

const closeEdit = () => { editOpen.value = false }

const saveProfile = async () => {
  saving.value = true
  saveError.value = null
  saveSuccess.value = null
  try {
    const updated = await usersApi.updateUser(user.value._id, form.value)
    user.value = { ...user.value, ...updated }
    // Mettre à jour le localStorage avec l'objet complet
    localStorage.setItem('user', JSON.stringify({
      id: updated._id,
      nom: updated.nom,
      email: updated.email,
      competences_offertes: updated.competences_offertes,
      competences_recherchees: updated.competences_recherchees,
      avatar: updated.avatar,
      bio: updated.bio
    }))
    saveSuccess.value = 'Profil mis à jour !'
    setTimeout(closeEdit, 900)
  } catch (err) {
    saveError.value = err.data?.message || err.message || 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}

// ── Annonces ──────────────────────────────────────────────────────
const startEditSkill = (skill) => {
  editingSkill.value = skill
  skillForm.value = {
    titre: skill.titre,
    description: skill.description,
    competence_offerte: skill.competence_offerte,
    competence_recherchee: skill.competence_recherchee,
  }
  skillError.value = null
  skillSuccess.value = null
}

const closeSkillModal = () => {
  showNewSkill.value = false
  editingSkill.value = null
  skillForm.value = { titre: '', description: '', competence_offerte: '', competence_recherchee: '' }
  skillError.value = null
  skillSuccess.value = null
}

const saveSkill = async () => {
  skillSaving.value = true
  skillError.value = null
  skillSuccess.value = null
  try {
    if (editingSkill.value) {
      const updated = await skillsApi.update(editingSkill.value._id, skillForm.value)
      const idx = mySkills.value.findIndex(s => s._id === editingSkill.value._id)
      if (idx !== -1) mySkills.value[idx] = updated
      skillSuccess.value = 'Annonce mise à jour !'
    } else {
      const created = await skillsApi.create(skillForm.value)
      mySkills.value.unshift(created)
      skillSuccess.value = 'Annonce publiée !'
    }
    setTimeout(closeSkillModal, 800)
  } catch (err) {
    skillError.value = err.data?.errors?.[0]?.msg || err.message || 'Erreur lors de la sauvegarde'
  } finally {
    skillSaving.value = false
  }
}

const removeSkill = async (id) => {
  if (!confirm('Supprimer cette annonce ?')) return
  try {
    await skillsApi.remove(id)
    mySkills.value = mySkills.value.filter(s => s._id !== id)
  } catch (err) {
    alert(err.message || 'Impossible de supprimer')
  }
}

const toggleSkillStatus = async (skill) => {
  try {
    const { statut } = await skillsApi.toggleStatus(skill._id)
    const idx = mySkills.value.findIndex(s => s._id === skill._id)
    if (idx !== -1) mySkills.value[idx] = { ...mySkills.value[idx], statut }
  } catch (err) {
    alert(err.message || 'Impossible de changer le statut')
  }
}
</script>

<style scoped>
/* ── Page ── */
.profile-page { padding: 2rem 1rem; }

/* ── Hero ── */
.profile-hero {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 2rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 1.75rem 2rem;
  box-shadow: var(--shadow);
}
.profile-badge {
  display: inline-flex;
  padding: .35rem .85rem;
  border-radius: 999px;
  background: rgba(124,58,237,.12);
  color: #5b21b6;
  font-weight: 700;
  margin-bottom: .75rem;
}
.profile-hero h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem,2.4vw,2.75rem); }
.profile-hero p  { margin: 0; max-width: 720px; color: #475569; }
.profile-action  { display: flex; justify-content: flex-end; flex-shrink: 0; }

/* ── Grid ── */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
.full-width { grid-column: 1 / -1; }

/* ── Card ── */
.profile-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 1.75rem;
  box-shadow: var(--shadow);
}
.card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
.card-header h2, .profile-card > h2 { margin: 0 0 1rem; }
.card-header-row { display: flex; align-items: center; gap: .75rem; margin-bottom: 1rem; }
.card-header-row h2 { margin: 0; }
.count-badge {
  background: rgba(124,58,237,.12);
  color: #5b21b6;
  font-weight: 700;
  font-size: .85rem;
  padding: .15rem .6rem;
  border-radius: 999px;
}

/* Avatar initiales */
.avatar-circle {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff;
  font-weight: 800;
  font-size: 1.15rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* Rows */
.profile-row { display: grid; gap: .35rem; margin-bottom: 1rem; }
.profile-row .label { font-size: .9rem; color: #6b7280; }
.profile-row .value { font-weight: 600; color: var(--text-h); }
.bio-value { font-weight: 400; color: #475569; line-height: 1.6; }

/* Subcards */
.profile-subcard {
  background: #faf5ff;
  border: 1px solid rgba(124,58,237,.15);
  border-radius: 18px;
  padding: 1rem 1.15rem;
  margin-top: 1rem;
}
.profile-subcard h3 { margin: 0 0 .5rem; font-size: 1rem; display: flex; align-items: center; gap: .5rem; }
.profile-subcard p  { margin: 0; color: #475569; line-height: 1.65; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot--offer { background: #7c3aed; }
.dot--seek  { background: #0ea5e9; }

/* Mes annonces */
.skills-list { list-style: none; padding: 0; display: grid; gap: .85rem; margin-bottom: 1rem; }
.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: .85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fafafa;
}
.skill-info { display: grid; gap: .25rem; }
.skill-title-row { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
.skill-info strong { font-weight: 700; color: var(--text-h); }
.skill-meta { font-size: .85rem; color: #6b7280; }

.skill-status-badge {
  font-size: .72rem;
  font-weight: 700;
  padding: .15rem .55rem;
  border-radius: 999px;
  flex-shrink: 0;
}
.skill-status-badge.active   { background: #dcfce7; color: #166534; }
.skill-status-badge.inactive { background: #f3f4f6; color: #6b7280; }

.skill-actions { display: flex; gap: .5rem; flex-shrink: 0; }
.btn-icon {
  background: none; border: 1px solid var(--border);
  border-radius: 8px; padding: .3rem .55rem;
  cursor: pointer; font-size: 1rem;
  transition: background .15s;
}
.btn-icon:hover { background: #f3f4f6; }
.btn-toggle:hover { background: #fff7ed; border-color: #f97316; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: .85rem 1.35rem;
  border-radius: 999px; border: none;
  font-weight: 700; cursor: pointer;
  transition: background .2s;
}
.btn-primary  { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-dark); }
.btn-primary:disabled { opacity: .6; cursor: default; }
.btn-outline  { background: transparent; border: 2px solid var(--accent); color: var(--accent); }
.btn-outline:hover { background: rgba(124,58,237,.06); }
.btn-ghost    { background: #f3f4f6; color: #374151; }
.btn-ghost:hover { background: #e5e7eb; }
.mt-1 { margin-top: .75rem; }

/* State */
.state-msg { padding: 2rem; text-align: center; color: #6b7280; }
.empty-hint { color: #9ca3af; font-style: italic; }

/* ── Modal overlay ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.modal {
  background: var(--surface, #fff);
  border-radius: 24px;
  padding: 2rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,.18);
}
.modal h2 { margin: 0 0 1.5rem; font-size: 1.4rem; }
.modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none;
  font-size: 1.1rem; cursor: pointer; color: #6b7280;
  line-height: 1; padding: .35rem .5rem; border-radius: 8px;
}
.modal-close:hover { background: #f3f4f6; }

/* ── Form ── */
.edit-form { display: grid; gap: 1.1rem; }
.field { display: grid; gap: .45rem; }
label { font-weight: 600; font-size: .95rem; }
input, textarea {
  width: 100%; border: 1px solid var(--border);
  border-radius: 14px; padding: .85rem 1rem;
  background: #faf7f2; color: var(--text);
  font-size: .95rem; font-family: inherit;
  box-sizing: border-box;
}
textarea { resize: vertical; }
input:focus, textarea:focus { outline: 2px solid var(--accent); border-color: transparent; }
.char-count { font-size: .8rem; color: #9ca3af; text-align: right; }
.hint { font-size: .82rem; color: #9ca3af; }
small { color: #9ca3af; font-weight: 400; }
.form-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: .5rem; }
.error   { color: #b91c1c; margin: 0; }
.success { color: #164e63; margin: 0; }

@media (max-width: 768px) {
  .profile-grid { grid-template-columns: 1fr; }
  .full-width { grid-column: 1; }
}

@media (max-width: 640px) {
  .profile-page { padding: 1rem .75rem; }
  .profile-hero { flex-direction: column; align-items: stretch; padding: 1.25rem; }
  .profile-hero h1 { font-size: 1.6rem; }
  .profile-action { justify-content: stretch; }
  .profile-action .btn { width: 100%; }
  .profile-card { padding: 1.25rem; }
  .form-actions { flex-direction: column-reverse; }
  .form-actions .btn { width: 100%; }
}

@media (max-width: 480px) {
  .skill-item { flex-direction: column; align-items: flex-start; gap: .75rem; }
  .skill-actions { align-self: flex-end; }
  .modal { padding: 1.5rem 1.25rem; border-radius: 18px; }
}
</style>
