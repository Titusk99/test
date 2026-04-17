<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { matchApi, requestsApi } from './api/index.js'

const route  = useRoute()
const router = useRouter()

// ── Menu mobile ────────────────────────────────────────────
const menuOpen = ref(false)
const closeMenu = () => { menuOpen.value = false }

// ── Utilisateur connecté ───────────────────────────────────
const currentUser = ref(null)

const readUser = () => {
  const s = localStorage.getItem('user')
  currentUser.value = s ? JSON.parse(s) : null
}

onMounted(readUser)
watch(() => route.path, readUser)

const userInitials = computed(() => {
  const n = currentUser.value?.nom || ''
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
})

const userFirstName = computed(() => {
  const n = currentUser.value?.nom || ''
  return n.split(' ')[0]
})

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  currentUser.value = null
  router.push('/')
}

// ── Recherche ──────────────────────────────────────────────
const searchOpen    = ref(false)
const searchQuery   = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchError   = ref(null)
let   searchTimer   = null

const openSearch = () => {
  searchOpen.value  = true
  searchQuery.value = ''
  searchResults.value = []
  searchError.value = null
}
const closeSearch = () => { searchOpen.value = false }

const onSearchInput = () => {
  clearTimeout(searchTimer)
  const q = searchQuery.value.trim()
  if (q.length < 2) { searchResults.value = []; return }
  searchLoading.value = true
  searchError.value   = null
  searchTimer = setTimeout(async () => {
    try {
      const data = await matchApi.search(q)
      searchResults.value = data.results ?? []
    } catch {
      searchError.value = 'Impossible d\'effectuer la recherche'
    } finally {
      searchLoading.value = false
    }
  }, 300)
}

// ── Proposer un échange depuis la recherche ────────────────
const sentRequests  = ref(new Set())   // skill IDs déjà envoyés dans cette session
const proposing     = ref(null)        // skill ID en cours d'envoi

const isOwnSkill = (skill) => {
  if (!currentUser.value) return false
  const uid = currentUser.value.id || currentUser.value._id
  const ownerId = skill.user_id?._id ?? skill.user_id
  return uid === ownerId
}

const proposeExchange = async (skill) => {
  if (!currentUser.value) { router.push('/login'); closeSearch(); return }
  if (proposing.value || sentRequests.value.has(skill._id)) return

  proposing.value = skill._id
  try {
    const receiverId = skill.user_id?._id ?? skill.user_id
    await requestsApi.send({ skill_id: skill._id, receiver_id: receiverId, message: '' })
    sentRequests.value = new Set([...sentRequests.value, skill._id])
  } catch {
    // Si déjà envoyé (409) ou autre erreur, on marque quand même pour éviter le spam
    sentRequests.value = new Set([...sentRequests.value, skill._id])
  } finally {
    proposing.value = null
  }
}
</script>

