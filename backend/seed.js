/**
 * seed.js — SkillSwap
 * Peuplement massif : 30 utilisateurs, 75+ annonces, demandes variées.
 * Utilisation : node seed.js
 * ⚠️  Efface les données existantes avant d'insérer.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
const PWD         = 'Efrei2026!';

// ─────────────────────────────────────────────────────────────
// Schémas inline
// ─────────────────────────────────────────────────────────────
const User = mongoose.model('User', new mongoose.Schema(
  { nom: String, email: String, password_hash: String, bio: String,
    competences_offertes: String, competences_recherchees: String,
    email_verified: { type: Boolean, default: true } },
  { timestamps: { createdAt: 'created_at' } }
));

const Skill = mongoose.model('Skill', new mongoose.Schema(
  { user_id: mongoose.Schema.Types.ObjectId,
    titre: String, description: String,
    competence_offerte: String, competence_recherchee: String,
    statut: { type: String, default: 'active' } },
  { timestamps: { createdAt: 'created_at' } }
));

const SkillRequest = mongoose.model('SkillRequest', new mongoose.Schema(
  { sender_id: mongoose.Schema.Types.ObjectId,
    receiver_id: mongoose.Schema.Types.ObjectId,
    skill_id: mongoose.Schema.Types.ObjectId,
    statut: { type: String, default: 'pending' },
    message: { type: String, default: '' } },
  { timestamps: { createdAt: 'created_at' } }
));

// ─────────────────────────────────────────────────────────────
// Utilisateurs (30)
// ─────────────────────────────────────────────────────────────
const USERS_DATA = [
  // ── Dev Web ──
  { nom: 'Alice Martin',    email: 'alice@efrei.net',    bio: 'Passionnée de dev web, React et Node.js. Je cherche à progresser en Python et ML.',        competences_offertes: 'React, Node.js',       competences_recherchees: 'Python, Machine Learning' },
  { nom: 'Bob Dupont',      email: 'bob@efrei.net',      bio: 'Expert Python et Machine Learning. Je veux apprendre React pour mes interfaces ML.',        competences_offertes: 'Python, Machine Learning', competences_recherchees: 'React, TypeScript' },
  { nom: 'Lucas Renard',    email: 'lucas@efrei.net',    bio: 'Dev fullstack Vue.js / Laravel. Je veux progresser en DevOps et CI/CD.',                    competences_offertes: 'Vue.js, PHP/Laravel',  competences_recherchees: 'Docker, CI/CD' },
  { nom: 'Manon Girard',    email: 'manon@efrei.net',    bio: 'Frontend React / TypeScript. Passionnée d\'accessibilité. Je veux apprendre le design.',    competences_offertes: 'React, TypeScript',    competences_recherchees: 'Figma, UX Design' },
  { nom: 'Théo Lambert',    email: 'theo@efrei.net',     bio: 'Dev Angular en entreprise. Je veux découvrir React Native pour le mobile.',                  competences_offertes: 'Angular, TypeScript',  competences_recherchees: 'React Native, Mobile' },
  { nom: 'Inès Rousseau',   email: 'ines@efrei.net',     bio: 'Spécialiste Next.js et SSR. Je veux apprendre le DevOps pour déployer mes apps.',           competences_offertes: 'Next.js, React',       competences_recherchees: 'AWS, Docker' },

  // ── Data / IA ──
  { nom: 'Karim Benali',    email: 'karim@efrei.net',    bio: 'Data Scientist Python/TensorFlow. Je veux apprendre à présenter mes modèles avec Figma.',   competences_offertes: 'Python, TensorFlow',   competences_recherchees: 'Figma, Data Viz' },
  { nom: 'Sofia Mendes',    email: 'sofia@efrei.net',    bio: 'Analyste Data SQL / Power BI. Je veux apprendre Python pour automatiser mes analyses.',     competences_offertes: 'SQL, Power BI',        competences_recherchees: 'Python, Pandas' },
  { nom: 'Nathan Lefebvre', email: 'nathan@efrei.net',   bio: 'Machine Learning avec PyTorch. Je veux apprendre Vue.js pour créer des interfaces à mes modèles.', competences_offertes: 'PyTorch, Python',  competences_recherchees: 'Vue.js, JavaScript' },
  { nom: 'Amina Diop',      email: 'amina@efrei.net',    bio: 'Expert MongoDB et bases NoSQL. Je veux apprendre Power BI pour la data visualisation.',     competences_offertes: 'MongoDB, Node.js',     competences_recherchees: 'Power BI, SQL' },

  // ── DevOps / Infra ──
  { nom: 'David Nguyen',    email: 'david@efrei.net',    bio: 'DevOps Docker & Kubernetes. Je veux apprendre le design UX pour mes outils internes.',      competences_offertes: 'Docker, Kubernetes',   competences_recherchees: 'Figma, UX Design' },
  { nom: 'Julien Marchand', email: 'julien@efrei.net',   bio: 'Admin Linux, Bash scripting. Je cherche quelqu\'un pour m\'apprendre Python.',              competences_offertes: 'Linux, Bash',          competences_recherchees: 'Python, Automatisation' },
  { nom: 'Camille Durand',  email: 'camille@efrei.net',  bio: 'Infra AWS et Azure. Je veux apprendre React pour créer des dashboards de monitoring.',      competences_offertes: 'AWS, Azure',           competences_recherchees: 'React, TypeScript' },
  { nom: 'Romain Fabre',    email: 'romain@efrei.net',   bio: 'CI/CD avec GitHub Actions et GitLab. Je veux maîtriser Terraform et l\'IaC.',               competences_offertes: 'CI/CD, GitHub Actions', competences_recherchees: 'Terraform, IaC' },

  // ── Design / UX ──
  { nom: 'Clara Petit',     email: 'clara@efrei.net',    bio: 'Designer UX/UI freelance. Figma et prototypage. Je veux apprendre Docker.',                 competences_offertes: 'Figma, UX Design',     competences_recherchees: 'Docker, Dev Web' },
  { nom: 'Yasmine Benoit',  email: 'yasmine@efrei.net',  bio: 'Graphiste et motion designer After Effects. Je veux apprendre à coder en HTML/CSS.',        competences_offertes: 'After Effects, Figma', competences_recherchees: 'HTML/CSS, JavaScript' },
  { nom: 'Axel Perrin',     email: 'axel@efrei.net',     bio: 'Designer UI Figma et Adobe XD. Je cherche à apprendre React pour intégrer mes maquettes.',  competences_offertes: 'Figma, Adobe XD',      competences_recherchees: 'React, CSS' },

  // ── Mobile ──
  { nom: 'François Moreau', email: 'francois@efrei.net', bio: 'Dev Flutter depuis 2 ans. Je veux apprendre la cybersécurité mobile.',                      competences_offertes: 'Flutter, Dart',        competences_recherchees: 'Cybersécurité, Mobile' },
  { nom: 'Léa Fontaine',    email: 'lea@efrei.net',      bio: 'Dev iOS Swift. Je veux apprendre Flutter pour faire des apps cross-platform.',               competences_offertes: 'Swift, iOS',           competences_recherchees: 'Flutter, Dart' },
  { nom: 'Omar Khalil',     email: 'omar@efrei.net',     bio: 'Dev Android Kotlin natif. Je veux apprendre React Native pour le cross-platform.',          competences_offertes: 'Kotlin, Android',      competences_recherchees: 'React Native, JavaScript' },

  // ── Cybersécurité ──
  { nom: 'Emma Leclerc',    email: 'emma@efrei.net',     bio: 'Spécialiste pentest et forensic. Je cherche Flutter pour des apps de sécu mobile.',         competences_offertes: 'Cybersécurité, Pentest', competences_recherchees: 'Flutter, Mobile' },
  { nom: 'Bastien Colas',   email: 'bastien@efrei.net',  bio: 'CTF passionné. Reverse engineering et exploitation. Je veux apprendre Python avancé.',      competences_offertes: 'Reverse Engineering, CTF', competences_recherchees: 'Python, Scripting' },

  // ── Backend ──
  { nom: 'Grace Diallo',    email: 'grace@efrei.net',    bio: 'Dev backend Node.js et MongoDB. Je veux maîtriser SQL pour la data.',                       competences_offertes: 'Node.js, MongoDB',     competences_recherchees: 'SQL, PostgreSQL' },
  { nom: 'Hugo Bernard',    email: 'hugo@efrei.net',     bio: 'Expert SQL PostgreSQL. Je cherche Node.js pour créer des dashboards connectés.',             competences_offertes: 'SQL, PostgreSQL',      competences_recherchees: 'Node.js, Express' },
  { nom: 'Pauline Vidal',   email: 'pauline@efrei.net',  bio: 'Dev Java Spring Boot. Je veux apprendre React pour des interfaces à mes APIs.',              competences_offertes: 'Java, Spring Boot',    competences_recherchees: 'React, Frontend' },
  { nom: 'Mehdi Azoulay',   email: 'mehdi@efrei.net',    bio: 'Dev Go et microservices. Je cherche quelqu\'un pour m\'apprendre Docker / Kubernetes.',      competences_offertes: 'Go, Microservices',    competences_recherchees: 'Docker, Kubernetes' },

  // ── Autres spécialités ──
  { nom: 'Julie Chevalier', email: 'julie@efrei.net',    bio: 'Dev Unity et C#. Passionnée de game dev. Je veux apprendre Blender pour mes assets 3D.',    competences_offertes: 'Unity, C#',            competences_recherchees: 'Blender, 3D' },
  { nom: 'Antoine Gros',    email: 'antoine@efrei.net',  bio: 'Maker Arduino / Raspberry Pi. Électronique et IoT. Je veux apprendre Python pour l\'IoT.',  competences_offertes: 'Arduino, Raspberry Pi', competences_recherchees: 'Python, IoT' },
  { nom: 'Lena Schmitt',    email: 'lena@efrei.net',     bio: 'Native allemande, fluent anglais et espagnol. Je veux apprendre React en échange de langues.', competences_offertes: 'Allemand, Anglais, Espagnol', competences_recherchees: 'React, JavaScript' },
  { nom: 'Chloé Gauthier',  email: 'chloe@efrei.net',    bio: 'Photographe et vidéaste. Je veux apprendre Premiere Pro et apprendre à coder un portfolio.', competences_offertes: 'Photographie, Lightroom', competences_recherchees: 'Premiere Pro, HTML/CSS' },
  { nom: 'Victor Lemaire',  email: 'victor@efrei.net',   bio: 'Prof de guitare et musicien. Je veux apprendre la prod musicale sur Ableton.',               competences_offertes: 'Guitare, Solfège',     competences_recherchees: 'Ableton, MAO' },
];

// ─────────────────────────────────────────────────────────────
// Générateur d'annonces
// ─────────────────────────────────────────────────────────────
const buildSkills = (users) => {
  const [alice, bob, lucas, manon, theo, ines,
         karim, sofia, nathan, amina,
         david, julien, camille, romain,
         clara, yasmine, axel,
         francois, lea, omar,
         emma, bastien,
         grace, hugo, pauline, mehdi,
         julie, antoine, lena, chloe, victor] = users;

  return [
    // ── React ──
    { user_id: alice._id, titre: 'React (hooks & state management) contre Python',        description: 'Échange en visio 2h/semaine. Je t\'apprends React moderne (hooks, Context, Zustand). Tu m\'apprends Python et les bases du ML. Niveau débutant/intermédiaire accepté.', competence_offerte: 'React', competence_recherchee: 'Python' },
    { user_id: manon._id, titre: 'React + TypeScript contre Figma',                       description: 'Dev frontend expérimentée, je maîtrise React + TypeScript et les bonnes pratiques (tests, accessibilité). Je veux apprendre Figma pour designer mes propres interfaces.', competence_offerte: 'React', competence_recherchee: 'Figma' },
    { user_id: camille._id, titre: 'AWS + Cloud contre React',                            description: 'Je t\'apprends AWS (EC2, S3, Lambda, CloudFront) et les architectures cloud. En échange je veux apprendre React pour créer des dashboards de monitoring cloud.', competence_offerte: 'AWS', competence_recherchee: 'React' },
    { user_id: lena._id, titre: 'Anglais courant contre React / JavaScript',              description: 'Natif anglophone (niveau C2). Je donne des cours de conversation, grammaire et vocabulaire technique IT. En échange j\'apprends React et JavaScript pour créer un site perso.', competence_offerte: 'Anglais', competence_recherchee: 'React' },

    // ── Python ──
    { user_id: bob._id, titre: 'Python + ML contre React',                                description: 'Je maîtrise Python, Pandas, scikit-learn et les réseaux de neurones. Je cherche quelqu\'un pour m\'apprendre React afin de créer des interfaces pour mes modèles.', competence_offerte: 'Python', competence_recherchee: 'React' },
    { user_id: karim._id, titre: 'Python + TensorFlow contre Figma / Data Viz',          description: 'Data Scientist confirmé. Je t\'apprends Python de A à Z, TensorFlow et le Deep Learning. En retour tu m\'apprends Figma pour présenter mes résultats de manière visuelle.', competence_offerte: 'Python', competence_recherchee: 'Figma' },
    { user_id: julien._id, titre: 'Linux / Bash contre Python',                           description: 'Admin sys 3 ans d\'expérience. Je t\'apprends Linux (commandes, permissions, réseau) et le scripting Bash. Je veux apprendre Python pour automatiser mes tâches d\'administration.', competence_offerte: 'Linux', competence_recherchee: 'Python' },
    { user_id: antoine._id, titre: 'Arduino + IoT contre Python',                         description: 'Maker passionné. Je t\'apprends Arduino (capteurs, actionneurs, protocoles I2C/SPI) et Raspberry Pi. Je veux apprendre Python pour piloter mes projets IoT intelligemment.', competence_offerte: 'Arduino', competence_recherchee: 'Python' },
    { user_id: bastien._id, titre: 'Cybersécurité / CTF contre Python avancé',           description: 'CTF player (top 100 FR). Je t\'apprends le reverse engineering, exploitation et forensics. Tu m\'apprends Python avancé (asyncio, décorateurs, scripting réseau).', competence_offerte: 'Cybersécurité', competence_recherchee: 'Python' },

    // ── Vue.js ──
    { user_id: lucas._id, titre: 'Vue.js 3 + Laravel contre Docker',                     description: 'Dev fullstack Vue.js 3 (Composition API, Pinia) + Laravel. Je veux apprendre Docker pour containeriser mes projets et les déployer facilement.', competence_offerte: 'Vue.js', competence_recherchee: 'Docker' },
    { user_id: nathan._id, titre: 'PyTorch + Deep Learning contre Vue.js',               description: 'Je t\'apprends PyTorch depuis zéro jusqu\'aux transformers. En échange je veux apprendre Vue.js pour créer une interface web à mes modèles de traitement du langage.', competence_offerte: 'PyTorch', competence_recherchee: 'Vue.js' },

    // ── Node.js ──
    { user_id: grace._id, titre: 'Node.js + API REST contre SQL',                        description: 'Je crée des API REST avec Node.js, Express et MongoDB. Échange en visio 1h30 par semaine. Je veux apprendre SQL et la modélisation relationnelle pour élargir mes compétences backend.', competence_offerte: 'Node.js', competence_recherchee: 'SQL' },
    { user_id: grace._id, titre: 'Node.js contre Flutter',                               description: 'Je maîtrise Node.js, WebSocket et Socket.io. Je cherche à découvrir Flutter pour créer une app mobile qui consomme mon API en temps réel.', competence_offerte: 'Node.js', competence_recherchee: 'Flutter' },
    { user_id: amina._id, titre: 'MongoDB + NoSQL contre Power BI',                      description: 'Experte MongoDB (aggregation pipeline, indexing, Atlas). Je t\'apprends les bases NoSQL et la modélisation de documents. En retour je veux apprendre Power BI pour la visualisation.', competence_offerte: 'MongoDB', competence_recherchee: 'Power BI' },

    // ── TypeScript / Angular ──
    { user_id: theo._id, titre: 'Angular 17 + RxJS contre React Native',                 description: 'Dev Angular en entreprise depuis 3 ans. Je t\'apprends Angular, les observables RxJS et l\'architecture modulaire. En échange je veux apprendre React Native pour le mobile.', competence_offerte: 'Angular', competence_recherchee: 'React Native' },

    // ── Next.js ──
    { user_id: ines._id, titre: 'Next.js + SSR contre AWS',                              description: 'Spécialiste Next.js (App Router, Server Actions, ISR). Je t\'apprends le SSR/SSG et le SEO technique. En échange je veux apprendre AWS pour déployer mes apps en production.', competence_offerte: 'Next.js', competence_recherchee: 'AWS' },

    // ── SQL / Data ──
    { user_id: hugo._id, titre: 'SQL + PostgreSQL contre Node.js',                       description: 'Expert SQL (optimisation de requêtes, index, transactions, procédures stockées). Je cherche quelqu\'un pour m\'apprendre Node.js et créer des dashboards connectés en temps réel.', competence_offerte: 'SQL', competence_recherchee: 'Node.js' },
    { user_id: sofia._id, titre: 'SQL + Power BI contre Python',                         description: 'Analyste data avec 2 ans d\'expérience. Je t\'apprends SQL avancé (CTE, window functions) et Power BI (DAX, modélisation). Je veux apprendre Python pour automatiser mes rapports.', competence_offerte: 'SQL', competence_recherchee: 'Python' },

    // ── Docker / DevOps ──
    { user_id: david._id, titre: 'Docker + Kubernetes contre Figma',                     description: 'Je t\'apprends Docker (images, réseaux, volumes) et Kubernetes (pods, services, deployments). En échange je veux apprendre Figma pour prototyper mes outils DevOps internes.', competence_offerte: 'Docker', competence_recherchee: 'Figma' },
    { user_id: david._id, titre: 'Kubernetes contre SQL',                                description: 'Je gère des clusters Kubernetes en production (HPA, RBAC, Helm charts). Je voudrais apprendre SQL pour mieux gérer les bases de données de mes microservices.', competence_offerte: 'Kubernetes', competence_recherchee: 'SQL' },
    { user_id: romain._id, titre: 'CI/CD GitHub Actions contre Terraform',              description: 'Je t\'apprends GitHub Actions, GitLab CI et les pipelines de déploiement. Je veux apprendre Terraform pour gérer mon infra as code et automatiser mes déploiements cloud.', competence_offerte: 'CI/CD', competence_recherchee: 'Terraform' },
    { user_id: mehdi._id, titre: 'Go + Microservices contre Docker',                    description: 'Dev Go depuis 4 ans (gin, GRPC, protobuf). Je t\'apprends Go et l\'architecture microservices. Je cherche quelqu\'un pour m\'apprendre Docker et Kubernetes pour déployer mes services.', competence_offerte: 'Go', competence_recherchee: 'Docker' },

    // ── Java ──
    { user_id: pauline._id, titre: 'Java Spring Boot contre React',                     description: 'Dev Java Spring Boot avec 2 ans d\'expérience (REST, JPA, Hibernate, Spring Security). Je veux apprendre React pour créer des interfaces modernes à mes APIs.', competence_offerte: 'Java', competence_recherchee: 'React' },
    { user_id: pauline._id, titre: 'Java + Design Patterns contre TypeScript',           description: 'Je t\'apprends Java avancé (design patterns, SOLID, clean architecture) et les bonnes pratiques enterprise. En retour je veux apprendre TypeScript pour moderniser mon code frontend.', competence_offerte: 'Java', competence_recherchee: 'TypeScript' },

    // ── Figma / Design ──
    { user_id: clara._id, titre: 'Figma + UX Research contre Dev Web',                  description: 'Designer UX/UI freelance. Je t\'apprends Figma (components, auto-layout, variables) et les méthodes UX Research. En échange je veux apprendre les bases du dev web pour mieux collaborer avec les devs.', competence_offerte: 'Figma', competence_recherchee: 'HTML/CSS' },
    { user_id: axel._id, titre: 'Figma + Design System contre React',                   description: 'Designer UI spécialisé design systems. Je t\'apprends Figma avancé (tokens, variants, interactions). Je veux apprendre React pour intégrer mes propres maquettes et comprendre les contraintes dev.', competence_offerte: 'Figma', competence_recherchee: 'React' },
    { user_id: yasmine._id, titre: 'After Effects + Motion Design contre HTML/CSS',     description: 'Motion designer expérimentée. Je t\'apprends After Effects (animations, effets, expressions). Je veux apprendre HTML/CSS pour animer directement dans le navigateur.', competence_offerte: 'After Effects', competence_recherchee: 'HTML/CSS' },

    // ── Flutter / Mobile ──
    { user_id: francois._id, titre: 'Flutter + Dart contre Cybersécurité',             description: 'Dev Flutter depuis 2 ans (iOS + Android). Je t\'apprends Flutter, Dart, state management (Riverpod/BLoC). Je veux apprendre la cybersécurité mobile pour sécuriser mes apps.', competence_offerte: 'Flutter', competence_recherchee: 'Cybersécurité' },
    { user_id: lea._id, titre: 'Swift + iOS contre Flutter',                            description: 'Dev iOS Swift native depuis 3 ans (SwiftUI, UIKit, CoreData). Je t\'apprends Swift et l\'écosystème Apple. En échange je veux apprendre Flutter pour faire du cross-platform.', competence_offerte: 'Swift', competence_recherchee: 'Flutter' },
    { user_id: omar._id, titre: 'Android Kotlin contre React Native',                   description: 'Dev Android Kotlin natif (Jetpack Compose, Room, Coroutines). Je t\'apprends le développement Android natif. Je veux apprendre React Native pour faire des apps cross-platform.', competence_offerte: 'Kotlin', competence_recherchee: 'React Native' },

    // ── Cybersécurité ──
    { user_id: emma._id, titre: 'Cybersécurité + Pentest contre Flutter',               description: 'Spécialiste pentest et forensic digital. Je t\'apprends les bases de la cybersécurité (OWASP, CTF, pentest web). Je veux apprendre Flutter pour créer des outils de sécurité mobile.', competence_offerte: 'Cybersécurité', competence_recherchee: 'Flutter' },

    // ── Game Dev ──
    { user_id: julie._id, titre: 'Unity + C# contre Blender',                           description: 'Dev Unity avec 3 ans d\'expérience (jeux 2D/3D, physique, IA des NPCs). Je t\'apprends Unity et C#. Je veux apprendre Blender pour créer mes propres assets 3D et ne plus dépendre des asset stores.', competence_offerte: 'Unity', competence_recherchee: 'Blender' },
    { user_id: julie._id, titre: 'C# + Patterns contre Python',                         description: 'Dev C# expérimentée (Unity, .NET). Je t\'apprends C# et les design patterns orientés objet. Je veux apprendre Python pour le scripting et l\'automatisation de mes workflows de game dev.', competence_offerte: 'C#', competence_recherchee: 'Python' },

    // ── Langues ──
    { user_id: lena._id, titre: 'Allemand natif contre Dev Web',                        description: 'Native allemande, je donne des cours d\'allemand de A1 à C1 (grammaire, conversation, vocab tech). En échange je veux apprendre le dev web pour créer un portfolio multilingue.', competence_offerte: 'Allemand', competence_recherchee: 'HTML/CSS' },
    { user_id: lena._id, titre: 'Espagnol avancé contre JavaScript',                    description: 'Fluent espagnol C1 (séjour 2 ans en Espagne). Cours de conversation et grammaire. Je veux apprendre JavaScript et les bases du dev web.', competence_offerte: 'Espagnol', competence_recherchee: 'JavaScript' },

    // ── Photo / Vidéo ──
    { user_id: chloe._id, titre: 'Photographie + Lightroom contre Premiere Pro',        description: 'Photographe semi-pro. Je t\'apprends la photo (composition, lumière, retouche Lightroom). Je veux apprendre Premiere Pro pour faire le montage de mes vidéos événementielles.', competence_offerte: 'Photographie', competence_recherchee: 'Premiere Pro' },
    { user_id: chloe._id, titre: 'Photo / Lightroom contre HTML/CSS',                   description: 'Je t\'apprends la retouche photo et Lightroom. Je veux apprendre HTML/CSS pour créer mon portfolio photo en ligne sans passer par WordPress.', competence_offerte: 'Photographie', competence_recherchee: 'HTML/CSS' },

    // ── Musique ──
    { user_id: victor._id, titre: 'Guitare + Solfège contre Ableton',                   description: 'Prof de guitare (classique, rock, jazz). J\'enseigne le solfège, la théorie musicale et la pratique instrumentale. Je veux apprendre Ableton Live pour produire ma musique.', competence_offerte: 'Guitare', competence_recherchee: 'Ableton' },
    { user_id: victor._id, titre: 'Guitare contre HTML/CSS (site perso)',               description: 'Je donne des cours de guitare en échange d\'aide pour créer mon site web de musicien. Niveau débutant à intermédiaire, disponible en semaine.', competence_offerte: 'Guitare', competence_recherchee: 'HTML/CSS' },

    // ── Annonces croisées supplémentaires ──
    { user_id: alice._id, titre: 'Node.js + Express contre Python avancé',             description: 'Je t\'apprends Node.js, middlewares Express et l\'authentification JWT. En échange je veux progresser en Python avancé (asyncio, décorateurs, FastAPI).', competence_offerte: 'Node.js', competence_recherchee: 'Python' },
    { user_id: bob._id, titre: 'Machine Learning contre Figma',                         description: 'Je t\'apprends le ML de A à Z (régression, classification, deep learning). En retour je veux apprendre Figma pour présenter mes résultats à des clients non-techs.', competence_offerte: 'Machine Learning', competence_recherchee: 'Figma' },
    { user_id: karim._id, titre: 'Data Science + Pandas contre Vue.js',                description: 'Je t\'apprends la Data Science (nettoyage, feature engineering, visualisation avec Seaborn). Je veux apprendre Vue.js pour créer des dashboards interactifs.', competence_offerte: 'Data Science', competence_recherchee: 'Vue.js' },
    { user_id: nathan._id, titre: 'NLP + LLM contre React Native',                     description: 'Spécialiste NLP et modèles de langage (BERT, GPT fine-tuning). Je t\'apprends à utiliser les LLMs. Je veux apprendre React Native pour créer une app mobile IA.', competence_offerte: 'NLP', competence_recherchee: 'React Native' },
    { user_id: sofia._id, titre: 'Power BI + DAX contre Machine Learning',              description: 'Je maîtrise Power BI (rapports, DAX, dataflows). Je t\'apprends à créer des dashboards professionnels. Je veux apprendre le Machine Learning pour enrichir mes analyses.', competence_offerte: 'Power BI', competence_recherchee: 'Machine Learning' },
    { user_id: romain._id, titre: 'Git avancé + GitFlow contre React',                 description: 'Je t\'apprends Git avancé (rebase, cherry-pick, bisect, hooks) et les workflows GitFlow/trunk-based. Je veux apprendre React pour contribuer au frontend de mon équipe.', competence_offerte: 'Git', competence_recherchee: 'React' },
    { user_id: mehdi._id, titre: 'Architecture microservices contre Vue.js',            description: 'Je t\'apprends l\'architecture microservices (API gateway, event-driven, CQRS). Je veux apprendre Vue.js pour créer des interfaces à mes services Go.', competence_offerte: 'Microservices', competence_recherchee: 'Vue.js' },
    { user_id: julien._id, titre: 'Réseau + Sécurité infra contre Docker',             description: 'Je t\'apprends les bases des réseaux (TCP/IP, firewalls, VPN, VLAN) et la sécurité infra. Je veux apprendre Docker pour containeriser mes outils d\'admin réseau.', competence_offerte: 'Réseau', competence_recherchee: 'Docker' },
    { user_id: yasmine._id, titre: 'Illustrator + Identité visuelle contre CSS',       description: 'Graphiste 5 ans d\'expérience. Je t\'apprends Illustrator et la création d\'identités visuelles. En échange je veux apprendre CSS (flexbox, grid, animations) pour intégrer mes designs.', competence_offerte: 'Illustrator', competence_recherchee: 'CSS' },
    { user_id: axel._id, titre: 'Design System + Tokens contre Node.js',               description: 'Je t\'apprends à construire un design system complet avec Figma (tokens, documentation, librairie de composants). Je veux apprendre Node.js pour créer des outils de synchronisation design-code.', competence_offerte: 'Design System', competence_recherchee: 'Node.js' },
    { user_id: lea._id, titre: 'SwiftUI contre TypeScript',                            description: 'Je t\'apprends SwiftUI (vues, animations, data binding). Je veux apprendre TypeScript pour créer une version web de mon app iOS.', competence_offerte: 'SwiftUI', competence_recherchee: 'TypeScript' },
    { user_id: omar._id, titre: 'Jetpack Compose contre Flutter',                      description: 'Je t\'apprends Jetpack Compose et l\'architecture Android moderne (MVVM, Hilt, Flow). Je veux apprendre Flutter pour proposer une version iOS de mes apps Android.', competence_offerte: 'Jetpack Compose', competence_recherchee: 'Flutter' },
    { user_id: bastien._id, titre: 'Ethical Hacking contre Go',                        description: 'Je t\'apprends les bases du hacking éthique (recon, exploitation, post-exploitation). Je veux apprendre Go pour développer mes propres outils de pentest.', competence_offerte: 'Ethical Hacking', competence_recherchee: 'Go' },
    { user_id: amina._id, titre: 'Redis + Caching contre React',                       description: 'Experte Redis (cache, pub/sub, sessions, rate limiting). Je t\'apprends à optimiser les performances avec Redis. Je veux apprendre React pour créer une interface à mon dashboard de monitoring.', competence_offerte: 'Redis', competence_recherchee: 'React' },
    { user_id: camille._id, titre: 'Azure + DevOps contre Python',                     description: 'Certifiée Azure (AZ-900, AZ-104). Je t\'apprends Azure (App Service, Functions, AKS). Je veux apprendre Python pour créer des scripts d\'automatisation cloud.', competence_offerte: 'Azure', competence_recherchee: 'Python' },
    { user_id: antoine._id, titre: 'Raspberry Pi + Domotique contre JavaScript',       description: 'Je t\'apprends Raspberry Pi, Home Assistant et la domotique DIY. Je veux apprendre JavaScript pour créer une interface web à ma maison connectée.', competence_offerte: 'Raspberry Pi', competence_recherchee: 'JavaScript' },
    { user_id: hugo._id, titre: 'PostgreSQL + Performance contre Vue.js',              description: 'Expert PostgreSQL (EXPLAIN ANALYZE, partitioning, réplication). Je t\'apprends à optimiser tes requêtes SQL. Je veux apprendre Vue.js pour un dashboard d\'analyse de performances.', competence_offerte: 'PostgreSQL', competence_recherchee: 'Vue.js' },
    { user_id: ines._id, titre: 'SEO technique + Next.js contre Docker',               description: 'Je t\'apprends le SEO technique (Core Web Vitals, structured data, SSR) avec Next.js. Je veux apprendre Docker pour déployer mes sites Next.js en production avec des configs optimisées.', competence_offerte: 'SEO', competence_recherchee: 'Docker' },
    { user_id: lucas._id, titre: 'PHP/Laravel contre Kubernetes',                      description: 'Je t\'apprends Laravel (Eloquent, Queues, Broadcasting, Horizon). Je veux apprendre Kubernetes pour orchestrer mes apps Laravel en production.', competence_offerte: 'PHP', competence_recherchee: 'Kubernetes' },
    { user_id: grace._id, titre: 'API REST + Authentication contre Python',            description: 'Je t\'apprends à construire des APIs REST sécurisées (JWT, OAuth2, rate limiting, tests). Je veux apprendre Python pour créer des scripts d\'automatisation et de test de mes APIs.', competence_offerte: 'API REST', competence_recherchee: 'Python' },
    { user_id: chloe._id, titre: 'Vidéo + DaVinci Resolve contre React',              description: 'Je t\'apprends DaVinci Resolve (montage, étalonnage, effets). En échange je veux apprendre React pour créer une plateforme de partage de mes vidéos.', competence_offerte: 'DaVinci Resolve', competence_recherchee: 'React' },
    { user_id: victor._id, titre: 'Piano / Théorie musicale contre Python',            description: 'Je donne des cours de piano (classique, pop) et de théorie musicale. En échange je veux apprendre Python pour analyser des partitions et automatiser des compositions.', competence_offerte: 'Piano', competence_recherchee: 'Python' },
    { user_id: manon._id, titre: 'Accessibilité web (WCAG) contre Figma',             description: 'Spécialiste accessibilité web (WCAG 2.1 AA, ARIA, tests avec NVDA). Je t\'apprends à rendre tes apps accessibles. Je veux apprendre Figma pour créer des prototypes accessibles dès le design.', competence_offerte: 'Accessibilité Web', competence_recherchee: 'Figma' },
    { user_id: romain._id, titre: 'GitHub Actions avancé contre Vue.js',              description: 'Je t\'apprends à créer des workflows GitHub Actions complexes (matrix, reusable workflows, secrets, OIDC). Je veux apprendre Vue.js pour contribuer au frontend de mon projet open source.', competence_offerte: 'GitHub Actions', competence_recherchee: 'Vue.js' },
  ];
};

// ─────────────────────────────────────────────────────────────
// Seeding
// ─────────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connecté à : ${MONGODB_URI}\n`);

    console.log('🗑️  Nettoyage des données existantes...');
    await SkillRequest.deleteMany({});
    await Skill.deleteMany({});
    await User.deleteMany({});
    console.log('   ✔ Collections vidées.\n');

    // Création des utilisateurs
    console.log('👤 Création des 30 utilisateurs...');
    const createdUsers = [];
    for (const u of USERS_DATA) {
      const password_hash = await bcrypt.hash(PWD, SALT_ROUNDS);
      const user = await User.create({
        nom: u.nom, email: u.email, password_hash,
        bio: u.bio,
        competences_offertes: u.competences_offertes,
        competences_recherchees: u.competences_recherchees,
        email_verified: true,
      });
      createdUsers.push(user);
      process.stdout.write(`   ✔ ${u.nom}\n`);
    }

    // Création des annonces
    console.log('\n📢 Création des annonces...');
    const skillsData = buildSkills(createdUsers);
    const skills = await Skill.insertMany(skillsData);
    console.log(`   ✔ ${skills.length} annonces créées.`);

    // Demandes d'échange variées
    console.log('\n🤝 Création des demandes d\'échange...');
    const [alice, bob, lucas, manon, theo, ines,
           karim, sofia, nathan, amina,
           david, julien, camille, romain,
           clara, yasmine, axel,
           francois, lea, omar,
           emma, bastien,
           grace, hugo, pauline, mehdi,
           julie, antoine, lena, chloe, victor] = createdUsers;

    // Trouver les annonces utiles par compétence offerte
    const findSkill = (userId, offerte) => skills.find(s => String(s.user_id) === String(userId) && s.competence_offerte === offerte);

    const requests = [
      // Pending
      { sender_id: bob._id,     receiver_id: alice._id,   skill_id: findSkill(alice._id, 'React')?._id,         statut: 'pending',  message: 'Salut Alice ! Ton annonce React m\'intéresse vraiment. Je t\'apprends Python et ML en échange !' },
      { sender_id: clara._id,   receiver_id: david._id,   skill_id: findSkill(david._id, 'Docker')?._id,        statut: 'pending',  message: 'Bonjour David, je cherche exactement ce que tu proposes. Figma contre Docker, ça me convient parfaitement !' },
      { sender_id: nathan._id,  receiver_id: grace._id,   skill_id: findSkill(grace._id, 'Node.js')?._id,       statut: 'pending',  message: 'Salut ! PyTorch contre Node.js ça m\'intéresse, je suis dispo les weekends.' },
      { sender_id: lea._id,     receiver_id: francois._id, skill_id: findSkill(francois._id, 'Flutter')?._id,   statut: 'pending',  message: 'Bonjour François ! Swift contre Flutter c\'est exactement ce que je cherche.' },
      { sender_id: yasmine._id, receiver_id: axel._id,    skill_id: findSkill(axel._id, 'Figma')?._id,          statut: 'pending',  message: 'After Effects contre Figma, ça me semble être un super échange ! Dispo quand tu veux.' },
      { sender_id: antoine._id, receiver_id: julien._id,  skill_id: findSkill(julien._id, 'Linux')?._id,        statut: 'pending',  message: 'Linux contre Arduino, parfait pour mon projet domotique !' },
      { sender_id: victor._id,  receiver_id: chloe._id,   skill_id: findSkill(chloe._id, 'Photographie')?._id, statut: 'pending',  message: 'Guitare contre photo, ça me plairait beaucoup !' },

      // Accepted (messagerie active)
      { sender_id: alice._id,   receiver_id: bob._id,     skill_id: findSkill(bob._id, 'Python')?._id,          statut: 'accepted', message: 'Python contre React, exactement ce qu\'il me faut pour mon projet ML !' },
      { sender_id: emma._id,    receiver_id: david._id,   skill_id: findSkill(david._id, 'Docker')?._id,        statut: 'accepted', message: 'Parfait match ! Je t\'apprends la sécu, tu m\'apprends Docker.' },
      { sender_id: sofia._id,   receiver_id: karim._id,   skill_id: findSkill(karim._id, 'Python')?._id,        statut: 'accepted', message: 'SQL + Power BI contre Python, super complémentaires !' },
      { sender_id: hugo._id,    receiver_id: grace._id,   skill_id: findSkill(grace._id, 'Node.js')?._id,       statut: 'accepted', message: 'SQL contre Node.js, je suis partant !' },
      { sender_id: theo._id,    receiver_id: lucas._id,   skill_id: findSkill(lucas._id, 'Vue.js')?._id,        statut: 'accepted', message: 'Angular contre Vue.js, je veux voir les différences entre les deux frameworks !' },
      { sender_id: manon._id,   receiver_id: clara._id,   skill_id: findSkill(clara._id, 'Figma')?._id,         statut: 'accepted', message: 'React + TS contre Figma, super échange !' },

      // Refused
      { sender_id: mehdi._id,   receiver_id: romain._id,  skill_id: findSkill(romain._id, 'CI/CD')?._id,        statut: 'refused',  message: 'CI/CD contre microservices, ça m\'intéresse !' },
    ].filter(r => r.skill_id); // filtrer les nulls si skill non trouvé

    await SkillRequest.insertMany(requests);
    console.log(`   ✔ ${requests.length} demandes d\'échange créées.`);

    // Résumé
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Seeding terminé !');
    console.log(`   ${createdUsers.length} utilisateurs  ·  ${skills.length} annonces  ·  ${requests.length} demandes`);
    console.log('\n   Mot de passe pour tous les comptes : Efrei2026!');
    console.log('\n   Comptes principaux :');
    console.log('   • alice@efrei.net   bob@efrei.net     lucas@efrei.net');
    console.log('   • manon@efrei.net   david@efrei.net   emma@efrei.net');
    console.log('   • grace@efrei.net   hugo@efrei.net    karim@efrei.net');
    console.log('   • (voir USERS_DATA pour la liste complète)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion MongoDB.');
  }
}

seed();
