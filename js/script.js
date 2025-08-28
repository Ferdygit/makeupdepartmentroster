const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUX3UITXKZmi_QYjBYcMQ724lJU3X7XKSmGU-6q-tiCWhhDGKlozyvxioxukkptQHNrQ/exec';

$(function() {
    // Datepicker initialization
    $("#datepicker").datepicker({
        dateFormat: "yy-mm-dd",
        onSelect: function(dateText) {
            setSelectedDate(dateText);
        }
    });

    // Set initial date to today
    const today = new Date();
    const formattedToday = $.datepicker.formatDate("yy-mm-dd", today);
    $("#datepicker").datepicker("setDate", today);
    setSelectedDate(formattedToday);

    // Load all artists on page load
    loadAllArtists();

    // --- Admin Modal Logic ---
    const adminModal = document.getElementById("adminModal");
    const adminLoginBtn = document.getElementById("adminLoginBtn");
    const closeButton = document.querySelector(".close-button");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const loginErrorMessage = document.getElementById("loginErrorMessage");

    if (adminLoginBtn) {
        adminLoginBtn.onclick = function() {
            adminModal.style.display = "block";
            loginErrorMessage.textContent = "";
            adminLoginForm.reset();
        };
    }
    if (closeButton) {
        closeButton.onclick = function() {
            adminModal.style.display = "none";
        };
    }
    window.onclick = function(event) {
        if (event.target == adminModal) {
            adminModal.style.display = "none";
        }
    };
    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            if (username === "admin" && password === "password123") {
                loginErrorMessage.textContent = "";
                alert("Login successful!");
                window.location.href = "admin.html";
            } else {
                loginErrorMessage.textContent = "Invalid Username or Password. Please try again.";
            }
        });
    }
    // --- End Admin Modal Logic ---
});

// Helper function to set and load the selected date's roster
function setSelectedDate(date) {
    $('#selectedDateDisplay').text($.datepicker.formatDate("D, M d, yy", new Date(date)));
    loadRoster(date);
}

async function loadRoster(date) {
    $('#rosterContent').html('<p class="no-roster-message">Loading roster...</p>');
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?sheet=Roster&date=${date}`);
        const data = await response.json();

        if (Object.keys(data).length === 0) {
            $('#rosterContent').html('<p class="no-roster-message">No roster entries for this date.</p>');
            return;
        }

        let rosterHtml = '';
        for (const programName in data) {
            const program = data[programName];
            rosterHtml += `
                <div class="program-entry">
                    <div class="program-info">
                        <img src="${program.programDetails.photoUrl || 'placeholder.png'}" alt="${program.programDetails.name}" class="program-thumbnail">
                        <span>${program.programDetails.name}</span>
                    </div>
                    <div class="artist-crew">
            `;
            program.artists.forEach(artist => {
                rosterHtml += `
                        <div class="crew-member">
                            <img src="${artist.imageUrl || 'placeholder-artist.png'}" alt="${artist.name}" class="artist-thumbnail">
                            <span>${artist.name}: ${artist.timeSlot}</span>
                        </div>
                `;
            });
            rosterHtml += `
                    </div>
                </div>
            `;
        }
        $('#rosterContent').html(rosterHtml);

    } catch (error) {
        console.error('Error loading roster:', error);
        $('#rosterContent').html('<p class="no-roster-message">Error loading roster. Please try again later.</p>');
    }
}

async function loadAllArtists() {
    try {
        const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?type=getAllArtists`);
        const artists = await response.json();

        let artistsHtml = '';
        if (artists.length === 0) {
            artistsHtml = '<p>No artists found.</p>';
        } else {
            artists.forEach(artist => {
                artistsHtml += `
                    <div class="artist-card">
                        <img src="${artist.imageUrl || 'placeholder-artist.png'}" alt="${artist.name}">
                        <h4>${artist.name}</h4>
                        <p>${artist.specialty}</p>
                    </div>
                `;
            });
        }
        $('.artist-list').html(artistsHtml);

    } catch (error) {
        console.error('Error loading artists:', error);
        $('.artist-list').html('<p>Error loading artists.</p>');
    }
}