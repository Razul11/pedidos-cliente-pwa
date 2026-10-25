import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Estructura de datos en memoria para guardar los items agregados
let pedidoActual = [];

// Elementos del DOM
const selectProducto = document.getElementById("select-producto");
const inputCantidad = document.getElementById("input-cantidad");
const btnMenos = document.getElementById("btn-menos");
const btnMas = document.getElementById("btn-mas");
const btnAgregar = document.getElementById("btn-agregar");
const contenedorLista = document.getElementById("lista-pedido");
const txtTotal = document.getElementById("total-pedido");

// Elementos de cliente y envío
const inputNombre = document.getElementById("input-nombre");
const inputDireccion = document.getElementById("input-direccion");
const btnEnviar = document.getElementById("btn-enviar");


// LOGICA DE INTERFAZ ==============================================
// Cargar productos al desplegable directamente desde Firestore
async function cargarProductos() {
    if (!selectProducto) return;

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        let htmlOptions = '<option value="" disabled selected>Seleccione un producto</option>';

        querySnapshot.forEach(item => {
            const producto = item.data();
            const id = item.id;          

            const precio = producto.precio;
            const precioFormateado = precio.toLocaleString("es-CR");

            htmlOptions += `
                <option value="${id}" 
                        data-nombre="${producto.nombre}" 
                        data-precio="${precio}">
                    ${producto.nombre} - ₡${precioFormateado}
                </option>
            `;
        });
        selectProducto.innerHTML = htmlOptions;
    } catch (error) {
        console.error("Error al cargar productos desde Firebase:", error);
    }
}

// Renderizar la lista de productos agregados
function renderizarPedido() {
    contenedorLista.innerHTML = "";

    if (pedidoActual.length === 0) {
        contenedorLista.innerHTML = `<p class="text-muted small text-center my-2">No has agregado productos al pedido.</p>`;
        txtTotal.textContent = "₡0";
        return;
    }

    let totalAcumulado = 0;

    pedidoActual.forEach((item, index) => {
        totalAcumulado += item.subtotal;

        const fila = document.createElement("div");
        fila.className = "d-flex justify-content-between align-items-center my-2";
        fila.innerHTML = `
            <div>
                <span class="d-block fw-semibold">${item.nombre}</span>
                <small class="text-muted">${item.cantidad} x ₡${item.precio.toLocaleString("es-CR")}</small>
            </div>
            <div class="d-flex align-items-center gap-3">
                <span class="fw-semibold">₡${item.subtotal.toLocaleString("es-CR")}</span>
                <button class="btn btn-link text-dark p-0 btn-eliminar" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        contenedorLista.appendChild(fila);
    });

    document.querySelectorAll(".btn-eliminar").forEach(boton => {
        boton.addEventListener("click", (e) => {
            const idx = e.currentTarget.dataset.index;
            destroyProducto(idx);
        });
    });

    txtTotal.textContent = `₡${totalAcumulado.toLocaleString("es-CR")}`;
}

// Eliminar un item del pedido
function destroyProducto(index) {
    if (!confirm("¿Desea eliminar este producto?")) return;
    pedidoActual.splice(index, 1);
    renderizarPedido();
}

// Limpiar entradas del usuario
function limpiarFormulario() {
    pedidoActual = [];
    inputNombre.value = "";
    inputDireccion.value = "";
    renderizarPedido();
}

// ESCUCHADORES DE EVENTOS PARA BOTONES ============================
if (btnMenos && btnMas) {
    btnMenos.addEventListener("click", () => {
    let cantidadActual = parseInt(inputCantidad.value) || 1;
    if (cantidadActual > 1) inputCantidad.value = cantidadActual - 1;
});

btnMas.addEventListener("click", () => {
    let cantidadActual = parseInt(inputCantidad.value) || 1;
    inputCantidad.value = cantidadActual + 1;
});
}

btnAgregar.addEventListener("click", () => {
    const optionSeleccionada = selectProducto.options[selectProducto.selectedIndex];

    if (!optionSeleccionada || !optionSeleccionada.value) {
        alert("Por favor, seleccione un producto de la lista.");
        return;
    }

    const id = optionSeleccionada.value;
    const nombre = optionSeleccionada.dataset.nombre;
    const precio = parseFloat(optionSeleccionada.dataset.precio);
    const cantidad = parseInt(inputCantidad.value) || 1;

    const itemExistente = pedidoActual.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
        itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio;
    } else {
        pedidoActual.push({
            id: id,
            nombre: nombre,
            precio: precio,
            cantidad: cantidad,
            subtotal: cantidad * precio
        });
    }
    selectProducto.selectedIndex = 0;
    inputCantidad.value = "1";
    renderizarPedido();
});

btnEnviar.addEventListener("click", async () => {
    const nombre = inputNombre.value.trim();
    const direccion = inputDireccion.value.trim();

    if (pedidoActual.length === 0) {
        alert("Agrega al menos un producto al pedido antes de enviar.");
        return;
    }

    if (!nombre || !direccion) {
        alert("Por favor completa tu nombre y dirección de entrega.");
        return;
    }

    const totalAcumulado = pedidoActual.reduce((acc, item) => acc + item.subtotal, 0);

    try {
        btnEnviar.disabled = true;

        // Formateo de fecha directo
        const fechaActual = new Date();
        const fechaFormateada = fechaActual.toLocaleString("es-CR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

        await addDoc(collection(db, "pedidos"), {
            cliente: nombre,
            direccion: direccion,
            productos: pedidoActual,
            total: totalAcumulado,
            estado: "pendiente",
            fechaStr: fechaFormateada,
            fecha: serverTimestamp()
        });

        try {
            mostrarNotificacionNavegador(nombre);
        } catch (notifError) {
            console.warn("La notificación local no es compatible o fue bloqueada:", notifError);
        }

        const modalConfirmacion = document.getElementById("modalConfirmacion");
        const modalConfirmacionInstance = new bootstrap.Modal(modalConfirmacion);
        modalConfirmacionInstance.show();

        limpiarFormulario();
    } catch (error) {
        alert("Ocurrió un error al enviar el pedido: " + error.message);
    } finally {
        btnEnviar.disabled = false;
    }
});

// NOTIFICACIONES Y PERMISOS =======================================
function solicitarPermisoNotificaciones() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

function mostrarNotificacionNavegador(nombreCliente) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("¡Pedido enviado con éxito!", {
            body: `Gracias ${nombreCliente}, tu pedido ha sido registrado correctamente.`,
            icon: "/app-cliente/icons/icon512_rounded.png"
        });
    }
}

document.getElementById('btn-maps').addEventListener('click', function () {
    window.open('https://www.google.com/maps', '_blank');
});

// Registrar el Service Worker para habilitar la PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker registrado con éxito en el alcance:', registration.scope);
            })
            .catch((error) => {
                console.error('Error al registrar el Service Worker:', error);
            });
    });
}

// Inicialización de la aplicación
cargarProductos();
solicitarPermisoNotificaciones();