import React, { useState, useEffect, useRef } from "react";

// Import MiniKit from CDN or installed package
import { MiniKit } from "@worldcoin/minikit-js";

const STORAGE_KEY = "kindCircleStreakData";
const KIND_BALANCE_KEY = "kindCircleKindBalance";
const BOOST_COST = 5; // Cost in $KIND to activate Missed Tap Protection

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("welcome"); // welcome, home, session, reward

  // Wallet states
  const [walletConnected, setWalletConnected] = useState(false);
  const [wldBalance, setWldBalance] = useState(0);

  // Buy KIND states
  const [buyAmount, setBuyAmount] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);

  // Session states
  const [sessionActive, setSessionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [missedTaps, setMissedTaps] = useState(0);
  const [boostUsed, setBoostUsed] = useState(false);

  // Streak states
  const [streakCount, setStreakCount] = useState(0);
  const [lastSessionDate, setLastSessionDate] = useState(null);
  const [rewardBonus, setRewardBonus] = useState(0);

  // KIND balance
  const [kindBalance, setKindBalance] = useState(0);
  const [boostActive, setBoostActive] = useState(false);

  // Constants
  const SESSION_DURATION = 600; // seconds
  const PRESENCE_INTERVAL = 70; // seconds
  const MAX_MISSES = 2;
  const BASE_REWARD = 10; // base $KIND

  const presenceTimeout = useRef(null);

  // Load data on login
  useEffect(() => {
    if (loggedIn) {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setStreakCount(parsed.streakCount || 0);
        setLastSessionDate(parsed.lastSessionDate || null);
      }
      const balance = localStorage.getItem(KIND_BALANCE_KEY);
      if (balance) {
        setKindBalance(parseInt(balance, 10));
      } else {
        setKindBalance(50);
        localStorage.setItem(KIND_BALANCE_KEY, "50");
      }
    }
  }, [loggedIn]);

  // Handle login
  const handleLogin = () => {
    alert("World ID verification will be added here.");
    setLoggedIn(true);
    setScreen("home");
  };

  // Check if inside World App and connect wallet
  const connectWallet = async () => {
    try {
      if (!MiniKit.isInstalled()) {
        alert("Please open this app inside World App to connect wallet.");
        return;
      }
      const res = await MiniKit.commandsAsync.connectWallet();
      console.log("Wallet connected:", res);
      setWalletConnected(true);
      fetchWldBalance();
    } catch (e) {
      console.error("Wallet connection failed:", e);
      alert("Wallet connection failed or cancelled.");
    }
  };

  // Fetch WLD balance
  const fetchWldBalance = async () => {
    try {
      const balance = await MiniKit.commandsAsync.getBalance({
        tokenSymbol: "WLD",
      });
      setWldBalance(balance);
    } catch (e) {
      console.error("Failed to fetch WLD balance:", e);
      setWldBalance(0);
    }
  };

  // Buy KIND with WLD (simulate sending transaction)
  const buyKind = async () => {
    const amount = parseFloat(buyAmount);
    if (!walletConnected) {
      alert("Connect your wallet first.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }
    if (amount > wldBalance) {
      alert("Insufficient WLD balance.");
      return;
    }
    setBuyLoading(true);
    try {
      // Simulate sending WLD to a backend or contract address
      await MiniKit.commandsAsync.sendTransaction({
        to: "YOUR_WLD_RECEIVING_ADDRESS", // Replace this with your real address
        amount: amount,
        tokenSymbol: "WLD",
        memo: "Buy KIND tokens",
      });

      // Simulate conversion rate: 1 WLD = 10 KIND
      const kindEarned = Math.floor(amount * 10);
      const newBalance = kindBalance + kindEarned;
      setKindBalance(newBalance);
      localStorage.setItem(KIND_BALANCE_KEY, newBalance.toString());

      alert(`Success! You bought ${kindEarned} $KIND.`);
      setBuyAmount("");
      fetchWldBalance(); // Refresh WLD balance
    } catch (e) {
      console.error("Transaction failed:", e);
      alert("Transaction failed or cancelled.");
    }
    setBuyLoading(false);
  };

  // (The rest of your session logic from before...)

  // For brevity, keep your existing session, streak, boost, presence logic here unchanged

  // Screens rendering
  if (!loggedIn) {
    return <WelcomeScreen onLogin={handleLogin} />;
  }

  if (screen === "home") {
    return (
      <HomeScreen
        onStart={() => {
          setScreen("session");
          setTimeLeft(SESSION_DURATION);
          setMissedTaps(0);
          setSessionActive(true);
          setBoostUsed(false);
        }}
        streakCount={streakCount}
        kindBalance={kindBalance}
        boostActive={boostActive}
        activateBoost={() => {
          if (kindBalance >= BOOST_COST) {
            setKindBalance(kindBalance - BOOST_COST);
            setBoostActive(true);
            alert(
              `Missed Tap Protection boost activated! You can miss 1 tap without penalty this session.`
            );
            localStorage.setItem(KIND_BALANCE_KEY, (kindBalance - BOOST_COST).toString());
          } else {
            alert(`Not enough $KIND to activate boost. You need ${BOOST_COST} $KIND.`);
          }
        }}
        walletConnected={walletConnected}
        connectWallet={connectWallet}
        wldBalance={wldBalance}
        buyAmount={buyAmount}
        setBuyAmount={setBuyAmount}
        buyKind={buyKind}
        buyLoading={buyLoading}
      />
    );
  }

  if (screen === "session") {
    return (
      <SessionScreen
        timeLeft={timeLeft}
        formatTime={(secs) => {
          const m = Math.floor(secs / 60)
            .toString()
            .padStart(2, "0");
          const s = (secs % 60).toString().padStart(2, "0");
          return `${m}:${s}`;
        }}
        onPresenceTap={() => {
          setMissedTaps(0);
          if (presenceTimeout.current) clearTimeout(presenceTimeout.current);
          presenceTimeout.current = setTimeout(() => {
            setMissedTaps((missed) => {
              let newMissed = missed + 1;
              if (boostActive && !boostUsed && newMissed === 1) {
                setBoostUsed(true);
                return missed;
              }
              if (newMissed >= MAX_MISSES) {
                setSessionActive(false);
                setScreen("reward");
                return MAX_MISSES;
              }
              return newMissed;
            });
          }, PRESENCE_INTERVAL * 1000);
        }}
        missedTaps={missedTaps}
        maxMisses={MAX_MISSES}
        onQuit={() => {
          setSessionActive(false);
          setScreen("reward");
        }}
        boostActive={boostActive}
        boostUsed={boostUsed}
      />
    );
  }

  if (screen === "reward") {
    return (
      <RewardScreen
        onContinue={() => {
          setScreen("home");
          setRewardBonus(0);
          setBoostActive(false);
        }}
        reward={Math.floor(BASE_REWARD * (1 + rewardBonus))}
        streakCount={streakCount}
        kindBalance={kindBalance}
      />
    );
  }

  return null;
}

// (Keep WelcomeScreen, HomeScreen, SessionScreen, RewardScreen components)

// Updated HomeScreen with wallet and buy KIND UI

function HomeScreen({
  onStart,
  streakCount,
  kindBalance,
  boostActive,
  activateBoost,
  walletConnected,
  connectWallet,
  wldBalance,
  buyAmount,
  setBuyAmount,
  buyKind,
  buyLoading,
}) {
  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 16 }}>KIND Circle</h2>
      <p style={{ marginBottom: 12 }}>
        Spend 10 minutes in the circle to earn kindness.
      </p>

      <button style={styles.button} onClick={onStart}>
        Enter the Circle
      </button>

      {streakCount > 0 && (
        <p style={{ marginTop: 16, color: "#555" }}>
          Your current streak:{" "}
          <strong>
            {streakCount} day{streakCount > 1 ? "s" : ""}
          </strong>
        </p>
      )}

      <p style={{ marginTop: 24, fontWeight: "bold" }}>
        Your $KIND balance: {kindBalance}
      </p>

      {!boostActive && (
        <button style={styles.boostButton} onClick={activateBoost}>
          Activate Missed Tap Protection Boost ({BOOST_COST} $KIND)
        </button>
      )}

      {boostActive && (
        <p style={{ marginTop: 12, color: "#2a9d8f" }}>
          Boost active: You can miss 1 tap without penalty this session.
        </p>
      )}

      <hr style={{ margin: "30px 0", width: "80%" }} />

      {/* Wallet Connect */}
      {!walletConnected ? (
        <button style={styles.button} onClick={connectWallet}>
          Connect Wallet to Buy $KIND
        </button>
      ) : (
        <>
          <p style={{ fontWeight: "bold" }}>
            Wallet Connected. Your $WLD Balance: {wldBalance}
          </p>

          <div style={{ marginTop: 12 }}>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount of $WLD to spend"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              style={styles.input}
            />
            <button
              style={{ ...styles.button, marginLeft: 10 }}
              onClick={buyKind}
              disabled={buyLoading}
            >
              {buyLoading ? "Processing..." : "Buy $KIND"}
            </button>
          </div>
          <small style={{ marginTop: 6, display: "block", color: "#777" }}>
            Conversion rate: 1 $WLD = 10 $KIND (simulated)
          </small>
        </>
      )}
    </div>
  );
}

// Keep your other components like WelcomeScreen, SessionScreen, RewardScreen unchanged from previous code

const styles = {
  appContainer: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#FFF6E5",
    minHeight: "100vh",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    padding: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
    color: "#222",
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    color: "#555",
    maxWidth: 320,
  },
  button: {
    backgroundColor: "#FFB703",
    border: "none",
    padding: "12px 26px",
    fontSize: 18,
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
    marginTop: 12,
  },
  boostButton: {
    backgroundColor: "#2a9d8f",
    border: "none",
    padding: "12px 26px",
    fontSize: 16,
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
    marginTop: 16,
  },
  input: {
    padding: "8px 12px",
    fontSize: 16,
    borderRadius: 6,
    border: "1px solid #ccc",
    width: 180,
  },
};
