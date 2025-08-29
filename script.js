/* === FIREBASE CONFIG === */
const firebaseConfig = {
  apiKey: "ISI_API_KEY",
  authDomain: "esp32-3a6dd.firebaseapp.com",
  databaseURL: "https://esp32-3a6dd-default-rtdb.firebaseio.com/",
  projectId: "esp32-3a6dd",
  storageBucket: "esp32-3a6dd.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* === DARK MODE TOGGLE === */
function toggleTheme(){
  document.body.classList.toggle("dark-mode");
  const isDark=document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}
window.addEventListener("load",()=>{
  if(localStorage.getItem("theme")==="dark"){
    document.body.classList.add("dark-mode");
  }
});

/* === GLOBAL VARIABLES === */
let currentUser=null, currentToken=null, isAdmin=false, currentUserId=null;
let voltageChart=null, ampereChart=null;
let voltageData=[], voltageLabels=[], ampereData=[], ampereLabels=[];
let panelRef=null, currentUserData=null;

/* === PAGE SWITCH === */
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if(id==="profilePage" && currentUserData){
    loadProfile(currentUserData);
    loadProfilePhoto();
  }
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

  db.ref("users/"+userId).get().then(userSnap=>{
    if(userSnap.exists()){ 
      errorBox.innerText="Email sudah terpakai!"; 
      return; 
    }

    db.ref("panel/"+token).get().then(panelSnap=>{
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
        photoURL: "" // default kosong
      });
      alert("✅ Registrasi berhasil."); 
      showPage("loginPage");
    });
  });
}

/* === LOGIN === */
function loginUser(){
  const email=document.getElementById("logEmail").value.trim();
  const pass=document.getElementById("logPassword").value.trim();
  if(!email || !pass){ alert("Isi email dan password!"); return; }
  const userId = email.replace(/\W/g,"_");

  db.ref("users/"+userId).get().then(snap=>{
    if(!snap.exists()){ alert("❌ User tidak ditemukan!"); return; }
    const data = snap.val();
    if(data.password !== pass){ alert("❌ Password salah!"); return; }

    currentUser=email;
    currentToken=data.token;
    isAdmin=data.isAdmin || false;
    currentUserId=userId;
    currentUserData=data;

    setUserOnline(userId);

    localStorage.setItem("currentUser", email);
    localStorage.setItem("currentToken", currentToken);
    localStorage.setItem("isAdmin", isAdmin);

    showPage("panelPage"); 
    initPanel(currentToken);
  });
}

/* === SET ONLINE === */
function setUserOnline(userId){
  const userRef=db.ref("users/"+userId);
  userRef.update({online:true});
  window.addEventListener("beforeunload",()=>{ userRef.update({online:false}); });
  const connectedRef=db.ref(".info/connected");
  connectedRef.on("value",snap=>{
    if(snap.val()===true){
      userRef.onDisconnect().update({online:false});
      userRef.update({online:true});
    }
  });
}

