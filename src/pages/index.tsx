import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import { FormEvent, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { withSSRGuest } from "../utils/withSSRGuest";

export default function Home() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const data = { email, password };

    await signIn(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Entrar</button>
    </form>
  );
}

export const getServerSideProps: GetServerSideProps = withSSRGuest(
  async (ctx) => {
    return {
      props: {},
    };
  }
);
