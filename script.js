// DOM nodes
const categorySelect = document.getElementById("categorySelect");
const generateBtn = document.getElementById("generateBtn");
const autoToggle = document.getElementById("autoToggle");
const memeTitle = document.getElementById("memeTitle");
const memeImage = document.getElementById("memeImage");
const memeAuthor = document.getElementById("memeAuthor");
const loader = document.getElementById("loader");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const jokeText = document.getElementById("jokeText");
const favoritesContainer = document.getElementById("favoritesContainer");
const favoritesModal = document.getElementById("favoritesModal");
const openFavorites = document.getElementById("openFavorites");
const closeFavorites = document.getElementById("closeFavorites");
const clearAllFavs = document.getElementById("clearAllFavs");
const favTpl = document.getElementById("favTpl");
const themeToggle = document.getElementById("themeToggle");
const topTextInput = document.getElementById("topText");
const bottomTextInput = document.getElementById("bottomText");
const applyCaption = document.getElementById("applyCaption");
const clearCaption = document.getElementById("clearCaption");
const captionOverlay = document.getElementById("captionOverlay");
const topOverlay = document.getElementById("topOverlay");
const bottomOverlay = document.getElementById("bottomOverlay");
const memeCanvas = document.getElementById("memeCanvas");

let autoMode = false;
let autoInterval = null;
let currentMeme = { url: "", title: "", author: "", subreddit: "" };

// Utility: confetti burst
function party() {
  try {
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.4 }
    });
  } catch (e) { /* confetti lib not loaded -> ignore */ }
}

// Show loader / hide loader helpers
function showLoader() {
  loader.style.display = "flex";
  memeImage.classList.remove("visible");
}
function hideLoader() {
  loader.style.display = "none";
  memeImage.classList.add("visible");
}

// Fetch meme from meme-api
// async function fetchMeme() {
//   showLoader();
//   const category = categorySelect.value || "wholesomememes";
//   try {
//     const res = await fetch(`https://meme-api.com/gimme/${category}`);
//     const data = await res.json();
//     // sometimes API returns gallery or reddit post
//     currentMeme.url = data.url || data.image || "";
//     currentMeme.title = data.title || "Untitled";
//     currentMeme.author = data.author || "unknown";
//     currentMeme.subreddit = data.subreddit ? `r/${data.subreddit}` : "";
//     // update UI
//     memeTitle.textContent = currentMeme.title;
//     memeAuthor.textContent = `By: ${currentMeme.author}`;
//     document.getElementById("subredditTag").textContent = currentMeme.subreddit;
//     memeImage.src = currentMeme.url;
//     // image load
//     memeImage.onload = () => {
//       hideLoader();
//       // reset caption canvas overlay visibility
//       captionOverlay.style.display = (topOverlay.textContent || bottomOverlay.textContent) ? "block" : "none";
//       party();
//     };
//     memeImage.onerror = () => {
//       hideLoader();
//       jokeText.textContent = "Failed to load image — try again.";
//     };
//   } catch (err) {
//     hideLoader();
//     jokeText.textContent = "Error fetching meme. Try again.";
//   }
//   // fetch joke as well
//   fetchJoke();
// }


// Fetch meme from meme-api (with CORS-safe proxy for image)
async function fetchMeme() {
  showLoader();
  const category = categorySelect.value || "wholesomememes";

  try {
    const res = await fetch(`https://meme-api.com/gimme/${category}`);
    const data = await res.json();

    // Prepare meme data
    currentMeme.url = data.url || data.image || "";
    currentMeme.title = data.title || "Untitled";
    currentMeme.author = data.author || "unknown";
    currentMeme.subreddit = data.subreddit ? `r/${data.subreddit}` : "";

    // Update UI
    memeTitle.textContent = currentMeme.title;
    memeAuthor.textContent = `By: ${currentMeme.author}`;
    document.getElementById("subredditTag").textContent = currentMeme.subreddit;

    // 🔥 Apply proxy to fix CORS issue
    const proxyUrl = "https://corsproxy.io/?";
    const safeUrl = proxyUrl + encodeURIComponent(currentMeme.url);

    memeImage.src = safeUrl;

    memeImage.onload = () => {
      hideLoader();
      captionOverlay.style.display =
        (topOverlay.textContent || bottomOverlay.textContent) ? "block" : "none";
      party();
    };
    memeImage.onerror = () => {
      hideLoader();
      jokeText.textContent = "Failed to load meme — try again!";
    };
  } catch (err) {
    hideLoader();
    jokeText.textContent = "Error fetching meme. Try again.";
  }

  // Fetch a joke too
  fetchJoke();
}


// Joke API
async function fetchJoke() {
  try {
    const res = await fetch("https://v2.jokeapi.dev/joke/Any?safe-mode");
    const data = await res.json();
    if (data.type === "single") jokeText.textContent = data.joke;
    else jokeText.textContent = `${data.setup} — ${data.delivery}`;
  } catch (e) {
    jokeText.textContent = "Couldn't fetch a joke today — but the meme will deliver.";
  }
}

// Auto mode handling
autoToggle.addEventListener("click", () => {
  autoMode = !autoMode;
  autoToggle.textContent = autoMode ? "Auto: ON" : "Auto: OFF";
  if (autoMode) autoInterval = setInterval(fetchMeme, 8000);
  else clearInterval(autoInterval);
});

