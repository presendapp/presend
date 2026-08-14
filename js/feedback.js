(function() {
  const SITE_KEY = '0x4AAAAAAEQOO1HzprAOju8v';
  
  function initFeedback() {
    const container = document.getElementById('feedback-widget');
    if (!container) return;
    
    const tool = container.dataset.tool || 'general';
    
    container.innerHTML = `
      <div style="margin-top:3rem;padding:1.5rem;background:#f8f9fa;border-radius:12px;border-left:4px solid #0066cc;">
        <h3 style="margin-top:0;">💬 Feedback</h3>
        <p style="color:#6c757d;font-size:0.9rem;">Help us improve this tool. No email required.</p>
        <form id="feedbackForm" style="display:flex;flex-direction:column;gap:0.75rem;">
          <textarea id="feedbackMessage" placeholder="Your feedback..." required minlength="3" maxlength="2000" 
            style="padding:0.75rem;border:1px solid #dee2e6;border-radius:8px;min-height:80px;resize:vertical;font-family:inherit;"></textarea>
          <div class="cf-turnstile" data-sitekey="${SITE_KEY}" data-size="compact"></div>
          <button type="submit" style="padding:0.75rem 1.5rem;background:#0066cc;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
            Send Feedback
          </button>
        </form>
        <p id="feedbackStatus" style="margin-top:0.5rem;font-size:0.9rem;min-height:1.5rem;"></p>
      </div>
    `;
    
    const form = document.getElementById('feedbackForm');
    const status = document.getElementById('feedbackStatus');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = document.getElementById('feedbackMessage').value.trim();
      const token = document.querySelector('[name="cf-turnstile-response"]')?.value;
      
      if (!message || message.length < 3) {
        status.textContent = 'Message too short.';
        status.style.color = '#dc3545';
        return;
      }
      
      status.textContent = 'Sending...';
      status.style.color = '#0066cc';
      
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool, message, turnstileToken: token })
        });
        const data = await res.json();
        if (data.success) {
          status.textContent = '✅ Thank you! Feedback saved.';
          status.style.color = '#198754';
          form.reset();
          if (window.turnstile) turnstile.reset();
        } else {
          status.textContent = '❌ ' + (data.error || 'Error');
          status.style.color = '#dc3545';
        }
      } catch (err) {
        status.textContent = '❌ Network error. Try again.';
        status.style.color = '#dc3545';
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeedback);
  } else {
    initFeedback();
  }
})();
