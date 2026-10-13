// Public URLs stay unchanged. cookie.html remains the existing compatibility redirect.
export const pages = ['index','chi-siamo','fondatrici','insegnanti','studio','discipline','corsi','yoga','pilates','gyrotonic','orari','prezzi','eventi','contatti','dove-siamo','privacy','cookie'].map(name=>({file:name+'.html',url:name==='index'?'/':'/'+name,sitemap:name!=='cookie'}));
