const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUX3UITXKZmi_QYjBYcMQ724lJU3X7XKSmGU-6q-tiCWhhDGKlozyvxioxukkptQHNrQ/exec'; // Replace with your deployed Apps Script URL

// Global state to manage the temporary roster entries and selected date
let dailyRosterEntries = [];
let selectedDate = '';

$(function() {
    // Handle tab switching
    $('.tab-button').on('click', function() {
        const tabId = $(this).data('tab');
        showTab(tabId);
    });
    
    // Event handlers for the "Add New Artist" and "Add New Program" buttons
    $('#showAddArtistFormBtn').on('click', function() {
        showAddArtistForm();
    });

    $('#showAddProgramFormBtn').on('click', function() {
        showAddProgramForm();
    });

    // Set today's date on initial load for the date input and load its roster
    const today = new Date().toISOString().slice(0, 10);
    $('#entry-date').val(today);
    selectedDate = today;
    
    // Initial load for 'Add New Entry' tab
    loadArtistsAndProgramsForSelect();
    loadDailyRosterFromSheet(selectedDate);
    
    // Date input change event: loads the roster for the newly selected date
    $('#entry-date').on('change', async function() {
        selectedDate = $(this).val();
        await loadDailyRosterFromSheet(selectedDate);
    });

    // Add entry to the preview table
    $('#add-entry-btn').on('click', function(e) {
        e.preventDefault();
        addEntryToPreview();
    });

    // Save the entire daily roster
    $('#save-roster-btn').on('click', async function() {
        $(this).prop('disabled', true).text('Saving...');
        await saveDailyRoster();
        $(this).prop('disabled', false).text('Save Daily Roster');
    });

    // Event delegation for dynamically created delete buttons in the preview table
    $('#roster-preview-table').on('click', '.delete-entry-btn', function() {
        const index = $(this).data('index');
        dailyRosterEntries.splice(index, 1);
        renderPreviewTable();
    });
    
    // Form submission for Add Artist
    $('#addArtistForm').on('submit', async function(e) {
        e.preventDefault();
        const name = $('#artistName').val();
        const specialty = $('#artistSpecialty').val();
        const imageUrl = $('#artistImageUrl').val();

        if (!name || !specialty || !imageUrl) {
            displayMessage('artistMessage', 'Please fill all required fields.', 'error');
            return;
        }

        const data = { name, specialty, imageUrl };
        await sendDataToAppsScript('Artists', data, 'addArtistForm', 'artistMessage', 'Artist added successfully!', 'addArtist');
        loadManageArtists();
        loadArtistsAndProgramsForSelect();
        hideAddArtistForm();
    });

    // Form submission for Add Program
    $('#addProgramForm').on('submit', async function(e) {
        e.preventDefault();
        const name = $('#programName').val();
        const description = $('#programDescription').val();
        const photoUrl = $('#programPhotoUrl').val();

        if (!name || !photoUrl) {
            displayMessage('programMessage', 'Please fill all required fields (Program Name, Photo URL).', 'error');
            return;
        }

        const data = { name, description, photoUrl };
        await sendDataToAppsScript('Programs', data, 'addProgramForm', 'programMessage', 'Program added successfully!', 'addProgram');
        loadManagePrograms();
        loadArtistsAndProgramsForSelect();
        hideAddProgramForm();
    });

});

// A helper function to switch tabs
function showTab(tabId) {
    $('.tab-button').removeClass('active');
    $(`.tab-button[data-tab="${tabId}"]`).addClass('active');
    $('.tab-content').hide();
    $(`#${tabId}`).show();
    // Re-run the data load for the new tab
    if (tabId === 'manageArtists') {
        loadManageArtists();
    } else if (tabId === 'managePrograms') {
        loadManagePrograms();
    } else if (tabId === 'addEntry') {
        loadArtistsAndProgramsForSelect();
        loadDailyRosterFromSheet(selectedDate);
    }
}

