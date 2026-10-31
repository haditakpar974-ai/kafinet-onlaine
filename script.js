(() => {
  'use strict';
  function initKafinetSite() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    if (menuToggle && mainNav) {
      menuToggle.addEventListener('click', (event) => {
        event.preventDefault();
        const opened = mainNav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(opened));
        menuToggle.setAttribute('aria-label', opened ? 'بستن منو' : 'باز کردن منو');
      });
      mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'باز کردن منو');
      }));
      document.addEventListener('click', event => {
        if (mainNav.classList.contains('open') && !mainNav.contains(event.target) && !menuToggle.contains(event.target)) {
          mainNav.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.setAttribute('aria-label', 'باز کردن منو');
        }
      });
    }
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
    document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
      const select = document.getElementById('service');
      if (select) select.value = link.dataset.service;
    }));
    const requestForm = document.getElementById('requestForm');
    if (requestForm) requestForm.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const message = ['درخواست خدمات کافی‌نت آنلاین','نام: ' + data.get('name'),'شماره تماس: ' + data.get('phone'),'نوع خدمت: ' + data.get('service'),'توضیحات: ' + (data.get('details') || 'ندارد')].join('\n');
      const blob = new Blob([message], {type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='darkhast-kafinet.txt';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      const msg=document.getElementById('formMessage');
      if(msg) msg.textContent='فایل درخواست روی دستگاه شما ذخیره شد. برای ارسال به مدیر سایت، آن را از راه ارتباطی مورد توافق بفرستید. این فرم هنوز به سرور یا پیام‌رسان متصل نیست.';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initKafinetSite, {once:true});
  else initKafinetSite();
})();
