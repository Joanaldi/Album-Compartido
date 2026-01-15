/*************************************************
 * CONFIGURACIÓN GENERAL
 *************************************************/
const CARDS_PER_PAGE = 20;

// Estado global
let collection = [];
let currentTeamIndex = 0;
let currentPage = 0;

/*************************************************
 * UTILIDADES
 *************************************************/
function $(id) {
  return document.getElementById(id);
}

function uniqueTeams(data) {
  return [...new Set(data.map(c => c.team))];
}




/*************************************************
 * CARGA DE LA COLECCIÓN (SOLO CUANDO SE NECESITA)
 *************************************************/
async function loadCollection() {
  try {
    const response = await fetch("data/collection.json");
    if (!response.ok) {
      throw new Error("No se pudo cargar collection.json");
    }
    collection = await response.json();
    console.log("Colección cargada:", collection.length, "cartas");
  } catch (error) {
    console.error("Error cargando collection.json", error);
  }
}

/*************************************************
 * RENDER PRINCIPAL DEL GRID
 *************************************************/
function renderGrid() {
  const grid = $("grid");
  if (!grid) return;

  grid.innerHTML = "";

  const teams = uniqueTeams(collection);
  const currentTeam = teams[currentTeamIndex];

  const teamCards = collection.filter(c => c.team === currentTeam);

  const start = currentPage * CARDS_PER_PAGE;
  const end = start + CARDS_PER_PAGE;
  const pageCards = teamCards.slice(start, end);

  $("title").innerText = currentTeam;

  pageCards.forEach(card => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";

    cardDiv.innerHTML = `
      <div class="card-number">${card.number}</div>
      <div class="card-name">${card.name}</div>
      <div class="progress-container">
        <div class="progress-bar" style="width:${card.progress}%">
          <span class="progress-text">${card.progress}%</span>
        </div>
      </div>
    `;

    grid.appendChild(cardDiv);
  });
}

/*************************************************
 * NAVEGACIÓN ENTRE PÁGINAS Y EQUIPOS
 *************************************************/
function nextPage() {
  const teams = uniqueTeams(collection);
  const teamCards = collection.filter(c => c.team === teams[currentTeamIndex]);
  const maxPage = Math.ceil(teamCards.length / CARDS_PER_PAGE) - 1;

  if (currentPage < maxPage) {
    currentPage++;
  } else {
    // Pasar al siguiente equipo
    currentPage = 0;
    currentTeamIndex = (currentTeamIndex + 1) % teams.length;
  }

  renderGrid();
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
  } else if (currentTeamIndex > 0) {
    currentTeamIndex--;
    const teams = uniqueTeams(collection);
    const teamCards = collection.filter(c => c.team === teams[currentTeamIndex]);
    currentPage = Math.ceil(teamCards.length / CARDS_PER_PAGE) - 1;
  }

  renderGrid();
}

/*************************************************
 * INICIALIZACIÓN (SIN CARGAR COLECCIÓN EN INICIO)
 *************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  // ⚠️ Importante:
  // La colección SOLO se carga si existe el grid
  if ($("grid")) {
    await loadCollection();
    renderGrid();

    $("nextBtn")?.addEventListener("click", nextPage);
    $("prevBtn")?.addEventListener("click", prevPage);
  }

  if (document.querySelector(".home")) {
    actualizarContadoresGlobales();
  }
  
  if (document.querySelector(".album-view")) {
    mostrarAlbum(equipoActual);
  }
});
