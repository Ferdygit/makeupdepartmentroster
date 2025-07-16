document.addEventListener('DOMContentLoaded', () => {
    // --- Main UI Elements ---
    const dateInput = document.getElementById('rosterDateInput'); // Corrected ID from 'rosterDate' to 'rosterDateInput'
    const dailyRosterContent = document.getElementById('dailyRosterContent');
    const selectedDateHeader = document.getElementById('selectedDateHeader');
    const noRosterMessage = document.getElementById('noRosterMessage');
    const artistsContainer = document.getElementById('artistsContainer');

    // --- Admin Panel Elements ---
    const adminLoginBtn = document.getElementById('adminLoginBtn'); // Main header button (e.g., in your nav)
    const adminPanel = document.getElementById('adminPanel'); // The entire admin panel modal/container
    const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn'); // Close button inside the admin panel
    
    // Login form elements (these should be *inside* adminPanel and potentially nested further)
    const adminLoginFormContainer = document.getElementById('adminLoginFormContainer'); // Assuming a container for the login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminUsernameInput = document.getElementById('adminUsername');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginButton = document.getElementById('loginButton');
    const loginMessage = document.getElementById('loginMessage');

    // Admin features container (visible after login, within adminPanel)
    const adminFeatures = document.getElementById('adminFeatures'); 
    const logoutButton = document.getElementById('logoutButton');

    // Admin tab navigation
    const adminTabs = document.querySelector('.admin-tabs'); 

    // Admin forms and their messages (elements within adminFeatures)
    const rosterDateInputAdmin = document.getElementById('rosterDateInput'); // Admin Roster form date input
    const rosterArtistSelect = document.getElementById('rosterArtist');
    const rosterTimeSlotInput = document.getElementById('rosterTimeSlot');
    const rosterProgrammeSelect = document.getElementById('rosterProgramme');
    const rosterForm = document.getElementById('rosterForm');
    const rosterFormMessage = document.getElementById('rosterFormMessage');

    const addArtistForm = document.getElementById('addArtistForm');
    const newArtistNameInput = document.getElementById('newArtistName');
    const newArtistSpecialtyInput = document.getElementById('newArtistSpecialty');
    const newArtistPhotoURLInput = document.getElementById('newArtistPhotoURL');
    const addArtistFormMessage = document.getElementById('addArtistFormMessage');
    const existingArtistsList = document.getElementById('existingArtistsList');

    const addProgrammeForm = document.getElementById('addProgrammeForm');
    const newProgrammeNameInput = document.getElementById('newProgrammeName');
    const newProgrammeDescriptionInput = document.getElementById('newProgrammeDescription');
    const newProgrammePhotoInput = document.getElementById('newProgrammePhoto');
    const addProgrammeFormMessage = document.getElementById('addProgrammeFormMessage');
    const existingProgrammesList = document.getElementById('existingProgrammesList');

    // "Add New" Buttons next to dropdowns
    const addNewArtistBtn = document.getElementById('addNewArtistBtn');
    const addNewProgrammeBtn = document.getElementById('addNewProgrammeBtn');

    // IMPORTANT: REPLACE WITH YOUR DEPLOYED APPS SCRIPT WEB APP URL
    const API_URL = 'https://script.google.com/macros/s/AKfycbyKQNTAoENa0R8bFFB1fpOzK6qTb7Igg2Qx4DOI5bgM2PsEGUsoLzUwUPHTv9s6fTP1/exec';

    // Global data stores
    let allRosterData = {};
    let allArtistsData = [];
    let allProgrammesData = [];

    // --- Core Data Fetching Functions ---

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

            if (dateInput) { // Ensure dateInput exists before setting value
                dateInput.value = todayString;
            }
            displayRoster(todayString);

        } catch (error) {
            console.error('Could not fetch the roster data:', error);
            if (dailyRosterContent) {
                dailyRosterContent.innerHTML = '<p>Error loading roster data. Please try again later.</p>';
                selectedDateHeader.textContent = 'Error loading roster.';
                noRosterMessage.classList.add('hidden');
            }
        }
    };

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

    const displayArtists = (artists) => {
        if (!artistsContainer) return;

        artistsContainer.innerHTML = `<h2 class="section-title">Our Makeup Artists</h2>`; 

        const departmentHead = artists.find(artist => artist.Specialty === 'Department Head');
        if (departmentHead) {
            const headGroup = document.createElement('div');
            headGroup.classList.add('artist-group', 'department-head-group');
            // Using artist.PhotoURL if available, otherwise fallback to local path
            const photoSrc = departmentHead.PhotoURL || `./Images/${departmentHead['Artist Name'].replace(/\s/g, '-')}.jpg`;
            headGroup.innerHTML = `
                <h3 class="card-subtitle">Department Head</h3>
                <div class="artist-card department-head-card">
                    <div class="artist-info">
                        <img src="${photoSrc}" alt="${departmentHead['Artist Name']}" class="artist-photo">
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
                const photoSrc = artist.PhotoURL || `./Images/${artist['Artist Name'].replace(/\s/g, '-')}.jpg`;
                artistCard.innerHTML = `
                    <img src="${photoSrc}" alt="${artist['Artist Name']}" class="artist-photo">
                    <h4>${artist['Artist Name']}</h4>
                    <p>${artist.Specialty}</p>
                `;
                talentedTeamList.appendChild(artistCard);
            });
            artistsContainer.appendChild(teamGroup);
        }
    };

    const displayRoster = (date) => { 
        const entries = allRosterData[date]; 
        if (dailyRosterContent) dailyRosterContent.innerHTML = '';
        if (noRosterMessage) noRosterMessage.classList.add('hidden');
        if (selectedDateHeader) selectedDateHeader.textContent = `Roster for ${new Date(date).toDateString()}:`; 

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

                const programmeData = allProgrammesData.find(p => p['Program Name'] === programmeName);
                const programmeThumbSrc = programmeData && programmeData.PhotoURL 
                                          ? programmeData.PhotoURL 
                                          : 'images/programme-placeholder.png'; // Fallback

                const programmeNameElement = document.createElement('h4');
                programmeNameElement.classList.add('roster-program-name');
                programmeNameElement.innerHTML = `<img src="${programmeThumbSrc}" class="programme-thumb" alt="${programmeName}"> ${programmeName}`;
                programmeElement.appendChild(programmeNameElement);

                const ul = document.createElement('ul');
                programmeEntries.forEach(entry => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${entry['Time Slot']}:</strong> ${entry['Artist Name']}`;
                    ul.appendChild(li);
                });
                programmeElement.appendChild(ul);
                if (dailyRosterContent) dailyRosterContent.appendChild(programmeElement);
            }
        } else {
            if (dailyRosterContent) dailyRosterContent.innerHTML = '';
            if (noRosterMessage) noRosterMessage.classList.remove('hidden');
            if (selectedDateHeader) selectedDateHeader.textContent = `No roster entries for ${new Date(date).toDateString()}.`;
        }
    };

    // --- Admin Panel Logic ---

    const showFormMessage = (messageElement, message, isError = false) => {
        if (!messageElement) return; // Add check for element
        messageElement.textContent = message;
        messageElement.style.color = isError ? 'red' : 'green';
        setTimeout(() => {
            messageElement.textContent = '';
        }, 5000);
    };

    const populateArtistDropdown = (artists) => {
        if (!rosterArtistSelect) return;
        rosterArtistSelect.innerHTML = '<option value="">Select Artist</option>';
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist['Artist Name'];
            option.textContent = artist['Artist Name'];
            rosterArtistSelect.appendChild(option);
        });
    };

    const populateProgrammeDropdown = (programmes) => {
        if (!rosterProgrammeSelect) return;
        rosterProgrammeSelect.innerHTML = '<option value="">Select Programme</option>';
        programmes.forEach(prog => {
            const option = document.createElement('option');
            option.value = prog['Program Name'];
            option.textContent = prog['Program Name'];
            rosterProgrammeSelect.appendChild(option);
        });
    };

    const displayExistingArtists = (artists) => {
        if (!existingArtistsList) return;
        existingArtistsList.innerHTML = '';
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

    const displayExistingProgrammes = (programmes) => {
        if (!existingProgrammesList) return;
        existingProgrammesList.innerHTML = '';
        if (programmes.length === 0) {
            existingProgrammesList.innerHTML = '<li>No programmes found.</li>';
            return;
        }
        programmes.forEach(prog => {
            const li = document.createElement('li');
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

    const showAdminPanel = () => {
        if (!adminPanel || !adminLoginFormContainer || !adminFeatures || !loginMessage || !adminUsernameInput || !adminPasswordInput) return;
        adminPanel.classList.remove('hidden'); // Show the main admin panel modal
        adminLoginFormContainer.classList.remove('hidden'); // Show login form
        adminFeatures.classList.add('hidden'); // Hide features
        loginMessage.textContent = ''; // Clear login message
        adminUsernameInput.value = ''; // Clear inputs
        adminPasswordInput.value = '';
    };

    const hideAdminPanel = () => {
        if (!adminPanel || !adminLoginFormContainer || !adminFeatures || !loginMessage || !adminUsernameInput || !adminPasswordInput) return;
        adminPanel.classList.add('hidden'); // Hide the main admin panel modal
        loginMessage.textContent = ''; 
        adminUsernameInput.value = ''; 
        adminPasswordInput.value = '';
        // When hiding the admin panel, reset to login state for next open
        adminLoginFormContainer.classList.remove('hidden'); 
        adminFeatures.classList.add('hidden'); 
        // Reset active tab to Roster when closing/logging out
        document.querySelectorAll('.admin-tabs button').forEach(button => button.classList.remove('active-tab'));
        document.querySelectorAll('.admin-section').forEach(section => section.classList.add('hidden'));
        
        // Explicitly set 'Update Roster' as the default active tab and section
        const updateRosterTab = document.querySelector('.admin-tabs button[data-tab="updateRoster"]');
        const updateRosterSection = document.getElementById('updateRoster');
        if (updateRosterTab) updateRosterTab.classList.add('active-tab');
        if (updateRosterSection) updateRosterSection.classList.remove('hidden'); // Use remove('hidden') here
    };

    const handleAdminTabClick = (event) => {
        const targetButton = event.target.closest('.tab-button'); // Use closest for better click target detection
        if (targetButton) {
            console.log('Tab button clicked:', targetButton.dataset.tab);
            
            // Remove active class from all buttons
            document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active-tab'));
            // Hide all admin sections
            document.querySelectorAll('.admin-section').forEach(section => section.classList.add('hidden'));

            // Add active class to clicked button
            targetButton.classList.add('active-tab');
            const targetTabId = targetButton.dataset.tab;
            console.log('Switching to tab section:', targetTabId);
            
            // Show the corresponding section
            const targetSection = document.getElementById(targetTabId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        }
    };

    // --- Event Listeners ---

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
        console.error("Date input element with ID 'rosterDateInput' not found.");
    }

    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', showAdminPanel);
    }

    // Close button inside admin panel
    if (closeAdminPanelBtn) { // Changed to closeAdminPanelBtn
        closeAdminPanelBtn.addEventListener('click', hideAdminPanel);
    } else {
        console.error("Close button element with ID 'closeAdminPanelBtn' not found.");
    }

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const username = adminUsernameInput.value;
            const password = adminPasswordInput.value;

            if (username === 'admin' && password === 'password123') { 
                showFormMessage(loginMessage, 'Login successful!', false);
                adminLoginFormContainer.classList.add('hidden'); // Hide login form container
                adminFeatures.classList.remove('hidden'); // Show admin features

                // Fetch data for dropdowns and lists when admin logs in
                fetchProgrammesData();
                fetchArtistsData(); // Re-fetch artists to ensure dropdown is updated

                // Set the current roster date input in admin panel to today's date
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                if (rosterDateInputAdmin) { // Check before setting value
                    rosterDateInputAdmin.value = `${yyyy}-${mm}-${dd}`;
                }
                
                // Set 'Update Roster' as the default active tab after login
                const updateRosterTab = document.querySelector('.admin-tabs button[data-tab="updateRoster"]');
                const updateRosterSection = document.getElementById('updateRoster');
                document.querySelectorAll('.admin-tabs button').forEach(btn => btn.classList.remove('active-tab'));
                document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
                if (updateRosterTab) updateRosterTab.classList.add('active-tab');
                if (updateRosterSection) updateRosterSection.classList.remove('hidden');

            } else {
                showFormMessage(loginMessage, 'Invalid username or password.', true);
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', hideAdminPanel);
    }

    if (adminTabs) {
        adminTabs.addEventListener('click', handleAdminTabClick);
    }

    // Event listeners for "Add New" buttons
    if (addNewArtistBtn) {
        addNewArtistBtn.addEventListener('click', () => {
            const manageArtistsTab = document.querySelector('.tab-button[data-tab="manageArtists"]');
            if (manageArtistsTab) {
                manageArtistsTab.click(); // Simulate a click event on the tab button
            }
        });
    }

    if (addNewProgrammeBtn) {
        addNewProgrammeBtn.addEventListener('click', () => {
            const manageProgrammesTab = document.querySelector('.tab-button[data-tab="manageProgrammes"]');
            if (manageProgrammesTab) {
                manageProgrammesTab.click(); // Simulate a click event on the tab button
            }
        });
    }

    // --- Form Submissions (placeholders for API calls) ---
    if (rosterForm) {
        rosterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const selectedArtist = rosterArtistSelect.value;
            const selectedProgramme = rosterProgrammeSelect.value;

            if (!selectedArtist || selectedArtist === "") { // Check for empty string too
                showFormMessage(rosterFormMessage, 'Please select an Artist.', true);
                return;
            }
            if (!selectedProgramme || selectedProgramme === "") { // Check for empty string too
                showFormMessage(rosterFormMessage, 'Please select a Programme.', true);
                return;
            }

            console.log('Submitting roster entry:', {
                date: rosterDateInputAdmin.value, // Use rosterDateInputAdmin for clarity
                artist: selectedArtist,
                timeSlot: rosterTimeSlotInput.value,
                programme: selectedProgramme
            });

            showFormMessage(rosterFormMessage, 'Roster entry added successfully!', false);
            rosterForm.reset();
            // In a real app, you'd refetch roster data here: fetchRosterData();
        });
    }

    if (addArtistForm) {
        addArtistForm.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log('Submitting new artist:', {
                name: newArtistNameInput.value,
                specialty: newArtistSpecialtyInput.value,
                photoURL: newArtistPhotoURLInput.value
            });

            showFormMessage(addArtistFormMessage, 'Artist added successfully!', false);
            addArtistForm.reset();
            // In a real app, you'd refetch artists and update dropdowns/lists: fetchArtistsData();
        });
    }

    if (addProgrammeForm) {
        addProgrammeForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const photoFile = newProgrammePhotoInput.files[0];

            console.log('Submitting new programme:', {
                name: newProgrammeNameInput.value,
                description: newProgrammeDescriptionInput.value,
                photo: photoFile ? photoFile.name : 'No photo uploaded'
            });

            showFormMessage(addProgrammeFormMessage, 'Programme added successfully!', false);
            addProgrammeForm.reset();
            // In a real app, you'd refetch programmes and update dropdowns/lists: fetchProgrammesData();
        });
    }

    // --- Initial Data Fetches when the page loads ---
    fetchRosterData();
    fetchArtistsData();
    // fetchProgrammesData() is called upon successful admin login.
    // This ensures these dropdowns/lists are populated only when needed by an authenticated user.
});