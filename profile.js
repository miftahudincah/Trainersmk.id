/* === OPEN USER PROFILE === */
function openUserProfile(userId){
  if(userId !== currentUserId){
    alert("❌ Kamu hanya bisa melihat profil sendiri!");
    return;
  }

  db.ref("users/" + userId).get().then(snap => {
    if(!snap.exists()) return alert("❌ User tidak ditemukan.");

    const data = snap.val();

    document.getElementById('profileEmail').innerText = data.email || "-";
    document.getElementById('profileToken').innerText = data.token || "-";
    document.getElementById('profileIbu').innerText = data.ibu || "-"; // selalu tampil karena hanya profil sendiri
    document.getElementById('photoPreview').src = data.photoURL || "https://via.placeholder.com/120";

    // Tampilkan input foto & ubah password
    document.getElementById("photoInput").style.display = "block";
    document.getElementById("btnSavePhoto").style.display = "inline-block";
    document.getElementById("changePasswordForm").style.display = "none";

    showPage("profilePage");
  }).catch(err => {
    console.error("Error membuka profil:", err);
    alert("❌ Terjadi kesalahan saat membuka profil.");
  });
}