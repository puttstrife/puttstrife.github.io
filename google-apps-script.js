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

/* ── Server-side input validation ── */
function isValidName(name) {
    if (!name || name.trim().length < 2 || name.trim().length > 60) return false;
    // Only letters (including accented), spaces, hyphens, apostrophes, dots
    return /^[a-zA-ZÀ-ÿ\s'\-.]+$/.test(name.trim());
}

function isValidEmail(email) {
    if (!email || email.trim().length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

function isValidDate(date) {
    // Must be YYYY-MM-DD format and a real calendar date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    var parts = date.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getFullYear() === parts[0] && d.getMonth() === parts[1] - 1 && d.getDate() === parts[2];
}

function isValidTime(time) {
    // Only allow the exact time slots offered on the booking calendar
    var allowed = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
    return allowed.indexOf(time) !== -1;
}

function doGet(e) {
    try {
        var name  = (e.parameter.name  || '').trim();
        var email = (e.parameter.email || '').trim();
        var date  = (e.parameter.date  || '').trim();
        var time  = (e.parameter.time  || '').trim();

        // ── Validate all inputs before touching Google Calendar ──
        if (!isValidName(name)) {
            return ContentService
                .createTextOutput(JSON.stringify({ success: false, error: 'Invalid name.' }))
                .setMimeType(ContentService.MimeType.JSON);
        }
        if (!isValidEmail(email)) {
            return ContentService
                .createTextOutput(JSON.stringify({ success: false, error: 'Invalid email address.' }))
                .setMimeType(ContentService.MimeType.JSON);
        }
        if (!isValidDate(date)) {
            return ContentService
                .createTextOutput(JSON.stringify({ success: false, error: 'Invalid date.' }))
                .setMimeType(ContentService.MimeType.JSON);
        }
        if (!isValidTime(time)) {
            return ContentService
                .createTextOutput(JSON.stringify({ success: false, error: 'Invalid time slot.' }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // ── Parse date ──
        var parts = date.split('-').map(Number);
        var year  = parts[0];
        var month = parts[1];
        var day   = parts[2];

        // ── Parse time ──
        var match   = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        var hours   = parseInt(match[1], 10);
        var minutes = parseInt(match[2], 10);
        var period  = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours  = 0;

        var startDate = new Date(year, month - 1, day, hours, minutes, 0);
        var endDate   = new Date(startDate.getTime() + 30 * 60 * 1000);

        var calendar = CalendarApp.getDefaultCalendar();
        var event    = calendar.createEvent(
            '30-min call with ' + name,
            startDate,
            endDate,
            {
                description: 'Booking from puttstrife.github.io\n\nName: ' + name + '\nEmail: ' + email,
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
