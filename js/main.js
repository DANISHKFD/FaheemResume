document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-ready");

  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  // Mark active nav link
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[data-page]").forEach((a) => {
    if (a.dataset.page === path) a.classList.add("active");
  });

  // Reveal-on-scroll
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    // Timeline dots light up as items enter view
    document.querySelectorAll(".timeline-item").forEach((el) => io.observe(el));
    const tio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll(".timeline-item").forEach((el) => tio.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  // 3D hover motion for cards and logos
  document.querySelectorAll(".hero-visual-card, .monogram, .logo-item, .competency-card, .contact-card, .timeline-item, .stat-cell").forEach((card) => {
    card.classList.add("tilt-card");
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      const rotateX = ((0.5 - (y / rect.height))) * 8;
      card.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
      card.classList.add("is-tilting");
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  // Animated counters, e.g. <span class="stat-num" data-count-to="600" data-suffix=" Cr"></span>
  const counters = document.querySelectorAll("[data-count-to]");
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.countTo);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  // Cursor spotlight + magnetic buttons (fine-pointer desktops only)
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (supportsHover && !reduceMotion) {
    const spotlight = document.createElement("div");
    spotlight.className = "cursor-spotlight";
    document.body.appendChild(spotlight);

    let sx = 0, sy = 0, cx = 0, cy = 0;
    window.addEventListener("pointermove", (e) => {
      sx = e.clientX;
      sy = e.clientY;
    });
    (function trackSpotlight() {
      cx += (sx - cx) * 0.15;
      cy += (sy - cy) * 0.15;
      spotlight.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(trackSpotlight);
    })();

    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("pointermove", (event) => {
        const rect = btn.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${(x * 0.25).toFixed(1)}px, ${(y * 0.25).toFixed(1)}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }
});
