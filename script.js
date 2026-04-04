// Donnée lokal pou kòmanse (ou ka ranplase ak Firestore pita)
let musicians = [];

// Eta UI
let currentSectionFilter = "ALL";
let currentSearch = "";

// Eleman DOM
const tableBody = document.querySelector("#musicians-table tbody");
const emptyState = document.getElementById("empty-state");
const totalContractsEl = document.getElementById("total-contracts");
const totalPaidEl = document.getElementById("total-paid");
const totalBalanceEl = document.getElementById("total-balance");
const filterButtons = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("search-input");
const musicianForm = document.getElementById("musician-form");
const resetFormBtn = document.getElementById("reset-form");
const formStatus = document.getElementById("form-status");

// ------------------ Fonksyon itil ------------------

function formatMoney(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("fr-HT") + " Gdes";
}

function refreshTotals() {
  let totalContract = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  getFilteredMusicians().forEach(m => {
    totalContract += Number(m.contract) || 0;
    totalPaid += Number(m.paid) || 0;
    totalBalance += Number(m.balance) || 0;
  });

  totalContractsEl.textContent = "Kontra: " + formatMoney(totalContract);
  totalPaidEl.textContent = "Peye: " + formatMoney(totalPaid);
  totalBalanceEl.textContent = "Balans: " + formatMoney(totalBalance);
}

function getFilteredMusicians() {
  return musicians.filter(m => {
    const matchSection =
      currentSectionFilter === "ALL" ||
      (m.section || "").toLowerCase() === currentSectionFilter.toLowerCase();

    const matchSearch =
      currentSearch.trim() === "" ||
      (m.name || "").toLowerCase().includes(currentSearch.toLowerCase());

    return matchSection && matchSearch;
  });
}

function renderTable() {
  const data = getFilteredMusicians();
  tableBody.innerHTML = "";

  if (data.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  data.forEach(m => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = m.id || "";
    tr.appendChild(tdId);

    const tdName = document.createElement("td");
    tdName.textContent = m.name || "";
    tr.appendChild(tdName);

    const tdSection = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge-section";
    badge.textContent = m.section || "";
    tdSection.appendChild(badge);
    tr.appendChild(tdSection);

    const tdInstrument = document.createElement("td");
    tdInstrument.textContent = m.instrument || "";
    tr.appendChild(tdInstrument);

    const tdContract = document.createElement("td");
    tdContract.className = "money";
    tdContract.textContent = formatMoney(m.contract);
    tr.appendChild(tdContract);

    const tdPaid = document.createElement("td");
    tdPaid.className = "money";
    tdPaid.textContent = formatMoney(m.paid);
    tr.appendChild(tdPaid);

    const tdBalance = document.createElement("td");
    tdBalance.className = "money";
    tdBalance.textContent = formatMoney(m.balance);
    tr.appendChild(tdBalance);

    const tdPhoto = document.createElement("td");
    if (m.photoUrl) {
      const img = document.createElement("img");
      img.src = m.photoUrl;
      img.alt = m.name || "Foto mizisyen";
      img.className = "musician-photo";
      tdPhoto.appendChild(img);
    } else {
      tdPhoto.textContent = "—";
    }
    tr.appendChild(tdPhoto);

    const tdActions = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit";
    editBtn.textContent = "Modifye";
    editBtn.addEventListener("click", () => loadMusicianInForm(m.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete";
    deleteBtn.textContent = "Efase";
    deleteBtn.addEventListener("click", () => deleteMusician(m.id));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(deleteBtn);
    tr.appendChild(tdActions);

    tableBody.appendChild(tr);
  });

  refreshTotals();
}

function loadMusicianInForm(id) {
  const m = musicians.find(x => x.id === id);
  if (!m) return;

  musicianForm.id.value = m.id || "";
  musicianForm.name.value = m.name || "";
  musicianForm.instrument.value = m.instrument || "";
  musicianForm.section.value = m.section || "";
  musicianForm.contract.value = m.contract || "";
  musicianForm.paid.value = m.paid || "";
  musicianForm.balance.value = m.balance || "";
  musicianForm.season.value = m.season || "";
  musicianForm.photoUrl.value = m.photoUrl || "";

  formStatus.textContent = "Mòd: modifye mizisyen « " + (m.name || "") + " »";
}

function deleteMusician(id) {
  if (!confirm("Ou sèten ou vle efase mizisyen sa a ?")) return;
  musicians = musicians.filter(m => m.id !== id);
  formStatus.textContent = "Mizisyen efase.";
  renderTable();
}

function resetForm() {
  musicianForm.reset();
  formStatus.textContent = "Fòm reyajiste.";
}

// ------------------ Evènman ------------------

// Filtre pa seksyon
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSectionFilter = btn.dataset.section || "ALL";
    renderTable();
  });
});

// Rechèch
searchInput.addEventListener("input", e => {
  currentSearch = e.target.value || "";
  renderTable();
});

// Sove / modifye mizisyen
musicianForm.addEventListener("submit", e => {
  e.preventDefault();

  const formData = new FormData(musicianForm);
  const id = (formData.get("id") || "").toString().trim();

  if (!id) {
    formStatus.textContent = "ID obligatwa.";
    return;
  }

  const payload = {
    id,
    name: (formData.get("name") || "").toString().trim(),
    instrument: (formData.get("instrument") || "").toString().trim(),
    section: (formData.get("section") || "").toString().trim(),
    contract: Number(formData.get("contract")) || 0,
    paid: Number(formData.get("paid")) || 0,
    balance: Number(formData.get("balance")) || 0,
    season: (formData.get("season") || "").toString().trim(),
    photoUrl: (formData.get("photoUrl") || "").toString().trim()
  };

  const existingIndex = musicians.findIndex(m => m.id === id);

  if (existingIndex >= 0) {
    musicians[existingIndex] = payload;
    formStatus.textContent = "Mizisyen mete ajou.";
  } else {
    musicians.push(payload);
    formStatus.textContent = "Mizisyen anrejistre.";
  }

  renderTable();
});

// Reyajiste fòm
resetFormBtn.addEventListener("click", () => {
  resetForm();
});

// ------------------ Inisyal ------------------

// Egzanp done pou dashboard la pa vid nèt
musicians = [
  {
    id: "TROMP-001",
    name: "Jean Trompèt",
    instrument: "Trompèt",
    section: "Trompette",
    contract: 5000,
    paid: 3000,
    balance: 2000,
    season: "2026",
    photoUrl: ""
  },
  {
    id: "BASS-001",
    name: "Marie Bass",
    instrument: "Bass",
    section: "Bass",
    contract: 7000,
    paid: 7000,
    balance: 0,
    season: "2026",
    photoUrl: ""
  }
];

renderTable();