function showCorsError(dataType) {
    const message = `<strong>Error:</strong> Could not load ${dataType} data. This may be a permission issue with the backend Google Apps Script. See the <a href="README.md" target="_blank">README.md</a> file for troubleshooting steps.`;
    $('#cors-error-message').html(message).show();
}

// Function to load all artists and programs for the select dropdowns
async function loadArtistsAndProgramsForSelect() {
    try {
        const artistsResponse = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllArtists`);
        const artists = await artistsResponse.json();
        // The key for the artist name is 'Artist Name' from the Apps Script
        populateSelect('entry-artist', artists, 'Artist Name');
        
        const programsResponse = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllPrograms`);
        const programs = await programsResponse.json();
        // The key for the program name is 'Name' from the Apps Script
        populateSelect('entry-program', programs, 'Name');

    } catch (error) {
        console.error("Error fetching artists or programs:", error);
        showCorsError('artists or programs');
        displayMessage('rosterMessage', 'Error loading artists or programs for dropdowns.', 'error');
    }
}

function populateSelect(selectId, data, textProperty) {
    const select = $(`#${selectId}`);
    select.empty();
    select.append('<option value="">-- Select --</option>');
    data.forEach(item => {
        select.append(`<option value="${item[textProperty]}">${item[textProperty]}</option>`);
    });
}

// Function to load existing roster entries for a given date from the sheet
async function loadDailyRosterFromSheet(date) {
    try {
        // Corrected URL: send 'Roster_Admin' to get the simplified list
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Roster_Admin&date=${date}`);
        const result = await response.json();
        if (result.success) {
            dailyRosterEntries = result.data;
            renderPreviewTable();
        } else {
            console.error("Failed to load daily roster:", result.error);
            dailyRosterEntries = []; // Clear local data on error
            renderPreviewTable();
        }
    } catch (error) {
        console.error("Error loading daily roster:", error);
        dailyRosterEntries = [];
        renderPreviewTable();
        showCorsError('daily roster');
    }
}

// Function to add a new entry from the form to the local array
function addEntryToPreview() {
    const date = $('#entry-date').val();
    const artist = $('#entry-artist').val();
    const timeSlot = $('#entry-time-slot').val();
    const program = $('#entry-program').val();

    if (!date || !artist || !timeSlot || !program) {
        alert('Please fill in all fields before adding.');
        return;
    }

    const newEntry = {
        Date: date,
        'Time Slot': timeSlot,
        'Artist Name': artist,
        Program: program
    };
    dailyRosterEntries.push(newEntry);

    renderPreviewTable();
    // Clear the form fields for the next entry
    $('#entry-artist').val('');
    $('#entry-time-slot').val('');
    $('#entry-program').val('');
    $('#entry-artist').focus();
}

// Function to render the preview table from the local array
function renderPreviewTable() {
    const tableBody = $('#roster-preview-table tbody');
    tableBody.empty();
    if (dailyRosterEntries.length === 0) {
        $('#roster-preview-table').hide();
        $('#no-preview-message').show();
    } else {
        $('#roster-preview-table').show();
        $('#no-preview-message').hide();
        dailyRosterEntries.forEach((entry, index) => {
            const row = `
                <tr>
                    <td>${entry.Date}</td>
                    <td>${entry['Time Slot']}</td>
                    <td>${entry['Artist Name']}</td>
                    <td>${entry.Program}</td>
                    <td><button class="delete-entry-btn" data-index="${index}">Delete</button></td>
                </tr>
            `;
            tableBody.append(row);
        });
    }
}

// Function to save the entire local roster array to the Google Sheet
async function saveDailyRoster() {
    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateDailyRoster',
                data: {
                    date: selectedDate,
                    entries: dailyRosterEntries
                }
            }),
            headers: {
                'Content-Type': 'text/plain' // This is required for Apps Script
            }
        });
        const result = await response.json();
        if (result.success) {
            alert('Daily roster saved successfully!');
            await loadDailyRosterFromSheet(selectedDate);
        } else {
            alert('Failed to save the daily roster: ' + result.error);
        }
    } catch (error) {
        console.error("Error saving daily roster:", error);
        alert("An error occurred while saving the roster.");
        showCorsError('saving daily roster');
    }
}

function convertGoogleDriveUrl(url) {
    if (typeof url !== 'string' || !url.includes('drive.google.com')) {
        return url; // Return original if not a G-Drive URL
    }
    const fileId = url.match(/d\/(.+?)\//);
    if (fileId && fileId[1]) {
        return `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
    }
    return url; // Return original if pattern doesn't match
}

