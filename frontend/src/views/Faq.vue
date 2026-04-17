<template>
  <section class="info-page">
    <h1>FAQ</h1>
    <div class="faq-list">
      <article class="faq-item">
        <h2>Est-ce gratuit ?</h2>
        <p>Oui, la plateforme est pensée pour l'entraide entre étudiants.</p>
      </article>
      <article class="faq-item">
        <h2>Quelles compétences peut-on partager ?</h2>
        <p>Langues, développement, design, méthodologie, bureautique et bien plus.</p>
      </article>
      <article class="faq-item">
        <h2>Comment contacter un autre étudiant ?</h2>
        <p>Après connexion, tu peux consulter les offres et initier un échange.</p>
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

.faq-list {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.faq-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: var(--shadow);
}
</style>