// ========================================
// VARIÁVEIS GLOBAIS
// ========================================

let cart = [];
let products = [
  {
    id: "produto-1",
    nome: "Colar Elegance",
    descricao: "Colar delicado em banho de ouro com pingente de coração",
    preco: 89.9,
    imagem:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80",
    status: "disponivel",
  },
  {
    id: "produto-2",
    nome: "Brinco Luxo",
    descricao: "Par de brincos em argola com detalhes em cristal",
    preco: 69.9,
    imagem:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80",
    status: "disponivel",
  },
  {
    id: "produto-3",
    nome: "Pulseira Sofisticada",
    descricao: "Pulseira elo português folheada a ouro 18k",
    preco: 129.9,
    imagem:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&q=80",
    status: "disponivel",
  },
  {
    id: "produto-4",
    nome: "Anel Clássico",
    descricao: "Anel solitário com zircônia cravejada",
    preco: 79.9,
    imagem:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&q=80",
    status: "esgotado",
  },
  {
    id: "produto-5",
    nome: "Conjunto Premium",
    descricao: "Conjunto colar e brinco com pedras naturais",
    preco: 159.9,
    imagem:
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500&q=80",
    status: "disponivel",
  },
  {
    id: "produto-6",
    nome: "Tornozeleira Delicada",
    descricao: "Tornozeleira fina com pingentes em formato de estrela",
    preco: 49.9,
    imagem:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80",
    status: "disponivel",
  },
];

// ========================================
// CARRINHO - FUNÇÕES GLOBAIS
// ========================================

/**
 * Adiciona produto ao carrinho
 */
function addToCart(productId) {
  console.log("Adicionando produto:", productId);
  const product = products.find((p) => p.id === productId);

  if (!product) {
    console.error("Produto não encontrado:", productId);
    return;
  }

  if (product.status === "esgotado") {
    alert("Este produto está esgotado.");
    return;
  }

  // Verifica se o produto já está no carrinho
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity++;
    console.log(
      "Produto já existe no carrinho, aumentando quantidade para:",
      existingItem.quantity,
    );
  } else {
    cart.push({
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      imagem: product.imagem,
      quantity: 1,
    });
    console.log("Novo produto adicionado ao carrinho");
  }

  console.log("Carrinho atual:", cart);
  saveCartToStorage();
  updateCartUI();
  showCartNotification();
}

/**
 * Remove produto do carrinho
 */
function removeFromCart(productId) {
  console.log("Removendo produto:", productId);
  cart = cart.filter((item) => item.id !== productId);
  console.log("Carrinho após remoção:", cart);
  saveCartToStorage();
  updateCartUI();
}

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  setupScrollAnimations();

  // Teste de conexão Firebase (apenas para debug)
  testFirebaseConnection();
});

/**
 * Testa a conexão com o Firebase Realtime Database
 */
async function testFirebaseConnection() {
  try {
    console.log("🧪 Testando conexão com Firebase Realtime Database...");

    // Testa se o Firebase está inicializado
    if (typeof firebase !== "undefined" && firebase.database) {
      console.log("✅ Firebase SDK carregado com sucesso");

      // Testa conexão com o database
      const testRef = database.ref(".info/connected");
      testRef.on("value", function (snapshot) {
        if (snapshot.val() === true) {
          console.log("✅ Conectado ao Firebase Realtime Database");
        } else {
          console.log("❌ Desconectado do Firebase Realtime Database");
        }
      });
    } else {
      console.warn("⚠️ Firebase SDK não encontrado - verifique as importações");
    }
  } catch (error) {
    console.error("❌ Erro no teste de conexão Firebase:", error);
  }
}

/**
 * Inicializa a aplicação
 */
