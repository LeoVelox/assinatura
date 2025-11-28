// assets/js/main.js - VERSÃO CORRIGIDA

// Theme switcher functionality
document.addEventListener("DOMContentLoaded", function () {
  const themeToggle = document.querySelector(".theme-toggle");
  const html = document.documentElement;

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = html.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";

      html.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  // Pricing toggle functionality
  const billingToggle = document.getElementById("billing-toggle");
  if (billingToggle) {
    billingToggle.addEventListener("change", () => {
      const monthlyPrices = document.querySelectorAll(
        ".pricing-card__price:not(.yearly)"
      );
      const yearlyPrices = document.querySelectorAll(
        ".pricing-card__price.yearly"
      );

      if (billingToggle.checked) {
        monthlyPrices.forEach((price) => (price.style.display = "none"));
        yearlyPrices.forEach((price) => (price.style.display = "block"));
      } else {
        monthlyPrices.forEach((price) => (price.style.display = "block"));
        yearlyPrices.forEach((price) => (price.style.display = "none"));
      }
    });
  }

  // Mobile navigation
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", !isExpanded);
      nav.classList.toggle("nav--visible", !isExpanded);
    });
  }

  // Close mobile nav when clicking on a link
  const navLinks = document.querySelectorAll(".nav__link");
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (navToggle && nav) {
        navToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("nav--visible");
      }
    });
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // Intersection Observer for animations
  const animateOnScroll = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
        observer.unobserve(entry.target);
      }
    });
  };

  const observerOptions = {
    threshold: 0.1,
  };

  const observer = new IntersectionObserver(animateOnScroll, observerOptions);

  document
    .querySelectorAll(".feature-card, .pricing-card, .testimonial-card")
    .forEach((card) => {
      observer.observe(card);
    });
});
