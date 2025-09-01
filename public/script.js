// WhatsApp Bot Dashboard JavaScript
class WhatsAppDashboard {
  constructor() {
    this.messageHistory = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadStatus();
    await this.loadAutoReplyStatus();
    this.startPeriodicUpdates();
  }

  setupEventListeners() {
    // Message form
    document.getElementById("messageForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Message type toggle
    document.getElementById("messageType").addEventListener("change", (e) => {
      this.toggleMessageType(e.target.value);
    });

    // Auto-reply form
    document.getElementById("autoReplyForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.updateAutoReplyMessage();
    });

    // Quick actions
    document.getElementById("toggleAutoReply").addEventListener("click", () => {
      this.toggleAutoReply();
    });

    document.getElementById("checkReplies").addEventListener("click", () => {
      this.checkReplies();
    });

    document.getElementById("refreshStatus").addEventListener("click", () => {
      this.loadStatus();
      this.loadAutoReplyStatus();
    });
  }

  toggleMessageType(type) {
    const textSection = document.getElementById("textMessageSection");
    const mediaSection = document.getElementById("mediaMessageSection");

    if (type === "text") {
      textSection.style.display = "block";
      mediaSection.style.display = "none";
      document.getElementById("messageText").required = true;
      document.getElementById("mediaFile").required = false;
    } else {
      textSection.style.display = "none";
      mediaSection.style.display = "block";
      document.getElementById("messageText").required = false;
      document.getElementById("mediaFile").required = true;
    }
  }

  async sendMessage() {
    const phoneNumber = document.getElementById("phoneNumber").value;
    const messageType = document.getElementById("messageType").value;
    const submitBtn = document.querySelector(
      '#messageForm button[type="submit"]'
    );

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
      let response;

      if (messageType === "text") {
        const message = document.getElementById("messageText").value;
        response = await this.sendTextMessage(phoneNumber, message);
      } else {
        const file = document.getElementById("mediaFile").files[0];
        const caption = document.getElementById("mediaCaption").value;
        response = await this.sendMediaMessage(phoneNumber, file, caption);
      }

      if (response.ok) {
        this.showAlert("Message sent successfully!", "success");
        this.addToHistory({
          type: messageType,
          to: phoneNumber,
          content:
            messageType === "text"
              ? document.getElementById("messageText").value
              : "Media file",
          timestamp: new Date(),
          id: response.id,
        });
        this.clearForm();
        this.updateStatistics();
      } else {
        this.showAlert(`Failed to send message: ${response.error}`, "danger");
      }
    } catch (error) {
      this.showAlert(`Error: ${error.message}`, "danger");
    } finally {
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
  }

