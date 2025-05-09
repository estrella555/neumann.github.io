let pc = 0;
let ir = "";
let ac = 0;
let paso = 0;
let programaFinalizado = false;

const memoria = []; // Se llena al cargar el programa

const memoriaDatos = {
  5: 10,
  6: 22,
  7: 0
};

function escribirConsola(texto) {
  const consola = document.getElementById("console");
  const linea = document.createElement("div");
  linea.textContent = texto;
  consola.appendChild(linea);
  consola.scrollTop = consola.scrollHeight;

  const editor = document.getElementById("programaUsuario");
  if (editor) {
    if (texto.startsWith("❌")) {
      editor.classList.add("error");
    } else if (texto.startsWith("✅") || texto.startsWith("🔁")) {
      editor.classList.remove("error");
    }
  }
}

function actualizarValores() {
  document.getElementById("pc-valor").textContent = pc;
  document.getElementById("ir-valor").textContent = ir;
  document.getElementById("ac-valor").textContent = ac;
}

function limpiarResaltado() {
  document.querySelectorAll('.component').forEach(el => el.classList.remove("highlight"));
  document.getElementById("data-bus").classList.remove("highlight");
}

function reiniciarSimulador() {
  pc = 0;
  ac = 0;
  ir = "";
  paso = 0;
  programaFinalizado = false;

  limpiarResaltado();
  actualizarValores();

  document.getElementById("console").innerText = "";
  escribirConsola("🔁 Simulador reiniciado.");

  // Reactivar el botón
  const botonEjecutar = document.querySelector("button[onclick='ejecutarPaso()']");
  if (botonEjecutar) {
    botonEjecutar.disabled = false;
  }
}

function cargarPrograma() {
  const input = document.getElementById("programaUsuario").value.trim();
  const lineas = input.split("\n");
  const nuevaMemoria = [];
  const instruccionesValidas = ["LOAD", "ADD", "STORE", "SUB", "JMP", "HALT"];

  for (let i = 0; i < lineas.length; i++) {
    let linea = lineas[i].trim();
    if (linea === "") continue;

    const partes = linea.split(/\s+/);
    const instruccion = partes[0].toUpperCase();
    const operando = partes[1] !== undefined ? parseInt(partes[1]) : 0;

    if (!instruccionesValidas.includes(instruccion)) {
      escribirConsola(`❌ Línea ${i + 1}: instrucción inválida "${instruccion}".`);
      return;
    }

    if (["LOAD", "ADD", "STORE", "SUB", "JMP"].includes(instruccion) && isNaN(operando)) {
      escribirConsola(`❌ Línea ${i + 1}: se esperaba operando numérico para "${instruccion}".`);
      return;
    }

    nuevaMemoria.push([instruccion, operando]);
  }

  memoria.length = 0;
  nuevaMemoria.forEach(inst => memoria.push(inst));

  reiniciarSimulador();
  escribirConsola("✅ Programa cargado correctamente.");
}

