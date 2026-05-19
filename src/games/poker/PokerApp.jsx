import { useState } from "react";
import PokerGame from "./PokerGame.jsx";
import './poker.css'

const SUIT_COLORS = { "♠": "#e2e8f0", "♥": "#f87171", "♦": "#f87171", "♣": "#e2e8f0" };

const HANDS = [
  {
    rank: 1, name: "Quinte Flush Royale", emoji: "👑",
    short: "A K Q J 10 de la même couleur",
    description: "La main absolue. As, Roi, Dame, Valet, 10 — tous de la même couleur. Imbattable.",
    cards: ["A♠", "K♠", "Q♠", "J♠", "10♠"], probability: "0.000154%",
    tip: "Si tu l'as, joue lentement pour maximiser le pot.",
  },
  {
    rank: 2, name: "Quinte Flush", emoji: "🔥",
    short: "5 cartes consécutives de même couleur",
    description: "Cinq cartes qui se suivent, toutes de la même couleur. Presque imbattable.",
    cards: ["9♥", "8♥", "7♥", "6♥", "5♥"], probability: "0.00139%",
    tip: "Slow-play ou relance agressive selon le board.",
  },
  {
    rank: 3, name: "Carré", emoji: "🃏",
    short: "4 cartes de même valeur",
    description: "Quatre cartes identiques. Extrêmement puissant.",
    cards: ["K♠", "K♥", "K♦", "K♣", "7♠"], probability: "0.0240%",
    tip: "Presque toujours value-bet maximal.",
  },
  {
    rank: 4, name: "Full House", emoji: "🏠",
    short: "Un brelan + une paire",
    description: "Trois d'une valeur et deux d'une autre. Le kicker est le brelan.",
    cards: ["Q♠", "Q♥", "Q♦", "J♣", "J♠"], probability: "0.144%",
    tip: "Attention aux boards paired — l'adversaire peut avoir un meilleur full.",
  },
  {
    rank: 5, name: "Couleur (Flush)", emoji: "🌊",
    short: "5 cartes de même couleur",
    description: "N'importe quelles cinq cartes de la même couleur.",
    cards: ["A♦", "J♦", "8♦", "5♦", "2♦"], probability: "0.197%",
    tip: "Le plus haut kicker compte. Méfie-toi si le board a 3 cartes flush.",
  },
  {
    rank: 6, name: "Quinte (Straight)", emoji: "📈",
    short: "5 cartes consécutives",
    description: "Cinq cartes qui se suivent, sans couleur commune.",
    cards: ["9♠", "8♥", "7♦", "6♣", "5♠"], probability: "0.392%",
    tip: "La quinte basse (roue) = A-2-3-4-5.",
  },
  {
    rank: 7, name: "Brelan", emoji: "🎯",
    short: "3 cartes de même valeur",
    description: "Trois cartes identiques avec deux kickers différents.",
    cards: ["7♠", "7♥", "7♦", "K♣", "3♠"], probability: "2.11%",
    tip: "Semi-bluff draw possible contre toi — reste vigilant.",
  },
  {
    rank: 8, name: "Deux Paires", emoji: "✌️",
    short: "Deux paires différentes",
    description: "Deux fois deux cartes de même valeur.",
    cards: ["A♠", "A♥", "9♦", "9♣", "K♠"], probability: "4.75%",
    tip: "La meilleure des deux paires prime. Le kicker peut décider.",
  },
  {
    rank: 9, name: "Paire", emoji: "👥",
    short: "2 cartes de même valeur",
    description: "Deux cartes identiques. Très commun.",
    cards: ["J♠", "J♥", "A♦", "8♣", "3♠"], probability: "42.26%",
    tip: "La force dépend beaucoup du board et de ta position.",
  },
  {
    rank: 10, name: "Hauteur (High Card)", emoji: "📉",
    short: "Aucune combinaison",
    description: "Rien. La plus haute carte joue.",
    cards: ["A♠", "K♥", "9♦", "7♣", "2♠"], probability: "50.1%",
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
      width: 42, height: 58, background: "#1c2333", border: `2px solid ${color}33`,
      borderRadius: 7, fontSize: 12, fontWeight: 700, color, fontFamily: "'DM Serif Display', serif",
      boxShadow: `0 2px 8px ${color}22`, flexShrink: 0,
    }}>
      <span style={{ fontSize: 14 }}>{val}</span>
      <span style={{ fontSize: 16, lineHeight: 1 }}>{suit}</span>
    </div>
  );
}

