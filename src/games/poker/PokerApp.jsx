import { useState } from "react";

const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_COLORS = { "♠": "#e2e8f0", "♥": "#f87171", "♦": "#f87171", "♣": "#e2e8f0" };

const HANDS = [
  {
    rank: 1,
    name: "Quinte Flush Royale",
    emoji: "👑",
    short: "A K Q J 10 de la même couleur",
    description: "La main absolue. As, Roi, Dame, Valet, 10 — tous de la même couleur. Imbattable.",
    cards: ["A♠", "K♠", "Q♠", "J♠", "10♠"],
    probability: "0.000154%",
    tip: "Si tu l'as, joue lentement pour maximiser le pot.",
  },
  {
    rank: 2,
    name: "Quinte Flush",
    emoji: "🔥",
    short: "5 cartes consécutives de même couleur",
    description: "Cinq cartes qui se suivent, toutes de la même couleur. Presque imbattable.",
    cards: ["9♥", "8♥", "7♥", "6♥", "5♥"],
    probability: "0.00139%",
    tip: "Slow-play ou relance agressive selon le board.",
  },
  {
    rank: 3,
    name: "Carré",
    emoji: "🃏",
    short: "4 cartes de même valeur",
    description: "Quatre cartes identiques. Extrêmement puissant.",
    cards: ["K♠", "K♥", "K♦", "K♣", "7♠"],
    probability: "0.0240%",
    tip: "Presque toujours value-bet maximal.",
  },
  {
    rank: 4,
    name: "Full House",
    emoji: "🏠",
    short: "Un brelan + une paire",
    description: "Trois d'une valeur et deux d'une autre. Le kicker est le brelan.",
    cards: ["Q♠", "Q♥", "Q♦", "J♣", "J♠"],
    probability: "0.144%",
    tip: "Attention aux boards paired — l'adversaire peut avoir un meilleur full.",
  },
  {
    rank: 5,
    name: "Couleur (Flush)",
    emoji: "🌊",
    short: "5 cartes de même couleur",
    description: "N'importe quelles cinq cartes de la même couleur.",
    cards: ["A♦", "J♦", "8♦", "5♦", "2♦"],
    probability: "0.197%",
    tip: "Le plus haut kicker compte. Méfie-toi si le board a 3 cartes flush.",
  },
  {
    rank: 6,
    name: "Quinte (Straight)",
    emoji: "📈",
    short: "5 cartes consécutives",
    description: "Cinq cartes qui se suivent, sans couleur commune.",
    cards: ["9♠", "8♥", "7♦", "6♣", "5♠"],
    probability: "0.392%",
    tip: "La quinte basse (roue) = A-2-3-4-5.",
  },
  {
    rank: 7,
    name: "Brelan",
    emoji: "🎯",
    short: "3 cartes de même valeur",
    description: "Trois cartes identiques avec deux kickers différents.",
    cards: ["7♠", "7♥", "7♦", "K♣", "3♠"],
    probability: "2.11%",
    tip: "Semi-bluff draw possible contre toi — reste vigilant.",
  },
  {
    rank: 8,
    name: "Deux Paires",
    emoji: "✌️",
    short: "Deux paires différentes",
    description: "Deux fois deux cartes de même valeur.",
    cards: ["A♠", "A♥", "9♦", "9♣", "K♠"],
    probability: "4.75%",
    tip: "La meilleure des deux paires prime. Le kicker peut décider.",
  },
  {
    rank: 9,
    name: "Paire",
    emoji: "👥",
    short: "2 cartes de même valeur",
    description: "Deux cartes identiques. Très commun.",
    cards: ["J♠", "J♥", "A♦", "8♣", "3♠"],
    probability: "42.26%",
    tip: "La force dépend beaucoup du board et de ta position.",
  },
  {
    rank: 10,
    name: "Hauteur (High Card)",
    emoji: "📉",
    short: "Aucune combinaison",
    description: "Rien. La plus haute carte joue.",
    cards: ["A♠", "K♥", "9♦", "7♣", "2♠"],
    probability: "50.1%",
    tip: "Bluffing territory — représente une main forte ou fold.",
  },
];

const POSITIONS = [
  { name: "UTG", full: "Under The Gun", desc: "Premier à parler. Position la plus désavantageuse. Joue serré.", color: "#ef4444" },
  { name: "MP", full: "Middle Position", desc: "Moins de pression mais encore difficile. Élargis légèrement ta range.", color: "#f97316" },
  { name: "CO", full: "Cut-Off", desc: "Bonne position. Tu peux steal les blindes fréquemment.", color: "#eab308" },
  { name: "BTN", full: "Button (Dealer)", desc: "La meilleure position ! Tu parles en dernier post-flop toute la main.", color: "#22c55e" },
  { name: "SB", full: "Small Blind", desc: "Post-flop tu parles en premier. Joue relativement serré.", color: "#3b82f6" },
  { name: "BB", full: "Big Blind", desc: "Tu as un avantage de pot odds sur les raises. Defend intelligemment.", color: "#8b5cf6" },
];

