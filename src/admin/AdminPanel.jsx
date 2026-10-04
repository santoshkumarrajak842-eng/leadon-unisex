import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import "./Admin.css";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  category: "",
  gender: "Unisex",
  price: "",
  discount: 0,
  sale_price: "",
  product_image: "",
  images: [],
  sizes: ["S", "M", "L", "XL"],
  colors: ["Default"],
  stock: 0,
  featured: false,
  bestseller: false,
  new_arrival: false,
  is_active: true,
};

export default function AdminPanel() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loginMode, setLoginMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [section, setSection] = useState("dashboard");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);

  const [uploadingImages, setUploadingImages] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [uploadingCategory, setUploadingCategory] = useState(false);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    setChecking(true);

    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        setSession(null);
        setChecking(false);
        return;
      }

      const { data: admin, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", currentSession.user.id)
        .maybeSingle();

      if (error || !admin) {
        await supabase.auth.signOut();
        setSession(null);
        alert("You are not authorized as an admin.");
        return;
      }

      setSession(currentSession);
      await loadAll();
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  }

  async function login(e) {
    e.preventDefault();

    if (!email || !password) {
      alert("Enter email and password.");
      return;
    }

    setLoginLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        await supabase.auth.signOut();
        throw new Error("This account is not an admin.");
      }

      setSession(data.session);
      setLoginMode(false);
      await loadAll();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function loadAll() {
    setLoading(true);

    try {
      const [
        productsResult,
        categoriesResult,
        ordersResult,
        reviewsResult,
      ] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (reviewsResult.error) throw reviewsResult.error;

      setProducts(productsResult.data || []);
      setCategories(categoriesResult.data || []);
      setOrders(ordersResult.data || []);
      setReviews(reviewsResult.data || []);
    } catch (error) {
      console.error(error);
      alert(`Data loading failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function updateProductField(field, value) {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateArrayField(field, value) {
    const arr = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setProductForm((prev) => ({
      ...prev,
      [field]: arr,
    }));
  }

  async function uploadProductImages(files) {
    if (!files || !files.length) return;

    setUploadingImages(true);

    try {
      const uploadedUrls = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        const safeName = file.name
          .toLowerCase()
          .replace(/[^a-z0-9.]+/g, "-");

        const filePath = `${crypto.randomUUID()}-${safeName}`;

        const { error } = await supabase.storage
          .from("products")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      }

      if (!uploadedUrls.length) {
        throw new Error("No valid image was selected.");
      }

      setProductForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
        product_image:
          prev.product_image || uploadedUrls[0] || "",
      }));

      alert(`${uploadedUrls.length} image(s) uploaded successfully.`);
    } catch (error) {
      alert(`Image upload failed: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  }

  function removeProductImage(index) {
    setProductForm((prev) => {
      const images = [...(prev.images || [])];
      images.splice(index, 1);

      return {
        ...prev,
        images,
        product_image:
          prev.product_image === prev.images?.[index]
            ? images[0] || ""
            : prev.product_image,
      };
    });
  }

  function makeSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function openProductForm(product = null) {
    if (product) {
      setEditingProduct(product);

      setProductForm({
        ...emptyProduct,
        ...product,
        images: product.images || [],
        sizes: product.sizes?.length
          ? product.sizes
          : ["S", "M", "L", "XL"],
        colors: product.colors?.length
          ? product.colors
          : ["Default"],
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        ...emptyProduct,
        category: categories[0]?.name || "",
      });
    }

    setShowProductForm(true);
  }

  function closeProductForm() {
    setShowProductForm(false);
    setEditingProduct(null);
    setProductForm(emptyProduct);
  }

  async function saveProduct(e) {
    e.preventDefault();

    if (!productForm.name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (!productForm.category.trim()) {
      alert("Category is required.");
      return;
    }

    if (!productForm.price) {
      alert("Price is required.");
      return;
    }

    setLoading(true);

    try {
      const images = productForm.images || [];

      const payload = {
        name: productForm.name.trim(),
        slug:
          productForm.slug.trim() ||
          makeSlug(productForm.name),
        description: productForm.description || "",
        category: productForm.category,
        gender: productForm.gender,
        price: Number(productForm.price) || 0,
        discount: Number(productForm.discount) || 0,
        sale_price:
          productForm.sale_price === ""
            ? Number(productForm.price) || 0
            : Number(productForm.sale_price) || 0,
        product_image:
          productForm.product_image ||
          images[0] ||
          "",
        images,
        sizes: productForm.sizes || [],
        colors: productForm.colors || [],
        stock: Number(productForm.stock) || 0,
        featured: Boolean(productForm.featured),
        bestseller: Boolean(productForm.bestseller),
        new_arrival: Boolean(productForm.new_arrival),
        is_active: Boolean(productForm.is_active),
        updated_at: new Date().toISOString(),
      };

      let result;

      if (editingProduct) {
        result = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);
      } else {
        result = await supabase
          .from("products")
          .insert([payload]);
      }

      if (result.error) throw result.error;

      alert(
        editingProduct
          ? "Product updated successfully."
          : "Product added successfully."
      );

      closeProductForm();
      await loadAll();
    } catch (error) {
      alert(`Product save failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(product) {
    const ok = window.confirm(
      `Delete "${product.name}"?`
    );

    if (!ok) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      await loadAll();
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  }

  async function uploadCategoryImage(file) {
    if (!file) return;

    setUploadingCategory(true);

    try {
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-");

      const filePath = `${crypto.randomUUID()}-${safeName}`;

      const { error } = await supabase.storage
        .from("categories")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("categories")
        .getPublicUrl(filePath);

      setCategoryImage(data.publicUrl);
    } catch (error) {
      alert(`Category image upload failed: ${error.message}`);
    } finally {
      setUploadingCategory(false);
    }
  }

  async function addCategory(e) {
    e.preventDefault();

    if (!categoryName.trim()) {
      alert("Category name is required.");
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .insert([
          {
            name: categoryName.trim(),
            slug:
              categorySlug.trim() ||
              makeSlug(categoryName),
            image: categoryImage,
            is_active: true,
          },
        ]);

      if (error) throw error;

      setCategoryName("");
      setCategorySlug("");
      setCategoryImage("");

      await loadAll();
      alert("Category added.");
    } catch (error) {
      alert(`Category add failed: ${error.message}`);
    }
  }

  async function deleteCategory(category) {
    const ok = window.confirm(
      `Delete "${category.name}"?`
    );

    if (!ok) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (error) throw error;

      await loadAll();
    } catch (error) {
      alert(`Category delete failed: ${error.message}`);
    }
  }

  async function updateOrder(id, field, value) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          [field]: value,
        })
        .eq("id", id);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? { ...order, [field]: value }
            : order
        )
      );
    } catch (error) {
      alert(`Order update failed: ${error.message}`);
    }
  }

  async function approveReview(id, approved) {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ approved })
        .eq("id", id);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((review) =>
          review.id === id
            ? { ...review, approved }
            : review
        )
      );
    } catch (error) {
      alert(`Review update failed: ${error.message}`);
    }
  }

  async function deleteReview(id) {
    if (!window.confirm("Delete this review?")) return;

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReviews((prev) =>
        prev.filter((review) => review.id !== id)
      );
    } catch (error) {
      alert(`Review delete failed: ${error.message}`);
    }
  }

  const stats = useMemo(() => {
    const revenue = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    return {
      products: products.length,
      activeProducts: products.filter(
        (p) => p.is_active
      ).length,
      orders: orders.length,
      revenue,
      customers: new Set(
        orders.map((o) => o.phone).filter(Boolean)
      ).size,
      reviews: reviews.length,
    };
  }, [products, orders, reviews]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();

    if (!q) return products;

    return products.filter((product) =>
      [
        product.name,
        product.category,
        product.gender,
        product.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, productSearch]);

  const customers = useMemo(() => {
    const map = new Map();

    orders.forEach((order) => {
      if (!order.phone) return;

      if (!map.has(order.phone)) {
        map.set(order.phone, {
          name: order.customer_name,
          phone: order.phone,
          email: order.email,
          city: order.city,
          orders: 0,
          total: 0,
        });
      }

      const customer = map.get(order.phone);

      customer.orders += 1;
      customer.total += Number(order.total || 0);
    });

    return Array.from(map.values());
  }, [orders]);

  if (checking) {
    return (
      <div className="admin-loading">
        <h2>Loading Admin Panel...</h2>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-logo">
            LEADON
          </div>

          <p className="admin-subtitle">
            Unisex Wear Admin
          </p>

          <h1>Admin Login</h1>

          <form onSubmit={login}>
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <p className="admin-login-note">
            Authorized admin accounts only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <strong>LEADON</strong>
          <span>ADMIN</span>
        </div>

        <nav>
          <button
            className={
              section === "dashboard"
                ? "active"
                : ""
            }
            onClick={() => setSection("dashboard")}
          >
            📊 Dashboard
          </button>

          <button
            className={
              section === "products"
                ? "active"
                : ""
            }
            onClick={() => setSection("products")}
          >
            📦 Products
          </button>

          <button
            className={
              section === "categories"
                ? "active"
                : ""
            }
            onClick={() => setSection("categories")}
          >
            🏷️ Categories
          </button>

          <button
            className={
              section === "orders"
                ? "active"
                : ""
            }
            onClick={() => setSection("orders")}
          >
            🛍️ Orders
          </button>

          <button
            className={
              section === "customers"
                ? "active"
                : ""
            }
            onClick={() => setSection("customers")}
          >
            👥 Customers
          </button>

          <button
            className={
              section === "reviews"
                ? "active"
                : ""
            }
            onClick={() => setSection("reviews")}
          >
            ⭐ Reviews
          </button>

          <button
            className={
              section === "settings"
                ? "active"
                : ""
            }
            onClick={() => setSection("settings")}
          >
            ⚙️ Settings
          </button>
        </nav>

        <button
          className="admin-logout"
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>
              {section === "dashboard" &&
                "Dashboard"}
              {section === "products" &&
                "Products"}
              {section === "categories" &&
                "Categories"}
              {section === "orders" &&
                "Orders"}
              {section === "customers" &&
                "Customers"}
              {section === "reviews" &&
                "Reviews"}
              {section === "settings" &&
                "Settings"}
            </h1>

            <p>
              Manage your LEADON store
            </p>
          </div>

          <div className="admin-user">
            <span>●</span>
            {session.user.email}
          </div>
        </header>

        {section === "dashboard" && (
          <Dashboard
            stats={stats}
            orders={orders}
            products={products}
            setSection={setSection}
          />
        )}

        {section === "products" && (
          <section className="admin-section">
            <div className="section-top">
              <div>
                <h2>All Products</h2>
                <p>
                  {products.length} products
                </p>
              </div>

              <button
                className="primary-btn"
                onClick={() =>
                  openProductForm()
                }
              >
                + Add Product
              </button>
            </div>

            <div className="search-box">
              <input
                value={productSearch}
                onChange={(e) =>
                  setProductSearch(e.target.value)
                }
                placeholder="Search products..."
              />
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            {product.product_image ? (
                              <img
                                src={
                                  product.product_image
                                }
                                alt={product.name}
                              />
                            ) : (
                              <div className="no-image">
                                —
                              </div>
                            )}

                            <div>
                              <strong>
                                {product.name}
                              </strong>

                              <small>
                                {product.gender}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {product.category}
                        </td>

                        <td>
                          {money(
                            product.sale_price ||
                              product.price
                          )}
                        </td>

                        <td>
                          {product.stock}
                        </td>

                        <td>
                          <span
                            className={
                              product.is_active
                                ? "status active"
                                : "status inactive"
                            }
                          >
                            {product.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() =>
                                openProductForm(
                                  product
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="danger"
                              onClick={() =>
                                deleteProduct(
                                  product
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                  {!filteredProducts.length && (
                    <tr>
                      <td
                        colSpan="6"
                        className="empty-cell"
                      >
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "categories" && (
          <CategoriesSection
            categories={categories}
            categoryName={categoryName}
            categorySlug={categorySlug}
            categoryImage={categoryImage}
            uploadingCategory={
              uploadingCategory
            }
            setCategoryName={setCategoryName}
            setCategorySlug={setCategorySlug}
            uploadCategoryImage={
              uploadCategoryImage
            }
            addCategory={addCategory}
            deleteCategory={deleteCategory}
          />
        )}

        {section === "orders" && (
          <OrdersSection
            orders={orders}
            updateOrder={updateOrder}
          />
        )}

        {section === "customers" && (
          <CustomersSection
            customers={customers}
          />
        )}

        {section === "reviews" && (
          <ReviewsSection
            reviews={reviews}
            approveReview={approveReview}
            deleteReview={deleteReview}
          />
        )}

        {section === "settings" && (
          <SettingsSection
            session={session}
          />
        )}
      </main>

      {showProductForm && (
        <ProductModal
          form={productForm}
          editing={editingProduct}
          updateField={updateProductField}
          updateArrayField={updateArrayField}
          uploadProductImages={
            uploadProductImages
          }
          uploadingImages={uploadingImages}
          removeProductImage={
            removeProductImage
          }
          save={saveProduct}
          close={closeProductForm}
          loading={loading}
        />
      )}
    </div>
  );
}

function Dashboard({
  stats,
  orders,
  products,
  setSection,
}) {
  return (
    <section className="admin-section">
      <div className="stats-grid">
        <StatCard
          title="Products"
          value={stats.products}
          icon="📦"
        />

        <StatCard
          title="Active Products"
          value={stats.activeProducts}
          icon="✅"
        />

        <StatCard
          title="Orders"
          value={stats.orders}
          icon="🛍️"
        />

        <StatCard
          title="Revenue"
          value={money(stats.revenue)}
          icon="₹"
        />

        <StatCard
          title="Customers"
          value={stats.customers}
          icon="👥"
        />

        <StatCard
          title="Reviews"
          value={stats.reviews}
          icon="⭐"
        />
      </div>

      <div className="dashboard-grid">
        <div className="admin-card">
          <div className="card-heading">
            <div>
              <h2>Recent Orders</h2>
              <p>Latest customer orders</p>
            </div>

            <button
              onClick={() =>
                setSection("orders")
              }
            >
              View All
            </button>
          </div>

          {orders.slice(0, 5).map((order) => (
            <div
              className="recent-row"
              key={order.id}
            >
              <div>
                <strong>
                  {order.customer_name}
                </strong>

                <small>
                  {order.order_number ||
                    `Order #${order.id}`}
                </small>
              </div>

              <strong>
                {money(order.total)}
              </strong>
            </div>
          ))}

          {!orders.length && (
            <div className="empty-state">
              No orders yet.
            </div>
          )}
        </div>

        <div className="admin-card">
          <div className="card-heading">
            <div>
              <h2>Store Overview</h2>
              <p>Quick product information</p>
            </div>
          </div>

          <div className="overview-list">
            <div>
              <span>All Products</span>
              <strong>
                {products.length}
              </strong>
            </div>

            <div>
              <span>Featured</span>
              <strong>
                {
                  products.filter(
                    (p) => p.featured
                  ).length
                }
              </strong>
            </div>

            <div>
              <span>Bestsellers</span>
              <strong>
                {
                  products.filter(
                    (p) => p.bestseller
                  ).length
                }
              </strong>
            </div>

            <div>
              <span>New Arrivals</span>
              <strong>
                {
                  products.filter(
                    (p) => p.new_arrival
                  ).length
                }
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

function ProductModal({
  form,
  editing,
  updateField,
  updateArrayField,
  uploadProductImages,
  uploadingImages,
  removeProductImage,
  save,
  close,
  loading,
}) {
  return (
    <div className="modal-backdrop">
      <div className="product-modal">
        <div className="modal-header">
          <div>
            <h2>
              {editing
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p>
              Add complete product information
            </p>
          </div>

          <button
            className="close-btn"
            onClick={close}
          >
            ×
          </button>
        </div>

        <form onSubmit={save}>
          <div className="form-grid">
            <div>
              <label>Product Name *</label>
              <input
                value={form.name}
                onChange={(e) =>
                  updateField(
                    "name",
                    e.target.value
                  )
                }
                placeholder="LEADON Essential Oversized Tee"
              />
            </div>

            <div>
              <label>Slug</label>
              <input
                value={form.slug}
                onChange={(e) =>
                  updateField(
                    "slug",
                    e.target.value
                  )
                }
                placeholder="leadon-essential-oversized-tee"
              />
            </div>

            <div>
              <label>Category *</label>
              <input
                value={form.category}
                onChange={(e) =>
                  updateField(
                    "category",
                    e.target.value
                  )
                }
                placeholder="T-Shirts"
              />
            </div>

            <div>
              <label>Gender</label>
              <select
                value={form.gender}
                onChange={(e) =>
                  updateField(
                    "gender",
                    e.target.value
                  )
                }
              >
                <option>Unisex</option>
                <option>Men</option>
                <option>Women</option>
              </select>
            </div>

            <div>
              <label>Price *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  updateField(
                    "price",
                    e.target.value
                  )
                }
                placeholder="899"
              />
            </div>

            <div>
              <label>Discount %</label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) =>
                  updateField(
                    "discount",
                    e.target.value
                  )
                }
                placeholder="0"
              />
            </div>

            <div>
              <label>Sale Price</label>
              <input
                type="number"
                value={form.sale_price}
                onChange={(e) =>
                  updateField(
                    "sale_price",
                    e.target.value
                  )
                }
                placeholder="799"
              />
            </div>

            <div>
              <label>Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  updateField(
                    "stock",
                    e.target.value
                  )
                }
                placeholder="50"
              />
            </div>

            <div className="form-full">
              <label>Product Images</label>

              <div className="upload-box">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  id="product-image-upload"
                  onChange={(e) => {
                    uploadProductImages(
                      e.target.files
                    );
                    e.target.value = "";
                  }}
                  disabled={uploadingImages}
                />

                <label
                  htmlFor="product-image-upload"
                  className="upload-label"
                >
                  {uploadingImages
                    ? "Uploading..."
                    : "📸 Choose Images"}
                </label>

                <small>
                  You can select multiple images.
                </small>
              </div>

              {form.images?.length > 0 && (
                <div className="image-preview-grid">
                  {form.images.map(
                    (image, index) => (
                      <div
                        className="image-preview"
                        key={`${image}-${index}`}
                      >
                        <img
                          src={image}
                          alt={`Product ${
                            index + 1
                          }`}
                        />

                        {index === 0 && (
                          <span className="main-image-badge">
                            Main
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            removeProductImage(
                              index
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="form-full">
              <label>
                Main Product Image URL
              </label>

              <input
                value={form.product_image}
                onChange={(e) =>
                  updateField(
                    "product_image",
                    e.target.value
                  )
                }
                placeholder="Image URL"
              />
            </div>

            <div className="form-full">
              <label>
                Gallery Image URLs
              </label>

              <textarea
                value={(form.images || []).join(
                  ", "
                )}
                onChange={(e) =>
                  updateArrayField(
                    "images",
                    e.target.value
                  )
                }
                placeholder="URL 1, URL 2, URL 3"
                rows="3"
              />
            </div>

            <div className="form-full">
              <label>Description</label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Product description..."
                rows="5"
              />
            </div>

            <div>
              <label>
                Sizes
              </label>

              <input
                value={(form.sizes || []).join(
                  ", "
                )}
                onChange={(e) =>
                  updateArrayField(
                    "sizes",
                    e.target.value
                  )
                }
                placeholder="S, M, L, XL"
              />
            </div>

            <div>
              <label>
                Colors
              </label>

              <input
                value={(form.colors || []).join(
                  ", "
                )}
                onChange={(e) =>
                  updateArrayField(
                    "colors",
                    e.target.value
                  )
                }
                placeholder="Black, White"
              />
            </div>
          </div>

          <div className="checkbox-grid">
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  updateField(
                    "featured",
                    e.target.checked
                  )
                }
              />
              Featured
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.bestseller}
                onChange={(e) =>
                  updateField(
                    "bestseller",
                    e.target.checked
                  )
                }
              />
              Bestseller
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.new_arrival}
                onChange={(e) =>
                  updateField(
                    "new_arrival",
                    e.target.checked
                  )
                }
              />
              New Arrival
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  updateField(
                    "is_active",
                    e.target.checked
                  )
                }
              />
              Active
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={close}
              className="secondary-btn"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={
                loading || uploadingImages
              }
            >
              {loading
                ? "Saving..."
                : editing
                ? "Update Product"
                : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoriesSection({
  categories,
  categoryName,
  categorySlug,
  categoryImage,
  uploadingCategory,
  setCategoryName,
  setCategorySlug,
  uploadCategoryImage,
  addCategory,
  deleteCategory,
}) {
  return (
    <section className="admin-section">
      <div className="section-top">
        <div>
          <h2>Categories</h2>
          <p>
            Manage your store categories
          </p>
        </div>
      </div>

      <div className="admin-card category-form-card">
        <form onSubmit={addCategory}>
          <div className="form-grid">
            <div>
              <label>Category Name</label>
              <input
                value={categoryName}
                onChange={(e) =>
                  setCategoryName(
                    e.target.value
                  )
                }
                placeholder="T-Shirts"
              />
            </div>

            <div>
              <label>Slug</label>
              <input
                value={categorySlug}
                onChange={(e) =>
                  setCategorySlug(
                    e.target.value
                  )
                }
                placeholder="t-shirts"
              />
            </div>

            <div className="form-full">
              <label>Category Image</label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  uploadCategoryImage(
                    e.target.files?.[0]
                  )
                }
              />

              {uploadingCategory && (
                <small>
                  Uploading category image...
                </small>
              )}

              {categoryImage && (
                <img
                  className="category-upload-preview"
                  src={categoryImage}
                  alt="Category"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="primary-btn"
          >
            + Add Category
          </button>
        </form>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <div
            className="category-admin-card"
            key={category.id}
          >
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
              />
            ) : (
              <div className="category-placeholder">
                —
              </div>
            )}

            <div>
              <strong>{category.name}</strong>
              <small>{category.slug}</small>
            </div>

            <button
              className="danger"
              onClick={() =>
                deleteCategory(category)
              }
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrdersSection({
  orders,
  updateOrder,
}) {
  return (
    <section className="admin-section">
      <div className="section-top">
        <div>
          <h2>Orders</h2>
          <p>
            Manage customer orders
          </p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>
                    {order.order_number ||
                      `#${order.id}`}
                  </strong>
                </td>

                <td>
                  <strong>
                    {order.customer_name}
                  </strong>

                  <small>
                    {order.phone}
                  </small>
                </td>

                <td>
                  {money(order.total)}
                </td>

                <td>
                  <select
                    value={
                      order.payment_status ||
                      "pending"
                    }
                    onChange={(e) =>
                      updateOrder(
                        order.id,
                        "payment_status",
                        e.target.value
                      )
                    }
                  >
                    <option value="pending">
                      Pending
                    </option>
                    <option value="paid">
                      Paid
                    </option>
                    <option value="failed">
                      Failed
                    </option>
                    <option value="refunded">
                      Refunded
                    </option>
                  </select>
                </td>

                <td>
                  <select
                    value={
                      order.order_status ||
                      "new"
                    }
                    onChange={(e) =>
                      updateOrder(
                        order.id,
                        "order_status",
                        e.target.value
                      )
                    }
                  >
                    <option value="new">
                      New
                    </option>
                    <option value="confirmed">
                      Confirmed
                    </option>
                    <option value="processing">
                      Processing
                    </option>
                    <option value="shipped">
                      Shipped
                    </option>
                    <option value="delivered">
                      Delivered
                    </option>
                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>
                </td>

                <td>
                  {order.created_at
                    ? new Date(
                        order.created_at
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    : "-"}
                </td>
              </tr>
            ))}

            {!orders.length && (
              <tr>
                <td
                  colSpan="6"
                  className="empty-cell"
                >
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CustomersSection({
  customers,
}) {
  return (
    <section className="admin-section">
      <div className="section-top">
        <div>
          <h2>Customers</h2>
          <p>
            Customers generated from orders
          </p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
              <th>Orders</th>
              <th>Total Spent</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.phone}>
                <td>
                  <strong>
                    {customer.name || "-"}
                  </strong>
                </td>

                <td>{customer.phone}</td>

                <td>
                  {customer.email || "-"}
                </td>

                <td>
                  {customer.city || "-"}
                </td>

                <td>
                  {customer.orders}
                </td>

                <td>
                  {money(customer.total)}
                </td>
              </tr>
            ))}

            {!customers.length && (
              <tr>
                <td
                  colSpan="6"
                  className="empty-cell"
                >
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReviewsSection({
  reviews,
  approveReview,
  deleteReview,
}) {
  return (
    <section className="admin-section">
      <div className="section-top">
        <div>
          <h2>Reviews</h2>
          <p>
            Approve or remove customer reviews
          </p>
        </div>
      </div>

      <div className="reviews-grid">
        {reviews.map((review) => (
          <div
            className="review-admin-card"
            key={review.id}
          >
            <div className="review-top">
              <div>
                <strong>
                  {review.customer_name ||
                    "Customer"}
                </strong>

                <div>
                  {"★".repeat(
                    Math.max(
                      0,
                      Math.min(
                        5,
                        Number(
                          review.rating || 0
                        )
                      )
                    )
                  )}
                </div>
              </div>

              <span
                className={
                  review.approved
                    ? "status active"
                    : "status inactive"
                }
              >
                {review.approved
                  ? "Approved"
                  : "Pending"}
              </span>
            </div>

            <p>
              {review.review ||
                "No review text."}
            </p>

            <div className="review-actions">
              <button
                onClick={() =>
                  approveReview(
                    review.id,
                    !review.approved
                  )
                }
              >
                {review.approved
                  ? "Unapprove"
                  : "Approve"}
              </button>

              <button
                className="danger"
                onClick={() =>
                  deleteReview(review.id)
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!reviews.length && (
          <div className="empty-state">
            No reviews yet.
          </div>
        )}
      </div>
    </section>
  );
}

function SettingsSection({
  session,
}) {
  return (
    <section className="admin-section">
      <div className="admin-card settings-card">
        <h2>Store Settings</h2>

        <div className="settings-row">
          <span>Store Name</span>
          <strong>
            LEADON Unisex Wear
          </strong>
        </div>

        <div className="settings-row">
          <span>Tagline</span>
          <strong>
            Wear Your Identity.
          </strong>
        </div>

        <div className="settings-row">
          <span>WhatsApp</span>
          <strong>
            +91 9365939799
          </strong>
        </div>

        <div className="settings-row">
          <span>Admin Account</span>
          <strong>
            {session?.user?.email}
          </strong>
        </div>

        <div className="settings-row">
          <span>Backend</span>
          <strong>
            Supabase
          </strong>
        </div>
      </div>
    </section>
  );
}