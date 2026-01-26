// ========================================
// CONFIGURAÇÃO DO FIREBASE
// ========================================

// ⚠️ IMPORTANTE: Substitua pelas suas credenciais do Firebase
// Para obter suas credenciais:
// 1. Acesse: https://console.firebase.google.com/
// 2. Crie um novo projeto ou selecione um existente
// 3. Vá em "Configurações do Projeto" > "Suas aplicações" > "Web"
// 4. Copie a configuração e cole abaixo

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_AUTH_DOMAIN_AQUI",
  projectId: "SEU_PROJECT_ID_AQUI",
  storageBucket: "SEU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID_AQUI",
  appId: "SEU_APP_ID_AQUI",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referência ao Firestore
const db = firebase.firestore();

// Referência à coleção de produtos
const productsCollection = db.collection("produtos");

// Log de inicialização
console.log("🔥 Firebase inicializado com sucesso!");

// ========================================
// FUNÇÕES AUXILIARES DO FIREBASE
// ========================================

/**
 * Carrega todos os produtos do Firestore
 * @returns {Promise<Array>} Array de produtos
 */
async function loadProducts() {
  try {
    const snapshot = await productsCollection.get();
    const products = [];

    snapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return products;
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    throw error;
  }
}

/**
 * Adiciona um novo produto ao Firestore
 * @param {Object} productData - Dados do produto
 * @returns {Promise<string>} ID do produto criado
 */
async function addProduct(productData) {
  try {
    const docRef = await productsCollection.add({
      nome: productData.nome,
      descricao: productData.descricao,
      preco: parseFloat(productData.preco),
      imagem: productData.imagem,
      status: productData.status,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Produto adicionado com ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar produto:", error);
    throw error;
  }
}

/**
 * Atualiza um produto existente
 * @param {string} productId - ID do produto
 * @param {Object} productData - Novos dados do produto
 * @returns {Promise<void>}
 */
async function updateProduct(productId, productData) {
  try {
    await productsCollection.doc(productId).update({
      nome: productData.nome,
      descricao: productData.descricao,
      preco: parseFloat(productData.preco),
      imagem: productData.imagem,
      status: productData.status,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Produto atualizado:", productId);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    throw error;
  }
}

/**
 * Exclui um produto
 * @param {string} productId - ID do produto
 * @returns {Promise<void>}
 */
async function deleteProduct(productId) {
  try {
    await productsCollection.doc(productId).delete();
    console.log("✅ Produto excluído:", productId);
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    throw error;
  }
}

/**
 * Escuta mudanças em tempo real na coleção de produtos
 * @param {Function} callback - Função chamada quando há mudanças
 * @returns {Function} Função para cancelar a escuta
 */
function listenToProducts(callback) {
  return productsCollection.onSnapshot(
    (snapshot) => {
      const products = [];

      snapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      callback(products);
    },
    (error) => {
      console.error("Erro ao escutar produtos:", error);
    },
  );
}
