import { useEffect } from 'react';
import { useRouter } from 'next/router';

// This page just redirects to the login page if not logged in,
// or potentially to a default client journal page if logged in.
// For now, it will primarily handle the initial load.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login");
    } else {
      // Redirect to the default client page if logged in
      router.replace("/journal/Default");
    }
  }, [router]);

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div>
        <h1>EasyLog</h1>
        <p>Wird geladen...</p>
        {/* Or redirect immediately */}
      </div>
    </div>
  );
}

