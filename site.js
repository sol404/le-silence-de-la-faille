function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyInlineFormatting(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  return html;
}

function renderSimpleMarkdown(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return "<p>Ce chapitre est vide pour le moment.</p>";
  }

  const blocks = normalized.split(/\n\s*\n/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) {
        return "";
      }

      if (/^###\s+/.test(trimmed)) {
        return `<h3>${applyInlineFormatting(trimmed.replace(/^###\s+/, ""))}</h3>`;
      }

      if (/^##\s+/.test(trimmed)) {
        return `<h2>${applyInlineFormatting(trimmed.replace(/^##\s+/, ""))}</h2>`;
      }

      if (/^#\s+/.test(trimmed)) {
        return `<h1>${applyInlineFormatting(trimmed.replace(/^#\s+/, ""))}</h1>`;
      }

      const lines = trimmed
        .split("\n")
        .map((line) => applyInlineFormatting(line.trim()))
        .join("<br />");

      return `<p>${lines}</p>`;
    })
    .join("\n");
}

function getTotalChapters() {
  const rawValue = Number(document.body?.dataset?.totalChapters || 0);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 170;
}

function getChapterUrl(chapterNumber) {
  return `./reader.html?chapter=${chapterNumber}`;
}

function clampChapterNumber(value, totalChapters) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(Math.max(parsed, 1), totalChapters);
}

function buildChapterList(totalChapters) {
  return Array.from({ length: totalChapters }, (_, index) => {
    const chapterNumber = index + 1;
    return {
      number: chapterNumber,
      label: `Chapitre ${chapterNumber}`,
      href: getChapterUrl(chapterNumber),
    };
  });
}

function renderChapterList(items) {
  return items
    .map(
      (item) => `
        <a class="chapter-pill" href="${item.href}" aria-label="Ouvrir ${item.label}">
          <div>
            <strong>${item.label}</strong><br />
            <span>Lire</span>
          </div>
        </a>
      `,
    )
    .join("");
}

function attachJumpForms(totalChapters) {
  const forms = document.querySelectorAll("[data-jump-form]");

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const requestedChapter = clampChapterNumber(formData.get("chapter"), totalChapters);
      window.location.href = getChapterUrl(requestedChapter);
    });
  });
}

function initHomePage() {
  const chapterListElement = document.querySelector("[data-chapter-list]");
  if (!chapterListElement) {
    return;
  }

  const totalChapters = getTotalChapters();
  const allChapters = buildChapterList(totalChapters);
  const searchInput = document.querySelector("[data-chapter-search]");
  const chapterCount = document.querySelector("[data-chapter-count]");

  const update = () => {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const filtered = query
      ? allChapters.filter((item) => item.label.toLowerCase().includes(query) || String(item.number).includes(query))
      : allChapters;

    chapterListElement.innerHTML = renderChapterList(filtered);

    if (chapterCount) {
      chapterCount.textContent = query
        ? `${filtered.length} chapitre${filtered.length > 1 ? "s" : ""} affiché${filtered.length > 1 ? "s" : ""}`
        : `${totalChapters} chapitres`;
    }
  };

  attachJumpForms(totalChapters);
  update();

  if (searchInput) {
    searchInput.addEventListener("input", update);
  }
}

function setLinkState(link, href, disabled) {
  if (!link) {
    return;
  }

  if (disabled) {
    link.setAttribute("aria-disabled", "true");
    link.classList.add("is-disabled");
    link.setAttribute("href", href || "#");
    return;
  }

  link.removeAttribute("aria-disabled");
  link.classList.remove("is-disabled");
  link.setAttribute("href", href);
}

async function initReaderPage() {
  const article = document.querySelector("[data-chapter-content]");
  if (!article) {
    return;
  }

  const totalChapters = getTotalChapters();
  const params = new URLSearchParams(window.location.search);
  const chapterNumber = clampChapterNumber(params.get("chapter") || 1, totalChapters);
  const chapterTitle = `Chapitre ${chapterNumber}`;
  const sourceFile = `Chapitre ${chapterNumber}.md`;
  const sourcePath = `./chapitres/${encodeURIComponent(sourceFile)}`;

  const loadingState = document.querySelector("[data-loading-state]");
  const pageTitle = document.querySelector("[data-page-title]");
  const progress = document.querySelector("[data-reader-progress]");
  const prevLinks = [
    document.querySelector("[data-prev-link]"),
    document.querySelector("[data-prev-link-bottom]"),
  ];
  const nextLinks = [
    document.querySelector("[data-next-link]"),
    document.querySelector("[data-next-link-bottom]"),
  ];

  if (pageTitle) {
    pageTitle.textContent = chapterTitle;
  }

  if (progress) {
    progress.textContent = `${chapterTitle} sur ${totalChapters}`;
  }

  prevLinks.forEach((link) => setLinkState(link, getChapterUrl(chapterNumber - 1), chapterNumber <= 1));
  nextLinks.forEach((link) => setLinkState(link, getChapterUrl(chapterNumber + 1), chapterNumber >= totalChapters));

  attachJumpForms(totalChapters);
  document.title = `${chapterTitle} — Le Silence de la faille`;

  try {
    if (loadingState) {
      loadingState.textContent = "Chargement du chapitre…";
    }

    const response = await fetch(sourcePath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Impossible de charger ${sourcePath} (${response.status})`);
    }

    let markdown = await response.text();
    markdown = markdown.replace(/^#\s+Chapitre\s+\d+\s*\n+/i, "");

    article.innerHTML = renderSimpleMarkdown(markdown);

    if (loadingState) {
      loadingState.remove();
    }
  } catch (error) {
    console.error(error);
    if (loadingState) {
      loadingState.textContent = "Impossible de charger ce chapitre pour le moment.";
      loadingState.classList.add("error-state");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initHomePage();
  initReaderPage();
});
