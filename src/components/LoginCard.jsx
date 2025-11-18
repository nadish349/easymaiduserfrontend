import React from 'react';

const LoginCard = ({ onEmailLogin, onGoogleLogin }) => {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Welcome Back</h2>

      <input type="email" placeholder="Email" style={styles.input} />
      <input type="password" placeholder="Password" style={styles.input} />

      <button style={styles.loginBtn} onClick={onEmailLogin}>Login</button>

      <div style={styles.orDivider}>
        <span>OR</span>
      </div>

      <button style={styles.googleBtn} onClick={onGoogleLogin}>
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google icon"
          style={styles.icon}
        />
        Sign in with Google
      </button>

      <p style={styles.signupText}>
        Don’t have an account? <a href="/register">Create one</a>
      </p>
    </div>
  );
};

const styles = {
  container: {
    width: '360px',
    margin: '50px auto',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    fontFamily: 'sans-serif'
  },
  title: {
    marginBottom: '20px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '16px',
  },
  loginBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    fontSize: '16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
  orDivider: {
    margin: '20px 0',
    color: '#999',
    fontSize: '14px',
  },
  googleBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#ffffff',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  icon: {
    width: '20px',
    height: '20px',
  },
  signupText: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#777',
  }
};

export default LoginCard; 