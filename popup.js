// API functions
const API_COLLECTIONS_URL =
  "https://nrpfomykweptsxunrlrq.supabase.co/rest/v1/collections?select=id,title,bookmarks(id,title,isFavorite,url)&bookmarks.order=title.desc";
const API_BOOKMARKS_URL =
  "https://nrpfomykweptsxunrlrq.supabase.co/rest/v1/bookmarks";
const API_KEY = "sb_publishable_EGk_HdWqAo6xeZyt2jiM2A_ym41SOTR";

async function getCollections() {
  const response = await fetch(API_COLLECTIONS_URL, {
    headers: {
      apikey: API_KEY,
    },
  });
  return response.json();
}

async function addCollection(title) {
  const response = await fetch(API_COLLECTIONS_URL, {
    method: "POST",
    headers: {
      apikey: API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ title }),
  });
  console.log(response);
  return response.json();
}

async function addBookmark(collectionId, title, url) {
  const response = await fetch(API_BOOKMARKS_URL, {
    method: "POST",
    headers: {
      apikey: API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ collection_id: collectionId, title, url }),
  });
  return response.json();
}

async function deleteBookmark(bookmarkId) {
  try {
    const response = await fetch(`${API_BOOKMARKS_URL}?id=eq.${bookmarkId}`, {
      method: "DELETE",
      headers: {
        apikey: API_KEY,
        Prefer: "return=representation",
      },
    });
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    throw error;
  }
}

async function getFavorites() {
  const response = await fetch(`${API_BOOKMARKS_URL}?isFavorite=eq.true`, {
    headers: {
      apikey: API_KEY,
    },
  });
  return response.json();
}

async function setFavorite(bookmarkId, isFavorite) {
  const response = await fetch(`${API_BOOKMARKS_URL}?id=eq.${bookmarkId}`, {
    method: "PUT",
    headers: {
      apikey: API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ id: bookmarkId, isFavorite }),
  });
}

// State management
let state = {
  collections: [],
  currentCollection: null,
  bookmarks: [],
  filteredBookmarks: [],
  searchQuery: "",
  currentView: "collection",
  favorites: [],
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadCollections();
  await loadBookmarks();
  await loadFavorites();
  renderBookmarks();
  setupEventListeners();
});

// Load collections from API
async function loadCollections() {
  try {
    const response = await getCollections();
    state.collections = response;
    state.currentCollection = state.collections[0];
    updateCollectionUI();
  } catch (error) {
    console.error("Error loading collections:", error);
    state.collections = [{ id: "1", title: "Collection 1", bookmarks: [] }];
    state.currentCollection = state.collections[0];
  }
}

// Load bookmarks from current collection
async function loadBookmarks() {
  try {
    if (!state.currentCollection) return;

    state.bookmarks = state.currentCollection.bookmarks || [];
    state.filteredBookmarks = state.bookmarks;
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    state.bookmarks = [];
    state.filteredBookmarks = [];
  }
}

// Update collection UI
function updateCollectionUI() {
  const collectionName = document.getElementById("collectionName");
  const collectionList = document.getElementById("collectionList");

  collectionName.textContent = state.currentCollection?.title || "Collection 1";

  collectionList.innerHTML = state.collections
    .map(
      (col) => `
    <div class="collection-item ${
      col.id === state.currentCollection?.id ? "active" : ""
    }" 
         data-id="${col.id}">
      ${col.title}
    </div>
  `
    )
    .join("");

  collectionList.querySelectorAll(".collection-item").forEach((item) => {
    item.addEventListener("click", async (e) => {
      const collectionId = parseInt(e.target.dataset.id);
      state.currentCollection = state.collections.find(
        (c) => c.id === collectionId
      );
      await loadBookmarks();
      renderBookmarks();
      attachBookmarkListeners();
      document.getElementById("collectionMenu").style.display = "none";
    });
  });
}

// Load favorites
async function loadFavorites() {
  try {
    const response = await getFavorites();
    state.favorites = response;
  } catch (error) {
    console.error("Error loading favorites:", error);
    state.favorites = [];
  }
}

