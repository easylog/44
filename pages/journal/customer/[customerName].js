import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Check for SpeechRecognition API compatibility
const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

// Helper function to get clients from localStorage
const getCustomersFromStorage = () => {
  if (typeof window === "undefined") return [];
  const customers = localStorage.getItem("journalCustomers"); // Neuer Key
  return customers ? JSON.parse(customers) : ["DefaultCustomer"]; // Default-Kunde
};

// Helper function to save clients to localStorage
const saveCustomersToStorage = (customers) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("journalCustomers", JSON.stringify(customers)); // Neuer Key
};

export default function CustomerJournalPage() {
  const router = useRouter();
  const { customerName } = router.query; // Get clientName from URL

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [journalEntries, setJournalEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [gptSuggestion, setGptSuggestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);
  const recognitionRef = useRef(null);
  const [clients, setClients] = useState(() => getClientsFromStorage()); // Behalten für Sidebar
  const [customers, setCustomers] = useState(() => getCustomersFromStorage()); // Neu für Kunden
  // Initialize Speech Recognition
  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API wird von diesem Browser nicht unterstützt.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNewEntry(prevEntry => prevEntry ? prevEntry + ' ' + transcript : transcript);
      setRecognitionError(null);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setRecognitionError(`Spracherkennungsfehler: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

  }, []);

  // Load clients and check auth on mount and when clientName changes
  useEffect(() => {
    setLoading(true);
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/auth/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      const loadedClients = getClientsFromStorage();
      setClients(loadedClients);

      // If the current clientName is not in the list, redirect to Default
      if (clientName && !loadedClients.includes(clientName)) {
        console.warn(`Klient "${clientName}" nicht gefunden, leite zu Default um.`);
        router.replace('/journal/Default');
        return; // Prevent further execution for this render
      }

      // Load client-specific entries from localStorage
      const clientEntriesKey = `journalEntries_${clientName}`;
      const clientEntries = localStorage.getItem(clientEntriesKey);
      setJournalEntries(clientEntries ? JSON.parse(clientEntries) : []);

      // Mock loading delay (can be removed if not needed)
      setTimeout(() => {
        setLoading(false);
      }, 100); // Reduced delay

    } catch (error) {
      console.error('Fehler beim Laden des Benutzerprofils oder der Klienten:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
    }

  }, [router, clientName]); // Re-run when clientName changes

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Optionally clear client data too
    // localStorage.removeItem('journalClients');
    router.push('/auth/login');
  };

  const handleNewEntryChange = (e) => {
    setNewEntry(e.target.value);
    // Mock GPT suggestions (can be removed or kept)
    if (e.target.value.length > 10) {
      setTimeout(() => {
        setGptSuggestion(
          e.target.value.includes('Server') 
            ? 'Möchten Sie Details zu den Server-Spezifikationen oder durchgeführten Updates hinzufügen?'
            : e.target.value.includes('Kunde') 
              ? 'Vergessen Sie nicht, relevante Kontaktpersonen und Ticketnummern zu erwähnen.'
              : 'Tipp: Fügen Sie konkrete Zeitangaben und beteiligte Personen hinzu, um den Eintrag nachvollziehbarer zu machen.'
        );
      }, 300);
    } else {
      setGptSuggestion('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newEntry.trim() || !clientName) return;

    const newJournalEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('de-DE'),
      author: user?.name || 'Benutzer',
      content: newEntry
    };

    // Save client-specific entries to localStorage
    const clientEntriesKey = `journalEntries_${clientName}`;
    const updatedEntries = [newJournalEntry, ...journalEntries];
    setJournalEntries(updatedEntries);
    localStorage.setItem(clientEntriesKey, JSON.stringify(updatedEntries));

    setNewEntry('');
    setGptSuggestion('');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setRecognitionError(null);
      } catch (err) {
        console.error("Fehler beim Starten der Spracherkennung:", err);
        setRecognitionError("Spracherkennung konnte nicht gestartet werden.");
        setIsListening(false);
      }
    }
  };

  const handleAddCustomer = (newCustomerName) => {
  if (newCustomerName && !customers.includes(newCustomerName)) {
    const updatedCustomers = [...customers, newCustomerName];
    setCustomers(updatedCustomers);
    saveCustomersToStorage(updatedCustomers);
      saveClientsToStorage(updatedClients);
      // Optionally navigate to the new client's page
      // router.push(`/journal/${newClientName}`);
    }
  };

  const handleAddCustomer = (newCustomerName) => {
  if (newCustomerName && !customers.includes(newCustomerName)) {
    const updatedCustomers = [...customers, newCustomerName];
    setCustomers(updatedCustomers);
    saveCustomersToStorage(updatedCustomers);
  }
};
const handleDeleteCustomer = (customerToDelete) => {
  if (customerToDelete === "DefaultCustomer") { // Sicherstellen, dass Default nicht gelöscht wird
    alert("Der Default-Kunde kann nicht gelöscht werden.");
    return;
  }
  if (window.confirm(`Möchten Sie den Kunden \"${customerToDelete}\" wirklich löschen? ...`)) {
    const updatedCustomers = customers.filter(cust => cust !== customerToDelete);
    setCustomers(updatedCustomers);
    saveCustomersToStorage(updatedCustomers);
    localStorage.removeItem(`journalEntries_customer_${customerToDelete}`); // Kunden-Key
    if (customerName === customerToDelete) {
      router.push("/journal/customer/DefaultCustomer"); // Zu Default-Kunde umleiten
    }
  }
};

  if (!clientName || loading) { // Show loading if clientName isn't available yet or data is loading
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Wird geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <Head>
        <title>Journal: {clientName} | EasyLog</title>
        <meta name="description" content={`Journal für Klient ${clientName} | EasyLog`} />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" />
      </Head>

      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 d-md-block sidebar collapse bg-dark">
          <div className="position-sticky pt-3" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="px-3 py-4 text-white">
              <h5>EasyLog</h5>
              <p className="mb-0">{user?.role === 'admin' ? 'Admin' : 'Mitarbeiter'}</p>
            </div>
            <hr className="text-white" />
            
            {/* Client List */}
            <div className="px-3 text-white mb-2">
              <h6>Klienten</h6>
              {/* Client Creation Form */}
              <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  const newClientInput = e.target.elements.newClient;
                  const newClientName = newClientInput.value.trim();
                  if (newClientName) { // Basic validation: ensure not empty
                    handleAddClient(newClientName); 
                    newClientInput.value = ''; // Clear input after adding
                  } else {
                    alert("Klientenname darf nicht leer sein.");
                  }
                }} className="mb-2">
                <div className="input-group input-group-sm">
                  <input type="text" name="newClient" className="form-control form-control-sm" placeholder="Neuer Klient..." required />
                  <button className="btn btn-secondary btn-sm" type="submit" title="Klient hinzufügen"><i className="bi bi-plus-lg"></i></button>
                </div>
              </form> 
            </div>
            <ul className="nav flex-column mb-auto" style={{ overflowY: 'auto' }}>
              {clients.map(client => (
                <li className="nav-item d-flex align-items-center" key={client}>
                  <Link 
                    href={`/journal/${encodeURIComponent(client)}`} 
                    className={`nav-link sidebar-link px-3 py-2 flex-grow-1 ${client === clientName ? 'active' : ''}`}
                  >
                    <i className="bi bi-person me-2"></i>
                    {client}
                  </Link>
                  {client !== "Default" && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); // Prevent link navigation
                        handleDeleteClient(client); 
                      }}
                      className="btn btn-sm btn-danger ms-auto me-2 py-0 px-1 lh-1"
                      title={`Klient "${client}" löschen`}
                      style={{ fontSize: '0.7rem' }} // Make button smaller
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            
            {/* Separator */}
            <hr className="text-white mt-auto"/>

            {/* Static Links & Logout */}
            <ul className="nav flex-column pb-2">
              <li className="nav-item">
                <span className="nav-link sidebar-link px-3 py-2 text-secondary">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link sidebar-link px-3 py-2 text-secondary">
                  <i className="bi bi-kanban me-2"></i>
                  ChangeBoard
                </span>
              </li>
              <li className="nav-item mt-2">
                <button onClick={handleLogout} className="nav-link sidebar-link px-3 py-2 text-danger border-0 bg-transparent w-100 text-start">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Abmelden
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Hauptinhalt */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Journal für: {clientName}</h1>
          </div>

          {/* Neuer Journal-Eintrag */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">Neuer Eintrag für {clientName}</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3 position-relative">
                      <textarea 
                        className="form-control" 
                        rows="4" 
                        placeholder={`Aktivitäten für ${clientName} beschreiben... (oder Spracheingabe nutzen)`}
                        value={newEntry}
                        onChange={handleNewEntryChange}
                        required
                      ></textarea>
                      {SpeechRecognition && (
                        <button 
                          type="button" 
                          onClick={toggleListening} 
                          className={`btn btn-sm position-absolute top-0 end-0 mt-2 me-2 ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                          title={isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
                        >
                          <i className={`bi ${isListening ? 'bi-mic-mute-fill' : 'bi-mic-fill'}`}></i>
                        </button>
                      )}
                    </div>
                    
                    {isListening && (
                      <div className="alert alert-primary" role="alert">
                        <i className="bi bi-mic me-2"></i> Zuhören...
                      </div>
                    )}

                    {recognitionError && (
                      <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i> {recognitionError}
                      </div>
                    )}
                    
                    {gptSuggestion && (
                      <div className="alert alert-info" role="alert">
                        <i className="bi bi-robot me-2"></i>
                        <strong>GPT-Vorschlag:</strong> {gptSuggestion}
                      </div>
                    )}
                    
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-plus-circle me-2"></i>
                      Eintrag hinzufügen
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Journal-Einträge */}
          <div className="row">
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Einträge für {clientName}</h5>
                </div>
                <div className="card-body">
                  {journalEntries.length === 0 ? (
                    <p className="text-center text-muted my-5">Keine Journal-Einträge für {clientName} vorhanden.</p>
                  ) : (
                    journalEntries.map(entry => (
                      <div key={entry.id} className="journal-entry mb-4 pb-3 border-bottom">
                        <div className="d-flex justify-content-between mb-2">
                          <h6 className="fw-bold">{entry.author}</h6>
                          <span className="text-muted small">{entry.date}</span>
                        </div>
                        <p className="mb-0">{entry.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-5 d-flex justify-content-between">
            <span>Copyright © 2025 EasyLog</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
