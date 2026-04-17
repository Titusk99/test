<template>
  <section class="conv-page">

    <!-- ── Header ── -->
    <div class="conv-header">
      <button class="back-btn" @click="$router.push('/messages')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Retour
      </button>

      <div v-if="conversation" class="conv-header-info">
        <div class="conv-avatar" :style="{ background: partnerGrad }">
          {{ partnerInitials }}
        </div>
        <div>
          <strong class="conv-partner-name">{{ partnerName }}</strong>
          <span class="conv-skill-title">{{ conversation.skill_id?.titre || 'Échange' }}</span>
        </div>
        <!-- Badge statut -->
        <span :class="['conv-status-badge', conversation.statut]">
          {{ conversation.statut === 'accepted' ? '✓ Actif' : conversation.statut === 'refused' ? '✕ Refusé' : '⏳ En attente' }}
        </span>
      </div>
    </div>

    <!-- ── États ── -->
    <div v-if="loading" class="state-msg">Chargement de la conversation…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>

    <!-- ── Fil de messages ── -->
    <div v-else class="conv-body">

      <!-- Overlay demande en attente -->
      <div v-if="isPending" class="pending-overlay">
        <div class="pending-card">
          <template v-if="isReceiver">
            <div class="pending-avatar" :style="{ background: partnerGrad }">{{ partnerInitials }}</div>
            <h3>{{ partnerName }} souhaite échanger avec toi !</h3>
            <p v-if="conversation.message" class="pending-request-msg">
              "{{ conversation.message }}"
            </p>
            <p class="pending-sub">Accepte ou refuse cette demande pour accéder à la messagerie.</p>
            <div class="pending-actions">
              <button class="btn-refuse" @click="handleRefuse" :disabled="actionLoading">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M18 6 6 18M6 6l12 12"/></svg>
                Refuser
              </button>
              <button class="btn-accept" @click="handleAccept" :disabled="actionLoading">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M20 6 9 17l-5-5"/></svg>
                Accepter
              </button>
            </div>
            <p v-if="actionError" class="action-error">{{ actionError }}</p>
          </template>
          <template v-else>
            <div class="pending-waiting-icon">⏳</div>
            <h3>Demande envoyée</h3>
            <p class="pending-sub">En attente de validation par <strong>{{ partnerName }}</strong>.</p>
            <p class="pending-sub">La messagerie sera disponible dès que ta demande sera acceptée.</p>
          </template>
        </div>
      </div>

      <!-- Thread (flouté si pending) -->
      <div class="messages-thread" :class="{ 'thread--blurred': isPending }" ref="threadRef">

        <div v-if="messages.length === 0" class="empty-thread">
          <span class="empty-icon">💬</span>
          <p>Aucun message pour l'instant.<br>Envoie le premier message !</p>
        </div>

        <div
          v-for="msg in messages"
          :key="msg._id"
          class="msg-row"
          :class="{ 'msg-row--mine': isMine(msg) }"
        >
          <div v-if="!isMine(msg)" class="msg-avatar">
            {{ partnerInitials }}
          </div>

          <div class="msg-bubble" :class="isMine(msg) ? 'msg-bubble--mine' : 'msg-bubble--theirs'">
            <p class="msg-text">{{ msg.contenu }}</p>
            <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
          </div>
        </div>

      </div>

      <!-- ── Formulaire d'envoi (masqué si pending/refused) ── -->
      <template v-if="!isPending && conversation?.statut !== 'refused'">
        <form class="send-form" @submit.prevent="sendMessage">
          <textarea
            v-model="newMessage"
            class="send-input"
            placeholder="Écris ton message…"
            rows="1"
            maxlength="1000"
            @keydown.enter.exact.prevent="sendMessage"
            @input="autoResize"
            ref="inputRef"
          ></textarea>
          <button
            type="submit"
            class="send-btn"
            :disabled="!newMessage.trim() || sending"
            aria-label="Envoyer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z"/>
            </svg>
          </button>
        </form>
        <p v-if="sendError" class="send-error">{{ sendError }}</p>
      </template>

      <!-- Message si refusé -->
      <div v-if="conversation?.statut === 'refused'" class="refused-banner">
        Cette demande a été refusée. La messagerie n'est pas disponible.
      </div>

    </div>

  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io } from 'socket.io-client'
import { messagesApi, requestsApi } from '../api/index.js'

const route       = useRoute()
const router      = useRouter()
const requestId   = route.params.id

const messages     = ref([])
const conversation = ref(null)
const loading      = ref(true)
const error        = ref(null)
const newMessage   = ref('')
const sending      = ref(false)
const sendError    = ref(null)
const threadRef    = ref(null)
const inputRef     = ref(null)
const actionLoading = ref(false)
const actionError   = ref(null)

// ── Utilisateur connecté ──────────────────────────────────────
const currentUser   = JSON.parse(localStorage.getItem('user') || 'null')
const currentUserId = currentUser?.id || currentUser?._id

// ── Statut de la demande ──────────────────────────────────────
const isPending = computed(() => conversation.value?.statut === 'pending')

