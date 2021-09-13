let db;
const request = indexedDB.open("budget", 1);
const pendingObjectStoreName = `pending`;

request.onupgradeneeded = event => {
    const db = request.result;

    console.log(event);

    if (!db.objectStoreNames.contains(pendingObjectStoreName)) {
        db.createObjectStore(pendingObjectStoreName, { autoIncrement: true });
    }
};

request.onsuccess = event => {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = event => console.error(event);

function saveRecord(record) {
  const transaction = db.transaction([pendingObjectStoreName], "readwrite");
  const store = transaction.objectStore(pendingObjectStoreName);

  store.add(record);
}

function checkDatabase() {
  const transaction = db.transaction([pendingObjectStoreName], "readwrite");
  const store = transaction.objectStore(pendingObjectStoreName);
  const getAll = store.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
         
          transaction = db.transaction([pendingObjectStoreName], "readwrite");
          store = transaction.objectStore(pendingObjectStoreName);
          store.clear();
        });
    }
  };
}

function deletePending() {
  const transaction = db.transaction([pendingObjectStoreName], "readwrite");
  const store = transaction.objectStore(pendingObjectStoreName);
  store.clear();
}


window.addEventListener("online", checkDatabase);