import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allMusicians = [];
let currentFilterSection = "ALL";
let currentSearch = "";

// TI FONKSYON FORMAT LAJAN
const fmt = n => `${(n || 0).toLocaleString("fr-FR")} Gdes`;

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
    list = list.filter(m => (m.name || "").toLowerCase().includes(q));
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
    const contract = m.contract || 0;
    const paid = m.paid || 0;
    const balance = m.balance || (contract - paid);

    totalContracts += contract;
    totalPaid += paid;
    totalBalance += balance;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name || ""}</td>
      <td>${m.section || ""}</td>
      <td>${m.instrument || ""}</td>
      <td>${fmt(contract)}</td>
      <td>${fmt(paid)}</td>
      <td>${fmt(balance)}</td>
      <td>${m.photoUrl ? `<a href="${m.photoUrl}" target="_blank" style="color:#FF8C42;">Gade</a>` : "-"}</td>
      <td><button class="edit-btn" data-id="${m.id}" style="padding:2px 8px; font-size:12px;">Edit</button></td>
    `;
    tbody.appendChild(tr);
  });

  totalContractsEl.textContent = `Kontra: ${totalContracts.toLocaleString("fr-FR")} Gdes`;
  totalPaidEl.textContent = `Peye: ${totalPaid.toLocaleString("fr-FR")} Gdes`;
  totalBalanceEl.textContent = `Balans: ${totalBalance.toLocaleString("fr-FR")} Gdes`;
}

// FILTRE PA SEKSYON + EDIT
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
});

// CHÈCHE
document.getElementById("search-input").addEventListener("input", (e) => {
  currentSearch = e.target.value;
  applyFilters();
});

// RANPLI FÒM LAN POU EDIT
function fillForm(m) {
  const form = document.getElementById("musician-form");

  form.querySelector("#id").value = m.id || "";
  form.querySelector("#name").value = m.name || "";
  form.querySelector("#instrument").value = m.instrument || "";
  form.querySelector("#section").value = m.section || "";
  form.querySelector("#contract").value = m.contract || 0;
  form.querySelector("#paid").value = m.paid || 0;
  form.querySelector("#balance").value = (m.balance != null ? m.balance : (m.contract || 0) - (m.paid || 0));
  form.querySelector("#season").value = m.season || "";
  form.querySelector("#photoUrl").value = m.photoUrl || "";
}

// REYAJISTE FÒM LAN
document.getElementById("reset-form").addEventListener("click", () => {
  document.getElementById("musician-form").reset();
});

// SUBMIT FÒM (AJOUTE / EDIT)
document.getElementById("musician-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const id = form.querySelector("#id").value.trim();
  if (!id) {
    alert("ID obligatwa (san espas).");
    return;
  }

  const contract = Number(form.querySelector("#contract").value || 0);
  const paid = Number(form.querySelector("#paid").value || 0);
  const balance = contract - paid;

  const data = {
    name: form.querySelector("#name").value.trim(),
    instrument: form.querySelector("#instrument").value.trim(),
    section: form.querySelector("#section").value.trim(),
    contract,
    paid,
    balance,
    season: form.querySelector("#season").value.trim() || "2026",
    photoUrl: form.querySelector("#photoUrl").value.trim() || ""
  };

  await setDoc(doc(db, "musicians", id), data, { merge: true });

  // Mizajou lokal san rekòmanse tout query a
  const index = allMusicians.findIndex(x => x.id === id);
  if (index >= 0) {
    allMusicians[index] = { id, ...data };
  } else {
    allMusicians.push({ id, ...data });
  }

  applyFilters();
  alert("Mizisyen sove BSS STYLE ✅");
});

loadMusicians().catch(console.error);
