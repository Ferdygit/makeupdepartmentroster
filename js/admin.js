const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUX3UITXKZmi_QYjBYcMQ724lJU3X7XKSmGU-6q-tiCWhhDGKlozyvxioxukkptQHNrQ/exec'; // Replace with your deployed Apps Script URL

$(function() {
    // Datepicker for Roster tab
    $("#rosterDate").datepicker({
        dateFormat: "yy-mm-dd"
    });

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
            loadArtistsForSelect();
            loadProgramsForSelect();
        }
    });

    // Initial load for 'Add New Entry' tab
    loadArtistsForSelect();
    loadProgramsForSelect();
    
    // Set initial date for roster entry to today
    const today = new Date();
    $("#rosterDate").datepicker("setDate", today);

    // Form submission for Add Roster Entry
    $('#addRosterForm').on('submit', async function(e) {
        e.preventDefault();
        const date = $('#rosterDate').val();
        const artistName = $('#rosterArtist').val();
        const timeSlot = $('#rosterTimeSlot').val();
        const program = $('#rosterProgram').val();

        if (!date || !artistName || !timeSlot || !program) {
            displayMessage('rosterMessage', 'Please fill all required fields.', 'error');
            return;
        }

        const data = { date, artistName, timeSlot, program };
        await sendDataToAppsScript('Roster', data, 'addRosterForm', 'rosterMessage', 'Roster entry added successfully!');
        // Optionally, refresh the main roster page or a section of it here
    });

    // Form submission for Add Artist
    $('#addArtistForm').on('submit', async function(e) {
        e.preventDefault();
        const name = $('#artistName').val();
        const specialty = $('#artistSpecialty').val();
        // const imageUrl = document.getElementById('artistImageUrl').value; // No longer needed

        if (!name || !specialty || !imageUrl) {
            displayMessage('artistMessage', 'Please fill all required fields.', 'error');
            return;
        }

        const data = { name, specialty, imageUrl };
        await sendDataToAppsScript('Artists', data, 'addArtistForm', 'artistMessage', 'Artist added successfully!');
        loadManageArtists(); // Refresh artist list
        loadArtistsForSelect(); // Refresh dropdown on roster tab
        hideAddArtistForm(); // Hide the form after submission
    });

    // Form submission for Add Program
    $('#addProgramForm').on('submit', async function(e) {
        e.preventDefault();
        const name = $('#programName').val();
        const description = $('#programDescription').val();
        // const imageUrl = document.getElementById('artistImageUrl').value; // No longer needed

        if (!name || !photoUrl) {
            displayMessage('programMessage', 'Please fill all required fields (Program Name, Photo URL).', 'error');
            return;
        }

        const data = { name, description, photoUrl };
        await sendDataToAppsScript('Programs', data, 'addProgramForm', 'programMessage', 'Program added successfully!');
        loadManagePrograms(); // Refresh program list
        loadProgramsForSelect(); // Refresh dropdown on roster tab
        hideAddProgramForm(); // Hide the form after submission
    });
});

async function sendDataToAppsScript(sheetName, data, formId, messageId, successMessage) {
    displayMessage(messageId, 'Submitting...', 'info');
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=${sheetName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // Apps Script expects plain text for e.postData.contents
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            displayMessage(messageId, successMessage, 'success');
            $(`#${formId}`)[0].reset(); // Clear the form
        } else {
            displayMessage(messageId, `Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error(`Error adding to ${sheetName}:`, error);
        displayMessage(messageId, `Network error or server issue.`, 'error');
    }
}

function displayMessage(elementId, message, type) {
    const messageElement = $(`#${elementId}`);
    messageElement.removeClass('success error info').addClass(type).text(message).show();
    setTimeout(() => messageElement.fadeOut(2000), 5000); // Hide after 5 seconds
}

async function loadArtistsForSelect() {
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllArtists`);
        const artists = await response.json();
        const select = $('#rosterArtist');
        select.empty();
        select.append('<option value="">Select Artist</option>');
        artists.forEach(artist => {
            select.append(`<option value="${artist.name}">${artist.name}</option>`);
        });
    } catch (error) {
        console.error('Error loading artists for select:', error);
        displayMessage('rosterMessage', 'Error loading artists for dropdown.', 'error');
    }
}

async function loadProgramsForSelect() {
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllPrograms`);
        const programs = await response.json();
        const select = $('#rosterProgram');
        select.empty();
        select.append('<option value="">Select Program</option>');
        programs.forEach(program => {
            select.append(`<option value="${program.name}">${program.name}</option>`);
        });
    } catch (error) {
        console.error('Error loading programs for select:', error);
        displayMessage('rosterMessage', 'Error loading programs for dropdown.', 'error');
    }
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
                tableHtml += `
                    <tr>
                        <td>${artist.id}</td>
                        <td>${artist.name}</td>
                        <td>${artist.specialty}</td>
                        <td><img src="${artist.imageUrl || 'placeholder-artist.png'}" alt="${artist.name}"></td>
                    </tr>
                `;
            });
        }
        tableHtml += `</tbody></table>`;
        $('#artistsList').html(tableHtml);
    } catch (error) {
        console.error('Error loading artists for management:', error);
        $('#artistsList').html('<p class="error-message">Error loading artists data.</p>');
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
                tableHtml += `
                    <tr>
                        <td>${program.id}</td>
                        <td>${program.name}</td>
                        <td>${program.description || 'N/A'}</td>
                        <td><img src="${program.photoUrl || 'placeholder.png'}" alt="${program.name}"></td>
                    </tr>
                `;
            });
        }
        tableHtml += `</tbody></table>`;
        $('#programsList').html(tableHtml);
    } catch (error) {
        console.error('Error loading programs for management:', error);
        $('#programsList').html('<p class="error-message">Error loading programs data.</p>');
    }
}

function showAddArtistForm() {
    $('#addArtistForm').slideDown();
}

function hideAddArtistForm() {
    $('#addArtistForm').slideUp();
    $('#addArtistForm')[0].reset(); // Clear form fields
    $('#artistMessage').hide(); // Hide any messages
}

function showAddProgramForm() {
    $('#addProgramForm').slideDown();
}

function hideAddProgramForm() {
    $('#addProgramForm').slideUp();
    $('#addProgramForm')[0].reset(); // Clear form fields
    $('#programMessage').hide(); // Hide any messages
}