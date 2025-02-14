# Identity Reconciliation 

The project uses **Prisma, Express, and TypeScript** to build a backend API and deploy it on **Render**.

## Endpoint : https://bitespeed-z6or.onrender.com/identify

---

##  **Getting Started**

### **1. Clone the Repository**

```sh
git clone https://github.com/Bhargav16exd/bitespeed
```

### **2. Install Dependencies**

```sh
npm install
```

### **3. Set Up Environment Variables**

Create a `.env` file in the root directory and add:

```sh
DATABASE_URL=postgresql://username:password@host:port/database_name
PORT=5000
```

For Render, set `DATABASE_URL` in the **Environment Variables** section.

### **4. Generate Prisma Client**

```sh
npx prisma generate --schema=./src/prisma/schema.prisma
```

This command **generates the Prisma Client** based on your schema.

### **5. Apply Database Migrations**

```sh
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
```

This applies pending **database migrations** to keep the schema updated.

### **6. Build and Start the Server**

```sh
npm run build  # Transpile TypeScript to JavaScript
npm run start  # Start the Express server
```


---

## **Common Issues & Fixes**

### **1. ************`DATABASE_URL Not Found`**************

- Set the `DATABASE_URL` in Render's **Environment Variables**.

### 2. \*\***`@prisma/client did not initialize`**

- Run:
  ```sh
  npx prisma generate --schema=./src/prisma/schema.prisma
  ```
- Ensure your **Build Command** includes `npx prisma generate`.

### **3. ************`Prisma Migrate Fails`************ on Render**

- Update **Build Command**:
  ```sh
  npm install && npm run build && npx prisma generate && npm run migrate
  ```
- Ensure `migrate` script is added in `package.json`:
  ```json
  "scripts": {
    "migrate": "prisma migrate deploy"
  }
  ```