// Render bookmarks
function renderBookmarks() {
  const container = document.getElementById("bookmarksContainer");

  if (state.filteredBookmarks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        </svg>
        <p>Không có bookmark nào</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.filteredBookmarks
    .map(
      (bookmark) => `
    <div class="bookmark-item" data-id="${bookmark.id}">
      <div class="bookmark-item-content">
        <img src="https://www.google.com/s2/favicons?sz=24&domain=${
          new URL(bookmark.url).hostname
        }" alt="" class="bookmark-favicon" data-fallback="true">
        <div class="bookmark-info">
          <div class="bookmark-title">${bookmark.title}</div>
          <div class="bookmark-url">${bookmark.url}</div>
        </div>
      </div>
      <div class="bookmark-actions">
        <a href="${
          bookmark.url
        }" target="_blank" class="bookmark-action-btn open-btn" title="Mở">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="13 3 23 3 23 13"></polyline>
            <line x1="23" y1="3" x2="13" y2="13"></line>
          </svg>
        </a>
        <button class="bookmark-action-btn favorite-btn" title="Yêu thích">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${
            bookmark.isFavorite ? "yellow" : "none"
          }" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </button>
        <button class="bookmark-action-btn delete-btn" title="Xóa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${"none"}" stroke="currentColor" stroke-width="2">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
          </svg>
        </button>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners
  attachBookmarkListeners();

  // Handle favicon fallback
  container.querySelectorAll(".bookmark-favicon").forEach((img) => {
    img.addEventListener("error", () => {
      img.src =
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%233b82f6%22%3E%3Crect width=%2224%22 height=%2224%22/%3E%3C/svg%3E";
    });
  });
}

// Render favorites
function renderFavorites() {
  const container = document.getElementById("bookmarksContainer");

  if (state.favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
        <p>Không có bookmark yêu thích nào</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.favorites
    .map(
      (bookmark) => `
    <div class="bookmark-item" data-id="${bookmark.id}">
      <div class="bookmark-item-content">
        <img src="https://www.google.com/s2/favicons?sz=24&domain=${
          new URL(bookmark.url).hostname
        }" alt="" class="bookmark-favicon" data-fallback="true">
        <div class="bookmark-info">
          <div class="bookmark-title">${bookmark.title}</div>
          <div class="bookmark-url">${bookmark.url}</div>
        </div>
      </div>
      <div class="bookmark-actions">
        <a href="${
          bookmark.url
        }" target="_blank" class="bookmark-action-btn open-btn" title="Mở">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="13 3 23 3 23 13"></polyline>
            <line x1="23" y1="3" x2="13" y2="13"></line>
          </svg>
        </a>
        <button class="bookmark-action-btn favorite-btn" title="Yêu thích">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="yellow" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </button>
        <button class="bookmark-action-btn delete-btn" title="Xóa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${"none"}" stroke="currentColor" stroke-width="2">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
          </svg>
        </button>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners
  attachBookmarkListeners();

  // Handle favicon fallback
  container.querySelectorAll(".bookmark-favicon").forEach((img) => {
    img.addEventListener("error", () => {
      img.src =
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%233b82f6%22%3E%3Crect width=%2224%22 height=%2224%22/%3E%3C/svg%3E";
    });
  });
}