function ejecutarPaso() {
  limpiarResaltado();

  if (pc >= memoria.length) {
    escribirConsola("⚠️ El programa ya terminó. Reinicia para volver a ejecutar.");
    return;
  }

  if (programaFinalizado) {
    return; // no seguir ejecutando
  }

  switch (paso) {
    case 0: // FETCH
      ir = `${memoria[pc][0]} ${memoria[pc][1]}`;
      escribirConsola(`FETCH → Instrucción cargada desde Mem[${pc}]: ${ir}`);
      document.getElementById("memory").classList.add("highlight");
      document.getElementById("pc").classList.add("highlight");
      document.getElementById("ir").classList.add("highlight");
      paso++;
      break;

    case 1: // DECODE
      escribirConsola(`DECODE → Decodificando instrucción: ${ir}`);
      document.getElementById("control-unit").classList.add("highlight");
      paso++;
      break;

    case 2: // EXECUTE
      const [instruccion, operando] = memoria[pc];

      if (instruccion === "LOAD") {
        ac = memoriaDatos[operando] || 0;
        escribirConsola(`EXECUTE → LOAD: AC ← Mem[${operando}] = ${ac}`);
      } else if (instruccion === "ADD") {
        const valor = memoriaDatos[operando] || 0;
        ac += valor;
        escribirConsola(`EXECUTE → ADD: AC += Mem[${operando}] (${valor}) → AC = ${ac}`);
      } else if (instruccion === "STORE") {
        memoriaDatos[operando] = ac;
        escribirConsola(`EXECUTE → STORE: Mem[${operando}] ← AC (${ac})`);
      } else if (instruccion === "SUB") {
        const valor = memoriaDatos[operando] || 0;
        ac -= valor;
        escribirConsola(`EXECUTE → SUB: AC -= Mem[${operando}] (${valor}) → AC = ${ac}`);
      } else if (instruccion === "JMP") {
        escribirConsola(`EXECUTE → JMP: salto a instrucción ${operando}`);
        pc = operando;
        paso = 0;
        actualizarValores();
        return;
      } else if (instruccion === "HALT") {
        escribirConsola("EXECUTE → HALT: Fin del programa.");
        escribirConsolaEspecial("🔁 Por favor, presione 'Reiniciar simulador' para comenzar nuevamente.");
        document.getElementById("control-unit").classList.add("highlight");
        paso = 0;
        programaFinalizado = true;
      
        // Desactivar botón
        const botonEjecutar = document.querySelector("button[onclick='ejecutarPaso()']");
        if (botonEjecutar) {
          botonEjecutar.disabled = true;
        }
        return;
      }
      
      document.getElementById("alu").classList.add("highlight");
      document.getElementById("ac").classList.add("highlight");
      paso++;
      break;

    case 3: // WRITEBACK
      escribirConsola(`WRITEBACK → Avance: PC ← ${pc + 1}`);
      document.getElementById("data-bus").classList.add("highlight");
      pc++;
      paso = 0;
      break;
  }

  actualizarValores();
}

let instruccionesUsuario = [];
let estadoEditor = "seleccion-instruccion";
let instruccionTemporal = "";

const instruccionesValidas = [
  "LOAD", "ADD", "SUB", "STORE", "JMP", "JZ", "JN", "IN", "OUT", "HALT"
];

function escribirConsolaEspecial(texto) {
  const consola = document.getElementById("console");
  const linea = document.createElement("div");
  linea.innerHTML = `<span style="color:#00aaff; font-weight:bold;">${texto}</span>`;
  consola.appendChild(linea);
  consola.scrollTop = consola.scrollHeight;
}

function actualizarEditorConsola(mensaje, tipo = "normal") {
  const consola = document.getElementById("editorConsola");
  let prefijo = "→";
  let color = "#1b1f24";

  if (tipo === "error") {
    prefijo = "❌";
    color = "#ff4b4b";
  } else if (tipo === "ok") {
    prefijo = "✔️";
    color = "#1b1f24";
  }

  const linea = document.createElement("div");
  linea.innerHTML = `<span style="color:${color}">${prefijo} ${mensaje}</span>`;
  consola.appendChild(linea);
  consola.scrollTop = consola.scrollHeight;
}

function mostrarPrograma() {
  const salida = instruccionesUsuario.map(([i, o]) =>
    i === "HALT" ? `${i}` : `${i} ${o}`
  ).join("\n");
  document.getElementById("programaConstruido").innerText = salida;
}

function limpiarPrograma() {
  instruccionesUsuario = [];
  estadoEditor = "seleccion-instruccion";
  const consola = document.getElementById("editorConsola");
  consola.innerHTML = "";
  document.getElementById("inputEditor").value = "";
  document.getElementById("programaConstruido").innerText = "";
  mostrarMenuDeOpciones();
}

function cargarProgramaDesdeEditor() {
  if (instruccionesUsuario.length === 0) {
    escribirConsola("❌ No hay instrucciones para cargar.");
    return;
  }

  memoria.length = 0;
  instruccionesUsuario.forEach(([i, o]) => memoria.push([i, o || 0]));
  reiniciarSimulador();
  escribirConsola("✅ Programa cargado desde el editor guiado.");
}

