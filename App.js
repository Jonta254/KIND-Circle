import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'kindCircleStreakData';
const KIND_BALANCE_KEY = 'kindCircleKindBalance';
const BOOST_COST = 5; // Cost in $KIND to activate Missed Tap Protection

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState('welcome'); // welcome, home, session, reward

  // Session states
  const [sessionActive, setSessionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [missedTaps, setMissedTaps] = useState(0);
  const [boostUsed, setBoostUsed] = useState(false);

  // Streak states
  const [streakCount, setStreakCount] = useState(0);
  const [lastSessionDate, setLastSessionDate] = useState(null);
  const [rewardBonus, setRewardBonus] = useState(0);

  // KIND balance
  const [kindBalance, setKindBalance] = useState(0);
  const [boostActive, setBoostActive] = useState(false);

  // Constants
  const SESSION_DURATION = 600; // seconds
  const PRESENCE_INTERVAL = 70; // seconds
  const MAX_MISSES = 2;
  const BASE_REWARD = 10; // base $KIND

  const presenceTimeout = useRef(null);

  // Load data from localStorage on login
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
        // Start with 50 KIND for testing
        setKindBalance(50);
        localStorage.setItem(KIND_BALANCE_KEY, '50');
      }
    }
  }, [loggedIn]);

  // Login handler (placeholder)
  const handleLogin = () => {
    alert('World ID verification will be added here.');
    setLoggedIn(true);
    setScreen('home');
  };

  // Activate boost on Home screen
  const activateBoost = () => {
    if (kindBalance >= BOOST_COST) {
      setKindBalance(kindBalance - BOOST_COST);
      setBoostActive(true);
      alert(`Missed Tap Protection boost activated! You can miss 1 tap without session ending.`);
      localStorage.setItem(KIND_BALANCE_KEY, (kindBalance - BOOST_COST).toString());
    } else {
      alert(`Not enough $KIND to activate boost. You need ${BOOST_COST} $KIND.`);
    }
  };

  // Start Kind Circle session
  const startSession = () => {
    setTimeLeft(SESSION_DURATION);
    setMissedTaps(0);
    setSessionActive(true);
    setScreen('session');
    setBoostUsed(false);
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
        let newMissed = missed + 1;

        if (boostActive && !boostUsed && newMissed === 1) {
          // Use boost to ignore first miss
          setBoostUsed(true);
          // Do NOT end session
          return missed; // keep same missed count
        }

        if (newMissed >= MAX_MISSES) {
          // End session if max misses reached
          endSession(false);
          return MAX_MISSES;
        }

        return newMissed;
      });
    }, PRESENCE_INTERVAL * 1000);
  };

  // End session with success or failure
  const endSession = (success) => {
    setSessionActive(false);
    clearTimeout(presenceTimeout.current);

    if (success) {
      updateStreak();
      // Add earned KIND to balance
      const earned = calculateReward();
      const newBalance = kindBalance + earned;
      setKindBalance(newBalance);
      localStorage.setItem(KIND_BALANCE_KEY, newBalance.toString());
    } else {
      // If session failed, no streak update and no reward
      setRewardBonus(0);
      setScreen('reward');
    }
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

  // Update streak logic
  const updateStreak = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = 1;
    let bonus = 0;

    if (lastSessionDate) {
      const lastDate = new Date(lastSessionDate);

      if (isSameDay(today, lastDate)) {
        // Already did session today, no change
        newStreak = streakCount;
      } else if (isSameDay(yesterday, lastDate)) {
        // Continued streak
        newStreak = streakCount + 1;
      }
    }

    // Calculate bonus by streak
    if (newStreak >= 7) bonus = 0.5; // +50%
    else if (newStreak >= 3) bonus = 0.2; // +20%
    else bonus = 0;

    setStreakCount(newStreak);
    setLastSessionDate(today.toISOString());
    setRewardBonus(bonus);
    setScreen('reward');

    // Save to localStorage
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        streakCount: newStreak,
        lastSessionDate: today.toISOString(),
      })
    );
  };

  // Date helper - check if two dates are same calendar day
  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Format time mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Calculate total reward including bonus
  const calculateReward = () => {
    return Math.floor(BASE_REWARD * (1 + rewardBonus));
  };

  // Screens rendering
  if (!loggedIn) {
    return <WelcomeScreen onLogin={handleLogin} />;
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        onStart={startSession}
        streakCount={streakCount}
        kindBalance={kindBalance}
        boostActive={boostActive}
        activateBoost={activateBoost}
      />
    );
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
        boostActive={boostActive}
        boostUsed={boostUsed}
      />
    );
  }

  if (screen === 'reward') {
    return (
      <RewardScreen
        onContinue={() => {
          setScreen('home');
          setRewardBonus(0);
          setBoostActive(false);
        }}
        reward={calculateReward()}
        streakCount={streakCount}
        kindBalance={kindBalance}
      />
    );
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
function HomeScreen({
  onStart,
  streakCount,
  kindBalance,
  boostActive,
  activateBoost,
}) {
  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 16 }}>KIND Circle</h2>
      <p style={{ marginBottom: 12 }}>
        Spend 10 minutes in the circle to earn kindness.
      </p>

      <button style={styles.button} onClick={onStart}>
        Enter the Circle
      </button>

      {streakCount > 0 && (
        <p style={{ marginTop: 16, color: '#555' }}>
          Your current streak: <strong>{streakCount} day{streakCount > 1 ? 's' : ''}</strong>
        </p>
      )}

      <p style={{ marginTop: 24, fontWeight: 'bold' }}>
        Your $KIND balance: {kindBalance}
      </p>

      {!boostActive && (
        <button style={styles.boostButton} onClick={activateBoost}>
          Activate Missed Tap Protection Boost ({BOOST_COST} $KIND)
        </button>
      )}

      {boostActive && (
        <p style={{ marginTop: 12, color: '#2a9d8f' }}>
          Boost active: You can miss 1 tap without penalty this session.
        </p>
      )}
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
  boostActive,
  boostUsed,
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
      <p
        style={{
          marginTop: 16,
          color:
            missedTaps >= maxMisses
              ? 'red'
              : boostActive && boostUsed && missedTaps === 1
              ? '#2a9d8f'
              : '#555',
        }}
      >
        Missed taps: {missedTaps} / {maxMisses}
        {boostActive && boostUsed && missedTaps === 1
          ? ' (Boost used — no penalty)'
          : ''}
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
function RewardScreen({ onContinue, reward, streakCount, kindBalance }) {
  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 16 }}>Session Complete!</h2>
      <p style={{ marginBottom: 12 }}>
        You earned <strong>{reward} $KIND 💛</strong> for spending time in the circle.
      </p>
      {streakCount > 1 && (
        <p style={{ marginBottom: 24, color: '#555' }}>
          Current streak bonus applied!
        </p>
      )}
      <p style={{ fontWeight: 'bold' }}>
        Your total $KIND balance: {kindBalance}
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
  boostButton: {
    backgroundColor: '#2a9d8f',
    border: 'none',
    padding: '12px 26px',
    fontSize: 16,
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
    marginTop: 16,
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
