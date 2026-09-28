const API_BASE_URL = (typeof window !== "undefined" && window.location.protocol === "file:") ? "http://127.0.0.1:8000" : "";

let debounceTimer = null;

function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

function getPriorityBadgeClass(priority) {
    switch (priority) {
        case "High": return "badge-high";
        case "Medium": return "badge-medium";
        case "Low": return "badge-low";
        default: return "";
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case "Open": return "badge-open";
        case "In Progress": return "badge-in-progress";
        case "Resolved": return "badge-resolved";
        default: return "";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function debounce(func, delay = 300) {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func(...args), delay);
    };
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        if (!response.ok) throw new Error("Failed to load statistics");
        const stats = await response.json();
        
        document.getElementById("stat-total").textContent = stats.total ?? 0;
        document.getElementById("stat-open").textContent = stats.open ?? 0;
        document.getElementById("stat-in-progress").textContent = stats.in_progress ?? 0;
        document.getElementById("stat-resolved").textContent = stats.resolved ?? 0;
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

async function loadAttentionTickets() {
    const container = document.getElementById("pulse-container");
    try {
        container.innerHTML = `<p class="empty-text">Loading Support Pulse...</p>`;
        const response = await fetch(`${API_BASE_URL}/api/tickets/attention`);
        if (!response.ok) throw new Error("Failed to load attention tickets");
        const tickets = await response.json();
        
        if (!tickets || tickets.length === 0) {
            container.innerHTML = `<p class="empty-text">No tickets require immediate attention.</p>`;
            return;
        }

        container.innerHTML = tickets.map(ticket => `
            <div class="pulse-card">
                <div class="pulse-card-header">
                    <div>
                        <div class="pulse-card-title">${escapeHtml(ticket.title)}</div>
                        <div class="pulse-client">${escapeHtml(ticket.client)}</div>
                    </div>
                    <span class="badge ${getPriorityBadgeClass(ticket.priority)}">${ticket.priority}</span>
                </div>
                <div class="pulse-reason">${escapeHtml(ticket.reason)}</div>
            </div>
        `).join("");

    } catch (error) {
        console.error("Error loading attention tickets:", error);
        container.innerHTML = `<p class="error-text">Unable to load Support Pulse at this time.</p>`;
    }
}

async function loadTickets() {
    const container = document.getElementById("ticket-list");
    const searchVal = document.getElementById("search-input").value.trim();
    const statusVal = document.getElementById("status-filter").value;
    const priorityVal = document.getElementById("priority-filter").value;

    const params = new URLSearchParams();
    if (searchVal) params.append("search", searchVal);
    if (statusVal) params.append("status", statusVal);
    if (priorityVal) params.append("priority", priorityVal);

    const queryString = params.toString() ? `?${params.toString()}` : "";

    try {
        container.innerHTML = `<p class="empty-text">Loading tickets...</p>`;
        const response = await fetch(`${API_BASE_URL}/api/tickets${queryString}`);
        if (!response.ok) throw new Error("Failed to load tickets");
        const tickets = await response.json();

        if (!tickets || tickets.length === 0) {
            container.innerHTML = `<p class="empty-text">No tickets found.</p>`;
            return;
        }

        container.innerHTML = tickets.map(ticket => `
            <div class="ticket-card" data-id="${ticket.id}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(ticket.title)}">
                <div class="ticket-card-top">
                    <div>
                        <h3 class="ticket-title">${escapeHtml(ticket.title)}</h3>
                        <p class="ticket-client">${escapeHtml(ticket.client)}</p>
                    </div>
                    <div class="ticket-badges">
                        <span class="badge ${getPriorityBadgeClass(ticket.priority)}">${ticket.priority}</span>
                        <span class="badge ${getStatusBadgeClass(ticket.status)}">${ticket.status}</span>
                    </div>
                </div>
                <div class="ticket-card-bottom">
                    <span class="ticket-date">Created: ${formatDate(ticket.created_date)}</span>
                </div>
            </div>
        `).join("");

        container.querySelectorAll(".ticket-card").forEach(card => {
            const ticketId = card.getAttribute("data-id");
            card.addEventListener("click", () => {
                if (ticketId) openDetailsModal(ticketId, card);
            });
            card.addEventListener("keydown", (e) => {
                if ((e.key === "Enter" || e.key === " ") && ticketId) {
                    e.preventDefault();
                    openDetailsModal(ticketId, card);
                }
            });
        });

    } catch (error) {
        console.error("Error loading tickets:", error);
        container.innerHTML = `<p class="error-text">Unable to load tickets at this time.</p>`;
    }
}

let lastActiveElement = null;

function closeModal() {
    const modalContainer = document.getElementById("modal-container");
    const modalBody = document.getElementById("modal-body");
    if (!modalContainer) return;
    modalContainer.classList.add("hidden");
    modalContainer.setAttribute("aria-hidden", "true");
    modalBody.innerHTML = "";
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
        lastActiveElement.focus();
    } else {
        const newTicketBtn = document.getElementById("btn-new-ticket");
        if (newTicketBtn) newTicketBtn.focus();
    }
    lastActiveElement = null;
}

