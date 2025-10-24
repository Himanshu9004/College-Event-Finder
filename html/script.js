// script.js (Poora Updated Code - Auth + Events)

document.addEventListener("DOMContentLoaded", function() {

  // --- 1. Event Dashboard Logic (Pehle se hai) ---
  const eventForm = document.getElementById("create-event-form");
  if (eventForm) {
    eventForm.addEventListener("submit", saveEvent);
  }

  const eventListContainer = document.getElementById("event-list-container");
  if (eventListContainer) {
    loadEvents();
  }

  // --- 2. NAYA: Auth Logic ---
  
  // Organization Register
  const orgRegisterForm = document.getElementById("org-register-form");
  if (orgRegisterForm) {
    orgRegisterForm.addEventListener("submit", registerOrg);
  }

  // Organization Login
  const orgLoginForm = document.getElementById("org-login-form");
  if (orgLoginForm) {
    orgLoginForm.addEventListener("submit", loginOrg);
  }

  // User Register
  const userRegisterForm = document.getElementById("user-register-form");
  if (userRegisterForm) {
    userRegisterForm.addEventListener("submit", registerUser);
  }

  // User Login
  const userLoginForm = document.getElementById("user-login-form");
  if (userLoginForm) {
    userLoginForm.addEventListener("submit", loginUser);
  }
});


// --- Event Functions (Pehle se hain) ---

async function saveEvent(event) {
  event.preventDefault();
  const newEvent = {
    name: document.getElementById("event-name").value,
    club: document.getElementById("club-name").value,
    eligible: document.getElementById("event-eligible").value,
    date: document.getElementById("event-date").value,
    description: document.getElementById("event-description").value,
    link: document.getElementById("event-link").value
  };

  try {
    const response = await fetch('http://127.0.0.1:5000/api/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) event.target.reset();
  } catch (error) {
    console.error('Error creating event:', error);
    alert('Error creating event. Make sure backend is running.');
  }
}

async function loadEvents() {
  const eventListContainer = document.getElementById("event-list-container");
  eventListContainer.innerHTML = '<h2>📅 Events Near You</h2>';
  try {
    const response = await fetch('http://127.0.0.1:5000/api/all-events');
    const events = await response.json();
    if (events.length === 0) {
      eventListContainer.innerHTML += '<p>No new events found.</p>';
      return;
    }
    events.forEach(function(event) {
      const eventCardHTML = `
        <div class="event-card">
          <h3>${event.name}</h3>
          <p><b>Organizer:</b> ${event.club}</p>
          <p><b>Eligible:</b> ${event.eligible}</p>
          <p><b>Date:</b> ${event.date}</p>
          <p><b>Description:</b> ${event.description}</p>
          <a href="${event.link}" target="_blank" class="btn">Register</a>
        </div>
      `;
      eventListContainer.innerHTML += eventCardHTML;
    });
  } catch (error) {
    console.error('Error loading events:', error);
    eventListContainer.innerHTML += '<p>Error loading events. Could not connect.</p>';
  }
}


// --- NAYE Auth Functions ---

async function registerOrg(event) {
  event.preventDefault();
  const data = {
    org_name: document.getElementById("org-name").value,
    email: document.getElementById("org-email").value,
    password: document.getElementById("org-password").value,
    college_name: document.getElementById("org-college").value
  };

  try {
    const response = await fetch('http://127.0.0.1:5000/api/org/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      window.location.href = 'org-login.html'; // Register karke login page par bhejo
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Registration failed.');
  }
}

async function loginOrg(event) {
  event.preventDefault();
  const data = {
    email: document.getElementById("org-login-email").value,
    password: document.getElementById("org-login-password").value
  };

  try {
    const response = await fetch('http://127.0.0.1:5000/api/org/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      // Login successful, dashboard par bhejo
      window.location.href = 'org-dashboard.html'; 
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Login failed.');
  }
}

async function registerUser(event) {
  event.preventDefault();
  const data = {
    username: document.getElementById("user-username").value,
    email: document.getElementById("user-email").value,
    password: document.getElementById("user-password").value
  };

  try {
    const response = await fetch('http://127.0.0.1:5000/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      window.location.href = 'user-login.html'; // Register karke login page par bhejo
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Registration failed.');
  }
}

async function loginUser(event) {
  event.preventDefault();
  const data = {
    email: document.getElementById("user-login-email").value,
    password: document.getElementById("user-login-password").value
  };

  try {
    const response = await fetch('http://127.0.0.1:5000/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      // Login successful, dashboard par bhejo
      window.location.href = 'user-dashboard.html';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Login failed.');
  }
}