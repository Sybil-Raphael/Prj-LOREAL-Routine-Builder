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

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
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
        max_tokens: 500,
        temperature: 0.5,
        frequency_penalty: 0.8,
        tools: [{ type: "web_search" }],
        tool_choice: "auto", // this lets OpenAI decide when to use web search
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
      chatWindow.innerHTML = formattedRoutine;

      // Add the AI's routine to the conversation history
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });
    } else {
      chatWindow.innerHTML =
        "<div style='color:#d00;'>Sorry, something went wrong. Please try again.</div>";
    }
  } catch (error) {
    // Show error message if the request fails
    chatWindow.innerHTML = `<div style='color:#d00;'>Error: ${error.message}</div>`;
  }
});

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
        max_tokens: 500,
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

      // Display the full conversation in the chat window
      chatWindow.innerHTML = conversationHistory
        .filter((msg) => msg.role !== "system")
        .map((msg) => {
          if (msg.role === "user") {
            return `<div style="margin:10px 0; color:#222;"><strong>You:</strong> ${msg.content}</div>`;
          } else {
            // Format assistant's response for clarity
            return `<div style="margin:10px 0; color:#222;"><strong>Routine Assistant:</strong> ${formatRoutineText(
              msg.content
            )}</div>`;
          }
        })
        .join("");
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

// On page load, restore selected products from localStorage
loadSelectedProductsFromStorage();
updateSelectedProductsList();

// Show selected products on page load
updateSelectedProductsList();
