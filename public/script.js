const modal = document.getElementById("modal");
const closeBtn = document.querySelector(".close");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const modalTitle = document.getElementById("modalTitle");
const emailField = document.getElementById("emailField");
const authForm = document.getElementById("authForm");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

forgotPasswordLink.addEventListener("click", async () => {
  const email = prompt("Enter your email address to reset your password:");

  if (!email) return alert("Please enter your email.");

  try {
    const res = await fetch("http://localhost:3000/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await res.json();
    alert(result.message);
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Try again later.");
  }
});

let isSignup = false;

loginBtn.onclick = function () {
  isSignup = false;
  modal.style.display = "block";
  modalTitle.textContent = "Login";
  emailField.style.display = "none";
  emailField.querySelector("input").removeAttribute("required");
  document.getElementById("username").placeholder = "Enter your username";
  document.getElementById("password").placeholder = "Enter your password";
  document.getElementById("forgotPasswordText").style.display = "block";
};

signupBtn.onclick = function () {
  isSignup = true;
  modal.style.display = "block";
  modalTitle.textContent = "Sign Up";
  emailField.style.display = "block";
  emailField.querySelector("input").setAttribute("required", "true");
  document.getElementById("username").placeholder =
    "Create a username you'd like to have";
  document.getElementById("password").placeholder =
    "Create a password you'd like to have";

  document.getElementById("forgotPasswordText").style.display = "none";
};

closeBtn.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = isSignup ? document.getElementById("email").value : undefined;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const data = isSignup
    ? { email, username, password }
    : { username, password };

  const endpoint = isSignup ? "/signup" : "/login";

  try {
    const res = await fetch(`http://localhost:3000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    alert(result.message);

    if (res.ok) {
      localStorage.setItem("username", username);
      window.location.href = "journal.html"; // redirect
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Try again.");
  }
});
