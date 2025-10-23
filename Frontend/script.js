let users = {};
let generatedOTP = null;
let otpEmail = null;

function showLogin() 
{
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("loginMsg").innerHTML = "";
  
  document.getElementById("loginModal").classList.remove("hidden");
  document.getElementById("registerModal").classList.add("hidden");
}

function showRegister() 
{
  document.getElementById("regUser").value = "";
  document.getElementById("regEmail").value = "";
  document.getElementById("regProfession").value = "";
  document.getElementById("otherProfession").value = "";
  document.getElementById("otherProfession").classList.add("hidden");
  document.getElementById("regPass").value = "";
  document.getElementById("regConfirmPass").value = "";
  document.getElementById("regMsg").innerHTML = "";
  document.getElementById("passValidationMsg").innerHTML = "";
  
  document.getElementById("registerModal").classList.remove("hidden");
  document.getElementById("loginModal").classList.add("hidden");
}

function switchToLogin() 
{
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("loginMsg").innerHTML = "";
  
  document.getElementById("registerModal").classList.add("hidden");
  document.getElementById("loginModal").classList.remove("hidden");
}

function switchToRegister() 
{
  document.getElementById("regUser").value = "";
  document.getElementById("regEmail").value = "";
  document.getElementById("regProfession").value = "";
  document.getElementById("otherProfession").value = "";
  document.getElementById("otherProfession").classList.add("hidden");
  document.getElementById("regPass").value = "";
  document.getElementById("regConfirmPass").value = "";
  document.getElementById("regMsg").innerHTML = "";
  document.getElementById("passValidationMsg").innerHTML = "";
  
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("registerModal").classList.remove("hidden");
}

function closeAuthModals() {
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("registerModal").classList.add("hidden");
  document.getElementById("forgotModal").classList.add("hidden");
}

function togglePassword(fieldId, eyeIcon) {
  let field = document.getElementById(fieldId);
  if (field.type === "password") {
    field.type = "text";
    eyeIcon.textContent = "👁";
  } else {
    field.type = "password";
    eyeIcon.textContent = "👁";
  }
}

function toggleOtherProfession() {
  const prof = document.getElementById("regProfession").value;
  const otherField = document.getElementById("otherProfession");
  if (prof === "Other") {
    otherField.classList.remove("hidden");
  } else {
    otherField.classList.add("hidden");
    otherField.value = "";
  }
}

function validatePassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function register() {
  let user = document.getElementById("regUser").value.trim();
  let email = document.getElementById("regEmail").value.trim();
  let prof = document.getElementById("regProfession").value.trim();
  let otherProf = document.getElementById("otherProfession").value.trim();
  let pass = document.getElementById("regPass").value.trim();
  let confirmPass = document.getElementById("regConfirmPass").value.trim();
  let msg = document.getElementById("regMsg");
  let passMsg = document.getElementById("passValidationMsg");
  let confirmPassMsg = document.getElementById("confirmPassMsg");

  // Clear previous messages
  msg.innerHTML = "";
  passMsg.innerHTML = ""; 
  confirmPassMsg.innerHTML = "";
  

  // Check if fields are filled
  if (!user || !email || !pass || !confirmPass || (prof === "Other" && !otherProf)) {
    msg.innerHTML = "❌ Please fill all fields correctly";
    msg.className = "error";
    return;
  }

  // Validate email
  if (!validateEmail(email)) {
    msg.innerHTML = "❌ Invalid email format";
    msg.className = "error";
    return;
  }

  if (!validatePassword(pass)) 
  {
    passMsg.innerHTML = "❌ Weak password! Must have uppercase, lowercase,one number,one symbol, and min 8 chars.";
    passMsg.className = "error"; 
    return;
  }

   if (pass !== confirmPass) {
    confirmPassMsg.innerHTML = "❌ Passwords do not match"; 
    confirmPassMsg.className = "error";  
    return;
  }

  // Check if username exists
  if (users[user]) {
    msg.innerHTML = "❌ Username already exists";
    msg.className = "error";
    return;
  }

  // Check if email is already registered
  for (let username in users) {
    if (users[username].email === email) {
      msg.innerHTML = "❌ Email already registered";
      msg.className = "error";
      return;
    }
  }

  // Everything valid, register user
  let professionFinal = prof === "Other" ? otherProf : prof;
  users[user] = { email, prof: professionFinal, pass: btoa(pass) };

  msg.innerHTML = "✅ Registration successful! Redirecting to login...";
  msg.className = "success";

  setTimeout(() => {
    closeAuthModals();
    showLogin();
  }, 1500);
}

