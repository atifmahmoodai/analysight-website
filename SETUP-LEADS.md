# Lead capture with Google Sheets (free, no expiry)

Website leads are saved to a Google Sheet by a small Google Apps Script, and you get an email for each one.
Setup takes about 10 minutes and is done once.

## 1. Create the sheet
1. Go to https://sheets.new (signed in as atifmahmood.ai@gmail.com).
2. Name it **AnalySight Leads**.

## 2. Add the script
1. In the sheet: **Extensions > Apps Script**.
2. Delete everything in `Code.gs` and paste the full contents of `apps-script/Code.gs` from this repository.
3. Check the settings at the top:
   - `NOTIFY_EMAIL`: where alerts go.
   - `ALERT_PRIORITIES`: use `["hot", "warm"]` if you don't want emails for cold leads.
4. Click **Save** (disk icon). Name the project **AnalySight Leads**.

## 3. Run setup once
1. In the function dropdown at the top, choose **setup**, then click **Run**.
2. Google asks for permission: **Review permissions > choose your account > Advanced > Go to AnalySight Leads (unsafe) > Allow**.
   ("Unsafe" only means Google hasn't reviewed your personal script. It's your own code in your own account.)
3. You should get an email "AnalySight lead alerts are on", and the sheet gets a **Leads** tab with column headers.

## 4. Deploy as a web app
1. **Deploy > New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Settings:
   - Description: `Website leads`
   - Execute as: **Me**
   - Who has access: **Anyone**   (required, otherwise visitors get a Google login page)
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Optional check: open that URL in a browser. You should see `{"ok":true,"service":"AnalySight lead capture",...}`.

## 5. Point the website at it
1. Open `assets/js/config.js` and replace the `leadWebhook` value with your Web app URL.
2. Push:
   ```bash
   git add -A
   git commit -m "Send leads to Google Sheets"
   git push
   ```
3. After a minute, submit the form on https://analysight.com/#/analytics?lead. You should see a reference number,
   a new row in the sheet, and an alert email.

## Changing the script later
Edit the code, then **Deploy > Manage deployments > pencil icon > Version: New version > Deploy**.
This keeps the same URL. ("New deployment" would create a new URL that the website doesn't know about.)

## What the script does
- Validates name, email, project type and message (same rules as the website).
- Ignores spam bots that fill the hidden `website` field.
- Saves a repeated submission (same email and message within 2 minutes) only once.
- Scores each lead 0 to 100 and marks it hot (60+), warm (35 to 59) or cold.
- Protects the sheet from formula injection (values starting with = + - @ are stored as text).
- Emails you the lead; replying to that email goes straight to the visitor. A failed email never loses the lead.

Limits: Google allows about 100 alert emails a day on a free account, far more than a consultancy site needs.
