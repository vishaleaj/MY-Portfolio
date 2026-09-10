/**
 * VISHAL'S PORTFOLIO - CORE JAVASCRIPT
 * Features:
 * - Live in-place text editing with localStorage persistence
 * - Profile photo upload & persistence
 * - Exclusive theme switcher (Cyber, Aurora, Sunset, Luxe)
 * - Resume download (PDF via styled print & formatted TXT)
 * - Interactive forms, toast feedback, and smooth navigation
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    THEME: 'vishal_portfolio_theme',
    PHOTO: 'vishal_portfolio_photo',
    EDITS: 'vishal_portfolio_text_edits',
  };

  // --- DEFAULT PHOTO AVATAR SVG ---
  const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='100%' height='100%'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%236366f1'/><stop offset='100%25' stop-color='%23a855f7'/></linearGradient></defs><rect width='200' height='200' fill='url(%23grad)'/><circle cx='100' cy='75' r='38' fill='%23ffffff' opacity='0.9'/><path d='M35 180 C35 130, 165 130, 165 180 Z' fill='%23ffffff' opacity='0.9'/><text x='100' y='82' font-family='Arial' font-size='22' font-weight='bold' fill='%234f46e5' text-anchor='middle'>V</text></svg>";

  // --- DOM ELEMENTS ---
  const themeSelect = document.getElementById('themeSelect');
  const toggleEditBtn = document.getElementById('toggleEditBtn');
  const editBtnText = document.getElementById('editBtnText');
  const editToolbar = document.getElementById('editToolbar');
  const saveEditsBtn = document.getElementById('saveEditsBtn');
  const resetEditsBtn = document.getElementById('resetEditsBtn');
  const profileImage = document.getElementById('profileImage');
  const photoFileInput = document.getElementById('photoFileInput');
  const resetPhotoBtn = document.getElementById('resetPhotoBtn');
  const downloadResumeBtn = document.getElementById('downloadResumeBtn');
  const downloadTextResumeBtn = document.getElementById('downloadTextResumeBtn');
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');
  const toastNotification = document.getElementById('toastNotification');
  const topHireMeBtn = document.getElementById('topHireMeBtn');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.querySelector('.nav-links');

  let isEditMode = false;

  // --- INITIALIZATION ---
  function init() {
    loadTheme();
    loadPhoto();
    loadTextEdits();
    setupEventListeners();
    setupScrollSpy();
  }

  // --- THEME MANAGEMENT ---
  function loadTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'cyber';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSelect) {
      themeSelect.value = savedTheme;
    }
  }

  function handleThemeChange(e) {
    const newTheme = e.target.value;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    showToast(`Theme changed to: ${getThemeName(newTheme)}`);
  }

  function getThemeName(key) {
    const names = {
      cyber: 'Cyber Obsidian',
      aurora: 'Midnight Aurora',
      sunset: 'Sunset Crimson',
      luxe: 'Minimal Luxe'
    };
    return names[key] || key;
  }

  // --- PHOTO EDITING & STORAGE ---
  function loadPhoto() {
    const savedPhoto = localStorage.getItem(STORAGE_KEYS.PHOTO);
    if (savedPhoto && profileImage) {
      profileImage.src = savedPhoto;
    }
  }

  function handlePhotoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Verify it's an image
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    // Limit to reasonable size (< 5MB) for localStorage
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const base64Data = event.target.result;
      if (profileImage) {
        profileImage.src = base64Data;
      }
      try {
        localStorage.setItem(STORAGE_KEYS.PHOTO, base64Data);
        showToast('Profile photo updated successfully!');
      } catch (err) {
        console.warn('LocalStorage limit reached while saving photo:', err);
        showToast('Photo displayed! (Storage limit reached for persistent save)');
      }
    };
    reader.readAsDataURL(file);
  }

  function resetPhoto() {
    if (profileImage) {
      profileImage.src = DEFAULT_AVATAR;
    }
    localStorage.removeItem(STORAGE_KEYS.PHOTO);
    if (photoFileInput) {
      photoFileInput.value = '';
    }
    showToast('Profile photo reset to default');
  }

  // --- LIVE IN-PLACE TEXT EDITING ---
  function toggleEditMode() {
    isEditMode = !isEditMode;
    const editableElements = document.querySelectorAll('[data-editable-id]');

    if (isEditMode) {
      document.body.classList.add('edit-mode-active');
      editToolbar.style.display = 'flex';
      editBtnText.textContent = 'Exit Editing';
      toggleEditBtn.classList.add('btn-primary');
      toggleEditBtn.classList.remove('btn-secondary');

      editableElements.forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
      });

      showToast('✏️ Edit Mode ON: Click any text or the photo to edit!');
    } else {
      document.body.classList.remove('edit-mode-active');
      editToolbar.style.display = 'none';
      editBtnText.textContent = 'Edit Website';
      toggleEditBtn.classList.remove('btn-primary');
      toggleEditBtn.classList.add('btn-secondary');

      editableElements.forEach(el => {
        el.removeAttribute('contenteditable');
      });

      // Auto-save on exit
      saveAllEdits(false);
      showToast('Edit Mode OFF: All edits preserved!');
    }
  }

  function saveAllEdits(notify = true) {
    const editableElements = document.querySelectorAll('[data-editable-id]');
    const edits = {};

    editableElements.forEach(el => {
      const id = el.getAttribute('data-editable-id');
      if (id) {
        edits[id] = el.innerHTML;
      }
    });

    try {
      localStorage.setItem(STORAGE_KEYS.EDITS, JSON.stringify(edits));
      syncDynamicFields();
      if (notify) {
        showToast('💾 All website changes successfully saved!');
      }
    } catch (err) {
      console.error('Failed to save edits to localStorage', err);
      showToast('Error saving changes to local storage.');
    }
  }

  function loadTextEdits() {
    const savedEdits = localStorage.getItem(STORAGE_KEYS.EDITS);
    if (!savedEdits) return;

    try {
      const edits = JSON.parse(savedEdits);
      Object.keys(edits).forEach(id => {
        const el = document.querySelector(`[data-editable-id="${id}"]`);
        if (el && edits[id]) {
          el.innerHTML = edits[id];
        }
      });
      syncDynamicFields();
    } catch (err) {
      console.error('Failed to parse saved edits', err);
    }
  }

  function resetAllEdits() {
    if (confirm('Are you sure you want to reset all text edits back to the original default information?')) {
      localStorage.removeItem(STORAGE_KEYS.EDITS);
      showToast('All text reset to default. Refreshing...');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  }

  // Keep email/phone links synced if user edits email/phone text
  function syncDynamicFields() {
    const emailEl = document.querySelector('[data-editable-id="contact-email"]');
    const phoneEl = document.querySelector('[data-editable-id="contact-phone"]');
    const emailLink = document.getElementById('emailActionLink');
    const phoneLink = document.getElementById('phoneActionLink');
    const resumeEmail = document.querySelector('[data-editable-id="resume-email-display"]');
    const resumePhone = document.querySelector('[data-editable-id="resume-phone-display"]');

    if (emailEl && emailLink) {
      const cleanEmail = emailEl.textContent.trim();
      emailLink.href = `mailto:${cleanEmail}`;
      if (resumeEmail && resumeEmail.textContent !== cleanEmail) {
        resumeEmail.textContent = cleanEmail;
      }
    }

    if (phoneEl && phoneLink) {
      const cleanPhone = phoneEl.textContent.trim().replace(/\s+/g, '');
      phoneLink.href = `tel:${cleanPhone}`;
      if (resumePhone && resumePhone.textContent !== phoneEl.textContent.trim()) {
        resumePhone.textContent = phoneEl.textContent.trim();
      }
    }
  }

  // --- RESUME DOWNLOAD ACTIONS ---
  function downloadResumePDF() {
    showToast('📄 Opening Print to PDF dialog...');
    window.print();
  }

  function downloadTextResume() {
    const resumeDoc = document.getElementById('resumeDocument');
    if (!resumeDoc) return;

    const resumeName = document.querySelector('[data-editable-id="resume-name"]')?.textContent.trim() || 'VISHAL';
    const resumeTagline = document.querySelector('[data-editable-id="resume-tagline"]')?.textContent.trim() || 'B.Tech First-Year Student | JECERC University';
    const resumeLoc = document.querySelector('[data-editable-id="resume-loc"]')?.textContent.trim() || 'Sikar, Rajasthan, India';
    const resumeEmail = document.querySelector('[data-editable-id="resume-email-display"]')?.textContent.trim() || 'vishal@example.com';
    const resumePhone = document.querySelector('[data-editable-id="resume-phone-display"]')?.textContent.trim() || '+91 98765 43210';

    const textContent = `===============================================================
                         RESUME: ${resumeName.toUpperCase()}
===============================================================

TITLE: ${resumeTagline}
LOCATION: ${resumeLoc}
EMAIL: ${resumeEmail}
PHONE: ${resumePhone}

---------------------------------------------------------------
1. EDUCATION
---------------------------------------------------------------
* Bachelor of Technology (B.Tech) - 1st Year (Present)
  Institution: JECERC University
  Location: Sikar / Jaipur, Rajasthan
  Details: First-year undergraduate student focused on computer science and programming foundations.

---------------------------------------------------------------
2. ACHIEVEMENTS & CERTIFICATIONS
---------------------------------------------------------------
* Certificate from IBM: Successfully earned recognized certification from IBM.
* C Language: Built foundational programming skills and core knowledge in C.
* Learning C Language: Ongoing continuous expansion into data structures, algorithms, and practical C implementations.

---------------------------------------------------------------
3. SKILLS & COMPETENCIES
---------------------------------------------------------------
* Communication: Fluent in English (Written & Verbal)
* Physical & Athletic: Athletic conditioning, Calisthenics bodyweight strength
* Endurance: Can run 6 km without any break
* Discipline: Likes learning fighting skills & martial arts

---------------------------------------------------------------
4. HOBBIES & INTERESTS
---------------------------------------------------------------
* Play Basketball
* Playing Online Games
* Studying & continuous learning

===============================================================
Generated from Vishal's Portfolio Website
===============================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resume_${resumeName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📥 Downloaded text resume!');
  }

  // --- CONTACT FORM HANDLING ---
  function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('senderName')?.value.trim();
    const email = document.getElementById('senderEmail')?.value.trim();
    const subject = document.getElementById('messageSubject')?.value;
    const message = document.getElementById('senderMessage')?.value.trim();

    if (!name || !email || !message) {
      showToast('Please fill in all required form fields.');
      return;
    }

    const emailDisplay = document.getElementById('contactEmailDisplay')?.textContent.trim() || 'vishal@example.com';

    // Show simulated success feedback
    if (formFeedback) {
      formFeedback.className = 'form-feedback success';
      formFeedback.innerHTML = `<strong>Thank you, ${name}!</strong> Your message has been prepared for Vishal (${emailDisplay}). Opening your email app...`;
      formFeedback.style.display = 'block';
    }

    // Trigger user's default email client with pre-filled details
    const mailtoUri = `mailto:${encodeURIComponent(emailDisplay)}?subject=${encodeURIComponent(subject + ' - from ' + name)}&body=${encodeURIComponent("Sender Name: " + name + "\nSender Email: " + email + "\n\nMessage:\n" + message)}`;

    setTimeout(() => {
      window.location.href = mailtoUri;
    }, 600);

    contactForm.reset();
  }

  // --- TOAST NOTIFICATIONS ---
  let toastTimeout = null;
  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.style.display = 'flex';

    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(() => {
      toastNotification.style.display = 'none';
    }, 3500);
  }

  // --- SCROLL SPY & ACTIVE NAV ---
  function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links .nav-link');

    window.addEventListener('scroll', () => {
      let currentSectionId = '';
      const scrollPosition = window.scrollY + 200;

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
          currentSectionId = section.getAttribute('id');
        }
      });

      navItems.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      });
    });
  }

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // Theme Switcher
    if (themeSelect) {
      themeSelect.addEventListener('change', handleThemeChange);
    }

    // Edit Mode Toggle
    if (toggleEditBtn) {
      toggleEditBtn.addEventListener('click', toggleEditMode);
    }

    // Save Edits Button
    if (saveEditsBtn) {
      saveEditsBtn.addEventListener('click', () => saveAllEdits(true));
    }

    // Reset Edits Button
    if (resetEditsBtn) {
      resetEditsBtn.addEventListener('click', resetAllEdits);
    }

    // Photo Upload
    if (photoFileInput) {
      photoFileInput.addEventListener('change', handlePhotoUpload);
    }

    // Reset Photo
    if (resetPhotoBtn) {
      resetPhotoBtn.addEventListener('click', resetPhoto);
    }

    // Resume Downloads
    if (downloadResumeBtn) {
      downloadResumeBtn.addEventListener('click', downloadResumePDF);
    }

    if (downloadTextResumeBtn) {
      downloadTextResumeBtn.addEventListener('click', downloadTextResume);
    }

    // Contact Form
    if (contactForm) {
      contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Top "Hire Me" button smooth focus
    if (topHireMeBtn) {
      topHireMeBtn.addEventListener('click', () => {
        setTimeout(() => {
          const subjectSelect = document.getElementById('messageSubject');
          if (subjectSelect) {
            subjectSelect.value = 'Hiring / Opportunity';
          }
          const nameField = document.getElementById('senderName');
          if (nameField) {
            nameField.focus();
          }
        }, 400);
      });
    }

    // Mobile Hamburger Menu
    if (mobileMenuToggle && navLinks) {
      mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
      });

      // Close menu when clicking link
      navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
        });
      });
    }
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
