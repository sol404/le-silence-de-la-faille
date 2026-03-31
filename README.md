# Le Silence de la faille

Site statique de lecture pour le roman.

## Structure

- `index.html` → page d’accueil éditoriale du livre
- `reader.html` → page de lecture générique pour tous les chapitres
- `chapitres/` → fichiers source Markdown (`Chapitre 1.md` à `Chapitre 170.md`)
- `styles.css` → thème visuel du site
- `site.js` → génération de la table des chapitres et rendu des chapitres
- `serve.sh` → lance un petit serveur local depuis WSL

## Lancer en local

```bash
./serve.sh
```

Puis ouvrir dans le navigateur :

```text
http://localhost:8765/
```
