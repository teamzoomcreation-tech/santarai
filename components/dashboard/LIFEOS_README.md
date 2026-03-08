# Scène 3D - Architecture actuelle

## Composant actif

La scène 3D du Dashboard est gérée par **`components/LiveOfficeScene.tsx`**.

- Importé dynamiquement dans `dashboard-qg-v2.tsx`
- Utilise `@react-three/fiber` et `@react-three/drei`
- Affiche les agents en disposition amphithéâtre avec thèmes et statuts

## Historique

Le système LifeOS (agent-behavior-system, AtlasDroidBehavior, Agent3DScene, CabinetDirector, etc.) a été supprimé lors du refactoring pour consolider autour de LiveOfficeScene.