  async sendTextMessage(to, message) {
    const response = await fetch("/send-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, message }),
    });
    return await response.json();
  }

  async sendMediaMessage(to, file, caption) {
    const formData = new FormData();
    formData.append("to", to);
    formData.append("file", file);
    if (caption) formData.append("caption", caption);

    const response = await fetch("/send-media", {
      method: "POST",
      body: formData,
    });
    return await response.json();
  }

  async loadStatus() {
    try {
      const response = await fetch("/status");
      const data = await response.json();
      this.updateStatusDisplay(data);
    } catch (error) {
      console.error("Failed to load status:", error);
      this.updateStatusDisplay({ ok: false });
    }
  }

  updateStatusDisplay(status) {
    const statusElement = document.getElementById("botStatus");
    if (status.ok && status.state) {
      statusElement.innerHTML = `
                <span class="status-indicator status-online"></span>
                <span>Online - ${status.pushname || "Connected"}</span>
            `;
    } else {
      statusElement.innerHTML = `
                <span class="status-indicator status-offline"></span>
                <span>Offline or Connecting...</span>
            `;
    }
  }

  async loadAutoReplyStatus() {
    try {
      const response = await fetch("/auto-reply/status");
      const data = await response.json();
      this.updateAutoReplyDisplay(data);
    } catch (error) {
      console.error("Failed to load auto-reply status:", error);
    }
  }

  updateAutoReplyDisplay(status) {
    const statusElement = document.getElementById("autoReplyStatus");
    const messageInput = document.getElementById("autoReplyMessage");

    if (status.enabled) {
      statusElement.innerHTML = `
                <span class="status-indicator status-online"></span>
                <span>Enabled</span>
                <button id="toggleAutoReply" class="btn btn-sm btn-outline-danger ms-2">Disable</button>
            `;
    } else {
      statusElement.innerHTML = `
                <span class="status-indicator status-offline"></span>
                <span>Disabled</span>
                <button id="toggleAutoReply" class="btn btn-sm btn-outline-success ms-2">Enable</button>
            `;
    }

    messageInput.value = status.message || "";

    // Re-attach event listener
    document.getElementById("toggleAutoReply").addEventListener("click", () => {
      this.toggleAutoReply();
    });

    // Update statistics
    document.getElementById("autoRepliesSent").textContent =
      status.totalAutoReplied || 0;
  }

  async toggleAutoReply() {
    try {
      const response = await fetch("/auto-reply/toggle", { method: "POST" });
      const data = await response.json();
      this.updateAutoReplyDisplay(data);
      this.showAlert(
        `Auto-reply ${data.enabled ? "enabled" : "disabled"}`,
        "info"
      );
    } catch (error) {
      this.showAlert(`Failed to toggle auto-reply: ${error.message}`, "danger");
    }
  }

  async updateAutoReplyMessage() {
    const message = document.getElementById("autoReplyMessage").value;
    if (!message.trim()) {
      this.showAlert("Please enter an auto-reply message", "warning");
      return;
    }

    try {
      const response = await fetch("/auto-reply/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      this.showAlert("Auto-reply message updated successfully!", "success");
    } catch (error) {
      this.showAlert(
        `Failed to update auto-reply message: ${error.message}`,
        "danger"
      );
    }
  }

  async checkReplies() {
    try {
      const response = await fetch("/check-replies");
      const data = await response.json();
      this.displayReplies(data.trackedMessages);
      document.getElementById("trackedMessages").textContent =
        data.totalTracked;
    } catch (error) {
      this.showAlert(`Failed to check replies: ${error.message}`, "danger");
    }
  }

  displayReplies(messages) {
    const repliedMessages = messages.filter((msg) => msg.replied);
    if (repliedMessages.length === 0) {
      this.showAlert("No replies found for tracked messages", "info");
      return;
    }

    let replyText = `Found ${repliedMessages.length} replies:\n\n`;
    repliedMessages.forEach((msg) => {
      replyText += `Original: "${msg.originalMessage}"\nReply: "${msg.replyText}"\n\n`;
    });

    alert(replyText);
  }

  addToHistory(message) {
    this.messageHistory.unshift(message);
    if (this.messageHistory.length > 10) {
      this.messageHistory = this.messageHistory.slice(0, 10);
    }
    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    const historyElement = document.getElementById("messageHistory");
    if (this.messageHistory.length === 0) {
      historyElement.innerHTML =
        '<p class="text-muted">No messages sent yet.</p>';
      return;
    }

    historyElement.innerHTML = this.messageHistory
      .map(
        (msg) => `
            <div class="message-preview">
                <div class="d-flex justify-content-between">
                    <strong>${msg.to}</strong>
                    <small class="text-muted">${msg.timestamp.toLocaleTimeString()}</small>
                </div>
                <div class="text-truncate">${msg.content}</div>
                <small class="text-muted">Type: ${msg.type} | ID: ${
          msg.id
        }</small>
            </div>
        `
      )
      .join("");
  }

  updateStatistics() {
    document.getElementById("messagesSent").textContent =
      this.messageHistory.length;
  }

  clearForm() {
    document.getElementById("phoneNumber").value = "";
    document.getElementById("messageText").value = "";
    document.getElementById("mediaFile").value = "";
    document.getElementById("mediaCaption").value = "";
    document.getElementById("messageType").value = "text";
    this.toggleMessageType("text");
  }

  showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector(".alert");
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create new alert
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    // Insert at top of dashboard
    const dashboard = document.querySelector(".dashboard-container");
    dashboard.insertBefore(alert, dashboard.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }

  startPeriodicUpdates() {
    // Update status every 30 seconds
    setInterval(() => {
      this.loadStatus();
      this.loadAutoReplyStatus();
    }, 30000);
  }
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", () => {
  new WhatsAppDashboard();
});

// Function to insert placeholders into auto-reply message
function insertPlaceholder(placeholder) {
  const textarea = document.getElementById("autoReplyMessage");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  // Insert the placeholder at cursor position
  textarea.value = text.substring(0, start) + placeholder + text.substring(end);

  // Move cursor after the inserted placeholder
  textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
  textarea.focus();
}
