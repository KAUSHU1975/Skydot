# Skydot

## Ismein kya hai (What's in this folder)

- **index.html** — Poori Skydot website ek hi file mein, abhi chalane ke liye ready hai (demo mode). Isme:
  - Login / signup page
  - Pehli baar login karne par naam poochta hai aur naam se welcome karta hai (free plan mein bhi)
  - Chat screen — AI ka apna ek **avatar/character** hai (chehra jisme aankhen aur mooh hai) jo baat karte waqt animate hota hai, taaki lage ki AI aapse baat kar raha hai
  - Website mein enter karte hi (login/signup ke baad, ya naam poochte waqt) **AI khud bolta hai** — koi button dabana nahi padta, seedha awaaz mein welcome karta hai
  - Chat mein jab bhi AI reply deta hai, wo bhi khud bol kar sunata hai (sirf text nahi)
  - File upload — Free plan mein **5 baar**, Pro plan mein **unlimited**
  - Voice command (🎤 button se bolo, AI sunkar text banata hai aur bol kar jawab deta hai) — Free mein **3 baar**, Pro mein **unlimited**
  - Pricing page — Free vs **Skydot Pro ₹99/month**
  - Settings page — naam change, plan/usage dekhna
  - Logout
  - Bas isi file ko double-click karke browser mein kholo, turant chalega — koi install nahi chahiye.

- **server.js** — Real backend ka starting point (Node.js + Express). Isme login/signup, upload-limit, voice-limit, aur ₹99/month subscription ke liye real routes bane hue hain, lekin teen jagah pe aapko apni cheezein daalni hongi (neeche dekho).

## index.html abhi demo mode mein kyun hai

Ek single HTML file mein real AI (jaisa ChatGPT/Claude), real payment aur real user-database chalana possible nahi hai — inko ek server chahiye hota hai. Isliye:
- index.html **UI aur poora flow** dikhata hai, data browser mein hi (localStorage) save hota hai.
- server.js woh asli backend hai jise ek server par deploy karke real website banaya ja sakta hai.

## Real website banane ke liye 3 cheezein daalni hongi (server.js mein)

1. **Real AI jawab** — `/api/chat` route mein OpenAI ya Anthropic API key daalo (comment mein example diya hai).
2. **Real payment (₹99/month)** — `/api/create-subscription` mein Razorpay (India ke liye best) ya Stripe ki keys daalo, aur webhook se payment verify karke plan ko 'pro' karo.
3. **Real database** — abhi ek simple `db.json` file use ho rahi hai; production ke liye ise Postgres, MySQL ya MongoDB se replace karo.

## Chalane ka tareeka (backend)

```
npm init -y
npm install express bcryptjs jsonwebtoken multer dotenv cors
node server.js
```

Phir `http://localhost:3000` kholo.

## Hosting

Jab ready ho jaye to Render, Railway, ya kisi VPS par deploy kar sakte ho, aur apna domain (skydot.com jaisa kuch) laga sakte ho.
