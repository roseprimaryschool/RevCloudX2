import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Plus } from 'lucide-react';

export default function CreateFlashcard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialDeckId = queryParams.get('deckId') || '';

  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState(initialDeckId);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'decks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const decksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDecks(decksData);
      if (decksData.length > 0 && !selectedDeckId) {
        setSelectedDeckId(decksData[0].id);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching decks:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !selectedDeckId || !user) {
      setMessage('Please fill in all fields and select a deck.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await addDoc(collection(db, 'flashcards'), {
        userId: user.uid,
        deckId: selectedDeckId,
        front: front.trim(),
        back: back.trim(),
        createdAt: serverTimestamp(),
      });
      setFront('');
      setBack('');
      setMessage('Flashcard saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error saving flashcard:", error);
      setMessage('Error saving flashcard. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading...</div>;
  }

  if (decks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">No Decks Found</h2>
        <p className="text-slate-600 mb-6">You need to create a deck before adding flashcards.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Create Flashcard</h1>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="deck" className="block text-sm font-medium text-slate-700 mb-2">
              Select Deck
            </label>
            <select
              id="deck"
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              required
            >
              <option value="" disabled>Select a deck</option>
              {decks.map(deck => (
                <option key={deck.id} value={deck.id}>{deck.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="front" className="block text-sm font-medium text-slate-700 mb-2">
              Front (Question / Term)
            </label>
            <textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              placeholder="What is the powerhouse of the cell?"
              required
            />
          </div>

          <div>
            <label htmlFor="back" className="block text-sm font-medium text-slate-700 mb-2">
              Back (Answer / Definition)
            </label>
            <textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              placeholder="Mitochondria"
              required
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {message}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Flashcard
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
