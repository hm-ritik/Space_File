
const BASE_URL = "http://127.0.0.1:8000";


function getToken() {
    return localStorage.getItem("access_token");
}

function saveToken(token) {
    localStorage.setItem("access_token", token);
}

function removeToken() {
    localStorage.removeItem("access_token");
}

function getAuthHeaders() {

    const token = getToken();

    if (!token) {
        return {};
    }

    return {
        "Authorization": `Bearer ${token}`
    };
}


// ---------- Auth ----------

async function login(email, password) {

    const response = await fetch(
        `${BASE_URL}/students/login`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })
        }
    );

    return response;
}


// ---------- Current student ----------
// ASSUMPTION: I don't have your real "get logged-in student" route,
// so I guessed /students/me (a very common FastAPI convention).
// If your backend uses a different path (e.g. /students/profile),
// this is the ONLY place you need to change it.

async function getCurrentStudent() {

    const response = await fetch(
        `${BASE_URL}/students/me`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    return response;
}


// ---------- Small shared utility ----------
// Used anywhere we insert a filename (or any user-supplied text)
// into innerHTML, so a filename like "<img onerror=...>.pdf"
// can't execute as HTML.

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}