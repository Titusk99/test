<template>
  <section class="messages-page">
    <div class="messages-hero">
      <h1>Mes messages</h1>
      <p>Retrouve ici toutes tes conversations avec d'autres étudiants.</p>
    </div>

    <div v-if="loading" class="state-msg">Chargement...</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <div v-else-if="conversations.length === 0" class="state-msg">
      Aucune conversation pour l'instant. Envoie une demande d'échange pour commencer !
    </div>

    <div v-else class="conversations-list">
      <article
        v-for="conv in conversations"
        :key="conv._id"
        class="conv-card"
        :class="{ 'conv-card--pending': conv.statut === 'pending' }"
        @click="openConversation(conv._id)"
      >
        <div class="conv-avatar-wrap">
          <div class="conv-avatar-circle">{{ partnerInitials(conv) }}</div>
        </div>
        <div class="conv-info">
          <strong>{{ conv.skill_id?.titre || 'Échange' }}</strong>
          <span class="conv-partner">avec {{ partnerName(conv) }}</span>
          <span v-if="conv.statut === 'pending' && isReceiver(conv)" class="conv-hint">
            💬 Action requise — accepte ou refuse cette demande
          </span>
        </div>
        <span :class="['conv-status', conv.statut]">
          {{ conv.statut === 'accepted' ? '✓ Actif' : conv.statut === 'pending' ? '⏳ En attente' : conv.statut }}
        </span>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { requestsApi } from '../api/index.js'

const router = useRouter()
const conversations = ref([])
const loading = ref(true)
const error = ref(null)

const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
const currentUserId = currentUser?.id || currentUser?._id

onMounted(async () => {
  try {
    const data = await requestsApi.getMine()
    conversations.value = [...(data.sent || []), ...(data.received || [])].filter(
      r => r.statut === 'accepted' || r.statut === 'pending'
    )
  } catch (err) {
    error.value = err.message || 'Impossible de charger les conversations'
  } finally {
    loading.value = false
  }
})

const partnerName = (conv) => {
  const sender   = conv.sender_id
  const receiver = conv.receiver_id
  const senderId = sender?._id ?? String(sender)
  if (senderId === currentUserId) return receiver?.nom || 'Étudiant'
  return sender?.nom || 'Étudiant'
}

const partnerInitials = (conv) => {
  const name = partnerName(conv)
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const isReceiver = (conv) => {
  const rid = conv.receiver_id?._id ?? String(conv.receiver_id)
  return rid === currentUserId
}

const openConversation = (id) => {
  router.push(`/messages/${id}`)
}
</script>

<style scoped>
.messages-page {
  padding: 2rem 1rem;
  max-width: 760px;
  margin: 0 auto;
}

.messages-hero {
  margin-bottom: 2rem;
}

.messages-hero h1 {
  margin-bottom: 0.5rem;
}

.state-msg {
  text-align: center;
  color: #475569;
  padding: 3rem 1rem;
}

.state-msg.error {
  color: #b91c1c;
}

.conversations-list {
  display: grid;
  gap: 1rem;
}

.conv-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.4rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.conv-card:hover {
  box-shadow: var(--shadow);
  border-color: #D4D4D8;
}

.conv-card--pending {
  border-color: var(--orange);
  background: linear-gradient(135deg, #FFFBEB 0%, var(--surface) 60%);
}

.conv-avatar-wrap { flex-shrink: 0; }

.conv-avatar-circle {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: .78rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conv-card--pending .conv-avatar-circle {
  background: var(--orange);
}

.conv-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.conv-info strong {
  font-size: .95rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-partner {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.conv-hint {
  font-size: .8rem;
  color: var(--orange);
  font-weight: 600;
}

.conv-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
}

.conv-status.accepted { background: #dcfce7; color: #166534; }
.conv-status.pending  { background: #fef9c3; color: #854d0e; }
.conv-status.refused  { background: #fee2e2; color: #991b1b; }

@media (max-width: 480px) {
  .messages-page { padding: 1.25rem .75rem; }
  .conv-card {
    flex-direction: column;
    align-items: flex-start;
    gap: .75rem;
    padding: 1rem 1.1rem;
  }
  .conv-status { align-self: flex-start; }
}
</style>
