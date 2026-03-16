// ========================================
// VARIÁVEIS GLOBAIS ADMIN
// ========================================

let currentEditingId = null;
let deleteProductId = null;
let currentUser = null;

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  setupAuthStateListener();
  setupLoginListener();
});

/**
 * Configura listener para mudanças no estado de autenticação
 */
function setupAuthStateListener() {
  onAuthStateChanged((user) => {
    currentUser = user;

    if (user) {
      // Usuário está logado
      console.log("✅ Usuário autenticado:", user.email);
      showAdminPanel();
      initializeAdmin();
      setupAdminEventListeners();
    } else {
      // Usuário não está logado
      console.log("⚠️ Usuário não autenticado");
      showLoginPanel();
    }
  });
}

/**
 * Configura listener para formulário de login
 */
function setupLoginListener() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Botão de logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

/**
 * Manipula o login do admin
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const errorMsg = document.getElementById("loginError");

  try {
    errorMsg.textContent = "";
    errorMsg.style.display = "none";

    // Mostrar loading no botão
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

    await loginAdmin(email, password);

    // O listener onAuthStateChanged irá mostrar o painel automaticamente
  } catch (error) {
    console.error("Erro no login:", error);

    let errorMessage = "Erro ao fazer login. Tente novamente.";

    if (error.code === "auth/user-not-found") {
      errorMessage = "Usuário não encontrado.";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Senha incorreta.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Email inválido.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
    }

    errorMsg.textContent = errorMessage;
    errorMsg.style.display = "block";

    // Restaurar botão
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
  }
}

/**
 * Manipula o logout do admin
 */
async function handleLogout() {
  try {
    await logoutAdmin();
    // O listener onAuthStateChanged irá mostrar o login automaticamente
  } catch (error) {
    console.error("Erro no logout:", error);
    showToast("Erro ao fazer logout", "error");
  }
}

/**
 * Mostra o painel de login
 */
function showLoginPanel() {
  const loginContainer = document.getElementById("loginContainer");
  const adminContent = document.getElementById("adminContent");

  if (loginContainer) {
    loginContainer.style.display = "flex";
    loginContainer.classList.remove("hidden");
  }
  if (adminContent) {
    adminContent.style.display = "none";
    adminContent.classList.add("hidden");
  }
}

/**
 * Mostra o painel administrativo
 */
function showAdminPanel() {
  const loginContainer = document.getElementById("loginContainer");
  const adminContent = document.getElementById("adminContent");

  if (loginContainer) {
    loginContainer.style.display = "none";
    loginContainer.classList.add("hidden");
  }
  if (adminContent) {
    adminContent.style.display = "block";
    adminContent.classList.remove("hidden");
  }

  // Atualizar email do usuário no header
  const userEmail = document.getElementById("userEmail");
  if (userEmail && currentUser) {
    userEmail.textContent = currentUser.email;
  }
}

/**
 * Inicializa o painel admin
 */
async function initializeAdmin() {
  try {
    console.log("🔧 Inicializando painel administrativo...");
    showAdminLoading(true);

    await loadAdminProducts();

    // Escuta mudanças em tempo real
    const unsubscribe = listenToProducts((products) => {
      console.log("🔄 Produtos atualizados no admin:", products.length);
      renderAdminProducts(products);
    });

    // Salva função para cancelar escuta
    window.unsubscribeAdminProducts = unsubscribe;

    console.log("✅ Painel admin inicializado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar admin:", error);
    showToast("Erro ao carregar produtos", "error");
  } finally {
    showAdminLoading(false);
  }
}

/**
 * Configura event listeners do admin
 */
function setupAdminEventListeners() {
  // Navegação entre seções
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      switchSection(section);
    });
  });

  // Botão de adicionar produto
  const addProductBtn = document.getElementById("addProductBtn");
  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      openProductModal();
    });
  }

  // Botão de fechar modal
  const closeModal = document.getElementById("closeModal");
  if (closeModal) {
    closeModal.addEventListener("click", closeProductModal);
  }

  // Botão cancelar
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeProductModal);
  }

  // Formulário
  const productForm = document.getElementById("productForm");
  if (productForm) {
    productForm.addEventListener("submit", handleFormSubmit);
  }

  // Tabs de imagem
  const uploadTab = document.getElementById("uploadTab");
  const urlTab = document.getElementById("urlTab");

  if (uploadTab) {
    uploadTab.addEventListener("click", () => switchImageTab("upload"));
  }

  if (urlTab) {
    urlTab.addEventListener("click", () => switchImageTab("url"));
  }

  // Upload de imagem
  const selectImageBtn = document.getElementById("selectImageBtn");
  const productImageFile = document.getElementById("productImageFile");

  if (selectImageBtn && productImageFile) {
    selectImageBtn.addEventListener("click", () => {
      productImageFile.click();
    });

    productImageFile.addEventListener("change", handleImageUpload);
  }

  // Preview de URL de imagem
  const productImage = document.getElementById("productImage");
  if (productImage) {
    productImage.addEventListener("input", handleImageUrlPreview);
  }
}