function showForgotPassword() {
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("registerModal").classList.add("hidden");
  document.getElementById("forgotPasswordModal").classList.remove("hidden");

  // reset all fields
  document.getElementById("forgotEmail").value = "";
  document.getElementById("otpInput").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmNewPassword").value = "";
  document.getElementById("forgotMsg").innerHTML = "";
  document.getElementById("resetMsg").innerHTML = "";
  document.getElementById("otpSection").classList.add("hidden");
}

// simulate OTP sending
function sendOTP() {
  let email = document.getElementById("forgotEmail").value.trim();
  let msg = document.getElementById("forgotMsg");

  if (!email) {
    msg.innerHTML = "⚠️ Please enter your registered email.";
    msg.className = "error";
    return;
  }

  let foundUser = null;
  for (let username in users) {
    if (users[username].email === email) {
      foundUser = username;
      break;
    }
  }

  if (!foundUser) {
    msg.innerHTML = "❌ No account found with this email.";
    msg.className = "error";
    return;
  }

  // generate OTP
  generatedOTP = Math.floor(100000 + Math.random() * 900000);
  otpEmail = email;

  msg.innerHTML = `✅ OTP sent to ${email} (simulated). Your OTP is <b>${generatedOTP}</b>`;
  msg.className = "success";

  // show OTP section
  document.getElementById("otpSection").classList.remove("hidden");
}

function resetPassword() {
  let enteredOTP = document.getElementById("otpInput").value.trim();
  let newPass = document.getElementById("newPassword").value.trim();
  let confirmPass = document.getElementById("confirmNewPassword").value.trim();
  let msg = document.getElementById("resetMsg");

  if (!enteredOTP || !newPass || !confirmPass) {
    msg.innerHTML = "⚠️ Please fill in all fields.";
    msg.className = "error";
    return;
  }

  if (enteredOTP != generatedOTP) {
    msg.innerHTML = "❌ Invalid OTP. Please try again.";
    msg.className = "error";
    return;
  }

  if (!validatePassword(newPass)) {
    msg.innerHTML = "❌ Weak password! Must have uppercase, lowercase, number, symbol & 8+ chars.";
    msg.className = "error";
    return;
  }

  if (newPass !== confirmPass) {
    msg.innerHTML = "❌ Passwords do not match.";
    msg.className = "error";
    return;
  }

  // find user by email and update password
  for (let username in users) {
    if (users[username].email === otpEmail) {
      users[username].pass = btoa(newPass);
      break;
    }
  }

  msg.innerHTML = "✅ Password reset successfully!";
  msg.className = "success";

  setTimeout(() => {
    showLogin();
  }, 1500);
}



function login() {
  let userInput = document.getElementById("loginUser").value.trim();
  let pass = document.getElementById("loginPass").value.trim();
  let msg = document.getElementById("loginMsg");

  // Clear previous message
  msg.innerHTML = "";
  msg.className = "";

  // Check if any field is empty
  if (!userInput || !pass) {
    msg.innerHTML = "⚠️ Please fill in all required details.";
    msg.className = "error";
    return;
  }

  // Check if user exists by username or email
  let foundUser = null;
  let foundUsername = null;

  // Check by username
  if (users[userInput] && users[userInput].pass === btoa(pass)) {
    foundUser = users[userInput];
    foundUsername = userInput;
  } else {
    // Check by email
    for (let username in users) {
      if (users[username].email === userInput && users[username].pass === btoa(pass)) {
        foundUser = users[username];
        foundUsername = username;
        break;
      }
    }
  }

  // Display appropriate message
  if (foundUser) {
    msg.innerHTML = "✅ Login successful! Welcome back!";
    msg.className = "success";
    setTimeout(() => {
      closeAuthModals();
      alert(`Welcome back, ${foundUsername} (${foundUser.prof})! Dashboard functionality would be implemented here.`);
    }, 1000);
  } else {
    msg.innerHTML = "❌ Invalid username/email or password.";
    msg.className = "error";
  }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const forgotModal = document.getElementById('forgotModal');
  
  if (event.target === loginModal || event.target === registerModal || event.target === forgotModal ) {
    closeAuthModals();
  }
});
