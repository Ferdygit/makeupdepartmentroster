document.addEventListener('DOMContentLoaded', () => {
    // --- Main UI Elements ---
    const dateInput = document.getElementById('rosterDate');
    const dailyRosterContent = document.getElementById('dailyRosterContent');
    const selectedDateHeader = document.getElementById('selectedDateHeader');
    const noRosterMessage = document.getElementById('noRosterMessage');
    const artistsContainer = document.getElementById('artistsContainer');

    // --- Admin Panel Elements ---
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');

    // Login form elements
    const adminLoginFormContainer = document.getElementById('adminLoginFormContainer');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminUsernameInput = document.getElementById('adminUsername');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginButton = document.getElementById('loginButton');
    const loginMessage = document.getElementById('loginMessage');

    // Admin features container
    const adminFeatures = document.getElementById('adminFeatures');
    const logoutButton = document.getElementById('logoutButton');

    // Admin tab navigation
    const adminTabs = document.querySelector('.admin-tabs');

    // Admin forms and their messages
    const rosterDateInputAdmin = document.getElementById('rosterDateInput'); // Admin Roster form date input, same as main dateInput
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
    const newProgrammePhotoURLInput = document.getElementById('newProgrammePhotoURL');
    const addProgrammeFormMessage = document.getElementById('addProgrammeFormMessage');
    const existingProgrammesList = document.getElementById('existingProgrammesList');

    // "Add New" Buttons next to dropdowns
    const addNewArtistBtn = document.getElementById('addNewArtistBtn');
    const addNewProgrammeBtn = document.getElementById('addNewProgrammeBtn');

    // IMPORTANT: REPLACE WITH YOUR DEPLOYED APPS SCRIPT WEB APP URL
    // This URL should be the one you copied after deploying your Apps Script Web App.
    const API_URL = 'https://script.google.com/macros/s/AKfycbwE7nMOHGS2sfo5YAaZJvEhLAiB_w2Oq6a0j1HX3dtGMmM1ig9FwLshpnFirV5-EdXtuQ/exec';

    // Global data stores
    let allRosterData = []; // Changed to array to store all fetched roster entries
    let allArtistsData = [];
    let allProgrammesData = [];

    // --- Core Data Fetching Functions ---

    const fetchRosterData = async () => {
        try {
            // Fetch ALL roster data from the Apps Script
            const response = await fetch(`${API_URL}?sheet=Roster`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiResponse = await response.json(); // Get the full API response object
            console.log('Raw Roster Data from API:', apiResponse); // Log raw data for debugging

            // --- CRITICAL FIX START ---
            // Check if API response indicates success and contains data array
            if (apiResponse.status === 'success' && Array.isArray(apiResponse.data)) {
                allRosterData = apiResponse.data; // Assign only the 'data' array
            } else {
                // Handle cases where API returns error status or data is not an array
                throw new Error(`API returned an error or invalid data structure: ${apiResponse.message || 'Unknown error'}`);
            }
            // --- CRITICAL FIX END ---

            // Set date input to today's date in YYYY-MM-DD format and display initial roster
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayString = `${yyyy}-${mm}-${dd}`;

            if (dateInput) {
                dateInput.value = todayString;
                displayRoster(todayString);
            }

        } catch (error) {
            console.error('Could not fetch the roster data:', error);
            if (dailyRosterContent) {
                dailyRosterContent.innerHTML = '<p>Error loading roster data. Please try again later.</p>';
                selectedDateHeader.textContent = 'Error loading roster.';
                noRosterMessage.classList.remove('hidden'); // Ensure message is visible on error
            }
            allRosterData = []; // Ensure it's an empty array on error to prevent further TypeErrors
        }
    };

    const fetchArtistsData = async () => {
        try {
            const response = await fetch(`${API_URL}?sheet=Artists`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiResponse = await response.json(); // Get the full API response object

            // --- CRITICAL FIX START ---
            if (apiResponse.status === 'success' && Array.isArray(apiResponse.data)) {
                allArtistsData = apiResponse.data; // Assign only the 'data' array
            } else {
                throw new Error(`API returned an error or invalid data structure: ${apiResponse.message || 'Unknown error'}`);
            }
            // --- CRITICAL FIX END ---

            console.log('Artists data loaded:', allArtistsData);
            displayArtists(allArtistsData);
            populateArtistDropdown(allArtistsData);
            displayExistingArtists(allArtistsData);
        } catch (error) {
            console.error('Could not fetch artist data:', error);
            if (artistsContainer) {
                artistsContainer.innerHTML = `<h2 class="section-title">Our Makeup Artists</h2><p>Error loading artist data. Please try again later.</p>`;
            }
            allArtistsData = []; // Ensure it's an empty array on error
        }
    };

    const fetchProgrammesData = async () => {
        try {
            const response = await fetch(`${API_URL}?sheet=Programmes`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiResponse = await response.json(); // Get the full API response object

            // --- CRITICAL FIX START ---
            if (apiResponse.status === 'success' && Array.isArray(apiResponse.data)) {
                allProgrammesData = apiResponse.data; // Assign only the 'data' array
            } else {
                throw new Error(`API returned an error or invalid data structure: ${apiResponse.message || 'Unknown error'}`);
            }
            // --- CRITICAL FIX END ---

            console.log('Programmes data loaded:', allProgrammesData);
            populateProgrammeDropdown(allProgrammesData);
            displayExistingProgrammes(allProgrammesData);
        } catch (error) {
            console.error('Could not fetch programme data:', error);
            allProgrammesData = []; // Ensure it's an empty array on error
        }
    };

    // --- Display Functions (Frontend) ---

    const displayArtists = (artists) => {
        if (!artistsContainer) return;

        artistsContainer.innerHTML = `<h2 class="section-title">Our Makeup Artists</h2>`;

        // Ensure 'artists' is an array before trying to use .find or .filter
        if (!Array.isArray(artists)) {
            console.error("displayArtists received non-array data:", artists);
            artistsContainer.innerHTML += `<p>Error: Artist data format is incorrect.</p>`;
            return;
        }

        const departmentHead = artists.find(artist => artist.Specialty === 'Department Head');
        if (departmentHead) {
            const headGroup = document.createElement('div');
            headGroup.classList.add('artist-group', 'department-head-group');
            // Use PhotoURL from data first, then fallback to local image path
            const photoSrc = departmentHead.PhotoURL || `./Images/${departmentHead['Artist Name'].replace(/\s/g, '-')}.jpg`;
            headGroup.innerHTML = `
                <h3 class="card-subtitle">Department Head</h3>
                <div class="artist-card department-head-card">
                    <div class="artist-info">
                        <img src="${photoSrc}" alt="${departmentHead['Artist Name']}" class="artist-photo" onerror="this.onerror=null;this.src='images/artist-placeholder.png';">
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
                    <img src="${photoSrc}" alt="${artist['Artist Name']}" class="artist-photo" onerror="this.onerror=null;this.src='images/artist-placeholder.png';">
                    <h4>${artist['Artist Name']}</h4>
                    <p>${artist.Specialty}</p>
                `;
                talentedTeamList.appendChild(artistCard);
            });
            artistsContainer.appendChild(teamGroup);
        }
    };

    // Robust programme thumbnail logic: tries .jpg, then .png, then falls back to placeholder
    const getProgrammeThumbImgHtml = (programmeName) => {
        const base = `./Images/${programmeName.replace(/\s/g, '-')}`;
        const jpg = `${base}.jpg`;
        const png = `${base}.png`;
        // Tries .jpg, then .png, then falls back to placeholder
        return `<img src="${jpg}" class="programme-thumb" alt="${programmeName}"
            onerror="this.onerror=null;
                     if(this.src.indexOf('.jpg')!==-1){this.src='${png}';}
                     else{this.src='images/programme-placeholder.png';}">`;
    };

    const displayRoster = (selectedDateString) => {
        if (!dailyRosterContent) return;

        dailyRosterContent.innerHTML = '';
        if (noRosterMessage) noRosterMessage.classList.add('hidden');

        const displayDate = new Date(selectedDateString + 'T00:00:00');
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        const readableDate = displayDate.toLocaleDateString('en-US', options);
        if (selectedDateHeader) selectedDateHeader.textContent = `Roster for ${readableDate}:`;

        // Ensure allRosterData is an array before trying to use .filter
        if (!Array.isArray(allRosterData)) {
            console.error("displayRoster received non-array data for allRosterData:", allRosterData);
            dailyRosterContent.innerHTML = '<p>Error: Roster data format is incorrect.</p>';
            noRosterMessage.classList.remove('hidden');
            return;
        }

        const entriesForSelectedDate = allRosterData.filter(entry => {
            let entryDate = entry.Date;
            // Handle date format from sheet (DD.MM.YYYY) and convert to YYYY-MM-DD for comparison
            if (typeof entryDate === 'string' && entryDate.includes('.')) {
                const parts = entryDate.split('.');
                entryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return entryDate === selectedDateString;
        });

        console.log('Filtered Roster Data for', selectedDateString, ':', entriesForSelectedDate);

        if (entriesForSelectedDate && entriesForSelectedDate.length > 0) {
            const groupedByProgramme = entriesForSelectedDate.reduce((acc, entry) => {
                // Use 'Programme' as the key, as per Apps Script response
                const programmeName = entry['Programme'] || 'N/A'; 
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
                programmeNameElement.innerHTML = `${getProgrammeThumbImgHtml(programmeName)} ${programmeName}`;
                programmeElement.appendChild(programmeNameElement);

                const ul = document.createElement('ul');
                programmeEntries.forEach(entry => {
                    const li = document.createElement('li');
                    // Use 'Artist' for the artist name from Apps Script response
                    li.innerHTML = `<strong>${entry['Time Slot']}:</strong> ${entry['Artist']}`; 
                    ul.appendChild(li);
                });
                programmeElement.appendChild(ul);
                if (dailyRosterContent) dailyRosterContent.appendChild(programmeElement);
            }
        } else {
            dailyRosterContent.innerHTML = '';
            if (noRosterMessage) noRosterMessage.classList.remove('hidden');
            if (selectedDateHeader) selectedDateHeader.textContent = `No roster entries for ${readableDate}.`;
        }
    };

    // --- Admin Panel Logic ---

    const showFormMessage = (messageElement, message, isError = false) => {
        if (!messageElement) return;
        messageElement.textContent = message;
        messageElement.style.color = isError ? 'red' : 'green';
        setTimeout(() => {
            messageElement.textContent = '';
        }, 5000);
    };

    const populateArtistDropdown = (artists) => {
        if (!rosterArtistSelect) return;
        rosterArtistSelect.innerHTML = '<option value="">Select Artist</option>';
        // Ensure 'artists' is an array before iterating
        if (Array.isArray(artists)) {
            artists.forEach(artist => {
                const option = document.createElement('option');
                option.value = artist['Artist Name'];
                option.textContent = artist['Artist Name'];
                rosterArtistSelect.appendChild(option);
            });
        }
    };

    const populateProgrammeDropdown = (programmes) => {
        if (!rosterProgrammeSelect) return;
        rosterProgrammeSelect.innerHTML = '<option value="">Select Programme</option>';
        // Ensure 'programmes' is an array before iterating
        if (Array.isArray(programmes)) {
            programmes.forEach(prog => {
                const option = document.createElement('option');
                option.value = prog['Program Name'];
                option.textContent = prog['Program Name'];
                rosterProgrammeSelect.appendChild(option);
            });
        }
    };

    const displayExistingArtists = (artists) => {
        if (!existingArtistsList) return;
        existingArtistsList.innerHTML = '';
        // Ensure 'artists' is an array before iterating
        if (!Array.isArray(artists) || artists.length === 0) {
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
        // Ensure 'programmes' is an array before iterating
        if (!Array.isArray(programmes) || programmes.length === 0) {
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
        adminPanel.classList.remove('hidden');
        adminLoginFormContainer.classList.remove('hidden');
        adminFeatures.classList.add('hidden');
        loginMessage.textContent = '';
        adminUsernameInput.value = '';
        adminPasswordInput.value = '';
    };

    const hideAdminPanel = () => {
        if (!adminPanel || !adminLoginFormContainer || !adminFeatures || !loginMessage || !adminUsernameInput || !adminPasswordInput) return;
        adminPanel.classList.add('hidden');
        loginMessage.textContent = '';
        adminUsernameInput.value = '';
        adminPasswordInput.value = '';
        adminLoginFormContainer.classList.remove('hidden');
        adminFeatures.classList.add('hidden');
        document.querySelectorAll('.admin-tabs button').forEach(button => button.classList.remove('active-tab'));
        document.querySelectorAll('.admin-section').forEach(section => section.classList.add('hidden'));

        const updateRosterTab = document.querySelector('.admin-tabs button[data-tab="updateRoster"]');
        const updateRosterSection = document.getElementById('updateRoster');
        if (updateRosterTab) updateRosterTab.classList.add('active-tab');
        if (updateRosterSection) updateRosterSection.classList.remove('hidden');
    };

    const handleAdminTabClick = (event) => {
        const targetButton = event.target.closest('.tab-button');
        if (targetButton) {
            document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active-tab'));
            document.querySelectorAll('.admin-section').forEach(section => section.classList.add('hidden'));
            targetButton.classList.add('active-tab');
            const targetTabId = targetButton.dataset.tab;
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

    if (closeAdminPanelBtn) {
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
                adminLoginFormContainer.classList.add('hidden');
                adminFeatures.classList.remove('hidden');

                fetchProgrammesData();
                fetchArtistsData();

                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                if (rosterDateInputAdmin) {
                    rosterDateInputAdmin.value = `${yyyy}-${mm}-${dd}`;
                }

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
                manageArtistsTab.click();
            }
        });
    }

    if (addNewProgrammeBtn) {
        addNewProgrammeBtn.addEventListener('click', () => {
            const manageProgrammesTab = document.querySelector('.tab-button[data-tab="manageProgrammes"]');
            if (manageProgrammesTab) {
                manageProgrammesTab.click();
            }
        });
    }

    // --- Form Submissions (placeholders for API calls) ---
    if (rosterForm) {
        rosterForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const selectedArtist = rosterArtistSelect.value;
            const selectedProgramme = rosterProgrammeSelect.value;
            const rosterDate = rosterDateInputAdmin.value;
            const timeSlot = rosterTimeSlotInput.value;

            if (!selectedArtist) {
                showFormMessage(rosterFormMessage, 'Please select an Artist.', true);
                return;
            }
            if (!selectedProgramme) {
                showFormMessage(rosterFormMessage, 'Please select a Programme.', true);
                return;
            }
            if (!rosterDate) {
                showFormMessage(rosterFormMessage, 'Please select a Date.', true);
                return;
            }
            if (!timeSlot) {
                showFormMessage(rosterFormMessage, 'Please enter a Time Slot.', true);
                return;
            }

            const formData = new FormData();
            formData.append('sheet', 'Roster');
            formData.append('action', 'add');
            formData.append('Date', rosterDate);
            formData.append('Artist Name', selectedArtist);
            formData.append('Time Slot', timeSlot);
            formData.append('Program', selectedProgramme); // 'Program' is the frontend input name

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.status === 'success') {
                    showFormMessage(rosterFormMessage, 'Roster entry added successfully!', false);
                    rosterForm.reset();
                    await fetchRosterData();
                } else {
                    showFormMessage(rosterFormMessage, `Error: ${result.message}`, true);
                }
            } catch (error) {
                console.error('Error submitting roster entry:', error);
                showFormMessage(rosterFormMessage, 'Error submitting roster entry. Please try again.', true);
            }
        });
    }


    if (addArtistForm) {
        addArtistForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const artistName = newArtistNameInput.value;
            const artistSpecialty = newArtistSpecialtyInput.value;
            const artistPhotoURL = newArtistPhotoURLInput.value;

            if (!artistName || !artistSpecialty) {
                showFormMessage(addArtistFormMessage, 'Artist Name and Specialty are required.', true);
                return;
            }

            const formData = new FormData();
            formData.append('sheet', 'Artists');
            formData.append('action', 'add');
            formData.append('Artist Name', artistName);
            formData.append('Specialty', artistSpecialty);
            formData.append('PhotoURL', artistPhotoURL);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.status === 'success') {
                    showFormMessage(addArtistFormMessage, 'Artist added successfully!', false);
                    addArtistForm.reset();
                    await fetchArtistsData();
                } else {
                    showFormMessage(addArtistFormMessage, `Error: ${result.message}`, true);
                }
            } catch (error) {
                console.error('Error adding artist:', error);
                showFormMessage(addArtistFormMessage, 'Error adding artist. Please try again.', true);
            }
        });
    }


    if (addProgrammeForm) {
        addProgrammeForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const programmeName = newProgrammeNameInput.value;
            const programmeDescription = newProgrammeDescriptionInput.value;
            const programmePhotoURL = newProgrammePhotoURLInput.value;

            if (!programmeName) {
                showFormMessage(addProgrammeFormMessage, 'Programme Name is required.', true);
                return;
            }

            const formData = new FormData();
            formData.append('sheet', 'Programmes');
            formData.append('action', 'add');
            formData.append('Program Name', programmeName);
            formData.append('Description', programmeDescription);
            formData.append('PhotoURL', programmePhotoURL);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.status === 'success') {
                    showFormMessage(addProgrammeFormMessage, 'Programme added successfully!', false);
                    addProgrammeForm.reset();
                    await fetchProgrammesData();
                } else {
                    showFormMessage(addProgrammeFormMessage, `Error: ${result.message}`, true);
                }
            } catch (error) {
                console.error('Error adding programme:', error);
                showFormMessage(addProgrammeFormMessage, 'Error adding programme. Please try again.', true);
            }
        });
    }


    // --- Initial Data Fetches when the page loads ---
    fetchRosterData();
    fetchArtistsData();
    // fetchProgrammesData() is called upon successful admin login.
});