async function openDetailsModal(ticketId, triggerElement) {
    const modalContainer = document.getElementById("modal-container");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    if (!modalContainer || !modalBody) return;

    lastActiveElement = triggerElement || document.activeElement;
    modalTitle.textContent = "Ticket Details";
    modalBody.innerHTML = `<p class="empty-text">Loading ticket...</p>`;
    modalContainer.classList.remove("hidden");
    modalContainer.setAttribute("aria-hidden", "false");

    try {
        const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`);
        if (response.status === 404) {
            modalBody.innerHTML = `<p class="error-text">Ticket not found.</p>`;
            return;
        }
        if (!response.ok) {
            throw new Error(`Failed to load ticket details (Status: ${response.status})`);
        }

        const ticket = await response.json();
        const isResolved = ticket.status === "Resolved";

        modalBody.innerHTML = `
            <div class="ticket-details">
                <div id="detail-error" class="form-error hidden"></div>
                ${isResolved ? `
                    <div class="locked-banner" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); color: #065f46; padding: 0.6rem 0.85rem; border-radius: var(--radius); font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <span style="font-size: 1.1rem;">🔒</span>
                        <div>
                            <strong>Ticket Resolved & Locked</strong> &mdash; This ticket is read-only. Use "Restart Ticket" to reopen it.
                        </div>
                    </div>
                ` : ''}
                <div class="detail-group">
                    <span class="detail-label">Title</span>
                    <h3 class="detail-value ticket-title">${escapeHtml(ticket.title)}</h3>
                </div>
                <div class="detail-group">
                    <span class="detail-label">Client</span>
                    <span class="detail-value">${escapeHtml(ticket.client)}</span>
                </div>
                <div class="detail-group">
                    <span class="detail-label">Description</span>
                    <div class="detail-description ${!ticket.description ? 'empty-text' : ''}">
                        ${ticket.description ? escapeHtml(ticket.description) : 'No description provided.'}
                    </div>
                </div>
                <div class="detail-grid">
                    <div class="detail-group">
                        <label for="detail-priority" class="detail-label">Priority</label>
                        ${isResolved ? `
                            <div style="margin-top: 0.25rem;">
                                <span class="badge ${getPriorityBadgeClass(ticket.priority)}">${ticket.priority}</span>
                            </div>
                        ` : `
                            <select id="detail-priority" class="form-control">
                                <option value="Low" ${ticket.priority === 'Low' ? 'selected' : ''}>Low</option>
                                <option value="Medium" ${ticket.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                                <option value="High" ${ticket.priority === 'High' ? 'selected' : ''}>High</option>
                            </select>
                        `}
                    </div>
                    <div class="detail-group">
                        <label for="detail-status" class="detail-label">Status</label>
                        ${isResolved ? `
                            <div style="margin-top: 0.25rem;">
                                <span class="badge ${getStatusBadgeClass(ticket.status)}">${ticket.status}</span>
                            </div>
                        ` : `
                            <select id="detail-status" class="form-control">
                                <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
                                <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                            </select>
                        `}
                    </div>
                </div>

                ${isResolved ? `
                    <div class="detail-group">
                        <span class="detail-label">Resolution</span>
                        <div class="timeline-resolution-box" style="margin-top: 0.25rem;">${escapeHtml(ticket.resolution_summary || 'No resolution details recorded.')}</div>
                    </div>
                ` : `
                    <div id="detail-resolution-group" class="detail-group hidden">
                        <label for="detail-resolution-summary" class="detail-label">Resolve Ticket <span style="color: var(--priority-high);">*</span></label>
                        <p class="resolution-helper" style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem; margin-bottom: 0.35rem;">How was the issue resolved? Briefly describe the solution or action taken.</p>
                        <textarea id="detail-resolution-summary" class="form-control" rows="3" placeholder="Describe the resolution...">${escapeHtml(ticket.resolution_summary || '')}</textarea>
                    </div>

                    ${ticket.resolution_summary ? `
                        <div class="detail-group">
                            <span class="detail-label" style="color: var(--text-muted);">Previous Resolution (Historical)</span>
                            <div class="timeline-resolution-box" style="margin-top: 0.25rem; opacity: 0.9;">${escapeHtml(ticket.resolution_summary)}</div>
                        </div>
                    ` : ''}
                `}

                <div class="detail-grid">
                    <div class="detail-group">
                        <span class="detail-label">Created Date</span>
                        <span class="detail-value">${formatDate(ticket.created_date)}</span>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">Updated Date</span>
                        <span class="detail-value">${formatDate(ticket.updated_date)}</span>
                    </div>
                </div>

                <div class="detail-group history-section">
                    <span class="detail-label">Ticket History</span>
                    <div id="history-container" class="history-timeline">
                        <p class="empty-text">Loading ticket history...</p>
                    </div>
                </div>

                <div class="form-actions" style="justify-content: space-between;">
                    <button type="button" id="btn-delete-ticket" class="btn btn-danger">Delete Ticket</button>
                    <div style="display: flex; gap: 0.5rem;">
                        ${isResolved ? `
                            <button type="button" id="btn-cancel-details" class="btn btn-secondary">Close</button>
                            <button type="button" id="btn-restart-ticket" class="btn btn-warning">Restart Ticket</button>
                        ` : `
                            <button type="button" id="btn-cancel-details" class="btn btn-secondary">Cancel</button>
                            <button type="button" id="btn-save-ticket" class="btn btn-primary">Save Changes</button>
                        `}
                    </div>
                </div>
            </div>
        `;

        const saveBtn = document.getElementById("btn-save-ticket");
        const restartBtn = document.getElementById("btn-restart-ticket");
        const cancelBtn = document.getElementById("btn-cancel-details");
        const deleteBtn = document.getElementById("btn-delete-ticket");
        const errorDiv = document.getElementById("detail-error");
        const statusSelect = document.getElementById("detail-status");
        const resGroup = document.getElementById("detail-resolution-group");

        if (statusSelect && resGroup) {
            statusSelect.addEventListener("change", () => {
                if (statusSelect.value === "Resolved") {
                    resGroup.classList.remove("hidden");
                    const labelEl = resGroup.querySelector("label");
                    if (labelEl && ticket.status !== "Resolved") {
                        labelEl.innerHTML = `Resolve Ticket <span style="color: var(--priority-high);">*</span>`;
                    }
                } else if (ticket.status !== "Resolved") {
                    resGroup.classList.add("hidden");
                }
            });
        }

        // Fetch Ticket History
        (async () => {
            const historyContainer = document.getElementById("history-container");
            if (!historyContainer) return;
            try {
                const historyResp = await fetch(`${API_BASE_URL}/api/tickets/${ticket.id}/history`);
                if (!historyResp.ok) {
                    historyContainer.innerHTML = `<p class="error-text">Unable to load ticket history.</p>`;
                    return;
                }
                const activities = await historyResp.json();
                if (!activities || activities.length === 0) {
                    historyContainer.innerHTML = `<p class="empty-text">No activity recorded yet.</p>`;
                    return;
                }
                historyContainer.innerHTML = `
                    <ul class="timeline">
                        ${activities.map(act => {
                            let changeDetail = "";
                            if (act.action === "Ticket restarted") {
                                changeDetail = `<div class="timeline-change">${escapeHtml(act.old_value || 'Resolved')} &rarr; ${escapeHtml(act.new_value || 'Open')}</div>`;
                            } else if (act.action === "Resolution recorded" || act.action === "Resolution updated") {
                                changeDetail = `<div class="timeline-resolution-box">${escapeHtml(act.new_value || '')}</div>`;
                            } else if (act.old_value && act.new_value) {
                                changeDetail = `<div class="timeline-change">${escapeHtml(act.old_value)} &rarr; ${escapeHtml(act.new_value)}</div>`;
                            }
                            return `
                                <li class="timeline-item">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <div class="timeline-header">
                                            <span class="timeline-action">${escapeHtml(act.action)}</span>
                                            <span class="timeline-date">${formatDate(act.created_at)}</span>
                                        </div>
                                        ${changeDetail}
                                    </div>
                                </li>
                            `;
                        }).join("")}
                    </ul>
                `;
            } catch (histErr) {
                console.error("Error fetching ticket history:", histErr);
                historyContainer.innerHTML = `<p class="error-text">Unable to load ticket history.</p>`;
            }
        })();

        if (cancelBtn) {
            cancelBtn.addEventListener("click", closeModal);
        }

        if (restartBtn) {
            restartBtn.addEventListener("click", () => {
                modalTitle.textContent = "Confirm Ticket Restart";
                modalBody.innerHTML = `
                    <div class="confirm-box">
                        <div id="restart-error" class="form-error hidden"></div>
                        <p class="confirm-text" style="line-height: 1.5;">
                            Are you sure you want to restart this ticket?
                            <br><br>
                            The ticket status will return to <strong>Open</strong>, and its existing activity history and previous resolution details will be preserved.
                        </p>
                        <div class="form-actions" style="justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
                            <button type="button" id="btn-cancel-restart" class="btn btn-secondary">Cancel</button>
                            <button type="button" id="btn-confirm-restart" class="btn btn-warning">Confirm Restart</button>
                        </div>
                    </div>
                `;

                const cancelRestartBtn = document.getElementById("btn-cancel-restart");
                const confirmRestartBtn = document.getElementById("btn-confirm-restart");
                const restartErrorDiv = document.getElementById("restart-error");

                if (cancelRestartBtn) {
                    cancelRestartBtn.addEventListener("click", () => {
                        openDetailsModal(ticket.id, triggerElement);
                    });
                }

                if (confirmRestartBtn) {
                    confirmRestartBtn.addEventListener("click", async () => {
                        restartErrorDiv.classList.add("hidden");
                        confirmRestartBtn.disabled = true;
                        confirmRestartBtn.textContent = "Restarting...";
                        if (cancelRestartBtn) cancelRestartBtn.disabled = true;

                        try {
                            const response = await fetch(`${API_BASE_URL}/api/tickets/${ticket.id}`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ status: "Open" })
                            });

                            if (!response.ok) {
                                const errJson = await response.json().catch(() => ({}));
                                throw new Error(errJson.detail || "Unable to restart ticket. Please try again.");
                            }

                            loadTickets();
                            loadStats();
                            loadAttentionTickets();
                            if (typeof showAlert === "function") {
                                showAlert("Ticket restarted successfully. Returned to Open status.");
                            }

                            openDetailsModal(ticket.id, triggerElement);

                        } catch (error) {
                            console.error("Error restarting ticket:", error);
                            restartErrorDiv.textContent = error.message || "Unable to restart ticket. Please try again.";
                            restartErrorDiv.classList.remove("hidden");
                            confirmRestartBtn.disabled = false;
                            confirmRestartBtn.textContent = "Confirm Restart";
                            if (cancelRestartBtn) cancelRestartBtn.disabled = false;
                        }
                    });
                }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                modalTitle.textContent = "Confirm Deletion";
                modalBody.innerHTML = `
                    <div class="confirm-box">
                        <div id="delete-error" class="form-error hidden"></div>
                        <p class="confirm-text">Are you sure you want to delete this ticket? This action cannot be undone.</p>
                        <div class="form-actions">
                            <button type="button" id="btn-cancel-delete" class="btn btn-secondary">Cancel</button>
                            <button type="button" id="btn-confirm-delete" class="btn btn-danger">Confirm Delete</button>
                        </div>
                    </div>
                `;

                const cancelDeleteBtn = document.getElementById("btn-cancel-delete");
                const confirmDeleteBtn = document.getElementById("btn-confirm-delete");
                const deleteErrorDiv = document.getElementById("delete-error");

                if (cancelDeleteBtn) {
                    cancelDeleteBtn.addEventListener("click", () => {
                        openDetailsModal(ticket.id, triggerElement);
                    });
                }

                if (confirmDeleteBtn) {
                    confirmDeleteBtn.addEventListener("click", async () => {
                        deleteErrorDiv.classList.add("hidden");
                        confirmDeleteBtn.disabled = true;
                        confirmDeleteBtn.textContent = "Deleting...";
                        if (cancelDeleteBtn) cancelDeleteBtn.disabled = true;

                        try {
                            const response = await fetch(`${API_BASE_URL}/api/tickets/${ticket.id}`, {
                                method: "DELETE"
                            });

                            if (response.status === 404) {
                                throw new Error("Ticket not found.");
                            }
                            if (!response.ok && response.status !== 204) {
                                const errJson = await response.json().catch(() => ({}));
                                throw new Error(errJson.detail || "Unable to delete ticket. Please try again.");
                            }

                            closeModal();
                            loadTickets();
                            loadStats();
                            loadAttentionTickets();
                            if (typeof showAlert === "function") {
                                showAlert("Ticket deleted successfully.");
                            }

                        } catch (error) {
                            console.error("Error deleting ticket:", error);
                            deleteErrorDiv.textContent = error.message || "Unable to delete ticket. Please try again.";
                            deleteErrorDiv.classList.remove("hidden");
                            confirmDeleteBtn.disabled = false;
                            confirmDeleteBtn.textContent = "Confirm Delete";
                            if (cancelDeleteBtn) cancelDeleteBtn.disabled = false;
                        }
                    });
                }
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener("click", async () => {
                const newPriority = document.getElementById("detail-priority").value;
                const newStatus = document.getElementById("detail-status").value;
                const resTextarea = document.getElementById("detail-resolution-summary");
                const newResSummary = resTextarea ? resTextarea.value.trim() : "";

                const patchData = {};
                if (newPriority !== ticket.priority) {
                    patchData.priority = newPriority;
                }
                if (newStatus !== ticket.status) {
                    patchData.status = newStatus;
                }

                if (newStatus === "Resolved") {
                    if (!newResSummary) {
                        errorDiv.textContent = "Please describe how the issue was resolved.";
                        errorDiv.classList.remove("hidden");
                        if (resTextarea) resTextarea.focus();
                        return;
                    }
                    if (newResSummary !== (ticket.resolution_summary || "")) {
                        patchData.resolution_summary = newResSummary;
                    }
                } else if (newResSummary !== (ticket.resolution_summary || "") && newResSummary !== "") {
                    patchData.resolution_summary = newResSummary;
                }

                if (Object.keys(patchData).length === 0) {
                    errorDiv.textContent = "No changes to save.";
                    errorDiv.classList.remove("hidden");
                    return;
                }

                errorDiv.classList.add("hidden");
                saveBtn.disabled = true;
                saveBtn.textContent = "Saving...";

                try {
                    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticket.id}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(patchData)
                    });

                    if (response.status === 404) {
                        throw new Error("Ticket not found.");
                    }
                    if (!response.ok) {
                        const errJson = await response.json().catch(() => ({}));
                        throw new Error(errJson.detail || "Unable to update ticket. Please try again.");
                    }

                    closeModal();
                    loadTickets();
                    loadStats();
                    loadAttentionTickets();
                    if (typeof showAlert === "function") {
                        showAlert("Ticket updated successfully.");
                    }

                } catch (error) {
                    console.error("Error updating ticket:", error);
                    errorDiv.textContent = error.message || "Unable to update ticket. Please try again.";
                    errorDiv.classList.remove("hidden");
                    saveBtn.disabled = false;
                    saveBtn.textContent = "Save Changes";
                }
            });
        }
    } catch (error) {
        console.error("Error loading ticket details:", error);
        modalBody.innerHTML = `<p class="error-text">Unable to load ticket details.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadStats();
    loadAttentionTickets();
    loadTickets();

    const searchInput = document.getElementById("search-input");
    const statusFilter = document.getElementById("status-filter");
    const priorityFilter = document.getElementById("priority-filter");
    const clearBtn = document.getElementById("btn-clear-filters");
    const newTicketBtn = document.getElementById("btn-new-ticket");
    const modalContainer = document.getElementById("modal-container");
    const closeModalBtn = document.getElementById("btn-close-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const alertBanner = document.getElementById("alert-banner");

    let alertTimeout = null;

    function showAlert(message) {
        if (!alertBanner) return;
        alertBanner.textContent = message;
        alertBanner.classList.remove("hidden");
        clearTimeout(alertTimeout);
        alertTimeout = setTimeout(() => {
            alertBanner.classList.add("hidden");
            alertBanner.textContent = "";
        }, 3000);
    }

    function openCreateModal() {
        if (!modalContainer || !modalBody) return;
        lastActiveElement = document.activeElement;
        modalTitle.textContent = "Create Ticket";
        modalBody.innerHTML = `
            <form id="create-ticket-form" class="create-form">
                <div id="form-error" class="form-error hidden"></div>
                <div class="form-group">
                    <label for="create-title" class="form-label">Title *</label>
                    <input type="text" id="create-title" class="form-control" placeholder="Ticket title" required>
                </div>
                <div class="form-group">
                    <label for="create-client" class="form-label">Client *</label>
                    <input type="text" id="create-client" class="form-control" placeholder="Client name" required>
                </div>
                <div class="form-group">
                    <label for="create-description" class="form-label">Description</label>
                    <textarea id="create-description" class="form-control" placeholder="Describe the issue..."></textarea>
                </div>
                <div class="form-group">
                    <label for="create-priority" class="form-label">Priority *</label>
                    <select id="create-priority" class="form-control" required>
                        <option value="Low">Low</option>
                        <option value="Medium" selected>Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" id="btn-cancel-modal" class="btn btn-secondary">Cancel</button>
                    <button type="submit" id="btn-submit-ticket" class="btn btn-primary">Create Ticket</button>
                </div>
            </form>
        `;

        modalContainer.classList.remove("hidden");
        modalContainer.setAttribute("aria-hidden", "false");

        const titleInput = document.getElementById("create-title");
        if (titleInput) {
            titleInput.focus();
        }

        const cancelBtn = document.getElementById("btn-cancel-modal");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", closeModal);
        }

        const form = document.getElementById("create-ticket-form");
        if (form) {
            form.addEventListener("submit", handleCreateSubmit);
        }
    }

    async function handleCreateSubmit(e) {
        e.preventDefault();

        const formError = document.getElementById("form-error");
        const submitBtn = document.getElementById("btn-submit-ticket");
        const titleInput = document.getElementById("create-title");
        const clientInput = document.getElementById("create-client");
        const descriptionInput = document.getElementById("create-description");
        const prioritySelect = document.getElementById("create-priority");

        formError.classList.add("hidden");
        formError.textContent = "";

        const title = titleInput.value.trim();
        const client = clientInput.value.trim();
        const description = descriptionInput ? descriptionInput.value.trim() : "";
        const priority = prioritySelect ? prioritySelect.value : "Medium";

        if (!title || !client) {
            formError.textContent = "Title and Client fields cannot be empty or whitespace only.";
            formError.classList.remove("hidden");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Creating...";

        try {
            const response = await fetch(`${API_BASE_URL}/api/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    client: client,
                    description: description || null,
                    priority: priority
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Unable to create ticket. Please try again.");
            }

            closeModal();
            loadTickets();
            loadStats();
            loadAttentionTickets();
            showAlert("Ticket created successfully.");

        } catch (error) {
            console.error("Error creating ticket:", error);
            formError.textContent = error.message || "Unable to create ticket. Please try again.";
            formError.classList.remove("hidden");
            submitBtn.disabled = false;
            submitBtn.textContent = "Create Ticket";
        }
    }

    searchInput.addEventListener("input", debounce(() => loadTickets(), 300));
    statusFilter.addEventListener("change", () => loadTickets());
    priorityFilter.addEventListener("change", () => loadTickets());

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            statusFilter.value = "";
            priorityFilter.value = "";
            loadTickets();
        });
    }

    if (newTicketBtn) {
        newTicketBtn.addEventListener("click", openCreateModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModal);
    }

    if (modalContainer) {
        modalContainer.addEventListener("click", (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalContainer && !modalContainer.classList.contains("hidden")) {
            closeModal();
        }
    });
});
