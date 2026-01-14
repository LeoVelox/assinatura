// assets/js/main.js

// Theme Management
class ThemeManager {
  constructor() {
    this.themeToggle = document.querySelector(".theme-toggle");
    this.currentTheme = localStorage.getItem("theme") || "light";

    this.init();
  }

  init() {
    this.setTheme(this.currentTheme);
    this.bindEvents();
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.currentTheme = newTheme;
    this.setTheme(newTheme);
  }

  bindEvents() {
    if (this.themeToggle) {
      this.themeToggle.addEventListener("click", () => this.toggleTheme());
    }
  }
}

// Mobile Navigation
class MobileNavigation {
  constructor() {
    this.navToggle = document.querySelector(".nav-toggle");
    this.nav = document.querySelector(".nav");
    this.navLinks = document.querySelectorAll(".nav__link");

    this.init();
  }

  init() {
    this.bindEvents();
  }

  toggleMenu() {
    const isExpanded = this.navToggle.getAttribute("aria-expanded") === "true";
    this.navToggle.setAttribute("aria-expanded", !isExpanded);
    this.nav.classList.toggle("nav--visible", !isExpanded);
    document.body.style.overflow = !isExpanded ? "hidden" : "";
  }

  closeMenu() {
    this.navToggle.setAttribute("aria-expanded", "false");
    this.nav.classList.remove("nav--visible");
    document.body.style.overflow = "";
  }

  bindEvents() {
    if (this.navToggle) {
      this.navToggle.addEventListener("click", () => this.toggleMenu());
    }

    this.navLinks.forEach((link) => {
      link.addEventListener("click", () => this.closeMenu());
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.nav.contains(e.target) && !this.navToggle.contains(e.target)) {
        this.closeMenu();
      }
    });
  }
}

// Smooth Scrolling
class SmoothScroller {
  constructor() {
    this.init();
  }

  init() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();

        const targetId = anchor.getAttribute("href");
        if (targetId === "#") return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          });
        }
      });
    });
  }
}

// Intersection Observer for animations
class ScrollAnimator {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    this.init();
  }

  init() {
    this.setupObservers();
  }

  setupObservers() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, this.observerOptions);

    // Observe elements
    document
      .querySelectorAll(".feature-card, .benefit-card, .testimonial-card")
      .forEach((el) => {
        observer.observe(el);
      });
  }
}

// Video Player Controls
class VideoPlayer {
  constructor() {
    this.video = document.querySelector("video");
    this.init();
  }

  init() {
    if (this.video) {
      this.setupVideo();
    }
  }

  setupVideo() {
    // Lazy load video
    this.video.addEventListener("loadedmetadata", () => {
      console.log("Video metadata loaded");
    });

    // Add custom controls if needed
    this.video.addEventListener("click", () => {
      if (this.video.paused) {
        this.video.play();
      } else {
        this.video.pause();
      }
    });
  }
}

// Main Application
class App {
  constructor() {
    this.themeManager = new ThemeManager();
    this.mobileNav = new MobileNavigation();
    this.scroller = new SmoothScroller();
    this.animator = new ScrollAnimator();
    this.videoPlayer = new VideoPlayer();

    this.init();
  }

  init() {
    console.log("OSflex V3 - SarmTech");
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Window load event
    window.addEventListener("load", () => {
      document.body.classList.add("loaded");
    });

    // Header scroll effect
    window.addEventListener("scroll", () => {
      const header = document.querySelector(".header");
      if (window.scrollY > 50) {
        header.style.boxShadow = "var(--shadow-md)";
      } else {
        header.style.boxShadow = "none";
      }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.mobileNav.closeMenu();
      }
    });
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
