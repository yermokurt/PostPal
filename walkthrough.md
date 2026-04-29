# PostPal System Walkthrough

This guide explains how the **PostPal** system fetches, creates, and updates data (posts, likes, users, and comments) using a local JSON-based architecture.

---

## 1. The Data Source
All data is stored in a single file:  
`d:\La Salle Files\3rd Year\ITElect3\localhost_itelect3\storage.json`

Because a web browser cannot directly write to files on your disk, we use a tool called **`json-server`** to act as our "bridge." You run this with the command `npm run api`.

---

## 2. User Authentication (LOGIN & REGISTER)
Your app handles users using two different logic flows in `src/api/json.js`:

### A. Register (POST)
When a new user joins:
1.  The app calls `/register` in the API.
2.  The API first checks if the email already exists in `/users`.
3.  If not, it sends a `POST` request to `/users` to permanently save the new account into `storage.json`.

### B. Login (GET)
When logging in:
1.  The app calls `/login`.
2.  The API fetches the complete list of users and searches for a match for the email and password provided.
3.  If found, it returns the user object to the React app to start the session.

---

## 3. Viewing Posts (FETCH/GET)
When you open the **Wall**, the following happens:
1.  The browser calls the `get` method in `src/api/json.js`.
2.  `json-server` reads the `"posts"` list from `storage.json`.
3.  The posts are returned to the React page and displayed on your screen.

---

## 4. Creating a Post (POST)
When you submit a new post on the **Create Post** page:
1.  The app builds a simple JavaScript object with your content and category.
2.  The `post` method in `src/api/json.js` sends this object to `/posts`.
3.  **The Secret Sauce**: `json-server` receives this object and **automatically writes it** into the `"posts"` section of your `storage.json` file.

---

## 5. Liking a Post (UPDATE/PATCH)
Liking uses a `PATCH` request because we only want to update one field (`likes_count`) without touching the rest of the post.
1.  We calculate the new like count (Current + 1).
2.  The `patch` method in `src/api/json.js` sends ONLY the `likes_count` property to the server.
3.  `json-server` updates that specific field in your root `storage.json` file.

---

## 6. Commenting (RELATIONSHIP)
Comments are linked to posts through a "Relationship" in `storage.json`.
1.  When you add a comment, the app sends your message and username to `/posts/{id}/comments`.
2.  `json-server` adds that data to the `"comments"` list in your JSON file with a link (e.g., `"postId": 1`).

---

## Summary of Commands
| Action | Method | File Updated |
| :--- | :--- | :--- |
| Sign Up | `POST` | `storage.json` (Adds new user) |
| Log In | `GET` | (Search through users) |
| Share Post | `POST` | `storage.json` (Adds new post) |
| Click Like | `PATCH` | `storage.json` (Updates count) |
| Add Comment | `POST` | `storage.json` (Adds linked comment) |

> [!TIP]
> **Always ensure `npm run api` is running!** If you stop that command, the "bridge" to your file is closed, and no data will be saved.
