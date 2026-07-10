const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable");

const doc = new jsPDF();
try {
  if (typeof doc.autoTable === 'function') {
    console.log("doc.autoTable exists");
  } else {
    console.log("doc.autoTable DOES NOT exist");
  }
} catch (e) {
  console.log("Error:", e);
}
