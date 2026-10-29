# Practical 13: AI API Integration into a Web Application

**Course Outcomes / Program Outcomes:** CO6 / PO3, PO5, PO12  
**Objective:** To integrate an external AI service into the existing application and understand responsible AI usage.

---

## 1. Architecture Overview & Information Flow

### AI Integration & Graceful Degradation Topology

```
                       USER BROWSER (React Frontend)
                                     │
                 1. Types title: "Implement OAuth2 Login"
                 2. Clicks: [✨ Suggest with AI]
                 3. Shows loading state: "✨ Thinking..."
                                     │
                                     │ POST /api/ai/generate-description { title }
                                     ▼
               EXPRESS BACKEND (task-manager-api / Port 5000)
                                     │
               ├── 1. Rate Limiter (Max 5 requests/minute per client IP)
               │      Exceeded? ──► Return HTTP 429 Too Many Requests
               │
               ├── 2. API Key Management (Server-Side Only via .env)
               │      Keeps OPENAI_API_KEY / GEMINI_API_KEY secret
               │
               ▼
   EXTERNAL AI SERVICE (OpenAI gpt-4o-mini / Google Gemini 1.5 Flash)
               │
               ├──────────────────────────┬──────────────────────────┐
               ▼                          ▼                          ▼
      [Success Response]           [API Error / Timeout]     [Rate Limited]
       Status: 200                  Status: 200 (Graceful)    Status: 429
       { description: "...",        { description: "...",     { error: "..." }
         fallback: false }            fallback: true }               │
               │                          │                          │
               └──────────────────────────┴──────────────────────────┘
                                          │
                                          ▼
                      REACT UI PRESENTATION (TaskPage.jsx)
          ├── Populates description into editable textarea
          ├── If fallback: Shows notice "ℹ️ Fallback description used"
          └── Displays Disclaimer: "⚡ AI suggestions are assistive; review before saving"
```

---

## 2. Implemented Configurations & Files

### 1. Backend Route with Graceful Fallback (`task-manager-api/server.js`)
Configured to handle AI generation, in-memory rate limiting, and automatic graceful degradation:
```javascript
// POST /api/ai/generate-description
app.post('/api/ai/generate-description', async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required to generate a description' });
  }

  const cleanTitle = title.trim();
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'client-default';
  const now = Date.now();

  // Rate Limiting Check (Supplementary Problem 2: Max 5 req/min)
  const timestamps = (aiRateLimitMap.get(clientIp) || []).filter((ts) => now - ts < 60000);
  if (timestamps.length >= 5) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a minute before requesting another AI description.',
      rateLimited: true,
    });
  }
  timestamps.push(now);
  aiRateLimitMap.set(clientIp, timestamps);

  // OpenAI Integration
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_key_here') {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful task assistant. Provide a concise, professional 1-2 sentence description for a task based on its title.' },
          { role: 'user', content: `Write a short task description for: ${cleanTitle}` },
        ],
        max_tokens: 120,
      });

      const generated = completion.choices[0]?.message?.content?.trim();
      if (generated) {
        return res.status(200).json({ description: generated, fallback: false, source: 'openai' });
      }
    } catch (err) {
      console.warn(`[AI Service] OpenAI API error: ${err.message}. Engaging graceful fallback.`);
    }
  }

  // Graceful Degradation Fallback (Core Requirement)
  const fallbackText = `Coordinate and execute all planned action items for "${cleanTitle}". Review deliverables against project requirements.`;
  return res.status(200).json({
    description: fallbackText,
    fallback: true,
    message: 'AI service temporarily unavailable. Provided intelligent fallback description.',
  });
});
```

### 2. Frontend React Integration (`src/pages/TaskPage.jsx`)
Features a dedicated AI generation trigger, loading feedback, editable suggestion textarea, and ethical disclaimer:
* **Trigger:** Click `✨ Suggest with AI`.
* **Loading State (Supplementary Problem 1):** Button disables and displays `✨ Thinking...`.
* **Editable Suggestion:** AI response is loaded into an editable `<textarea>` so users retain complete editorial control.
* **Disclaimer (Supplementary Problem 3):** Displays `⚡ AI suggestions are assistive; please review and modify before saving.`

### 3. Environment Variable Template (`task-manager-api/.env.example`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/taskdb

# API Key stored strictly server-side (NEVER commit actual .env)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 3. Key Questions & Theoretical Analysis

### Q1: Why must the AI API key be called from the backend rather than directly from the React frontend?
**Answer:**  
1. **Exposure Vulnerability:**  
   Code executing in a React SPA is downloaded and run directly in the client's browser. Any environment variable or API key bundled into frontend code (even via Vite `VITE_` prefixes) is completely readable by anyone opening the browser's Developer Tools (Network tab, Application storage, or source code bundles).
