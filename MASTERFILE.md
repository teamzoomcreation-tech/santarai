# 🧬 MASTERFILE : PROJET SANTARAI 



**Version :** 3.0 (RELEASE CANDIDATE)

**Vision :** La première plateforme de **Virtualisation d'Entreprise**.

Santarai n'est pas un simple gestionnaire de tâches ou un outil SaaS classique. C'est un Système d'Exploitation d'Entreprise (Business OS / LifeOS) immersif où l'utilisateur est le PDG et où des Squads d'IA (Employés Digitaux) collaborent en temps réel dans un QG 3D.



---



## 1. INFRASTRUCTURE & STACK TECHNIQUE (✅ EXISTANT & STABLE)

*Ne jamais modifier ou réécrire ces fondations sans demande explicite du développeur.*



* **Frontend :** Next.js 14 (App Router) + TypeScript.

* **Styling :** TailwindCSS + Shadcn/UI (Thème Cyberpunk : Dark Blue / Neon / Glassmorphism).

* **3D Engine :** React Three Fiber (R3F) / Drei. Scène "QG" interactive avec Agents 3D.

* **Backend, Auth & DB :** Supabase (PostgreSQL, Authentication, Realtime, Storage).

* **Intelligence Artificielle :** OpenAI API (Modèle GPT-4o) via Edge Functions.

* **Paiement :** Stripe (Mode Abonnement + Achat de Tokens TK).

* **State Management :** Zustand (Store global persisté).



---



## 2. ARCHITECTURE DES DONNÉES & HIÉRARCHIE (SUPABASE)

Toute nouvelle table doit impérativement avoir une policy RLS (`auth.uid() = user_id`) activée.



### A. Hiérarchie Fonctionnelle

1. **ORGANISATION (users) :** Compte principal. Profil utilisateur, lien Stripe `customer_id`, Plan actuel.

2. **PROJET (projects) :** Le Dossier long terme (Ex: "Lancement Marque"). Contient la progression globale.

3. **MISSION (missions) :** Une phase clé du projet (Ex: "Campagne d'Acquisition").

4. **TÂCHE (tasks) :** L'action atomique (Ex: "Rédiger 5 posts"). Liée à un `assigned_agent_id`.

5. **AGENTS RECRUTÉS (agents / user_agents) :** Les employés possédés. (Colonnes : `xp`, `status`, `role`, `model`).

6. **FINANCES (transactions / user_balance) :** Historique financier et solde actuel (Débit/Crédit TK).

7. **BASE DE CONNAISSANCES (resources) :** Fichiers uploadés par le client (id, user_id, file_url, file_type, summary).



### B. LE "CONDUCTOR" (Le cerveau et routeur intelligent)

Il remplace le simple chat. Point d'entrée : Input "Santarai System v2.0" sur le Dashboard.

* **Algorithme de Dispatch :**

  1. **Analyse :** Transforme le prompt utilisateur en Plan d'Action (JSON).

  2. **Check Inventaire :** Vérifie l'inventaire des agents possédés.

  3. **Routage :** * *Si l'équipe est complète :* Crée un Projet et assigne les tâches.

     * *Si agents manquants :* Déclenche une modale/pop-up d'Upsell pour recruter l'agent ciblé via la trésorerie.



---



## 3. LE ROSTER SANTARAI (CATALOGUE DES AGENTS)

*Les agents ont des spécialités strictes. Le System Prompt DOIT interdire à un agent d'exécuter une tâche hors de son scope.*



### 🛡️ SQUAD MARKETING (Visibilité & Branding)

| Agent | Rôle | Prix (TK) | Output Réel |

| :--- | :--- | :--- | :--- |

| **GHOST** | LinkedIn Expert | 5 000 | Carrousels PDF, Posts Viraux, Hooks. |

| **AKIRA** | Video Scripter | 4 500 | Scripts TikTok/Reels (Timecodés), VSL. |

| **RADAR** | SEO Master | 4 000 | Audit sémantique, Liste Keywords (CSV). |

| **KATANA** | Twitter Sniper | 4 000 | Threads, Gestion réputation, Punchlines. |

| **KAIJU** | Newsletter | 4 500 | Campagnes HTML, Séquences email. |

| **PIXEL** | Designer | 4 000 | Logos, Bannières, Mockups (Dall-E/Flux). |



### ⚙️ SQUAD TECH (Dev & Data)

| Agent | Rôle | Prix (TK) | Output Réel |

| :--- | :--- | :--- | :--- |

| **MECHA** | Debugger | 4 000 | Correctifs de code, Analyse de logs. |