<template>
  <div id="app">

    <!-- ══════════════ HEADER ══════════════ -->
    <header class="app-header">
      <div class="hd-inner">

        <!-- Logo -->
        <router-link to="/" class="hd-logo" @click="closeMenu">
          <div class="hd-logo-icon">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="9" fill="#E8333D"/>
              <path d="M8 21 L16 11 L24 21" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 21 L16 16 L21 21" stroke="rgba(255,255,255,0.65)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="hd-logo-text">SkillSwap</span>
        </router-link>

        <!-- Nav desktop -->
        <nav class="hd-nav" :class="{ 'hd-nav--open': menuOpen }">
          <router-link to="/"        @click="closeMenu">Accueil</router-link>
          <router-link to="/skills"  @click="closeMenu">Compétences</router-link>
          <router-link to="/match"   @click="closeMenu">Mes matchs</router-link>
          <router-link to="/messages" @click="closeMenu">Messages</router-link>
          <router-link to="/favorites" @click="closeMenu">Favoris</router-link>
        </nav>

        <!-- Actions droite -->
        <div class="hd-actions">

          <!-- Bouton recherche -->
          <button class="hd-icon-btn" aria-label="Rechercher" @click="openSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="10.5" cy="10.5" r="6.5"/>
              <line x1="15.5" y1="15.5" x2="21" y2="21"/>
            </svg>
          </button>

          <!-- Si connecté : avatar + déconnexion -->
          <template v-if="currentUser">
            <router-link to="/profile" class="hd-user-btn" :title="`Profil de ${currentUser.nom}`">
              <div class="hd-avatar">{{ userInitials }}</div>
              <span class="hd-username">{{ userFirstName }}</span>
            </router-link>
            <button class="hd-logout" @click="logout(); closeMenu()">Déconnexion</button>
          </template>

          <!-- Sinon : connexion + inscription -->
          <template v-else>
            <router-link to="/login" class="hd-link" @click="closeMenu">Connexion</router-link>
            <router-link to="/register" class="hd-cta" @click="closeMenu">Inscription</router-link>
          </template>

          <!-- Burger mobile -->
          <button
            class="hd-burger"
            :class="{ 'hd-burger--open': menuOpen }"
            :aria-expanded="menuOpen"
            aria-label="Menu"
            @click="menuOpen = !menuOpen"
          >
            <span></span><span></span><span></span>
          </button>
        </div>

      </div>
    </header>

    <div v-if="menuOpen" class="hd-overlay" @click="closeMenu"></div>

    <!-- ══════════════ SEARCH OVERLAY ══════════════ -->
    <Teleport to="body">
      <div v-if="searchOpen" class="search-overlay" @click.self="closeSearch">
        <div class="search-panel">
          <div class="search-input-wrap">
            <svg class="search-icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="10.5" cy="10.5" r="6.5"/>
              <line x1="15.5" y1="15.5" x2="21" y2="21"/>
            </svg>
            <input
              v-model="searchQuery"
              @input="onSearchInput"
              @keydown.escape="closeSearch"
              type="text"
              placeholder="Rechercher une compétence… ex: React, Python, Design"
              class="search-input"
              autofocus
            />
            <button class="search-close-btn" @click="closeSearch">✕</button>
          </div>

          <div class="search-body">
            <p v-if="searchLoading" class="search-state">
              <span class="loading-dot"></span> Recherche…
            </p>
            <p v-else-if="searchError" class="search-state error">{{ searchError }}</p>
            <p v-else-if="searchQuery.trim().length >= 2 && searchResults.length === 0" class="search-state">
              Aucun résultat pour « {{ searchQuery }} »
            </p>
            <p v-else-if="!searchQuery.trim()" class="search-state hint">
              Saisis un mot-clé pour trouver des compétences.
            </p>

            <ul v-if="searchResults.length" class="search-results">
              <li v-for="r in searchResults" :key="r._id" class="search-result-item">
                <div class="result-main" @click="router.push(`/skills/${r._id}`); closeSearch()">
                  <div class="result-body">
                    <strong>{{ r.titre }}</strong>
                    <p class="result-desc">{{ r.description }}</p>
                  </div>
                  <div class="result-tags">
                    <span class="pill pill-purple">{{ r.competence_offerte }}</span>
                    <span class="result-arrow">→</span>
                    <span class="pill pill-cyan">{{ r.competence_recherchee }}</span>
                  </div>
                </div>
                <div class="result-actions">
                  <!-- Propre annonce -->
                  <router-link v-if="isOwnSkill(r)" :to="`/skills/${r._id}`" class="result-btn result-btn--secondary" @click="closeSearch">
                    Voir l'annonce
                  </router-link>
                  <!-- Pas connecté -->
                  <router-link v-else-if="!currentUser" to="/login" class="result-btn result-btn--secondary" @click="closeSearch">
                    Se connecter
                  </router-link>
                  <!-- Déjà envoyé -->
                  <span v-else-if="sentRequests.has(r._id)" class="result-btn result-btn--sent">
                    Demande envoyée ✓
                  </span>
                  <!-- Proposer -->
                  <button
                    v-else
                    class="result-btn result-btn--primary"
                    :disabled="proposing === r._id"
                    @click.stop="proposeExchange(r)"
                  >
                    {{ proposing === r._id ? '…' : 'Proposer un échange' }}
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════ MAIN ══════════════ -->
    <main>
      <router-view />
    </main>

    <!-- ══════════════ FOOTER ══════════════ -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <svg viewBox="0 0 28 28" fill="none" width="28" height="28">
              <rect width="28" height="28" rx="8" fill="#E8333D"/>
              <path d="M7 18 L14 10 L21 18" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>SkillSwap</span>
          </div>
          <p>Échange des compétences facilement entre étudiants et trouve l'échange parfait.</p>
        </div>

        <div class="footer-links">
          <div class="footer-col">
            <h4>Découvrir</h4>
            <router-link to="/">Accueil</router-link>
            <router-link to="/skills">Compétences</router-link>
            <router-link to="/how-it-works">Comment ça marche</router-link>
          </div>
          <div class="footer-col">
            <h4>Info</h4>
            <router-link to="/about">À propos</router-link>
            <router-link to="/faq">FAQ</router-link>
            <router-link to="/contact">Contact</router-link>
            <router-link to="/rgpd">Politique RGPD</router-link>
          </div>
          <div class="footer-col">
            <h4>Compte</h4>
            <router-link to="/login">Connexion</router-link>
            <router-link to="/register">Inscription</router-link>
          </div>
        </div>
      </div>
      <p class="footer-bottom">© 2026 SkillSwap — Projet étudiant EFREI</p>
    </footer>

  </div>
</template>

