# Turn on the enquiry form (emails to atcbanquethalls@gmail.com)

1. Sign in to Google as **atcbanquethalls@gmail.com** and open https://script.google.com → **New project**.
2. Delete the sample code, paste in everything from `Code.gs`, and rename the project "ATC Enquiry Form". Click **Save**.
3. In the function dropdown pick **testEmail** → **Run** → **Review permissions** → choose the account →
   *Advanced* → *Go to ATC Enquiry Form* → **Allow**. A test enquiry email should arrive.
4. **Deploy → New deployment** → gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   → **Deploy** and copy the **Web app URL** (starts with `https://script.google.com/macros/s/…/exec`).
5. In `contact.html`, replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL. Save and re-deploy the website.

If you change `Code.gs` later: **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**
(the URL stays the same).
