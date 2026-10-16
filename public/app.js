// URL de la API. La levanta json-server cuando corres `npm run api`.
const API_URL = "http://localhost:3000/tickets";

// Estado de la aplicación: la lista de tickets tal como la conoce el navegador.
// La pantalla siempre se dibuja a partir de este arreglo.
let tickets = [];

const ESTADOS = {
  abierto: {
    etiqueta: "Abierto",
    clases: "bg-sky-100 text-sky-800",
    siguiente: "en_progreso",
  },
  en_progreso: {
    etiqueta: "En progreso",
    clases: "bg-amber-100 text-amber-800",
    siguiente: "resuelto",
  },
  resuelto: {
    etiqueta: "Resuelto",
    clases: "bg-emerald-100 text-emerald-800",
  },
};

// Tu código empieza aquí.

const PRIORIDADES = {
  baja: { etiqueta: "Baja", clases: "text-green-700" },
  media: { etiqueta: "Media", clases: "text-orange-600" },
  alta: { etiqueta: "Alta", clases: "text-red-700 font-bold" },
};

const CATEGORIAS = {
  hardware: "Hardware",
  software: "Software",
  red: "Red",
  accesos: "Accesos",
};

// id del ticket que se edita, null si se esta creando
let idEdicion = null;

const mensaje = document.querySelector("#mensaje");
const listaTickets = document.querySelector("#lista-tickets");
const resumen = document.querySelector("#resumen");

const tituloForm = document.querySelector("#titulo-formulario");
const btnGuardar = document.querySelector("#btn-guardar");
const btnCancelar = document.querySelector("#btn-cancelar");

const titulo = document.querySelector("#titulo");
const solicitante = document.querySelector("#solicitante");

const descripcion = document.querySelector("#descripcion");
const categ = document.querySelector("#categoria");
const priori = document.querySelector("#prioridad");

const errorTitulo = document.querySelector("#error-titulo");
const errorSolicitante = document.querySelector("#error-solicitante");

const filtroEstado = document.querySelector("#filtro-estado");
const busqueda = document.querySelector("#busqueda");

const cargarTickets = async () => {
  mensaje.textContent = "Cargando";
  listaTickets.innerHTML = "";

  try {
    const resp = await fetch(API_URL);

    if (!resp.ok) {
      throw new Error("error " + resp.status);
    }

    tickets = await resp.json();
    pintar();
  } catch (e) {
    mensaje.textContent =
      "No se pudieron cargar los tickets (" + e.message + "), revisa que la api este corriendo";
  }
};

// filtro por estado y por titulo
const ticketsFiltrados = () => {
  const estado = filtroEstado.value;
  const texto = busqueda.value.trim().toLowerCase();

  return tickets.filter((t) => {
    const pasaEstado = estado == "todos" || t.estado == estado;
    const pasaBusqueda = t.titulo.toLowerCase().includes(texto);
    return pasaEstado && pasaBusqueda;
  });
};

// resumen con todos los tickets
const pintarResumen = () => {
  const conteo = tickets.reduce(
    (acc, t) => {
      acc[t.estado]++;
      return acc;
    },
    { abierto: 0, en_progreso: 0, resuelto: 0 },
  );

  const altasPendientes = tickets.filter(
    (t) => t.prioridad == "alta" && t.estado != "resuelto",
  ).length;

  resumen.textContent =
    `Abiertos: ${conteo.abierto} - ` +
    `En progreso: ${conteo.en_progreso} - ` +
    `Resueltos: ${conteo.resuelto} - ` +
    `Prioridad alta sin resolver: ${altasPendientes}`;
};

const pintar = () => {
  listaTickets.innerHTML = "";
  pintarResumen();

  const visibles = ticketsFiltrados();

  if (tickets.length == 0) {
    mensaje.textContent = "No hay tickets, crea el primero";
    return;
  }
  if (visibles.length == 0) {
    mensaje.textContent = "No hay tickets con esos filtros";
    return;
  }
  mensaje.textContent = "";

  visibles.forEach((info) => {
    const contenedor = document.createElement("div");
    const nro = document.createElement("p");
    const titulo = document.createElement("h1");
    const descripcion = document.createElement("p");
    const solic = document.createElement("p");
    const categ = document.createElement("p");
    const priori = document.createElement("p");
    const estado = document.createElement("p");

    nro.textContent = "#" + info.id;
    titulo.textContent = info.titulo;
    descripcion.textContent = info.descripcion;
    solic.textContent = "Solicitante: " + info.solicitante;
    categ.textContent = "Categoría: " + CATEGORIAS[info.categoria];
    priori.textContent = "Prioridad: " + PRIORIDADES[info.prioridad].etiqueta;
    estado.textContent = ESTADOS[info.estado].etiqueta;

    contenedor.className =
      "bg-white rounded-xl shadow p-4 border border-slate-200";
    titulo.className = "font-bold";
    descripcion.className = "py-5";
    estado.className = ESTADOS[info.estado].clases;
    priori.className = PRIORIDADES[info.prioridad].clases;

    contenedor.append(nro, titulo, descripcion, solic, categ, priori, estado);
    listaTickets.appendChild(contenedor);

    if (info.estado != "resuelto") {
      const botonEstado = document.createElement("button");
      botonEstado.textContent =
        info.estado == "abierto" ? "Empezar" : "Marcar resuelto";
      botonEstado.addEventListener("click", () => cambiarBotonEstado(info));
      botonEstado.className =
        "bg-cyan-600 my-5 p-2 rounded-xl text-white hover:bg-cyan-500";
      contenedor.append(botonEstado);
    } else {
      contenedor.className =
        "bg-gray-100 opacity-80 rounded-xl p-4 border border-slate-200";
    }

    const botonEditar = document.createElement("button");
    botonEditar.textContent = "Editar";
    botonEditar.className =
      "mx-1 my-5 bg-yellow-500 p-2 rounded-xl text-white hover:bg-yellow-400";
    botonEditar.addEventListener("click", () => editarTicket(info));
    contenedor.append(botonEditar);

    const botonEliminar = document.createElement("button");
    botonEliminar.textContent = "Eliminar";
    botonEliminar.className =
      "my-5 bg-red-600 p-2 rounded-xl text-white hover:bg-red-500";
    botonEliminar.addEventListener("click", () => eliminarTicket(info));
    contenedor.append(botonEliminar);
  });
};