function verificarElementosCríticos() {
  const idsRequeridos = [
    "memory",
    "control-unit",
    "alu",
    "ir",
    "ac",
    "pc",
    "data-bus",
    "console",
    "pc-valor",
    "ir-valor",
    "ac-valor"
  ];

  let todosExisten = true;

  idsRequeridos.forEach(id => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`⚠️ El elemento con id="${id}" no existe en el DOM.`);
      todosExisten = false;
    }
  });

  if (!todosExisten) {
    alert("Algunos elementos del simulador no fueron encontrados. Verifica que todos los componentes estén en tu HTML.");
  }
}

const explicaciones = {
  "LOAD": "Ve a la caja n y guarda su valor en tu mochila (AC).",
  "ADD": "Mira lo que hay en la caja n y súmalo a lo que tienes en tu mochila.",
  "SUB": "Quita de tu mochila lo que hay en la caja n.",
  "STORE": "Vierte el contenido de tu mochila en la caja n.",
  "JMP": "Ignora el orden y ve directo a la instrucción número n.",
  "JZ": "Si tu mochila está vacía, salta a la instrucción n.",
  "JN": "Si lo que tienes en la mochila es negativo, cambia de camino.",
  "IN": "Pregúntale al usuario por un número y guárdalo en tu mochila.",
  "OUT": "Saca de tu mochila lo que tienes y muéstraselo a todos.",
  "HALT": "Ya terminaste. Siéntate y no hagas nada más."
};

function mostrarExplicacion(instr) {
  if (explicaciones[instr]) {
    actualizarEditorConsola(`ℹ️ ${instr}: ${explicaciones[instr]}`, "ok");
  }
}

function mostrarMenuDeOpciones() {
  actualizarEditorConsola("→ ¿Qué instrucción deseas agregar?", "ok");
  instruccionesValidas.forEach((inst, i) => {
    actualizarEditorConsola(`${i + 1}. ${inst}`, "normal");
  });
}

function manejarEntradaAvanzada() {
  const entrada = document.getElementById("inputEditor").value.trim().toUpperCase();
  document.getElementById("inputEditor").value = "";

  if (estadoEditor === "seleccion-instruccion") {
    let seleccion = entrada;

    // Si el usuario ingresó un número (1 al 10), lo convertimos a instrucción
    const indice = parseInt(entrada);
    if (!isNaN(indice) && indice >= 1 && indice <= instruccionesValidas.length) {
      seleccion = instruccionesValidas[indice - 1];
    }

    if (!instruccionesValidas.includes(seleccion)) {
      actualizarEditorConsola("❌ Instrucción no válida. Intenta otra.", "error");
      return;
    }

    instruccionTemporal = seleccion;

    if (["HALT", "IN", "OUT"].includes(seleccion)) {
      instruccionesUsuario.push([seleccion, 0]);
      actualizarEditorConsola(`✔️ ${seleccion} agregada.`, "ok");
      mostrarExplicacion(seleccion);
      mostrarPrograma();
      mostrarMenuDeOpciones();
    } else {
      actualizarEditorConsola(`→ Instrucción ${seleccion} seleccionada. Ingresa el operando (ej: 5)`, "ok");
      mostrarExplicacion(seleccion);
      estadoEditor = "ingresar-operando";
    }
  }

  else if (estadoEditor === "ingresar-operando") {
    const operando = parseInt(entrada);
    if (isNaN(operando)) {
      actualizarEditorConsola("❌ Operando inválido. Ingresa un número.", "error");
      return;
    }

    instruccionesUsuario.push([instruccionTemporal, operando]);
    actualizarEditorConsola(`✔️ ${instruccionTemporal} ${operando} agregada.`, "ok");
    mostrarPrograma();
    instruccionTemporal = "";
    estadoEditor = "seleccion-instruccion";
    mostrarMenuDeOpciones();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  verificarElementosCríticos();
  mostrarMenuDeOpciones();
  actualizarValores(); // Inicializar valores en pantalla
  
  // Prepara un programa de ejemplo en el editor manual
  document.getElementById("programaUsuario").value = "LOAD 5\nADD 6\nSTORE 7\nHALT";
});