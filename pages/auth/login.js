import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    // Überprüfen, ob bereits ein Token vorhanden ist
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/staff');
        }
      } catch (error) {
        console.error('Fehler beim Parsen der Benutzerdaten:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo(null);

    try {
      console.log('Sende Anmeldedaten:', formData);
      
      // Verwende die vollständige URL anstelle des relativen Pfads
      const baseUrl = window.location.origin;
      const response = await axios.post(`${baseUrl}/api/login`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Anmeldeantwort:', response.data);
      
      // Token im localStorage speichern
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Weiterleitung zur Hauptseite (Journal)
      router.push("/");
    } catch (error) {
      console.error('Login error:', error);
      
      // Detaillierte Fehlerinformationen anzeigen
      if (error.response) {
        // Der Server hat mit einem Statuscode außerhalb des Bereichs 2xx geantwortet
        setError(`Fehler ${error.response.status}: ${error.response.data?.message || 'Unbekannter Fehler'}`);
        setDebugInfo({
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // Die Anfrage wurde gestellt, aber keine Antwort erhalten
        setError('Keine Antwort vom Server erhalten. Bitte überprüfen Sie Ihre Internetverbindung.');
        setDebugInfo({
          request: 'Keine Antwort erhalten'
        });
      } else {
        // Beim Einrichten der Anfrage ist ein Fehler aufgetreten
        setError(`Anfragefehler: ${error.message}`);
        setDebugInfo({
          message: error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Anmelden | EasyLog</title>
        <meta name="description" content="Anmelden bei EasyLog" />
      </Head>

      <div className="row justify-content-center min-vh-100 align-items-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h1 className="h3">EasyLog</h1>
                <p className="text-muted">Bitte melden Sie sich an</p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">E-Mail</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Passwort</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Wird angemeldet...' : 'Anmelden'}
                  </button>
                </div>
              </form>
              
              {debugInfo && (
                <div className="mt-4">
                  <p className="text-muted small">Debug-Informationen:</p>
                  <pre className="small bg-light p-2" style={{ maxHeight: '150px', overflow: 'auto' }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
