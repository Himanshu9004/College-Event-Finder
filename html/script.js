// --- Global variable for event search ---
let allEvents = []; 

/*
  DOMContentLoaded event listener
  NAYA: Ab yeh animation ko bhi trigger karega
*/
document.addEventListener("DOMContentLoaded", function () {
  
  // === NAYA: ANIMATION LOGIC ===
  // Sabhi elements ko select karo jinhe fade-in karna hai
  const animatedElements = document.querySelectorAll('.container, .card-dark, .event-card, .auth-container, .stat-card');
  
  // Intersection Observer ka istemaal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Element dikhne par 'visible' class add karo (CSS handle karega)
        // 'visible' class ke liye style.css mein @keyframes add kar diya hai
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target); // Animate hone ke baad observe karna band karo
      }
    });
  }, {
    threshold: 0.1 // 10% dikhne par trigger ho
  });

  // Har element ko observe karo
  animatedElements.forEach(el => {
    observer.observe(el);
  });


  // === PAGE ROUTER (Pehle jaisa) ===

  // --- Org Dashboard/Profile Logic ---
  const eventForm = document.getElementById("create-event-form");
  if (eventForm) {
    eventForm.addEventListener("submit", saveEvent);
  }
  const orgProfileInfo = document.getElementById("org-profile-info");
  if (orgProfileInfo) {
    loadOrgProfile(); 
  }
  const myEventsList = document.getElementById("my-events-list");
  if (myEventsList) {
    loadMyEvents(); 
  }

  // --- User Dashboard Logic ---
  const eventListContainer = document.getElementById("event-list-container");
  if (eventListContainer) {
    loadEvents(); 
  }
  const searchBar = document.getElementById("search-bar");
  if (searchBar) {
    searchBar.addEventListener("keyup", handleSearch); 
  }

  // --- User Profile Page Logic ---
  const profileInfo = document.getElementById("profile-info");
  if (profileInfo) {
    loadUserProfile(); 
  }

  // --- Admin Dashboard Logic ---
  const totalUsersEl = document.getElementById("total-users");
  if (totalUsersEl) {
    loadAdminStats(); 
  }
  const listOrgsBtn = document.getElementById("list-orgs-btn");
  if (listOrgsBtn) {
    listOrgsBtn.addEventListener("click", listOrganizations); 
  }

  // --- Auth Forms Logic ---
  // (Pehle jaisa hi poora code)
  const orgRegisterForm = document.getElementById("org-register-form");
  if (orgRegisterForm) {
    orgRegisterForm.addEventListener("submit", registerOrg);
  }
  const orgLoginForm = document.getElementById("org-login-form");
  if (orgLoginForm) {
    orgLoginForm.addEventListener("submit", loginOrg);
  }
  const userRegisterForm = document.getElementById("user-register-form");
  if (userRegisterForm) {
    userRegisterForm.addEventListener("submit", registerUser);
  }
  const userLoginForm = document.getElementById("user-login-form");
  if (userLoginForm) {
    userLoginForm.addEventListener("submit", loginUser);
  }
  const adminLoginForm = document.getElementById("admin-login-form");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", loginAdmin);
  }
  
  // --- Global Logout Button ---
  const logoutBtns = document.querySelectorAll("#logout-btn");
  logoutBtns.forEach(btn => {
      btn.addEventListener("click", logout);
  });
});

// =========================================================================
// --- SECTION 1: USER DASHBOARD (Events, Search, Register) ---
// =========================================================================

/**
 * Saare events ko backend se fetch karta hai aur 'allEvents' global variable me store karta hai.
 */
async function loadEvents() {
  const eventListContainer = document.getElementById("event-list-container");
  if (!eventListContainer) return;

  eventListContainer.innerHTML = "<p>Loading events...</p>";
  try {
    const response = await fetch("https://college-event-finder-2.onrender.com");
    allEvents = await response.json(); 
    
    if (allEvents.length === 0) {
      eventListContainer.innerHTML = "<p>No new events found.</p>";
      return;
    }
    renderEvents(allEvents); // Saare events dikhao
  } catch (error) {
    console.error("Error loading events:", error);
    eventListContainer.innerHTML = "<p>Error loading events.</p>";
  }
}

/**
 * Search bar me type karte hi yeh function chalta hai.
 */
