const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUX3UITXKZmi_QYjBYcMQ724lJU3X7XKSmGU-6q-tiCWhhDGKlozyvxioxukkptQHNrQ/exec'; // Replace with your deployed Apps Script URL

// Global state to manage the temporary roster entries and selected date
let dailyRosterEntries = [];
let selectedDate = '';

$(function() {
    // Handle tab switching
    $('.tab-button').on('click', function() {
        $('.tab-button').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').hide();
        $('#' + $(this).data('tab')).show();
        
        // Load data when tab is active
        if ($(this).data('tab') === 'manageArtists') {
            loadManageArtists();
        } else if ($(this).data('tab') === 'managePrograms') {
            loadManagePrograms();
        } else if ($(this).data('tab') === 'addEntry') {
            loadArtistsAndProgramsForSelect();
        }
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

    // Button to switch to the add new artist/program tab
    $('#add-artist-btn').on('click', function() {
        showTab('manageArtists');
    });

    $('#add-program-btn').on('click', function() {
        showTab('managePrograms');
    });

    // --- YOUR EXISTING CODE REMAINS BELOW, with minor adjustments to call the new functions ---

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
        await sendDataToAppsScript('Artists', data, 'addArtistForm', 'artistMessage', 'Artist added successfully!');
        loadManageArtists(); // Refresh artist list
        loadArtistsAndProgramsForSelect(); // Refresh dropdown on roster tab
        hideAddArtistForm(); // Hide the form after submission
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
        await sendDataToAppsScript('Programs', data, 'addProgramForm', 'programMessage', 'Program added successfully!');
        loadManagePrograms(); // Refresh program list
        loadArtistsAndProgramsForSelect(); // Refresh dropdown on roster tab
        hideAddProgramForm(); // Hide the form after submission
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

// Function to load all artists and programs for the select dropdowns
async function loadArtistsAndProgramsForSelect() {
    try {
        const artistsResponse = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllArtists`);
        const artists = await artistsResponse.json();
        populateSelect('entry-artist', artists, 'name'); // Use 'name' as the value and text property
        
        const programsResponse = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllPrograms`);
        const programs = await programsResponse.json();
        populateSelect('entry-program', programs, 'name'); // Use 'name' as the value and text property

    } catch (error) {
        console.error("Error fetching artists or programs:", error);
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
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Roster&date=${date}`);
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
    }
}

// Function to add a new entry from the form to the local array
function addEntryToPreview() {
    const date = $('#entry-date').val();
    const artist = $('#entry-artist').val();
    const timeSlot = $('#entry-time-slot').val();
    const programme = $('#entry-program').val();

    if (!date || !artist || !timeSlot || !programme) {
        alert('Please fill in all fields before adding.');
        return;
    }

    const newEntry = {
        Date: date,
        'Time Slot': timeSlot,
        Artist: artist,
        Programme: programme
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
                    <td>${entry.Artist}</td>
                    <td>${entry.Programme}</td>
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
            // Reload the data from the sheet to confirm the save
            await loadDailyRosterFromSheet(selectedDate);
        } else {
            alert('Failed to save the daily roster: ' + result.error);
        }
    } catch (error) {
        console.error("Error saving daily roster:", error);
        alert("An error occurred while saving the roster.");
    }
}

// These functions remain from your previous code. No changes are needed.
async function sendDataToAppsScript(sheetName, data, formId, messageId, successMessage) { /* ... */ }
function displayMessage(elementId, message, type) { /* ... */ }
async function loadManageArtists() { /* ... */ }
async function loadManagePrograms() { /* ... */ }
function showAddArtistForm() { /* ... */ }
function hideAddArtistForm() { /* ... */ }
function showAddProgramForm() { /* ... */ }
function hideAddProgramForm() { /* ... */ }