2. **Quota Theft & Financial Risk:**  
   If an external AI API key (like OpenAI or Gemini) is exposed in frontend code, malicious actors can extract the key, automate thousands of requests, drain API credit quotas, and run up thousands of dollars in billing costs.
3. **Control & Security Boundary:**  
   Routing AI requests through an Express backend establishes an authoritative security perimeter. The server can authenticate users (JWT/sessions), validate input data, implement rate limiting, enforce content filtering, and log usage without exposing credentials.

---

### Q2: What does 'graceful degradation' mean in this context, and why does it matter for a feature that depends on a third-party service outside your control?
**Answer:**  
* **Definition:**  
  Graceful degradation is the architectural design capability of an application to continue operating cleanly when a non-essential or third-party feature experiences downtime, timeouts, or failure.
* **Why it matters for third-party AI APIs:**  
  External AI services are distributed across remote cloud infrastructure subject to:
  * Network latency and dropped packets
  * Third-party outages or maintenance windows
  * Exhausted account quotas or invalid billing credentials
  * Rate-limiting throttles (HTTP 429)
* **Application Impact:**  
  If the AI service fails, the Task Management application **must never crash or show an unhandled 500 error**. By catching errors on the backend and returning HTTP 200 with `{ description: fallbackTemplate, fallback: true }`, the core application—creating, viewing, editing, and deleting tasks—remains 100% functional.

---

### Q3: What are the privacy and governance implications of sending task data to an external AI API, and what kind of data should never be sent this way?
**Answer:**  
1. **Governance & Privacy Risks:**  
   * **Third-Party Processing:** External AI providers process prompts on external data center servers. Unless an enterprise zero-data-retention (ZDR) agreement is signed, providers may log prompts for security inspection, compliance audits, or even use customer data to train future models.
   * **Regulatory Compliance:** Transmitting sensitive data may violate legal frameworks including **GDPR** (Europe), **HIPAA** (Healthcare), **FERPA** (Student records), or **SOC 2**.
2. **Data that Must NEVER be Sent to External AI APIs:**  
   * **Personally Identifiable Information (PII):** Full names, phone numbers, home addresses, government IDs, passport numbers.
   * **Authentication Secrets & Credentials:** Passwords, API keys, database connection strings, JWT tokens, private SSH keys.
   * **Proprietary & Financial Data:** Credit card numbers, banking records, trade secrets, confidential internal meeting notes, patent-pending algorithms.
3. **Mitigation Best Practices:**  
   * Implement prompt sanitization / redaction filters.
   * Send only the minimum necessary data (e.g., generic title only).
   * Include transparent user consent and AI disclaimers in the user interface.

---

## 4. Supplementary Solutions Implemented

1. **Frontend Loading State:** While awaiting the AI API response, the button dynamically transitions to `✨ Thinking...` and disables inputs to prevent duplicate concurrent submissions.
2. **In-Memory Rate Limiting:** Enforced via `aiRateLimitMap` in `server.js` (maximum 5 requests per minute per IP address). Excessive requests are rejected with status 429 and informative headers.
3. **Clear AI Disclaimer:** Prominently featured in `TaskPage.jsx` directly beneath the description field to comply with responsible AI guidelines.

---

## 5. Lab Demonstration & Verification Guide

### Test 1: Testing Successful AI Generation
1. In `task-manager-api/.env`, supply your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-...
   ```
2. Start the backend: `cd task-manager-api && npm start`.
3. Open `http://localhost:5173` and enter task title: `Design Database Schema`.
4. Click `✨ Suggest with AI`.
5. Observe the description automatically generated in the textarea.

### Test 2: Testing Graceful Degradation (Fallback Path)
1. In `task-manager-api/.env`, supply an invalid key or comment it out:
   ```env
   OPENAI_API_KEY=invalid_key_testing_fallback
   ```
2. Enter a task title: `Review Final Project Documentation`.
3. Click `✨ Suggest with AI`.
4. Confirm:
   * The server logs: `[AI Service] OpenAI API error: ... Engaging graceful fallback.`
   * The app **does not crash**.
   * A smart fallback template appears in the textarea:  
     `Coordinate and execute all planned action items for "Review Final Project Documentation". Review deliverables against project requirements.`
   * A status note appears: `ℹ️ Fallback description used (AI service unavailable or key not configured). Feel free to customize.`

### Test 3: Automated Test Verification
Run the automated test suite verifying both the AI route and rate limiter:
```bash
cd task-manager-api
npm test
```
*Expected: 8 passed, 1 total test suite.*
