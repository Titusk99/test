<template>
  <section class="info-page">
    <h1>Comment ça marche ?</h1>
    <div class="steps">
      <article class="step-card">
        <h2>1. Crée ton compte</h2>
        <p>Inscris-toi en quelques secondes pour rejoindre la communauté.</p>
      </article>
      <article class="step-card">
        <h2>2. Ajoute tes compétences</h2>
        <p>Indique ce que tu peux enseigner ou ce que tu souhaites apprendre.</p>
      </article>
      <article class="step-card">
        <h2>3. Échange entre étudiants</h2>
        <p>Trouve le bon profil et organise un échange utile et concret.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.info-page {
  max-width: 950px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.steps {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.step-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: var(--shadow);
}
</style>