<style>
/* ══ Base ═══════════════════════════════════════════════════ */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  padding: 2.5rem 1rem 4rem;
}

/* ══ Header ══════════════════════════════════════════════════ */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid var(--border);
}

.hd-inner {
  position: relative;
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo */
.hd-logo {
  display: flex; align-items: center; gap: .5rem;
  flex-shrink: 0; text-decoration: none;
  transition: opacity .15s;
}
.hd-logo:hover { opacity: .85; }
.hd-logo-icon svg { width: 28px; height: 28px; display: block; }
.hd-logo-text {
  font-size: 1.08rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -.3px;
}

/* Nav centré */
.hd-nav {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: .1rem;
  width: max-content;
  min-width: 0;
}

.hd-nav a {
  position: relative;
  padding: .45rem .85rem;
  border-radius: var(--radius-sm);
  font-size: .92rem;
  font-weight: 500;
  color: var(--text-sub);
  text-decoration: none;
  transition: color .15s, background .15s;
  white-space: nowrap;
}
.hd-nav a:hover { color: var(--text); background: var(--bg-alt); }
.hd-nav a.router-link-active { color: var(--primary); font-weight: 700; background: var(--primary-light); }

/* Lien connexion */
.hd-link {
  display: inline-flex; align-items: center;
  padding: .45rem .85rem;
  border-radius: var(--radius-sm);
  font-size: .92rem; font-weight: 500;
  color: var(--text-sub); text-decoration: none;
  transition: color .15s, background .15s;
}
.hd-link:hover { color: var(--text); background: var(--bg-alt); }

/* CTA inscription — rouge */
.hd-cta {
  margin-left: .25rem;
  padding: .48rem 1.1rem !important;
  background: var(--primary) !important;
  color: #fff !important;
  border-radius: var(--radius-full) !important;
  font-weight: 700 !important;
  font-size: .9rem !important;
  transition: background .15s, transform .15s !important;
  white-space: nowrap;
}
.hd-cta:hover {
  background: var(--primary-dark) !important;
  transform: translateY(-1px) !important;
  color: #fff !important;
}
.hd-cta.router-link-active { background: var(--primary-dark) !important; color: #fff !important; }

/* Déconnexion */
.hd-logout {
  padding: .45rem .85rem;
  border-radius: var(--radius-sm); border: none; background: transparent;
  font-size: .92rem; font-weight: 500;
  color: var(--text-sub); cursor: pointer;
  transition: color .15s, background .15s;
}
.hd-logout:hover { color: var(--red); background: var(--red-light); }

/* Actions droite */
.hd-actions { display: flex; align-items: center; gap: .2rem; flex-shrink: 0; }

.hd-icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border: none; background: transparent;
  border-radius: var(--radius-sm); color: var(--text-muted);
  cursor: pointer; transition: background .15s, color .15s;
}
.hd-icon-btn svg { width: 18px; height: 18px; }
.hd-icon-btn:hover { background: var(--bg-alt); color: var(--text); }

/* Avatar connecté */
.hd-user-btn {
  display: flex; align-items: center; gap: .5rem;
  padding: .25rem .65rem .25rem .25rem;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border);
  background: #fff; text-decoration: none;
  transition: border-color .15s, box-shadow .15s;
}
.hd-user-btn:hover { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.hd-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--primary);
  color: #fff; font-size: .72rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.hd-username { font-size: .88rem; font-weight: 700; color: var(--text); }

/* Burger */
.hd-burger {
  display: none; flex-direction: column; justify-content: center; gap: 5px;
  width: 36px; height: 36px; padding: 9px;
  border: none; background: transparent; border-radius: var(--radius-sm);
  cursor: pointer; transition: background .15s;
}
.hd-burger:hover { background: var(--bg-alt); }
.hd-burger span {
  display: block; height: 1.8px; width: 100%;
  background: var(--text-sub); border-radius: 2px;
  transform-origin: center;
  transition: transform .25s, opacity .25s;
}
.hd-burger--open span:nth-child(1) { transform: translateY(6.8px) rotate(45deg); }
.hd-burger--open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hd-burger--open span:nth-child(3) { transform: translateY(-6.8px) rotate(-45deg); }

.hd-overlay {
  display: none; position: fixed; inset: 0;
  z-index: 99; background: rgba(0,0,0,.22);
}

/* ── Responsive nav ── */
@media (max-width: 860px) {
  .hd-burger { display: flex; }
  .hd-overlay { display: block; }
  .hd-username { display: none; }

  .hd-nav {
    position: fixed; top: 64px; right: 0;
    width: min(300px, 84vw); height: calc(100dvh - 64px);
    background: #fff; border-left: 1px solid var(--border);
    box-shadow: -4px 0 20px rgba(0,0,0,.08);
    flex-direction: column; justify-content: flex-start;
    align-items: stretch; gap: .15rem;
    padding: 1.25rem 1rem; z-index: 200;
    transform: translateX(100%);
    transition: transform .28s cubic-bezier(.4,0,.2,1);
  }
  .hd-nav--open { transform: translateX(0); }
  .hd-nav a { font-size: 1rem; padding: .65rem .9rem; }
  .hd-cta { margin-left: 0 !important; margin-top: .5rem; justify-content: center; text-align: center; }
}

