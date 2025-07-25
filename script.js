/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");

/* Track selected products by their id */
let selectedProducts = [];

// Load selected products from localStorage if available
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch {
      selectedProducts = [];
    }
  }
}

// Save selected products to localStorage
function saveSelectedProductsToStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Track the conversation history for the chatbox */
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a helpful skincare and beauty routine assistant. Use real-time web search to provide current information about L'Oréal products and routines. Include links or citations for any facts, news, or recommendations you provide. Only answer questions about skincare, haircare, makeup, fragrance, or the routine you generated. Do not answer unrelated questions.",
  },
];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Helper: Show product modal */
function showProductModal(product) {
  // Create modal HTML
  const modal = document.createElement("div");
  modal.className = "product-modal";
  modal.innerHTML = `
    <div class="product-modal-content" role="dialog" aria-modal="true" aria-label="${
      product.name
    }">
      <button class="product-modal-close" aria-label="Close">&times;</button>
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.brand}</p>
      <div class="modal-desc">${product.description}</div>
      <button class="modal-select-btn">
        ${
          selectedProducts.some((p) => p.id === product.id)
            ? "Unselect"
            : "Select"
        } Product
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  // Focus for accessibility
  modal.querySelector(".product-modal-content").focus();

  // Close modal on click of close button or outside modal
  modal.querySelector(".product-modal-close").onclick = () => {
    modal.remove();
  };
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  // Select/Unselect product from modal
  modal.querySelector(".modal-select-btn").onclick = () => {
    const alreadySelected = selectedProducts.some((p) => p.id === product.id);
    if (alreadySelected) {
      selectedProducts = selectedProducts.filter((p) => p.id !== product.id);
    } else {
      selectedProducts.push(product);
    }
    saveSelectedProductsToStorage();
    updateSelectedProductsList();
    // Update button text
    modal.querySelector(".modal-select-btn").textContent = alreadySelected
      ? "Select Product"
      : "Unselect Product";
    // Also update product grid visuals
    loadProducts().then((products) => {
      displayProducts(
        products.filter((p) => p.category === categoryFilter.value)
      );
    });
  };
}

// Store all loaded products for filtering
let allProducts = [];

// How many products to show initially
const INITIAL_PRODUCT_COUNT = 6;
let productsToShow = INITIAL_PRODUCT_COUNT;

// Helper: Filter products by search and category
function getFilteredProducts() {
  const searchValue = document
    .getElementById("productSearch")
    .value.trim()
    .toLowerCase();
  const selectedCategory = categoryFilter.value;
  return allProducts.filter((product) => {
    // Match search by name or description (keyword)
    const matchesSearch =
      product.name.toLowerCase().includes(searchValue) ||
      product.description.toLowerCase().includes(searchValue);
    // Match category if selected
    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });
}

// Update product grid based on current filters and show/hide logic
function updateProductGrid() {
  const filtered = getFilteredProducts();
  displayProducts(filtered.slice(0, productsToShow));
  // Show or hide the "Show More" button
  const showMoreBtn = document.getElementById("showMoreBtn");
  if (showMoreBtn) {
    if (filtered.length > productsToShow) {
      showMoreBtn.style.display = "inline-block";
    } else {
      showMoreBtn.style.display = "none";
    }
  }
}

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  updateProductGrid();
  return allProducts;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card${
      selectedProducts.some((p) => p.id === product.id) ? " selected" : ""
    }" 
         data-id="${product.id}" tabindex="0" aria-label="Show details for ${
        product.name
      }">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to product cards for modal
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", async function () {
      const productId = Number(card.getAttribute("data-id"));
      const products = await loadProducts();
      const product = products.find((p) => p.id === productId);
      showProductModal(product);
    });
    // Also allow keyboard "Enter" to open modal for accessibility
    card.addEventListener("keydown", async function (e) {
      if (e.key === "Enter" || e.key === " ") {
        const productId = Number(card.getAttribute("data-id"));
        const products = await loadProducts();
        const product = products.find((p) => p.id === productId);
        showProductModal(product);
      }
    });
  });
}

/* Show selected products above the button */
function updateSelectedProductsList() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML =
      "<span style='color:#666;'>No products selected.</span>";
    // Show clear button only if there are products
    if (document.getElementById("clearSelectedBtn")) {
      document.getElementById("clearSelectedBtn").remove();
    }
    return;
  }
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-item" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <span>${product.name}</span>
        <button class="remove-btn" title="Remove" aria-label="Remove ${product.name}">&times;</button>
      </div>
    `
    )
    .join("");

  // Add "Clear All" button if not present
  if (!document.getElementById("clearSelectedBtn")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.className = "generate-btn";
    clearBtn.style.background = "#d00";
    clearBtn.style.marginTop = "10px";
    clearBtn.style.fontSize = "16px";
    clearBtn.style.fontWeight = "400";
    clearBtn.style.color = "#fff";
    clearBtn.onclick = function () {
      selectedProducts = [];
      saveSelectedProductsToStorage();
      updateSelectedProductsList();
      loadProducts().then((products) => {
        displayProducts(
          products.filter((p) => p.category === categoryFilter.value)
        );
      });
    };
    selectedProductsList.parentElement.appendChild(clearBtn);
  }

  // Add remove button listeners
  selectedProductsList.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const parent = btn.closest(".selected-product-item");
      const productId = Number(parent.getAttribute("data-id"));
      selectedProducts = selectedProducts.filter((p) => p.id !== productId);
      saveSelectedProductsToStorage();
      // Refresh visuals and selected list
      loadProducts().then((products) => {
        displayProducts(
          products.filter((p) => p.category === categoryFilter.value)
        );
        updateSelectedProductsList();
      });
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

