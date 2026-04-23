export const SITES = [
  {
    id: 'atakenteczadeposu',
    name: 'Atakent Eczadeposu',
    logo: '/logos/atakenteczadeposu.png',
  },
  {
    id: 'ornek_site',
    name: 'Örnek Site',
    logo: '/logos/ornek-site.png',
  },
]

export function getSiteById(id) {
  return SITES.find((s) => s.id === id)
}

