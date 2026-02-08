import React, { useState } from "react";
import { MiniKit, VerificationLevel, ISuccessResult } from "@worldcoin/minikit-js";

// Replace with your actual action ID from Worldcoin Developer Portal
const VERIFY_ACTION_ID = "kind-circle-verify";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle user verification via World ID
  const handleVerify = async () => {
    if (!MiniKit.isInstalled()) {
      alert("Please open this mini app inside the World App to verify.");
      return;
    }

    setLoading(true);

    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: VERIFY_ACTION_ID,
        verification_level: VerificationLevel.Orb, // Use Orb verification level
      });

      if (finalPayload.status === "error") {
        console.error("Verification error:", finalPayload);
        alert("Verification failed, please try again.");
        setLoading(false);
        return;
      }

      // Send proof to backend for verification
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: VERIFY_ACTION_ID,
        }),
      });

      const data = await response.json();

      if (data.status === 200) {
        alert("Verification successful! Welcome to KIND Circle.");
        setLoggedIn(true);
      } else {
        alert("Verification rejected by backend.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("An unexpected error occurred during verification.");
    }

    setLoading(false);
  };

  return (
    <div style={styles.appContainer}>
      {!loggedIn ? (
        <WelcomeScreen onLogin={handleVerify} loading={loading} />
      ) : (
        <HomeScreen />
      )}
    </div>
  );
}

function WelcomeScreen({ onLogin, loading }) {
  return (
    <div style={styles.container}>
      <h1 style
