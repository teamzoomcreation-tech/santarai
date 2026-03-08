# Configuration Supabase pour Atlas 360

## 📋 Étapes d'installation

### 1. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Remplissez les informations (nom, mot de passe, région)
5. Attendez que le projet soit créé (2-3 minutes)

### 2. Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** > **API**
2. Vous trouverez :
   - **Project URL** : Copiez cette valeur
   - **anon public** key : Copiez cette clé (pas la service_role key)

### 3. Configurer les variables d'environnement

1. Créez un fichier `.env.local` à la racine du projet
2. Ajoutez les variables suivantes :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

**Exemple :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Créer les tables dans Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur **New Query**
3. Copiez-collez le contenu du fichier `supabase/schema.sql`
4. Cliquez sur **Run** pour exécuter le script

Le script va créer :
- ✅ Table `agents` (agents recrutés)
- ✅ Table `projects` (dossiers/projets)
- ✅ Table `project_agents` (liaison projets-agents)
- ✅ Table `tasks` (tâches du Kanban)
- ✅ Table `task_agents` (liaison tâches-agents)
- ✅ Toutes les politiques de sécurité (RLS)
- ✅ Tous les index pour les performances

### 5. Vérifier la configuration

1. Redémarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Testez l'authentification :
   - Allez sur `/signup` pour créer un compte
   - Allez sur `/login` pour vous connecter
   - Accédez au dashboard via `/dashboard`

## 🔒 Sécurité

Les politiques Row Level Security (RLS) sont activées :
- Chaque utilisateur ne peut voir que ses propres données
- Les insertions/updates/deletes sont automatiquement filtrées par `user_id`
- Aucune donnée ne peut être accédée sans authentification

## 📊 Structure de la base de données

```
agents
├── id (UUID)
├── user_id (UUID) → auth.users
├── name, role, status
├── avatar_color
└── tasks_completed, efficiency

projects
├── id (UUID)
├── user_id (UUID) → auth.users
├── name, progress, due_date
└── project_agents (many-to-many)

tasks
├── id (UUID)
├── project_id (UUID) → projects
├── title, description, due_date
├── tag, tag_color
├── status (todo/inprogress/done)
└── task_agents (many-to-many)
```

## 🚀 Fonctionnalités activées

- ✅ Authentification complète (signup/login/logout)
- ✅ Protection des routes (dashboard accessible uniquement si connecté)
- ✅ Persistance des agents dans Supabase
- ✅ Persistance des projets et tâches
- ✅ Données conservées après rafraîchissement
- ✅ Sécurité multi-utilisateurs

## ⚠️ Notes importantes

- Ne commitez **JAMAIS** le fichier `.env.local` dans Git
- Le fichier `.env.example` est fourni comme modèle
- Les clés `NEXT_PUBLIC_*` sont exposées côté client (c'est normal pour Supabase)
- La clé `anon` est sécurisée par les politiques RLS
