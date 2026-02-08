import React, { useState, useEffect, useRef } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

const STORAGE_KEY = "kindCircleStreakData";
const KIND_BALANCE_KEY = "kindCircleKindBalance";
const BOOST_COST = 5; // Cost in $KIND to activate Missed Tap Protection

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("welcome");

  // World App context states
  const [insideWorldApp, setInsideWorldApp] = useState(false);
  const [launchLocation, setLaunchLocation] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [supportedCommands, setSupportedCommands] = useState([]);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  // Wallet states
  const [walletConnected, setWalletConnected] = useState(false);
  const [wldBalance, setWldBalance] = useState(0);

  // Buy KIND states
  const [buyAmount, setBuyAmount] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);

  // Session & streak states (same as before)
  const [sessionActive, setSessionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [missedTaps, setMissedTaps] = useState(0);
  const [boostUsed, setBoostUsed] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [lastSessionDate, setLastSessionDate] = useState(null);
  const [rewardBonus, setRewardBonus] = useState(0);
  const [kindBalance, setKindBalance] = useState(0);
  const [boostActive, setBoostActive] = useState(false);

  const presenceTimeout = useRef(null);

  const SESSION_DURATION = 600; // 10 minutes
  const PRESENCE_INTERVAL = 70; // seconds
  const MAX_MISSES = 2;
  const BASE_REWARD = 10; // base $KIND

  // Load World App context on mount
  useEffect(() => {
    if (MiniKit.isInstalled()) {
      setInsideWorldApp(true);
      setUserInfo(MiniKit.user);
      setDeviceInfo(MiniKit.deviceProperties);
      setLaunchLocation(MiniKit.location?.open_origin || "unknown");
      setSupportedCommands(
        MiniKit.supportedCommands?.map((cmd) => cmd.name) || []
      );

      const insets = MiniKit.deviceProperties?.safeAreaInsets;
      if (insets) {
        setSafeAreaInsets(insets);
      }
    }
  }, []);

  // Load stored data on login
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

  // Wallet connect only if supported
  const connectWallet = async () => {
    if (!supportedCommands.includes("wallet-auth") && !supportedCommands.includes("connectWallet")) {
      alert("Wallet connection not supported in your World App version.");
      return;
    }
    try {
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
      await MiniKit.commandsAsync.sendTransaction({
        to: "YOUR_WLD_RECEIVING_ADDRESS", // Replace this
        amount: amount,
        tokenSymbol: "WLD",
        memo: "Buy KIND tokens",
      });

      const kindEarned = Math.floor(amount * 10);
      const newBalance = kindBalance + kindEarned;
      setKindBalance(newBalance);
      localStorage.setItem(KIND_BALANCE_KEY, newBalance.toString());

      alert(`Success! You bought ${kindEarned} $KIND.`);
      setBuyAmount("");
      fetchWldBalance();
    } catch (e) {
      console.error("Transaction failed:", e);
      alert("Transaction failed or cancelled.");
    }
    setBuyLoading(false);
  };

  // The rest of your session, streak, boost logic unchanged...

  // Screen rendering logic
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
        launchLocation={launchLocation}
      />
    );
  }

  // ... other screens unchanged

  return null;
}

// Updated HomeScreen with launch location and wallet features conditionally enabled

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
  launchLocation,
}) {
  return (
    <div
      style={{
        padding: 20,
        textAlign: "center",
      }}
    >
      <h2>KIND Circle</h2>
      <p>App opened from: <strong>{launchLocation}</strong></p>

      <p>Spend 10 minutes in the circle to earn kindness.</p>

      <button style={styles.button} onClick={onStart}>
        Enter the Circle
      </button>

      {streakCount > 0 && (
        <p style={{ marginTop: 16, color: "#555" }}>
          Your current streak: <strong>{streakCount} day{streakCount > 1 ? "s" : ""}</strong>
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

      {/* Wallet Connect and Buy KIND */}
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

// Styles remain the same as previous versions
const styles = {
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
