import { CorsOptions } from 'cors'

export const corsConfig: CorsOptions = {
  origin: function (origin, callback) {
    const whiteList = [
      process.env.FRONTEND_URL,        // dominio de producción (Netlify)
      'https://devtreejaredbardales.netlify.app'          // desarrollo local (Vite u otro)
    ]

    // Permitir solicitudes sin 'origin' (como Postman o curl)
    if (!origin || whiteList.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Error de CORS: origen no permitido -> ' + origin))
    }
  },
  credentials: true // IMPORTANTE si usas cookies o headers de auth
}