/**
 * Lead Form Handler for M.T. Solar by MTC
 * Connects all website forms to the unified Cloudflare Pages / Local Dev endpoint: /api/submit-lead
 */
document.addEventListener('DOMContentLoaded', () => {
  // Bind all lead forms across all pages
  const leadForms = document.querySelectorAll('form[data-lead-form="true"], #leadForm, #quote-form form, form[data-form-type]');

  leadForms.forEach(form => {
    // 1. Auto-inject invisible honeypot field for bot spam filtering if not already present
    if (!form.querySelector('input[name="_hp"]')) {
      const hpInput = document.createElement('input');
      hpInput.type = 'text';
      hpInput.name = '_hp';
      hpInput.tabIndex = -1;
      hpInput.autocomplete = 'off';
      hpInput.setAttribute('aria-hidden', 'true');
      hpInput.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;width:1px;height:1px;';
      form.appendChild(hpInput);
    }

    // 2. Interactive radio button cards styling (for survey/calculator forms)
    const radioLabels = form.querySelectorAll('label:has(input[type="radio"])');
    radioLabels.forEach(label => {
      const radio = label.querySelector('input[type="radio"]');
      if (radio) {
        label.addEventListener('click', () => {
          const groupName = radio.name;
          form.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
            const parent = r.closest('label');
            if (parent) {
              parent.classList.remove('bg-amber-50', 'border-amber-400', 'text-amber-900', 'font-semibold');
              parent.classList.add('hover:bg-slate-50', 'border-slate-200');
            }
          });
          label.classList.add('bg-amber-50', 'border-amber-400', 'text-amber-900', 'font-semibold');
          label.classList.remove('hover:bg-slate-50', 'border-slate-200');
        });
      }
    });

    // 3. Form Submission Handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Determine form type from attribute or context path
      let formType = form.dataset.formType || form.getAttribute('data-form-type');
      if (!formType) {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('pm-surya-ghar')) formType = 'subsidy_application';
        else if (path.includes('commercial') || path.includes('housing-societies')) formType = 'commercial_audit';
        else if (path.includes('contact')) formType = 'contact_inquiry';
        else if (path.includes('partner')) formType = 'partner_application';
        else if (path.includes('refer')) formType = 'referral_submission';
        else if (path.includes('careers')) formType = 'job_application';
        else if (path.includes('webinars')) formType = 'event_registration';
        else formType = 'site_survey';
      }

      // Collect form fields
      const formData = new FormData(form);
      const dataObj = {};
      let honeypotValue = '';

      formData.forEach((value, key) => {
        if (key === '_hp') {
          honeypotValue = value.toString();
        } else {
          dataObj[key] = value.toString().trim();
        }
      });

      // Phone Number Validation (Primary or Friend phone)
      const phoneVal = (dataObj.phone || dataObj.referrer_phone || '').replace(/\D/g, '');
      if (phoneVal.length < 10) {
        if (window.showToast) {
          window.showToast('Please enter a valid 10-digit mobile number.', true);
        }
        const phoneInput = form.querySelector('input[name="phone"], input[type="tel"]');
        if (phoneInput) phoneInput.focus();
        return;
      }

      // PIN Code Validation (for survey and subsidy forms)
      if (dataObj.pincode) {
        const pin = dataObj.pincode.replace(/\D/g, '');
        if (pin.length !== 6) {
          if (window.showToast) {
            window.showToast('Please enter a valid 6-digit PIN code.', true);
          }
          const pinInput = form.querySelector('input[name="pincode"]');
          if (pinInput) pinInput.focus();
          return;
        }

        // Restrict to West Bengal PIN prefix (70–74)
        const prefix = parseInt(pin.substring(0, 2), 10);
        if (prefix < 70 || prefix > 74) {
          if (window.showToast) {
            window.showToast('This PIN code is out of our service area. We currently provide rooftop solar services across West Bengal only.', true);
          }
          const pinInput = form.querySelector('input[name="pincode"]');
          if (pinInput) pinInput.focus();
          return;
        }
      }

      // Submit Button Loading State
      const submitBtn = form.querySelector('button[type="submit"]');
      let originalHtml = '';
      if (submitBtn) {
        originalHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Submitting...';
        submitBtn.disabled = true;
      }

      const payload = {
        form_type: formType,
        source_page: window.location.pathname,
        source_title: document.title,
        timestamp: new Date().toISOString(),
        data: dataObj,
        _hp: honeypotValue,
      };

      try {
        const response = await fetch('/api/submit-lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        let result = {};
        try {
          result = await response.json();
        } catch (jsonErr) {
          result = { error: `Server returned status ${response.status} (${response.statusText})` };
        }

        if (response.ok && result.success) {
          if (window.showToast) {
            window.showToast(result.message || 'Thank you! Your request has been received. Our team will contact you shortly.');
          }

          if (submitBtn) {
            submitBtn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Submitted Successfully!';
            submitBtn.classList.remove('bg-brand-navy', 'hover:bg-slate-900');
            submitBtn.classList.add('bg-emerald-600', 'text-white');
          }

          form.reset();

          setTimeout(() => {
            if (submitBtn) {
              submitBtn.innerHTML = originalHtml;
              submitBtn.classList.remove('bg-emerald-600');
              submitBtn.classList.add('bg-brand-navy', 'hover:bg-slate-900');
              submitBtn.disabled = false;
            }
          }, 3500);
        } else {
          const errMsg = result.error || result.message || `Unable to submit right now (Status ${response.status}). Please call +91 9083326210.`;
          if (window.showToast) {
            window.showToast(errMsg, true);
          }
          if (submitBtn) {
            submitBtn.innerHTML = originalHtml;
            submitBtn.disabled = false;
          }
        }
      } catch (err) {
        console.error('Lead submission network error:', err);
        const userMsg = err.message ? `Connection error (${err.message}). Please retry or call +91 9083326210.` : 'Network error. Please check your internet or call our office directly at +91 9083326210.';
        if (window.showToast) {
          window.showToast(userMsg, true);
        }
        if (submitBtn) {
          submitBtn.innerHTML = originalHtml;
          submitBtn.disabled = false;
        }
      }
    });
  });
});
