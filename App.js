import React, { useState, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

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

  // ==== WORLD ID VERIFICATION ====
  const handleWorldIDVerify = async () => {
    setLoadingVerify(true);
    try {
      const { finalPayload } = await MiniKit.verifyAsync({});

      if (finalPayload.status === "error") {
        alert("Verification failed. Please try again.");
        setLoadingVerify(false);
        return;
      }

      // Optional: send finalPayload.proof to your backend for verification here

      setLoggedIn(true);
    } catch (e) {
      alert("Verification cancelled or error occurred.");
      console.error(e);
    }
    setLoadingVerify(false);
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
      MiniKit.commandsAsync.sendHapticFeedback({ style: "medium" }).catch(() => {});
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
      await MiniKit.commandsAsync.walletAuth();
      setWalletConnected(true);
      fetchWldBalance();
    } catch (e) {
      alert("Wallet connection failed or cancelled.");
    }
  };

  // Fetch WLD balance (simulate here or use actual SDK call if available)
  const fetchWldBalance = async () => {
    try {
      setWldBalance(100); // simulate 100 WLD balance
    } catch {
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
        to: "YOUR_WLD_RECEIVING_ADDRESS", // Replace with your actual address
        amount: amount,
        tokenSymbol: "WLD",
        memo: "Buy KIND tokens",
      });

      alert(`Success! You bought ${amount * 10} $KIND (simulated).`);
      setBuyAmount("");
      fetchWldBalance();
    } catch {
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
    } catch {
      alert("Payment request cancelled or failed.");
    }
  };

  // Render
  if (!loggedIn) {
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
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: 20,
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 12, color: "#222" }}>
          Welcome to KIND Circle
        </h1>
        <p
          style={{
            fontSize: 16,
            marginBottom: 24,
            color: "#555",
            maxWidth: 320,
          }}
        >
          Verify you’re a real human to spread kindness and earn $KIND.
        </p>
        <button
          onClick={handleWorldIDVerify}
          disabled={loadingVerify}
          style={{
            backgroundColor: "#FFB703",
            border: "none",
            padding: "12px 26px",
            fontSize: 18,
            borderRadius: 10,
            color: "#fff",
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          {loadingVerify ? "Verifying..." : "Verify with World ID"}
        </button>
      </div>
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
        padding: 20,
      }}
    >
      <h1>KIND Circle</h1>
      <p>App opened from: <strong>{launchLocation}</strong></p>

      {!walletConnected ? (
        <button
          onClick={connectWallet}
          style={{
            backgroundColor: "#FFB703",
            border: "none",
            padding: "12px 26px",
            fontSize: 18,
            borderRadius: 10,
            color: "#fff",
            cursor: "pointer",
            marginTop: 12,
          }}
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
            style={{
              padding: "8px 12px",
              fontSize: 16,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: 180,
              marginTop: 12,
            }}
          />
          <button
            onClick={buyKind}
            disabled={buyLoading}
            style={{
              backgroundColor: "#FFB703",
              border: "none",
              padding: "12px 26px",
              fontSize: 18,
              borderRadius: 10,
              color: "#fff",
              cursor: "pointer",
              marginTop: 12,
            }}
          >
            {buyLoading ? "Processing..." : "Buy $KIND"}
          </button>
        </>
      )}

      <hr style={{ margin: "30px 0", width: "80%" }} />

      <button
        onClick={requestPayment}
        style={{
          backgroundColor: "#FFB703",
          border: "none",
          padding: "12px 26px",
          fontSize: 18,
          borderRadius: 10,
          color: "#fff",
          cursor: "pointer",
          marginTop: 12,
        }}
      >
        Support KIND Circle with 1 $WLD
      </button>

      <hr style={{ margin: "30px 0", width: "80%" }} />

      <button
        onClick={requestPermissions}
        style={{
          backgroundColor: "#FFB703",
          border: "none",
          padding: "12px 26px",
          fontSize: 18,
          borderRadius: 10,
          color: "#fff",
          cursor: "pointer",
          marginTop: 12,
        }}
      >
        Request Permissions (Notifications & Microphone)
      </button>

      <p style={{ marginTop: 12 }}>
        Permissions granted: Notifications:{" "}
        {permissionsGranted.notifications ? "Yes" : "No"} | Microphone:{" "}
        {permissionsGranted.microphone ? "Yes" : "No"}
      </p>
    </div>
  );
}
