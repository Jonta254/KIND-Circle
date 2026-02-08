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

  // Wallet and payment states
  const [walletConnected, setWalletConnected] = useState(false);
  const [wldBalance, setWldBalance] = useState(0);
  const [buyAmount, setBuyAmount] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);

  // Permission states
  const [permissionsGranted, setPermissionsGranted] = useState({
    notifications: false,
    microphone: false,
  });

  // Session & streak states (keep your existing logic)
  // ... (you can keep previous session and streak state here)

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

  // Handle login
  const handleLogin = () => {
    alert("World ID verification will be added here.");
    setLoggedIn(true);
    setScreen("home");
  };

  // Request permissions for notifications and microphone
  const requestPermissions = async () => {
    if (!supportedCommands.includes("request-permission")) {
      alert("Permission requests not supported in your World App version.");
      return;
    }

    try {
      const result = await MiniKit.commandsAsync.requestPermission({
        permissions: ["notifications", "microphone"],
      });
      setPermissionsGranted({
        notifications: result.notifications === "granted",
        microphone: result.microphone === "granted",
      });
      alert("Permissions updated.");
    } catch (e) {
      alert("Permission request cancelled or failed.");
    }
  };

  // Send haptic feedback on button taps
  const sendHaptic = () => {
    if (supportedCommands.includes("send-haptic-feedback")) {
      MiniKit.commandsAsync.sendHapticFeedback({
        style: "medium",
      }).catch(() => {
        // Fail silently
      });
    }
  };

  // Wallet connect only if supported
  const connectWallet = async () => {
    sendHaptic();
    if (!supportedCommands.includes("wallet-auth")) {
      alert("Wallet authentication not supported in your World App version.");
      return;
    }
    try {
      const res = await MiniKit.commandsAsync.walletAuth();
      console.log("Wallet authenticated:", res);
      setWalletConnected(true);
      fetchWldBalance();
    } catch (e) {
      console.error("Wallet auth failed:", e);
      alert("Wallet connection failed or cancelled.");
    }
  };

  // Fetch WLD balance (simulate here or use actual SDK call if available)
  const fetchWldBalance = async () => {
    try {
      // If there’s a command to get balance, use it here.
      // For now, simulate:
      setWldBalance(100); // simulate 100 WLD
    } catch (e) {
      setWldBalance(0);
    }
  };

  // Buy KIND with WLD (simulate sending transaction)
  const buyKind = async () => {
    sendHaptic();
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
      if (!supportedCommands.includes("send-transaction")) {
        alert("Sending transactions is not supported in your World App version.");
        setBuyLoading(false);
        return;
      }

      await MiniKit.commandsAsync.sendTransaction({
        to: "YOUR_WLD_RECEIVING_ADDRESS", // Replace this with your actual address
        amount: amount,
        tokenSymbol: "WLD",
        memo: "Buy KIND tokens",
      });

      // Update $KIND balance here (simulate)
      alert(`Success! You bought ${amount * 10} $KIND (simulated).`);
      setBuyAmount("");
      fetchWldBalance();
    } catch (e) {
      console.error("Transaction failed:", e);
      alert("Transaction failed or cancelled.");
    }
    setBuyLoading(false);
  };

  // Simple Pay button example using pay command
  const requestPayment = async () => {
    sendHaptic();
    if (!supportedCommands.includes("pay")) {
      alert("Payment requests not supported in your World App version.");
      return;
    }

    try {
      await MiniKit.commandsAsync.pay({
        amount: 1,
        tokenSymbol: "WLD",
        memo: "Support KIND Circle mini app",
      });
      alert("Payment request sent.");
    } catch (e) {
      alert("Payment request cancelled or failed.");
    }
  };

  // UI and other app logic here ...

  // Screen rendering (simplified)
  if (!loggedIn) {
    return (
      <WelcomeScreen
        onLogin={() => {
          sendHaptic();
          handleLogin();
        }}
      />
    );
  }

  return (
    <div
      style={{
        paddingTop: safeAreaInsets.top,
        paddingRight: safeAreaInsets.right,
        paddingBottom: safeAreaInsets.bottom,
        paddingLeft: safeAreaInsets.left,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#FFF6E5",
        minHeight: "100vh",
        textAlign: "center",
      }}
    >
      <h1>KIND Circle</h1>
      <p>App opened from: <strong>{launchLocation}</strong></p>

      {!walletConnected ? (
        <button
          onClick={connectWallet}
          style={styles.button}
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <p>Your wallet is connected.</p>
          <p>Your $WLD balance: {wldBalance}</p>

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount of $WLD to spend"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            style={styles.input}
          />
          <button onClick={buyKind} disabled={buyLoading} style={styles.button}>
            {buyLoading ? "Processing..." : "Buy $KIND"}
          </button>
        </>
      )}

      <hr style={{ margin: "30px 0", width: "80%" }} />

      <button onClick={requestPayment} style={styles.button}>
        Support KIND Circle with 1 $WLD
      </button>

      <hr style={{ margin: "30px 0", width: "80%" }} />

      <button onClick={requestPermissions} style={styles.button}>
        Request Permissions (Notifications & Microphone)
      </button>

      <p>
        Permissions granted: Notifications: {permissionsGranted.notifications ? "Yes" : "No"} | Microphone: {permissionsGranted.microphone ? "Yes" : "No"}
      </p>
    </div>
  );
}

function WelcomeScreen({ onLogin }) {
  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Welcome to KIND Circle</h1>
      <p>Verify you’re a real human to spread kindness and earn $KIND.</p>
      <button onClick={onLogin} style={styles.button}>
        Verify with World ID
      </button>
    </div>
  );
}

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
  input: {
    padding: "8px 12px",
    fontSize: 16,
    borderRadius: 6,
    border: "1px solid #ccc",
    width: 180,
    marginTop: 12,
  },
};
