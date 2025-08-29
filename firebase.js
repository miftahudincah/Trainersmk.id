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
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}
window.addEventListener("load", () => {
  if(localStorage.getItem("theme") === "dark"){
    document.body.classList.add("dark-mode");
  }
});