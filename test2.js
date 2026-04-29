fetch('https://hajj.nusuk.sa/Packages').then(r=>r.text()).then(html=>{ 
  const m = html.match(/href="([^"]*58260000-1777-56b2-eaf5-08de4e3716ff[^"]*)"/g); 
  console.log(m ? m : 'No links to that UUID'); 
});