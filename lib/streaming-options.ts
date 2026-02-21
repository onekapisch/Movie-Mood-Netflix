export interface CountryOption {
  value: string
  label: string
}

export interface StreamingServiceOption {
  key: string
  label: string
  providerId: number
  countries: string[]
}

export const COUNTRIES: CountryOption[] = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "gb", label: "United Kingdom" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "it", label: "Italy" },
  { value: "es", label: "Spain" },
  { value: "br", label: "Brazil" },
  { value: "mx", label: "Mexico" },
  { value: "au", label: "Australia" },
  { value: "jp", label: "Japan" },
  { value: "kr", label: "South Korea" },
  { value: "in", label: "India" },
  { value: "nl", label: "Netherlands" },
  { value: "se", label: "Sweden" },
  { value: "no", label: "Norway" },
  { value: "dk", label: "Denmark" },
  { value: "fi", label: "Finland" },
  { value: "pt", label: "Portugal" },
  { value: "pl", label: "Poland" },
  { value: "za", label: "South Africa" },
  { value: "sg", label: "Singapore" },
  { value: "my", label: "Malaysia" },
  { value: "ph", label: "Philippines" },
  { value: "th", label: "Thailand" },
  { value: "id", label: "Indonesia" },
  { value: "ar", label: "Argentina" },
  { value: "cl", label: "Chile" },
  { value: "co", label: "Colombia" },
  { value: "pe", label: "Peru" },
]

const allCountryCodes = COUNTRIES.map((country) => country.value)

export const STREAMING_SERVICES: StreamingServiceOption[] = [
  { key: "netflix", label: "Netflix", providerId: 8, countries: allCountryCodes },
  { key: "prime-video", label: "Prime Video", providerId: 9, countries: allCountryCodes },
  {
    key: "disney-plus",
    label: "Disney+",
    providerId: 337,
    countries: [
      "us",
      "ca",
      "gb",
      "fr",
      "de",
      "it",
      "es",
      "au",
      "jp",
      "kr",
      "in",
      "nl",
      "se",
      "no",
      "dk",
      "fi",
      "pt",
      "pl",
      "sg",
      "my",
      "ph",
      "th",
      "id",
      "ar",
      "cl",
      "co",
      "pe",
      "mx",
      "br",
      "za",
    ],
  },
  { key: "hulu", label: "Hulu", providerId: 15, countries: ["us"] },
  {
    key: "max",
    label: "Max",
    providerId: 189,
    countries: ["us", "mx", "br", "ar", "cl", "co", "pe"],
  },
  { key: "apple-tv-plus", label: "Apple TV+", providerId: 350, countries: allCountryCodes },
  { key: "peacock", label: "Peacock", providerId: 386, countries: ["us"] },
  {
    key: "paramount-plus",
    label: "Paramount+",
    providerId: 531,
    countries: ["us", "ca", "gb", "au", "br", "mx", "ar", "cl", "co", "pe"],
  },
]

export const DEFAULT_SERVICE_KEY = "netflix"
export const DEFAULT_COUNTRY = "us"

export function getServiceByKey(serviceKey: string): StreamingServiceOption {
  return STREAMING_SERVICES.find((service) => service.key === serviceKey) ?? STREAMING_SERVICES[0]
}

export function getCountryByCode(countryCode: string): CountryOption {
  return COUNTRIES.find((country) => country.value === countryCode) ?? COUNTRIES[0]
}

export function getCountriesForService(serviceKey: string): CountryOption[] {
  const service = getServiceByKey(serviceKey)
  return COUNTRIES.filter((country) => service.countries.includes(country.value))
}

export function getValidCountryForService(serviceKey: string, countryCode?: string): string {
  const countries = getCountriesForService(serviceKey)
  if (countryCode && countries.some((country) => country.value === countryCode)) {
    return countryCode
  }
  return countries[0]?.value ?? DEFAULT_COUNTRY
}
