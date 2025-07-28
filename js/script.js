const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyUX3UITXKZmi_QYjBYcMQ724lJU3X7XKSmGU-6q-tiCWhhDGKlozyvxioxukkptQHNrQ/exec'; // Replace with your deployed Apps Script URL

$(function() {
    // Datepicker initialization and initial loads (existing code)
    $("#datepicker").datepicker({
        dateFormat: "yy-mm-dd", // Matches Google Sheet date format
        onSelect: function(dateText) {
            console.log("Selected date:", dateText);
            loadRoster(dateText);
        }
    });

    // Set initial date to today
    const today = new Date();
    const formattedToday = $.datepicker.formatDate("yy-mm-dd", today);
    $("#datepicker").datepicker("setDate", today);
    $('#selectedDateDisplay').text($.datepicker.formatDate("D, M d, yy", today));
    loadRoster(formattedToday); // Load roster for today initially
    loadAllArtists(); // Load all artists for the "Our Makeup Artists" section

    // --- START Admin Modal Logic ---
    // This is where the new login logic should go
    const adminModal = document.getElementById("adminModal");
    const adminLoginBtn = document.getElementById("adminLoginBtn");
    const closeButton = document.querySelector(".close-button");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const loginErrorMessage = document.getElementById("loginErrorMessage");

    // When the user clicks the Admin Login button, open the modal
    if (adminLoginBtn) { // Check if the button exists
        adminLoginBtn.onclick = function() {
            adminModal.style.display = "block";
            loginErrorMessage.textContent = ""; // Clear any previous error messages
            adminLoginForm.reset(); // Clear form fields
        }
    }

    // When the user clicks on <span> (x), close the modal
    if (closeButton) { // Check if the close button exists
        closeButton.onclick = function() {
            adminModal.style.display = "none";
        }
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == adminModal) {
            adminModal.style.display = "none";
        }
    }

    // Handle Admin Login Form Submission
    if (adminLoginForm) { // Check if the form exists
        adminLoginForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            // Simple hardcoded login for demonstration
            // IMPORTANT: Change "admin" and "password123" to your desired credentials
            // In a real application, you would send these to a server-side script (like your Apps Script) for verification.
            if (username === "admin" && password === "password123") {
                loginErrorMessage.textContent = "";
                alert("Login successful!"); // Optional: show a success alert
                window.location.href = "admin.html"; // Redirect to admin panel
            } else {
                loginErrorMessage.textContent = "Invalid Username or Password. Please try again.";
            }
        });
    }
    // --- END Admin Modal Logic ---

}); // End of $(function() { ... }); block

// loadRoster and loadAllArtists functions (these can remain outside the $(function) block
// because they are called from within it, and their definitions don't rely on the DOM being ready
// to find elements *themselves* right away, only when they are called.)
async function loadRoster(date) {
    $('#rosterContent').html('<p class="no-roster-message">Loading roster...</p>'); // Loading message
    $('#selectedDateDisplay').text($.datepicker.formatDate("D, M d, yy", new Date(date)));

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