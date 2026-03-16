// ========================================
// CONFIGURAÇÃO DO FIREBASE
// ========================================

// ⚠️ IMPORTANTE: Substitua pelas suas credenciais do Firebase
// Para obter suas credenciais:
// 1. Acesse: https://console.firebase.google.com/
// 2. Crie um novo projeto ou selecione um existente
// 3. Vá em "Configurações do Projeto" > "Suas aplicações" > "Web"
// 4. Copie a configuração e cole abaixo
// 5. Habilite o Realtime Database em "Database" > "Realtime Database"

const firebaseConfig = {
  apiKey: "AIzaSyAzVMxqdkHE5BOACLCde4BZTc2Nm3Xtglo",
  authDomain: "cachinhos-dourados.firebaseapp.com",
  databaseURL: "https://cachinhos-dourados-default-rtdb.firebaseio.com/", // URL do Realtime Database
  projectId: "cachinhos-dourados",
  storageBucket: "cachinhos-dourados.firebasestorage.app",
  messagingSenderId: "411652937366",
  appId: "1:411652937366:web:569aee4f6664222c8f54b7",
};

// Variáveis globais do Firebase
let auth;
let database;
let productsRef;

// Inicializar Firebase
try {
  firebase.initializeApp(firebaseConfig);

  // Referência ao Realtime Database (essencial para o catálogo)
  database = firebase.database();
  productsRef = database.ref("produtos");
  console.log("🔥 Firebase Realtime Database inicializado com sucesso!");

  // Referência ao Firebase Auth (necessário apenas para o admin)
  try {
    auth = firebase.auth();
    console.log("🔐 Firebase Auth inicializado com sucesso!");
  } catch (authError) {
    console.warn(
      "⚠️ Firebase Auth não disponível nesta página (normal no catálogo):",
      authError.message,
    );
  }

  console.log("📋 Configuração:");
  console.log("   - Project ID:", firebaseConfig.projectId);
  console.log("   - Database URL:", firebaseConfig.databaseURL);
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error);
  console.error("🔧 Verifique se:");
  console.error("   - As credenciais estão corretas no firebase-config.js");
  console.error("   - O projeto Firebase existe e está ativo");
  console.error("   - O Realtime Database está habilitado");
}

// ========================================
// FUNÇÕES AUXILIARES DO FIREBASE
// ========================================

/**
 * Carrega todos os produtos do Realtime Database
 * @returns {Promise<Array>} Array de produtos
 */
async function loadProducts() {
  try {
    console.log("📥 Buscando produtos do Firebase...");
    const snapshot = await productsRef.once("value");
    const data = snapshot.val();

    if (!data) {
      console.log("📝 Nenhum produto encontrado no Firebase");
      return [];
    }

    // Converte o objeto para array
    const products = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));

    console.log("✅ Produtos carregados do Firebase:", products.length);
    console.table(
      products.map((p) => ({ id: p.id, nome: p.nome, status: p.status })),
    );
    return products;
  } catch (error) {
    console.error("❌ Erro ao carregar produtos do Firebase:", error);
    console.error("💡 Verifique as regras de segurança do Firebase");
    console.error("💡 Veja o arquivo CONFIGURACAO_FIREBASE.md para instruções");
    throw error;
  }
}
/**
 * Adiciona um novo produto ao Realtime Database
 * @param {Object} productData - Dados do produto
 * @returns {Promise<string>} ID do produto criado
 */
async function addProduct(productData) {
  try {
    console.log("🔵 Iniciando adição de produto...");
    console.log("📦 Dados do produto:", productData);

    // Verifica autenticação
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("❌ Usuário não autenticado! Faça login primeiro.");
    }
    console.log("✅ Usuário autenticado:", currentUser.email);

    // Verifica se productsRef existe
    if (!productsRef) {
      throw new Error("❌ Referência ao Firebase não inicializada!");
    }
    console.log("✅ Referência ao Firebase OK");

    // Cria uma nova referência com ID único
    const newProductRef = productsRef.push();
    console.log("🆔 ID gerado:", newProductRef.key);

    const productToSave = {
      nome: productData.nome,
      descricao: productData.descricao,
      preco: parseFloat(productData.preco),
      imagem: productData.imagem,
      status: productData.status,
      criadoEm: firebase.database.ServerValue.TIMESTAMP,
    };

    console.log("💾 Salvando produto no Firebase...");
    await newProductRef.set(productToSave);

    console.log("✅ Produto adicionado com sucesso! ID:", newProductRef.key);
    return newProductRef.key;
  } catch (error) {
    console.error("❌ ERRO ao adicionar produto:", error);
    console.error("📋 Código do erro:", error.code);
    console.error("📋 Mensagem:", error.message);

    if (error.code === "PERMISSION_DENIED") {
      console.error("🚫 PERMISSÃO NEGADA!");
      console.error("💡 Verifique:");
      console.error("   1. Você está logado no admin?");
      console.error("   2. As regras do Firebase estão configuradas?");
      console.error("   3. Veja CONFIGURACAO_FIREBASE.md");
    }

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
    await productsRef.child(productId).update({
      nome: productData.nome,
      descricao: productData.descricao,
      preco: parseFloat(productData.preco),
      imagem: productData.imagem,
      status: productData.status,
      atualizadoEm: firebase.database.ServerValue.TIMESTAMP,
    });

    console.log("✅ Produto atualizado:", productId);
  } catch (error) {
    console.error("❌ Erro ao atualizar produto:", error);
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
    await productsRef.child(productId).remove();
    console.log("✅ Produto excluído:", productId);
  } catch (error) {
    console.error("❌ Erro ao excluir produto:", error);
    throw error;
  }
}

