// اتصال سایت کافی‌نت آنلاین به Supabase
// کلید publishable برای استفاده در مرورگر طراحی شده است؛ هرگز service_role را اینجا قرار ندهید.
const SUPABASE_URL = 'https://gipymqvxasesnqdpohsu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vYC5ooH7Sa6gSAlN1FD8xA_24kF8gz7';

const supabaseClient = window.supabase?.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle?.addEventListener('click', () => {
  const opened = mainNav?.classList.toggle('open') ?? false;
  menuToggle.setAttribute('aria-expanded', String(opened));
});

mainNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    const select = document.getElementById('service');
    if (select) select.value = link.dataset.service;
  });
});

const requestForm = document.getElementById('requestForm');

requestForm?.addEventListener('submit', async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const service = String(formData.get('service') || '').trim();
  const details = String(formData.get('details') || '').trim();
  const message = document.getElementById('formMessage');
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.innerHTML;

  const showMessage = (text, isError = false) => {
    if (!message) return;
    message.textContent = text;
    message.style.color = isError ? '#b42318' : '#0f766e';
  };

  if (!name || !phone || !service) {
    showMessage('لطفاً نام، شماره تماس و نوع خدمت را تکمیل کنید.', true);
    return;
  }

  if (!supabaseClient) {
    showMessage('اتصال سایت بارگذاری نشده است. صفحه را تازه‌سازی کنید.', true);
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'در حال ثبت درخواست...';
  }
  showMessage('در حال ارسال درخواست به سامانه...');

  try {
    const { data, error } = await supabaseClient.rpc('create_order', {
      p_name: name,
      p_phone: phone,
      p_service: service,
      p_details: details
    });

    if (error) throw error;

    let trackingCode = '';
    if (Array.isArray(data) && data.length) {
      trackingCode = data[0]?.v_code || data[0]?.tracking_code || data[0]?.code || '';
    } else if (data && typeof data === 'object') {
      trackingCode = data.v_code || data.tracking_code || data.code || '';
    } else if (typeof data === 'string') {
      trackingCode = data;
    }

    showMessage(
      trackingCode
        ? `درخواست شما با موفقیت ثبت شد. کد پیگیری: ${trackingCode}`
        : 'درخواست شما با موفقیت ثبت شد.'
    );
    form.reset();
  } catch (error) {
    console.error('Supabase create_order error:', error);
    const errorText = error?.message || 'خطای ناشناخته';
    showMessage(`ثبت درخواست انجام نشد: ${errorText}`, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText || 'آماده‌سازی درخواست';
    }
  }
});
