// app.js - Seasonal Fruit Planner 98 (cute edition)
// Puro JS, sin frameworks

(function () {
    // --- CONSTANTES ---
    var API_BASE = "http://localhost:8080";
    var LOGIN_URL = API_BASE + "/auth/login";
    var REGISTER_URL = API_BASE + "/auth/register";
    var FRUITS_URL = API_BASE + "/fruits";

    var STORAGE_TOKEN_KEY = "fp98_jwt_token";
    var STORAGE_PLANNER_KEY = "fp98_planner";

    // Mapeo nombre->imagen/emoji (puedes añadir más frutas)
    var fruitVisualMap = {
        "Fresa": { src: "assets/fresa.png", emoji: "🍓" },
        "Plátano": { src: "assets/platano.png", emoji: "🍌" },
        "Naranja": { src: "assets/naranja.png", emoji: "🍊" },
        "Manzana": { src: "assets/manzana.png", emoji: "🍎" },
        "Pera": { src: "assets/pera.png", emoji: "🍐" },
        "Melón": { src: "assets/melon.png", emoji: "🍈" },
        "Sandía": { src: "assets/sandia.png", emoji: "🍉" },
        "Melocotón": { src: "assets/melocoton.png", emoji: "🍑" },
        "Cereza": { src: "assets/cereza.png", emoji: "🍒" },
        "Mandarina": { src: "assets/mandarina.png", emoji: "🍊" },
        "Kiwi": { src: "assets/kiwi.png", emoji: "🥝" },
        "Uva": { src: "assets/uva.png", emoji: "🍇" }
    };

    // --- ESTADO ---
    var currentToken = null;
    var fruitsCache = [];
    var plannerItems = [];

    // --- ELEMENTOS DOM ---
    var loginScreen = document.getElementById("loginScreen");
    var registerScreen = document.getElementById("registerScreen");
    var fruitScreen = document.getElementById("fruitScreen");
    var plannerScreen = document.getElementById("plannerScreen");

    var topBar = document.getElementById("topBar");

    // LOGIN
    var usernameInput = document.getElementById("usernameInput");
    var passwordInput = document.getElementById("passwordInput");
    var loginBtn = document.getElementById("loginBtn");
    var loginMessage = document.getElementById("loginMessage");
    var goToRegisterBtn = document.getElementById("goToRegisterBtn");

    // REGISTER
    var regUsernameInput = document.getElementById("regUsernameInput");
    var regPasswordInput = document.getElementById("regPasswordInput");
    var registerBtn = document.getElementById("registerBtn");
    var backToLoginBtn = document.getElementById("backToLoginBtn");
    var registerMessage = document.getElementById("registerMessage");

    // FRUITS
    var loadFruitsBtn = document.getElementById("loadFruitsBtn");
    var monthSelect = document.getElementById("monthSelect");
    var fruitStatusMessage = document.getElementById("fruitStatusMessage");
    var seasonalFruitsBody = document.getElementById("seasonalFruitsBody");
    var offSeasonFruitsBody = document.getElementById("offSeasonFruitsBody");

    // PLANNER
    var plannerTableBody = document.getElementById("plannerTableBody");
    var totalPiecesSpan = document.getElementById("totalPieces");
    var goalMessage = document.getElementById("goalMessage");
    var progressFill = document.getElementById("progressFill");
    var progressLabel = document.getElementById("progressLabel");

    // NAV
    var navFruitBtn = document.getElementById("navFruitBtn");
    var navPlannerBtn = document.getElementById("navPlannerBtn");
    var logoutBtn = document.getElementById("logoutBtn");
    var goToPlannerFromFruits = document.getElementById("goToPlannerFromFruits");
    var backToFruitsBtn = document.getElementById("backToFruitsBtn");

    // --- UTILIDADES VISUALES ---
    function getFruitVisual(name) {
        if (!name) {
            return { src: "", emoji: "🍎" };
        }
        var visual = fruitVisualMap[name];
        if (!visual) {
            return { src: "", emoji: "🍎" };
        }
        return visual;
    }

    // --- UTILIDADES GENERALES ---
    function showScreen(screenName) {
        loginScreen.style.display = "none";
        registerScreen.style.display = "none";
        fruitScreen.style.display = "none";
        plannerScreen.style.display = "none";

        if (screenName === "login") {
            loginScreen.style.display = "block";
            topBar.style.display = "none";
        } else if (screenName === "register") {
            registerScreen.style.display = "block";
            topBar.style.display = "none";
        } else if (screenName === "fruits") {
            fruitScreen.style.display = "block";
            topBar.style.display = "block";
        } else if (screenName === "planner") {
            plannerScreen.style.display = "block";
            topBar.style.display = "block";
        }
    }

    function saveToken(token) {
        currentToken = token;
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
    }

    function loadToken() {
        currentToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    }

    function clearToken() {
        currentToken = null;
        localStorage.removeItem(STORAGE_TOKEN_KEY);
    }

    function savePlanner() {
        localStorage.setItem(STORAGE_PLANNER_KEY, JSON.stringify(plannerItems));
    }

    function loadPlanner() {
        var raw = localStorage.getItem(STORAGE_PLANNER_KEY);
        if (raw) {
            try {
                plannerItems = JSON.parse(raw) || [];
            } catch (e) {
                plannerItems = [];
            }
        }
    }

    function setStatus(element, message, type) {
        element.className = "status-message";
        if (type === "error") element.classList.add("status-error");
        if (type === "success") element.classList.add("status-success");
        element.textContent = message || "";
    }

    // --- REGISTER ---
    function doRegister() {
        setStatus(registerMessage, "", null);

        var username = regUsernameInput.value;
        var password = regPasswordInput.value;

        if (!username || !password) {
            setStatus(registerMessage, "Rellena todos los campos.", "error");
            return;
        }

        fetch(REGISTER_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: username, password: password})
        })
            .then(function (response) {
                if (!response.ok) throw new Error("Error registrando usuario");
                return response.json();
            })
            .then(function (data) {
                if (!data.token) throw new Error("Respuesta inválida en registro");

                saveToken(data.token);
                setStatus(registerMessage, "Usuario creado correctamente. ¡Bienvenida! 🍓", "success");

                showScreen("fruits");
                loadFruitsForCurrentMonth();
            })
            .catch(function () {
                setStatus(registerMessage, "Error creando usuario.", "error");
            });
    }

    // --- LOGIN ---
    function doLogin() {
        setStatus(loginMessage, "", null);

        var username = usernameInput.value;
        var password = passwordInput.value;

        if (!username || !password) {
            setStatus(loginMessage, "Introduce usuario y contraseña.", "error");
            return;
        }

        fetch(LOGIN_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: username, password: password})
        })
            .then(function (response) {
                if (!response.ok) throw new Error("Login incorrecto");
                return response.json();
            })
            .then(function (data) {
                if (!data.token) throw new Error("Token inexistente");
                saveToken(data.token);
                showScreen("fruits");
                loadFruitsForCurrentMonth();
            })
            .catch(function () {
                setStatus(loginMessage, "Login incorrecto.", "error");
            });
    }

    // --- FRUITS ---
    function loadFruitsForCurrentMonth() {
        var month = parseInt(monthSelect.value, 10);
        loadFruits(month);
    }

    function loadFruits(selectedMonth) {
        setStatus(fruitStatusMessage, "Cargando frutas...");

        fetch(FRUITS_URL, {
            headers: {
                "Authorization": "Bearer " + currentToken
            }
        })
            .then(function (response) {
                if (!response.ok) throw new Error("Error cargando frutas");
                return response.json();
            })
            .then(function (data) {
                fruitsCache = data || [];
                if (fruitsCache.length === 0) {
                    setStatus(fruitStatusMessage, "No hay frutas en la base de datos todavía.", "error");
                } else {
                    setStatus(fruitStatusMessage, "Frutas cargadas correctamente. 🍊", "success");
                }
                renderFruits(fruitsCache, selectedMonth);
            })
            .catch(function () {
                setStatus(fruitStatusMessage, "Error al cargar frutas.", "error");
            });
    }

    function isInSeason(fruit, month) {
        if (fruit.seasonStart <= fruit.seasonEnd) {
            return month >= fruit.seasonStart && month <= fruit.seasonEnd;
        } else {
            return month >= fruit.seasonStart || month <= fruit.seasonEnd;
        }
    }

    function formatSeason(fruit) {
        var months = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return months[fruit.seasonStart] + " - " + months[fruit.seasonEnd];
    }

    function renderFruits(fruits, month) {
        seasonalFruitsBody.innerHTML = "";
        offSeasonFruitsBody.innerHTML = "";

        fruits.forEach(function (fruit) {
            var tr = document.createElement("tr");

            // Imagen / emoji
            var tdImg = document.createElement("td");
            tdImg.className = "fruit-img-cell";
            var visual = getFruitVisual(fruit.name);
            if (visual.src) {
                var img = document.createElement("img");
                img.src = visual.src;
                img.alt = fruit.name || "";
                img.className = "fruit-icon";
                tdImg.appendChild(img);
            } else {
                var spanEmoji = document.createElement("span");
                spanEmoji.textContent = visual.emoji;
                spanEmoji.className = "fruit-emoji";
                tdImg.appendChild(spanEmoji);
            }
            tr.appendChild(tdImg);

            // Nombre
            var tdName = document.createElement("td");
            tdName.textContent = fruit.name || "";
            tr.appendChild(tdName);

            // Temporada
            var tdSeason = document.createElement("td");
            tdSeason.textContent = formatSeason(fruit);
            tr.appendChild(tdSeason);

            // Precio
            var tdPrice = document.createElement("td");
            tdPrice.textContent = (fruit.pricePerKg != null)
                ? fruit.pricePerKg.toFixed(2)
                : "-";
            tr.appendChild(tdPrice);

            // Descripción
            var tdDesc = document.createElement("td");
            tdDesc.textContent = fruit.description || "";
            tr.appendChild(tdDesc);

            // Acción
            var tdAction = document.createElement("td");
            var btnAdd = document.createElement("button");
            btnAdd.textContent = "Añadir al plan";
            btnAdd.className = "btn btn-secondary";
            btnAdd.onclick = function () {
                addFruitToPlanner(fruit.id);
            };
            tdAction.appendChild(btnAdd);
            tr.appendChild(tdAction);

            if (isInSeason(fruit, month)) {
                seasonalFruitsBody.appendChild(tr);
            } else {
                offSeasonFruitsBody.appendChild(tr);
            }
        });
    }

    // --- PLANNER ---
    function addFruitToPlanner(id) {
        var fruit = fruitsCache.find(function (f) { return f.id === id; });
        if (!fruit) return;

        var existing = plannerItems.find(function (i) { return i.id === id; });
        if (existing) {
            existing.quantity++;
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

    function removeItem(id) {
        plannerItems = plannerItems.filter(function (i) { return i.id !== id; });
        savePlanner();
        renderPlanner();
    }

    function updateQuantity(id, qty) {
        if (isNaN(qty) || qty < 0) qty = 0;
        var item = plannerItems.find(function (i) { return i.id === id; });
        if (item) item.quantity = qty;
        savePlanner();
        updateTotals();
    }

    function renderPlanner() {
        plannerTableBody.innerHTML = "";

        plannerItems.forEach(function (item) {
            var tr = document.createElement("tr");

            // Imagen / emoji
            var tdImg = document.createElement("td");
            tdImg.className = "fruit-img-cell";
            var fruit = fruitsCache.find(function (f) { return f.id === item.id; });
            var visual = getFruitVisual(fruit ? fruit.name : item.name);
            if (visual.src) {
                var img = document.createElement("img");
                img.src = visual.src;
                img.alt = item.name || "";
                img.className = "fruit-icon";
                tdImg.appendChild(img);
            } else {
                var spanEmoji = document.createElement("span");
                spanEmoji.textContent = visual.emoji;
                spanEmoji.className = "fruit-emoji";
                tdImg.appendChild(spanEmoji);
            }
            tr.appendChild(tdImg);

            // Nombre
            var tdName = document.createElement("td");
            tdName.textContent = item.name || "";
            tr.appendChild(tdName);

            // Cantidad
            var tdQty = document.createElement("td");
            var inputQty = document.createElement("input");
            inputQty.type = "number";
            inputQty.min = "0";
            inputQty.value = String(item.quantity);
            inputQty.className = "input-text";
            inputQty.style.width = "60px";
            inputQty.onchange = function (evt) {
                var val = parseInt(evt.target.value, 10);
                updateQuantity(item.id, val);
            };
            tdQty.appendChild(inputQty);
            tr.appendChild(tdQty);

            // Acción
            var tdAction = document.createElement("td");
            var btnDel = document.createElement("button");
            btnDel.textContent = "Eliminar";
            btnDel.className = "btn";
            btnDel.onclick = function () {
                removeItem(item.id);
            };
            tdAction.appendChild(btnDel);
            tr.appendChild(tdAction);

            plannerTableBody.appendChild(tr);
        });

        updateTotals();
    }

    function updateTotals() {
        var total = plannerItems.reduce(function (sum, item) {
            return sum + item.quantity;
        }, 0);

        totalPiecesSpan.textContent = String(total);

        // Reset clases
        goalMessage.className = "goal-message";

        var objetivo = 14; // 2 piezas al día * 7 días
        var ratio = objetivo > 0 ? Math.min(total / objetivo, 1) : 0;
        if (progressFill) {
            progressFill.style.width = (ratio * 100) + "%";
        }

        if (progressLabel) {
            if (total === 0) {
                progressLabel.textContent = "Empieza a añadir fruta para ver tu progreso 🍎";
            } else if (total < 7) {
                progressLabel.textContent = "Vas un poco baja de fruta, prueba a añadir alguna pieza más 🍋";
            } else if (total < 14) {
                progressLabel.textContent = "¡Vas por buen camino, te falta poquito para el objetivo! 🍊";
            } else {
                progressLabel.textContent = "¡Objetivo cumplido! Tu semana de fruta está on fire 🍉✨";
            }
        }

        if (total === 0) {
            goalMessage.textContent = "Ahora mismo no tienes fruta en tu plan. Empieza con 1 o 2 piezas favoritas. 💖";
        } else if (total < 7) {
            goalMessage.classList.add("goal-low");
            goalMessage.textContent = "Nivel bajo de fruta. Intenta llegar al menos a 7 piezas esta semana. 🍋";
        } else if (total < 14) {
            goalMessage.classList.add("goal-warning");
            goalMessage.textContent = "¡Bien! Pero todavía puedes subir un poco tu consumo para llegar al objetivo. 🍊";
        } else {
            goalMessage.classList.add("goal-ok");
            goalMessage.textContent = "¡Objetivo alcanzado: 2 frutas al día! Tu cuerpo te aplaude. 🥝💚";
        }
    }

    // --- LOGOUT ---
    function doLogout() {
        clearToken();
        showScreen("login");
    }

    // --- INICIALIZACIÓN ---
    function init() {
        loadToken();
        loadPlanner();

        // LOGIN events
        loginBtn.onclick = doLogin;
        passwordInput.onkeyup = function (e) {
            if (e.key === "Enter") doLogin();
        };
        goToRegisterBtn.onclick = function () {
            showScreen("register");
        };

        // REGISTER events
        registerBtn.onclick = doRegister;
        backToLoginBtn.onclick = function () {
            showScreen("login");
        };

        // FRUITS
        loadFruitsBtn.onclick = loadFruitsForCurrentMonth;
        monthSelect.onchange = function () {
            renderFruits(fruitsCache, parseInt(monthSelect.value, 10));
        };

        // NAVBAR
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
        logoutBtn.onclick = doLogout;

        // Default month
        monthSelect.value = new Date().getMonth() + 1;

        if (currentToken) {
            showScreen("fruits");
            loadFruitsForCurrentMonth();
        } else {
            showScreen("login");
        }

        renderPlanner();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();

