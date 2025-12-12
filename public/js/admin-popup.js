function openAdminPopup() {
    document.getElementById('adminPopup').style.display = 'flex';
}

document.getElementById("adminLoginBtn").addEventListener("click", function(e) {
    e.preventDefault();

    const password = document.getElementById("adminPassword").value;
    const errorMsg = document.getElementById("errorMsg");

    fetch("/admin/popup-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            errorMsg.textContent = "";
            window.location.href = "/admin"; // redirect to admin dashboard
        } else {
            errorMsg.textContent = "Incorrect password!";
        }
    })
    .catch(err => {
        console.error(err);
        errorMsg.textContent = "Something went wrong!";
    });
});
