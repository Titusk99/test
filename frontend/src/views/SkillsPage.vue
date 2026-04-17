<template>
  <div class="skills-page">
    <div class="skills-hero">
      <div class="skills-hero-inner">
        <div>
          <span class="page-badge">Annonces</span>
          <h1>Compétences disponibles</h1>
          <p>Parcours les échanges proposés par la communauté EFREI.</p>
        </div>
        <router-link to="/profile" class="btn btn-primary">
          + Publier une annonce
        </router-link>
      </div>
    </div>
    <div class="skills-content">
      <SkillsList />
    </div>
  </div>
</template>

<script setup>
import SkillsList from '../components/SkillsList.vue'
</script>

<style scoped>
.skills-page {
  padding: 0;
}

/* Bandeau hero page */
.skills-hero {
  background: var(--bg-alt);
  border-bottom: 1px solid var(--border);
  padding: 2.5rem 1.5rem;
}
.skills-hero-inner {
  width: min(1120px, 100%);
  margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
  gap: 1.5rem; flex-wrap: wrap;
}
.page-badge {
  display: inline-flex;
  padding: .24rem .75rem; border-radius: var(--radius-full);
  background: var(--primary-light); color: var(--primary-dark);
  font-size: .76rem; font-weight: 700; letter-spacing: .05em;
  margin-bottom: .6rem;
}
.skills-hero h1 { margin: 0 0 .35rem; font-size: clamp(1.6rem, 2.5vw, 2rem); }
.skills-hero p  { margin: 0; color: var(--text-sub); font-size: .95rem; }

/* Contenu grille */
.skills-content {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
}

@media (max-width: 640px) {
  .skills-hero { padding: 1.75rem 1rem; }
  .skills-content { padding: 1.5rem 1rem 2.5rem; }
}

@media (max-width: 480px) {
  .skills-hero-inner { flex-direction: column; align-items: stretch; }
  .skills-hero-inner .btn { width: 100%; justify-content: center; }
}
</style>
