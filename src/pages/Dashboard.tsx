import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Book, Trash2, Play } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<any[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'decks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const decksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDecks(decksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching decks:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim() || !user) return;

    try {
      await addDoc(collection(db, 'decks'), {
        userId: user.uid,
        name: newDeckName.trim(),
        description: '',
        createdAt: serverTimestamp(),
      });
      setNewDeckName('');
    } catch (error) {
      console.error("Error creating deck:", error);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm('Are you sure you want to delete this deck? All flashcards in it will be lost.')) return;
    try {
      await deleteDoc(doc(db, 'decks', deckId));
      // Note: In a real app, you'd also want to delete all flashcards associated with this deck.
      // For simplicity, we'll just delete the deck document.
    } catch (error) {
      console.error("Error deleting deck:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading your decks...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Your Decks</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Create New Deck</h2>
        <form onSubmit={handleCreateDeck} className="flex gap-4">
          <input
            type="text"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="e.g., Biology 101"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create
          </button>
        </form>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No decks yet</h3>
          <p className="text-slate-500 mt-1">Create your first deck to start revising.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div key={deck.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
              <button
                onClick={() => handleDeleteDeck(deck.id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-slate-900 mb-2 truncate pr-8">{deck.name}</h3>
              <p className="text-sm text-slate-500 mb-6">
                Created {deck.createdAt?.toDate().toLocaleDateString() || 'Recently'}
              </p>
              <div className="flex gap-3">
                <Link
                  to={`/review/${deck.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Review
                </Link>
                <Link
                  to={`/create?deckId=${deck.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Cards
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