async function initializeApp() {
  try {
    console.log("🚀 Inicializando aplicação...");

    // Tenta carregar produtos do Firebase
    try {
      showLoading(true);
      await loadProductsFromFirebase();
      console.log("✅ Produtos carregados do Firebase");
    } catch (firebaseError) {
      console.warn(
        "⚠️ Erro ao carregar do Firebase, usando produtos locais:",
        firebaseError,
      );
      // Fallback: usa produtos locais se Firebase falhar
      renderProducts(products);
      showLoading(false);
    }

    loadCartFromStorage();
    updateCartUI();
    setupScrollAnimations();

    console.log("✅ Aplicação inicializada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar app:", error);
    showError("Erro ao carregar produtos. Por favor, recarregue a página.");
    // Fallback final: mostra produtos locais
    renderProducts(products);
    showLoading(false);
  }
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
  // Carrinho
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);
  document
    .getElementById("btnWhatsapp")
    .addEventListener("click", sendToWhatsApp);

  // Melhorias para dispositivos móveis
  setupMobileEnhancements();

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/**
 * Configurações específicas para dispositivos móveis
 */
function setupMobileEnhancements() {
  // Detecta se é dispositivo móvel
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth <= 768;

  if (isMobile) {
    // Adiciona suporte a swipe para fechar o carrinho
    let touchStartX = 0;
    let touchStartY = 0;

    const cartSidebar = document.getElementById("cartSidebar");

    cartSidebar.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true },
    );

    cartSidebar.addEventListener(
      "touchmove",
      (e) => {
        if (!touchStartX || !touchStartY) return;

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;

        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Se o movimento horizontal for maior que o vertical e for para a direita
        if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
          closeCart();
          touchStartX = 0;
          touchStartY = 0;
        }
      },
      { passive: true },
    );

    // Previne scroll do body quando o carrinho está aberto
    cartSidebar.addEventListener("touchmove", (e) => {
      if (cartSidebar.classList.contains("active")) {
        e.stopPropagation();
      }
    });

    // Melhora a responsividade dos botões em dispositivos touch
    document
      .querySelectorAll(
        ".btn-add-cart, .cart-btn, .cart-close, .cart-item-remove",
      )
      .forEach((button) => {
        button.addEventListener(
          "touchstart",
          function () {
            this.style.transform = "scale(0.95)";
          },
          { passive: true },
        );

        button.addEventListener(
          "touchend",
          function () {
            setTimeout(() => {
              this.style.transform = "";
            }, 100);
          },
          { passive: true },
        );
      });
  }
}

// ========================================
// PRODUTOS
// ========================================

/**
 * Carrega produtos do Firebase Realtime Database
 */
async function loadProductsFromFirebase() {
  try {
    console.log("📱 Carregando produtos do Firebase Realtime Database...");

    // Inicializa produtos de exemplo se necessário
    await initializeExampleProducts();

    // Carrega produtos
    const firebaseProducts = await loadProducts();

    if (firebaseProducts && firebaseProducts.length > 0) {
      products = firebaseProducts;
      renderProducts(products);
      console.log("✅ Produtos carregados:", products.length);
    } else {
      console.log("📝 Usando produtos locais como fallback");
      renderProducts(products);
    }

    // Escuta mudanças em tempo real
    const unsubscribe = listenToProducts((updatedProducts) => {
      if (updatedProducts && updatedProducts.length > 0) {
        products = updatedProducts;
        renderProducts(products);
        console.log("🔄 Produtos atualizados em tempo real:", products.length);
      }
    });

    // Salva a função para cancelar escuta se necessário
    window.unsubscribeProducts = unsubscribe;

    showLoading(false);
  } catch (error) {
    console.error("❌ Erro ao carregar produtos do Firebase:", error);
    showLoading(false);
    throw error;
  }
}

/**
 * Renderiza os produtos na página
 */
