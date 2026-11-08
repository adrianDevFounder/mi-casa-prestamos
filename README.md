# Demo: geolocalizacion con consentimiento

Proyecto educativo de ciberseguridad. Muestra como se recolecta la ubicacion
**exacta** de una persona de forma legitima: el navegador pide permiso, la pagina
dice quien pide los datos y para que, la persona acepta, y las coordenadas llegan
a un panel que solo tu (el operador) puedes ver.

## Importante: el consentimiento no es opcional

Este demo funciona **solo** con permiso. No intenta ocultar nada:

- El navegador siempre muestra su prompt nativo de ubicacion (no se puede saltar).
- La pagina declara quien solicita los datos y el motivo.
- La persona debe marcar una casilla de aceptacion antes de continuar.
- El servidor descarta cualquier envio sin consentimiento.

Usarlo para rastrear a alguien que no sabe que lo rastreas (ocultando el proposito,
engañando sobre quien pide los datos, etc.) seria ilegal en la mayoria de paises
y queda fuera del proposito de este material.

## Uso

```bash
npm install
PANEL_TOKEN=mi-token-secreto ORG_NOMBRE="Mi casa de prestamos" MOTIVO="contactarte" npm start
```

- Enlace para la persona: `http://localhost:3000/`
- Tu panel (operador):     `http://localhost:3000/panel?token=mi-token-secreto`

Las coordenadas tambien se imprimen en la consola y se guardan en `ubicaciones.log`.

## Probarlo desde otro dispositivo (red local)

La API de geolocalizacion exige contexto seguro: funciona en `localhost`, pero
desde otro telefono necesitas **HTTPS**. La forma mas comoda es un tunel, p. ej.:

```bash
npx localtunnel --port 3000
```

Comparte la URL `https://...` que te den. El panel sigue protegido por tu token.

## Configuracion (variables de entorno)

| Variable      | Default                        | Para que                          |
|---------------|--------------------------------|-----------------------------------|
| `PORT`        | `3000`                         | Puerto del servidor               |
| `PANEL_TOKEN` | `cambia-este-token`            | Clave para ver el panel           |
| `ORG_NOMBRE`  | `Aseguradora Demo S.A.`        | Quien aparece en el aviso         |
| `MOTIVO`      | `localizar el lugar de tu siniestro` | Motivo mostrado en el aviso |