// Est-ce que l'utilisateur courant est le destinataire de la demande ?
const isReceiver = computed(() => {
  if (!conversation.value) return false
  const rid = conversation.value.receiver_id?._id ?? String(conversation.value.receiver_id)
  return rid === currentUserId
})

// ── Infos partenaire ──────────────────────────────────────────
const partnerName = computed(() => {
  if (!conversation.value) return '…'
  const sender   = conversation.value.sender_id
  const receiver = conversation.value.receiver_id
  // sender_id est populé pour les received, receiver_id pour les sent
  const senderId = sender?._id ?? String(sender)
  if (senderId === currentUserId) return receiver?.nom || 'Étudiant'
  return sender?.nom || 'Étudiant'
})

const partnerInitials = computed(() =>
  (partnerName.value || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
)

const partnerGrad = 'linear-gradient(135deg, #E8333D, #F97316)'

// ── Helpers ───────────────────────────────────────────────────
const isMine = (msg) => {
  const sid = msg.sender_id?._id ?? msg.sender_id
  return sid === currentUserId
}

const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return `Hier ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = async () => {
  await nextTick()
  if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
}

const autoResize = () => {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 140) + 'px'
}

// ── Socket.io ─────────────────────────────────────────────────
let socket = null

const connectSocket = () => {
  const token = localStorage.getItem('token')
  if (!token) return

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    socket.emit('join_conversation', requestId)
  })

  socket.on('new_message', async (msg) => {
    const sid = msg.sender_id?._id ?? msg.sender_id
    if (sid === currentUserId) return
    messages.value.push(msg)
    await scrollToBottom()
  })
}

// ── Accepter / Refuser ────────────────────────────────────────
const handleAccept = async () => {
  actionLoading.value = true
  actionError.value   = null
  try {
    await requestsApi.update(requestId, 'accepted')
    conversation.value = { ...conversation.value, statut: 'accepted' }
    // Connecter le socket maintenant que c'est accepté
    if (!socket) connectSocket()
  } catch (err) {
    actionError.value = err.data?.message || err.message || 'Erreur lors de l\'acceptation.'
  } finally {
    actionLoading.value = false
  }
}

const handleRefuse = async () => {
  actionLoading.value = true
  actionError.value   = null
  try {
    await requestsApi.update(requestId, 'refused')
    router.push('/messages')
  } catch (err) {
    actionError.value = err.data?.message || err.message || 'Erreur lors du refus.'
    actionLoading.value = false
  }
}

// ── Chargement initial ────────────────────────────────────────
onMounted(async () => {
  try {
    const [reqData, msgData] = await Promise.all([
      requestsApi.getMine(),
      messagesApi.getConversation(requestId),
    ])

    const all = [...(reqData.sent || []), ...(reqData.received || [])]
    conversation.value = all.find(r => r._id === requestId) || null

    messages.value = Array.isArray(msgData) ? msgData : (msgData.data ?? [])
    await scrollToBottom()
  } catch (err) {
    error.value = err.message || 'Impossible de charger la conversation.'
  } finally {
    loading.value = false
  }

  // Ne connecter le socket que si l'échange est accepté
  if (conversation.value?.statut === 'accepted') {
    connectSocket()
  }
})

onUnmounted(() => {
  if (socket) {
    socket.emit('leave_conversation', requestId)
    socket.disconnect()
  }
})

// ── Envoi ─────────────────────────────────────────────────────
const sendMessage = async () => {
  const contenu = newMessage.value.trim()
  if (!contenu || sending.value) return

  sending.value  = true
  sendError.value = null

  try {
    const msg = await messagesApi.send(requestId, contenu)
    messages.value.push(msg)
    newMessage.value = ''
    if (inputRef.value) { inputRef.value.style.height = 'auto' }
    await scrollToBottom()
  } catch (err) {
    sendError.value = err.data?.message || err.message || 'Impossible d\'envoyer le message.'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.conv-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px - 5rem);
  min-height: 500px;
}

/* ── Header ── */
.conv-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: .45rem .9rem;
  font-size: .88rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: background .15s, color .15s;
  flex-shrink: 0;
}
.back-btn svg { width: 16px; height: 16px; }
.back-btn:hover { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }

.conv-header-info {
  display: flex;
  align-items: center;
  gap: .75rem;
  overflow: hidden;
  flex: 1;
}
.conv-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  color: #fff; font-size: .78rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.conv-partner-name { display: block; font-weight: 700; color: var(--text); font-size: .95rem; }
.conv-skill-title  { display: block; font-size: .8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.conv-status-badge {
  margin-left: auto;
  padding: .25rem .7rem;
  border-radius: var(--radius-full);
  font-size: .75rem;
  font-weight: 700;
  flex-shrink: 0;
}
.conv-status-badge.accepted { background: var(--green-light); color: var(--green); }
.conv-status-badge.pending  { background: var(--orange-light); color: var(--orange); }
.conv-status-badge.refused  { background: var(--red-light);    color: var(--red); }

/* ── État ── */
.state-msg { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
.state-msg.error { color: var(--red); }

/* ── Body ── */
.conv-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  position: relative; /* pour le overlay */
}

/* ── Overlay demande en attente ── */
.pending-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
}

.pending-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 2rem 2.25rem;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .85rem;
  text-align: center;
}

.pending-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  color: #fff; font-size: 1.1rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}

.pending-waiting-icon { font-size: 2.8rem; }

.pending-card h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text);
}

.pending-request-msg {
  background: var(--bg-alt);
  border-left: 3px solid var(--primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: .65rem 1rem;
  font-style: italic;
  color: var(--text-sub);
  font-size: .9rem;
  width: 100%;
  text-align: left;
  margin: 0;
}

.pending-sub {
  color: var(--text-muted);
  font-size: .87rem;
  margin: 0;
  line-height: 1.55;
}

.pending-actions {
  display: flex;
  gap: .75rem;
  width: 100%;
  margin-top: .25rem;
}

.btn-accept, .btn-refuse {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  padding: .7rem 1rem;
  border-radius: var(--radius-full);
  border: none;
  font-weight: 700;
  font-size: .9rem;
  cursor: pointer;
  transition: opacity .15s, transform .15s;
}
.btn-accept:hover:not(:disabled), .btn-refuse:hover:not(:disabled) { transform: translateY(-1px); }
.btn-accept:disabled, .btn-refuse:disabled { opacity: .5; cursor: default; }

.btn-accept {
  background: var(--green);
  color: #fff;
  box-shadow: 0 4px 12px rgba(16,185,129,.3);
}
.btn-accept:hover:not(:disabled) { background: #059669; }

.btn-refuse {
  background: var(--bg-alt);
  color: var(--text-sub);
  border: 1px solid var(--border);
}
.btn-refuse:hover:not(:disabled) { background: var(--red-light); color: var(--red); border-color: var(--red); }

.action-error {
  font-size: .83rem;
  color: var(--red);
  margin: 0;
}

/* ── Thread ── */
.messages-thread {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: .65rem;
  scroll-behavior: smooth;
}

.thread--blurred {
  filter: blur(5px);
  pointer-events: none;
  user-select: none;
}

.empty-thread {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  color: var(--text-muted);
  padding: 3rem 1rem;
  text-align: center;
}
.empty-icon { font-size: 2.5rem; }
.empty-thread p { margin: 0; line-height: 1.6; }

/* ── Message row ── */
.msg-row {
  display: flex;
  align-items: flex-end;
  gap: .55rem;
}
.msg-row--mine { flex-direction: row-reverse; }

.msg-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #E8333D, #F97316);
  color: #fff; font-size: .65rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}

/* ── Bulle ── */
.msg-bubble {
  max-width: 68%;
  padding: .65rem .9rem;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: .3rem;
}
.msg-bubble--theirs {
  background: var(--bg-alt);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}
.msg-bubble--mine {
  background: var(--primary);
  border-bottom-right-radius: 4px;
}
.msg-text {
  margin: 0;
  font-size: .93rem;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}
.msg-bubble--theirs .msg-text { color: var(--text); }
.msg-bubble--mine   .msg-text { color: #fff; }

.msg-time {
  font-size: .72rem;
  opacity: .65;
  align-self: flex-end;
}
.msg-bubble--theirs .msg-time { color: var(--text-muted); }
.msg-bubble--mine   .msg-time { color: rgba(255,255,255,.85); }

/* ── Formulaire envoi ── */
.send-form {
  display: flex;
  align-items: flex-end;
  gap: .65rem;
  padding: .85rem 1rem;
  border-top: 1px solid var(--border);
  background: var(--bg-alt);
  flex-shrink: 0;
}

.send-input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: .65rem .9rem;
  font-family: var(--sans);
  font-size: .93rem;
  color: var(--text);
  background: #fff;
  resize: none;
  line-height: 1.5;
  max-height: 140px;
  overflow-y: auto;
  transition: border-color .15s;
  box-sizing: border-box;
}
.send-input:focus { outline: none; border-color: var(--primary); }

.send-btn {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: var(--primary);
  border: none;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity .15s, transform .15s;
  box-shadow: 0 4px 14px rgba(232,51,61,.3);
}
.send-btn svg { width: 18px; height: 18px; }
.send-btn:hover:not(:disabled) { opacity: .88; transform: scale(1.05); }
.send-btn:disabled { opacity: .4; cursor: default; transform: none; }

.send-error {
  padding: .3rem 1rem .5rem;
  font-size: .85rem;
  color: var(--red);
  margin: 0;
  flex-shrink: 0;
}

/* ── Refusé ── */
.refused-banner {
  padding: .85rem 1rem;
  background: var(--red-light);
  color: var(--red);
  font-size: .88rem;
  font-weight: 600;
  text-align: center;
  border-top: 1px solid rgba(239,68,68,.2);
  flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .conv-page { padding: 1rem .75rem; height: calc(100vh - 64px - 3rem); }
  .msg-bubble { max-width: 82%; }
  .pending-card { padding: 1.5rem 1.25rem; }
}

@media (max-width: 480px) {
  .conv-header { gap: .65rem; }
  .back-btn span { display: none; }
  .back-btn { padding: .45rem .6rem; }
  .pending-actions { flex-direction: column; }
}
</style>
