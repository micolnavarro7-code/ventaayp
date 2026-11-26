/*
 * A&P · Formulario «Te llamamos» (el mismo archivo en todas las landings).
 *
 * Uso en el HTML:
 *   <div id="aypForm"
 *        style="--ayp-accent:#C4643B;--ayp-accent-dk:#A84F2C"
 *        data-endpoint="https://script.google.com/macros/s/XXXX/exec"
 *        data-landing="Turístico"
 *        data-boton="Que me llamen"></div>
 *   <script src="/turistico/contacto.js" defer></script>
 *
 * Pide solo nombre, teléfono y un mensaje opcional. Para saber de dónde viene
 * cada contacto envía además, sin que el visitante lo vea: la landing
 * (data-landing), la ciudad (del anuncio o del ancla #madrid…), los UTMs, la
 * página y la web de la que llegó. Lo recibe apps-script.gs, que lo guarda en
 * la hoja y avisa por email. Al enviarse mide la conversión en el píxel.
 */
(function () {
  'use strict';
  var root = document.getElementById('aypForm');
  if (!root) return;

  var ENDPOINT = root.getAttribute('data-endpoint') || '';
  var LANDING = root.getAttribute('data-landing') || location.pathname;
  var BOTON = root.getAttribute('data-boton') || 'Que me llamen';
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var qs = new URLSearchParams(location.search);

  var CIUDADES = { madrid: 'Madrid', valladolid: 'Valladolid', valencia: 'Valencia' };
  function ciudad() {
    var pista = (qs.get('utm_content') || location.hash.replace('#', '') || '').toLowerCase();
    return CIUDADES[pista] || '';
  }

  var uid = 'ayp' + Math.random().toString(36).slice(2, 7);
  root.className = (root.className + ' ayp-form').trim();
  root.innerHTML =
    '<form novalidate>' +
      '<div class="ayp-form__field">' +
        '<label for="' + uid + 'n">Nombre</label>' +
        '<input id="' + uid + 'n" name="nombre" autocomplete="name" required maxlength="80">' +
      '</div>' +
      '<div class="ayp-form__field">' +
        '<label for="' + uid + 't">Teléfono</label>' +
        '<input id="' + uid + 't" name="telefono" type="tel" inputmode="tel" autocomplete="tel" required ' +
          'placeholder="600 000 000" pattern="\\+?[0-9 ().-]{9,20}" maxlength="20">' +
      '</div>' +
      '<div class="ayp-form__field">' +
        '<label for="' + uid + 'm">Mensaje <span>(opcional)</span></label>' +
        '<textarea id="' + uid + 'm" name="mensaje" rows="3" maxlength="500" ' +
          'placeholder="Cuéntanos brevemente tu piso o cuándo te viene bien que te llamemos"></textarea>' +
      '</div>' +
      // Campo trampa para bots: oculto a las personas.
      '<div class="ayp-form__hp" aria-hidden="true">' +
        '<label>No rellenar <input name="website" tabindex="-1" autocomplete="off"></label>' +
      '</div>' +
      '<label class="ayp-form__check">' +
        '<input type="checkbox" name="consentimiento" value="si" required>' +
        '<span>Acepto que A&amp;P Real Estate S.L. use estos datos solo para contactarme sobre mi consulta. ' +
        'Puedo pedir su borrado en <a href="mailto:info@aypsl.es">info@aypsl.es</a>.</span>' +
      '</label>' +
      '<p class="ayp-form__err" role="alert" hidden></p>' +
      '<button type="submit" class="ayp-form__btn">' + BOTON + '</button>' +
      '<p class="ayp-form__note">Sin compromiso. Te llama Pedro o Álex.</p>' +
    '</form>' +
    '<div class="ayp-form__ok" hidden>' +
      '<div class="ayp-form__tick" aria-hidden="true">✓</div>' +
      '<h3>¡Recibido!</h3>' +
      '<p>Te llamamos lo antes posible. Si es urgente, escríbenos por WhatsApp.</p>' +
    '</div>';

  var form = root.querySelector('form');
  var ok = root.querySelector('.ayp-form__ok');
  var err = root.querySelector('.ayp-form__err');
  var btn = root.querySelector('.ayp-form__btn');

  function fallo(msg) {
    err.textContent = msg;
    err.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    if (!form.checkValidity()) {
      var bad = form.querySelector(':invalid');
      if (bad && bad.name === 'consentimiento') fallo('Marca la casilla para que podamos llamarte.');
      else if (bad && bad.name === 'telefono') fallo('Revisa el teléfono: mínimo 9 cifras.');
      else fallo('Escribe tu nombre y tu teléfono.');
      form.classList.add('is-checked');
      if (bad) bad.focus();
      return;
    }
    if (!ENDPOINT) {
      fallo('El formulario aún no está conectado. Escríbenos por WhatsApp.');
      return;
    }

    var datos = new URLSearchParams(new FormData(form));
    UTM.forEach(function (k) { datos.set(k, qs.get(k) || ''); });
    datos.set('landing', LANDING);
    datos.set('ciudad', ciudad());
    datos.set('pagina', location.href.split('#')[0]);
    datos.set('referrer', document.referrer || '');

    btn.disabled = true;
    btn.textContent = 'Enviando…';
    // no-cors: Apps Script no devuelve cabeceras CORS. La respuesta es opaca, así
    // que solo se distingue un fallo de red (catch) de un envío realizado.
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: datos })
      .then(function () {
        form.hidden = true;
        ok.hidden = false;
        try { window.oaiq && window.oaiq('measure', 'lead_created', { type: 'customer_action' }); } catch (_) {}
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = BOTON;
        fallo('No se ha podido enviar. Inténtalo de nuevo o escríbenos por WhatsApp.');
      });
  });
})();
