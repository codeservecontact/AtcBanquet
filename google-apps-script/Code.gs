/**
 * ATC Banquets – website enquiry form → email
 * Paste this whole file into a Google Apps Script project (script.google.com)
 * and deploy it as a Web App. See SETUP.md in this folder.
 */

// Where enquiries are sent. Add more addresses separated by commas.
var SEND_TO = 'atcbanquethalls@gmail.com';

var FIELDS = [
  ['name', 'Full Name'],
  ['mobile', 'Mobile Number'],
  ['email', 'Email Address'],
  ['event_type', 'Event Type'],
  ['preferred_hall', 'Preferred Banquet Hall'],
  ['event_date', 'Event Date'],
  ['expected_guests', 'Expected Guests'],
  ['additional_requirements', 'Additional Requirements']
];

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Spam trap: real visitors never fill this hidden field.
  if (p.company) return reply_({ ok: true });

  // Basic validation of the required fields.
  if (!p.name || !p.mobile || !p.event_type) return reply_({ ok: false, error: 'missing fields' });

  var rows = FIELDS.map(function (f) {
    var v = clean_(p[f[0]]) || '—';
    return '<tr><th align="left" style="padding:8px 14px;background:#f6efe0;border-bottom:1px solid #e8dcc0;white-space:nowrap">' +
      f[1] + '</th><td style="padding:8px 14px;border-bottom:1px solid #e8dcc0">' + esc_(v).replace(/\n/g, '<br>') + '</td></tr>';
  }).join('');

  var phone = clean_(p.mobile).replace(/[^0-9+]/g, '');
  var waNumber = phone.replace(/^\+/, '');
  if (waNumber.length === 10) waNumber = '91' + waNumber;

  var html =
    '<div style="font-family:Arial,sans-serif;color:#222;max-width:640px">' +
    '<h2 style="color:#9a7420;margin:0 0 12px">New event enquiry – ATC Banquets</h2>' +
    '<table cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid #e8dcc0">' + rows + '</table>' +
    '<p style="margin:18px 0 6px"><a href="tel:' + esc_(phone) + '">Call ' + esc_(clean_(p.mobile)) + '</a> &nbsp;|&nbsp; ' +
    '<a href="https://wa.me/' + esc_(waNumber) + '">WhatsApp</a></p>' +
    '<p style="color:#888;font-size:12px">Sent from the website form' + (p.page ? ' (' + esc_(clean_(p.page)) + ')' : '') +
    ' on ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a') + ' IST</p></div>';

  var plain = FIELDS.map(function (f) { return f[1] + ': ' + (clean_(p[f[0]]) || '—'); }).join('\n');

  var options = { htmlBody: html, name: 'ATC Banquets Website' };
  var email = clean_(p.email);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) options.replyTo = email; // "Reply" goes to the customer

  MailApp.sendEmail(SEND_TO,
    'New enquiry: ' + clean_(p.event_type) + ' – ' + clean_(p.name) + (p.event_date ? ' (' + clean_(p.event_date) + ')' : ''),
    plain, options);

  // Confirmation email to the customer (only if they entered a valid email address).
  if (options.replyTo) sendCustomerConfirmation_(email, p);

  return reply_({ ok: true });
}

function sendCustomerConfirmation_(to, p) {
  var name = clean_(p.name);
  var summary = FIELDS.filter(function (f) { return f[0] !== 'name' && f[0] !== 'email' && clean_(p[f[0]]); })
    .map(function (f) {
      return '<tr><th align="left" style="padding:6px 12px;background:#f6efe0;border-bottom:1px solid #e8dcc0;white-space:nowrap">' +
        f[1] + '</th><td style="padding:6px 12px;border-bottom:1px solid #e8dcc0">' + esc_(clean_(p[f[0]])).replace(/\n/g, '<br>') + '</td></tr>';
    }).join('');

  var html =
    '<div style="font-family:Arial,sans-serif;color:#222;max-width:600px">' +
    '<h2 style="color:#9a7420;margin:0 0 12px">Thank you for your enquiry, ' + esc_(name) + '!</h2>' +
    '<p>We have received your event enquiry at <b>Hotel ATC Banquets</b>. Our events team will call you shortly to confirm availability and share a quotation.</p>' +
    '<p style="margin:16px 0 8px"><b>Your details</b></p>' +
    '<table cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid #e8dcc0">' + summary + '</table>' +
    '<p style="margin-top:18px">Need to talk sooner? Call <a href="tel:+919014444341">+91 90144 44341</a> or ' +
    '<a href="https://wa.me/919014444341">WhatsApp us</a>. You can also simply reply to this email.</p>' +
    '<p style="color:#666;font-size:13px;margin-top:22px">Hotel ATC Banquets<br>Pillar No. 766, KPHB Main Road, Kukatpally, Hyderabad 500072<br>Open daily · 11:00 AM – 11:00 PM</p></div>';

  var plain = 'Thank you for your enquiry, ' + name + '!\n\n' +
    'We have received your event enquiry at Hotel ATC Banquets. Our events team will call you shortly.\n\n' +
    'Call +91 90144 44341 or WhatsApp https://wa.me/919014444341\n\nHotel ATC Banquets, KPHB Main Road, Kukatpally, Hyderabad';

  MailApp.sendEmail(to, 'We received your enquiry – Hotel ATC Banquets', plain,
    { htmlBody: html, name: 'Hotel ATC Banquets', replyTo: SEND_TO });
}

// Lets you open the Web App URL in a browser to check it is live.
function doGet() {
  return ContentService.createTextOutput('ATC Banquets enquiry endpoint is running.');
}

// Run this once from the editor to grant permission and send yourself a test email.
function testEmail() {
  doPost({ parameter: {
    name: 'Test Customer', mobile: '+91 98765 43210', email: '', event_type: 'Wedding',
    preferred_hall: 'Premium Hall 02', event_date: '2027-02-14', expected_guests: '250–300 Guests',
    additional_requirements: 'This is a test enquiry.'
  } });
}

function clean_(v) { return String(v == null ? '' : v).trim().slice(0, 2000); }
function esc_(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function reply_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