// Save to favorites (localStorage)
saveBtn.addEventListener("click", () => {
  if (!currentMeme.url) return;
  let favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!favs.find(f => f.url === currentMeme.url)) {
    favs.unshift({ ...currentMeme, topText: topOverlay.textContent, bottomText: bottomOverlay.textContent });
    localStorage.setItem("favorites", JSON.stringify(favs));
    renderFavorites();
    // micro-feedback
    saveBtn.textContent = "Saved ✓";
    setTimeout(() => saveBtn.textContent = "❤️ Save", 1200);
  } else {
    // already saved feedback
    saveBtn.textContent = "Already ❤️";
    setTimeout(() => saveBtn.textContent = "❤️ Save", 1000);
  }
});

// Render favorites in modal
function renderFavorites() {
  favoritesContainer.innerHTML = "";
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  favs.forEach((f, idx) => {
    const node = favTpl.content.cloneNode(true);
    const img = node.querySelector(".fav-img");
    img.src = f.url;
    const openBtn = node.querySelector(".fav-open");
    const removeBtn = node.querySelector(".fav-remove");
    openBtn.addEventListener("click", () => {
      // load into main view
      currentMeme = { url: f.url, title: f.title, author: f.author, subreddit: f.subreddit || "" };
      memeImage.src = f.url;
      memeTitle.textContent = f.title;
      memeAuthor.textContent = `By: ${f.author}`;
      topOverlay.textContent = f.topText || "";
      bottomOverlay.textContent = f.bottomText || "";
      captionOverlay.style.display = (topOverlay.textContent || bottomOverlay.textContent) ? "block" : "none";
      favoritesModal.setAttribute("aria-hidden", "true");
    });
    removeBtn.addEventListener("click", () => {
      let current = JSON.parse(localStorage.getItem("favorites") || "[]");
      current.splice(idx, 1);
      localStorage.setItem("favorites", JSON.stringify(current));
      renderFavorites();
    });
    favoritesContainer.appendChild(node);
  });
}

// Download (with captions): draw onto canvas then save
downloadBtn.addEventListener("click", async () => {
  if (!currentMeme.url) return alert("No meme to download yet.");
  // draw image + overlay text on canvas
  const img = memeImage;
  const canvas = memeCanvas;
  const ctx = canvas.getContext("2d");
  // set canvas size matching natural image size (respect retina)
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;
  // draw base
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(img, 0, 0, w, h);

  // caption style: bold, uppercase, white with dark stroke
  const scale = Math.max(24, Math.floor(w / 18));
  ctx.font = `bold ${scale}px Poppins, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = Math.max(6, Math.floor(scale / 8));
  ctx.strokeStyle = "rgba(0,0,0,0.75)";

  // draw top
  if (topOverlay.textContent) {
    wrapText(ctx, topOverlay.textContent.toUpperCase(), w/2, scale*1.2, w - 40, scale);
  }
  // draw bottom
  if (bottomOverlay.textContent) {
    wrapText(ctx, bottomOverlay.textContent.toUpperCase(), w/2, h - scale*0.6, w - 40, scale, true);
  }

  // export
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meme_magic.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
});

// helper to wrap text either from top down or bottom up
function wrapText(ctx, text, x, y, maxWidth, lineHeight, fromBottom=false) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  // draw lines
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    const posY = fromBottom ? y - (lines.length - 1 - i) * lineHeight : y + i * lineHeight;
    ctx.strokeText(lineText, x, posY);
    ctx.fillText(lineText, x, posY);
  }
}

// Share (Web Share API fallback)
shareBtn.addEventListener("click", async () => {
  if (!currentMeme.url) return alert("No meme to share.");
  if (navigator.share) {
    try {
      await navigator.share({ title: currentMeme.title, text: "Check this meme!", url: currentMeme.url });
    } catch (e) { /* user cancelled */ }
  } else {
    // fallback: copy url to clipboard
    try {
      await navigator.clipboard.writeText(currentMeme.url);
      alert("Meme URL copied to clipboard!");
    } catch {
      alert("Sharing not supported. Try copying the URL manually.");
    }
  }
});

// Open favorites modal
openFavorites.addEventListener("click", () => {
  favoritesModal.setAttribute("aria-hidden", "false");
  renderFavorites();
});
closeFavorites && closeFavorites.addEventListener("click", () => favoritesModal.setAttribute("aria-hidden", "true"));
clearAllFavs && clearAllFavs.addEventListener("click", () => {
  if (confirm("Clear all favorites?")) {
    localStorage.removeItem("favorites");
    renderFavorites();
  }
});

// Theme toggle
themeToggle.addEventListener("change", (e) => {
  document.body.classList.toggle("theme-dark", e.target.checked);
});

// Caption controls
applyCaption.addEventListener("click", () => {
  topOverlay.textContent = topTextInput.value.trim();
  bottomOverlay.textContent = bottomTextInput.value.trim();
  captionOverlay.style.display = (topOverlay.textContent || bottomOverlay.textContent) ? "block" : "none";
});
clearCaption.addEventListener("click", () => {
  topTextInput.value = "";
  bottomTextInput.value = "";
  topOverlay.textContent = "";
  bottomOverlay.textContent = "";
  captionOverlay.style.display = "none";
});

// Initial bindings
generateBtn.addEventListener("click", fetchMeme);

// kick off
window.addEventListener("load", () => {
  renderFavorites();
  fetchMeme();
});
