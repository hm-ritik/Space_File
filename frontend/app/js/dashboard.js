
if (!getToken()) {
    window.location.href = "index.html";
}


// ---------- Sidebar navigation ----------

const navItems = document.querySelectorAll(".nav-item");
const dashboardSections = document.querySelectorAll(".dashboard-section");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");


const sectionCopy = {
    overview: {
        title: "Overview",
        subtitle: "Manage your files and account."
    },
    documents: {
        title: "Documents",
        subtitle: "Upload and manage your PDF documents."
    },
    images: {
        title: "Images",
        subtitle: "Upload and manage your images."
    },
    profile: {
        title: "Profile",
        subtitle: "Manage your profile information."
    },
    password: {
        title: "Change Password",
        subtitle: "Update your account password."
    }
};


const sidebarProfileTrigger = document.getElementById("sidebarProfileTrigger");


function showSection(sectionId) {

    dashboardSections.forEach(section => {
        section.classList.toggle(
            "active-section",
            section.id === sectionId
        );
    });


    navItems.forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.section === sectionId
        );
    });

    sidebarProfileTrigger.classList.toggle(
        "active",
        sectionId === "profile"
    );

    const copy = sectionCopy[sectionId];

    if (copy) {
        pageTitle.textContent = copy.title;
        pageSubtitle.textContent = copy.subtitle;
    }

    clearDashboardMessage();
}


// Sidebar buttons: <button class="nav-item" data-section="documents">
navItems.forEach(item => {
    item.addEventListener("click", () => {
        showSection(item.dataset.section);
    });
});


sidebarProfileTrigger.addEventListener("click", () => {
    showSection("profile");
});



document.querySelectorAll("[data-section-button]").forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.sectionButton);
    });
});


// ---------- Shared message box (#messageBox) ----------
// Every section calls showDashboardMessage() to report success
// or failure. It auto-clears after a few seconds.

let dashboardMessageTimer = null;

function showDashboardMessage(message, type) {

    const box = document.getElementById("messageBox");

    box.textContent = message;
    box.className = `dashboard-message ${type}`;

    clearTimeout(dashboardMessageTimer);

    dashboardMessageTimer = setTimeout(
        clearDashboardMessage,
        4000
    );
}

function clearDashboardMessage() {

    const box = document.getElementById("messageBox");

    box.textContent = "";
    box.className = "dashboard-message";
}


// ---------- Student name (welcome banner + profile section) ----------

async function loadStudentInfo() {

    try {

        const response = await getCurrentStudent();

        if (!response.ok) {
            throw new Error("Unable to load student info");
        }

        const student = await response.json();

        // Backends name this field differently, so we try the
        // common options before giving up.
        const name =
            student.name ||
            student.full_name ||
            student.email ||
            "Student";

        document.getElementById("welcomeName").textContent = name;
        document.getElementById("profileName").textContent = name;
        document.getElementById("sidebarProfileName").textContent = name;

    } catch (error) {

        console.error("Load student info error:", error);

        document.getElementById("welcomeName").textContent = "Student";
        document.getElementById("profileName").textContent = "Student";
        document.getElementById("sidebarProfileName").textContent = "Student";
    }
}


// ---------- File counts (overview stat cards) ----------

async function loadFileCounts() {

    try {

        const response = await fetch(
            `${BASE_URL}/files/viewallfiles`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load files");
        }

        const files = await response.json();

        const documentCount = files.filter(
            file => file.category === "document"
        ).length;

        const imageCount = files.filter(
            file => file.category === "photo"
        ).length;

        document.getElementById("documentCount").textContent = documentCount;
        document.getElementById("imageCount").textContent = imageCount;

        // Same numbers, shown again in the stats row on the
        // profile page.
        document.getElementById("profileDocumentCount").textContent = documentCount;
        document.getElementById("profileImageCount").textContent = imageCount;

    } catch (error) {

        console.error("Load file counts error:", error);
    }
}



async function uploadFileToServer(file, category) {

    const formData = new FormData();

    formData.append(
        "profile",
        file
    );


    try {

        const response = await fetch(
            `${BASE_URL}/files/upload_file?category=${encodeURIComponent(category)}`,
            {
                method: "POST",

                headers: getAuthHeaders(),

                body: formData
            }
        );


        const data =
            await response.json()
                .catch(() => ({}));


        if (!response.ok) {

            showDashboardMessage(
                data.detail || "Upload failed.",
                "error"
            );

            return false;
        }


        showDashboardMessage(
            "File uploaded successfully.",
            "success"
        );

        return true;


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        showDashboardMessage(
            "Unable to upload file.",
            "error"
        );

        return false;
    }
}


// ---------- Logout ----------

document.getElementById("logoutButton").addEventListener(
    "click",
    () => {
        removeToken();
        window.location.href = "index.html";
    }
);



document.addEventListener("DOMContentLoaded", () => {

    loadStudentInfo();
    loadFileCounts();
    loadDocuments();
    loadImages();
    loadProfile();
});