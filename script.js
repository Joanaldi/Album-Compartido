const posicionesPorPagina = 9;
let paginaActual = 0;

// ================================
// DATOS CARGADOS DESDE JSON
// ================================
let cromos = [];
let coleccion = {};

// ================================
// CARGA INICIAL DEL JSON
// ================================
fetch('/data/collection.json')
  .then(res => res.json())
  .then(data => {
    cromos = data.cards.map(c => {
      // Extraer número base para agrupar Bis
      const base = c.id.replace(' Bis', '');
      return {
        id: c.id,
        jugador: c.name,
        equipo: c.collection,
        posicion: parseInt(base, 10)
      };
    });

    // Inicializar colección a 0
    cromos.forEach(c => {
      if (!(c.id in coleccion)) {
        coleccion[c.id] = 0;
      }
    });

    // Inicializar contadores
    actualizarContadores();
  })
  .catch(err => {
    console.error('Error cargando collection.json', err);
  });

// ================================
// MOSTRAR ÁLBUM
// ================================
function mostrarAlbum(equipo) {
  const albumView = document.querySelector('.album-view');
  albumView.querySelector('h2').textContent = equipo;

  const equipoCromos = cromos
    .filter(c => c.equipo === equipo)
    .reduce((acc, c) => {
      if (!acc[c.posicion]) acc[c.posicion] = [];
      acc[c.posicion].push(c);
      return acc;
    }, {});

  const posiciones = Object.keys(equipoCromos).map(Number);
  const minPos = Math.min(...posiciones);
  const maxPos = Math.max(...posiciones);
  const totalPaginas = Math.ceil((maxPos - minPos + 1) / posicionesPorPagina);

  if (paginaActual >= totalPaginas) paginaActual = totalPaginas - 1;
  if (paginaActual < 0) paginaActual = 0;

  const start = minPos + paginaActual * posicionesPorPagina;
  const end = start + posicionesPorPagina - 1;

  const grid = document.querySelector('.grid');
  grid.innerHTML = '';

  for (let pos = start; pos <= end; pos++) {
    const celda = document.createElement('div');
    const cromosPos = equipoCromos[pos];

    if (cromosPos) {
      if (cromosPos.length > 1) {
        // BIS VERTICAL
        celda.className = 'cromo bis';
        celda.innerHTML = cromosPos.map(c => {
          const rep = coleccion[c.id] > 1
            ? `<div class="repetida">${coleccion[c.id] - 1}</div>`
            : '';
          return `<span><small>${c.id}</small>${c.jugador}${rep}</span>`;
        }).join('');
      } else {
        celda.className = 'cromo';
        const c = cromosPos[0];
        celda.innerHTML = `<small>${c.id}</small><span>${c.jugador}</span>`;
        if (coleccion[c.id] > 1) {
          const rep = document.createElement('div');
          rep.className = 'repetida';
          rep.textContent = coleccion[c.id] - 1;
          celda.appendChild(rep);
        }
      }
    } else {
      celda.className = 'cromo vacio';
      celda.innerHTML = `<small>${pos}</small><span>Vacío</span>`;
    }

    grid.appendChild(celda);
  }

  crearBotonesPagina(equipo, totalPaginas);
  actualizarContadores(equipo, equipoCromos);

  document.querySelectorAll('.album').forEach(a => a.classList.remove('active'));
  albumView.classList.add('active');
}

// ================================
// BOTONES DE PÁGINA
// ================================
function crearBotonesPagina(equipo, totalPaginas) {
  const wrapper = document.querySelector('.grid-wrapper');
  let controls = document.querySelector('.grid-pages');

  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'grid-pages';
    wrapper.appendChild(controls);
  }

  controls.innerHTML = '';

  const prev = document.createElement('button');
  prev.textContent = '◀';
  prev.disabled = paginaActual === 0;
  prev.onclick = () => {
    paginaActual--;
    mostrarAlbum(equipo);
  };

  const next = document.createElement('button');
  next.textContent = '▶';
  next.disabled = paginaActual === totalPaginas - 1;
  next.onclick = () => {
    paginaActual++;
    mostrarAlbum(equipo);
  };

  controls.appendChild(prev);
  controls.appendChild(next);
}

// ================================
// CONTADORES Y BARRAS
// ================================
function actualizarContadores(equipo, equipoCromos = {}) {
  const obtenidasTotal = Object.values(coleccion).filter(v => v > 0).length;
  const totalCartas = cromos.length;

  const fillTotal = document.querySelector('.home .fill.original');
  if (fillTotal) {
    fillTotal.style.width = `${Math.round((obtenidasTotal / totalCartas) * 100)}%`;
    fillTotal.nextElementSibling.textContent = `${obtenidasTotal} / ${totalCartas}`;
  }

  const repetidas = Object.values(coleccion)
    .filter(v => v > 1)
    .reduce((acc, v) => acc + v - 1, 0);

  const fillRep = document.querySelector('.home .fill.repetidas-bar');
  if (fillRep) {
    fillRep.style.width = repetidas > 0 ? '100%' : '0%';
    fillRep.nextElementSibling.textContent = `${repetidas}`;
  }

  if (equipo) {
    const todas = Object.values(equipoCromos).flat();
    const obtenidas = todas.filter(c => coleccion[c.id] > 0).length;

    const fillEquipo = document.querySelector('.album-view .fill.original');
    const counter = document.querySelector('.album-view .bar .counter');

    if (fillEquipo && counter) {
      fillEquipo.style.width = `${Math.round((obtenidas / todas.length) * 100)}%`;
      counter.textContent = `${obtenidas} / ${todas.length}`;
    }
  }
}

// ================================
// AÑADIR CROMO
// ================================
addButton.addEventListener('click', () => {
  const num = input.value.trim();
  if (!num) return;

  const opciones = cromos.filter(c => c.id === num || c.id === `${num} Bis`);
  if (opciones.length === 0) {
    alert('Cromo no encontrado');
    return;
  }

  let seleccionado = opciones[0];
  if (opciones.length > 1) {
    const respuesta = prompt(
      `Este cromo tiene versión Bis.\nOpciones: ${opciones.map(o => o.id).join(', ')}`
    );
    seleccionado = opciones.find(c => c.id === respuesta);
    if (!seleccionado) return;
  }

  coleccion[seleccionado.id]++;
  actualizarContadores();
  input.value = '';
});

// ================================
// NAVEGACIÓN
// ================================
document.querySelector('.view-album').addEventListener('click', () => {
  paginaActual = 0;
  mostrarAlbum('Athletic Club');
});

document.querySelector('.secondary').addEventListener('click', () => {
  document.querySelectorAll('.album').forEach(a => a.classList.remove('active'));
  document.querySelector('.home').classList.add('active');
});
