# ☁️ MathBlast — Complete AWS Deployment Guide
### From Zero to Live on AWS Cloud (Free Tier)

> [!IMPORTANT]
> **Prerequisites before starting:**
> - AWS Free Tier account created ✅ (you said you're logged in)
> - MathBlast project files ready at `C:\Users\nikcr\.gemini\antigravity\scratch\mathblast\`
> - Keep this guide open while working in the AWS Console

---

## 📋 What We're Setting Up

| Step | Service | Purpose | Time |
|---|---|---|---|
| 1 | **S3** | Host your website files | 10 min |
| 2 | **CloudFront** | Make it fast globally (CDN) | 10 min |
| 3 | **Cognito** | User login/register | 15 min |
| 4 | **DynamoDB** | Store scores in cloud | 5 min |
| 5 | **Lambda** | Backend serverless functions | 20 min |
| 6 | **API Gateway** | Connect frontend to Lambda | 15 min |
| 7 | **Connect** | Update frontend with live URLs | 10 min |

**Total time: ~90 minutes**

---

## ⚠️ IMPORTANT SETTINGS (use these everywhere)

| Setting | Value |
|---|---|
| **Region** | `ap-south-1` (Asia Pacific - Mumbai) — closest to India |
| **Free Tier** | Make sure it says "Free tier eligible" on everything |
| **Project Name** | `mathblast` (use this in all resource names) |

---

---

# STEP 1 — Amazon S3 (Website Hosting)

## 1.1 — Set Your Region

1. Log into **console.aws.amazon.com**
2. Look at the **top-right corner** — you'll see a region name like "N. Virginia"
3. Click it → Select **"Asia Pacific (Mumbai) ap-south-1"**
4. ✅ You should now see "Mumbai" in the top right

---

## 1.2 — Open S3

1. In the top search bar, type **`S3`**
2. Click **"S3"** (first result — "Scalable Storage in the Cloud")
3. You'll see the S3 dashboard

---

## 1.3 — Create a Bucket

1. Click the orange **"Create bucket"** button
2. Fill in the form:

**Bucket name:**
```
mathblast-website-2025
```
> ⚠️ Bucket names must be globally unique. If this name is taken, add random numbers like `mathblast-website-9284`

**AWS Region:**
```
ap-south-1 (Asia Pacific - Mumbai)
```

**Object Ownership:**
- Select **"ACLs disabled (recommended)"**

**Block Public Access settings:**
- ❌ **UNCHECK** "Block all public access"
- A warning will appear — check the box that says **"I acknowledge that the current settings might result in this bucket and the objects within becoming public"**

> This is required so people can visit your website!

**Bucket Versioning:** Leave OFF (disabled)

**Default encryption:** Leave as default (SSE-S3)

3. Scroll to bottom → Click orange **"Create bucket"** button
4. ✅ You'll see "Successfully created bucket"

---

## 1.4 — Enable Static Website Hosting

1. Click on your new bucket name **"mathblast-website-2025"**
2. Click the **"Properties"** tab (4th tab at top)
3. Scroll all the way to the bottom
4. Find **"Static website hosting"** → Click **"Edit"**
5. Select **"Enable"**
6. **Index document:** type `index.html`
7. **Error document:** type `index.html`
8. Click **"Save changes"**

---

## 1.5 — Add Bucket Policy (Make it Public)

1. Click the **"Permissions"** tab
2. Scroll to **"Bucket policy"** → Click **"Edit"**
3. Delete anything in the text box, then paste this **exactly**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mathblast-website-2025/*"
    }
  ]
}
```
> ⚠️ Replace `mathblast-website-2025` with YOUR actual bucket name if different

4. Click **"Save changes"**
5. ✅ You'll see an orange "Publicly accessible" badge — that's correct!

---

## 1.6 — Upload Your Files

1. Click the **"Objects"** tab
2. Click **"Upload"** button
3. Click **"Add files"** → Select ALL these files from your project folder:
   - `index.html`
   - `game.html`
   - `leaderboard.html`
   - `auth.html`
   - `stats.html`
   - `architecture.html`

4. Click **"Add folder"** → Select the `css` folder
5. Click **"Add folder"** again → Select the `js` folder
6. Click orange **"Upload"** button at the bottom
7. Wait for upload to complete (should take 30 seconds)
8. ✅ Click **"Close"** when done

---

## 1.7 — Test Your Website

1. Go to **"Properties"** tab
2. Scroll to bottom → **"Static website hosting"**
3. You'll see a URL like:
   ```
   http://mathblast-website-2025.s3-website.ap-south-1.amazonaws.com
   ```
4. Copy that URL and open it in your browser
5. ✅ **Your website should be LIVE!** (HTTP only — we'll add HTTPS with CloudFront next)

> 📝 **Save this URL** — you'll need it for CloudFront setup

---

---

# STEP 2 — CloudFront (CDN + HTTPS)

> CloudFront makes your site load fast worldwide AND gives you a proper HTTPS URL

## 2.1 — Open CloudFront

1. In the search bar, type **`CloudFront`**
2. Click **"CloudFront"**
3. Click **"Create a CloudFront distribution"**

---

## 2.2 — Configure Distribution

**Origin domain:**
- Click the text box → A dropdown appears with your S3 bucket
- Select your bucket: `mathblast-website-2025.s3-website.ap-south-1.amazonaws.com`
- ⚠️ Make sure to select the `.s3-website.` URL, NOT the plain `.s3.amazonaws.com` one

**Origin path:** Leave empty

**Name:** Auto-filled — leave as is

**Origin access:** Select **"Public"**

---

**Default cache behavior:**

**Viewer protocol policy:** Select **"Redirect HTTP to HTTPS"**

**Allowed HTTP methods:** Select **"GET, HEAD"**

**Cache policy:** Select **"CachingOptimized"**

---

**Settings (scroll down):**

**Default root object:** type `index.html`

**Price class:** Select **"Use only North America and Europe"**
> (This is cheaper — you can change later)

**WAF:** Select **"Do not enable security protections"** (free)

---

3. Click **"Create distribution"** (orange button)
4. You'll see **"Status: Deploying"** — this takes **5-15 minutes**
5. ✅ When Status changes to "Enabled" — your CDN is live!

---

## 2.3 — Get Your CloudFront URL

1. Click on your distribution
2. Find **"Distribution domain name"** — it looks like:
   ```
   d1abc2defgh.cloudfront.net
   ```
3. Copy this URL — open it in browser
4. ✅ Your site now loads with **HTTPS!** 🎉

> 📝 **Save this URL** — this is your main website URL going forward!

---

---

# STEP 3 — AWS Cognito (User Registration & Login)

## 3.1 — Open Cognito

1. Search **`Cognito`** in the top bar
2. Click **"Amazon Cognito"**
3. Make sure region is still **ap-south-1**
4. Click **"Create user pool"**

---

## 3.2 — Configure Sign-in

**Step 1 - Configure sign-in experience:**

**Provider types:** Select **"Cognito user pool"**

**Sign-in options:**
- ✅ Check **"Email"**
- (Uncheck Username if checked)

Click **"Next"**

---

## 3.3 — Configure Security

**Step 2 - Configure security requirements:**

**Password policy:**
- Select **"Cognito defaults"**

**Multi-factor authentication:**
- Select **"No MFA"** (keep it simple for now)

**User account recovery:**
- ✅ Keep "Enable self-service account recovery" checked
- Select **"Email only"**

Click **"Next"**

---

## 3.4 — Configure Sign-up

**Step 3 - Configure sign-up experience:**

**Self-registration:** Keep **"Enable self-registration"** checked

**Attribute verification:** Keep defaults

**Required attributes:** Click **"Add attribute"** → Select **"name"**
> This lets us store the user's name

Click **"Next"**

---

## 3.5 — Configure Email

**Step 4 - Configure message delivery:**

**Email provider:** Select **"Send email with Cognito"**
> This uses the free Cognito email (50 emails/day free)

Click **"Next"**

---

## 3.6 — Name Your Pool

**Step 5 - Integrate your app:**

**User pool name:** `mathblast-users`

**Hosted UI:** Leave **OFF** (unchecked)

**App type:** Select **"Public client"**

**App client name:** `mathblast-web-client`

**Client secret:** Select **"Don't generate a client secret"**
> ⚠️ IMPORTANT — must be "Don't generate" for browser apps!

Click **"Next"**

---

## 3.7 — Review and Create

**Step 6 - Review and create:**
- Scroll through to verify settings
- Click **"Create user pool"**

---

## 3.8 — Save Your Cognito IDs

After creation, you'll see your user pool. **Save these values — you'll need them later:**

1. Click on `mathblast-users`
2. On the overview page, copy:
   - **User pool ID:** looks like `ap-south-1_AbCdEfGhI`
3. Click **"App clients"** on the left sidebar
4. Click on `mathblast-web-client`
5. Copy:
   - **Client ID:** looks like `1abc2def3ghi4jkl5mno6pqr`

📝 **Note these down:**
```
User Pool ID: ap-south-1_XXXXXXXXX
App Client ID: XXXXXXXXXXXXXXXXXXXXXXXXX
```

---

---

# STEP 4 — DynamoDB (Score Database)

## 4.1 — Open DynamoDB

1. Search **`DynamoDB`**
2. Click **"DynamoDB"**
3. Click **"Create table"**

---

## 4.2 — Create Scores Table

**Table name:** `MathBlastScores`

**Partition key:**
- Name: `userId`
- Type: **String**

**Sort key:**
- Click **"Add sort key"**
- Name: `timestamp`
- Type: **String**

**Table settings:** Select **"Default settings"**

Click **"Create table"** (orange button)

✅ Table created in ~30 seconds

---

## 4.3 — Add a Global Secondary Index (for Leaderboard)

1. Click on `MathBlastScores` table
2. Click **"Indexes"** tab
3. Click **"Create index"**

**Partition key:** `gameMode` (String)
**Sort key:** `score` (Number)
**Index name:** `gameMode-score-index`
**Projected attributes:** All

Click **"Create index"**

✅ This lets us query top scores by game mode — perfect for leaderboard!

---

---

# STEP 5 — AWS Lambda (Backend Functions)

## 5.1 — Open Lambda

1. Search **`Lambda`**
2. Click **"Lambda"**
3. Make sure region is **ap-south-1**

---

## 5.2 — Create "Save Score" Function

1. Click **"Create function"**
2. Select **"Author from scratch"**

**Function name:** `mathblast-save-score`
**Runtime:** Select **"Node.js 18.x"**
**Architecture:** x86_64

**Permissions:**
- Select **"Create a new role with basic Lambda permissions"**

Click **"Create function"**

---

### Write the Save Score Code

1. You'll see a code editor. Delete everything in it.
2. Paste this code:

```javascript
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "ap-south-1" });

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body);
    const { userId, userName, score, mode, difficulty, correct, wrong, streak, timestamp } = body;

    const params = {
      TableName: "MathBlastScores",
      Item: {
        userId:     { S: userId || "anonymous" },
        timestamp:  { S: timestamp || new Date().toISOString() },
        userName:   { S: userName || "Player" },
        score:      { N: String(score || 0) },
        gameMode:   { S: mode || "Speed Round" },
        difficulty: { S: difficulty || "easy" },
        correct:    { N: String(correct || 0) },
        wrong:      { N: String(wrong || 0) },
        streak:     { N: String(streak || 0) }
      }
    };

    await client.send(new PutItemCommand(params));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Score saved!" })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to save score" })
    };
  }
};
```

3. Click **"Deploy"** button (orange) — wait for "Changes deployed ✅"

---

### Give Lambda Permission to Access DynamoDB

1. Click **"Configuration"** tab → Click **"Permissions"**
2. Click on the **Role name** link (opens IAM in new tab)
3. Click **"Add permissions"** → **"Attach policies"**
4. Search `AmazonDynamoDBFullAccess`
5. Check the box next to it
6. Click **"Add permissions"**
7. ✅ Close that IAM tab, go back to Lambda

---

## 5.3 — Create "Get Leaderboard" Function

1. Go back to Lambda → Click **"Create function"** again
2. Select **"Author from scratch"**

**Function name:** `mathblast-get-leaderboard`
**Runtime:** Node.js 18.x

Click **"Create function"**

### Write the Leaderboard Code

Delete everything → paste this:

```javascript
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "ap-south-1" });

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const params = {
      TableName: "MathBlastScores",
      Limit: 100
    };

    const result = await client.send(new ScanCommand(params));

    const scores = (result.Items || []).map(item => ({
      userId:    item.userId?.S,
      userName:  item.userName?.S || "Player",
      score:     parseInt(item.score?.N || "0"),
      mode:      item.gameMode?.S || "Speed Round",
      difficulty:item.difficulty?.S || "easy",
      streak:    parseInt(item.streak?.N || "0"),
      correct:   parseInt(item.correct?.N || "0"),
      wrong:     parseInt(item.wrong?.N || "0"),
      timestamp: item.timestamp?.S
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ scores: scores.slice(0, 50) })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch leaderboard" })
    };
  }
};
```

Click **"Deploy"** ✅

**Give this function DynamoDB permissions too** (same steps as 5.2 above)

---

---

# STEP 6 — API Gateway (REST API)

## 6.1 — Open API Gateway

1. Search **`API Gateway`**
2. Click **"API Gateway"**
3. Click **"Create API"**
4. Select **"REST API"** (not private) → Click **"Build"**

---

## 6.2 — Configure the API

**API name:** `mathblast-api`
**Description:** `MathBlast REST API for scores and leaderboard`
**API endpoint type:** Regional

Click **"Create API"**

---

## 6.3 — Create /scores Resource & POST Method

### Create /scores resource:
1. Click **"Create resource"**
2. **Resource path:** `/`
3. **Resource name:** `scores`
4. ✅ Check **"CORS"** checkbox
5. Click **"Create resource"**

### Create POST method:
1. Make sure `/scores` is selected (highlighted) in the left sidebar
2. Click **"Create method"**
3. **Method type:** POST
4. **Integration type:** Lambda function
5. **Lambda function:** start typing `mathblast-save-score` → select it
6. ✅ Check **"Lambda proxy integration"**
7. Click **"Create method"**
8. A popup asks for permission → Click **"OK"**

---

## 6.4 — Create /leaderboard Resource & GET Method

1. Click **"Create resource"** (click on the root `/` first)
2. **Resource name:** `leaderboard`
3. ✅ Check **"CORS"** checkbox
4. Click **"Create resource"**

### Create GET method:
1. Make sure `/leaderboard` is selected
2. Click **"Create method"**
3. **Method type:** GET
4. **Integration type:** Lambda function
5. **Lambda function:** `mathblast-get-leaderboard`
6. ✅ Check **"Lambda proxy integration"**
7. Click **"Create method"**
8. Click **"OK"** on the permission popup

---

## 6.5 — Deploy the API

1. Click **"Deploy API"** button (orange)
2. **Deployment stage:** Select **"*New stage*"**
3. **Stage name:** `prod`
4. **Description:** `Production`
5. Click **"Deploy"**

---

## 6.6 — Get Your API URL

After deploying:
1. Click on **"Stages"** in left sidebar → Click **"prod"**
2. You'll see **"Invoke URL"** at the top:
   ```
   https://abc1def2gh.execute-api.ap-south-1.amazonaws.com/prod
   ```
3. 📝 **Save this URL!** This is your API base URL.

Your endpoints are now:
```
POST  https://your-api-url/prod/scores       ← Save a score
GET   https://your-api-url/prod/leaderboard  ← Get top scores
```

---

---

# STEP 7 — Connect Frontend to AWS (Update the JS)

Now we connect your website to the real AWS services!

> [!IMPORTANT]
> At this point you should have saved:
> - ✅ Cognito User Pool ID (like `ap-south-1_XXXXXXXXX`)
> - ✅ Cognito App Client ID (long string)
> - ✅ API Gateway URL (like `https://XXXXXXX.execute-api.ap-south-1.amazonaws.com/prod`)

---

## 7.1 — Create AWS Config File

In your project folder `C:\Users\nikcr\.gemini\antigravity\scratch\mathblast\js\`, we'll create a new file `aws-config.js` with your real values. **(Tell me and I'll create it with your actual IDs!)**

The file will look like:

```javascript
// aws-config.js — Your AWS configuration
const AWS_CONFIG = {
  region: 'ap-south-1',
  
  // Cognito
  userPoolId: 'ap-south-1_XXXXXXXXX',     // ← Your User Pool ID
  clientId:   'XXXXXXXXXXXXXXXXXXXXXXXXX', // ← Your App Client ID
  
  // API Gateway
  apiUrl: 'https://XXXXXXX.execute-api.ap-south-1.amazonaws.com/prod',
};
```

---

## 7.2 — Re-Upload to S3

After updating the JS files:
1. Go back to **S3** → your bucket
2. Click **"Upload"**
3. Upload the updated JS files
4. Click **"Upload"** → Done!

---

## 7.3 — Invalidate CloudFront Cache

So CloudFront serves fresh files immediately:
1. Go to **CloudFront**
2. Click your distribution
3. Click **"Invalidations"** tab
4. Click **"Create invalidation"**
5. Enter `/*` in the paths field
6. Click **"Create invalidation"**

Wait 1-2 minutes → your site is updated! ✅

---

---

# 🎉 FINAL CHECK — Everything Working

Open your CloudFront URL and test:

| Test | What to do | Expected |
|---|---|---|
| ✅ Website loads | Open CloudFront URL | Home page appears |
| ✅ HTTPS | Check URL bar | 🔒 padlock shows |
| ✅ Game works | Click "Play Now" | Game starts, score works |
| ✅ Register | Go to auth page, register | Account created |
| ✅ Leaderboard | Play a game, check leaderboard | Your score appears |
| ✅ Stats page | Login + view stats | Your history shows |

---

# 📊 For Your Presentation — Key Points

**"How is this a cloud application?"**
> "The app is not running on my computer. It runs entirely on AWS. S3 stores files. CloudFront delivers them globally. Cognito handles authentication. Lambda processes score submissions. DynamoDB stores all scores. API Gateway connects frontend to backend — all serverless, all managed by AWS."

**"Why AWS?"**
> "AWS is the world's #1 cloud provider with 33% market share. It provides high availability, auto-scaling, global CDN, and enterprise security — all on the free tier for this project."

**"What is serverless?"**
> "Lambda functions run only when called. There is no always-on server. This means zero idle cost, infinite scalability, and AWS manages all infrastructure."

---

> [!TIP]
> **For your major project next semester:** You can extend this by adding:
> - AWS SES (send emails when someone beats your score)
> - AWS SNS (push notifications)
> - AWS Rekognition (AI features)
> - AWS Amplify (mobile app version)
