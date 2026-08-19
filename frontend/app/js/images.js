// ============================================================
// images.js
// Handles the Images section: list, view, download, delete,
// upload. No parameter-shadowing bug here — the file parameter
// is named `image`, not `document`, so this is unchanged logic,
// just tidied slightly for consistency.
// ============================================================

async function loadImages() {

    const list =
        document.getElementById("imagesList");

    list.innerHTML = `
        <div class="empty-state">
            Loading images...
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
            throw new Error("Unable to load images");
        }

        const files =
            await response.json();

        const images =
            files.filter(
                file => file.category === "photo"
            );

        document.getElementById(
            "imageLimit"
        ).textContent =
            `${images.length}/10`;


        if (images.length === 0) {

            list.innerHTML = `
                <div class="empty-state">
                    No images uploaded yet.
                </div>
            `;

            return;
        }


        list.innerHTML = "";


        images.forEach(image => {

            list.appendChild(
                createImageCard(image)
            );

        });

    } catch (error) {

        console.error(error);

        list.innerHTML = `
            <div class="empty-state">
                Unable to load images.
            </div>
        `;
    }
}


function createImageCard(image) {

    const card =
        document.createElement("div");

    card.className = "file-card";


    card.innerHTML = `
        <div class="file-info">

            <div class="file-name">
                ${escapeHtml(image.filename)}
            </div>

        </div>

        <div class="file-actions">

            <button class="file-action view-image">
                View
            </button>

            <button class="file-action download-image">
                Download
            </button>

            <button class="file-action delete delete-image">
                Delete
            </button>

        </div>

        <div
            class="file-preview"
            style="display:none;"
        ></div>
    `;


    const preview =
        card.querySelector(".file-preview");


    card.querySelector(".view-image")
        .addEventListener(
            "click",
            async () => {

                if (
                    preview.style.display ===
                    "block"
                ) {

                    preview.style.display =
                        "none";

                    preview.innerHTML = "";

                    return;
                }

                await viewImage(
                    image,
                    preview
                );
            }
        );


    card.querySelector(".download-image")
        .addEventListener(
            "click",
            () => downloadImage(image)
        );


    card.querySelector(".delete-image")
        .addEventListener(
            "click",
            () => deleteImage(image)
        );


    return card;
}


async function viewImage(image, preview) {

    try {

        const response = await fetch(
            `${BASE_URL}/files/viewfile?file_id=${image.id}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        if (!response.ok) {
            throw new Error("Unable to open image");
        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(blob);


        preview.innerHTML = `
            <img
                src="${url}"
                alt="${escapeHtml(image.filename)}"
            >
        `;


        preview.style.display =
            "block";


    } catch (error) {

        console.error(error);

        showDashboardMessage(
            "Unable to open image.",
            "error"
        );
    }
}


async function downloadImage(image) {

    try {

        const response = await fetch(
            `${BASE_URL}/files/downloadfile?file_id=${image.id}`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        if (!response.ok) {
            throw new Error("Download failed");
        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            image.filename;


        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);


    } catch (error) {

        console.error(error);

        showDashboardMessage(
            "Unable to download image.",
            "error"
        );
    }
}


async function deleteImage(image) {

    const confirmed =
        confirm(
            `Delete "${image.filename}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${BASE_URL}/files/deletefile?file_id=${image.id}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );


        if (!response.ok) {
            throw new Error("Delete failed");
        }


        showDashboardMessage(
            "Image deleted successfully.",
            "success"
        );


        await loadImages();
        await loadFileCounts();


    } catch (error) {

        console.error(error);

        showDashboardMessage(
            "Unable to delete image.",
            "error"
        );
    }
}


async function uploadImage() {

    const input =
        document.getElementById("imageInput");

    const file =
        input.files[0];


    if (!file) {

        showDashboardMessage(
            "Please choose an image.",
            "error"
        );

        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        showDashboardMessage(
            "Only JPG, PNG and WEBP images are allowed.",
            "error"
        );

        return;
    }


    await uploadFileToServer(
        file,
        "photo"
    );


    input.value = "";

    await loadImages();
    await loadFileCounts();
}


document
    .getElementById("uploadImageButton")
    .addEventListener(
        "click",
        uploadImage
    );