const productSearch = document.getElementById("productSearch");
productSearch.addEventListener("input", updateProductGrid);

// Get reference to the "Generate Routine" button
const generateRoutineBtn = document.getElementById("generateRoutine");

// Helper function: Convert markdown links to HTML anchor tags
function convertMarkdownLinks(text) {
  // Replace [text](url) with <a href="url" target="_blank" rel="noopener">text</a>
  return text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
}

// Helper function: Format routine text into bullet points and dashed lines
function formatRoutineText(text) {
  // Convert markdown links to HTML
  text = convertMarkdownLinks(text);

  // Split text into lines
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // If the AI already uses bullet points, keep them
  if (lines.some((line) => line.startsWith("-") || line.startsWith("•"))) {
    return `<div style="border-top:1px dashed #bbb; margin:12px 0 8px;"></div>
      <ul style="padding-left:20px;">
        ${lines
          .map((line) => {
            if (line.startsWith("-") || line.startsWith("•")) {
              return `<li>${line.replace(/^[-•]\s*/, "")}</li>`;
            }
            return `<li>${line}</li>`;
          })
          .join("")}
      </ul>
      <div style="border-bottom:1px dashed #bbb; margin:8px 0 12px;"></div>`;
  }

  // Otherwise, try to split steps by numbers or periods
  const stepLines = lines.filter(
    (line) => /^\d+[\).]/.test(line) || /^Step\s*\d+/.test(line)
  );
  if (stepLines.length > 0) {
    return `<div style="border-top:1px dashed #bbb; margin:12px 0 8px;"></div>
      <ul style="padding-left:20px;">
        ${stepLines.map((line) => `<li>${line}</li>`).join("")}
      </ul>
      <div style="border-bottom:1px dashed #bbb; margin:8px 0 12px;"></div>`;
  }

  // Fallback: just wrap each line in a list item
  return `<div style="border-top:1px dashed #bbb; margin:12px 0 8px;"></div>
    <ul style="padding-left:20px;">
      ${lines.map((line) => `<li>${line}</li>`).join("")}
    </ul>
    <div style="border-bottom:1px dashed #bbb; margin:8px 0 12px;"></div>`;
}

// Replace this with your actual Cloudflare Worker endpoint URL
const WORKER_URL = "https://loreal-routine.sybilraphael4.workers.dev/";

// When the user clicks "Generate Routine", send selected products to OpenAI and show the routine
generateRoutineBtn.addEventListener("click", async function () {
  // If no products are selected, show a message and stop
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML =
      "<div style='color:#d00;'>Please select products before generating a routine.</div>";
    return;
  }

  // Prepare the data to send to OpenAI (only name, brand, category, description)
  const productData = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  // Show loading message
  chatWindow.innerHTML =
    "<div style='color:#666;'>Generating your personalized routine...</div>";

  // Build the messages array for OpenAI (web search enabled prompt)
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful skincare and beauty routine assistant. Use real-time web search to provide current information about L'Oréal products and routines. Include links or citations for any facts, news, or recommendations you provide. Only answer questions about skincare, haircare, makeup, fragrance, or the routine you generated. Do not answer unrelated questions.",
    },
    {
      role: "user",
      content: `Here are my selected products:\n${JSON.stringify(
        productData,
        null,
        2
      )}\nPlease generate a personalized routine for me.`,
    },
  ];

  // Add the user's request to the conversation history
  conversationHistory.push({
    role: "user",
    content: `Here are my selected products:\n${JSON.stringify(
      productData,
      null,
      2
    )}\nPlease generate a personalized routine for me.`,
  });

  try {
    // Send the full conversation history to your Cloudflare Worker using the web-search model
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-search-preview", // web search enabled
        messages: conversationHistory,
        max_tokens: 2000, // increased from 650 to 2000 for longer responses
        temperature: 0.5,
        frequency_penalty: 0.8,
        tools: [{ type: "web_search" }],
        tool_choice: "auto",
      }),
    });

    // Parse the response as JSON
    const data = await response.json();

    // Check if we got a valid response and display it
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Format the routine for organized display
      const formattedRoutine = formatRoutineText(
        data.choices[0].message.content
      );
      // Add the AI's routine to the conversation history
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      renderChatHistory();
    } else {
      chatWindow.innerHTML =
        "<div style='color:#d00;'>Sorry, something went wrong. Please try again.</div>";
    }
  } catch (error) {
    chatWindow.innerHTML = `<div style='color:#d00;'>Error: ${error.message}</div>`;
  }
});

