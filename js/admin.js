const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUX3UITXKZmi_QYjBYcMQ724lJU3X7XKSmGU-6q-tiCWhhDGKlozyvxioxukkptQHNrQ/exec';

let currentDate = null;
let previewEntries = []; // Array of {date, timeSlot, artistName, program, source: 'local'|'backend'}

$(function() {
    // Datepicker for roster date
    $("#rosterDate").datepicker({
        dateFormat: "yy-mm-dd",
        onSelect: function(dateText) {
            setSelectedDate(dateText);
        }
    });

    // Set initial date to today
    const today = $.datepicker.formatDate("yy-mm-dd", new Date());
    $("#rosterDate").datepicker("setDate", today);
    setSelectedDate(today);

    // Load artists and programs for dropdowns
    loadArtistsForSelect();
    loadProgramsForSelect();

    // Tab switching logic (unchanged from your file)
    $('.tab-button').on('click', function() {
        $('.tab-button').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').hide();
        $('#' + $(this).data('tab')).show();

        if ($(this).data('tab') === 'manageArtists') {
            loadManageArtists();
        } else if ($(this).data('tab') === 'managePrograms') {
            loadManagePrograms();
        } else if ($(this).data('tab') === 'addEntry') {
            loadArtistsForSelect();
            loadProgramsForSelect();
        }
    });

    // Add roster entry to preview table (NOT backend!)
    $('#addRosterForm').on('submit', function(e) {
        e.preventDefault();
        const date = $('#rosterDate').val();
        const artistName = $('#rosterArtist').val();
        const timeSlot = $('#rosterTimeSlot').val();
        const program = $('#rosterProgram').val();

        if (!date || !artistName || !timeSlot || !program) {
            displayMessage('rosterMessage', 'Please fill all required fields.', 'error');
            return;
        }

        previewEntries.push({
            date,
            timeSlot,
            artistName,
            program,
            source: 'local' // Mark as locally added
        });
        renderPreviewTable();
        this.reset();
    });

    // Click: batch submit all previewed entries to backend
    $('#submitBatchBtn').on('click', async function() {
        if (previewEntries.length === 0) {
            displayMessage('rosterMessage', 'No entries to submit.', 'error');
            return;
        }
        $(this).prop("disabled", true).text("Submitting...");

        // Split into new and toDelete
        const newEntries = previewEntries.filter(e => e.source === 'local');
        const deleteEntries = previewEntries.filter(e => e.source === 'backend' && e._delete);

        const payload = {
            date: currentDate,
            add: newEntries.map(e => ({
                date: e.date,
                timeSlot: e.timeSlot,
                artistName: e.artistName,
                program: e.program
            })),
            delete: deleteEntries.map(e => ({
                date: e.date,
                timeSlot: e.timeSlot,
                artistName: e.artistName,
                program: e.program
            }))
        };

        try {
            // You need to implement 'batchRoster' handler in Apps Script!
            const resp = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Roster&type=batchRoster`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            const result = await resp.json();
            if (result.success) {
                displayMessage('rosterMessage', 'Roster updated successfully!', 'success');
                // Reload preview table from backend for the selected date
                setSelectedDate(currentDate);
            } else {
                displayMessage('rosterMessage', result.error || 'Error saving roster.', 'error');
            }
        } catch (err) {
            displayMessage('rosterMessage', 'Network error or server issue.', 'error');
        }
        $(this).prop("disabled", false).text("Add entries for the selected date");
    });

    // Delete entry in preview table (uses event delegation for dynamic rows)
    $('#previewRosterTable').on('click', '.delete-entry-btn', function() {
        const idx = $(this).data('idx');
        if (previewEntries[idx].source === 'backend') {
            // Mark for deletion but keep in table (strike through for UI clarity)
            previewEntries[idx]._delete = !previewEntries[idx]._delete;
        } else {
            // Remove local unsaved entry
            previewEntries.splice(idx, 1);
        }
        renderPreviewTable();
    });
});

// Helper: Set selected date and load all roster entries for that date
function setSelectedDate(date) {
    currentDate = date;
    $('#rosterDate').val(date);

    // Load roster entries for this date from backend
    fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Roster&date=${date}&type=flat`)
        .then(r => r.json())
        .then(data => {
            // Data should be an array of {date, timeSlot, artistName, program}
            previewEntries = [];
            if (Array.isArray(data)) {
                // Mark as source: 'backend'
                for (const row of data) {
                    previewEntries.push({...row, source: 'backend'});
                }
            }
            renderPreviewTable();
        })
        .catch(() => {
            previewEntries = [];
            renderPreviewTable();
        });
}

// Draw preview table
function renderPreviewTable() {
    const tbody = $('#previewRosterTable tbody');
    tbody.empty();

    if (previewEntries.length === 0) {
        $('#previewRosterTable').hide();
        $('#previewRosterEmpty').show();
        return;
    }
    $('#previewRosterTable').show();
    $('#previewRosterEmpty').hide();

    previewEntries.forEach((entry, idx) => {
        const isDelete = entry._delete;
        tbody.append(`
            <tr style="${isDelete ? "text-decoration:line-through;background:#fbeaea;" : ""}">
                <td>${entry.date}</td>
                <td>${entry.timeSlot}</td>
                <td>${entry.artistName}</td>
                <td>${entry.program}</td>
                <td>
                    <button type="button" class="add-new-artist-program-btn delete-entry-btn" data-idx="${idx}">
                        ${entry.source === 'backend' ? (isDelete ? 'Undo' : 'Delete') : 'Delete'}
                    </button>
                </td>
            </tr>
        `);
    });
}

// Remainder: dropdown loads, manage tabs, add artist/program forms unchanged from your existing admin.js

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
        displayMessage('rosterMessage', 'Error loading programs for dropdown.', 'error');
    }
}

function displayMessage(elementId, message, type) {
    const messageElement = $(`#${elementId}`);
    messageElement.removeClass('success error info').addClass(type).text(message).show();
    setTimeout(() => messageElement.fadeOut(2000), 5000);
}

// ... (rest of your admin.js for manageArtists, managePrograms, show/hide forms, etc.)

// --- Manage Artists Tab ---
async function loadManageArtists() {
    const listDiv = $('#artistsList');
    listDiv.html('<p>Loading artists...</p>');
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllArtists`);
        const artists = await response.json();
        let tableHtml = `<table class="manage-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Specialty</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;
        if (artists.length > 0) {
            artists.forEach(artist => {
                tableHtml += `
                    <tr>
                        <td><img src="${artist.imageUrl || 'Images/placeholder-artist.png'}" alt="${artist.name}"></td>
                        <td>${artist.name}</td>
                        <td>${artist.specialty}</td>
                        <td><button onclick="deleteArtist('${artist.id}')">Delete</button></td>
                    </tr>
                `;
            });
        } else {
            tableHtml += `<tr><td colspan="4">No artists found.</td></tr>`;
        }
        tableHtml += `</tbody></table>`;
        listDiv.html(tableHtml);
    } catch (error) {
        listDiv.html('<p>Error loading artists.</p>');
    }
}

