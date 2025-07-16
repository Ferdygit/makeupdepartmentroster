document.addEventListener('DOMContentLoaded', () => {
    // Main UI Elements
    const dateInput = document.getElementById('rosterDate');
    const dailyRosterContent = document.getElementById('dailyRosterContent');
    const selectedDateHeader = document.getElementById('selectedDateHeader');
    const noRosterMessage = document.getElementById('noRosterMessage');
    const artistsContainer = document.getElementById('artistsContainer');

    // Admin Panel Elements
    const adminLoginBtn = document.getElementById('adminLoginBtn'); // Main header button
    const adminPanel = document.getElementById('adminPanel'); // The modal container
    const closeAdminPanel = document.getElementById('closeAdminPanel'); // Close button on panel
    
    // Login form elements
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminUsernameInput = document.getElementById('adminUsername');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginButton = document.getElementById('loginButton'); // Login button in form
    const loginMessage = document.getElementById('loginMessage');

    // Admin features container (hidden until login)
    const adminFeatures = document.getElementById('adminFeatures'); 
    const logoutButton = document.getElementById('logoutButton'); // Logout button in features

    // Admin tab navigation
    const adminTabs = document.querySelector('.admin-tabs'); // Parent for tab buttons
    // No specific variables for sections, we target them by ID via data-tab attribute

    // Admin forms and their messages
    const rosterDateInput = document.getElementById('rosterDateInput'); // Roster form date
    const rosterArtistSelect = document.getElementById('rosterArtist'); // Roster form artist dropdown
    const rosterTimeSlotInput = document.getElementById('rosterTimeSlot'); // Roster form time slot
    const rosterProgrammeSelect = document.getElementById('rosterProgramme'); // Roster form programme dropdown
    const rosterForm = document.getElementById('rosterForm');
    const rosterFormMessage = document.getElementById('rosterFormMessage');

    const addArtistForm = document.getElementById('addArtistForm');
    const newArtistNameInput = document.getElementById('newArtistName');
    const newArtistSpecialtyInput = document.getElementById('newArtistSpecialty');
    const newArtistPhotoURLInput = document.getElementById('newArtistPhotoURL');
    const addArtistFormMessage = document.getElementById('addArtistFormMessage');
    const existingArtistsList = document.getElementById('existingArtistsList'); // To display existing artists

    const addProgrammeForm = document.getElementById('addProgrammeForm');
    const newProgrammeNameInput = document.getElementById('newProgrammeName');
    const newProgrammeDescriptionInput = document.getElementById('newProgrammeDescription');
    const newProgrammePhotoInput = document.getElementById('newProgrammePhoto');
    const addProgrammeFormMessage = document.getElementById('addProgrammeFormMessage');
    const existingProgrammesList = document.getElementById('existingProgrammesList'); // To display existing programmes

    // New "Add New" Buttons next to dropdowns
    const addNewArtistBtn = document.getElementById('addNewArtistBtn');
    const addNewProgrammeBtn = document.getElementById('addNewProgrammeBtn');

    // IMPORTANT: REPLACE WITH YOUR DEPLOYED APPS SCRIPT WEB APP URL
    const API_URL = 'https://script.google.com/macros/s/AKfycbyKQNTAoENa0R8bFFB1fpOzK6qTb7Igg2Qx4DOI5bgM2PsEGUsoLzUwUPHTv9s6fTP1/exec';

    // Global data stores
    let allRosterData = {};
    let allArtistsData = [];
    let allProgrammesData = [];

    // --- Core Data Fetching Functions ---

    // Function to fetch Roster data
    const fetchRosterData = async () => {
        try {
            const response = await fetch(`${API_URL}?sheet=Roster`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rawData = await response.json();
            console.log('Raw Roster Data:', rawData);

            allRosterData = {};
            rawData.forEach(entry => {
                const standardDate = entry.Date; 
                if (!allRosterData[standardDate]) {
                    allRosterData[standardDate] = [];
                }
                allRosterData[standardDate].push(entry);
            });

            console.log('Processed Roster Data:', allRosterData);

            // Set date input to today's date in YYYY-MM-DD format
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayString = `${yyyy}-${mm}-${dd}`;

            dateInput.value = todayString;
            displayRoster(todayString);

        } catch (error) {
            console.error('Could not fetch the roster data:', error);
            dailyRosterContent.innerHTML = '<p>Error loading roster data. Please try again later.</p>';
            selectedDateHeader.textContent = 'Error loading roster.';
            noRosterMessage.classList.add('hidden');
        }
    };

    // Function to fetch Artists data
    const fetchArtistsData = async () => {
        try {
            const response = await fetch(`${API_URL}?sheet=Artists`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allArtistsData = data;
            console.log('Artists data loaded:', allArtistsData);
            displayArtists(allArtistsData);
            populateArtistDropdown(allArtistsData);
            displayExistingArtists(allArtistsData); // Populate existing artists list in admin
        } catch (error) {
            console.error('Could not fetch artist data:', error);
            if (artistsContainer) {
                artistsContainer.innerHTML = `<h2 class="section-title">Our Makeup Artists</h2><p>Error loading artist data. Please try again later.</p>`;
            }
        }
    };

    // Function to fetch Programmes data
    const fetchProgrammesData = async () => {
        try {
            const response = await fetch(`${API_URL}?sheet=Programmes`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allProgrammesData = data;
            console.log('Programmes data loaded:', allProgrammesData);
            populateProgrammeDropdown(allProgrammesData);
            displayExistingProgrammes(allProgrammesData); // Populate existing programmes list in admin
        } catch (error) {
            console.error('Could not fetch programme data:', error);
        }
    };

    // --- Display Functions (Frontend) ---

    // Function to display Artists (main page)
    const displayArtists = (artists) => {
        if (!artistsContainer) return;

        artistsContainer.innerHTML = `<h2 class="section-title">Our Makeup Artists</h2>`; 

        const departmentHead = artists.find(artist => artist.Specialty === 'Department Head');
        if (departmentHead) {
            const headGroup = document.createElement('div');
            headGroup.classList.add('artist-group', 'department-head-group');
            headGroup.innerHTML = `
                <h3 class="card-subtitle">Department Head</h3>
                <div class="artist-card department-head-card">
                    <div class="artist-info">
                        <img src="./Images/${departmentHead['Artist Name'].replace(/\s/g, '-')}.jpg" alt="${departmentHead['Artist Name']}" class="artist-photo">
                        <div>
                            <p class="artist-name">${departmentHead['Artist Name']}</p>
                            <p class="artist-description">${departmentHead.Specialty}</p>
                        </div>
                    </div>
                </div>
            `;
            artistsContainer.appendChild(headGroup);
        }

        const talentedTeam = artists.filter(artist => artist.Specialty !== 'Department Head');
        if (talentedTeam.length > 0) {
            const teamGroup = document.createElement('div');
            teamGroup.classList.add('artist-group', 'talented-team-group');
            teamGroup.innerHTML = `
                <h3 class="card-subtitle">Our Talented Team</h3>
                <div class="talented-team-list"></div>
            `;
            const talentedTeamList = teamGroup.querySelector('.talented-team-list');
            talentedTeam.forEach(artist => {
                const artistCard = document.createElement('div');
                artistCard.classList.add('artist-card');
                artistCard.innerHTML = `
                    <img src="./Images/${artist['Artist Name'].replace(/\s/g, '-')}.jpg" alt="${artist['Artist Name']}" class="artist-photo">
                    <h4>${artist['Artist Name']}</h4>
                    <p>${artist.Specialty}</p>
                `;
                talentedTeamList.appendChild(artistCard);
            });
            artistsContainer.appendChild(teamGroup);
        }
    };

    // Function to display Roster for a selected date (main page)
    const displayRoster = (date) => { 
        const entries = allRosterData[date]; 
        dailyRosterContent.innerHTML = '';
        noRosterMessage.classList.add('hidden');
        selectedDateHeader.textContent = `Roster for ${new Date(date).toDateString()}:`; 

        if (entries && entries.length > 0) {
            const groupedByProgramme = entries.reduce((acc, entry) => {
                const programmeName = entry['Program'] || 'N/A';
                if (!acc[programmeName]) {
                    acc[programmeName] = [];
                }
                acc[programmeName].push(entry);
                return acc;
            }, {});

            for (const programmeName in groupedByProgramme) {
                const programmeEntries = groupedByProgramme[programmeName];
                const programmeElement = document.createElement('div');
                programmeElement.classList.add('roster-programme-group');

                const programmeNameElement = document.createElement('h4');
                programmeNameElement.classList.add('roster-program-name');
                programmeNameElement.innerHTML = `<img src="images/programme-placeholder.png" class="programme-thumb" alt="${programmeName}"> ${programmeName}`;
                programmeElement.appendChild(programmeNameElement);

                const ul = document.createElement('ul');
                programmeEntries.forEach(entry => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${entry['Time Slot']}:</strong> ${entry['Artist Name']}`;
                    ul.appendChild(li);
                });
                programmeElement.appendChild(ul);
                dailyRosterContent.appendChild(programmeElement);
            }
        } else {
            dailyRosterContent.innerHTML = '';
            noRosterMessage.classList.remove('hidden');
            selectedDateHeader.textContent = `No roster entries for ${new Date(date).toDateString()}.`;
        }
    };

    // --- Admin Panel Logic ---

    // Helper to clear and show form message
    const showFormMessage = (messageElement, message, isError = false) => {
        messageElement.textContent = message;
        messageElement.style.color = isError ? 'red' : 'green';
        setTimeout(() => {
            messageElement.textContent = '';
        }, 5000); // Message disappears after 5 seconds
    };

    // Populate dropdowns in admin Roster form
    const populateArtistDropdown = (artists) => {
        rosterArtistSelect.innerHTML = '<option value="">Select Artist</option>'; // Clear and add default
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist['Artist Name'];
            option.textContent = artist['Artist Name'];
            rosterArtistSelect.appendChild(option);
        });
    };

    const populateProgrammeDropdown = (programmes) => {
        rosterProgrammeSelect.innerHTML = '<option value="">Select Programme</option>'; // Clear and add default
        programmes.forEach(prog => {
            // IMPORTANT: Ensure 'Name' matches the column header in your 'Programmes' Google Sheet
            const option = document.createElement('option');
            option.value = prog['Program Name']; // Assuming your Programme sheet has a 'Name' column
            option.textContent = prog['Program Name'];
            rosterProgrammeSelect.appendChild(option);
        });
    };

    // Display existing artists in the "Manage Artists" section
    const displayExistingArtists = (artists) => {
        if (!existingArtistsList) return;
        existingArtistsList.innerHTML = ''; // Clear previous entries
        if (artists.length === 0) {
            existingArtistsList.innerHTML = '<li>No artists found.</li>';
            return;
        }
        artists.forEach(artist => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${artist['Artist Name']} (${artist.Specialty})</span>
                <div>
                    <button class="btn btn-sm btn-edit" data-artist-name="${artist['Artist Name']}">Edit</button>
                    <button class="btn btn-sm btn-delete" data-artist-name="${artist['Artist Name']}">Delete</button>
                </div>
            `;
            existingArtistsList.appendChild(li);
        });
    };

    // Display existing programmes in the "Manage Programmes" section
    const displayExistingProgrammes = (programmes) => {
        if (!existingProgrammesList) return;
        existingProgrammesList.innerHTML = ''; // Clear previous entries
        if (programmes.length === 0) {
            existingProgrammesList.innerHTML = '<li>No programmes found.</li>';
            return;
        }
        programmes.forEach(prog => {
            const li = document.createElement('li');
            // IMPORTANT: Ensure 'Name' and 'Description' match column headers in your 'Programmes' Google Sheet
            li.innerHTML = `
                <span>${prog['Program Name']} - ${prog.Description || 'No description'}</span>
                <div>
                    <button class="btn btn-sm btn-edit" data-programme-name="${prog['Program Name']}">Edit</button>
                    <button class="btn btn-sm btn-delete" data-programme-name="${prog['Program Name']}">Delete</button>
                </div>
            `;
            existingProgrammesList.appendChild(li);
        });
    };


    // Toggle admin panel visibility
    const showAdminPanel = () => {
        adminPanel.classList.remove('hidden');
        // Reset admin panel state on open
        adminLoginForm.classList.remove('hidden'); // Show login form initially
        adminFeatures.classList.add('hidden'); // Hide features
        loginMessage.textContent = ''; // Clear login message
        adminUsernameInput.value = ''; // Clear inputs
        adminPasswordInput.value = '';
    };

    const hideAdminPanel = () => {
        adminPanel.classList.add('hidden');
        loginMessage.textContent = ''; 
        adminUsernameInput.value = ''; 
        adminPasswordInput.value = '';
        adminLoginForm.classList.remove('hidden'); 
        adminFeatures.classList.add('hidden'); 
        // Reset active tab to Roster when closing
        document.querySelector('.admin-tabs .active-tab')?.classList.remove('active-tab');
        document.querySelector('.admin-section.active-section')?.classList.remove('active-section');
        // Set 'Update Roster' as the default active tab and section on logout/close
        document.querySelector('.admin-tabs button[data-tab="updateRoster"]')?.classList.add('active-tab');
        document.getElementById('updateRoster')?.classList.add('active-section');
    };

    // Function to handle tab switching in admin panel
    const handleAdminTabClick = (event) => {
        if (event.target.classList.contains('tab-button')) {
            console.log('Tab button clicked:', event.target.dataset.tab);
            // Remove active class from all buttons and sections
            document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active-tab'));
            document.querySelectorAll('.admin-section').forEach(section => section.classList.add('hidden'));

            // Add active class to clicked button and corresponding section
            event.target.classList.add('active-tab');
            const targetTabId = event.target.dataset.tab;
            console.log('Switching to tab:', targetTabId);
            document.getElementById(targetTabId).classList.remove('hidden');
        }
    };

    // --- Event Listeners ---

    // Event listener for date input change (main roster display)
    if (dateInput) {
        dateInput.addEventListener('change', (event) => {
            const selectedDate = event.target.value; 
            if (selectedDate) {
                displayRoster(selectedDate);
            } else {
                dailyRosterContent.innerHTML = '';
                noRosterMessage.classList.remove('hidden');
                selectedDateHeader.textContent = 'Select a date to view the roster.';
            }
        });
    } else {
        console.error("Date input element with ID 'rosterDate' not found.");
    }

    // Admin Login button in header
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', showAdminPanel);
    }

    // Close button inside admin panel
    if (closeAdminPanel) {
        closeAdminPanel.addEventListener('click', hideAdminPanel);
    }

    // Login button logic (within the admin panel)
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const username = adminUsernameInput.value;
            const password = adminPasswordInput.value;

            // --- IMPORTANT: This is a TEMPORARY, client-side-only check! ---
            // DO NOT use this for real security.
            // This will be replaced with a backend API call in the next step.
            if (username === 'admin' && password === 'password123') { // Example credentials
                loginMessage.textContent = 'Login successful!';
                loginMessage.style.color = 'green';
                adminLoginForm.classList.add('hidden'); // Hide login form
                adminFeatures.classList.remove('hidden'); // Show admin features
                
                // Fetch data for dropdowns and lists when admin logs in
                fetchProgrammesData();

                // Set the current roster date input in admin panel to today's date
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                rosterDateInput.value = `${yyyy}-${mm}-${dd}`;
            } else {
                loginMessage.textContent = 'Invalid username or password.';
                loginMessage.style.color = 'red';
            }
        });
    }

    // Logout button logic
    if (logoutButton) {
        logoutButton.addEventListener('click', hideAdminPanel);
    }

    // Admin tab navigation click listener
    if (adminTabs) {
        adminTabs.addEventListener('click', handleAdminTabClick);
    }

    // Event listeners for "Add New" buttons
    if (addNewArtistBtn) {
        addNewArtistBtn.addEventListener('click', () => {
            // Find the "Manage Artists" tab button and simulate a click
            const manageArtistsTab = document.querySelector('.tab-button[data-tab="manageArtists"]');
            if (manageArtistsTab) {
                // Manually trigger the tab click logic
                handleAdminTabClick({ target: manageArtistsTab });
            }
        });
    }

    if (addNewProgrammeBtn) {
        addNewProgrammeBtn.addEventListener('click', () => {
            // Find the "Manage Programmes" tab button and simulate a click
            const manageProgrammesTab = document.querySelector('.tab-button[data-tab="manageProgrammes"]');
            if (manageProgrammesTab) {
                // Manually trigger the tab click logic
                handleAdminTabClick({ target: manageProgrammesTab });
            }
        });
    }


    // --- Initial Data Fetches when the page loads ---
    fetchRosterData();
    fetchArtistsData();
    // fetchProgrammesData() is called on admin login now for fresh data
    // They are also called in displayArtists and populateProgrammes (which are called by fetchArtistsData etc)


    // --- Placeholder for form submissions (will be implemented with backend calls later) ---
    if (rosterForm) {
        rosterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const selectedArtist = rosterArtistSelect.value;
            const selectedProgramme = rosterProgrammeSelect.value;

            if (!selectedArtist) {
                showFormMessage(rosterFormMessage, 'Please select an Artist.', true);
                return;
            }
            if (!selectedProgramme) {
                showFormMessage(rosterFormMessage, 'Please select a Programme.', true);
                return;
            }

            // Simulate API call
            console.log('Submitting roster entry:', {
                date: rosterDateInput.value,
                artist: selectedArtist,
                timeSlot: rosterTimeSlotInput.value,
                programme: selectedProgramme
            });

            // Show success message
            showFormMessage(rosterFormMessage, 'Roster entry added successfully!', false);

            // Clear the form
            rosterForm.reset();
        });
    }

    if (addArtistForm) {
        addArtistForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Simulate API call
            console.log('Submitting new artist:', {
                name: newArtistNameInput.value,
                specialty: newArtistSpecialtyInput.value,
                photoURL: newArtistPhotoURLInput.value
            });

            // Show success message
            showFormMessage(addArtistFormMessage, 'Artist added successfully!', false);

            // Clear the form
            addArtistForm.reset();
        });
    }

    if (addProgrammeForm) {
        addProgrammeForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const photoFile = newProgrammePhotoInput.files[0];

            // Simulate API call
            console.log('Submitting new programme:', {
                name: newProgrammeNameInput.value,
                description: newProgrammeDescriptionInput.value,
                photo: photoFile ? photoFile.name : 'No photo uploaded'
            });

            // Show success message
            showFormMessage(addProgrammeFormMessage, 'Programme added successfully!', false);

            // Clear the form
            addProgrammeForm.reset();
        });
    }
});