const state = {
  data: null,
  platform: "facebook",
  aiEnabled: false,
  tagEditMode: false,
  noteEditMode: false
};

const elements = {
  chatPanel: document.querySelector(".chat-panel"),
  memberTags: document.getElementById("memberTags"),
  interactionTags: document.getElementById("interactionTags"),
  chatWindow: document.getElementById("chatWindow"),
  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),
  aiToggle: document.getElementById("aiToggle"),
  platformButton: document.getElementById("platformButton"),
  platformDropdown: document.getElementById("platformDropdown"),
  platformLabel: document.getElementById("platformLabel"),
  platformIcon: document.getElementById("platformIcon"),
  editTags: document.getElementById("editTags"),
  editNote: document.getElementById("editNote"),
  memberNote: document.getElementById("memberNote"),
  tooltip: document.getElementById("audioTooltip")
};

const platformMap = {
  line: {
    label: "LINE",
    icon: "assets/figma/Icon-line-32.svg"
  },
  facebook: {
    label: "Facebook",
    icon: "https://www.figma.com/api/mcp/asset/746db23b-752c-48ea-a36b-97af6a994aa2"
  },
  webchat: {
    label: "Web Chat",
    icon: "https://www.figma.com/api/mcp/asset/0428bf38-35d6-4fea-a798-8408f98be85a"
  }
};

