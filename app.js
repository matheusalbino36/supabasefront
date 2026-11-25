const API_URL = 'http://13.58.116.91:3000/products';

const productList = document.querySelector('#products');
const emptyState = document.querySelector('#empty-state');
const productCount = document.querySelector('#product-count');
const addProductForm = document.querySelector('#add-product-form');
const updateDialog = document.querySelector('#update-dialog');
const updateProductForm = document.querySelector('#update-product-form');
const updateProductId = document.querySelector('#update-id');
const updateProductName = document.querySelector('#update-name');
const updateProductPrice = document.querySelector('#update-price');
const updateProductDescription = document.querySelector('#update-description');
const searchProductForm = document.querySelector('#search-product-form');
const searchResult = document.querySelector('#search-result');
const toast = document.querySelector('#toast');

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast toast-${type} toast-visible`;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Não foi possível concluir a operação');
  }

  return data;
}

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(price));
}

async function fetchProducts() {
  try {
    const products = await request(API_URL);
    productList.innerHTML = '';

    const productArray = Array.isArray(products) ? products : [];
    productCount.textContent = `${productArray.length} ${productArray.length === 1 ? 'item' : 'itens'}`;
    emptyState.hidden = productArray.length !== 0;

    productArray.forEach(product => {
      const li = document.createElement('li');
      li.className = 'product-card';

      const description = product.description || 'Sem descrição';
      li.innerHTML = `
        <div class="product-details">
          <div class="product-title-row">
            <span class="product-id">#${product.id}</span>
            <h3>${escapeHtml(product.name)}</h3>
          </div>
          <p>${escapeHtml(description)}</p>
          <strong class="product-price">${formatPrice(product.price)}</strong>
        </div>
        <div class="card-actions">
          <button class="button button-edit" type="button">Editar</button>
          <button class="button button-danger" type="button">Excluir</button>
        </div>
      `;

      li.querySelector('.button-edit').addEventListener('click', () => openUpdateDialog(product));
      li.querySelector('.button-danger').addEventListener('click', () => deleteProduct(product.id));
      productList.appendChild(li);
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = value ?? '';
  return element.innerHTML;
}

async function addProduct(product) {
  return request(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
}

async function deleteProduct(id) {
  if (!window.confirm('Deseja excluir este produto?')) return;

  try {
    await request(`${API_URL}/${id}`, { method: 'DELETE' });
    showToast('Produto excluído com sucesso');
    await fetchProducts();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function updateProduct(id, product) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
}

function openUpdateDialog(product) {
  updateProductId.value = product.id;
  updateProductName.value = product.name;
  updateProductPrice.value = product.price;
  updateProductDescription.value = product.description || '';
  updateDialog.showModal();
  updateProductName.focus();
}

function closeUpdateDialog() {
  if (updateDialog.open) updateDialog.close();
}

addProductForm.addEventListener('submit', async event => {
  event.preventDefault();

  const product = {
    name: addProductForm.elements.name.value.trim(),
    price: Number(addProductForm.elements.price.value),
    description: addProductForm.elements.description.value.trim()
  };

  try {
    await addProduct(product);
    addProductForm.reset();
    showToast('Produto cadastrado com sucesso');
    await fetchProducts();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

updateProductForm.addEventListener('submit', async event => {
  event.preventDefault();

  const product = {
    name: updateProductName.value.trim(),
    price: Number(updateProductPrice.value),
    description: updateProductDescription.value.trim()
  };

  try {
    await updateProduct(updateProductId.value, product);
    closeUpdateDialog();
    showToast('Produto atualizado com sucesso');
    await fetchProducts();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

searchProductForm.addEventListener('submit', async event => {
  event.preventDefault();
  const id = document.querySelector('#search-id').value;

  try {
    const product = await request(`${API_URL}/${id}`);
    searchResult.innerHTML = `
      <article class="search-card">
        <span class="product-id">#${product.id}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description || 'Sem descrição')}</p>
        <strong>${formatPrice(product.price)}</strong>
      </article>
    `;
  } catch (error) {
    searchResult.innerHTML = `<p class="search-error">${escapeHtml(error.message)}</p>`;
  }
});

document.querySelector('#reload-products').addEventListener('click', fetchProducts);
document.querySelector('#close-dialog').addEventListener('click', closeUpdateDialog);
document.querySelector('#cancel-update').addEventListener('click', closeUpdateDialog);

updateDialog.addEventListener('click', event => {
  if (event.target === updateDialog) closeUpdateDialog();
});

fetchProducts();