function handleSearch() {
  const searchTerm = document.getElementById("search-bar").value.toLowerCase();
  
  const filteredEvents = allEvents.filter(event => {
    const eventName = event.name.toLowerCase();
    const clubName = event.club.toLowerCase();
    return eventName.includes(searchTerm) || clubName.includes(searchTerm);
  });
  
  renderEvents(filteredEvents); 
}

/**
 * Diye gaye events array ko HTML card me badal kar page par dikhata hai.
 * NAYA: Ab yeh AI description bhi fetch karega.
 */
function renderEvents(eventsToRender, containerId = "event-list-container") {
  const eventListContainer = document.getElementById(containerId);
  eventListContainer.innerHTML = ""; 
  
  if (eventsToRender.length === 0) {
      eventListContainer.innerHTML = "<p>No events match your search.</p>";
      return;
  }
  
  eventsToRender.forEach(function (event) {
    const googleFormLink = event.link ? `'${event.link}'` : 'null';
    
    const eventCardHTML = `
      <div class="event-card" id="event-card-${event.id}"> <h3>${event.name}</h3>
        <p><b>Organizer:</b> ${event.club}</p>
        <p><b>Eligible:</b> ${event.eligible}</p>
        <p><b>Date:</b> ${event.date}</p>
        
        <p><b>Description:</b> 
          <span id="event-desc-${event.id}">Loading personalized details...</span>
        </p>
        
        <button class="btn" onclick="registerAndOpenLink(${event.id}, ${googleFormLink})">
          Register
        </button>
      </div>
    `;
    eventListContainer.innerHTML += eventCardHTML;

    // NAYA: Event render hone ke baad AI description fetch karo
    fetchPersonalizedDescription(event);
  });
}

/**
 * NAYA: AI se personalized description fetch karta hai.
 * Agar fail hota hai (jaise user login nahi hai), toh original description dikhata hai.
 */
async function fetchPersonalizedDescription(event) {
  const descElement = document.getElementById(`event-desc-${event.id}`);
  if (!descElement) return; // Agar element na mile

  try {
    const response = await fetch(`http://127.0.0.1:5000/api/user/generate-event-view/${event.id}`, {
      method: 'GET',
      credentials: 'include' // Session cookie bhejega
    });

    if (!response.ok) {
      // Agar user logged in nahi hai ya API fail hota hai, toh error throw karo
      throw new Error('Not logged in or AI error');
    }
    
    const data = await response.json();
    descElement.textContent = data.ai_description; // Naya AI description

  } catch (error) {
    // Fail hone par, original description dikha do
    console.warn('Could not fetch AI description, falling back to original.');
    descElement.textContent = event.description; // Fallback
  }
}


/**
 * 'Register' button click hone par yeh function chalta hai.
 * (Yeh function pehle jaisa hi hai)
 */
async function registerAndOpenLink(eventId, googleFormLink) {
  // ... (Poora ka poora registerAndOpenLink function yahaan copy-paste karein) ...
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/user/register-event/${eventId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include' 
    });

    const result = await response.json();
    
    if (response.status === 401) {
       alert("You must be logged in to register. Redirecting to login page.");
       window.location.href = "user-login.html";
       return;
    }
    
    if (googleFormLink) {
      window.open(googleFormLink, '_blank'); 
    } else {
      if (result.message === 'Already registered for this event') {
           alert("You are already registered for this event.");
      } else {
           alert("Registered internally! (No external form provided by organizer).");
      }
    }

  } catch (error) {
    console.error("Error registering for event:", error);
    alert("Registration failed.");
  }
}

// =========================================================================
// --- SECTION 2, 3, 4, 5 (User Profile, Org, Admin, Auth) ---
// =========================================================================

/*
  IMPORTANT:
  Neeche ka poora code (loadUserProfile se lekar logout tak)
  aapki original script.js file se BILKUL SAME hai.
  Usme koi change nahi hai.
  Bas poora copy-paste kar dein.
*/

// ... (loadUserProfile function yahaan se copy karein) ...
// ... (saveEvent function yahaan se copy karein) ...
// ... (loadMyEvents function yahaan se copy karein) ...
// ... (deleteEvent function yahaan se copy karein) ...
// ... (loadOrgProfile function yahaan se copy karein) ...
// ... (loginAdmin function yahaan se copy karein) ...
// ... (loadAdminStats function yahaan se copy karein) ...
// ... (listOrganizations function yahaan se copy karein) ...
// ... (registerOrg function yahaan se copy karein) ...
// ... (loginOrg function yahaan se copy karein) ...
// ... (registerUser function yahaan se copy karein) ...
// ... (loginUser function yahaan se copy karein) ...
// ... (logout function yahaan se copy karein) ...