// Global functions for add/hide forms
function showAddArtistForm() {
    $('#addArtistForm').slideDown();
    hideAddProgramForm();
}

function hideAddArtistForm() {
    $('#addArtistForm').slideUp();
    $('#addArtistForm')[0].reset();
    $('#artistMessage').hide();
}

function showAddProgramForm() {
    $('#addProgramForm').slideDown();
    hideAddArtistForm();
}

function hideAddProgramForm() {
    $('#addProgramForm').slideUp();
    $('#addProgramForm')[0].reset();
    $('#programMessage').hide();
}

async function sendDataToAppsScript(sheetName, data, formId, messageId, successMessage, action) {
    displayMessage(messageId, 'Submitting...', 'info');
    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // Apps Script expects plain text
            },
            body: JSON.stringify({ action, data })
        });
        const result = await response.json();

        if (result.success) {
            displayMessage(messageId, successMessage, 'success');
            $(`#${formId}`)[0].reset();
        } else {
            displayMessage(messageId, `Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error(`Error adding to ${sheetName}:`, error);
        showCorsError(`adding to ${sheetName}`);
        displayMessage(messageId, `Network error or server issue.`, 'error');
    }
}

function displayMessage(elementId, message, type) {
    const messageElement = $(`#${elementId}`);
    messageElement.removeClass('success error info').addClass(type).text(message).show();
    setTimeout(() => messageElement.fadeOut(2000), 5000);
}

async function loadManageArtists() {
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllArtists`);
        const artists = await response.json();
        let tableHtml = `
            <table class="manage-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Specialty</th>
                        <th>Image</th>
                    </tr>
                </thead>
                <tbody>
        `;
        if (artists.length === 0) {
            tableHtml += `<tr><td colspan="4">No artists available.</td></tr>`;
        } else {
            artists.forEach(artist => {
                const artistImageUrl = convertGoogleDriveUrl(artist['Image URL']);
                tableHtml += `
                    <tr>
                        <td>${artist['Artist ID']}</td>
                        <td>${artist['Artist Name']}</td>
                        <td>${artist.Specialty}</td>
                        <td><img src="${artistImageUrl || 'Images/placeholder-artist.png'}" alt="${artist['Artist Name']}"></td>
                    </tr>
                `;
            });
        }
        tableHtml += `</tbody></table>`;
        $('#artistsList').html(tableHtml);
    } catch (error) {
        console.error('Error loading artists for management:', error);
        $('#artistsList').html('<p class="error-message">Error loading artists data.</p>');
        showCorsError('artists');
    }
}

async function loadManagePrograms() {
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllPrograms`);
        const programs = await response.json();
        let tableHtml = `
            <table class="manage-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Photo</th>
                    </tr>
                </thead>
                <tbody>
        `;
        if (programs.length === 0) {
            tableHtml += `<tr><td colspan="4">No programs available.</td></tr>`;
        } else {
            programs.forEach(program => {
                const programPhotoUrl = convertGoogleDriveUrl(program.PhotoURL);
                tableHtml += `
                    <tr>
                        <td>${program.ID}</td>
                        <td>${program.Name}</td>
                        <td>${program.Description || 'N/A'}</td>
                        <td><img src="${programPhotoUrl || 'Images/placeholder.png'}" alt="${program.Name}"></td>
                    </tr>
                `;
            });
        }
        tableHtml += `</tbody></table>`;
        $('#programsList').html(tableHtml);
    } catch (error) {
        console.error('Error loading programs for management:', error);
        $('#programsList').html('<p class="error-message">Error loading programs data.</p>');
        showCorsError('programs');
    }
}