function formatTime(date = new Date()) {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const isAfternoon = hours >= 12;
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${isAfternoon ? "下午" : "上午"} ${displayHour}:${minutes}`;
}

async function loadData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Failed to load data");
    state.data = await response.json();
  } catch (error) {
    state.data = {
      memberTags: ["聖誕促銷", "巧克力禮盒", "Foodie"],
      interactionTags: ["優惠活動", "限時折扣", "滿額贈品", "會員專屬優惠", "手工芝", "BeautyBlogger"],
      messages: [
        { id: 1, from: "oa", text: "文字訊息訊息", time: "下午 03:30", platform: "facebook" },
        { id: 2, from: "agent", text: "官方文字訊息", time: "下午 03:40 已讀", platform: "facebook" }
      ],
      audioFile: "004abcdefghijklmnopqrstuvwxy.wav",
      autoReply: "已收到您的訊息，我們會盡快回覆。"
    };
  }
}

function createTag(label) {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = label;
  return span;
}

function renderTags() {
  elements.memberTags.innerHTML = "";
  elements.interactionTags.innerHTML = "";

  state.data.memberTags.forEach(tag => elements.memberTags.appendChild(createTag(tag)));
  state.data.interactionTags.forEach(tag => elements.interactionTags.appendChild(createTag(tag)));

  if (state.tagEditMode) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "新增標籤";
    input.className = "tag-input";
    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && input.value.trim()) {
        state.data.interactionTags.push(input.value.trim());
        renderTags();
      }
    });
    elements.interactionTags.appendChild(input);
  }
}

function createMessage(message) {
  const wrapper = document.createElement("div");
  const isRight = message.from === "agent";
  wrapper.className = `message ${isRight ? "message--right" : ""}`;

  const avatar = document.createElement("div");
  avatar.className = "message__avatar";
  if (isRight) {
    const img = document.createElement("img");
    img.src = "https://www.figma.com/api/mcp/asset/bc311d2a-9704-45cd-835e-d01877ed5cbc";
    img.alt = "";
    avatar.appendChild(img);
  } else {
    avatar.textContent = "OA";
  }

  const stack = document.createElement("div");
  stack.className = "message__stack";

  const bubble = document.createElement("div");
  bubble.className = "message__bubble";
  bubble.textContent = message.text;

  if (message.audio) {
    bubble.dataset.audio = "true";
    bubble.addEventListener("mouseenter", () => {
      elements.tooltip.classList.add("is-visible");
    });
    bubble.addEventListener("mouseleave", () => {
      elements.tooltip.classList.remove("is-visible");
    });
  }

  const meta = document.createElement("div");
  meta.className = "message__meta";
  meta.textContent = message.time;

  stack.appendChild(bubble);
  stack.appendChild(meta);

  if (isRight) {
    wrapper.appendChild(stack);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(stack);
  }

  return wrapper;
}

function renderMessages() {
  elements.chatWindow.innerHTML = "";
  state.data.messages.forEach(message => {
    elements.chatWindow.appendChild(createMessage(message));
  });
  elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
}

function applyPlatformState() {
  const platform = platformMap[state.platform] || platformMap.line;
  elements.platformLabel.textContent = platform.label;
  elements.platformIcon.src = platform.icon;
  document.querySelectorAll(".platform-item").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.platform === state.platform);
  });
}

function positionPlatformDropdown() {
  const parent = elements.chatPanel || elements.platformDropdown.offsetParent;
  if (!parent) return;
  const panelRect = parent.getBoundingClientRect();
  const btnRect = elements.platformButton.getBoundingClientRect();
  elements.platformDropdown.style.left = `${Math.round(btnRect.left - panelRect.left)}px`;
  elements.platformDropdown.style.top = `${Math.round(btnRect.bottom - panelRect.top + 4)}px`;
}

function updateSendButton() {
  const hasText = elements.messageInput.value.trim().length > 0;
  elements.sendButton.disabled = !hasText;
  elements.sendButton.classList.toggle("is-enabled", hasText);
}

function sendMessage() {
  const text = elements.messageInput.value.trim();
  if (!text) return;

  const message = {
    id: state.data.messages.length + 1,
    from: "agent",
    text,
    time: `${formatTime()} 已讀`,
    platform: state.platform
  };
  state.data.messages.push(message);
  elements.chatWindow.appendChild(createMessage(message));
  elements.messageInput.value = "";
  updateSendButton();
  elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;

  if (state.aiEnabled) {
    setTimeout(() => {
      const autoMessage = {
        id: state.data.messages.length + 1,
        from: "oa",
        text: state.data.autoReply,
        time: formatTime(),
        platform: state.platform,
        auto: true
      };
      state.data.messages.push(autoMessage);
      elements.chatWindow.appendChild(createMessage(autoMessage));
      elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
    }, 800);
  }
}

function togglePlatformDropdown(forceClose = false) {
  const isOpen = elements.platformDropdown.classList.contains("is-open");
  const shouldOpen = forceClose ? false : !isOpen;
  elements.platformDropdown.classList.toggle("is-open", shouldOpen);
  elements.platformButton.setAttribute("aria-expanded", String(shouldOpen));
  elements.platformButton.classList.toggle("is-open", shouldOpen);
  elements.platformDropdown.setAttribute("aria-hidden", String(!shouldOpen));
  if (shouldOpen) {
    positionPlatformDropdown();
  }
}

function handlePlatformSelect(event) {
  const item = event.target.closest(".platform-item");
  if (!item) return;
  const platform = item.dataset.platform;
  state.platform = platform;
  applyPlatformState();
  togglePlatformDropdown(true);
}

function bindEvents() {
  elements.messageInput.addEventListener("input", updateSendButton);
  elements.sendButton.addEventListener("click", sendMessage);

  elements.aiToggle.addEventListener("click", () => {
    state.aiEnabled = !state.aiEnabled;
    elements.aiToggle.classList.toggle("is-active", state.aiEnabled);
  });

  elements.platformButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    togglePlatformDropdown();
  });

  elements.platformButton.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePlatformDropdown();
    }
    if (event.key === "Escape") {
      togglePlatformDropdown(true);
    }
  });

  elements.platformDropdown.addEventListener("click", event => {
    event.stopPropagation();
    handlePlatformSelect(event);
  });

  document.addEventListener("click", () => {
    togglePlatformDropdown(true);
  });

  window.addEventListener("resize", () => {
    if (elements.platformDropdown.classList.contains("is-open")) {
      positionPlatformDropdown();
    }
  });

  elements.editTags.addEventListener("click", () => {
    state.tagEditMode = !state.tagEditMode;
    renderTags();
  });

  elements.editNote.addEventListener("click", () => {
    state.noteEditMode = !state.noteEditMode;
    elements.memberNote.disabled = !state.noteEditMode;
    if (state.noteEditMode) {
      elements.memberNote.focus();
    }
  });
}

(async function init() {
  await loadData();
  elements.tooltip.textContent = state.data.audioFile || elements.tooltip.textContent;
  const lastReply = [...state.data.messages]
    .reverse()
    .find(message => message.from === "agent" || message.auto);
  state.platform = lastReply?.platform || "line";
  applyPlatformState();
  renderTags();
  renderMessages();
  updateSendButton();
  bindEvents();
  positionPlatformDropdown();
})();
