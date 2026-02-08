import React, { useState } from 'react';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  // Placeholder: World ID login will be added here
  const handleLogin = () => {
    alert('World ID verification will be added here.');
    setLoggedIn(true);
  };

  return (
    <div style={styles.appContainer}>
      {!loggedIn ? (
        <WelcomeScreen onLogin={handleLogin} />
      ) : (
        <HomeScreen />
      )}
    </div>
  );
}

// --------------------
// Welcome / Login Screen
// --------------------
function WelcomeScreen({ onLogin }) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to KIND Circle</h1>
      <p style={styles.text}>
        Verify you’re a real human to spread kindness and earn $KIND.
      </p>
      <button style={styles.button} onClick={onLogin}>
        Verify with World ID
      </button>
    </div>
  );
}

// --------------------
// Home Screen (Placeholder)
// --------------------
function HomeScreen() {
  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 16 }}>KIND Circle</h2>
      <p>This is the Home Screen.</p>
      <p>KIND Tap and KIND Quest will appear here next.</p>
    </div>
  );
}

// --------------------
// Styles
// --------------------
const styles = {
  appContainer: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#FFF6E5',
    minHeight: '100vh',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
    color: '#222',
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    color: '#555',
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#FFB703',
    border: 'none',
    padding: '12px 26px',
    fontSize: 18,
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
  },
};
