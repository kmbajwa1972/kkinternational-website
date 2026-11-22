const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav-links');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}document.querySelectorAll('#year').forEach(el=>el.textContent=new Date().getFullYear());

// Cloudflare Web Analytics (privacy-first visitor and page-view measurement)
if (!document.querySelector('script[data-cf-beacon]')) {
  const cfBeacon = document.createElement('script');
  cfBeacon.type = 'module';
  cfBeacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  cfBeacon.dataset.cfBeacon = JSON.stringify({ token: '54872c269e9247059b7fb253744f19e4' });
  document.head.appendChild(cfBeacon);
}
