import { useState } from "react";
import styles from "./Login_popup.module.css";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import type { ErrorResponse } from "react-router-dom";

interface LoginPopupProps {
  isRegister: () => void;
  onSuccess: () => void;
}

const Login_popup = ({ isRegister, onSuccess }: LoginPopupProps) => {
  const API_BASE_URL = "https://weather-app-za51.onrender.com";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const formData = {
    email: email,
    password: password,
  };
  const handleLogin = async () => {
    try {
      const url = `${API_BASE_URL}/auth/login`;
      const response = await axios.post(url, formData);
      const token = response.data.token;
      localStorage.setItem("authToken", token);
      window.dispatchEvent(new Event("storage-update"));
      if (token) onSuccess();
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      if (err.response && err.response?.status === 400) {
        toast.error("Invalid credentials");
      }
      setPassword("");
    }
  };
  return (
    <motion.div
      className={styles.login_container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className={styles.header}>
        <span className={styles.welcome_heading}>Welcome back</span>
        <span className={styles.instructions}>
          Please enter your details to sign in
        </span>
      </header>
      <main className={styles.main}>
        <label htmlFor="email" className={styles.email}>
          <span className={styles.input_head}>Email</span>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.pass} htmlFor="pass">
          <span className={styles.input_head}>Password</span>
          <input
            type="password"
            id="pass"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </label>
        <span className={styles.forgot_pass}>Forgot password?</span>
        <button onClick={handleLogin} className={styles.sign_in}>
          <span>Sign in</span>
        </button>
      </main>
      <footer>
        <span className={styles.footer_message}>Dont have a account?</span>
        <button className={styles.signup} onClick={() => isRegister()}>
          <span>Sign up</span>
        </button>
      </footer>
    </motion.div>
  );
};

export default Login_popup;