/* ══ Overlay Recherche ═══════════════════════════════════════ */
.search-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,.38);
  backdrop-filter: blur(4px);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 80px;
}
.search-panel {
  background: #fff; border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  width: 100%; max-width: 640px; max-height: 78vh;
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-lg);
  overflow: hidden; margin: 0 1rem;
}
.search-input-wrap {
  display: flex; align-items: center; gap: .75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.search-icon-inline { width: 19px; height: 19px; color: var(--text-muted); flex-shrink: 0; }
.search-input {
  flex: 1; border: none; background: transparent;
  font-size: 1rem; font-family: var(--sans); color: var(--text); outline: none;
}
.search-close-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); padding: .3rem .5rem;
  border-radius: var(--radius-sm); font-size: .95rem; line-height: 1;
}
.search-close-btn:hover { background: var(--bg-alt); color: var(--text); }
.search-body { overflow-y: auto; flex: 1; }
.search-state {
  padding: 1.5rem; color: var(--text-muted); margin: 0;
  display: flex; align-items: center; gap: .5rem; font-size: .92rem;
}
.search-state.error { color: var(--red); }
.loading-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--primary); animation: pulse 1s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.search-results { list-style: none; padding: 0; margin: 0; }
.search-result-item {
  display: flex; flex-direction: column; gap: .5rem;
  padding: .85rem 1.25rem;
  border-bottom: 1px solid var(--border-light);
  transition: background .1s;
}
.search-result-item:hover { background: var(--bg-alt); }
.search-result-item:last-child { border-bottom: none; }

.result-main { cursor: pointer; display: flex; flex-direction: column; gap: .3rem; }
.result-body strong { font-weight: 700; color: var(--text); display: block; margin-bottom: .1rem; }
.result-desc {
  margin: 0; font-size: .85rem; color: var(--text-muted);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.result-tags { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.result-arrow { color: var(--text-muted); font-size: .85rem; }

.result-actions { display: flex; justify-content: flex-end; }
.result-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: .38rem .9rem; border-radius: var(--radius-full);
  font-size: .83rem; font-weight: 700; cursor: pointer;
  border: none; text-decoration: none; transition: background .15s, transform .12s;
  white-space: nowrap;
}
.result-btn--primary { background: var(--primary); color: #fff; }
.result-btn--primary:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
.result-btn--primary:disabled { opacity: .5; cursor: default; }
.result-btn--secondary {
  background: var(--bg-alt); color: var(--text-sub);
  border: 1px solid var(--border);
}
.result-btn--secondary:hover { color: var(--text); }
.result-btn--sent {
  color: var(--green); font-size: .83rem; font-weight: 700; padding: .38rem .6rem; cursor: default;
}

/* ══ Footer ══════════════════════════════════════════════════ */
.site-footer {
  background: #18181B;
  color: #A1A1AA;
  padding: 3rem 1.5rem 1.5rem;
}
.footer-inner {
  width: min(1100px, 100%); margin: 0 auto;
  display: flex; justify-content: space-between; gap: 2.5rem; flex-wrap: wrap;
}
.footer-logo {
  display: flex; align-items: center; gap: .5rem;
  font-weight: 800; font-size: 1.05rem; color: #fff;
  margin-bottom: .75rem;
}
.footer-brand p { color: #71717A; max-width: 300px; font-size: .88rem; line-height: 1.65; }
.footer-links { display: flex; gap: 3rem; flex-wrap: wrap; }
.footer-col { display: flex; flex-direction: column; gap: .5rem; }
.footer-col h4 {
  color: #fff; font-size: .78rem; text-transform: uppercase;
  letter-spacing: .09em; margin: 0 0 .45rem; font-weight: 700;
}
.footer-col a { color: #71717A; font-size: .88rem; transition: color .15s; }
.footer-col a:hover { color: #E4E4E7; }
.footer-col a.router-link-active { color: var(--primary); }
.footer-bottom {
  width: min(1100px, 100%); margin: 1.75rem auto 0;
  padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,.07);
  text-align: center; font-size: .82rem; color: #52525B;
}
@media (max-width: 700px) { .footer-links { gap: 1.5rem; } }
@media (max-width: 640px) { .search-overlay { padding-top: 56px; } }
@media (max-width: 520px) { .footer-inner { flex-direction: column; gap: 1.5rem; } }
</style>
