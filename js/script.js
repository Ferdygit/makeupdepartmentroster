const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzJGIM6Ny_Jq0DQA6AuD9Wwv-gXqLz9bc1KCxfvq2hW0-5pWk8AcCAWb2lLV1NR40TY9g/exec';

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

    // Admin Modal Logic
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
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();

        if (!data || Object.keys(data).length === 0) {
            $('#rosterContent').html('<p class="no-roster-message">No roster entries for this date.</p>');
            return;
        }

        let rosterHtml = '';
        for (const programName in data) {
            const program = data[programName];
            let desc = program.programDetails.description ? `<span style="font-size:smaller;color:#888;"> (${program.programDetails.description})</span>` : '';
            rosterHtml += `
                <div class="program-entry">
                    <div class="program-info">
                        <img src="${program.programDetails.photoUrl || 'placeholder.png'}" alt="${program.programDetails.name}" class="program-thumbnail">
                        <span>${program.programDetails.name}${desc}</span>
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
        if (!response.ok) throw new Error("Network response was not ok");
        const artists = await response.json();

        let artistsHtml = '';
        if (!artists || artists.length === 0) {
            artistsHtml = '<p>No artists found.</p>';
        } else {
            artists.forEach(artist => {
                artistsHtml += `
                    <div class="artist-card">
                        <img src="${artist['Image URL'] || 'placeholder-artist.png'}" alt="${artist['Artist Name']}">
                        <h4>${artist['Artist Name']}</h4>
                        <p>${artist.Specialty}</p>
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