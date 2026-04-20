export const SITES = [
  {
    id: 'atakenteczadeposu',
    name: 'Atakent Eczadeposu',
    logo: '/logos/atakenteczadeposu.png',
    apiBaseUrl: 'https://example.com/api/atakenteczadeposu',
  },
  {
    id: 'ornek_site',
    name: 'Örnek Site',
    logo: '/logos/ornek-site.png',
    apiBaseUrl: 'https://example.com/api/ornek-site',
  },
]

export function getSiteById(id) {
  return SITES.find((s) => s.id === id)
}