// PASTE CODE YAHAAAN:

async function loadUserProfile() {
  const profileInfo = document.getElementById("profile-info");
  const profileRanking = document.getElementById("profile-ranking");
  const profileEventsList = document.getElementById("profile-events-list");

  if (!profileInfo || !profileRanking || !profileEventsList) {
      console.log("Profile elements not found, skipping loadUserProfile.");
      return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/api/user/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include'
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      window.location.href = "user-login.html";
      return;
    }

    const data = await response.json();

    profileInfo.innerHTML = `
      <p><strong>Username:</strong> ${data.user_info.username}</p>
      <p><strong>Email:</strong> ${data.user_info.email}</p>
      <p><strong>Profile Type:</strong> ${data.user_info.user_type}</p>
      <p><strong>Institution:</strong> ${data.user_info.institution}</p>
    `;

    profileRanking.innerHTML = `
      <p><strong>Total Events Registered:</strong> ${data.stats.total_events}</p>
      <p><strong>Your Institution Rank (${data.user_info.institution}):</strong> 
         ${data.stats.institution_rank} / ${data.stats.total_in_institution}
      </p>
      <p><strong>Overall Rank (All Users):</strong> 
         ${data.stats.overall_rank} / ${data.stats.total_users}
      </p>
    `;

    if (data.registered_events.length === 0) {
      profileEventsList.innerHTML = "<p>You have not registered for any events yet.</p>";
    } else {
      profileEventsList.innerHTML = ""; 
      data.registered_events.forEach(event => {
        profileEventsList.innerHTML += `
          <div class="event-card-org">
            <div>
              <h3>${event.name}</h3>
              <p><b>Date:</b> ${event.date} | <b>Club:</b> ${event.club}</p>
            </div>
          </div>
        `;
      });
    }

  } catch (error) {
    console.error("Error loading profile data:", error);
    profileInfo.innerHTML = "<p>Error loading profile. Please try again.</p>";
    profileRanking.innerHTML = "<p>Error loading ranking.</p>";
    profileEventsList.innerHTML = "<p>Error loading registered events.</p>";
  }
}

async function saveEvent(event) {
  event.preventDefault(); 
  
  const newEvent = {
    name: document.getElementById("event-name").value,
    club: document.getElementById("club-name").value,
    eligible: document.getElementById("event-eligible").value,
    date: document.getElementById("event-date").value,
    description: document.getElementById("event-description").value,
    link: document.getElementById("event-link").value,
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/api/create-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
      credentials: 'include' 
    });
    const result = await response.json();
    alert(result.message || result.msg); 
    if (response.ok) {
      event.target.reset(); 
      loadMyEvents(); 
    } else if (response.status === 401) {
      window.location.href = "org-login.html"; 
    }
  } catch (error) {
    console.error("Error creating event:", error);
  }
}

async function loadMyEvents() {
  const myEventsList = document.getElementById("my-events-list");
  if (!myEventsList) return;
  myEventsList.innerHTML = "<p>Loading your events...</p>";

  try {
    const response = await fetch("http://127.0.0.1:5000/api/org/my-events", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include'
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      window.location.href = "org-login.html";
      return;
    }

    const events = await response.json();
    if (events.length === 0) {
      myEventsList.innerHTML = "<p>You have not created any active events yet.</p>";
      return;
    }

    myEventsList.innerHTML = "";
    events.forEach(function (event) {
      const eventCardHTML = `
        <div class="event-card-org" style="display: flex; justify-content: space-between; align-items: center; background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
          <div>
            <h3>${event.name}</h3>
            <p><b>Date:</b> ${event.date} | <b>Club:</b> ${event.club}</p>
            <p><b>Link:</b> <a href="${event.link}" target="_blank" style="color: #00eaff;">${event.link}</a></p>
          </div>
          <button class="btn btn-delete" onclick="deleteEvent(${event.id})">Delete</button>
        </div>
      `;
      myEventsList.innerHTML += eventCardHTML;
    });
  } catch (error) {
    console.error("Error loading my events:", error);
    myEventsList.innerHTML = "<p>Error loading events.</p>";
  }
}

