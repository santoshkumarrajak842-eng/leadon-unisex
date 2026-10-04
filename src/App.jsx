import AdminPanel from "./admin/AdminPanel";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

const WHATSAPP_NUMBER = "919365939799";

function App() {
  if (window.location.pathname === "/admin") {
  return <AdminPanel />;
}
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Products error:", error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  function getGallery(product) {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }

    if (product?.product_image) {
      return [product.product_image];
    }

    return [];
  }

  function getSizes(product) {
    return Array.isArray(product?.sizes) && product.sizes.length
      ? product.sizes
      : ["S", "M", "L", "XL"];
  }

  function getColors(product) {
    return Array.isArray(product?.colors) && product.colors.length
      ? product.colors
      : ["Default"];
  }

  function openProduct(product) {
    setSelectedProduct(product);

    const gallery = getGallery(product);

    setSelectedImage(gallery[0] || "");
    setSelectedSize(getSizes(product)[0] || "");
    setSelectedColor(getColors(product)[0] || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeProduct() {
    setSelectedProduct(null);
    setSelectedImage("");
    setSelectedSize("");
    setSelectedColor("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function scrollToSection(id) {
    setSelectedProduct(null);

    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function showCategory(category) {
    setActiveCategory(category);
    setSelectedProduct(null);

    setTimeout(() => {
      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function addToCart(product = selectedProduct) {
    if (!product) return;

    const size = selectedSize || getSizes(product)[0];
    const color = selectedColor || getColors(product)[0];

    const existingIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.size === size &&
        item.color === color
    );

    if (existingIndex >= 0) {
      setCart((current) =>
        current.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart((current) => [
        ...current,
        {
          product,
          size,
          color,
          quantity: 1,
        },
      ]);
    }

    setCartOpen(true);
  }

  function removeFromCart(index) {
    setCart((current) => current.filter((_, i) => i !== index));
  }

  function changeQuantity(index, amount) {
    setCart((current) =>
      current
        .map((item, i) => {
          if (i !== index) return item;

          return {
            ...item,
            quantity: Math.max(1, item.quantity + amount),
          };
        })
    );
  }

  function getCartTotal() {
    return cart.reduce((total, item) => {
      const price = Number(
        item.product.sale_price || item.product.price || 0
      );

      return total + price * item.quantity;
    }, 0);
  }

  function buyNow(product = selectedProduct) {
    if (!product) return;

    const size = selectedSize || getSizes(product)[0];
    const color = selectedColor || getColors(product)[0];

    const price = Number(
      product.sale_price || product.price || 0
    );

    const message = `Hi LEADON! I want to order:

Product: ${product.name}
Size: ${size}
Color: ${color}
Price: ₹${price.toLocaleString("en-IN")}

Please share the next steps.`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  function checkoutCart() {
    if (!cart.length) return;

    const items = cart
      .map((item, index) => {
        const price = Number(
          item.product.sale_price || item.product.price || 0
        );

        return `${index + 1}. ${item.product.name}
Size: ${item.size}
Color: ${item.color}
Qty: ${item.quantity}
Price: ₹${(price * item.quantity).toLocaleString("en-IN")}`;
      })
      .join("\n\n");

    const message = `Hi LEADON! I want to place an order:

${items}

Total: ₹${getCartTotal().toLocaleString("en-IN")}

Please share the next steps.`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  function openWhatsApp() {
    const message =
      "Hi LEADON! I want to know more about your products.";

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  function subscribe(event) {
    event.preventDefault();

    const email = event.target.email.value.trim();

    if (!email) return;

    alert("Thank you for joining the LEADON community!");
    event.target.reset();
  }

  const fallbackProducts = [
    {
      id: "placeholder-1",
      name: "LEADON Essential Oversized Tee",
      category: "T-Shirts",
      gender: "Unisex",
      price: 899,
      sale_price: 899,
      product_image: "",
      images: [],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black"],
      stock: 50,
      new_arrival: true,
      description:
        "A relaxed oversized-fit tee designed for everyday comfort and effortless streetwear styling.",
    },
    {
      id: "placeholder-2",
      name: "LEADON Essential Hoodie",
      category: "Hoodies",
      gender: "Unisex",
      price: 1599,
      sale_price: 1599,
      product_image: "",
      images: [],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black"],
      stock: 20,
      new_arrival: true,
      description:
        "A comfortable everyday hoodie with a clean modern silhouette.",
    },
    {
      id: "placeholder-3",
      name: "LEADON Everyday Oversized Tee",
      category: "T-Shirts",
      gender: "Unisex",
      price: 999,
      sale_price: 999,
      product_image: "",
      images: [],
      sizes: ["S", "M", "L", "XL"],
      colors: ["White"],
      stock: 30,
      new_arrival: true,
      description:
        "An everyday oversized tee made for simple and effortless styling.",
    },
    {
      id: "placeholder-4",
      name: "LEADON Essential Bottom",
      category: "Bottoms",
      gender: "Unisex",
      price: 1299,
      sale_price: 1299,
      product_image: "",
      images: [],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black"],
      stock: 25,
      new_arrival: true,
      description:
        "A versatile everyday bottom designed for comfortable styling.",
    },
  ];

  const allProducts =
    products.length > 0 ? products : fallbackProducts;

  const filteredProducts = allProducts.filter((product) => {
    const category = String(product.category || "").toLowerCase();
    const gender = String(product.gender || "").toLowerCase();
    const name = String(product.name || "").toLowerCase();

    const categoryMatch =
      activeCategory === "ALL" ||
      (activeCategory === "MEN" &&
        (gender === "men" || category.includes("men"))) ||
      (activeCategory === "WOMEN" &&
        (gender === "women" || category.includes("women"))) ||
      (activeCategory === "UNISEX" && gender === "unisex") ||
      (activeCategory === "SALE" && Number(product.discount || 0) > 0);

    const searchMatch =
      !searchText ||
      name.includes(searchText.toLowerCase()) ||
      category.includes(searchText.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const newArrivals = allProducts
    .filter((product) => product.new_arrival)
    .slice(0, 4);

  const productsToShow =
    activeCategory === "ALL" && !searchText
      ? newArrivals.length
        ? newArrivals
        : allProducts.slice(0, 4)
      : filteredProducts;

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  /* ================= PRODUCT DETAIL ================= */

  if (selectedProduct) {
    const gallery = getGallery(selectedProduct);
    const sizes = getSizes(selectedProduct);
    const colors = getColors(selectedProduct);

    const finalPrice = Number(
      selectedProduct.sale_price || selectedProduct.price || 0
    );

    const originalPrice = Number(selectedProduct.price || 0);

    return (
      <div className="app">
        <div className="announcement">
          FREE SHIPPING ON ORDERS ABOVE ₹999
        </div>

        <header className="header">
          <button
            className="logo"
            onClick={closeProduct}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span>LEADON</span>
            <span>UNISEX WEAR</span>
          </button>

          <nav>
            <a onClick={() => scrollToSection("new")}>New Arrivals</a>
            <a onClick={() => showCategory("MEN")}>Men</a>
            <a onClick={() => showCategory("WOMEN")}>Women</a>
            <a onClick={() => showCategory("UNISEX")}>Unisex</a>
            <a onClick={() => scrollToSection("collections")}>
              Collections
            </a>
            <a onClick={() => showCategory("SALE")}>Sale</a>
          </nav>

          <div className="header-icons">
            <button onClick={() => setSearchOpen(!searchOpen)}>⌕</button>

            <button onClick={openWhatsApp}>♙</button>

            <button onClick={() => setCartOpen(true)}>
              🛍
              {cartCount > 0 && <small>{cartCount}</small>}
            </button>
          </div>
        </header>

        {searchOpen && (
          <div className="search-bar">
            <input
              autoFocus
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search products..."
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                closeProduct();
                setTimeout(() => {
                  document.getElementById("shop")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }, 100);
              }}
            >
              SEARCH
            </button>
          </div>
        )}

        <main className="product-detail-page">
          <button className="back-button" onClick={closeProduct}>
            ← Back to Shop
          </button>

          <div className="product-detail-grid">
            <div>
              <div className="main-product-image">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={selectedProduct.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="product-placeholder">
                    <span>LEADON</span>
                  </div>
                )}
              </div>

              {gallery.length > 0 && (
                <div className="product-thumbnails">
                  {gallery.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      className={
                        selectedImage === image
                          ? "thumbnail active"
                          : "thumbnail"
                      }
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`${selectedProduct.name} ${index + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-detail-info">
              <p className="product-label">
                {selectedProduct.gender || "Unisex"} •{" "}
                {selectedProduct.category || "Fashion"}
              </p>

              <h1>{selectedProduct.name}</h1>

              <div className="detail-price">
                <strong>
                  ₹{finalPrice.toLocaleString("en-IN")}
                </strong>

                {selectedProduct.discount > 0 &&
                  originalPrice > finalPrice && (
                    <>
                      <span>
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </span>
                      <small>
                        {selectedProduct.discount}% OFF
                      </small>
                    </>
                  )}
              </div>

              <p className="detail-description">
                {selectedProduct.description ||
                  "A contemporary LEADON piece designed for everyday comfort and effortless styling."}
              </p>

              <div className="selection-block">
                <h3>SELECT SIZE</h3>

                <div className="selection-buttons">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      className={
                        selectedSize === size ? "selected" : ""
                      }
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="selection-block">
                <h3>SELECT COLOR</h3>

                <div className="selection-buttons">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={
                        selectedColor === color ? "selected" : ""
                      }
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <p className="stock-text">
                {Number(selectedProduct.stock || 0) > 0 ? (
                  <>
                    <strong>In Stock</strong> •{" "}
                    {selectedProduct.stock} available
                  </>
                ) : (
                  <strong>Out of Stock</strong>
                )}
              </p>

              <div className="detail-actions">
                <button
                  onClick={() => addToCart()}
                  disabled={Number(selectedProduct.stock || 0) <= 0}
                >
                  ADD TO CART
                </button>

                <button
                  onClick={() => buyNow()}
                  disabled={Number(selectedProduct.stock || 0) <= 0}
                >
                  BUY NOW
                </button>
              </div>
            </div>
          </div>
        </main>

        {cartOpen && renderCart()}
      </div>
    );
  }

  function renderCart() {
    return (
      <div className="cart-overlay" onClick={() => setCartOpen(false)}>
        <div
          className="cart-drawer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cart-header">
            <h2>YOUR CART</h2>
            <button onClick={() => setCartOpen(false)}>×</button>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <h3>Your cart is empty</h3>
              <p>Add something you love.</p>
              <button onClick={() => setCartOpen(false)}>
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item, index) => {
                  const price = Number(
                    item.product.sale_price ||
                      item.product.price ||
                      0
                  );

                  const image = getGallery(item.product)[0];

                  return (
                    <div className="cart-item" key={index}>
                      <div className="cart-item-image">
                        {image ? (
                          <img src={image} alt={item.product.name} />
                        ) : (
                          "LEADON"
                        )}
                      </div>

                      <div className="cart-item-info">
                        <h4>{item.product.name}</h4>
                        <p>
                          {item.size} • {item.color}
                        </p>

                        <strong>
                          ₹{price.toLocaleString("en-IN")}
                        </strong>

                        <div className="quantity-controls">
                          <button
                            onClick={() =>
                              changeQuantity(index, -1)
                            }
                          >
                            −
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            onClick={() =>
                              changeQuantity(index, 1)
                            }
                          >
                            +
                          </button>

                          <button
                            className="remove-cart"
                            onClick={() =>
                              removeFromCart(index)
                            }
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-footer">
                <div>
                  <span>Total</span>
                  <strong>
                    ₹{getCartTotal().toLocaleString("en-IN")}
                  </strong>
                </div>

                <button onClick={checkoutCart}>
                  ORDER ON WHATSAPP
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ================= HOME PAGE ================= */

  return (
    <div className="app">
      <div className="announcement">
        FREE SHIPPING ON ORDERS ABOVE ₹999
      </div>

      <header className="header">
        <button
          className="logo"
          onClick={() => {
            setActiveCategory("ALL");
            setSearchText("");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          LEADON
          <span>UNISEX WEAR</span>
        </button>

        <nav>
          <a onClick={() => scrollToSection("new")}>
            New Arrivals
          </a>

          <a onClick={() => showCategory("MEN")}>Men</a>

          <a onClick={() => showCategory("WOMEN")}>Women</a>

          <a onClick={() => showCategory("UNISEX")}>Unisex</a>

          <a onClick={() => scrollToSection("collections")}>
            Collections
          </a>

          <a onClick={() => showCategory("SALE")}>Sale</a>
        </nav>

        <div className="header-icons">
          <button onClick={() => setSearchOpen(!searchOpen)}>
            ⌕
          </button>

          <button onClick={openWhatsApp}>♙</button>

          <button onClick={() => setCartOpen(true)}>
            🛍
            {cartCount > 0 && <small>{cartCount}</small>}
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="search-bar">
          <input
            autoFocus
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search products..."
          />

          <button
            onClick={() => {
              setSearchOpen(false);
              document.getElementById("shop")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            SEARCH
          </button>
        </div>
      )}

      {/* HERO */}

      <section className="hero">
        <div className="hero-content">
          <p>NEW SEASON • 2026</p>

          <h1>
            WEAR YOUR
            <br />
            IDENTITY.
          </h1>

          <span>Modern essentials. Made for everyone.</span>

          <div className="hero-buttons">
            <button onClick={() => showCategory("MEN")}>
              SHOP MEN
            </button>

            <button onClick={() => showCategory("WOMEN")}>
              SHOP WOMEN
            </button>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}

      <section className="section">
        <div className="section-heading">
          <p>EXPLORE</p>
          <h2>SHOP BY CATEGORY</h2>
        </div>

        <div className="category-grid">
          <div
            className="category-card men"
            id="men"
            onClick={() => showCategory("MEN")}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h3>MEN</h3>
              <p>Explore Collection →</p>
            </div>
          </div>

          <div
            className="category-card women"
            id="women"
            onClick={() => showCategory("WOMEN")}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h3>WOMEN</h3>
              <p>Explore Collection →</p>
            </div>
          </div>

          <div
            className="category-card unisex"
            id="unisex"
            onClick={() => showCategory("UNISEX")}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h3>UNISEX</h3>
              <p>Made For Everyone →</p>
            </div>
          </div>

          <div
            className="category-card arrivals"
            onClick={() => scrollToSection("new")}
            style={{ cursor: "pointer" }}
          >
            <div>
              <h3>NEW ARRIVALS</h3>
              <p>Discover What's New →</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}

      <section className="section" id="new">
        <div className="section-heading row-heading">
          <div>
            <p>JUST DROPPED</p>
            <h2>
              {activeCategory === "ALL"
                ? "NEW ARRIVALS"
                : activeCategory}
            </h2>
          </div>

          <button
            className="view-all-button"
            onClick={() => showCategory("ALL")}
          >
            VIEW ALL →
          </button>
        </div>

        <div id="shop" className="product-grid">
          {loading ? (
            <p>Loading products...</p>
          ) : productsToShow.length === 0 ? (
            <p>No products found.</p>
          ) : (
            productsToShow.map((product) => (
              <div
                className="product-card"
                key={product.id}
                onClick={() => openProduct(product)}
                style={{ cursor: "pointer" }}
              >
                <div className="product-image">
                  {product.product_image ? (
                    <img
                      src={product.product_image}
                      alt={product.name}
                    />
                  ) : (
                    <div className="product-placeholder">
                      <span>LEADON</span>
                    </div>
                  )}

                  {product.new_arrival && <span>NEW</span>}
                </div>

                <div className="product-info">
                  <h3>{product.name}</h3>

                  <p>
                    {product.gender || "Unisex"} •{" "}
                    {product.category || "Fashion"}
                  </p>

                  <strong>
                    ₹
                    {Number(
                      product.sale_price || product.price || 0
                    ).toLocaleString("en-IN")}
                  </strong>

                  {product.discount > 0 && (
                    <small>{product.discount}% OFF</small>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* FEATURED */}

      <section className="featured" id="collections">
        <div className="featured-content">
          <p>THE EVERYDAY COLLECTION</p>

          <h2>
            ESSENTIALS,
            <br />
            ELEVATED.
          </h2>

          <button onClick={() => showCategory("ALL")}>
            SHOP COLLECTION
          </button>
        </div>
      </section>

      {/* UNISEX */}

      <section className="unisex-section">
        <div>
          <p>LEADON</p>

          <h2>
            MADE FOR
            <br />
            EVERYONE.
          </h2>

          <span>
            Designed without limits. Contemporary pieces created
            for everyone who defines their own style.
          </span>

          <button onClick={() => showCategory("UNISEX")}>
            SHOP UNISEX
          </button>
        </div>
      </section>

      {/* WHY LEADON */}

      <section className="section why">
        <div className="section-heading">
          <p>THE LEADON STANDARD</p>
          <h2>WHY LEADON?</h2>
        </div>

        <div className="why-grid">
          <div>
            <span>01</span>
            <h3>PREMIUM FABRIC</h3>
            <p>
              Comfort-focused materials selected for everyday wear.
            </p>
          </div>

          <div>
            <span>02</span>
            <h3>MODERN FIT</h3>
            <p>
              Contemporary silhouettes made for effortless styling.
            </p>
          </div>

          <div>
            <span>03</span>
            <h3>MADE FOR EVERYONE</h3>
            <p>
              Unisex designs without unnecessary boundaries.
            </p>
          </div>

          <div>
            <span>04</span>
            <h3>QUALITY FIRST</h3>
            <p>
              Every piece is designed with detail and durability in mind.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}

      <section className="about" id="about">
        <p>OUR STORY</p>

        <h2>ABOUT LEADON</h2>

        <p className="about-text">
          LEADON Unisex Wear is an Indian fashion brand created by
          <strong> Om Rajak & Aditya Rajak</strong>, two young
          entrepreneurs with a vision to bring modern, comfortable
          and expressive fashion to everyone.
        </p>

        <p className="about-text">
          We believe fashion should be simple, confident and free
          from unnecessary boundaries. LEADON creates contemporary
          pieces designed for everyday life.
        </p>
      </section>

      {/* NEWSLETTER */}

      <section className="newsletter">
        <p>STAY IN THE LOOP</p>

        <h2>JOIN THE LEADON COMMUNITY</h2>

        <span>
          Get early access to new drops and exclusive offers.
        </span>

        <form onSubmit={subscribe}>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            required
          />

          <button type="submit">SUBSCRIBE</button>
        </form>
      </section>

      {/* FOOTER */}

      <footer>
        <div className="footer-brand">
          <h2>LEADON</h2>
          <p>UNISEX WEAR</p>
          <span>Wear Your Identity.</span>
        </div>

        <div>
          <h4>SHOP</h4>

          <a onClick={() => showCategory("MEN")}>Men</a>

          <a onClick={() => showCategory("WOMEN")}>Women</a>

          <a onClick={() => showCategory("UNISEX")}>Unisex</a>

          <a onClick={() => scrollToSection("new")}>
            New Arrivals
          </a>

          <a onClick={() => showCategory("SALE")}>Sale</a>
        </div>

        <div>
          <h4>HELP</h4>

          <a onClick={openWhatsApp}>Contact Us</a>

          <a
            onClick={() =>
              alert(
                "Free shipping is available on orders above ₹999."
              )
            }
          >
            Shipping
          </a>

          <a
            onClick={() =>
              alert(
                "For returns, please contact LEADON on WhatsApp."
              )
            }
          >
            Returns
          </a>

          <a
            onClick={() =>
              alert("Available sizes depend on the product.")
            }
          >
            Size Guide
          </a>

          <a onClick={openWhatsApp}>Track Order</a>
        </div>

        <div>
          <h4>COMPANY</h4>

          <a onClick={() => scrollToSection("about")}>
            About LeadOn
          </a>

          <a
            onClick={() =>
              alert("LEADON respects your privacy.")
            }
          >
            Privacy Policy
          </a>

          <a
            onClick={() =>
              alert("LEADON Terms & Conditions.")
            }
          >
            Terms & Conditions
          </a>

          <a
            onClick={() =>
              alert("For refund information, contact us on WhatsApp.")
            }
          >
            Refund Policy
          </a>
        </div>
      </footer>

      <div className="copyright">
        © 2026 LEADON Unisex Wear. All Rights Reserved.
      </div>

      {/* FLOATING WHATSAPP */}

      <button
        className="floating-whatsapp"
        onClick={openWhatsApp}
        aria-label="Contact LEADON on WhatsApp"
      >
        WhatsApp
      </button>

      {cartOpen && renderCart()}
    </div>
  );
}

export default App;