const GLOSSARY = [
  { term: "Fold", def: "Abandonner sa main. Tu perds les mises déjà investies." },
  { term: "Check", def: "Passer sans miser (uniquement si personne n'a misé avant toi)." },
  { term: "Call", def: "Suivre la mise de l'adversaire." },
  { term: "Raise", def: "Surenchérir. Tu forçes les autres à payer plus." },
  { term: "All-In", def: "Miser toutes ses jetons." },
  { term: "Bluff", def: "Miser fort avec une mauvaise main pour faire fuir l'adversaire." },
  { term: "Pot Odds", def: "Ratio entre le pot et la mise à payer. Aide à calculer si un call est rentable." },
  { term: "Outs", def: "Cartes qui peuvent améliorer ta main." },
  { term: "Flop", def: "Les 3 premières cartes communes posées sur la table." },
  { term: "Turn", def: "La 4ème carte commune." },
  { term: "River", def: "La 5ème et dernière carte commune." },
  { term: "Value Bet", def: "Miser pour faire payer une main moins forte que la tienne." },
  { term: "Slow Play", def: "Jouer faiblement une main très forte pour piéger l'adversaire." },
  { term: "Tilt", def: "État émotionnel négatif qui dégrade tes décisions." },
  { term: "Range", def: "L'ensemble des mains qu'un joueur peut avoir dans une situation." },
];

const QUIZ = [
  {
    q: "Tu as A♠ K♠ et le board est Q♠ J♠ 10♠. Quelle est ta main ?",
    options: ["Carré", "Quinte Flush Royale", "Full House", "Couleur"],
    answer: 1,
    expl: "A-K sur un board Q-J-10 de pique = A K Q J 10 de pique = Quinte Flush Royale !",
  },
  {
    q: "Quelle main bat un Full House ?",
    options: ["Deux Paires", "Quinte", "Carré", "Couleur"],
    answer: 2,
    expl: "Le Carré (4 cartes de même valeur) bat le Full House.",
  },
  {
    q: "En position BTN (Button), tu es généralement...",
    options: ["Le premier à parler", "Le dernier à parler", "Le deuxième à parler", "Obligé de poster une blinde"],
    answer: 1,
    expl: "Le Button parle en dernier post-flop — la meilleure position à la table !",
  },
  {
    q: "Tu as 8 outs pour compléter ta couleur. Quelle est approximativement ta probabilité de toucher au prochain tour ?",
    options: ["~8%", "~17%", "~35%", "~50%"],
    answer: 1,
    expl: "La règle du 2 : 8 outs × 2 ≈ 16%. Pour 2 cartes à venir, c'est 8 × 4 ≈ 32%.",
  },
  {
    q: "Qu'est-ce qu'un 'Tilt' au poker ?",
    options: ["Une mise très élevée", "Jouer émotionnellement et mal après une bad beat", "Une quinte avec l'As comme plus haute carte", "Un bluff réussi"],
    answer: 1,
    expl: "Le tilt est l'ennemi numéro 1. Reconnaître qu'on tile et faire une pause est crucial.",
  },
];

function Card({ label }) {
  const suit = label.slice(-1);
  const val = label.slice(0, -1);
  const color = SUIT_COLORS[suit] || "#e2e8f0";
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      width: 38, height: 52, background: "#1a1a2e", border: `2px solid ${color}33`,
      borderRadius: 6, fontSize: 11, fontWeight: 700, color, fontFamily: "'DM Serif Display', serif",
      boxShadow: `0 2px 8px ${color}22`, flexShrink: 0,
    }}>
      <span style={{ fontSize: 13 }}>{val}</span>
      <span style={{ fontSize: 15, lineHeight: 1 }}>{suit}</span>
    </div>
  );
}