// ========================================
// NAVEGAÇÃO
// ========================================

/**
 * Troca entre seções do admin
 */
function switchSection(sectionName) {
  // Remove classe active de todos os nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Adiciona active ao item clicado
  document
    .querySelector(`[data-section="${sectionName}"]`)
    .classList.add("active");

  // Remove active de todas as seções
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Adiciona active à seção selecionada
  document.getElementById(`${sectionName}-section`).classList.add("active");
}

// ========================================
// PRODUTOS ADMIN
// ========================================

/**
 * Abre o modal de produto
 */
function openProductModal(productId = null) {
  const modal = document.getElementById("productModal");
  const modalTitle = document.getElementById("modalTitle");

  currentEditingId = productId;

  if (productId) {
    modalTitle.textContent = "Editar Produto";
    loadProductToForm(productId);
  } else {
    modalTitle.textContent = "Adicionar Produto";
    document.getElementById("productForm").reset();
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Fecha o modal de produto
 */
function closeProductModal() {
  const modal = document.getElementById("productModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
  currentEditingId = null;
  currentImageData = null; // Limpa a imagem atual
  document.getElementById("productForm").reset();
  document.getElementById("imagePreview").style.display = "none";
  document.getElementById("fileName").textContent =
    "Nenhum arquivo selecionado";
  document.getElementById("fileName").classList.remove("has-file");

  // Reseta para a tab de upload
  switchImageTab("upload");
}

/**
 * Carrega produto no formulário para edição
 */
async function loadProductToForm(productId) {
  try {
    const products = await loadProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      showToast("Produto não encontrado", "error");
      return;
    }

    document.getElementById("productName").value = product.nome;
    document.getElementById("productDescription").value = product.descricao;
    document.getElementById("productPrice").value = product.preco;
    document.getElementById("productStatus").value = product.status;

    // Carrega a imagem
    currentImageData = product.imagem;

    // Verifica se é base64 ou URL
    if (product.imagem.startsWith("data:image")) {
      // É uma imagem base64 (upload)
      switchImageTab("upload");
      document.getElementById("fileName").textContent =
        "Arquivo carregado anteriormente";
      document.getElementById("fileName").classList.add("has-file");
    } else {
      // É uma URL
      switchImageTab("url");
      document.getElementById("productImage").value = product.imagem;
    }

    // Mostra preview
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");
    previewImg.src = product.imagem;
    preview.style.display = "block";
  } catch (error) {
    console.error("Erro ao carregar produto:", error);
    showToast("Erro ao carregar produto", "error");
  }
}

/**
 * Carrega produtos no admin
 */
async function loadAdminProducts() {
  try {
    console.log("📱 Carregando produtos no painel admin...");

    // Inicializa produtos de exemplo se necessário
    await initializeExampleProducts();

    const products = await loadProducts();

    if (products && products.length > 0) {
      renderAdminProducts(products);
      console.log("✅ Produtos carregados no admin:", products.length);
    } else {
      console.log("📝 Nenhum produto encontrado");
      renderAdminProducts([]);
    }
  } catch (error) {
    console.error("❌ Erro ao carregar produtos no admin:", error);
    showToast("Erro ao carregar produtos", "error");
    throw error;
  }
}

/**
 * Renderiza produtos na tabela do admin
 */
function renderAdminProducts(products) {
  const tableBody = document.getElementById("productsTableBody");
  const tableContainer = document.getElementById("productsTableContainer");

  if (!products || products.length === 0) {
    tableContainer.innerHTML = `
      <div class="no-products">
        <i class="fas fa-box-open"></i>
        <p>Nenhum produto cadastrado.</p>
        <button class="btn-primary" onclick="openProductModal()">
          <i class="fas fa-plus"></i> Adicionar Primeiro Produto
        </button>
      </div>
    `;
    return;
  }

  tableBody.innerHTML = products
    .map(
      (product) => `
        <tr>
          <td>
            <img src="${product.imagem}" alt="${product.nome}" class="product-thumb">
          </td>
          <td><strong>${product.nome}</strong></td>
          <td>R$ ${formatPrice(product.preco)}</td>
          <td>
            <span class="status-badge ${product.status}">
              ${product.status === "disponivel" ? "✓ Disponível" : "✗ Esgotado"}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon btn-edit" onclick="openProductModal('${product.id}')" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon btn-delete" onclick="deleteProductConfirm('${product.id}')" title="Excluir">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");
}

// ========================================
// GERENCIAMENTO DE IMAGENS
// ========================================

let currentImageData = null; // Armazena a imagem atual (base64 ou URL)

/**
 * Alterna entre as tabs de upload e URL
 */
function switchImageTab(tabType) {
  const uploadTab = document.getElementById("uploadTab");
  const urlTab = document.getElementById("urlTab");
  const uploadContent = document.getElementById("uploadContent");
  const urlContent = document.getElementById("urlContent");

  if (tabType === "upload") {
    uploadTab.classList.add("active");
    urlTab.classList.remove("active");
    uploadContent.classList.add("active");
    urlContent.classList.remove("active");
  } else {
    urlTab.classList.add("active");
    uploadTab.classList.remove("active");
    urlContent.classList.add("active");
    uploadContent.classList.remove("active");
  }
}

/**
 * Manipula o upload de imagem do arquivo
 */
function handleImageUpload(e) {
  const file = e.target.files[0];

  if (!file) return;

  // Verifica se é uma imagem
  if (!file.type.startsWith("image/")) {
    showToast("❌ Por favor, selecione apenas imagens", "error");
    return;
  }

  // Verifica o tamanho (máx 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    showToast("❌ Imagem muito grande. Máximo: 2MB", "error");
    return;
  }

  // Atualiza o nome do arquivo
  const fileName = document.getElementById("fileName");
  fileName.textContent = file.name;
  fileName.classList.add("has-file");

  // Lê e converte a imagem para base64
  const reader = new FileReader();

  reader.onload = function (event) {
    const base64Image = event.target.result;
    currentImageData = base64Image;

    // Mostra preview
    const preview = document.getElementById("imagePreview");
    const previewImg = document.getElementById("previewImg");

    previewImg.src = base64Image;
    preview.style.display = "block";

    console.log("✅ Imagem carregada com sucesso!");
  };

  reader.onerror = function () {
    showToast("❌ Erro ao carregar imagem", "error");
  };

  reader.readAsDataURL(file);
}

/**
 * Manipula o preview da URL da imagem
 */
function handleImageUrlPreview(e) {
  const imageUrl = e.target.value.trim();

  if (!imageUrl) {
    document.getElementById("imagePreview").style.display = "none";
    currentImageData = null;
    return;
  }

  currentImageData = imageUrl;

  const preview = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");

  previewImg.src = imageUrl;
  preview.style.display = "block";

  // Verifica se a imagem carrega
  previewImg.onerror = () => {
    preview.style.display = "none";
    showToast("⚠️ Não foi possível carregar a imagem desta URL", "warning");
  };

  previewImg.onload = () => {
    console.log("✅ Preview da imagem carregado!");
  };
}

// ========================================
// FORMULÁRIO
// ========================================

/**
 * Manipula submit do formulário
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Valida se há uma imagem (seja upload ou URL)
  if (!currentImageData) {
    showToast("❌ Adicione uma imagem do produto", "error");
    return;
  }

  const productData = {
    nome: document.getElementById("productName").value.trim(),
    descricao: document.getElementById("productDescription").value.trim(),
    preco: parseFloat(document.getElementById("productPrice").value),
    imagem: currentImageData, // Usa a imagem carregada (base64 ou URL)
    status: document.getElementById("productStatus").value,
  };

  // Validação básica
  if (
    !productData.nome ||
    !productData.descricao ||
    !productData.preco ||
    !productData.imagem
  ) {
    showToast("❌ Preencha todos os campos obrigatórios", "error");
    return;
  }

  try {
    console.log("🔵 Iniciando envio do formulário...");
    console.log("📦 Dados a serem salvos:", productData);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    if (currentEditingId) {
      // Atualizar produto existente
      console.log("✏️ Atualizando produto ID:", currentEditingId);
      await updateProduct(currentEditingId, productData);
      console.log("✅ Produto atualizado com sucesso!");
      showToast("✓ Produto atualizado com sucesso!", "success");
    } else {
      // Adicionar novo produto
      console.log("➕ Adicionando novo produto...");
      const newId = await addProduct(productData);
      console.log("✅ Produto adicionado! Novo ID:", newId);
      showToast("✓ Produto adicionado com sucesso!", "success");
    }

    closeProductModal();

    submitBtn.disabled = false;
    submitBtn.innerHTML = "Salvar";
  } catch (error) {
    console.error("❌ ERRO ao salvar produto:", error);

    let errorMessage = "✗ Erro ao salvar produto. ";

    if (error.code === "PERMISSION_DENIED") {
      errorMessage += "Permissão negada! Verifique as regras do Firebase.";
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "Tente novamente.";
    }

    showToast(errorMessage, "error");

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Salvar";
  }
}

/**
 * Confirma exclusão de produto
 */
async function deleteProductConfirm(productId) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) {
    return;
  }

  try {
    await deleteProduct(productId);
    showToast("✓ Produto excluído com sucesso!", "success");
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    showToast("✗ Erro ao excluir produto. Tente novamente.", "error");
  }
}

/**
 * Reseta o formulário
 */
function resetForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("imagePreview").style.display = "none";
  document.getElementById("formTitle").innerHTML =
    '<i class="fas fa-plus-circle"></i> Adicionar Novo Produto';
  document.getElementById("btnSubmit").innerHTML =
    '<i class="fas fa-save"></i> Salvar Produto';
  currentEditingId = null;
}

/**
 * Cancela edição do formulário
 */
function handleCancelForm() {
  resetForm();
  switchSection("produtos");
}

/**
 * Preview da imagem
 */
function handleImagePreview(e) {
  const imageUrl = e.target.value.trim();
  const preview = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");

  if (imageUrl) {
    previewImg.src = imageUrl;
    preview.style.display = "block";

    // Verifica se a imagem carrega
    previewImg.onerror = () => {
      preview.style.display = "none";
      showToast(
        "Não foi possível carregar a imagem. Verifique a URL.",
        "error",
      );
    };
  } else {
    preview.style.display = "none";
  }
}

// ========================================
// EDIÇÃO E EXCLUSÃO
// ========================================

/**
 * Edita um produto
 */
async function editProduct(productId) {
  try {
    const products = await loadProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      showToast("Produto não encontrado", "error");
      return;
    }

    // Preenche o formulário
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.nome;
    document.getElementById("productDescription").value = product.descricao;
    document.getElementById("productPrice").value = product.preco;
    document.getElementById("productImage").value = product.imagem;
    document.getElementById("productStatus").value = product.status;

    // Preview da imagem
    document.getElementById("previewImg").src = product.imagem;
    document.getElementById("imagePreview").style.display = "block";

    // Atualiza título e botão
    document.getElementById("formTitle").innerHTML =
      '<i class="fas fa-edit"></i> Editar Produto';
    document.getElementById("btnSubmit").innerHTML =
      '<i class="fas fa-save"></i> Atualizar Produto';

    currentEditingId = productId;
    switchSection("adicionar");
  } catch (error) {
    console.error("Erro ao editar produto:", error);
    showToast("Erro ao carregar produto", "error");
  }
}

/**
 * Mostra modal de confirmação de exclusão
 */
function showDeleteModal(productId) {
  deleteProductId = productId;
  document.getElementById("confirmModal").classList.add("active");
  document.getElementById("modalOverlay").classList.add("active");
}

/**
 * Fecha modal de confirmação
 */
function closeDeleteModal() {
  deleteProductId = null;
  document.getElementById("confirmModal").classList.remove("active");
  document.getElementById("modalOverlay").classList.remove("active");
}

/**
 * Confirma e executa exclusão
 */
async function confirmDelete() {
  if (!deleteProductId) return;

  try {
    await deleteProduct(deleteProductId);
    showToast("Produto excluído com sucesso!", "success");
    closeDeleteModal();
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    showToast("Erro ao excluir produto. Tente novamente.", "error");
  }
}

// ========================================
// UTILITÁRIOS ADMIN
// ========================================

/**
 * Mostra/esconde loading do admin
 */
function showAdminLoading(show) {
  const loading = document.getElementById("adminLoading");
  const container = document.getElementById("productsTableContainer");

  if (loading && container) {
    if (show) {
      loading.style.display = "flex";
      container.style.display = "none";
    } else {
      loading.style.display = "none";
      container.style.display = "block";
    }
  }
}

/**
 * Mostra notificação toast (versão simplificada)
 */
function showToast(message, type = "success") {
  // Cria toast dinamicamente se não existir
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  // Define cor baseado no tipo
  if (type === "success") {
    toast.style.background = "#27ae60";
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  } else if (type === "error") {
    toast.style.background = "#e74c3c";
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  } else if (type === "warning") {
    toast.style.background = "#f39c12";
    toast.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
  }

  // Mostra o toast
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 100);

  // Remove após 3 segundos
  setTimeout(() => {
    toast.style.transform = "translateX(400px)";
  }, 3000);
}

/**
 * Formata preço
 */
function formatPrice(price) {
  return parseFloat(price).toFixed(2).replace(".", ",");
}

// ========================================
// CONSOLE LOG ADMIN
// ========================================

console.log(
  "%c🔐 ADMIN - Taty Joias",
  "color: #D4AF37; font-size: 18px; font-weight: bold;",
);
