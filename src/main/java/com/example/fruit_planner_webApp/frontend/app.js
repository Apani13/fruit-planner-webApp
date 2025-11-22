// app.js - Seasonal Fruit Planner 98
// Puro JS, sin frameworks

(function () {
    // --- CONSTANTES ---
    var API_BASE = "http://localhost:8080";
    var LOGIN_URL = API_BASE + "/auth/login";
    var FRUITS_URL = API_BASE + "/fruits";

    var STORAGE_TOKEN_KEY = "fp98_jwt_token";
    var STORAGE_PLANNER_KEY = "fp98_planner";

    // --- ESTADO ---
    var currentToken = null;
    var fruitsCache = []; // lista completa de frutas recibidas del backend
    var plannerItems = []; // [{id, name, quantity}]

    // --- ELEMENTOS DOM ---
    var loginScreen = document.getElementById("loginScreen");
    var fruitScreen = document.getElementById("fruitScreen");
    var plannerScreen = document.getElementById("plannerScreen");

    var topBar = document.getElementById("topBar");

    var usernameInput = document.getElementById("usernameInput");
    var passwordInput = document.getElementById("passwordInput");
    var loginBtn = document.getElementById("loginBtn");
    var loginMessage = document.getElementById("loginMessage");

    var loadFruitsBtn = document.getElementById("loadFruitsBtn");
    var monthSelect = document.getElementById("monthSelect");
    var fruitStatusMessage = document.getElementById("fruitStatusMessage");
    var seasonalFruitsBody = document.getElementById("seasonalFruitsBody");
    var offSeasonFruitsBody = document.getElementById("offSeasonFruitsBody");

    var plannerTableBody = document.getElementById("plannerTableBody");
    var totalPiecesSpan = document.getElementById("totalPieces");
    var goalMessage = document.getElementById("goalMessage");

    var navFruitBtn = document.getElementById("navFruitBtn");
    var navPlannerBtn = document.getElementById("navPlannerBtn");
    var logoutBtn = document.getElementById("logoutBtn");
    var goToPlannerFromFruits = document.getElementById("goToPlannerFromFruits");
    var backToFruitsBtn = document.getElementById("backToFruitsBtn");

    // --- UTILIDADES ---
    function showScreen(screenName) {
        loginScreen.style.display = "none";
        fruitScreen.style.display = "none";
        plannerScreen.style.display = "none";

        if (screenName === "login") {
            loginScreen.style.display = "block";
            topBar.style.display = "none";
        } else if (screenName === "fruits") {
            fruitScreen.style.display = "block";
            plannerScreen.style.display = "none";
            topBar.style.display = "block";
        } else if (screenName === "planner") {
            plannerScreen.style.display = "block";
            fruitScreen.style.display = "none";
            topBar.style.display = "block";
        }
    }

    function saveToken(token) {
        currentToken = token;
        try {
            localStorage.setItem(STORAGE_TOKEN_KEY, token);
        } catch (e) {
            // ignore
        }
    }

    function loadToken() {
        try {
            var t = localStorage.getItem(STORAGE_TOKEN_KEY);
            if (t) {
                currentToken = t;
            } else {
                currentToken = null;
            }
        } catch (e) {
            currentToken = null;
        }
    }

    function clearToken() {
        currentToken = null;
        try {
            localStorage.removeItem(STORAGE_TOKEN_KEY);
        } catch (e) {
            // ignore
        }
    }

    function savePlanner() {
        try {
            localStorage.setItem(STORAGE_PLANNER_KEY, JSON.stringify(plannerItems));
        } catch (e) {
            // ignore
        }
    }

    function loadPlanner() {
        try {
            var raw = localStorage.getItem(STORAGE_PLANNER_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && parsed.length) {
                    plannerItems = parsed;
                }
            }
        } catch (e) {
            plannerItems = [];
        }
    }

    function setStatus(element, message, type) {
        element.className = "status-message";
        if (type === "error") {
            element.className += " status-error";
        } else if (type === "success") {
            element.className += " status-success";
        }
        element.textContent = message || "";
    }

    // Lógica de temporada (mesActual entre 1-12)
    function isInSeason(fruit, month) {
        var start = fruit.seasonStart;
        var end = fruit.seasonEnd;

        if (start <= end) {
            // rango normal, por ejemplo 3-6
            return month >= start && month <= end;
        } else {
            // rango que cruza diciembre, por ejemplo 11-2
            return (month >= start) || (month <= end);
        }
    }

    function formatSeasonRange(fruit) {
        var monthNamesShort = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return monthNamesShort[fruit.seasonStart] + " - " + monthNamesShort[fruit.seasonEnd];
    }

    // --- LOGIN ---
    function doLogin() {
        setStatus(loginMessage, "", null);

        var username = usernameInput.value || "";
        var password = passwordInput.value || "";

        if (!username || !password) {
            setStatus(loginMessage, "Introduce usuario y contraseña.", "error");
            return;
        }

        var body = {
            username: username,
            password: password
        };

        fetch(LOGIN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }).then(function (response) {
            if (!response.ok) {
                throw new Error("Error de login (" + response.status + ")");
            }
            return response.json();
        }).then(function (data) {
            if (data && data.token) {
                saveToken(data.token);
                setStatus(loginMessage, "Login correcto.", "success");
                // Ir al catálogo
                showScreen("fruits");
                loadFruitsForCurrentMonth();
            } else {
                throw new Error("Respuesta de login inválida.");
            }
        }).catch(function (error) {
            setStatus(loginMessage, "Login incorrecto o error de conexión.", "error");
            console.error("Login error:", error);
        });
    }

    // --- FRUITS: CARGA Y PINTADO ---
    function loadFruitsForCurrentMonth() {
        var month = parseInt(monthSelect.value, 10) || 1;
        loadFruits(month);
    }

    function loadFruits(selectedMonth) {
        setStatus(fruitStatusMessage, "Cargando frutas...", null);

        if (!currentToken) {
            setStatus(fruitStatusMessage, "No hay token. Inicia sesión de nuevo.", "error");
            showScreen("login");
            return;
        }

        fetch(FRUITS_URL, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + currentToken
            }
        }).then(function (response) {
            if (response.status === 401 || response.status === 403) {
                // token caducado o inválido
                clearToken();
                throw new Error("Token inválido o caducado.");
            }
            if (!response.ok) {
                throw new Error("Error al cargar frutas (" + response.status + ")");
            }
            return response.json();
        }).then(function (data) {
            if (!data || !data.length) {
                fruitsCache = [];
                renderFruits([], selectedMonth);
                setStatus(fruitStatusMessage, "No se han encontrado frutas.", "error");
                return;
            }
            fruitsCache = data;
            renderFruits(data, selectedMonth);
            setStatus(fruitStatusMessage, "Frutas cargadas correctamente.", "success");
        }).catch(function (error) {
            console.error("Error cargando frutas:", error);
            setStatus(fruitStatusMessage, "Error al cargar frutas. Revisa el servidor.", "error");
        });
    }

    function renderFruits(fruits, selectedMonth) {
        // Limpia tablas
        seasonalFruitsBody.innerHTML = "";
        offSeasonFruitsBody.innerHTML = "";

        if (!fruits || fruits.length === 0) {
            return;
        }

        for (var i = 0; i < fruits.length; i++) {
            var fruit = fruits[i];
            var inSeason = isInSeason(fruit, selectedMonth);

            var tr = document.createElement("tr");

            var tdName = document.createElement("td");
            tdName.textContent = fruit.name || "";
            tr.appendChild(tdName);

            var tdSeason = document.createElement("td");
            tdSeason.textContent = formatSeasonRange(fruit);
            tr.appendChild(tdSeason);

            var tdPrice = document.createElement("td");
            tdPrice.textContent = (fruit.pricePerKg != null) ? fruit.pricePerKg.toFixed(2) : "-";
            tr.appendChild(tdPrice);

            var tdDesc = document.createElement("td");
            tdDesc.textContent = fruit.description || "";
            tr.appendChild(tdDesc);

            var tdAction = document.createElement("td");
            var btnAdd = document.createElement("button");
            btnAdd.textContent = "Añadir al plan semanal";
            btnAdd.className = "btn";
            btnAdd.setAttribute("data-fruit-id", String(fruit.id));
            btnAdd.onclick = function (evt) {
                var idStr = evt.target.getAttribute("data-fruit-id");
                var idNum = parseInt(idStr, 10);
                addFruitToPlannerById(idNum);
            };
            tdAction.appendChild(btnAdd);
            tr.appendChild(tdAction);

            if (inSeason) {
                seasonalFruitsBody.appendChild(tr);
            } else {
                offSeasonFruitsBody.appendChild(tr);
            }
        }
    }

    // --- PLANNER: GESTIÓN ---
    function addFruitToPlannerById(fruitId) {
        // Busca fruta en cache
        var fruit = null;
        for (var i = 0; i < fruitsCache.length; i++) {
            if (fruitsCache[i].id === fruitId) {
                fruit = fruitsCache[i];
                break;
            }
        }
        if (!fruit) {
            alert("No se ha encontrado la fruta seleccionada.");
            return;
        }

        // busca si ya está en planner
        var existing = null;
        for (var j = 0; j < plannerItems.length; j++) {
            if (plannerItems[j].id === fruit.id) {
                existing = plannerItems[j];
                break;
            }
        }

        if (existing) {
            existing.quantity = existing.quantity + 1;
        } else {
            plannerItems.push({
                id: fruit.id,
                name: fruit.name,
                quantity: 1
            });
        }

        savePlanner();
        renderPlanner();
    }

    function removePlannerItemById(fruitId) {
        var newList = [];
        for (var i = 0; i < plannerItems.length; i++) {
            if (plannerItems[i].id !== fruitId) {
                newList.push(plannerItems[i]);
            }
        }
        plannerItems = newList;
        savePlanner();
        renderPlanner();
    }

    function updatePlannerQuantity(fruitId, newQuantity) {
        if (newQuantity < 0) {
            newQuantity = 0;
        }
        for (var i = 0; i < plannerItems.length; i++) {
            if (plannerItems[i].id === fruitId) {
                plannerItems[i].quantity = newQuantity;
                break;
            }
        }
        savePlanner();
        updatePlannerTotals();
    }

    function renderPlanner() {
        plannerTableBody.innerHTML = "";

        if (!plannerItems || plannerItems.length === 0) {
            updatePlannerTotals();
            return;
        }

        for (var i = 0; i < plannerItems.length; i++) {
            var item = plannerItems[i];

            var tr = document.createElement("tr");

            var tdName = document.createElement("td");
            tdName.textContent = item.name || "";
            tr.appendChild(tdName);

            var tdQty = document.createElement("td");
            var inputQty = document.createElement("input");
            inputQty.type = "number";
            inputQty.min = "0";
            inputQty.value = String(item.quantity);
            inputQty.className = "input-text";
            inputQty.style.width = "60px";
            inputQty.setAttribute("data-fruit-id", String(item.id));
            inputQty.onchange = function (evt) {
                var idStr = evt.target.getAttribute("data-fruit-id");
                var idNum = parseInt(idStr, 10);
                var val = parseInt(evt.target.value, 10);
                if (isNaN(val) || val < 0) {
                    val = 0;
                    evt.target.value = "0";
                }
                updatePlannerQuantity(idNum, val);
            };
            tdQty.appendChild(inputQty);
            tr.appendChild(tdQty);

            var tdAction = document.createElement("td");
            var btnDel = document.createElement("button");
            btnDel.textContent = "Eliminar";
            btnDel.className = "btn";
            btnDel.setAttribute("data-fruit-id", String(item.id));
            btnDel.onclick = function (evt) {
                var idStr = evt.target.getAttribute("data-fruit-id");
                var idNum = parseInt(idStr, 10);
                removePlannerItemById(idNum);
            };
            tdAction.appendChild(btnDel);
            tr.appendChild(tdAction);

            plannerTableBody.appendChild(tr);
        }

        updatePlannerTotals();
    }

    function updatePlannerTotals() {
        var total = 0;
        for (var i = 0; i < plannerItems.length; i++) {
            total += plannerItems[i].quantity;
        }
        totalPiecesSpan.textContent = String(total);

        // Mensaje retro de objetivo
        goalMessage.className = "goal-message";
        if (total >= 14) {
            goalMessage.className += " goal-ok";
            goalMessage.textContent = "Objetivo alcanzado: 2 frutas al día ✔";
        } else {
            goalMessage.className += " goal-warning";
            goalMessage.textContent = "Aún no llegas al objetivo recomendado";
        }
    }

    // --- LOGOUT ---
    function doLogout() {
        clearToken();
        setStatus(loginMessage, "", null);
        showScreen("login");
    }

    // --- INICIALIZACIÓN ---
    function init() {
        // Eventos login
        loginBtn.onclick = function () {
            doLogin();
        };

        passwordInput.addEventListener("keyup", function (evt) {
            if (evt.key === "Enter") {
                doLogin();
            }
        });

        // Eventos frutas
        loadFruitsBtn.onclick = function () {
            var month = parseInt(monthSelect.value, 10) || 1;
            loadFruits(month);
        };

        monthSelect.onchange = function () {
            var month = parseInt(monthSelect.value, 10) || 1;
            // reutilizar cache si ya la tenemos
            if (fruitsCache && fruitsCache.length > 0) {
                renderFruits(fruitsCache, month);
            }
        };

        // Navegación
        navFruitBtn.onclick = function () {
            showScreen("fruits");
        };

        navPlannerBtn.onclick = function () {
            showScreen("planner");
            renderPlanner();
        };

        goToPlannerFromFruits.onclick = function () {
            showScreen("planner");
            renderPlanner();
        };

        backToFruitsBtn.onclick = function () {
            showScreen("fruits");
        };

        logoutBtn.onclick = function () {
            doLogout();
        };

        // Mes actual por defecto
        var now = new Date();
        var currentMonth = now.getMonth() + 1; // 1-12
        monthSelect.value = String(currentMonth);

        // Carga de token y planner
        loadToken();
        loadPlanner();

        if (currentToken) {
            // Intentamos ir directo al catálogo
            showScreen("fruits");
            loadFruitsForCurrentMonth();
        } else {
            showScreen("login");
        }

        // Render inicial del planner con datos de localStorage
        renderPlanner();
    }

    // Espera a que el DOM esté listo
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
