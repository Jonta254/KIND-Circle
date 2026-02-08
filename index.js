import React, { useState } from "react";

/*
  ============================
  DEV MODE CONFIG
  ============================
  When DEV_MODE = true:
  - No World ID required
  - Fake balances
  - Fake human match
  When false:
  - Worldcoin MiniKit will be used (Procedure FINAL)
*/
const DEV_MODE = true;

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("home");
  const [kindBalance, setKindBalance] = useState(25);
  const [wldBalance, setWldBalance] = useState(5);
  const [streak, setStreak] = useState(1);

  const handleLogin = () => {
    if (DEV_MODE) {
      setLoggedIn(true);
    } else {
      // Worldcoin World ID will be added here later
    }
  };

  if (!loggedIn) {
    return <WelcomeScreen onLogin={handleLogin} />;
  }

  return (
    <div style={styles.container}>
      <Header kind={kindBalance} wld={wldBalance} streak={streak} />

      {screen === "home" && (
        <HomeScreen setScreen={setScreen} />
      )}

      {screen === "tap" && (
        <KindTap
          onBack={() => setScreen("home")}
          onReward={() => {
            setKindBalance(kindBalance + 2);
            setStreak(streak + 1);
          }}
        />
      )}

      {screen === "quest" && (
        <KindQuest
          onBack={() => setScreen("home")}
          wldBalance={wldBalance}
          onSpendWLD={() => setWldBalance(wldBalance - 1)}
          onReward={() => setKindBalance(kindBalance + 5)}
        />
      )}
    </div>
  );
}

/* ============================
   SCREENS
============================ */

function WelcomeScreen({ onLogin }) {
  return (
    <div style={styles.center}>
      <h1>KIND Circle</h1>
      <p>Real humans. Real kindness. Earn $KIND.</p>
      <button style={styles.button} onClick={onLogin}>
        {DEV_MODE ? "Enter (DEV MODE)" : "Verify with World ID"}
      </button>
    </div>
  );
}

function Header({ kind, wld, streak }) {
  return (
    <div style={styles.header}>
      <span>💛 $KIND: {kind}</span>
      <span>🌍 $WLD: {wld}</span>
      <span>🔥 Streak: {streak}</span>
    </div>
  );
}

function HomeScreen({ setScreen }) {
  return (
    <div style={styles.center}>
      <button style={styles.button} onClick={() => setScreen("tap")}>
        KIND Tap
      </button>
      <button style={styles.button} onClick={() => setScreen("quest")}>
        KIND Quest
      </button>
    </div>
  );
}

function KindTap({ onBack, onReward }) {
  return (
    <div style={styles.center}>
      <h3>You matched with a human 🌍</h3>
      <p>Send one kindness</p>

      <button style={styles.smallButton} onClick={onReward}>
        💛 You matter
      </button>
      <button style={styles.smallButton} onClick={onReward}>
        🙌 I appreciate you
      </button>
      <button style={styles.smallButton} onClick={onReward}>
        🌟 Stay strong
      </button>

      <button style={styles.link} onClick={onBack}>
        ← Back
      </button>
    </div>
  );
}

function KindQuest({ onBack, wldBalance, onSpendWLD, onReward }) {
  const startQuest = () => {
    if (wldBalance <= 0) {
      alert("Not enough $WLD");
      return;
    }
    onSpendWLD();
    onReward();
    alert("Quest completed! You earned $KIND 💛");
  };

  return (
    <div style={styles.center}>
      <h3>KIND Quest</h3>
      <p>Unlock with 1 $WLD</p>
      <button style={styles.button} onClick={startQuest}>
        Start Quest
      </button>
      <button style={styles.link} onClick={onBack}>
        ← Back
      </button>
    </div>
  );
}

/* ============================
   STYLES
============================ */

const styles = {
  container: {
    fontFamily: "Arial",
    minHeight: "100vh",
    background: "#FFF6E5",
  },
  center: {
    padding: 20,
    textAlign: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-around",
    padding: 10,
    background: "#FFD166",
  },
  button: {
    padding: "12px 20px",
    margin: 10,
    fontSize: 16,
    borderRadius: 8,
    border: "none",
    background: "#FFB703",
    color: "#fff",
  },
  smallButton: {
    padding: "10px 16px",
    margin: 6,
    fontSize: 14,
    borderRadius: 8,
    border: "none",
    background: "#FFC857",
  },
  link: {
    marginTop: 20,
    background: "none",
    border: "none",
    color: "#333",
  },
};