export default function PokerApp({ onBack }) {
  const [tab, setTab] = useState("rules");
  const [selectedHand, setSelectedHand] = useState(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [glossSearch, setGlossSearch] = useState("");

  const tabs = [
    { id: "rules", label: "Règles", icon: "📋" },
    { id: "hands", label: "Mains", icon: "🃏" },
    { id: "positions", label: "Positions", icon: "🎯" },
    { id: "glossary", label: "Glossaire", icon: "📖" },
    { id: "quiz", label: "Quiz", icon: "⚡" },
    { id: "play", label: "Jouer", icon: "🎮" },
  ];

  const handleQuizAnswer = (idx) => {
    if (quizAnswer !== null) return;
    setQuizAnswer(idx);
    if (idx === QUIZ[quizIdx].answer) setQuizScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (quizIdx + 1 >= QUIZ.length) setQuizDone(true);
    else { setQuizIdx(i => i + 1); setQuizAnswer(null); }
  };

  const resetQuiz = () => {
    setQuizIdx(0); setQuizAnswer(null); setQuizScore(0); setQuizDone(false);
  };

  const filteredGloss = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(glossSearch.toLowerCase()) ||
    g.def.toLowerCase().includes(glossSearch.toLowerCase())
  );

  return (
    <div>
      <div className="poker-layout">
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          background: "#111827",
          borderBottom: "1px solid #2d3a5a",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 30 }}>♠</span>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontFamily: "'DM Serif Display', serif", color: "#c9a227", lineHeight: 1.2 }}>
                Poker School
              </h1>
              <p style={{ fontSize: 11, color: "#8899bb", letterSpacing: 2, textTransform: "uppercase" }}>
                Apprends à jouer
              </p>
            </div>
            {onBack && (
              <button onClick={onBack} style={{
                background: "#2d3a5a", border: "1px solid #c9a22740", color: "#c9a227",
                borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: 1,
                flexShrink: 0,
              }}>
                ← Accueil
              </button>
            )}
          </div>
        </div>

        <div className="poker-body">
          {/* Desktop sidebar tabs */}
          <div className="poker-tabs-sidebar">
            {tabs.map(t => (
              <button key={t.id} className="tab-btn" onClick={() => { setTab(t.id); setSelectedHand(null); }}
                style={{
                  padding: "12px 16px", background: tab === t.id ? "#c9a22715" : "none",
                  border: "none", borderRadius: 8,
                  borderLeft: tab === t.id ? "3px solid #c9a227" : "3px solid transparent",
                  cursor: "pointer", color: tab === t.id ? "#c9a227" : "#8899bb",
                  fontSize: 13, fontWeight: 600, textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10,
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="poker-content">
          <div className="poker-inner">

            {/* RULES TAB */}
            {tab === "rules" && (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#c9a227", marginBottom: 4 }}>
      Texas Hold'em — Règles
    </h2>
    {[
      {
        icon: "🎯", title: "Objectif",
        text: "Remporter le pot en formant la meilleure main de 5 cartes parmi vos 2 cartes privées et les 5 cartes communes, ou en faisant fuir tous vos adversaires par des mises stratégiques.",
      },
      {
        icon: "💰", title: "Les blindes",
        text: null,
        items: [
          { label: "Small Blind (SB)", desc: "Le joueur à gauche du dealer doit poster une mise obligatoire (la moitié de la blinde)." },
          { label: "Big Blind (BB)", desc: "Le joueur suivant poste le double. C'est la mise de référence de la manche." },
        ],
      },
      {
        icon: "🃏", title: "Distribution",
        text: "Chaque joueur reçoit 2 cartes cachées (hole cards), visibles seulement par lui. Ces cartes combinées avec les 5 cartes communes forment votre main finale.",
      },
      {
        icon: "🔄", title: "Les 4 rounds de mise",
        text: null,
        steps: [
          { label: "Pré-flop", desc: "Avant toute carte commune. L'action commence à gauche du BB." },
          { label: "Flop", desc: "3 cartes communes sont dévoilées. Nouveau tour de mises." },
          { label: "Turn", desc: "1 carte supplémentaire. Nouveau tour de mises." },
          { label: "River", desc: "La 5ème et dernière carte commune. Dernier tour de mises." },
        ],
      },
      {
        icon: "⚡", title: "Actions disponibles",
        text: null,
        items: [
          { label: "Fold", desc: "Abandonner sa main. On perd les mises déjà investies." },
          { label: "Check", desc: "Passer sans miser (si personne n'a misé avant soi)." },
          { label: "Call", desc: "Suivre la mise de l'adversaire pour rester en jeu." },
          { label: "Raise", desc: "Surenchérir — force les autres à payer plus ou à se coucher." },
          { label: "All-in", desc: "Miser tous ses jetons. On reste en jeu pour la part du pot qu'on peut gagner." },
        ],
      },
      {
        icon: "🏆", title: "Le Showdown",
        text: "Si deux joueurs ou plus sont encore en jeu après la river, ils retournent leurs cartes. Le joueur avec la meilleure combinaison de 5 cartes (parmi ses 2 hole cards + les 5 communes) remporte le pot.",
      },
      {
        icon: "🔁", title: "Main suivante",
        text: "Le bouton de dealer (D) tourne d'un joueur vers la gauche. Les rôles SB et BB changent également. Chacun joue chaque position à tour de rôle.",
      },
    ].map((section, si) => (
      <div key={si} style={{ background: "#1c2333", border: "1px solid #2d3a5a", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>{section.icon}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>{section.title}</span>
        </div>
        {section.text && (
          <p style={{ fontSize: 13, color: "#c8d6f0", lineHeight: 1.7 }}>{section.text}</p>
        )}
        {section.steps && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {section.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#c9a227",
                  background: "#c9a22715", padding: "2px 8px", borderRadius: 20,
                  whiteSpace: "nowrap", flexShrink: 0, marginTop: 2,
                }}>{s.label}</span>
                <span style={{ fontSize: 13, color: "#c8d6f0", lineHeight: 1.6 }}>{s.desc}</span>
              </div>
            ))}
          </div>
        )}
        {section.items && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {section.items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#c9a227",
                  background: "#c9a22715", padding: "2px 8px", borderRadius: 20,
                  whiteSpace: "nowrap", flexShrink: 0, marginTop: 2,
                }}>{it.label}</span>
                <span style={{ fontSize: 13, color: "#c8d6f0", lineHeight: 1.6 }}>{it.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
    <div style={{ background: "#c9a22712", border: "1px solid #c9a22730", borderRadius: 10, padding: 14 }}>
      <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7 }}>
        💡 <strong style={{ color: "#c9a227" }}>Conseil débutant :</strong> Concentrez-vous d'abord sur votre position à la table et la force de vos cartes de départ. La position (parler en dernier) est l'un des avantages les plus importants au poker.
      </p>
    </div>
  </div>
)}

            {/* HANDS TAB */}
            {tab === "hands" && !selectedHand && (
              <div>
                <p style={{ fontSize: 12, color: "#8899bb", marginBottom: 16, textAlign: "center" }}>
                  Du plus fort au plus faible — clique pour les détails
                </p>
                <div className="hands-grid">
                  {HANDS.map((hand, i) => (
                    <div key={i} className="hand-card" onClick={() => setSelectedHand(hand)}
                      style={{
                        background: "#1c2333", border: "1px solid #2d3a5a", borderRadius: 10,
                        padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                      }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 8, background: "#c9a22715",
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
                        <span style={{ fontSize: 11, color: "#8899bb" }}>{hand.short}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "hands" && selectedHand && (
              <div>
                <button onClick={() => setSelectedHand(null)} style={{
                  background: "none", border: "none", color: "#c9a227", cursor: "pointer",
                  fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6, padding: 0,
                }}>← Retour</button>

                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 44, marginBottom: 8 }}>{selectedHand.emoji}</div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#c9a227" }}>
                    {selectedHand.name}
                  </h2>
                  <span style={{ fontSize: 11, color: "#8899bb", textTransform: "uppercase", letterSpacing: 2 }}>
                    Rang #{selectedHand.rank}
                  </span>
                </div>

                <div className="hand-detail-full" style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
                  {selectedHand.cards.map((c, i) => <Card key={i} label={c} />)}
                </div>

                <div className="hand-detail-layout">
                  <div style={{ background: "#1c2333", borderRadius: 10, padding: 16 }}>
                    <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{selectedHand.description}</p>
                  </div>
                  <div style={{ background: "#1c2333", borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, color: "#8899bb", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Probabilité</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#c9a227", marginBottom: 12 }}>{selectedHand.probability}</div>
                    <div style={{ fontSize: 10, color: "#c9a227", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>💡 Conseil</div>
                    <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{selectedHand.tip}</p>
                  </div>
                </div>
              </div>
            )}

            {/* POSITIONS TAB */}
            {tab === "positions" && (
              <div>
                <p style={{ fontSize: 12, color: "#8899bb", marginBottom: 12, textAlign: "center" }}>
                  La position est cruciale au poker
                </p>
                <div style={{
                  background: "#0f2010", border: "3px solid #1a4020", borderRadius: 60,
                  padding: "20px 14px", marginBottom: 20,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {POSITIONS.map((p, i) => (
                      <div key={i} style={{
                        background: p.color + "22", border: `1px solid ${p.color}66`, borderRadius: 8,
                        padding: "6px 12px", fontSize: 12, fontWeight: 700, color: p.color,
                      }}>{p.name}</div>
                    ))}
                  </div>
                </div>

                <div className="positions-grid">
                  {POSITIONS.map((p, i) => (
                    <div key={i} style={{
                      background: "#1c2333", border: `1px solid ${p.color}33`, borderRadius: 10,
                      padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{
                          background: p.color + "22", color: p.color, fontWeight: 800, fontSize: 13,
                          padding: "3px 10px", borderRadius: 20,
                        }}>{p.name}</div>
                        <span style={{ fontSize: 11, color: "#8899bb" }}>{p.full}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{p.desc}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#c9a22712", border: "1px solid #c9a22730", borderRadius: 10, padding: 14, marginTop: 12 }}>
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
                    width: "100%", background: "#1c2333", border: "1px solid #2d3a5a", borderRadius: 8,
                    color: "#e2e8f0", padding: "10px 14px", fontSize: 13, marginBottom: 16, outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <div className="glossary-grid">
                  {filteredGloss.map((g, i) => (
                    <div key={i} style={{
                      background: "#1c2333", border: "1px solid #2d3a5a", borderRadius: 10,
                      padding: "12px 14px",
                    }}>
                      <div style={{ fontWeight: 700, color: "#c9a227", fontSize: 14, marginBottom: 4 }}>{g.term}</div>
                      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{g.def}</p>
                    </div>
                  ))}
                </div>
                {filteredGloss.length === 0 && (
                  <p style={{ textAlign: "center", color: "#8899bb", marginTop: 30 }}>Aucun résultat</p>
                )}
              </div>
            )}

            {/* QUIZ TAB */}
            {tab === "quiz" && !quizDone && (
              <div className="quiz-container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: "#8899bb" }}>Question {quizIdx + 1}/{QUIZ.length}</span>
                  <span style={{ fontSize: 12, color: "#c9a227", fontWeight: 700 }}>Score: {quizScore}</span>
                </div>

                <div style={{ background: "#2d3a5a", borderRadius: 4, height: 4, marginBottom: 20 }}>
                  <div style={{
                    background: "#c9a227", height: 4, borderRadius: 4,
                    width: `${((quizIdx + (quizAnswer !== null ? 1 : 0)) / QUIZ.length) * 100}%`,
                    transition: "width 0.3s",
                  }} />
                </div>

                <div style={{ background: "#1c2333", borderRadius: 12, padding: 18, marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>{QUIZ[quizIdx].q}</p>
                </div>

                {QUIZ[quizIdx].options.map((opt, i) => {
                  const isCorrect = i === QUIZ[quizIdx].answer;
                  const isSelected = i === quizAnswer;
                  let bg = "#1c2333", border = "#2d3a5a", color = "#cbd5e1";
                  if (quizAnswer !== null) {
                    if (isCorrect) { bg = "#14532d"; border = "#22c55e"; color = "#86efac"; }
                    else if (isSelected) { bg = "#450a0a"; border = "#ef4444"; color = "#fca5a5"; }
                  }
                  return (
                    <button key={i} className="ans-btn" onClick={() => handleQuizAnswer(i)} disabled={quizAnswer !== null}
                      style={{
                        width: "100%", background: bg, border: `1px solid ${border}`,
                        borderRadius: 10, padding: "13px 16px", marginBottom: 8,
                        cursor: quizAnswer !== null ? "default" : "pointer",
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
                    width: "100%", background: "#c9a227", color: "#111827", border: "none", borderRadius: 10,
                    padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {quizIdx + 1 >= QUIZ.length ? "Voir les résultats" : "Question suivante →"}
                  </button>
                )}
              </div>
            )}

            {tab === "quiz" && quizDone && (
              <div className="quiz-container" style={{ textAlign: "center", paddingTop: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>
                  {quizScore >= 4 ? "🏆" : quizScore >= 3 ? "😎" : "📚"}
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#c9a227", marginBottom: 8 }}>
                  {quizScore}/{QUIZ.length}
                </h2>
                <p style={{ color: "#94a3b8", marginBottom: 28, fontSize: 14 }}>
                  {quizScore >= 4 ? "Excellent ! Tu maîtrises bien les bases." :
                   quizScore >= 3 ? "Pas mal ! Continue à réviser." :
                   "Reprends les sections et réessaie !"}
                </p>
                <button onClick={resetQuiz} style={{
                  background: "#c9a227", color: "#111827", border: "none", borderRadius: 10,
                  padding: "13px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>
                  Recommencer
                </button>
              </div>
            )}

            {/* PLAY TAB */}
            {tab === "play" && <PokerGame />}

          </div>
          </div> {/* fin poker-content */}
        </div>
      </div>

      {/* Mobile tab bar — sticky bottom */}
      <nav className="poker-tabs-bar">
        {tabs.map(t => (
          <button key={t.id} className="tab-btn" onClick={() => { setTab(t.id); setSelectedHand(null); }}
            style={{
              flex: 1, padding: "10px 4px", background: "none", border: "none", cursor: "pointer",
              color: tab === t.id ? "#c9a227" : "#8899bb", fontSize: 10, fontWeight: 600,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              fontFamily: "'DM Sans', sans-serif",
            }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
