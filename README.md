# 🏪 DukaanBook — Stationery Shop Manager
**Vercel (Frontend + API) + Railway (MySQL Database)**

---

## ⚙️ SETUP GUIDE (Step by Step)

---

### STEP 1 — Railway Database Setup

1. **railway.app** pe jao → Sign up (GitHub se login karo)
2. **New Project** → **Deploy MySQL**
3. MySQL deploy hone ke baad:
   - **Connect** tab pe jao
   - Ye 5 values note karo:
     ```
     Host:     xxxxx.railway.app
     Port:     XXXXX
     Database: railway
     Username: root
     Password: xxxxxxxxxxxxxxxx
     ```
4. **Query** tab pe jao → `db/schema.sql` ka POORA content paste karo → **Run** karo
5. Schema run hone ke baad tables ban jayenge

---

### STEP 2 — Vercel Setup

1. **vercel.com** pe jao → Sign up (GitHub se)
2. Ye project GitHub pe push karo:
   ```bash
   git init
   git add .
   git commit -m "DukaanBook init"
   git branch -M main
   git remote add origin https://github.com/TUMHARA_USERNAME/dukaanbook.git
   git push -u origin main
   ```
3. Vercel pe **New Project** → GitHub repo import karo
4. **Environment Variables** add karo (Settings → Environment Variables):
   ```
   DB_HOST     = your-railway-host.railway.app
   DB_PORT     = 12345
   DB_USER     = root
   DB_PASS     = your-password
   DB_NAME     = railway
   DB_SSL      = true
   JWT_SECRET  = kuch_bhi_random_likho_yahan_jaise_sagar2024secret
   ```
5. **Deploy** karo

---

### STEP 3 — Users Setup (One Time)

Vercel deploy hone ke baad ek baar yahan jao:
```
https://tumhari-app.vercel.app/api/setup?key=dukaanbook_setup_2024
```

Ye response aayega:
```json
{ "success": true, "users": [
  { "username": "admin", "password": "admin123" },
  { "username": "dad",   "password": "dad123"   }
]}
```

✅ **Bas ho gaya!** App open karo aur login karo.

---

### STEP 4 — Test karo

- **PC:** `https://tumhari-app.vercel.app` → login
- **Phone:** Same URL browser mein → login

---

### STEP 5 — Future Updates Deploy karo

Koi bhi change karo → bas yeh run karo:
```bash
vercel --prod
```

---

## 🔐 Default Logins

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | Admin |
| dad      | dad123   | User  |

> ⚠️ Pehle login ke baad passwords change karna — abhi ye feature nahi hai, seedha Railway Query tab se UPDATE karo:
> ```sql
> UPDATE users SET password_hash='NEW_BCRYPT_HASH' WHERE username='admin';
> ```

---

## 📁 Project Structure

```
dukaanbook/
├── vercel.json              # Routing config
├── package.json
├── api/
│   ├── _db.js               # MySQL pool (Railway)
│   ├── _auth.js             # JWT helper
│   ├── login.js             # POST /api/login
│   ├── setup.js             # ONE-TIME user setup
│   ├── units.js             # GET/POST/DELETE /api/units
│   ├── groups.js            # GET/POST/DELETE /api/groups
│   ├── items.js             # CRUD /api/items
│   ├── customers.js         # CRUD /api/customers
│   ├── suppliers.js         # CRUD /api/suppliers
│   ├── sales.js             # GET/POST /api/sales
│   ├── purchases.js         # GET/POST /api/purchases
│   ├── payments.js          # POST /api/payments
│   ├── ledger.js            # GET /api/ledger
│   └── reports.js           # GET /api/reports
├── public/
│   ├── index.html           # Login page
│   └── app.html             # Main app
└── db/
    └── schema.sql           # MySQL schema + seed data
```

---

## 📊 Features

| Module | Details |
|--------|---------|
| Login | JWT auth, 30 day session |
| Dashboard | Aaj ka sales/purchase, stock value, receivable/payable |
| Sell | Customer optional (walk-in allowed), inline item add |
| Buy | Supplier select, stock auto-update |
| Items | CRUD with group + unit + pricing + stock |
| Customers | Receivables tracking + full ledger |
| Suppliers | Payables tracking + full ledger |
| Payments | Customer payment received / Supplier payment made |
| Stock Report | Low stock alert, compound unit display |
| Sales Register | Date filter + grand total |
| Purchase Register | Date filter + grand total |
| Masters | Groups CRUD, Units CRUD (simple + compound) |

---

## 📐 Compound Units

Tally ki tarah compound units support karta hai:

| Unit Name | Base | Qty |
|-----------|------|-----|
| Pkt (20 Pcs) | Pcs | 20 |
| Box (12 Pcs) | Pcs | 12 |
| Dozen (12 Pcs) | Pcs | 12 |
| Ream (500 Sheets) | Pcs | 500 |

Apna custom compound unit bhi bana sakte ho Masters mein!

---

Made with ❤️ for Sagar's Stationery Shop, Patna 🏪
"# dukaanbook" 
