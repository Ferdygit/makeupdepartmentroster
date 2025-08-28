# TV Derana Makeup Department Roster

This is a simple web application to manage the daily roster for the TV Derana Makeup Department.

## IMPORTANT: Backend Configuration

This website relies on a Google Apps Script to function as its backend for storing and retrieving roster data. For the website to work correctly, the Google Apps Script must be deployed as a web app and configured to allow public access.

If you are seeing an "Error loading data" message on the website, it is very likely that the Google Apps Script is not configured correctly.

### How to Fix the Google Apps Script Permission Issue

1.  **Open your Google Apps Script project.**
2.  Click on the **Deploy** button and select **New deployment**.
3.  In the "Select type" dialog, choose **Web app**.
4.  In the "Configuration" section, make the following selections:
    *   **Description:** (Optional) You can add a description for this version of the deployment.
    *   **Execute as:** "Me" (your Google account).
    *   **Who has access:** **"Anyone"**. This is the most important step. It allows the website to fetch data from the script without requiring a login.
5.  Click **Deploy**.
6.  **Authorize the script** if prompted. You may see a warning from Google that the app is not verified. You will need to click "Advanced" and then "Go to (unsafe)" to proceed.
7.  After deploying, you will be given a new **Web app URL**. Copy this URL.
8.  Open the `js/script.js` and `js/admin.js` files in this project.
9.  Find the line at the top of each file that says `const APPS_SCRIPT_WEB_APP_URL = '...';`
10. Replace the old URL with the new Web app URL you just copied.
11. Save the files and the website should now be able to load data correctly.

## Admin Login

The admin login credentials are hardcoded in `js/script.js`. For security, you should change these credentials.

*   **Username:** `admin`
*   **Password:** `password123`

You can change these values in the following lines of `js/script.js`:
```javascript
if (username === "admin" && password === "password123") {
```
