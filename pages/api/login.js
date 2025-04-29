// Mock Login API - Always succeeds for demonstration

// Hilfsfunktion zur Behandlung von CORS
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*"); // In Produktion spezifischer sein
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
}

export default async function handler(req, res) {
  // CORS-Header setzen
  setCorsHeaders(res);

  // Behandlung von OPTIONS-Anfragen (für CORS-Preflight)
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Nur POST-Anfragen zulassen
  if (req.method !== "POST") {
    res.status(405).json({ message: "Methode nicht erlaubt" });
    return;
  }

  try {
    const { email, password } = req.body;

    // Einfache Überprüfung (optional, da es ein Mock ist)
    if (!email || !password) {
      res.status(400).json({ message: "E-Mail und Passwort sind erforderlich" });
      return;
    }

    // Dummy-Benutzerdaten erstellen
    const dummyUser = {
      id: "dummy-user-123",
      email: email,
      name: email.split("@")[0] || "Test User", // Name aus E-Mail ableiten
      role: email.includes("admin") ? "admin" : "staff", // Rolle basierend auf E-Mail (Beispiel)
    };

    // Dummy-Token erstellen (kein echtes JWT nötig für Mock)
    const dummyToken = "dummy-jwt-token-" + Date.now();

    // Erfolgreiche Anmeldung simulieren
    res.status(200).json({
      message: "Anmeldung erfolgreich (Mock)",
      token: dummyToken,
      user: dummyUser,
    });

  } catch (error) {
    console.error("Mock Login-Fehler:", error);
    res.status(500).json({ message: "Serverfehler bei der Mock-Anmeldung", error: error.message });
  }
}

