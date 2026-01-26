// ========================================
// VARIÁVEIS GLOBAIS ADMIN
// ========================================

let currentEditingId = null;
let deleteProductId = null;

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  initializeAdmin();
  setupAdminEventListeners();
});

/**
 * Inicializa o painel admin
 */
async function initializeAdmin() {
  try {
    showAdminLoading(true);
    await loadAdminProducts();

    // Escuta mudanças em tempo real
    listenToProducts((products) => {
      renderAdminProducts(products);
    });
  } catch (error) {
    console.error("Erro ao inicializar admin:", error);
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

  // Botões de adicionar produto
  document.getElementById("btnShowAdd").addEventListener("click", () => {
    switchSection("adicionar");
    resetForm();
  });

  // Formulário
  document
    .getElementById("productForm")
    .addEventListener("submit", handleFormSubmit);
  document
    .getElementById("btnCancel")
    .addEventListener("click", handleCancelForm);

  // Preview da imagem
  document
    .getElementById("productImage")
    .addEventListener("input", handleImagePreview);

  // Modal de confirmação
  document
    .getElementById("btnCancelDelete")
    .addEventListener("click", closeDeleteModal);
  document
    .getElementById("btnConfirmDelete")
    .addEventListener("click", confirmDelete);
  document
    .getElementById("modalOverlay")
    .addEventListener("click", closeDeleteModal);
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
 * Carrega produtos no admin
 */
async function loadAdminProducts() {
  try {
    const products = await loadProducts();
    renderAdminProducts(products);
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    throw error;
  }
}

/**
 * Renderiza produtos na lista do admin
 */
function renderAdminProducts(products) {
  const productsList = document.getElementById("productsList");

  if (!products || products.length === 0) {
    productsList.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <p>Nenhum produto cadastrado.</p>
                <button class="btn-add" onclick="switchSection('adicionar')">
                    <i class="fas fa-plus"></i> Adicionar Primeiro Produto
                </button>
            </div>
        `;
    return;
  }

  productsList.innerHTML = products
    .map(
      (product) => `
        <div class="product-item">
            <img src="${product.imagem}" alt="${product.nome}" class="product-item-image">
            
            <div class="product-item-info">
                <div class="product-item-header">
                    <h3 class="product-item-name">${product.nome}</h3>
                    <span class="status-badge ${product.status}">
                        ${product.status === "disponivel" ? "Disponível" : "Esgotado"}
                    </span>
                </div>
                <p class="product-item-description">${product.descricao}</p>
                <p class="product-item-price">R$ ${formatPrice(product.preco)}</p>
            </div>
            
            <div class="product-item-actions">
                <button class="btn-icon btn-edit" onclick="editProduct('${product.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="showDeleteModal('${product.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

// ========================================
// FORMULÁRIO
// ========================================

/**
 * Manipula submit do formulário
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const productData = {
    nome: document.getElementById("productName").value.trim(),
    descricao: document.getElementById("productDescription").value.trim(),
    preco: document.getElementById("productPrice").value,
    imagem: document.getElementById("productImage").value.trim(),
    status: document.getElementById("productStatus").value,
  };

  // Validação básica
  if (
    !productData.nome ||
    !productData.descricao ||
    !productData.preco ||
    !productData.imagem
  ) {
    showToast("Preencha todos os campos obrigatórios", "error");
    return;
  }

  try {
    if (currentEditingId) {
      // Atualizar produto existente
      await updateProduct(currentEditingId, productData);
      showToast("Produto atualizado com sucesso!", "success");
    } else {
      // Adicionar novo produto
      await addProduct(productData);
      showToast("Produto adicionado com sucesso!", "success");
    }

    resetForm();
    switchSection("produtos");
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    showToast("Erro ao salvar produto. Tente novamente.", "error");
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
  const productsList = document.getElementById("productsList");

  if (show) {
    loading.style.display = "block";
    productsList.style.display = "none";
  } else {
    loading.style.display = "none";
    productsList.style.display = "grid";
  }
}

/**
 * Mostra notificação toast
 */
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  const icon = toast.querySelector("i");

  // Define ícone e cor baseado no tipo
  if (type === "success") {
    icon.className = "fas fa-check-circle";
    toast.style.background = "#27ae60";
  } else if (type === "error") {
    icon.className = "fas fa-exclamation-circle";
    toast.style.background = "#e74c3c";
  } else if (type === "warning") {
    icon.className = "fas fa-exclamation-triangle";
    toast.style.background = "#f39c12";
  }

  toastMessage.textContent = message;
  toast.classList.add("active");

  // Remove após 3 segundos
  setTimeout(() => {
    toast.classList.remove("active");
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
