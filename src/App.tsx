import React, { useState, useEffect } from 'react';
import { Game } from './types';
import { Plus, Edit, Trash2, Radio, Search, SlidersHorizontal, Gamepad2 } from 'lucide-react';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  // Alignement strict du formulaire sur le modèle FreeToGame API
  const [formData, setFormData] = useState({
    title: '',
    thumbnail: '',
    short_description: '',
    game_url: '',
    genre: '',
    platform: 'PC (Windows)',
    publisher: '',
    developer: '',
    release_date: ''
  });

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    const res = await fetch('/api/games');
    const data = await res.json();
    setGames(data);
  };

  const handleOpenAddModal = () => {
    setEditingGame(null);
    setFormData({
      title: '',
      thumbnail: 'https://www.freetogame.com/g/1/thumbnail.jpg', // Thumbnail par défaut générique
      short_description: '',
      game_url: '',
      genre: 'Shooter',
      platform: 'PC (Windows)',
      publisher: '',
      developer: '',
      release_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (game: Game, e: React.MouseEvent) => {
    e.stopPropagation(); // Évite les conflits de clic sur la carte
    setEditingGame(game);
    setFormData({ ...game });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingGame ? 'PUT' : 'POST';
    const url = editingGame ? `/api/games/${editingGame.id}` : '/api/games';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    setIsModalOpen(false);
    fetchGames();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer définitivement ce jeu de la copie statique ?')) {
      await fetch(`/api/games/${id}`, { method: 'DELETE' });
      fetchGames();
    }
  };

  // Filtrage combiné (Recherche textuelle + Filtre plateforme)
  const filteredGames = games.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase()) || 
                          g.genre.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = selectedPlatform === 'All' || 
                            g.platform.toLowerCase().includes(selectedPlatform.toLowerCase());
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen p-6 font-sans antialiased selection:bg-emerald-500 selection:text-black">
      
      {/* HEADER SYSTEM BAR */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 flex items-center gap-2">
            <Radio className="animate-pulse text-emerald-400" size={24} /> REPÉRAGE JEUX VIDÉO
          </h1>
          <p className="text-xs text-zinc-500 font-mono tracking-widest mt-1">// MOTEUR CRUD LOCAL SUR COPIE STATIQUE API</p>
        </div>
        
        <div className="flex gap-4 text-xs font-mono">
          <div className="bg-zinc-900 px-4 py-2 border border-zinc-800 rounded">En catalogue: <span className="text-emerald-400 font-bold">{games.length}</span></div>
          <div className="bg-zinc-900 px-4 py-2 border border-zinc-800 rounded">Filtrés: <span className="text-purple-400 font-bold">{filteredGames.length}</span></div>
          <div className="bg-zinc-900 px-4 py-2 border border-zinc-800 rounded">API Publique: <span className="text-amber-500">READ-ONLY (BRIDGÉE)</span></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        
        {/* PANNEAU DE CONTRÔLE (Style Screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Moteur de Recherche */}
          <div className="bg-zinc-900/60 p-5 rounded-lg border border-zinc-800/80">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold tracking-wide text-zinc-400 flex items-center gap-2 uppercase">
                <Search size={14} className="text-emerald-400" /> Moteur de Scout IA
              </h2>
              <span className="text-[9px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded font-mono uppercase">Deep Scan</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3">Recherche instantanée par titre ou par genre.</p>
            <input 
              type="text"
              placeholder="Ex: Elden Ring, Shooter, Racing..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>

          {/* Filtres croisés */}
          <div className="bg-zinc-900/60 p-5 rounded-lg border border-zinc-800/80">
            <h2 className="text-xs font-bold tracking-wide text-zinc-400 flex items-center gap-2 uppercase mb-3">
              <SlidersHorizontal size={14} className="text-purple-400" /> Filtres de Plateforme
            </h2>
            <p className="text-xs text-zinc-500 mb-3">Triez les entités selon leur écosystème cible.</p>
            <div className="flex gap-2 font-mono text-[11px]">
              {['All', 'PC', 'Web'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    (plat === 'All' ? selectedPlatform === 'All' : selectedPlatform === plat)
                      ? 'bg-purple-950 text-purple-400 border-purple-800'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {plat === 'All' ? 'Toutes' : plat}
                </button>
              ))}
            </div>
          </div>

          {/* Injecteur CRUD */}
          <div className="bg-zinc-900/60 p-5 rounded-lg border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold tracking-wide text-zinc-400 flex items-center gap-2 uppercase">
                <Gamepad2 size={14} className="text-emerald-400" /> Base Persistante Statique
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Injectez manuellement un nouvel élément structurel dans le fichier <code className="text-zinc-300">games.json</code>.</p>
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-wider py-2.5 rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Injecter un nouveau jeu
            </button>
          </div>
        </div>

        {/* GRILLE DE REPERAGE : FIXÉE À COMPOSER EN 4 COLONNES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <div 
              key={game.id} 
              className="bg-zinc-900/30 rounded-lg overflow-hidden border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between group relative"
            >
              {/* Image & Header technique */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950 border-b border-zinc-900">
                <img 
                  src={game.thumbnail} 
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute bottom-2 left-2 text-[9px] font-mono bg-black/80 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 max-w-[80%] truncate">
                  {game.developer || 'Studio Inconnu'}
                </span>
                
                {/* Actions contextuelles au survol */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleOpenEditModal(game, e)}
                    className="p-1.5 bg-zinc-900/90 text-zinc-400 hover:text-emerald-400 rounded border border-zinc-700 transition-colors"
                    title="Modifier la fiche"
                  >
                    <Edit size={12} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(game.id, e)}
                    className="p-1.5 bg-zinc-900/90 text-zinc-400 hover:text-red-400 rounded border border-zinc-700 transition-colors"
                    title="Supprimer la fiche"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Fiche Technique Contextuelle */}
              <div className="p-4 flex-grow flex flex-col justify-between bg-gradient-to-b from-transparent to-zinc-950/40">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-sm text-zinc-100 tracking-wide line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {game.title}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap mt-0.5">
                      {game.release_date ? game.release_date.split('-')[0] : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-3 mb-4 leading-relaxed font-sans">
                    {game.short_description || 'Aucun descriptif pour cette entité.'}
                  </p>
                </div>

                {/* Footer de l'item */}
                <div className="border-t border-zinc-800/60 pt-3 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-900/30">
                    {game.genre}
                  </span>
                  <span className="text-zinc-500 truncate max-w-[50%]" title={game.platform}>
                    🖥️ {game.platform.replace(' (Windows)', '')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* État Vide */}
        {filteredGames.length === 0 && (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg text-zinc-500 font-mono text-xs uppercase tracking-wider">
            🛰️ Aucune donnée trouvée sur le segment analysé.
          </div>
        )}
      </main>

      {/* MODALE D'INJECTION DE DONNÉES */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-zinc-300 mb-5 pb-2 border-b border-zinc-800">
              <span className="text-purple-400">■</span> {editingGame ? "Édition Registre" : "Injection Nouvelle Entité"}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Nom de l'entité *</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Lien de la miniature (Image url)</label>
                  <input type="text" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Genre</label>
                  <input type="text" placeholder="Shooter, MMORPG, ARPG..." value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Plateforme</label>
                  <input type="text" placeholder="PC (Windows), Web Browser..." value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Développeur</label>
                  <input type="text" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Éditeur</label>
                  <input type="text" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Date d'implémentation</label>
                  <input type="date" value={formData.release_date} onChange={e => setFormData({...formData, release_date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Hyperlien Externe (Game URL)</label>
                  <input type="url" value={formData.game_url} onChange={e => setFormData({...formData, game_url: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase mb-1">Description Synthétique *</label>
                <textarea required rows={3} value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500 resize-none" maxLength={250}></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded uppercase font-bold"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded uppercase tracking-wider"
                >
                  {editingGame ? "Appliquer" : "Injecter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}