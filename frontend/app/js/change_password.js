// ============================================================
// change_password.js
// Handles the "Change Password" form. Unchanged from the
// original — it was already correct. Filename kept as
// change_password.js (underscore) to match what's on disk;
// dashboard.html's <script src> is fixed to point here instead.
// ============================================================

const passwordForm =
    document.getElementById("passwordForm");


passwordForm.addEventListener(
    "submit",
    changePassword
);


async function changePassword(event) {

    event.preventDefault();


    const currentPassword =
        document.getElementById(
            "currentPassword"
        ).value.trim();


    const newPassword =
        document.getElementById(
            "newPassword"
        ).value.trim();


    if (!currentPassword || !newPassword) {

        showDashboardMessage(
            "Please fill all fields.",
            "error"
        );

        return;
    }


    const button =
        document.getElementById(
            "changePasswordButton"
        );


    button.disabled = true;

    button.textContent =
        "Updating...";


    try {

        const response = await fetch(
            `${BASE_URL}/students/change-password`,
            {
                method: "PUT",

                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            }
        );


        const data =
            await response.json()
                .catch(() => ({}));


        if (!response.ok) {

            showDashboardMessage(
                data.detail ||
                "Unable to update password.",
                "error"
            );

            return;
        }


        showDashboardMessage(
            "Password updated successfully.",
            "success"
        );


        passwordForm.reset();


    } catch (error) {

        console.error(
            "Change password error:",
            error
        );


        showDashboardMessage(
            "Unable to update password.",
            "error"
        );


    } finally {

        button.disabled = false;

        button.textContent =
            "Update Password";
    }
}