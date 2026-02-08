// app/page.tsx
"use client";

import React from "react";
import {
  MiniKit,
  tokenToDecimals,
  Tokens,
  PayCommandInput,
  VerifyCommandInput,
  VerificationLevel,
} from "@worldcoin/minikit-js";

export default function Home() {
  // Send payment function
  const sendPayment = async () => {
    if (!MiniKit.isInstalled()) {
      alert("Please install World App to proceed.");
      return;
    }

    try {
      // Call backend to get a unique reference ID
      const res = await fetch("/api/initiate-payment", { method: "POST" });
      const { id } = await res.json();

      const payload: PayCommandInput = {
        reference: id,
        to: "YOUR_WHITELISTED_WALLET_ADDRESS", // Replace with your actual whitelisted address
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(1, Tokens.WLD).toString(), // Sending 1 WLD token
          },
        ],
        description: "Example payment using MiniKit",
      };

      // Send pay command to World App
      const { finalPayload } = await MiniKit.commandsAsync.pay(payload);

      if (finalPayload.status === "success") {
        // Confirm payment on backend
        const confirmRes = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalPayload),
        });

        const confirmJson = await confirmRes.json();
        if (confirmJson.success) {
          alert("Payment successful!");
        } else {
          alert("Payment verification failed.");
        }
      } else {
        alert("Payment was cancelled or failed.");
      }
    } catch (error) {
      alert("Error during payment: " + error);
    }
  };

  // World ID verify function
  const handleVerify = async () => {
    if (!MiniKit.isInstalled()) {
      alert("Please install World App to proceed.");
      return;
    }

    try {
      const verifyPayload: VerifyCommandInput = {
        action: "your-action-id", // Replace with your actual action ID from Developer Portal
        signal: "optional-signal", // Optional - can be a user ID or other string
        verification_level: VerificationLevel.Orb,
      };

      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

      if (finalPayload.status === "success") {
        // Send verification proof to backend
        const verifyRes = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: finalPayload,
            action: verifyPayload.action,
            signal: verifyPayload.signal,
          }),
        });

        const verifyJson = await verifyRes.json();
        if (verifyJson.status === 200) {
          alert("Verification success!");
        } else {
          alert("Verification failed on backend.");
        }
      } else {
        alert("Verification cancelled or failed.");
      }
    } catch (error) {
      alert("Error during verification: " + error);
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>World App Mini App Demo</h1>
      <button onClick={sendPayment} style={{ marginRight: "1rem" }}>
        Send Payment
      </button>
      <button onClick={handleVerify}>Verify User</button>
    </main>
  );
}