function formatAssistantResponse(text) {
  // Convert markdown links to HTML
  text = convertMarkdownLinks(text);

  // Inline markdown formatting (headings, bold, italic, line breaks)
  text = text
    .replace(/^###\s*(.+)$/gm, "<h3 style='margin:10px 0 5px;'>$1</h3>") // ### Heading
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") // Bold
    .replace(/_(.+?)_/g, "<em>$1</em>") // Italic
    .replace(/\n/g, "<br>"); // Line breaks

  // Split into paragraphs by double newlines
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((paragraph) => {
      // Skip list formatting if it's a heading or already wrapped
      if (paragraph.startsWith("<h3")) {
        return paragraph;
      }

      // Check for list-like patterns
      if (/^([-•]|\d+[\).]|Step\s*\d+)/m.test(paragraph)) {
        const lines = paragraph
          .split("<br>")
          .map((l) => l.trim())
          .filter(Boolean);

        return `<ul style="padding-left:20px; margin:8px 0;">
          ${lines
            .filter((line) => /^([-•]|\d+[\).]|Step\s*\d+)/.test(line))
            .map(
              (line) =>
                `<li>${line.replace(/^([-•]|\d+[\).]|Step\s*\d+)\s*/, "")}</li>`
            )
            .join("")}
        </ul>`;
      } else {
        return `<div style="margin:8px 0;">${paragraph}</div>`;
      }
    })
    .join("");
}

// Helper: Render chat history as bubbles
function renderChatHistory() {
  chatWindow.innerHTML = conversationHistory
    .filter((msg, idx, arr) => {
      // Only show user messages if they are follow-up questions (not the initial routine generation)
      if (msg.role !== "user") return true;
      // The first user message after page load is for generating the routine, so skip it
      // Show user messages only if they are not immediately before an assistant message containing "personalized routine"
      // We'll show user messages only after the first assistant response
      // Find the index of the first assistant message
      const firstAssistantIdx = arr.findIndex((m) => m.role === "assistant");
      return idx >= firstAssistantIdx;
    })
    .map((msg) => {
      if (msg.role === "user") {
        return `<div class="chat-bubble user"><strong>You:</strong> ${msg.content}</div>`;
      } else {
        // Use AI-like formatting for assistant
        return `<div class="chat-bubble assistant"><strong>Routine Assistant:</strong> ${formatAssistantResponse(
          msg.content
        )}</div>`;
      }
    })
    .join("");
}

// Chat form submission handler - sends follow-up questions to OpenAI
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's question from the input box
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  // Add the user's question to the conversation history
  conversationHistory.push({
    role: "user",
    content: userInput,
  });

  // Show loading message
  chatWindow.innerHTML += `<div style='color:#666; margin-top:10px;'>Thinking...</div>`;

  try {
    // Send the full conversation history to your Cloudflare Worker using the web-search model
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-search-preview", // web search enabled
        messages: conversationHistory,
        max_tokens: 2000, // increased for longer follow-up responses
        temperature: 0.5,
        frequency_penalty: 0.8,
      }),
    });

    const data = await response.json();

    // Check if we got a valid response and display it
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Add the AI's response to the conversation history
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
      renderChatHistory();
    } else {
      chatWindow.innerHTML +=
        "<div style='color:#d00;'>Sorry, something went wrong. Please try again.</div>";
    }
  } catch (error) {
    chatWindow.innerHTML += `<div style='color:#d00;'>Error: ${error.message}</div>`;
  }

  // Clear the input box
  document.getElementById("userInput").value = "";
});

// Show More Products button logic
const showMoreBtn = document.getElementById("showMoreBtn");
if (showMoreBtn) {
  showMoreBtn.addEventListener("click", function () {
    productsToShow += INITIAL_PRODUCT_COUNT;
    updateProductGrid();
  });
}

// On page load, restore selected products and load all products
loadSelectedProductsFromStorage();
loadProducts();
updateSelectedProductsList();
updateSelectedProductsList();
