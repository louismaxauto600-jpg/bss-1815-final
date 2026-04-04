import { 
  getFirestore, collection, getDocs, doc, setDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import { app } from "./firebase-config.js";

const db = getFirestore(app);
const storage = getStorage(app);

// ======================================================
// LOAD MUSICIANS
// ======================================================
async function loadMusicians() {
  const tableBody = document.querySelector("#musicians-table tbody");
  tableBody.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "musicians"));
  let totalContract = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    totalContract += Number(data.contract || 0);
    totalPaid += Number(data.paid || 0);
    totalBalance += Number(data.balance || 0);

    const row = `
      <tr>
        <td>${data.name}</td>
        <td>${data.section}</td>
        <td>${data.instrument}</td>
        <td>${data.contract}</td>
        <td>${data.paid}</td>
        <td>${data.balance}</td>
        <td><img src="${data.photoUrl || ""}" width="60"></td>
        <td>
          <button onclick="editMusician('${docSnap.id}')">Modifye</button>
          <button onclick="deleteMusician('${docSnap.id}')">Efase</button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });

  document.getElementById("total-contracts").textContent = "Total Kontra: " + totalContract;
  document.getElementById("total-paid").textContent = "Total Peye: " + totalPaid;
  document.getElementById("total-balance").textContent = "Total Balans: " + totalBalance;
}

window.loadMusicians = loadMusicians;
loadMusicians();

// ======================================================
// DELETE PHOTO
// ======================================================
async function deletePhoto(id) {
  try {
    const photoRef = ref(storage, `musicians/${id}.jpg`);
    await deleteObject(photoRef);
  } catch (e) {
    console.log("Foto pa egziste oswa pa ka efase.");
  }
}

// ======================================================
// DELETE MUSICIAN
// ======================================================
async function deleteMusician(id) {
  try {
    await deletePhoto(id);
    await deleteDoc(doc(db, "musicians", id));
    alert("Mizisyen + Foto efase ak siksè.");
    loadMusicians();
  } catch (e) {
    alert("Erè pandan efasman.");
  }
}

window.deleteMusician = deleteMusician;

// ======================================================
// EDIT MUSICIAN
// ======================================================
async function editMusician(id) {
  const docRef = doc(db, "musicians", id);
  const snap = await getDocs(collection(db, "musicians"));
  snap.forEach((d) => {
    if (d.id === id) {
      const data = d.data();
      const form = document.getElementById("musician-form");

      form.id.value = id;
      form.name.value = data.name;
      form.instrument.value = data.instrument;
      form.section.value = data.section;
      form.contract.value = data.contract;
      form.paid.value = data.paid;
      form.balance.value = data.balance;
      form.season.value = data.season;
      form.photoUrl.value = data.photoUrl || "";
    }
  });
}

window.editMusician = editMusician;

// ======================================================
// SAVE MUSICIAN (ADD + UPDATE)
// ======================================================
document.getElementById("musician-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const id = form.id.value.trim();
  const name = form.name.value.trim();
  const instrument = form.instrument.value.trim();
  const section = form.section.value.trim();
  const contract = form.contract.value.trim();
  const paid = form.paid.value.trim();
  const balance = form.balance.value.trim();
  const season = form.season.value.trim();
  let photoUrl = form.photoUrl.value.trim();

  if (!id) {
    alert("ID obligatwa.");
    return;
  }

  // Upload photo if selected
  const fileInput = document.getElementById("photo-file");
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const storageRef = ref(storage, `musicians/${id}.jpg`);
    await uploadBytes(storageRef, file);
    photoUrl = await getDownloadURL(storageRef);
  }

  await setDoc(doc(db, "musicians", id), {
    name,
    instrument,
    section,
    contract,
    paid,
    balance,
    season,
    photoUrl
  });

  alert("Mizisyen sove ak siksè.");
  form.reset();
  loadMusicians();
});

// ======================================================
// SEARCH
// ======================================================
document.getElementById("search-input").addEventListener("input", () => {
  const search = document.getElementById("search-input").value.toLowerCase();
  const rows = document.querySelectorAll("#musicians-table tbody tr");

  rows.forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(search)
      ? ""
      : "none";
  });
});

// ======================================================
// FILTER
// ======================================================
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.dataset.section;
    const rows = document.querySelectorAll("#musicians-table tbody tr");

    rows.forEach((row) => {
      if (section === "ALL") {
        row.style.display = "";
      } else {
        row.style.display = row.children[1].textContent === section ? "" : "none";
      }
    });
  });
});