function renderProducts(productsArray) {
  const productsGrid = document.getElementById("productsGrid");

  if (!productsArray || productsArray.length === 0) {
    productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>Nenhum produto disponível no momento.</p>
            </div>
        `;
    return;
  }

  productsGrid.innerHTML = productsArray
    .map(
      (product) => `
        <div class="product-card fade-in-scroll">
            <div class="product-image-container">
                <img src="${product.imagem}" alt="${product.nome}" class="product-image">
                ${product.status === "esgotado" ? '<span class="product-badge">Esgotado</span>' : ""}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.nome}</h3>
                <p class="product-description">${product.descricao}</p>
                <p class="product-price">R$ ${formatPrice(product.preco)}</p>
                <button 
                    class="btn-add-cart" 
                    onclick="addToCart('${product.id}')"
                    ${product.status === "esgotado" ? "disabled" : ""}
                >
                    <i class="fas fa-shopping-cart"></i>
                    ${product.status === "esgotado" ? "Esgotado" : "Adicionar ao Carrinho"}
                </button>
            </div>
        </div>
    `,
    )
    .join("");

  // Reaplica animações de scroll
  setupScrollAnimations();
}

// ========================================
// ATUALIZAÇÃO DA UI DO CARRINHO
// ========================================

/**
 * Atualiza a UI do carrinho
 */
function updateCartUI() {
  console.log("Atualizando UI do carrinho. Total de itens:", cart.length);

  const cartBody = document.getElementById("cartBody");
  const cartCount = document.getElementById("cartCount");
  const cartEmpty = document.getElementById("cartEmpty");
  const cartFooter = document.getElementById("cartFooter");
  const totalPrice = document.getElementById("totalPrice");

  // Atualiza contador
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) cartCount.textContent = totalItems;
  console.log("Total de produtos (com quantidades):", totalItems);

  // Se carrinho vazio
  if (cart.length === 0) {
    if (cartEmpty) cartEmpty.style.display = "block";
    if (cartFooter) cartFooter.style.display = "none";
    if (cartBody) cartBody.innerHTML = ""; // Limpa o conteúdo
    return;
  }

  // Esconde mensagem de carrinho vazio
  if (cartEmpty) cartEmpty.style.display = "none";
  if (cartFooter) {
    cartFooter.style.display = "block";
    // Garante que o footer seja visível forçando uma atualização do layout
    cartFooter.style.position = "relative";
    cartFooter.style.zIndex = "10";
  }

  // Renderiza itens do carrinho
  const cartItemsHTML = cart
    .map(
      (item) => `
        <div class="cart-item" data-item-id="${item.id}">
            <img src="${item.imagem}" alt="${item.nome}" class="cart-item-image">
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.nome}</h4>
                <p class="cart-item-price">R$ ${formatPrice(item.preco)}</p>
                ${item.quantity > 1 ? `<p class="cart-item-quantity">Quantidade: ${item.quantity}</p>` : ""}
            </div>
            <button class="cart-item-remove" data-product-id="${item.id}" title="Remover produto">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `,
    )
    .join("");

  if (cartBody) cartBody.innerHTML = cartItemsHTML;

  console.log("Itens renderizados no carrinho");

  // Adiciona event listeners aos botões de remover usando delegação de eventos
  if (cartBody) {
    cartBody.querySelectorAll(".cart-item-remove").forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const productId = this.getAttribute("data-product-id");
        console.log("Botão de remover clicado para produto:", productId);
        removeFromCart(productId);
      });
    });
  }

  // Calcula e exibe total
  const total = cart.reduce((sum, item) => sum + item.preco * item.quantity, 0);
  if (totalPrice) totalPrice.textContent = `R$ ${formatPrice(total)}`;
  console.log("Total do carrinho: R$", formatPrice(total));
}

/**
 * Abre o carrinho
 */
function openCart() {
  const cartSidebar = document.getElementById("cartSidebar");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartFooter = document.getElementById("cartFooter");

  cartSidebar.classList.add("active");
  cartOverlay.classList.add("active");
  document.body.style.overflow = "hidden";

  // Melhoria para dispositivos móveis - garante que o carrinho seja focado
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth <= 768;

  if (isMobile) {
    // Pequeno delay para garantir que a animação CSS termine
    setTimeout(() => {
      cartSidebar.scrollTop = 0; // Garante que o carrinho comece do topo
    }, 100);
  }

  // Força a atualização do layout para garantir que o footer seja visível
  setTimeout(() => {
    updateCartUI();
    // Scroll para o topo do body do carrinho para garantir que o footer seja acessível
    const cartBody = document.getElementById("cartBody");
    if (cartBody) cartBody.scrollTop = 0;
  }, 150);
}

/**
 * Fecha o carrinho
 */
function closeCart() {
  document.getElementById("cartSidebar").classList.remove("active");
  document.getElementById("cartOverlay").classList.remove("active");
  document.body.style.overflow = "auto";
}

/**
 * Mostra notificação de item adicionado
 */
function showCartNotification() {
  // Pequena animação no botão do carrinho
  const cartBtn = document.getElementById("cartBtn");
  cartBtn.style.transform = "scale(1.2)";
  setTimeout(() => {
    cartBtn.style.transform = "scale(1)";
  }, 300);
}

// ========================================
// WHATSAPP
// ========================================

/**
 * Envia pedido para WhatsApp
 */
function sendToWhatsApp() {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  // Número do WhatsApp configurado: (67) 99642-5943
  const phoneNumber = "5567996425943";

  // Monta a mensagem
  let message = "🛍️ *Novo Pedido - Taty Joias*\n\n";
  message += "📦 *Produtos:*\n";

  cart.forEach((item, index) => {
    message += `\n${index + 1}. ${item.nome}\n`;
    message += `   • Quantidade: ${item.quantity}\n`;
    message += `   • Preço unitário: R$ ${formatPrice(item.preco)}\n`;
    message += `   • Subtotal: R$ ${formatPrice(item.preco * item.quantity)}\n`;
  });

  const total = cart.reduce((sum, item) => sum + item.preco * item.quantity, 0);
  message += `\n💰 *Total: R$ ${formatPrice(total)}*\n\n`;
  message += "✨ Obrigada por escolher Taty Joias!";

  // Codifica a mensagem para URL
  const encodedMessage = encodeURIComponent(message);

  // Monta o link do WhatsApp
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  // Abre o WhatsApp
  window.open(whatsappUrl, "_blank");

  // Opcional: Limpar carrinho após enviar
  // cart = [];
  // saveCartToStorage();
  // updateCartUI();
  // closeCart();
}

// ========================================
// STORAGE
// ========================================

/**
 * Salva carrinho no localStorage
 */
function saveCartToStorage() {
  try {
    localStorage.setItem("tatyJoiasCart", JSON.stringify(cart));
  } catch (error) {
    console.error("Erro ao salvar carrinho:", error);
  }
}

/**
 * Carrega carrinho do localStorage
 */
function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem("tatyJoiasCart");
    if (savedCart) {
      cart = JSON.parse(savedCart);
    }
  } catch (error) {
    console.error("Erro ao carregar carrinho:", error);
    cart = [];
  }
}

// ========================================
// UTILITÁRIOS
// ========================================

/**
 * Formata preço para exibição
 */
function formatPrice(price) {
  return parseFloat(price).toFixed(2).replace(".", ",");
}

/**
 * Mostra/esconde loading
 */
function showLoading(show) {
  const loading = document.getElementById("loading");
  const productsGrid = document.getElementById("productsGrid");

  if (show) {
    loading.style.display = "block";
    productsGrid.style.display = "none";
  } else {
    loading.style.display = "none";
    productsGrid.style.display = "grid";
  }
}

/**
 * Mostra mensagem de erro
 */
function showError(message) {
  const productsGrid = document.getElementById("productsGrid");
  productsGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Configura animações de scroll
 */
function setupScrollAnimations() {
  const elements = document.querySelectorAll(".fade-in-scroll");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  elements.forEach((element) => observer.observe(element));
}

// ========================================
// CONSOLE LOG STYLIZADO
// ========================================

console.log(
  "%c✨ Taty Joias %c- Elegância em Cada Detalhe",
  "color: #D4AF37; font-size: 20px; font-weight: bold;",
  "color: #666; font-size: 14px;",
);
