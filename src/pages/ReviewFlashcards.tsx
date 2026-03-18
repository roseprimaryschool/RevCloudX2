import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RotateCcw, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ReviewFlashcards() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<any>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchDeckAndCards = async () => {
      if (!user || !deckId) return;

      try {
        const deckRef = doc(db, 'decks', deckId);
        const deckSnap = await getDoc(deckRef);

        if (deckSnap.exists()) {
          setDeck({ id: deckSnap.id, ...deckSnap.data() });
        } else {
          console.error("Deck not found");
          navigate('/');
          return;
        }

        const q = query(collection(db, 'flashcards'), where('deckId', '==', deckId), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const cards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Shuffle cards for review
        const shuffled = cards.sort(() => Math.random() - 0.5);
        setFlashcards(shuffled);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
        setLoading(false);
      }
    };

    fetchDeckAndCards();
  }, [user, deckId, navigate]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setFinished(true);
      }
    }, 150); // Small delay to allow flip animation to start before changing content
  };

  const handleRestart = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setFinished(false);
    setIsFlipped(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading flashcards...</div>;
  }

  if (flashcards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">No Flashcards Found</h2>
        <p className="text-slate-600 mb-6">This deck is empty. Add some flashcards to start reviewing.</p>
        <button
          onClick={() => navigate(`/create?deckId=${deckId}`)}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Add Flashcards
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Review Complete!</h2>
        <p className="text-slate-600 mb-8 text-lg">You've reviewed all {flashcards.length} cards in this deck.</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Review Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{deck?.name}</h1>
            <p className="text-sm text-slate-500">Card {currentIndex + 1} of {flashcards.length}</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="hidden sm:block w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard Container */}
      <div className="relative perspective-1000 w-full h-96 mb-8 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-md border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
            <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-wider text-slate-400">Front</span>
            <h2 className="text-3xl sm:text-4xl font-medium text-slate-800 leading-tight">
              {currentCard.front}
            </h2>
            <p className="absolute bottom-6 text-sm text-slate-400">Tap to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full backface-hidden bg-indigo-50 rounded-3xl shadow-md border border-indigo-100 p-8 flex flex-col items-center justify-center text-center"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-wider text-indigo-400">Back</span>
            <div className="text-2xl sm:text-3xl font-medium text-indigo-900 leading-relaxed overflow-y-auto max-h-full w-full">
              {currentCard.back}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {isFlipped ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 w-full sm:w-auto"
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="flex-1 sm:flex-none px-8 py-4 bg-slate-100 text-slate-700 font-medium rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Still Learning
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="flex-1 sm:flex-none px-8 py-4 bg-emerald-500 text-white font-medium rounded-2xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
            >
              <Check className="w-5 h-5" />
              Got It
            </button>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full sm:w-auto px-12 py-4 bg-indigo-600 text-white font-medium rounded-2xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            Show Answer
          </button>
        )}
      </div>
    </div>
  );
}
