import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'games.json');
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors());
app.use(express.json());

// Helpers de lecture/écriture du fichier local
const readGames = (): any[] => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const writeGames = (data: any[]) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Fonction d'initialisation automatique à partir de l'API externe
async function initializeData() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log("📥 Fichier games.json absent. Initialisation depuis l'API FreeToGame...");
    try {
      const response = await fetch('https://www.freetogame.com/api/games?');
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      
      const externalGames = await response.json();
      
      // On extrait les 24 premiers jeux pour remplir notre copie statique initiale
      const initialSelection = externalGames.slice(0, 24).map((game: any) => ({
        id: game.id,
        title: game.title,
        thumbnail: game.thumbnail,
        short_description: game.short_description,
        game_url: game.game_url,
        genre: game.genre,
        platform: game.platform,
        publisher: game.publisher,
        developer: game.developer,
        release_date: game.release_date
      }));

      writeGames(initialSelection);
      console.log(`✅ games.json créé avec succès (${initialSelection.length} jeux synchronisés).`);
    } catch (error) {
      console.error("❌ Échec de la récupération de l'API. Création d'une base vide de secours.");
      writeGames([]);
    }
  }
}

// --- ENDPOINTS ROUTER (CRUD LOCAL) ---

// READ ALL
app.get('/api/games', (req, res) => {
  try {
    res.json(readGames());
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la lecture du catalogue" });
  }
});

// CREATE
app.post('/api/games', (req, res) => {
  try {
    const games = readGames();
    // Génération d'un ID unique numérique basé sur le timestamp
    const newGame = { ...req.body, id: Date.now() }; 
    games.unshift(newGame); // Ajoute au début pour le voir immédiatement sur l'interface
    writeGames(games);
    res.status(201).json(newGame);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'ajout du jeu" });
  }
});

// UPDATE
app.put('/api/games/:id', (req, res) => {
  try {
    const games = readGames();
    const id = parseInt(req.params.id);
    const index = games.findIndex(g => g.id === id);
    
    if (index !== -1) {
      games[index] = { ...games[index], ...req.body, id }; // Conserve l'ID d'origine
      writeGames(games);
      res.json(games[index]);
    } else {
      res.status(404).json({ message: "Jeu introuvable dans le catalogue statique" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la modification" });
  }
});

// DELETE
app.delete('/api/games/:id', (req, res) => {
  try {
    let games = readGames();
    const id = parseInt(req.params.id);
    games = games.filter(g => g.id !== id);
    writeGames(games);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
});

// --- INTEGRATION VITE & DEMARRAGE ---
async function startServer() {
  // S'assurer que les données locales sont prêtes avant de démarrer
  await initializeData();

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Système prêt. Interface disponible sur http://localhost:${PORT}`);
  });
}

startServer();