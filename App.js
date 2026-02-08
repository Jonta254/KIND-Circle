import React, { useEffect, useState } from "react";
import {
  MiniKit,
  VerificationLevel,
  Tokens,
  tokenToDecimals,
  ResponseEvent,
} from "@worldcoin/minikit-js";

export default function App() {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Verify World ID proof async handler
  const handleVerify = async () => {
    if (!MiniKit.isInstalled()) {
      alert("Please install World App to verify.");
      return;
    }

    const verifyPayload = {
      action: "voting-action", // Replace with your Developer Portal action ID
      signal: "optional-signal", // Optional
      verification_level: VerificationLevel.Orb,
    };

    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

      if (finalPayload.status === "error") {
        setVerificationStatus("Verification failed");
        console.error("Verification error:", finalPayload);
        return;
      }

      // Send proof to backend for verification
      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.status === 200) {
        setVerificationStatus("Verification successful!");
      } else {
        setVerificationStatus("Verification failed at backend");
      }
    } catch (err) {
      setVerificationStatus("Verification error occurred");
      console.error(err);
    }
  };

  // Initiate payment async handler
  const handlePayment = async () => {
    if (!MiniKit.isInstalled()) {
      alert("Please install World App to make a payment.");
      return;
    }

    try {
      // Step 1: Get a unique reference from backend
      const res = await fetch("/api/initiate-payment", {
        method: "POST",
      });
      const { id: paymentReference } = await res.json();

      // Step 2: Prepare payment payload
      const paymentPayload = {
        reference: paymentReference,
        to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // Replace with your whitelisted address
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(1, Tokens.WLD).toString(),
          },
          {
            symbol: Tokens.USDC,
            token_amount: tokenToDecimals(3, Tokens.USDC).toString(),
          },
        ],
        description: "Example payment",
      };

      // Step 3: Request payment confirmation from World App
      const { finalPayload } = await MiniKit.commandsAsync.pay(paymentPayload);

      if (finalPayload.status !== "success") {
        setPaymentStatus("Payment failed or cancelled");
        return;
      }

      // Step 4: Confirm payment on backend
      const confirmRes = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
      });
      const confirmResult = await confirmRes.json();

      if (confirmResult.success) {
        setPaymentStatus("Payment successful!");
      } else {
        setPaymentStatus("Payment verification failed");
      }
    } catch (err) {
      setPaymentStatus("Payment error occurred");
      console.error(err);
    }
  };

  // Optional: subscribe to payment events (if you want to listen instead of async)
  useEffect(() => {
    if (!MiniKit.isInstalled()) return;

    const paymentListener = async (response) => {
      if (response.status === "success") {
        const res = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(response),
        });
        const payment = await res.json();
        if (payment.success) {
          setPaymentStatus("Payment successful (event)!");
        }
      }
    };

    MiniKit.subscribe(ResponseEvent.MiniAppPayment, paymentListener);
    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppPayment);
    };
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>World ID and Payment Demo</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>World ID Verification</h2>
        <button onClick={handleVerify}>Verify with World ID</button>
        {verificationStatus && <p>Status: {verificationStatus}</p>}
      </section>

      <section>
        <h2>Make a Payment</h2>
        <button onClick={handlePayment}>Pay with World App</button>
        {paymentStatus && <p>Status: {paymentStatus}</p>}
      </section>
    </div>
  );
}