// Attach event listeners to bookmark actions
function attachBookmarkListeners() {
  const container = document.getElementById("bookmarksContainer");

  container.querySelectorAll(".favorite-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const bookmarkId = parseInt(
        e.currentTarget.closest(".bookmark-item").dataset.id
      );
      const bookmark =
        state.filteredBookmarks.find((b) => b.id === bookmarkId) ||
        state.favorites.find((b) => b.id === bookmarkId);
      if (bookmark) {
        try {
          bookmark.isFavorite = !bookmark.isFavorite;
          await setFavorite(bookmarkId, bookmark.isFavorite);
          if (state.currentView === "favorite") {
            await loadFavorites();
            renderFavorites();
          } else {
            renderBookmarks();
          }
        } catch (error) {
          console.error("Error updating favorite:", error);
          alert("✗ Lỗi khi cập nhật yêu thích!");
        }
      }
    });
  });

  container.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const bookmarkId = e.currentTarget.closest(".bookmark-item").dataset.id;
      if (confirm("Bạn chắc chắn muốn xóa bookmark này?")) {
        try {
          await deleteBookmark(bookmarkId);
          // Cập nhật state local
          state.currentCollection.bookmarks =
            state.currentCollection.bookmarks.filter(
              (b) => b.id !== parseInt(bookmarkId)
            );
          state.bookmarks = state.bookmarks.filter(
            (b) => b.id !== parseInt(bookmarkId)
          );
          state.filteredBookmarks = state.filteredBookmarks.filter(
            (b) => b.id !== parseInt(bookmarkId)
          );
          renderBookmarks();
        } catch (error) {
          alert("✗ Lỗi khi xóa bookmark!");
          console.error(error);
        }
      }
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // View tabs
  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const view = e.currentTarget.dataset.view;
      state.currentView = view;

      // Update active tab
      document
        .querySelectorAll(".view-tab")
        .forEach((t) => t.classList.remove("active"));
      e.currentTarget.classList.add("active");

      // Show/hide views
      document.getElementById("collectionView").style.display =
        view === "collection" ? "block" : "none";
      document.getElementById("favoriteView").style.display =
        view === "favorite" ? "block" : "none";

      // Render appropriate view
      if (view === "favorite") {
        renderFavorites();
      } else {
        renderBookmarks();
      }
    });
  });

  // Search
  document.getElementById("searchInput").addEventListener("input", (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    state.filteredBookmarks = state.bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(state.searchQuery) ||
        b.url.toLowerCase().includes(state.searchQuery)
    );
    renderBookmarks();
  });

  // Collection dropdown
  document.getElementById("collectionBtn").addEventListener("click", () => {
    const menu = document.getElementById("collectionMenu");
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  });

  // Add collection
  document
    .getElementById("addCollectionBtn")
    .addEventListener("click", async () => {
      const name = prompt("Tên collection mới:");
      if (name) {
        const newCollection = {
          id: Date.now().toString(),
          title: name,
          bookmarks: [],
        };
        state.collections.push(newCollection);
        await addCollection(name);
        updateCollectionUI();
      }
    });

  // Add bookmark
  document.getElementById("addBtn").addEventListener("click", async () => {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];
      const url = currentTab.url;
      const title = prompt("Tên bookmark:", currentTab.title);

      if (title !== null && title.trim() !== "") {
        const newBookmark = {
          id: Date.now().toString(),
          title: title,
          url: url,
          favicon: `https://www.google.com/s2/favicons?sz=24&domain=${
            new URL(url).hostname
          }`,
          isFavorite: false,
        };
        state.currentCollection.bookmarks.push(newBookmark);
        await addBookmark(state.currentCollection.id, title, url);
        await loadBookmarks();
        renderBookmarks();
        alert("✓ Thêm bookmark thành công!");
      }
    } catch (error) {
      console.error("Lỗi khi lấy tab hiện tại:", error);
      alert("✗ Không thể lấy link từ trang web");
    }
  });

  // Navbar buttons
  document.getElementById("bellBtn").addEventListener("click", () => {
    alert("Thông báo: Không có thông báo mới");
  });

  document.getElementById("helpBtn").addEventListener("click", () => {
    alert(
      "BookmarkHub - Trợ giúp\n\n" +
        "• Mở: Click icon mở để mở link\n" +
        "• Sao chép: Click icon sao chép để copy URL\n" +
        "• Menu: Click icon 3 chấm để xóa/sửa bookmark\n" +
        "• Thêm: Click nút + để thêm bookmark mới\n" +
        "• Ghim: Ghim bookmark yêu thích\n" +
        "• Xóa: Xóa bookmark"
    );
  });

  document.getElementById("pinBtn").addEventListener("click", () => {
    alert("Tính năng ghim sẽ được cập nhật");
  });

  document.getElementById("deleteBtn").addEventListener("click", () => {
    if (confirm("Xóa tất cả bookmark trong collection này?")) {
      state.currentCollection.bookmarks = [];
      loadBookmarks();
      renderBookmarks();
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".collection-dropdown")) {
      document.getElementById("collectionMenu").style.display = "none";
    }
  });
}
