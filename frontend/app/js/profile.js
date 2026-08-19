async function loadProfile() {

    try {

        const response = await fetch(
            `${BASE_URL}/files/profile_picture`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );


        if (!response.ok) {

            showProfilePlaceholder();

            return;
        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(blob);


        setProfileImage(url);


    } catch (error) {

        console.error(error);

        showProfilePlaceholder();
    }
}



function setProfileImage(url) {

    [
        { image: "profilePicture", placeholder: "profilePlaceholder" },
        { image: "sidebarProfileAvatar", placeholder: "sidebarProfilePlaceholder" }
    ].forEach(({ image, placeholder }) => {

        const imageEl = document.getElementById(image);
        const placeholderEl = document.getElementById(placeholder);

        imageEl.src = url;
        imageEl.style.display = "block";
        placeholderEl.style.display = "none";
    });
}


function showProfilePlaceholder() {

    [
        { image: "profilePicture", placeholder: "profilePlaceholder" },
        { image: "sidebarProfileAvatar", placeholder: "sidebarProfilePlaceholder" }
    ].forEach(({ image, placeholder }) => {

        const imageEl = document.getElementById(image);
        const placeholderEl = document.getElementById(placeholder);

        imageEl.src = "";
        imageEl.style.display = "none";
        placeholderEl.style.display = "flex";
    });
}


async function uploadProfilePicture() {

    const input =
        document.getElementById(
            "profilePictureInput"
        );


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


    const formData =
        new FormData();


    formData.append(
        "profile",
        file
    );


    try {

        const response = await fetch(
            `${BASE_URL}/files/profile_picture`,
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
                data.detail ||
                "Profile picture upload failed.",
                "error"
            );

            return;
        }


        showDashboardMessage(
            "Profile picture updated.",
            "success"
        );


        input.value = "";

        await loadProfile();


    } catch (error) {

        console.error(error);

        showDashboardMessage(
            "Unable to upload profile picture.",
            "error"
        );
    }
}


async function removeProfilePicture() {

    const confirmed =
        confirm(
            "Remove your profile picture?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${BASE_URL}/files/`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );


        const data =
            await response.json()
                .catch(() => ({}));


        if (!response.ok) {

            showDashboardMessage(
                data.detail ||
                "Unable to remove profile picture.",
                "error"
            );

            return;
        }


        showDashboardMessage(
            "Profile picture removed.",
            "success"
        );


        showProfilePlaceholder();


    } catch (error) {

        console.error(error);

        showDashboardMessage(
            "Unable to remove profile picture.",
            "error"
        );
    }
}


document
    .getElementById("uploadProfileButton")
    .addEventListener(
        "click",
        uploadProfilePicture
    );


document
    .getElementById("removeProfileButton")
    .addEventListener(
        "click",
        removeProfilePicture
    );