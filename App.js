"use client";

import React, { useState } from "react";
import {
  MiniKit,
  WalletAuthInput,
  VerificationLevel,
} from "@worldcoin/minikit-js";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Wallet sign in function
  const signInWithWallet = async () => {
    if (!MiniKit.isInstalled()) {
      alert("Please install World App");
      return;
    }

    try {
      // Get nonce from backend
      const res = await fetch("/api/nonce");
      const { nonce } = await res.json();

      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: "0", // Optional
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        statement: "Sign in to MyApp via World App",
      });

      if (finalPayload.status === "error") {
        alert("Wallet auth cancelled or failed");
        return;
      }

      // Send the signed message and nonce to backend to verify
      const verifyRes = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });

      const verifyJson = await verifyRes.json();
      if (verifyJson.status === "success" && verifyJson.isValid) {
        alert("Signed in successfully!");
        setWalletAddress(finalPayload.address);
      } else {
        alert("Failed to verify signature");
      }
    } catch (error) {
      alert("Error during wallet sign-in: " + error);
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>World App Mini App Wallet Auth Demo</h1>
      <button onClick={signInWithWallet}>Sign in with Wallet</button>

      {walletAddress && (
        <p>
          Signed in wallet address: <code>{walletAddress}</code>
        </p>
      )}
    </main>
  );
}
