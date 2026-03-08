/**
 * Google Apps Script — Booking Calendar
 * ──────────────────────────────────────
 * HOW TO DEPLOY:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this entire file into the editor
 * 3. Click Deploy → New deployment
 * 4. Type: Web app
 * 5. Execute as: Me (your Google account)
 * 6. Who has access: Anyone
 * 7. Click Deploy and copy the web app URL
 * 8. Open script.js in your portfolio and replace PASTE_YOUR_APPS_SCRIPT_URL_HERE with that URL
 */

function doPost(e) {
    try {
        const data  = JSON.parse(e.postData.contents);
        const { name, email, date, time } = data;

        // Parse date string "YYYY-MM-DD"
        const [year, month, day] = date.split('-').map(Number);

        // Parse time string "9:00 AM" or "2:00 PM"
        const match   = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        let hours     = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period  = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours  = 0;

        const startDate = new Date(year, month - 1, day, hours, minutes, 0);
        const endDate   = new Date(startDate.getTime() + 30 * 60 * 1000);

        const calendar = CalendarApp.getDefaultCalendar();
        const event    = calendar.createEvent(
            `30-min call with ${name}`,
            startDate,
            endDate,
            {
                description: `Booking from puttstrife.github.io\n\nName: ${name}\nEmail: ${email}`,
                guests:      email,
                sendInvites: true,
            }
        );

        return ContentService
            .createTextOutput(JSON.stringify({ success: true, eventId: event.getId() }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// Required for CORS preflight
function doGet() {
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
}
