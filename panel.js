let voltageChart = null, ampereChart = null;
let voltageData = [], voltageLabels = [], ampereData = [], ampereLabels = [];
let panelRef = null;

/* === SET ONLINE === */
function setUserOnline(userId){
  const userRef = db.ref("users/"+userId);
  userRef.update({online:true});
  window.addEventListener("beforeunload", ()=>{ userRef.update({online:false}); });
  const connectedRef = db.ref(".info/connected");
  connectedRef.on("value", snap => {
    if(snap.val() === true){
      userRef.onDisconnect().update({online:false});
      userRef.update({online:true});
    }
  });
}

/* === PANEL INIT === */
function initPanel(token){
  panelRef = db.ref("panel/"+token);
  document.getElementById("btnOn").style.display = isAdmin ? "inline-block" : "none";
  document.getElementById("btnOff").style.display = isAdmin ? "inline-block" : "none";

  panelRef.on("value", snap => {
    const data = snap.val(); if(!data) return;
    document.getElementById("voltageVal").innerText = data.voltage || 0;
    document.getElementById("ampereVal").innerText = data.ampere || 0;
    document.getElementById("panelInfo").innerText = "Status: " + (data.status || "OFF");
    const now = new Date().toLocaleTimeString();
    voltageData.push(data.voltage||0); voltageLabels.push(now);
    ampereData.push(data.ampere||0); ampereLabels.push(now);
    if(voltageData.length > 20){ voltageData.shift(); voltageLabels.shift(); }
    if(ampereData.length > 20){ ampereData.shift(); ampereLabels.shift(); }
    updateCharts();
  });

  const userListDiv = document.getElementById("userList");
  db.ref("users").orderByChild("token").equalTo(token).on("value", snap => {
    userListDiv.innerHTML = ""; 
    const users = snap.val();
    if(users){ 
      document.getElementById("userListTitle").style.display = "block";
      Object.keys(users).forEach(uid => {
        const u = users[uid];
        const card = document.createElement("div"); 
        card.className = "card";
        card.style.display = "flex"; card.style.alignItems = "center"; card.style.gap = "10px"; card.style.cursor = "pointer";

        const img = document.createElement("img");
        img.src = u.photoURL || "https://via.placeholder.com/40";
        img.style.width = "40px"; img.style.height = "40px"; img.style.borderRadius = "50%"; img.alt = "Foto";

        let label = u.email; if(u.isAdmin){ label += " (guru)"; }
        const span = document.createElement("span"); span.textContent = label;

        const statusDot = document.createElement("span");
        statusDot.textContent = u.online ? "●" : "○";
        statusDot.style.color = u.online ? "green" : "red"; statusDot.style.marginLeft = "auto";

        card.appendChild(img); card.appendChild(span); card.appendChild(statusDot);
        card.addEventListener("click", ()=>{ openUserProfile(uid); });
        userListDiv.appendChild(card);
      });
    }
  });
}

/* === UPDATE CHARTS === */
function updateCharts(){
  if(!voltageChart){
    const ctxV = document.getElementById("voltageChart").getContext("2d");
    voltageChart = new Chart(ctxV, { type:"line", data:{labels:voltageLabels, datasets:[{label:"Voltage (V)",data:voltageData,borderColor:"#2575fc",fill:false,tension:0.3}]}, options:{scales:{y:{beginAtZero:true}}}});
  } else { voltageChart.data.labels = voltageLabels; voltageChart.data.datasets[0].data = voltageData; voltageChart.update(); }

  if(!ampereChart){
    const ctxA = document.getElementById("ampereChart").getContext("2d");
    ampereChart = new Chart(ctxA, { type:"line", data:{labels:ampereLabels, datasets:[{label:"Ampere (A)",data:ampereData,borderColor:"#6a11cb",fill:false,tension:0.3}]}, options:{scales:{y:{beginAtZero:true}}}});
  } else { ampereChart.data.labels = ampereLabels; ampereChart.data.datasets[0].data = ampereData; ampereChart.update(); }
}

/* === SEND COMMAND === */
function sendCommand(cmd){
  if(panelRef && isAdmin){ panelRef.update({status: cmd}); }
}