| **ORACLE** | SQL Wizard | 6 000 | Requêtes SQL complexes, Nettoyage DB. |

| **NINJA** | Backend Dev | 5 000 | Scripts API, JSON, Python, Regex. |

| **SENSEI** | Tech Doc | 3 500 | Documentation technique, Readme.md. |

| **PYTHON** | Scripter | 2 500 | Conversion fichiers, Scripts d'automatisation. |



### 💰 SQUAD SALES (Vente & Nego)

| Agent | Rôle | Prix (TK) | Output Réel |

| :--- | :--- | :--- | :--- |

| **RONIN** | Lead Hunter | 3 500 | Listes prospects qualifiés (CSV). |

| **VIPER** | Negotiator | 3 500 | Scripts d'arguments, Contre-offres. |

| **SUMO** | Closer | 4 000 | Emails de closing, Traitement objections. |

| **SHOGUN** | Strategist | 5 500 | Plans d'action commerciaux, Funnels. |

| **YAKUZA** | Retention | 5 000 | Séquences réactivation, Upsell. |



### 💎 SQUAD ÉLITE (Management & Strategic)

| Agent | Rôle | Prix (TK) | Output Réel |

| :--- | :--- | :--- | :--- |

| **KAGE** | Clone CEO | 10 000 | Apprend ton style, répond à ta place. |

| **DAIMYO** | Legal | 9 000 | Contrats, NDA, CGV, Conformité. |

| **WATCHTOWER**| Spy | 8 500 | Veille concurrentielle 24/7. |

| **CRISIS** | Crisis Mgmt | 12 000 | Plans d'urgence PR (Bad Buzz). |

| **STRATEGIST**| VC Advisor | 15 000 | Audit Pitch Deck, Valuation Financière. |



### 📂 SQUAD ADMIN (Support & Ops)

| Agent | Rôle | Prix (TK) | Output Réel |

| :--- | :--- | :--- | :--- |

| **ZEN** | Support | 2 000 | Réponses tickets, FAQ auto. |

| **HAIKU** | Summarizer | 2 500 | Résumés concis (TL;DR). |

| **BABEL** | Translator | 3 000 | Traductions localisées (Fichiers). |

| **ABACUS** | Accounting | 3 000 | Tableaux financiers, Factures. |

| **KAMI** | Analyst | 7 000 | Rapports KPI, Prévisions. |

| **DATA HAWK** | Miner | 6 000 | Scraping de données, Datasets. |



---



## 4. ÉTAT DES MODULES & ROADMAP DE FINITION



* **🟢 Module 1 : Vue QG (Dashboard) :** ✅ TERMINÉ (Visuel 3D, Stats, Input IA, Logs).

* **🟢 Module 3 : Mes Agents (Roster) :** ✅ TERMINÉ (Liste, Chat, Pause, Licenciement).

* **🟢 Module 4 : Recrutement (Marketplace) :** ✅ TERMINÉ (Catalogue, Débit de Tokens immédiat).

* **🟢 Module 5 : Trésorerie & Abos :** ✅ TERMINÉ (Grand livre, Checkout Stripe).

* **🟢 Module 6 : Paramètres :** ✅ TERMINÉ (Identité injectée dans les prompts IA).

 * **🟢 Module 7 : Mes Projets (Kanban IA) : ✅ TERMINÉ

* **🟢 avatar de l'agent sur la carte de tâche cliquable pour réassigner la tâche manuellement (Switch Agent).✅ TERMINÉ

* **🟢 🆕 Module 7 : Ressources (Knowledge Base)  * *Objectif :* Créer `/dashboard/resources`. 

   * *Stockage :* Supabase Storage (Bucket `company-documents`).

   * *UI :* Zone Drag & Drop. Liste des fichiers avec suppression.

   * *IA :* Le System Prompt doit lire le contenu texte (.txt, .md, .csv) de ces fichiers lors de l'exécution d'un projet.:**✅ TERMINÉ



---



## 5. UX/UI & RÈGLES D'OR POUR L'IA (CURSOR DIRECTIVES)

1. **Immersif & Visuel :** Dashboard Plein Écran. Pas de sidebar intrusive. Si l'IA travaille, on doit le VOIR (Particules Data Flow, Statuts visuels). Mode Focus 3D actif sur double-clic.

2. **Respect de l'existant :** Ne jamais supprimer ou réécrire les modules validés (Auth, Stripe, 3D).

3. **Design System :** Utiliser exclusivement les composants `components/ui` pour conserver la cohérence visuelle Cyberpunk.

4. **Sécurité :** Console logs de debug à nettoyer avant chaque PR/Build final.