// --- Manage Programs Tab ---
async function loadManagePrograms() {
    const listDiv = $('#programsList');
    listDiv.html('<p>Loading programs...</p>');
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllPrograms`);
        const programs = await response.json();
        let tableHtml = `<table class="manage-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;
        if (programs.length > 0) {
            programs.forEach(program => {
                tableHtml += `
                    <tr>
                        <td><img src="${program.photoUrl || 'Images/placeholder.png'}" alt="${program.name}"></td>
                        <td>${program.name}</td>
                        <td>${program.description || ''}</td>
                        <td><button onclick="deleteProgram('${program.id}')">Delete</button></td>
                    </tr>
                `;
            });
        } else {
            tableHtml += `<tr><td colspan="4">No programs found.</td></tr>`;
        }
        tableHtml += `</tbody></table>`;
        listDiv.html(tableHtml);
    } catch (error) {
        listDiv.html('<p>Error loading programs.</p>');
    }
}

// --- Form Visibility ---
function showAddArtistForm() { $('#addArtistForm').show(); }
function hideAddArtistForm() { $('#addArtistForm').hide(); }
function showAddProgramForm() { $('#addProgramForm').show(); }
function hideAddProgramForm() { $('#addProgramForm').hide(); }

// --- Form Submissions ---
$('#addArtistForm').on('submit', async function(e) {
    e.preventDefault();
    const payload = {
        name: $('#artistName').val(),
        specialty: $('#artistSpecialty').val(),
        imageUrl: $('#artistImageUrl').val(),
    };
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Artists&type=addArtist`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            displayMessage('artistMessage', 'Artist added successfully!', 'success');
            loadManageArtists();
            hideAddArtistForm();
            this.reset();
        } else {
            displayMessage('artistMessage', result.error || 'Error saving artist.', 'error');
        }
    } catch (err) {
        displayMessage('artistMessage', 'Network error or server issue.', 'error');
    }
});

$('#addProgramForm').on('submit', async function(e) {
    e.preventDefault();
    const payload = {
        name: $('#programName').val(),
        description: $('#programDescription').val(),
        photoUrl: $('#programPhotoUrl').val(),
    };
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Programs&type=addProgram`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            displayMessage('programMessage', 'Program added successfully!', 'success');
            loadManagePrograms();
            hideAddProgramForm();
            this.reset();
        } else {
            displayMessage('programMessage', result.error || 'Error saving program.', 'error');
        }
    } catch (err) {
        displayMessage('programMessage', 'Network error or server issue.', 'error');
    }
});

// --- Delete Functions ---
async function deleteArtist(id) {
    if (!confirm('Are you sure you want to delete this artist?')) return;
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Artists&type=deleteRow&id=${id}`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            displayMessage('artistMessage', 'Artist deleted successfully!', 'success');
            loadManageArtists();
        } else {
            displayMessage('artistMessage', result.error || 'Error deleting artist.', 'error');
        }
    } catch (err) {
        displayMessage('artistMessage', 'Network error or server issue.', 'error');
    }
}

async function deleteProgram(id) {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Programs&type=deleteRow&id=${id}`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            displayMessage('programMessage', 'Program deleted successfully!', 'success');
            loadManagePrograms();
        } else {
            displayMessage('programMessage', result.error || 'Error deleting program.', 'error');
        }
    } catch (err) {
        displayMessage('programMessage', 'Network error or server issue.', 'error');
    }
}