import 'dotenv/config'

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const META_APP_SECRET = process.env.META_APP_SECRET

if (!META_ACCESS_TOKEN || !META_APP_SECRET) {
  throw new Error(
    'Missing Meta credentials. Please set META_ACCESS_TOKEN and META_APP_SECRET in dashboard/.env (see .env.example).'
  )
}

export { META_ACCESS_TOKEN, META_APP_SECRET }
export const META_API_VERSION = 'v21.0'
export const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`