errorTitulo.className = "text-red-500";
errorSolicitante.className = "text-red-500";

const validarTitulo = () => {
  if (titulo.value.trim().length < 5) {
    errorTitulo.textContent = "El titulo debe tener minimo 5 letras";
    return false;
  }
  errorTitulo.textContent = "";
  return true;
};

const validarSolicitante = () => {
  if (solicitante.value.trim().length == 0) {
    errorSolicitante.textContent = "Falta el solicitante";
    return false;
  }
  errorSolicitante.textContent = "";
  return true;
};

// quitar el error cuando se corrige
titulo.addEventListener("input", () => {
  if (errorTitulo.textContent) validarTitulo();
});
solicitante.addEventListener("input", () => {
  if (errorSolicitante.textContent) validarSolicitante();
});

const crearTicket = document.querySelector("#form-ticket");
crearTicket.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tituloOk = validarTitulo();
  const solicitanteOk = validarSolicitante();
  if (!tituloOk || !solicitanteOk) {
    return;
  }

  const datos = {
    titulo: titulo.value.trim(),
    descripcion: descripcion.value.trim(),
    solicitante: solicitante.value.trim(),
    categoria: categ.value.trim(),
    prioridad: priori.value.trim(),
  };

  try {
    if (idEdicion == null) {
      // crear
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, estado: "abierto" }),
      });
      if (!resp.ok) throw new Error("error " + resp.status);

      const creado = await resp.json();
      tickets.push(creado);
    } else {
      // editar, el put necesita el estado porque reemplaza todo
      const original = tickets.find((t) => t.id == idEdicion);

      const resp = await fetch(`${API_URL}/${idEdicion}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, estado: original.estado }),
      });
      if (!resp.ok) throw new Error("error " + resp.status);

      const actualizado = await resp.json();

      tickets = tickets.map((t) => (t.id == idEdicion ? actualizado : t));
    }

    modoCreacion();
    pintar();
  } catch (e) {
    mensaje.textContent = "No se pudo guardar (" + e.message + ")";
  }
});

const cambiarBotonEstado = async (ticket) => {
  const siguiente = ESTADOS[ticket.estado].siguiente;

  const resp = await fetch(`${API_URL}/${ticket.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: siguiente }),
  });

  const actualizado = await resp.json();
  tickets = tickets.map((t) => (t.id == ticket.id ? actualizado : t));
  pintar();
};

// llenar el form para editar
const editarTicket = (ticket) => {
  idEdicion = ticket.id;

  tituloForm.textContent = `Editar ticket #${ticket.id}`;
  btnGuardar.textContent = "Guardar cambios";
  btnCancelar.classList.remove("hidden");

  titulo.value = ticket.titulo;
  descripcion.value = ticket.descripcion;
  solicitante.value = ticket.solicitante;
  categ.value = ticket.categoria;
  priori.value = ticket.prioridad;
};

// volver a modo crear
const modoCreacion = () => {
  idEdicion = null;

  tituloForm.textContent = "Nuevo ticket";
  btnGuardar.textContent = "Crear ticket";
  btnCancelar.classList.add("hidden");

  crearTicket.reset();
  errorTitulo.textContent = "";
  errorSolicitante.textContent = "";
};

btnCancelar.addEventListener("click", modoCreacion);

const eliminarTicket = async (ticket) => {
  if (!confirm("Seguro que quieres eliminar el ticket #" + ticket.id)) {
    return;
  }

  try {
    const resp = await fetch(`${API_URL}/${ticket.id}`, { method: "DELETE" });
    if (!resp.ok) throw new Error("error " + resp.status);

    tickets = tickets.filter((t) => t.id != ticket.id);

    if (idEdicion == ticket.id) {
      modoCreacion();
    }
    pintar();
  } catch (e) {
    mensaje.textContent = "No se pudo eliminar (" + e.message + ")";
  }
};

// filtros
filtroEstado.addEventListener("change", pintar);
busqueda.addEventListener("input", pintar);

cargarTickets();
