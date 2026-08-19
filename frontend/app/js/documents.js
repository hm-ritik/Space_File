
async function loadDocuments() {

    const list = document.getElementById("documentsList");

    list.innerHTML = `
        <div class="empty-state">
            Loading documents...
        </div>
    `;

    try {

        const response = await fetch(
            `${BASE_URL}/files/viewallfiles`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load documents");
        }

        const files = await response.json();

        const documents = files.filter(
            file => file.category === "document"
        );

        document.getElementById("documentLimit").textContent =
            `${documents.length}/10`;

        if (documents.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    No documents uploaded yet.
                </div>
            `;
            return;
        }

        list.innerHTML = "";

        documents.forEach(doc => {
            list.appendChild(
                createDocumentCard(doc)
            );
        });

    } catch (error) {
        console.error(error);

        list.innerHTML = `
            <div class="empty-state">
                Unable to load documents.
            </div>
        `;
    }
}


function createDocumentCard(doc) {

    const card = document.createElement("div");
    card.className = "file-card";

    card.innerHTML = `
        <div class="file-info">
            <div class="file-name">
                ${escapeHtml(doc.filename)}
            </div>
        </div>

        <div class="file-actions">

            <button class="file-action view-document">
                View
            </button>

            <button class="file-action download-document">
                Download
            </button>

            <button class="file-action delete delete-document">
                Delete
            </button>

        </div>

        <div class="file-preview" style="display:none;"></div>
    `;

    const viewButton =
        card.querySelector(".view-document");

    const downloadButton =
        card.querySelector(".download-document");

    const deleteButton =
        card.querySelector(".delete-document");

    const preview =
        card.querySelector(".file-preview");


    viewButton.addEventListener("click", async () => {

        if (preview.style.display === "block") {

            preview.style.display = "none";
            preview.innerHTML = "";

            viewButton.textContent = "View";

            return;
        }

        await viewDocument(
            doc,
            preview
        );

        viewButton.textContent = "Close";
    });


    downloadButton.addEventListener(
        "click",
        () => downloadDocument(doc)
    );


    deleteButton.addEventListener(
        "click",
        () => deleteDocument(doc)
    );


    return card;
}


async function viewDocument(doc, preview) {

    try {

        const response = await fetch(
            `${BASE_URL}/files/viewfile?file_id=${doc.id}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Unable to open document");
        }

        const blob = await response.blob();

        const url = URL.createObjectURL(blob);

        preview.innerHTML = `
            <iframe
                src="${url}"
                title="PDF Preview"
            ></iframe>
        `;

        preview.style.display = "block";

    } catch (error) {

        console.error(error);

        showDashboardMessage(
            "Unable to open document.",
            "error"
        );
    }
}


async function downloadDocument(doc) {

    try {

        const response = await fetch(
            `${BASE_URL}/files/downloadfile?file_id=${doc.id}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Download failed");
        }

        const blob = await response.blob();

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            doc.filename;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    } catch (error) {

        console.error(error);

        showDashboardMessage(
            "Unable to download document.",
            "error"
        );
    }
}


async function deleteDocument(doc) {

    const confirmed = confirm(
        `Delete "${doc.filename}"?`
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${BASE_URL}/files/deletefile?file_id=${doc.id}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        showDashboardMessage(
            "Document deleted successfully.",
            "success"
        );

        await loadDocuments();
        await loadFileCounts();

    } catch (error) {

        console.error(error);

        showDashboardMessage(
            "Unable to delete document.",
            "error"
        );
    }
}


async function uploadDocument() {

    const input =
        document.getElementById("documentInput");

    const file =
        input.files[0];

    if (!file) {

        showDashboardMessage(
            "Please choose a PDF.",
            "error"
        );

        return;
    }

    if (file.type !== "application/pdf") {

        showDashboardMessage(
            "Only PDF files are allowed.",
            "error"
        );

        return;
    }

    await uploadFileToServer(
        file,
        "document"
    );

    input.value = "";

    await loadDocuments();
    await loadFileCounts();
}


document
    .getElementById("uploadDocumentButton")
    .addEventListener(
        "click",
        uploadDocument
    );