export default function PokerApp() {
  const [tab, setTab] = useState("hands");
  const [selectedHand, setSelectedHand] = useState(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [glossSearch, setGlossSearch] = useState("");

  const tabs = [
    { id: "hands", label: "Mains", icon: "🃏" },
    { id: "positions", label: "Positions", icon: "🎯" },
    { id: "glossary", label: "Glossaire", icon: "📖" },
    { id: "quiz", label: "Quiz", icon: "⚡" },
  ];

  const handleQuizAnswer = (idx) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(idx);
    if (idx === QUIZ[quizIdx].answer) setQuizScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (quizIdx + 1 >= QUIZ.length) {
      setQuizDone(true);
    } else {
      setQuizIdx(i => i + 1);
      setQuizAnswer(null);
    }
  };

  const resetQuiz = () => {
    setQuizIdx(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizDone(false);
  };

  const filteredGloss = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(glossSearch.toLowerCase()) ||
    g.def.toLowerCase().includes(glossSearch.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a1a",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0", display: "flex", justifyContent: "center",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a1a; }
        ::-webkit-scrollbar-thumb { background: #c9a227; border-radius: 4px; }
        .hand-card:hover { transform: translateY(-2px); border-color: #c9a22755 !important; }
        .hand-card { transition: all 0.2s; }
        .tab-btn { transition: all 0.2s; }
        .ans-btn { transition: all 0.15s; }
        .ans-btn:hover:not(:disabled) { transform: scale(1.01); }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{
          padding: "20px 20px 16px", background: "linear-gradient(180deg, #0f0f23 0%, #0a0a1a 100%)",
          borderBottom: "1px solid #c9a22720",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>♠</span>
            <div>
              <h1 style={{ fontSize: 20, fontFamily: "'DM Serif Display', serif", color: "#c9a227", lineHeight: 1.2 }}>
                Poker School
              </h1>
              <p style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase" }}>
                Apprends à jouer
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "#0f0f23", borderBottom: "1px solid #1e1e3a", padding: "0 4px",
        }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => { setTab(t.id); setSelectedHand(null); }}
              style={{
                flex: 1, padding: "10px 4px", background: "none", border: "none", cursor: "pointer",
                color: tab === t.id ? "#c9a227" : "#64748b", fontSize: 10, fontWeight: 600,
                borderBottom: tab === t.id ? "2px solid #c9a227" : "2px solid transparent",
                textTransform: "uppercase", letterSpacing: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3, fontFamily: "'DM Sans', sans-serif",
              }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>

          {/* HANDS TAB */}
          {tab === "hands" && !selectedHand && (
            <div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 14, textAlign: "center" }}>
                Du plus fort au plus faible — appuie pour les détails
              </p>
              {HANDS.map((hand, i) => (
                <div key={i} className="hand-card" onClick={() => setSelectedHand(hand)}
                  style={{
                    background: "#0f0f23", border: "1px solid #1e1e3a", borderRadius: 10,
                    padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: "#c9a22715",
                    border: "1px solid #c9a22730", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18, flexShrink: 0,
                  }}>{hand.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>{hand.name}</span>
                      <span style={{ fontSize: 10, color: "#c9a227", background: "#c9a22715", padding: "2px 6px", borderRadius: 10 }}>
                        #{hand.rank}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{hand.short}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "hands" && selectedHand && (
            <div>
              <button onClick={() => setSelectedHand(null)} style={{
                background: "none", border: "none", color: "#c9a227", cursor: "pointer",
                fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6, padding: 0,
              }}>← Retour</button>

              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{selectedHand.emoji}</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#c9a227" }}>
                  {selectedHand.name}
                </h2>
                <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 2 }}>
                  Rang #{selectedHand.rank}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {selectedHand.cards.map((c, i) => <Card key={i} label={c} />)}
              </div>

              <div style={{ background: "#0f0f23", borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{selectedHand.description}</p>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, background: "#0f0f23", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Probabilité</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#c9a227" }}>{selectedHand.probability}</div>
                </div>
              </div>

              <div style={{ background: "#c9a22712", border: "1px solid #c9a22730", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#c9a227", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>💡 Conseil</div>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{selectedHand.tip}</p>
              </div>
            </div>
          )}

          {/* POSITIONS TAB */}
          {tab === "positions" && (
            <div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 6, textAlign: "center" }}>
                La position est cruciale au poker
              </p>
              {/* Table visual */}
              <div style={{
                background: "#0f2010", border: "3px solid #1a4020", borderRadius: 60, padding: "20px 14px",
                marginBottom: 18, position: "relative", minHeight: 120, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {POSITIONS.map((p, i) => (
                    <div key={i} style={{
                      background: p.color + "22", border: `1px solid ${p.color}66`, borderRadius: 8,
                      padding: "5px 10px", fontSize: 11, fontWeight: 700, color: p.color,
                    }}>{p.name}</div>
                  ))}
                </div>
              </div>

              {POSITIONS.map((p, i) => (
                <div key={i} style={{
                  background: "#0f0f23", border: `1px solid ${p.color}33`, borderRadius: 10,
                  padding: "12px 14px", marginBottom: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{
                      background: p.color + "22", color: p.color, fontWeight: 800, fontSize: 13,
                      padding: "3px 10px", borderRadius: 20,
                    }}>{p.name}</div>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{p.full}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              ))}

              <div style={{ background: "#c9a22712", border: "1px solid #c9a22730", borderRadius: 10, padding: 14, marginTop: 8 }}>
                <p style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>
                  💡 <strong style={{ color: "#c9a227" }}>Règle d'or :</strong> Plus tu parles tard, plus tu as d'informations.
                  Joue des ranges plus larges en position, plus serrées hors position.
                </p>
              </div>
            </div>
          )}

          {/* GLOSSARY TAB */}
          {tab === "glossary" && (
            <div>
              <input
                value={glossSearch} onChange={e => setGlossSearch(e.target.value)}
                placeholder="Rechercher un terme..."
                style={{
                  width: "100%", background: "#0f0f23", border: "1px solid #1e1e3a", borderRadius: 8,
                  color: "#e2e8f0", padding: "10px 14px", fontSize: 13, marginBottom: 14, outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              {filteredGloss.map((g, i) => (
                <div key={i} style={{
                  background: "#0f0f23", border: "1px solid #1e1e3a", borderRadius: 10,
                  padding: "12px 14px", marginBottom: 8,
                }}>
                  <div style={{ fontWeight: 700, color: "#c9a227", fontSize: 14, marginBottom: 4 }}>{g.term}</div>
                  <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{g.def}</p>
                </div>
              ))}
              {filteredGloss.length === 0 && (
                <p style={{ textAlign: "center", color: "#64748b", marginTop: 30 }}>Aucun résultat</p>
              )}
            </div>
          )}

          {/* QUIZ TAB */}
          {tab === "quiz" && !quizDone && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Question {quizIdx + 1}/{QUIZ.length}</span>
                <span style={{ fontSize: 12, color: "#c9a227", fontWeight: 700 }}>Score: {quizScore}</span>
              </div>

              {/* Progress */}
              <div style={{ background: "#1e1e3a", borderRadius: 4, height: 4, marginBottom: 20 }}>
                <div style={{
                  background: "#c9a227", height: 4, borderRadius: 4,
                  width: `${((quizIdx + (quizAnswer !== null ? 1 : 0)) / QUIZ.length) * 100}%`,
                  transition: "width 0.3s",
                }} />
              </div>

              <div style={{ background: "#0f0f23", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>{QUIZ[quizIdx].q}</p>
              </div>

              {QUIZ[quizIdx].options.map((opt, i) => {
                const isCorrect = i === QUIZ[quizIdx].answer;
                const isSelected = i === quizAnswer;
                let bg = "#0f0f23", border = "#1e1e3a", color = "#cbd5e1";
                if (quizAnswer !== null) {
                  if (isCorrect) { bg = "#14532d"; border = "#22c55e"; color = "#86efac"; }
                  else if (isSelected) { bg = "#450a0a"; border = "#ef4444"; color = "#fca5a5"; }
                }
                return (
                  <button key={i} className="ans-btn" onClick={() => handleQuizAnswer(i)} disabled={quizAnswer !== null}
                    style={{
                      width: "100%", background: bg, border: `1px solid ${border}`,
                      borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: quizAnswer !== null ? "default" : "pointer",
                      color, fontSize: 13, textAlign: "left", fontFamily: "'DM Sans', sans-serif",
                    }}>
                    {opt}
                  </button>
                );
              })}

              {quizAnswer !== null && (
                <div style={{ background: "#0f2010", border: "1px solid #22c55e33", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: "#86efac", lineHeight: 1.6 }}>
                    💡 {QUIZ[quizIdx].expl}
                  </p>
                </div>
              )}

              {quizAnswer !== null && (
                <button onClick={nextQuestion} style={{
                  width: "100%", background: "#c9a227", color: "#0a0a1a", border: "none", borderRadius: 10,
                  padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>
                  {quizIdx + 1 >= QUIZ.length ? "Voir les résultats" : "Question suivante →"}
                </button>
              )}
            </div>
          )}

          {tab === "quiz" && quizDone && (
            <div style={{ textAlign: "center", paddingTop: 30 }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>
                {quizScore >= 4 ? "🏆" : quizScore >= 3 ? "😎" : "📚"}
              </div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#c9a227", marginBottom: 8 }}>
                {quizScore}/{QUIZ.length}
              </h2>
              <p style={{ color: "#94a3b8", marginBottom: 24, fontSize: 14 }}>
                {quizScore >= 4 ? "Excellent ! Tu maîtrises bien les bases." :
                 quizScore >= 3 ? "Pas mal ! Continue à réviser." :
                 "Reprends les sections et réessaie !"}
              </p>
              <button onClick={resetQuiz} style={{
                background: "#c9a227", color: "#0a0a1a", border: "none", borderRadius: 10,
                padding: "13px 30px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>
                Recommencer
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
