/* === GLOBAL VARIABLES === */
let currentUser = null, currentToken = null, isAdmin = false, currentUserId = null;
let currentUserData = null;

/* === PAGE SWITCH === */
function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* === REGISTER === */
function registerUser(){
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value.trim();
  const token = document.getElementById('regToken').value.trim();
  const ibu = document.getElementById('regIbu').value.trim();
  const errorBox = document.getElementById("regEmailError");
  errorBox.innerText = "";

  if(!email || !pass || !token || !ibu){
    alert("Lengkapi semua data!"); 
    return;
  }

  const userId = email.replace(/\W/g,"_");

  db.ref("users/"+userId).get().then(userSnap => {
    if(userSnap.exists()){ 
      errorBox.innerText = "Email sudah terpakai!"; 
      return; 
    }

    db.ref("panel/"+token).get().then(panelSnap => {
      if(!panelSnap.exists()){
        alert("❌ Token tidak valid, registrasi gagal!");
        return;
      }

      db.ref("users/"+userId).set({
        email,
        password: pass,
        token,
        ibu,
        isAdmin: false,
        online: false,
        photoURL: "" 
      });
      alert("✅ Registrasi berhasil."); 
      showPage("loginPage");
    });
  });
}

/* === LOGIN === */
function loginUser(){
  const email = document.getElementById("logEmail").value.trim();
  const pass = document.getElementById("logPassword").value.trim();
  if(!email || !pass){ alert("Isi email dan password!"); return; }
  const userId = email.replace(/\W/g,"_");

  db.ref("users/"+userId).get().then(snap => {
    if(!snap.exists()){ alert("❌ User tidak ditemukan!"); return; }
    const data = snap.val();
    if(data.password !== pass){ alert("❌ Password salah!"); return; }

    currentUser = email;
    currentToken = data.token;
    isAdmin = data.isAdmin || false;
    currentUserId = userId;
    currentUserData = data;

    setUserOnline(userId);

    localStorage.setItem("currentUser", email);
    localStorage.setItem("currentToken", currentToken);
    localStorage.setItem("isAdmin", isAdmin);

    showPage("panelPage"); 
    initPanel(currentToken);
  });
}

/* === AUTO LOGIN === */
window.addEventListener("load",()=>{
  const savedUser = localStorage.getItem("currentUser");
  const savedToken = localStorage.getItem("currentToken");
  const savedAdmin = localStorage.getItem("isAdmin") === "true";

  if(savedUser && savedToken){
    currentUser = savedUser;
    currentToken = savedToken;
    isAdmin = savedAdmin;
    currentUserId = savedUser.replace(/\W/g,"_");

    db.ref("users/"+currentUserId).get().then(snap => {
      if(snap.exists()){ currentUserData = snap.val(); }
    });

    setUserOnline(currentUserId);
    showPage("panelPage");
    initPanel(currentToken);
  } else {
    showPage("loginPage");
  }
});

/* === LOGOUT === */
function logout(){
  if(currentUserId){ db.ref("users/"+currentUserId).update({online:false}); }
  currentUser = null; currentToken = null; isAdmin = false; currentUserId = null;
  panelRef = null; localStorage.clear(); showPage("loginPage");
}

/* === FORGOT PASSWORD === */
function forgotPassword(){
  const email = prompt("Masukkan email Anda:");
  if(!email) return;
  const userId = email.replace(/\W/g,"_");
  db.ref("users/" + userId).get().then(snap => {
    if(!snap.exists()){ alert("❌ Email tidak terdaftar."); return; }
    const data = snap.val();
    const ibu = prompt("Masukkan nama ibu kandung:");
    if(ibu && ibu.toLowerCase() === data.ibu.toLowerCase()){
      const newPass = prompt("Masukkan password baru:");
      if(newPass){ db.ref("users/" + userId + "/password").set(newPass); alert("✅ Password berhasil diubah."); }
    } else alert("❌ Nama ibu tidak sesuai!");
  });
}