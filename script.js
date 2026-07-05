const methodSelect = document.querySelector("#methodSelect");
const requestUrlInput = document.querySelector("#requestUrl");
const sendRequestBtn = document.querySelector("#sendRequestBtn");
const sendRequestBtnSecondary = document.querySelector("#sendRequestBtnSecondary");
const loadSampleBtn = document.querySelector("#loadSampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const statusMessage = document.querySelector("#statusMessage");
const headersList = document.querySelector("#headersList");
const addHeaderBtn = document.querySelector("#addHeaderBtn");
const queryParamsList = document.querySelector("#queryParamsList");
const addQueryParamBtn = document.querySelector("#addQueryParamBtn");
const requestBody = document.querySelector("#requestBody");
const validateJsonBtn = document.querySelector("#validateJsonBtn");
const responseStatus = document.querySelector("#responseStatus");
const responseTime = document.querySelector("#responseTime");
const responseSize = document.querySelector("#responseSize");
const responseContentType = document.querySelector("#responseContentType");
const prettyResponse = document.querySelector("#prettyResponse");
const rawResponse = document.querySelector("#rawResponse");
const copyResponseBtn = document.querySelector("#copyResponseBtn");
const downloadResponseBtn = document.querySelector("#downloadResponseBtn");
const saveRequestBtn = document.querySelector("#saveRequestBtn");
const exportCollectionBtn = document.querySelector("#exportCollectionBtn");
const collectionNameInput = document.querySelector("#collectionName");
const createCollectionBtn = document.querySelector("#createCollectionBtn");
const collectionsList = document.querySelector("#collectionsList");
const searchSavedRequests = document.querySelector("#searchSavedRequests");
const savedRequestsList = document.querySelector("#savedRequestsList");

let currentRequest = {
    method: "GET",
    url: "",
    headers: [],
    queryParams: [],
    body: ""
};

let lastResponse = null;
let savedRequests = [];
let collections = [];
let activeCollectionId = null;

/**
 * Combines a base URL with enabled query parameter rows.
 */
function buildRequestUrl(baseUrl, queryParams) {
    try {
        const url = new URL(baseUrl);
        const params = new URLSearchParams(url.search);

        queryParams.forEach((param) => {
            if (param.enabled && param.key.trim()) {
                params.set(param.key.trim(), param.value);
            }
        });

        url.search = params.toString();
        return { valid: true, url: url.toString() };
    } catch (error) {
        return { valid: false, error: "Enter a valid absolute URL, including https://." };
    }
}

/**
 * Converts enabled header rows into a plain headers object.
 */
function buildHeaders(headers) {
    const headerObject = {};

    headers.forEach((header) => {
        if (header.enabled && header.key.trim()) {
            headerObject[header.key.trim()] = header.value;
        }
    });

    return headerObject;
}

/**
 * Validates JSON text and returns parsed data or a readable error.
 */
function validateJsonBody(text) {
    if (!text.trim()) {
        return { valid: true, data: null };
    }

    try {
        return { valid: true, data: JSON.parse(text) };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Sends the configured API request and stores the latest response.
 */
async function sendApiRequest() {
    syncRequestStateFromUI();

    const builtUrl = buildRequestUrl(currentRequest.url, currentRequest.queryParams);
    if (!builtUrl.valid) {
        showStatus(builtUrl.error, "error");
        return;
    }

    const jsonCheck = validateJsonBody(currentRequest.body);
    if ((currentRequest.method === "POST" || currentRequest.method === "PUT") && !jsonCheck.valid) {
        showStatus(`Invalid JSON body: ${jsonCheck.error}`, "error");
        return;
    }

    const options = {
        method: currentRequest.method,
        headers: buildHeaders(currentRequest.headers)
    };

    if ((currentRequest.method === "POST" || currentRequest.method === "PUT") && currentRequest.body.trim()) {
        options.body = currentRequest.body;
        if (!options.headers["Content-Type"] && !options.headers["content-type"]) {
            options.headers["Content-Type"] = "application/json";
        }
    }

    setLoading(true);
    showStatus("Sending request...", "info");

    const startedAt = performance.now();

    try {
        const response = await fetch(builtUrl.url, options);
        const elapsedMs = Math.round(performance.now() - startedAt);
        const responseData = await parseApiResponse(response);

        responseData.time = elapsedMs;
        lastResponse = responseData;
        renderResponse(responseData);
        showStatus("Request completed successfully.", response.ok ? "success" : "info");
    } catch (error) {
        showStatus(`Network or CORS error: ${error.message}`, "error");
        lastResponse = null;
    } finally {
        setLoading(false);
    }
}

/**
 * Reads a fetch Response and prepares formatted response data.
 */
async function parseApiResponse(response) {
    const text = await response.text();
    const contentType = response.headers.get("content-type") || "unknown";
    let parsedJson = null;
    let isJson = false;

    try {
        parsedJson = text ? JSON.parse(text) : null;
        isJson = true;
    } catch (error) {
        isJson = false;
    }

    return {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType,
        size: new Blob([text]).size,
        raw: text,
        json: parsedJson,
        isJson,
        headers: Object.fromEntries(response.headers.entries()),
        time: 0
    };
}

/**
 * Renders response stats, pretty output, and raw output.
 */
function renderResponse(responseData) {
    responseStatus.textContent = `${responseData.status} ${responseData.statusText}`;
    responseTime.textContent = `${responseData.time} ms`;
    responseSize.textContent = formatBytes(responseData.size);
    responseContentType.textContent = responseData.contentType;
    prettyResponse.textContent = responseData.isJson ? formatJson(responseData.json) : responseData.raw || "Empty response.";
    rawResponse.textContent = responseData.raw || "Empty response.";
}

/**
 * Renders editable request header rows.
 */
function renderHeadersEditor() {
    if (!currentRequest.headers.length) {
        headersList.innerHTML = '<div class="empty-state">No headers added.</div>';
        return;
    }

    headersList.innerHTML = currentRequest.headers.map((header, index) => `
    <div class="editor-row" data-index="${index}">
      <input class="form-control header-key" type="text" value="${escapeHtml(header.key)}" placeholder="Header key">
      <input class="form-control header-value" type="text" value="${escapeHtml(header.value)}" placeholder="Header value">
      <button class="btn btn-outline-danger remove-header" type="button">Remove</button>
    </div>
  `).join("");
}

/**
 * Renders editable query parameter rows.
 */
function renderQueryParamsEditor() {
    if (!currentRequest.queryParams.length) {
        queryParamsList.innerHTML = '<div class="empty-state">No query parameters added.</div>';
        return;
    }

    queryParamsList.innerHTML = currentRequest.queryParams.map((param, index) => `
    <div class="editor-row" data-index="${index}">
      <input class="form-control query-key" type="text" value="${escapeHtml(param.key)}" placeholder="Param key">
      <input class="form-control query-value" type="text" value="${escapeHtml(param.value)}" placeholder="Param value">
      <button class="btn btn-outline-danger remove-query-param" type="button">Remove</button>
    </div>
  `).join("");
}

/**
 * Adds an empty header row to the request.
 */
function addHeaderRow() {
    syncRequestStateFromUI();
    currentRequest.headers.push({ key: "", value: "", enabled: true });
    renderHeadersEditor();
}

/**
 * Removes a header row by index.
 */
function removeHeaderRow(index) {
    syncRequestStateFromUI();
    currentRequest.headers.splice(index, 1);
    renderHeadersEditor();
}

/**
 * Adds an empty query parameter row to the request.
 */
function addQueryParamRow() {
    syncRequestStateFromUI();
    currentRequest.queryParams.push({ key: "", value: "", enabled: true });
    renderQueryParamsEditor();
}

/**
 * Removes a query parameter row by index.
 */
function removeQueryParamRow(index) {
    syncRequestStateFromUI();
    currentRequest.queryParams.splice(index, 1);
    renderQueryParamsEditor();
}

/**
 * Reads all request builder inputs into currentRequest.
 */
function syncRequestStateFromUI() {
    currentRequest.method = methodSelect.value;
    currentRequest.url = requestUrlInput.value.trim();
    currentRequest.body = requestBody.value;

    currentRequest.headers = Array.from(headersList.querySelectorAll(".editor-row")).map((row) => ({
        key: row.querySelector(".header-key").value,
        value: row.querySelector(".header-value").value,
        enabled: true
    }));

    currentRequest.queryParams = Array.from(queryParamsList.querySelectorAll(".editor-row")).map((row) => ({
        key: row.querySelector(".query-key").value,
        value: row.querySelector(".query-value").value,
        enabled: true
    }));
}

/**
 * Loads a saved request into the request builder UI.
 */
function loadRequestIntoUI(request) {
    currentRequest = {
        method: request.method || "GET",
        url: request.url || "",
        headers: request.headers || [],
        queryParams: request.queryParams || [],
        body: request.body || ""
    };

    methodSelect.value = currentRequest.method;
    requestUrlInput.value = currentRequest.url;
    requestBody.value = currentRequest.body;
    renderHeadersEditor();
    renderQueryParamsEditor();
    showStatus(`Loaded request: ${request.name}`, "success");
}

/**
 * Saves the current request into localStorage.
 */
function saveCurrentRequest() {
    syncRequestStateFromUI();

    if (!currentRequest.url) {
        showStatus("Enter a request URL before saving.", "error");
        return;
    }

    if (!collections.length) {
        showStatus("Create a collection before saving a request.", "error");
        return;
    }

    const name = window.prompt("Request name:");
    if (!name || !name.trim()) {
        showStatus("Request save cancelled.", "info");
        return;
    }

    const collectionId = activeCollectionId || collections[0].id;
    const savedRequest = {
        id: crypto.randomUUID(),
        collectionId,
        name: name.trim(),
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        queryParams: currentRequest.queryParams,
        body: currentRequest.body,
        createdAt: new Date().toISOString()
    };

    savedRequests.unshift(savedRequest);
    saveStorageData();
    renderCollections();
    renderSavedRequests();
    showStatus("Request saved.", "success");
}

/**
 * Creates a new saved request collection.
 */
function createCollection(name) {
    const cleanName = name.trim();

    if (!cleanName) {
        showStatus("Enter a collection name.", "error");
        return;
    }

    const collection = {
        id: crypto.randomUUID(),
        name: cleanName,
        createdAt: new Date().toISOString()
    };

    collections.push(collection);
    activeCollectionId = collection.id;
    collectionNameInput.value = "";
    saveStorageData();
    renderCollections();
    renderSavedRequests();
    showStatus("Collection created.", "success");
}

/**
 * Displays collections and request counts.
 */
function renderCollections() {
    if (!collections.length) {
        collectionsList.innerHTML = '<div class="empty-state">No collections yet.</div>';
        return;
    }

    collectionsList.innerHTML = collections.map((collection) => {
        const count = savedRequests.filter((request) => request.collectionId === collection.id).length;
        const activeClass = collection.id === activeCollectionId ? " active" : "";

        return `
      <article class="collection-card${activeClass}" data-id="${collection.id}">
        <h4>${escapeHtml(collection.name)}</h4>
        <p>${count} saved request${count === 1 ? "" : "s"}</p>
        <div class="card-actions">
          <button class="btn btn-outline-info select-collection" type="button">Select</button>
        </div>
      </article>
    `;
    }).join("");
}

/**
 * Displays saved requests in the sidebar.
 */
function renderSavedRequests() {
    filterSavedRequests(searchSavedRequests.value);
}

/**
 * Filters saved requests by search term.
 */
function filterSavedRequests(term) {
    const cleanTerm = term.trim().toLowerCase();

    const filtered = savedRequests.filter((request) => {
        const collection = collections.find((item) => item.id === request.collectionId);
        const haystack = [
            request.name,
            request.method,
            request.url,
            collection ? collection.name : ""
        ].join(" ").toLowerCase();

        return haystack.includes(cleanTerm);
    });

    if (!filtered.length) {
        savedRequestsList.innerHTML = '<div class="empty-state">No matching saved requests.</div>';
        return;
    }

    savedRequestsList.innerHTML = filtered.map((request) => {
        const collection = collections.find((item) => item.id === request.collectionId);
        const methodClass = request.method.toLowerCase();

        return `
      <article class="saved-card" data-id="${request.id}">
        <h4><span class="method-badge ${methodClass}">${escapeHtml(request.method)}</span>${escapeHtml(request.name)}</h4>
        <p>${escapeHtml(request.url)}</p>
        <p>${escapeHtml(collection ? collection.name : "Unassigned")}</p>
        <div class="card-actions">
          <button class="btn btn-outline-info load-request" type="button">Load</button>
          <button class="btn btn-outline-danger delete-request" type="button">Delete</button>
        </div>
      </article>
    `;
    }).join("");
}

/**
 * Deletes a saved request by ID.
 */
function deleteSavedRequest(id) {
    savedRequests = savedRequests.filter((request) => request.id !== id);
    saveStorageData();
    renderCollections();
    renderSavedRequests();
    showStatus("Saved request deleted.", "success");
}

/**
 * Loads collections and saved requests from localStorage.
 */
function loadStorageData() {
    try {
        savedRequests = JSON.parse(localStorage.getItem("postmanLiteSavedRequests")) || [];
        collections = JSON.parse(localStorage.getItem("postmanLiteCollections")) || [];
        activeCollectionId = localStorage.getItem("postmanLiteActiveCollectionId") || null;
    } catch (error) {
        savedRequests = [];
        collections = [];
        activeCollectionId = null;
        showStatus("Stored data could not be loaded.", "error");
    }
}

/**
 * Persists collections and saved requests to localStorage.
 */
function saveStorageData() {
    localStorage.setItem("postmanLiteSavedRequests", JSON.stringify(savedRequests));
    localStorage.setItem("postmanLiteCollections", JSON.stringify(collections));
    localStorage.setItem("postmanLiteActiveCollectionId", activeCollectionId || "");
}

/**
 * Copies the latest response to the clipboard.
 */
async function copyResponse() {
    if (!lastResponse) {
        showStatus("No response to copy.", "error");
        return;
    }

    const output = lastResponse.isJson ? formatJson(lastResponse.json) : lastResponse.raw;
    await navigator.clipboard.writeText(output);
    showStatus("Response copied to clipboard.", "success");
}

/**
 * Downloads the latest response as api-response.json.
 */
function downloadResponseJson() {
    if (!lastResponse) {
        showStatus("No response to download.", "error");
        return;
    }

    const payload = {
        status: lastResponse.status,
        statusText: lastResponse.statusText,
        time: lastResponse.time,
        size: lastResponse.size,
        contentType: lastResponse.contentType,
        headers: lastResponse.headers,
        body: lastResponse.isJson ? lastResponse.json : lastResponse.raw
    };

    downloadJson(payload, "api-response.json");
    showStatus("Response JSON downloaded.", "success");
}

/**
 * Exports all saved collections and requests as JSON.
 */
function exportCollection() {
    const payload = {
        exportedAt: new Date().toISOString(),
        collections,
        requests: savedRequests
    };

    downloadJson(payload, "postman-lite-collection.json");
    showStatus("Collection export downloaded.", "success");
}

/**
 * Loads a sample GET request into the builder.
 */
function loadSampleRequest() {
    currentRequest = {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        headers: [],
        queryParams: [],
        body: ""
    };

    loadRequestIntoUI({
        name: "Sample GET Post",
        ...currentRequest
    });
}

/**
 * Converts bytes into a readable display value.
 */
function formatBytes(bytes) {
    if (bytes === 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, index);

    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index] || "MB"}`;
}

/**
 * Pretty prints JSON safely.
 */
function formatJson(value) {
    try {
        return JSON.stringify(value, null, 2);
    } catch (error) {
        return String(value);
    }
}

/**
 * Escapes generated HTML content.
 */
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * Shows a status message with a visual type.
 */
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-banner ${type || ""}`.trim();
}

/**
 * Toggles request loading controls.
 */
function setLoading(isLoading) {
    sendRequestBtn.disabled = isLoading;
    sendRequestBtnSecondary.disabled = isLoading;
    sendRequestBtn.textContent = isLoading ? "Sending..." : "Send Request";
    sendRequestBtnSecondary.textContent = isLoading ? "Sending..." : "Send";
}

/**
 * Clears request builder, response viewer, and status.
 */
function handleClear() {
    currentRequest = {
        method: "GET",
        url: "",
        headers: [],
        queryParams: [],
        body: ""
    };

    lastResponse = null;
    methodSelect.value = "GET";
    requestUrlInput.value = "";
    requestBody.value = "";
    responseStatus.textContent = "-";
    responseTime.textContent = "-";
    responseSize.textContent = "-";
    responseContentType.textContent = "-";
    prettyResponse.textContent = "No response yet.";
    rawResponse.textContent = "No response yet.";
    renderHeadersEditor();
    renderQueryParamsEditor();
    showStatus("Cleared request builder.", "info");
}

/**
 * Downloads a JSON payload with the supplied filename.
 */
function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Wires UI events after the DOM has loaded.
 */
function bindEventListeners() {
    sendRequestBtn.addEventListener("click", sendApiRequest);
    sendRequestBtnSecondary.addEventListener("click", sendApiRequest);
    loadSampleBtn.addEventListener("click", loadSampleRequest);
    clearBtn.addEventListener("click", handleClear);
    addHeaderBtn.addEventListener("click", addHeaderRow);
    addQueryParamBtn.addEventListener("click", addQueryParamRow);
    saveRequestBtn.addEventListener("click", saveCurrentRequest);
    exportCollectionBtn.addEventListener("click", exportCollection);
    copyResponseBtn.addEventListener("click", copyResponse);
    downloadResponseBtn.addEventListener("click", downloadResponseJson);

    validateJsonBtn.addEventListener("click", () => {
        const result = validateJsonBody(requestBody.value);
        showStatus(result.valid ? "JSON body is valid." : `Invalid JSON body: ${result.error}`, result.valid ? "success" : "error");
    });

    createCollectionBtn.addEventListener("click", () => {
        createCollection(collectionNameInput.value);
    });

    searchSavedRequests.addEventListener("input", () => {
        filterSavedRequests(searchSavedRequests.value);
    });

    $(headersList).on("click", ".remove-header", function () {
        removeHeaderRow(Number($(this).closest(".editor-row").data("index")));
    });

    $(queryParamsList).on("click", ".remove-query-param", function () {
        removeQueryParamRow(Number($(this).closest(".editor-row").data("index")));
    });

    $(collectionsList).on("click", ".select-collection", function () {
        activeCollectionId = $(this).closest(".collection-card").data("id");
        saveStorageData();
        renderCollections();
        renderSavedRequests();
        showStatus("Collection selected for new saved requests.", "success");
    });

    $(savedRequestsList).on("click", ".load-request", function () {
        const id = $(this).closest(".saved-card").data("id");
        const request = savedRequests.find((item) => item.id === id);

        if (request) {
            loadRequestIntoUI(request);
        }
    });

    $(savedRequestsList).on("click", ".delete-request", function () {
        const id = $(this).closest(".saved-card").data("id");
        deleteSavedRequest(id);
    });
}

/**
 * Initializes the app from storage and renders default editors.
 */
function initApp() {
    loadStorageData();
    renderHeadersEditor();
    renderQueryParamsEditor();
    renderCollections();
    renderSavedRequests();
    bindEventListeners();
}

initApp();