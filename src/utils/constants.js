let apiRoot = ''

console.log('import.meta.env: ', import.meta.env)
console.log('process.env: ', process.env)

if (process.env.BUILD_MODE === 'dev') {
  apiRoot = 'http://localhost:8017'
}

if (process.env.BUILD_MODE === 'production') {
  apiRoot = 'https://trello-api-89jx.onrender.com'
}

// console.log('🚀 ~ apiRoot:', apiRoot)

export const API_ROOT = apiRoot

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12