/**
 * Escuta mudanças em tempo real na coleção de produtos
 * @param {Function} callback - Função chamada quando há mudanças
 * @returns {Function} Função para cancelar a escuta
 */
function listenToProducts(callback) {
  console.log("👂 Iniciando escuta em tempo real de produtos...");

  const listener = productsRef.on(
    "value",
    (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        console.log("📝 Nenhum produto no Firebase");
        callback([]);
        return;
      }

      // Converte o objeto para array
      const products = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      console.log("🔄 Produtos atualizados em tempo real:", products.length);
      console.log("📦 IDs dos produtos:", products.map((p) => p.id).join(", "));
      callback(products);
    },
    (error) => {
      console.error("❌ Erro ao escutar produtos:", error);
      console.error("💡 Código do erro:", error.code);
      console.error("💡 Mensagem:", error.message);

      if (error.code === "PERMISSION_DENIED") {
        console.error("🚫 PERMISSÃO NEGADA!");
        console.error(
          "📋 Configure as regras do Firebase conforme CONFIGURACAO_FIREBASE.md",
        );
      }
    },
  );

  // Retorna função para cancelar a escuta
  return () => {
    productsRef.off("value", listener);
    console.log("🔇 Escuta de produtos cancelada");
  };
}

/**
 * Inicializa produtos de exemplo no Realtime Database (apenas se vazio)
 * @returns {Promise<void>}
 */
async function initializeExampleProducts() {
  try {
    const snapshot = await productsRef.once("value");

    // Se já existem produtos, não faz nada
    if (snapshot.exists()) {
      console.log("📋 Produtos já existem no database");
      return;
    }

    console.log("🏗️ Inicializando produtos de exemplo...");

    const exampleProducts = [
      {
        nome: "Colar Elegance",
        descricao: "Colar delicado em banho de ouro com pingente de coração",
        preco: 89.9,
        imagem:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80",
        status: "disponivel",
      },
      {
        nome: "Brinco Luxo",
        descricao: "Par de brincos em argola com detalhes em cristal",
        preco: 69.9,
        imagem:
          "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80",
        status: "disponivel",
      },
      {
        nome: "Pulseira Sofisticada",
        descricao: "Pulseira elo português folheada a ouro 18k",
        preco: 129.9,
        imagem:
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&q=80",
        status: "disponivel",
      },
      {
        nome: "Anel Clássico",
        descricao: "Anel solitário com zircônia cravejada",
        preco: 79.9,
        imagem:
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&q=80",
        status: "esgotado",
      },
      {
        nome: "Conjunto Premium",
        descricao: "Conjunto colar e brinco com pedras naturais",
        preco: 159.9,
        imagem:
          "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500&q=80",
        status: "disponivel",
      },
      {
        nome: "Tornozeleira Delicada",
        descricao: "Tornozeleira fina com pingentes em formato de estrela",
        preco: 49.9,
        imagem:
          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80",
        status: "disponivel",
      },
    ];

    // Adiciona cada produto
    for (const product of exampleProducts) {
      await addProduct(product);
    }

    console.log("✅ Produtos de exemplo inicializados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar produtos de exemplo:", error);
  }
}

// ========================================
// FUNÇÕES DE AUTENTICAÇÃO
// ========================================

/**
 * Faz login do admin com email e senha
 * @param {string} email - Email do admin
 * @param {string} password - Senha do admin
 * @returns {Promise<Object>} Dados do usuário autenticado
 */
async function loginAdmin(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password,
    );
    console.log("✅ Admin logado com sucesso:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("❌ Erro ao fazer login:", error);
    throw error;
  }
}

/**
 * Faz logout do admin
 * @returns {Promise<void>}
 */
async function logoutAdmin() {
  try {
    await auth.signOut();
    console.log("✅ Admin deslogado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao fazer logout:", error);
    throw error;
  }
}

/**
 * Obtém o usuário autenticado atual
 * @returns {Object|null} Usuário atual ou null
 */
function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Escuta mudanças no estado de autenticação
 * @param {Function} callback - Função chamada quando o estado muda
 * @returns {Function} Função para cancelar a escuta
 */
function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}

/**
 * Cria um novo usuário admin (use apenas uma vez para criar o primeiro admin)
 * @param {string} email - Email do admin
 * @param {string} password - Senha do admin
 * @returns {Promise<Object>} Dados do usuário criado
 */
async function createAdmin(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password,
    );
    console.log("✅ Admin criado com sucesso:", userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error("❌ Erro ao criar admin:", error);
    throw error;
  }
}
