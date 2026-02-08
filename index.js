import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState('welcome'); // welcome, home, session, reward

  // Session states
  const [sessionActive, setSessionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [missedTaps, setMissedTaps] = useState(0);

  // Constants
  const SESSION_DURATION = 600; // seconds
  const PRESENCE_INTERVAL = 70; // seconds
  const MAX_MISSES = 2;

  const presenceTimeout = useRef(null);

  // Login handler (placeholder)
  const handleLogin = () => {
    alert('World ID verification will be added here.');
    setLoggedIn(true);
    setScreen('home');
  };

  // Start Kind Circle session
  const startSession = () => {
    setTimeLeft(SESSION_DURATION);
    setMissedTaps(0);
    setSessionActive(true);
    setScreen('session');
  };

  // Handle presence tap
  const handlePresenceTap = () => {
    setMissedTaps(0); // reset misses on tap
    resetPresenceTimer();
  };

  // Reset presence check timer
  const resetPresenceTimer = () => {
    if (presenceTimeout.current) clearTimeout(presenceTimeout.current);
    presenceTimeout.current = setTimeout(() => {
      setMissedTaps((missed) => {
        if (missed + 1 >= MAX_MISSES) {
          // End session if max misses reached
          endSession(false);
          return MAX_MISSES;
        }
        return missed + 1;
      });
    }, PRESENCE_INTERVAL * 1000);
  };

  // End session with success or failure
  const endSession = (success) => {
    setSessionActive(false);
    clearTimeout(presenceTimeout.current);
    setScreen('reward');
    // Here you can add reward logic based on success or failure
  };

  // Timer effect
  useEffect(() => {
    if (!sessionActive) return;

    if (timeLeft <= 0) {
      endSession(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionActive, timeLeft]);

  // Start presence timer on session start
  useEffect(() => {
    if (sessionActive) resetPresenceTimer();
    return () => clearTimeout(presenceTimeout.current);
  }, [sessionActive]);

  // Format time mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Screens rendering
  if (!loggedIn) {
    return <WelcomeScreen onLogin={handleLogin} />;
  }

  if (screen === 'home') {
    return <HomeScreen onStart={startSession} />;
  }

  if (screen === 'session') {
    return (
      <SessionScreen
        timeLeft={timeLeft}
        formatTime={formatTime}
        onPresenceTap={handlePresenceTap}
        missedTaps={missedTaps}
        maxMisses={MAX_MISSES}
        onQuit={() => endSession(false)}
      />
    );
  }

  if (screen === 'reward') {
    return <RewardScreen onContinue={() => setScreen('home')} />;
  }

  return null;
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
// Home Screen
// --------------------
function HomeScreen({ onStart }) {
  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 16 }}>KIND Circle</h2>
      <p style={{ marginBottom: 24 }}>
        Spend 10 minutes in the circle to earn kindness.
      </p>
      <button style={styles.button} onClick={onStart}>
        Enter the Circle
      </button>
    </div>
  );
}

// --------------------
// Session Screen
// --------------------
function SessionScreen({
  timeLeft,
  formatTime,
  onPresenceTap,
  missedTaps,
  maxMisses,
  onQuit,
}) {
  const progressPercent = ((600 - timeLeft) / 600) * 100;

  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 12 }}>Kind Circle Session</h2>
      <p style={{ marginBottom: 12 }}>Time Left: {formatTime(timeLeft)}</p>

      {/* Progress ring */}
      <div style={styles.progressRingContainer}>
        <svg width="150" height="150" viewBox="0 0 120 120">
          <circle
            stroke="#FFD166"
            fill="transparent"
            strokeWidth="10"
            r="54"
            cx="60"
            cy="60"
          />
          <circle
            stroke="#FFB703"
            fill="transparent"
            strokeWidth="10"
            r="54"
            cx="60"
            cy="60"
            strokeDasharray={339.292}
            strokeDashoffset={339.292 - (339.292 * progressPercent) / 100}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      </div>

      {/* Presence tap prompt */}
      <p style={{ marginTop: 24 }}>
        Tap below every ~70 seconds to stay present.
      </p>
      <button style={styles.presenceButton} onClick={onPresenceTap}>
        I'm here 💛
      </button>

      {/* Missed taps warning */}
      <p style={{ marginTop: 16, color: missedTaps >= maxMisses ? 'red' : '#555' }}>
        Missed taps: {missedTaps} / {maxMisses}
      </p>

      <button style={styles.quitButton} onClick={onQuit}>
        Quit Session
      </button>
    </div>
  );
}

// --------------------
// Reward Screen
// --------------------
function RewardScreen({ onContinue }) {
  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 16 }}>Session Complete!</h2>
      <p style={{ marginBottom: 24 }}>
        You earned <strong>$KIND 💛</strong> for spending time in the circle.
      </p>
      <button style={styles.button} onClick={onContinue}>
        Back to Home
      </button>
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
    marginTop: 12,
  },
  presenceButton: {
    backgroundColor: '#FFD166',
    border: 'none',
    padding: '14px 28px',
    fontSize: 18,
    borderRadius: 10,
    color: '#333',
    cursor: 'pointer',
  },
  quitButton: {
    marginTop: 30,
    backgroundColor: '#e63946',
    border: 'none',
    padding: '10px 24px',
    fontSize: 16,
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
  },
  progressRingContainer: {
    marginTop: 20,
  },
};
