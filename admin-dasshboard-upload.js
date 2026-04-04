import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let allMusicians = [];
let currentFilterSection = "ALL";
let currentSearch = "";

// CHARGE DONE YO
async function loadMusicians() {
  const snap = await getDocs(collection(db, "musicians"));
  allMusicians = [];
  snap.forEach(d => allMusicians.push({ id: d.id, ...d.data() }));
  applyFilters();
}

// APLIKE FILT + CHÈCHE
function applyFilters() {
  let list = [...allMusicians];

  if (currentFilterSection !== "ALL") {
    list = list.filter(m => m.section === currentFilterSection);
  }

  if (currentSearch.trim() !== "") {
    const q = currentSearch.toLowerCase();
    list = list.filter(m => m.name.toLowerCase().includes(q));
  }

  displayMusicians(list);
}

// AFFICHE TAB LA + TOTAL YO
function displayMusicians(list) {
  const tbody = document.querySelector("#musicians-table tbody");
  const totalContractsEl = document.getElementById("total-contracts");
  const totalPaidEl = document.getElementById("total-paid");
  const totalBalanceEl = document.getElementById("total-balance");

  tbody.innerHTML = "";

  let totalContracts = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  list.forEach(m => {
    totalContracts += m.contract || 0;
    totalPaid += m.paid || 0;
    totalBalance += m.balance || 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name}</td>
      <td>${m.section}</td>
      <td>${m.instrument}</td>
      <td>${(m.contract || 0).toLocaleString("fr-FR")} Gdes</td>
      <td>${(m.paid || 0).toLocaleString("fr-FR")} Gdes</td>
      <td>${(m.balance || 0).toLocaleString("fr-FR")} Gdes</td>
      <td>${m.photoUrl ? `<a href="${m.photoUrl}" target="_blank" style="color:#FF8C42;">Gade</a>` : "-"}</td>
      <td>
        <button class="edit-btn" data-id="${m.id}" style="padding:2px 8px; font-size:12px;">Edit</button>
        <button class="delete-btn" data-id="${m.id}" style="padding:2px 8px; font-size:12px; background:#900; color:#fff;">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  totalContractsEl.textContent = `Kontra: ${totalContracts.toLocaleString("fr-FR")} Gdes`;
  totalPaidEl.textContent = `Peye: ${totalPaid.toLocaleString("fr-FR")} Gdes`;
  totalBalanceEl.textContent = `Balans: ${totalBalance.toLocaleString("fr-FR")} Gdes`;
}

// FILTRE + EDIT + DELETE
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("filter-btn")) {
    currentFilterSection = e.target.dataset.section;
    applyFilters();
  }

  if (e.target.classList.contains("edit-btn")) {
    const id = e.target.dataset.id;
    const m = allMusicians.find(x => x.id === id);
    if (m) fillForm(m);
  }

  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    if (confirm("Ou vle efase mizisyen sa a?")) {
      deleteMusician(id);
    }
  }
});

// CHÈCHE
document.getElementById("search-input").addEventListener("input", (e) => {
  currentSearch = e.target.value;
  applyFilters();
});

// RANPLI FÒM LAN POU EDIT
function fillForm(m) {
  const form = document.getElementById("musician-form");
  form.id.value = m.id || "";
  form.name.value = m.name || "";
  form.instrument.value = m.instrument || "";
  form.section.value = m.section || "";
  form.contract.value = m.contract || "";
  form.paid.value = m.paid || "";
  form.balance.value = m.balance || "";
  form.season.value = m.season || "";
  form.photoUrl.value = m.photoUrl || "";
}

// UPLOAD FOTO
async function uploadPhoto(file, id) {
  const storageRef = ref(storage, `musicians/${id}.jpg`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// DELETE MIZISYEN
async function deleteMusician(id) {
  try {
    await deleteDoc(doc(db, "musicians", id));
    alert("Mizisyen efase ak siksè.");
    loadMusicians();
  } catch (e) {
    alert("Erè pandan efasman.");
  }
}

// REYAJISTE FÒM LAN
document.getElementById("reset-form").addEventListener("click", () => {
  document.getElementById("musician-form").reset();
});

// SUBMIT FÒM (AJOUTE / EDIT + UPLOAD FOTO)
document.getElementById("musician-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const id = form.id.value.trim();
  if (!id) {
    alert("ID obligatwa (san espas).");
    return;
  }

  let photoUrl = form.photoUrl.value.trim();
  const file = document.getElementById("photo-file").files[0];

  if (file) {
    photoUrl = await uploadPhoto(file, id);
  }

  const data = {
    name: form.name.value.trim(),
    instrument: form.instrument.value.trim(),
    section: form.section.value.trim(),
    contract: Number(form.contract.value || 0),
    paid: Number(form.paid.value || 0),
    balance: Number(form.balance.value || 0),
    season: form.season.value.trim() || "2026",
    photoUrl
  };

  await setDoc(doc(db, "musicians", id), data, { merge: true });
  await loadMusicians();
  alert("Mizisyen sove ak foto BSS STYLE ✅");
});

loadMusicians().catch(console.error);
