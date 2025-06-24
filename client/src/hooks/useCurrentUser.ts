import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("TOKEN:", token);
    if (!token) {
      setLoading(false);
      return;
    }
    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log("API /me response:", data);
        setUser(data.user);
        setLoading(false);
      })
      .catch((err) => {
        console.log("API /me error:", err);
        setLoading(false);
      });
  }, []);

  return { user, loading };
}
