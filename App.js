import React, { useState } from 'react';
import SimpleABI from './abi/SimpleABI.json'; // Your ABI JSON file
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';

const MINIAPP_CONTRACT = '0x979FC9777CE6a8ef76CFbcE9EAfA3C7d53b85458'; // Contract address you gave
const RECIPIENT_ADDRESS = '0x6588e8765c495a9d44e93b0293aedd7ecd6167fc'; // Updated recipient address you gave
const APP_ID = 'app_2494b73b6612396166f27742c016a0c9'; // Your app ID

export default function App() {
  const [transactionId, setTransactionId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const client = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    client,
    appConfig: { app_id: APP_ID },
    transactionId,
  });

  const mintToken = async () => {
    setStatusMessage('Sending mint token transaction...');
    try {
      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: MINIAPP_CONTRACT,
            abi: SimpleABI,
            functionName: 'mintToken',
            args: [RECIPIENT_ADDRESS],
          },
        ],
        formatPayload: true, // keep default true
      });

      if (finalPayload.status === 'error') {
        setStatusMessage('Error sending transaction: ' + finalPayload.errorMessage);
        console.error('Error sending transaction', finalPayload);
      } else {
        setTransactionId(finalPayload.transaction_id);
        setStatusMessage('Transaction sent! Waiting for confirmation...');
      }
    } catch (error) {
      setStatusMessage('Transaction failed: ' + error.message);
      console.error(error);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Mint Token Mini App</h1>
      <p>
        Contract: <code>{MINIAPP_CONTRACT}</code><br />
        Recipient: <code>{RECIPIENT_ADDRESS}</code><br />
        App ID: <code>{APP_ID}</code>
      </p>

      <button onClick={mintToken} disabled={isConfirming || isConfirmed} style={{ padding: '10px 20px', fontSize: 16 }}>
        {isConfirming ? 'Confirming Transaction...' : isConfirmed ? 'Transaction Confirmed!' : 'Mint Token'}
      </button>

      <p>{statusMessage}</p>
    </div>
  );
}
