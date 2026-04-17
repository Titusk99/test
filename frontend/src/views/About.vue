<template>
  <section class="info-page">
    <h1>À propos de SkillSwap</h1>
    <p>
      SkillSwap est une plateforme d'échange de compétences entre étudiants. Le but est simple :
      partager ce que l'on sait faire et recevoir de l'aide sur d'autres sujets.
    </p>
    <div class="info-grid">
      <article class="info-card">
        <h2>Notre mission</h2>
        <p>Créer une entraide étudiante simple, rapide et utile au quotidien.</p>
      </article>
      <article class="info-card">
        <h2>Pour qui ?</h2>
        <p>Pour les étudiants qui veulent apprendre, transmettre et collaborer.</p>
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.info-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: var(--shadow);
}
</style>