/* === AUTO LOGIN === */
window.addEventListener("load",()=>{
  const savedUser=localStorage.getItem("currentUser");
  const savedToken=localStorage.getItem("currentToken");
  const savedAdmin=localStorage.getItem("isAdmin")==="true";

  if(savedUser && savedToken){
    currentUser=savedUser;
    currentToken=savedToken;
    isAdmin=savedAdmin;
    currentUserId=savedUser.replace(/\W/g,"_");

    db.ref("users/"+currentUserId).get().then(snap=>{
      if(snap.exists()){ currentUserData=snap.val(); }
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
  currentUser=null; currentToken=null; isAdmin=false; currentUserId=null;
  if(voltageChart) voltageChart.destroy(); voltageChart=null;
  if(ampereChart) ampereChart.destroy(); ampereChart=null;
  panelRef=null; localStorage.clear(); showPage("loginPage");
}

/* === PANEL INIT === */
function initPanel(token){
  panelRef=db.ref("panel/"+token);
  document.getElementById("btnOn").style.display=isAdmin?"inline-block":"none";
  document.getElementById("btnOff").style.display=isAdmin?"inline-block":"none";

  panelRef.on("value",snap=>{
    const data=snap.val(); if(!data) return;
    document.getElementById("voltageVal").innerText=data.voltage||0;
    document.getElementById("ampereVal").innerText=data.ampere||0;
    document.getElementById("panelInfo").innerText="Status: "+(data.status||"OFF");
    const now=new Date().toLocaleTimeString();
    voltageData.push(data.voltage||0); voltageLabels.push(now);
    ampereData.push(data.ampere||0); ampereLabels.push(now);
    if(voltageData.length>20){ voltageData.shift(); voltageLabels.shift(); }
    if(ampereData.length>20){ ampereData.shift(); ampereLabels.shift(); }
    updateCharts();
  });

  const userListDiv=document.getElementById("userList");
  db.ref("users").orderByChild("token").equalTo(token).on("value",snap=>{
    userListDiv.innerHTML=""; const users=snap.val();
    if(users){ document.getElementById("userListTitle").style.display="block";
      Object.values(users).forEach(u=>{
        const card=document.createElement("div"); 
        card.className="card";
        card.style.display="flex";
        card.style.alignItems="center";
        card.style.gap="10px";

        // foto profil
        const img=document.createElement("img");
        img.src = u.photoURL ? u.photoURL : "https://via.placeholder.com/40";
        img.style.width="40px";
        img.style.height="40px";
        img.style.borderRadius="50%";
        img.alt="Foto";

        // teks email
        let label = u.email;
        if(u.isAdmin){ label += " (guru)"; }
        const span=document.createElement("span");
        span.textContent=label;

        // status online/offline
        const statusDot=document.createElement("span");
        statusDot.textContent = u.online ? "●" : "○";
        statusDot.style.color = u.online ? "green" : "red";
        statusDot.style.marginLeft="auto";

        card.appendChild(img);
        card.appendChild(span);
        card.appendChild(statusDot);
        userListDiv.appendChild(card);
      });
    }
  });
}

/* === UPDATE CHARTS === */
function updateCharts(){
  if(!voltageChart){
    const ctxV=document.getElementById("voltageChart").getContext("2d");
    voltageChart=new Chart(ctxV,{type:"line",data:{labels:voltageLabels,datasets:[{label:"Voltage (V)",data:voltageData,borderColor:"#2575fc",fill:false,tension:0.3}]},options:{scales:{y:{beginAtZero:true}}}});
  } else { voltageChart.data.labels=voltageLabels; voltageChart.data.datasets[0].data=voltageData; voltageChart.update(); }
  if(!ampereChart){
    const ctxA=document.getElementById("ampereChart").getContext("2d");
    ampereChart=new Chart(ctxA,{type:"line",data:{labels:ampereLabels,datasets:[{label:"Ampere (A)",data:ampereData,borderColor:"#6a11cb",fill:false,tension:0.3}]},options:{scales:{y:{beginAtZero:true}}}});
  } else { ampereChart.data.labels=ampereLabels; ampereChart.data.datasets[0].data=ampereData; ampereChart.update(); }
}

/* === KIRIM COMMAND === */
function sendCommand(cmd){ if(panelRef&&isAdmin){ panelRef.update({status:cmd}); } }

/* === FORGOT PASSWORD === */
function forgotPassword(){
  const email=prompt("Masukkan email Anda:"); if(!email) return;
  const userId=email.replace(/\W/g,"_");
  db.ref("users/"+userId).get().then(snap=>{
    if(!snap.exists()){ alert("❌ Email tidak terdaftar."); return; }
    const data=snap.val(); const ibu=prompt("Masukkan nama ibu kandung:");
    if(ibu&&ibu.toLowerCase()===data.ibu.toLowerCase()){
      const newPass=prompt("Masukkan password baru:"); if(newPass){ db.ref("users/"+userId+"/password").set(newPass); alert("✅ Password berhasil diubah."); }
    } else alert("❌ Nama ibu tidak sesuai!");
  });
}

/* === LOAD PROFILE (SEMUA USER BISA AKSES DIRINYA SENDIRI) === */
function loadProfile(userData){
  document.getElementById('profileEmail').innerText = userData.email || "-";
  document.getElementById('profileToken').innerText = userData.token || "-";
  document.getElementById('profileIbu').innerText = userData.ibu || "-";
}

/* === UPLOAD FOTO PROFIL (BASE64) === */
function uploadProfilePhoto(file){
  if(!currentUserId || !file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const base64String = e.target.result;
    db.ref("users/"+currentUserId).update({photoURL:base64String});
    document.getElementById("photoPreview").src=base64String;
    alert("✅ Foto profil berhasil diperbarui!");
  };
  reader.readAsDataURL(file);
}

/* === EVENT LISTENER INPUT FOTO === */
const photoInput = document.getElementById("photoInput");
if(photoInput){
  photoInput.addEventListener("change",(e)=>{
    const file=e.target.files[0];
    if(file){ uploadProfilePhoto(file); }
  });
}

/* === LOAD FOTO PROFIL SAAT BUKA PROFIL === */
function loadProfilePhoto(){
  if(!currentUserId) return;
  db.ref("users/"+currentUserId).get().then(snap=>{
    if(snap.exists()){
      const data=snap.val();
      if(data.photoURL){
        document.getElementById("photoPreview").src=data.photoURL;
      }
    }
  });
}