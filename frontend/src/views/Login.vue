<template>
  <section class="auth-page">
    <div class="auth-card">
      <h1>Connexion</h1>
      <p>Connecte-toi à ton compte SkillSwap.</p>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required placeholder="ton@email.com" />
        </div>

        <div class="field">
          <label for="password">Mot de passe</label>
          <input id="password" v-model="password" type="password" required minlength="8" placeholder="••••••••" />
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <button type="submit" class="btn">Se connecter</button>
      </form>

      <p class="small-text">
        Pas encore de compte ?
        <router-link to="/register">Inscris-toi</router-link>
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/index.js'

const email = ref('')
const password = ref('')
const error = ref(null)
const success = ref(null)
const router = useRouter()

const handleSubmit = async () => {
  error.value = null
  success.value = null

  try {
    const json = await authApi.login(email.value, password.value)
    localStorage.setItem('token', json.token)
    localStorage.setItem('user', JSON.stringify(json.user))
    success.value = 'Connexion réussie !'
    setTimeout(() => router.push('/skills'), 600)
  } catch (err) {
    error.value = err.data?.errors?.[0]?.msg || err.message || 'Impossible de se connecter'
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background: var(--bg-alt);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 2.25rem;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
}

.auth-card h1 {
  margin-bottom: .4rem;
  font-size: 1.75rem;
}

.auth-card > p {
  color: var(--text-sub);
  margin-bottom: .25rem;
}

.field {
  display: grid;
  gap: .4rem;
  margin-top: 1.1rem;
}

label {
  font-weight: 600;
  font-size: .9rem;
  color: var(--text);
}

input {
  width: 100%;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: .85rem 1rem;
  background: var(--bg-alt);
  color: var(--text);
  font-family: var(--sans);
  font-size: .95rem;
  transition: border-color .15s;
  box-sizing: border-box;
}
input:focus {
  outline: none;
  border-color: var(--primary);
  background: #fff;
}

button[type="submit"] {
  width: 100%;
  margin-top: 1.5rem;
  background: var(--primary);
  border: none;
  border-radius: var(--radius-full);
  color: #fff;
  padding: .9rem 1.2rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background .15s, transform .15s;
}
button[type="submit"]:hover { background: var(--primary-dark); transform: translateY(-1px); }

.error {
  margin-top: 1rem;
  color: var(--red);
  font-size: .9rem;
}

.success {
  margin-top: 1rem;
  color: var(--green);
  font-size: .9rem;
}

.small-text {
  margin-top: 1.5rem;
  color: var(--text-sub);
  font-size: .9rem;
  text-align: center;
}

.small-text a {
  color: var(--primary);
  font-weight: 700;
}
.small-text a:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .auth-page { padding: 2rem .75rem; align-items: flex-start; }
  .auth-card { padding: 1.75rem 1.25rem; }
}
</style>
