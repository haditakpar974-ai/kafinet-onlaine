const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
menuToggle?.addEventListener('click', () => {
  const opened = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(opened));
});
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));
document.getElementById('year').textContent = new Date().getFullYear();

document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.getElementById('service');
    if (select) select.value = link.dataset.service;
  });
});

document.getElementById('requestForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const message = [
    'درخواست خدمات کافی‌نت آنلاین',
    'نام: ' + data.get('name'),
    'شماره تماس: ' + data.get('phone'),
    'نوع خدمت: ' + data.get('service'),
    'توضیحات: ' + (data.get('details') || 'ندارد')
  ].join('\\n');
  const blob = new Blob([message], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'darkhast-kafinet.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  document.getElementById('formMessage').textContent = 'فایل درخواست روی دستگاه شما ذخیره شد. برای ارسال به مدیر سایت، آن را از راه ارتباطی مورد توافق بفرستید. این فرم هنوز به سرور یا پیام‌رسان متصل نیست.';
});
