import { useState } from "react";
import styles from "./Register_popup.module.css";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import type { ErrorResponse } from "react-router-dom";

interface RegisterPopupProps {
  isLogin: () => void;
}

const Register_popup = ({ isLogin }: RegisterPopupProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const API_BASE_URL = "https://weather-app-za51.onrender.com";

  const formData = {
    username: username,
    email: email,
    password: password,
  };

  const handleRegistration = async () => {
    const url = `${API_BASE_URL}/auth/register`;
    try {
      const response = await axios.post(url, formData);
      if (response.status === 200 || response.status === 201) {
        toast.success("User registered successfully");
        console.log("User registered");
      }
      isLogin();
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>
      if (err.response && err.response.status === 400) {
        console.log("User already registered");
      } else {
        console.error("Server error", err.message);
      }
      toast.error("Invalid credentials");
    }
  };
  return (
    <motion.div
      className={styles.register_container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className={styles.header}>
        <span className={styles.welcome_heading}>Create a account</span>
        <span className={styles.instructions}>Join us to get started</span>
      </header>
      <main className={styles.main}>
        <label htmlFor="username">
          <span className={styles.user_name}>User Name</span>
          <input
            type="text"
            id="username"
            placeholder="john doe"
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
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
            type="text"
            id="pass"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <span className={styles.forgot_pass}>Forgot password?</span>
        <button className={styles.sign_in} onClick={handleRegistration}>
          <span>Sign up</span>
        </button>
      </main>
      <footer>
        <span className={styles.footer_message}>Already have a account?</span>
        <button className={styles.signin} onClick={() => isLogin()}>
          <span>Sign In</span>
        </button>
      </footer>
    </motion.div>
  );
};

export default Register_popup;
