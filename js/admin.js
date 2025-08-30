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

    // Tab switching logic
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
            source: 'local'
        });
        renderPreviewTable();
        $('#rosterArtist').val('');
        $('#rosterTimeSlot').val('');
        $('#rosterProgram').val('');
        // Do NOT reset the whole form, so the date stays!
    });

    // Click: batch submit all previewed entries to backend
    $('#submitBatchBtn').on('click', async function() {
        if (previewEntries.length === 0) {
            displayMessage('rosterMessage', 'No entries to submit.', 'error');
            return;
        }
        $(this).prop("disabled", true).text("Submitting...");

        const newEntries = previewEntries.filter(e => e.source === 'local');
        const deleteEntries = previewEntries.filter(e => e.source === 'backend' && e._delete);

        const payload = {
            action: "batchRoster",
            data: {
                date: currentDate,
                add: newEntries.map(e => ({
                    date: e.date,
                    time: e.timeSlot,
                    artist: e.artistName,
                    task: e.program
                })),
                delete: deleteEntries.map(e => ({
                    date: e.date,
                    time: e.timeSlot,
                    artist: e.artistName,
                    task: e.program
                }))
            }
        };

        try {
            const resp = await fetch(APPS_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            const result = await resp.json();
            if (result.success) {
                displayMessage('rosterMessage', 'Roster updated successfully!', 'success');
                setSelectedDate(currentDate);
            } else {
                displayMessage('rosterMessage', result.error || 'Error saving roster.', 'error');
            }
        } catch (err) {
            displayMessage('rosterMessage', 'Network error or server issue. Check browser console.', 'error');
        }
        $(this).prop("disabled", false).text("Add entries for the selected date");
    });

    // Delete entry in preview table (uses event delegation for dynamic rows)
    $('#previewRosterTable').on('click', '.delete-entry-btn', function() {
        const idx = $(this).data('idx');
        if (previewEntries[idx].source === 'backend') {
            previewEntries[idx]._delete = !previewEntries[idx]._delete;
        } else {
            previewEntries.splice(idx, 1);
        }
        renderPreviewTable();
    });
});

// Helper: Set selected date and load all roster entries for that date
function setSelectedDate(date) {
    currentDate = date;
    $('#rosterDate').val(date);

    fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Roster&date=${date}&type=flat`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            previewEntries = [];
            if (Array.isArray(data)) {
                for (const row of data) {
                    const entry = {
                        date: row.date || row.Date,
                        timeSlot: row.time || row["Time Slot"],
                        artistName: row.artist || row["Artist Name"],
                        program: row.task || row["Program"],
                        source: 'backend'
                    };
                    previewEntries.push(entry);
                }
            }
            renderPreviewTable();
        })
        .catch(error => {
            displayMessage('rosterMessage', 'Failed to load roster data. Check browser console for more details.', 'error');
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

// Dropdown loads for Add Entry
async function loadArtistsForSelect() {
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllArtists`);
        const artists = await response.json();
        const select = $('#rosterArtist');
        select.empty();
        select.append('<option value="">Select Artist</option>');
        artists.forEach(artist => {
            select.append(`<option value="${artist["Artist Name"]}">${artist["Artist Name"]}</option>`);
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
            select.append(`<option value="${program["Program Name"]}">${program["Program Name"]}</option>`);
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
                        <td><img src="${artist["Image URL"] || 'Images/placeholder-artist.png'}" alt="${artist["Artist Name"]}"></td>
                        <td>${artist["Artist Name"]}</td>
                        <td>${artist["Specialty"]}</td>
                        <td><button onclick="deleteArtist('${artist["ID"]}')">Delete</button></td>
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
                        <td><img src="${program["PhotoURL"] || 'Images/placeholder.png'}" alt="${program["Program Name"]}"></td>
                        <td>${program["Program Name"]}</td>
                        <td>${program["Description"] || ''}</td>
                        <td><button onclick="deleteProgram('${program["ID"]}')">Delete</button></td>
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
        action: "addArtist",
        data: {
            name: $('#artistName').val(),
            specialty: $('#artistSpecialty').val(),
            imageUrl: $('#artistImageUrl').val(),
        }
    };
    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
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
        displayMessage('artistMessage', 'Network error or server issue. Check browser console.', 'error');
    }
});

$('#addProgramForm').on('submit', async function(e) {
    e.preventDefault();
    const payload = {
        action: "addProgram",
        data: {
            name: $('#programName').val(),
            description: $('#programDescription').val(),
            photoUrl: $('#programPhotoUrl').val(),
        }
    };
    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
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
        displayMessage('programMessage', 'Network error or server issue. Check browser console.', 'error');
    }
});

// --- Delete Functions ---
async function deleteArtist(id) {
    if (!confirm('Are you sure you want to delete this artist?')) return;
    // Implement the deletion logic as per your backend (not shown here)
    // ...
}

async function deleteProgram(id) {
    if (!confirm('Are you sure you want to delete this program?')) return;
    // Implement the deletion logic as per your backend (not shown here)
    // ...
}