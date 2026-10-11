/**
 * Main UI Scripts for M.T. Solar by MTC
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // 2. Sticky Navbar scroll effect (60fps passive requestAnimationFrame)
  const navbar = document.getElementById('navbar');
  if (navbar) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 20) {
            navbar.classList.add('shadow-md', 'bg-white/95', 'backdrop-blur');
          } else {
            navbar.classList.remove('shadow-md', 'bg-white/95', 'backdrop-blur');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // 2b. Dropdown click & hover persistence (prevents disappearing before click)
  const navDropdownGroups = document.querySelectorAll('nav .relative.group');
  navDropdownGroups.forEach(group => {
    const btn = group.querySelector('button');
    const menu = group.querySelector('div[class*="absolute"]');
    if (!btn || !menu) return;

    let closeTimeout = null;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = group.classList.contains('is-open');
      navDropdownGroups.forEach(g => {
        if (g !== group) g.classList.remove('is-open');
      });
      group.classList.toggle('is-open', !isOpen);
    });

    group.addEventListener('mouseenter', () => {
      if (closeTimeout) clearTimeout(closeTimeout);
    });

    group.addEventListener('mouseleave', () => {
      closeTimeout = setTimeout(() => {
        group.classList.remove('is-open');
      }, 250);
    });
  });

  document.addEventListener('click', () => {
    navDropdownGroups.forEach(g => g.classList.remove('is-open'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      navDropdownGroups.forEach(g => g.classList.remove('is-open'));
    }
  });

  // 3. FAQ Accordion Handling
  const faqToggles = document.querySelectorAll('.faq-toggle');
  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.querySelector('.faq-content');
      const icon = toggle.querySelector('.faq-icon');
      const isHidden = content.classList.contains('hidden');

      // Close all other FAQs in the same container
      const container = toggle.closest('.faq-container') || document;
      container.querySelectorAll('.faq-toggle').forEach(other => {
        if (other !== toggle) {
          const otherContent = other.querySelector('.faq-content');
          const otherIcon = other.querySelector('.faq-icon');
          if (otherContent) otherContent.classList.add('hidden');
          if (otherIcon) {
            otherIcon.classList.remove('rotate-180');
          }
          other.classList.remove('bg-amber-50/50', 'border-amber-200');
        }
      });

      if (isHidden) {
        content.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
        toggle.classList.add('bg-amber-50/50', 'border-amber-200');
      } else {
        content.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
        toggle.classList.remove('bg-amber-50/50', 'border-amber-200');
      }
    });
  });

  // 4. Live Scheme Urgency Countdown Timer (Tranche Allocation Deadline)
  function initSchemeCountdown() {
    const daysEls = document.querySelectorAll('.timer-days, #scheme-timer-days');
    const hoursEls = document.querySelectorAll('.timer-hours, #scheme-timer-hours');
    const minsEls = document.querySelectorAll('.timer-mins, #scheme-timer-mins');
    const secsEls = document.querySelectorAll('.timer-secs, #scheme-timer-secs');

    if (!daysEls.length && !hoursEls.length && !minsEls.length && !secsEls.length) {
      return;
    }

    // Target deadline: End of current month 23:59:59 IST
    // If less than 3 days remain, roll forward to end of following month
    function getTargetDeadline() {
      const now = new Date();
      let target = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      if (target.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000) {
        target = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
      }
      return target;
    }

    const targetDate = getTargetDeadline();

    function updateTimer() {
      const now = new Date();
      let diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        diff = 0;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const dStr = String(days).padStart(2, '0');
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');

      daysEls.forEach(el => el.textContent = dStr);
      hoursEls.forEach(el => el.textContent = hStr);
      minsEls.forEach(el => el.textContent = mStr);
      secsEls.forEach(el => el.textContent = sStr);
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  initSchemeCountdown();
});

// Global Toast Alert Function
window.showToast = function(message, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 opacity-0 pointer-events-none flex items-center space-x-3 text-sm font-medium border border-slate-700';
    toast.innerHTML = `
      <i id="toast-icon" class="fa-solid fa-circle-check text-amber-400 text-lg"></i>
      <span id="toast-message"></span>
    `;
    document.body.appendChild(toast);
  }

  const msgSpan = document.getElementById('toast-message');
  const icon = document.getElementById('toast-icon');

  if (msgSpan) msgSpan.textContent = message;
  if (icon) {
    if (isError) {
      icon.className = 'fa-solid fa-triangle-exclamation text-red-400 text-lg';
    } else {
      icon.className = 'fa-solid fa-circle-check text-amber-400 text-lg';
    }
  }

  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 4000);
};