async function deleteEvent(eventId) {
  if (!confirm("Are you sure you want to delete this event?")) {
    return;
  }
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/org/delete-event/${eventId}`, {
      method: "DELETE",
      credentials: 'include'
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      loadMyEvents(); 
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    alert("Error deleting event.");
  }
}

async function loadOrgProfile() {
  const profileInfo = document.getElementById("org-profile-info");
  const orgNameElement = document.getElementById("org-name-display");
  if (!profileInfo) return; 

  try {
    const response = await fetch("http://127.0.0.1:5000/api/org/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include'
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      window.location.href = "org-login.html";
      return;
    }
    const data = await response.json();
    
    if (orgNameElement) {
        orgNameElement.textContent = data.org_info.name;
    }
    profileInfo.innerHTML = `
      <p><strong>Organization Name:</strong> ${data.org_info.name}</p>
      <p><strong>Email:</strong> ${data.org_info.email}</p>
      <p><strong>College:</strong> ${data.org_info.college}</p>
    `;
    
  } catch (error) {
    console.error("Error loading org profile:", error);
    profileInfo.innerHTML = "<p>Error loading profile.</p>";
  }
}

async function loginAdmin(event) {
  event.preventDefault();
  const data = {
    email: document.getElementById("admin-login-email").value,
    password: document.getElementById("admin-login-password").value,
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      window.location.href = "admin-dashboard.html";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Admin Login failed.");
  }
}

async function loadAdminStats() {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/admin/stats", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include'
    });

    if (response.status === 401) {
      alert("Admin session expired. Please login again.");
      window.location.href = "admin-login.html";
      return;
    }
    
    const data = await response.json();
    document.getElementById("total-users").textContent = data.total_users;
    document.getElementById("total-orgs").textContent = data.total_organizations;

  } catch (error) {
    console.error("Error loading admin stats:", error);
  }
}

async function listOrganizations() {
  const listContainer = document.getElementById("org-list-container");
  listContainer.innerHTML = "<p>Loading organizations...</p>";
  
  try {
    const response = await fetch("http://127.0.0.1:5000/api/admin/organizations", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: 'include'
    });

    if (response.status === 401) {
      alert("Admin session expired. Please login again.");
      window.location.href = "admin-login.html";
      return;
    }
    
    const orgs = await response.json();
    
    if (orgs.length === 0) {
      listContainer.innerHTML = "<p>No organizations registered yet.</p>";
      return;
    }

    listContainer.innerHTML = "<h4>All Registered Organizations:</h4>";
    orgs.forEach(org => {
      listContainer.innerHTML += `
        <div class="org-list-item">
          <strong>${org.name}</strong> (${org.college})<br>
          <small>${org.email}</small>
        </div>
      `;
    });

  } catch (error) {
    console.error("Error loading organizations:", error);
    listContainer.innerHTML = "<p>Error loading list.</p>";
  }
}

async function registerOrg(event) {
  event.preventDefault();
  const data = {
    org_name: document.getElementById("org-name").value,
    email: document.getElementById("org-email").value,
    password: document.getElementById("org-password").value,
    college_name: document.getElementById("org-college").value,
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/api/org/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      window.location.href = "org-login.html";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Registration failed.");
  }
}

async function loginOrg(event) {
  event.preventDefault();
  const data = {
    email: document.getElementById("org-login-email").value,
    password: document.getElementById("org-login-password").value,
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/api/org/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      window.location.href = "org-profile.html";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Login failed.");
  }
}

async function registerUser(event) {
  event.preventDefault();
  const data = {
    username: document.getElementById("user-username").value,
    email: document.getElementById("user-email").value,
    password: document.getElementById("user-password").value,
    user_type: document.getElementById("user-type").value,
    institution: document.getElementById("user-institution").value
  };

  if (!data.user_type || !data.institution) {
    alert("Please fill out all fields, including profile type and institution.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok) {
      window.location.href = "user-login.html";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Registration failed.");
  }
}

async function loginUser(event) {
  event.preventDefault();
  const data = {
    email: document.getElementById("user-login-email").value,
    password: document.getElementById("user-login-password").value,
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      window.location.href = "user-dashboard.html"; 
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Login failed.");
  }
}

async function logout(event) {
  event.preventDefault(); 
  
  try {
    const response = await fetch("http://127.0.0.1:5000/api/logout", {
      method: "POST",
      credentials: 'include' 
    });
    const result = await response.json();
    alert(result.message);
    window.location.href = "index.html"; 
  } catch (error) {
    console.error("Error logging out:", error);
    alert("Logout failed.");
  }
}
