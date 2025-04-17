document.addEventListener("DOMContentLoaded", function () {
    const popup = document.getElementById("booking-popup");
    const form = document.getElementById("booking-form");
    const destinationInput = document.getElementById("destination");
    const bookButtons = document.querySelectorAll(".btn");
    const closeButton = document.getElementById("close-popup"); // Ensure the X button has this ID

    const token = localStorage.getItem("token");

    // ✅ Function to check login and allowed roles
    function isAuthenticated() {
        if (!token) {
            alert("You need to sign in first!");
            window.location.href = "flego_sign.html";
            return false;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT token
            const userRole = payload.role;
            const expiry = payload.exp;

            const currentTime = Math.floor(Date.now() / 1000); // current time in seconds

            if (expiry && expiry < currentTime) {
                alert("Your session has expired. Please sign in again.");
                localStorage.removeItem("token");
                window.location.href = "flego_sign.html";
                return false;
            }

            if (userRole !== "admin" && userRole !== "user") {
                alert("Only Admins or Registered Users can book a package!");
                return false;
            }

            return true;
        } catch (error) {
            alert("Invalid or corrupted session. Please sign in again.");
            localStorage.removeItem("token");
            window.location.href = "flego_sign.html";
            return false;
        }
    }

    // ✅ Open popup on book click
    bookButtons.forEach(button => {
        button.addEventListener("click", function () {
            if (isAuthenticated()) {
                const packageCard = this.closest(".package-card");
                const destination = packageCard.querySelector("h3").innerText;

                destinationInput.value = destination;
                popup.style.display = "flex";
            }
        });
    });

    // ✅ Close popup and reset form
    function closePopup() {
        popup.style.display = "none";
        form.reset();
    }

    // ✅ Handle booking form submit
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!isAuthenticated()) return;

        const bookingData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            contact: document.getElementById("contact").value,
            people: document.getElementById("people").value,
            destination: document.getElementById("destination").value,
        };

        // Validate input data
        if (!bookingData.name || !bookingData.email || !bookingData.contact || !bookingData.people || !bookingData.destination) {
            alert("Please fill in all the fields!");
            return;
        }

        // Making the POST request to book the package
        fetch("http://localhost:3500/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // Pass the JWT token in Authorization header
            },
            body: JSON.stringify(bookingData),
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { // Handle non-JSON responses (e.g., error pages)
                    throw new Error(`Error: ${text}`);
                });
            }
            return response.json(); // Expected to return a JSON response
        })
        .then(data => {
            if (data.success) {
                alert(data.message || "Booking successful!");
                closePopup(); // Close the popup after successful booking
            } else {
                alert(data.message || "Booking failed. Please try again.");
            }
        })
        .catch(error => {
            alert("Error: " + error.message);
        });
    });

    // ✅ Close popup when clicking on 'X' button
    closeButton.addEventListener("click", function () {
        closePopup();
    });

    // ✅ Close popup when clicking outside (optional)
    window.addEventListener("click", function (event) {
        if (event.target === popup) {
            closePopup();
        }
    });
});
