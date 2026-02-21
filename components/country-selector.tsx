"use client"

import { useState, useEffect } from "react"
import { Clapperboard, Globe } from "lucide-react"
import {
  DEFAULT_COUNTRY,
  DEFAULT_SERVICE_KEY,
  STREAMING_SERVICES,
  getCountriesForService,
  getCountryByCode,
  getServiceByKey,
  getValidCountryForService,
} from "@/lib/streaming-options"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STREAMING_SERVICE_STORAGE_KEY = "selectedStreamingService"
const LEGACY_COUNTRY_STORAGE_KEY = "selectedCountry"

function getServiceCountryStorageKey(serviceKey: string): string {
  return `selectedCountry:${serviceKey}`
}

export default function CountrySelector() {
  const [selectedServiceKey, setSelectedServiceKey] = useState(DEFAULT_SERVICE_KEY)
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY)

  useEffect(() => {
    const savedServiceKey = localStorage.getItem(STREAMING_SERVICE_STORAGE_KEY) || DEFAULT_SERVICE_KEY
    const initialServiceKey = getServiceByKey(savedServiceKey).key

    const savedCountryForService = localStorage.getItem(getServiceCountryStorageKey(initialServiceKey))
    const savedLegacyCountry = localStorage.getItem(LEGACY_COUNTRY_STORAGE_KEY)
    const initialCountry = getValidCountryForService(
      initialServiceKey,
      savedCountryForService || savedLegacyCountry || undefined,
    )

    setSelectedServiceKey(initialServiceKey)
    setSelectedCountry(initialCountry)

    localStorage.setItem(STREAMING_SERVICE_STORAGE_KEY, initialServiceKey)
    localStorage.setItem(getServiceCountryStorageKey(initialServiceKey), initialCountry)
    localStorage.setItem(LEGACY_COUNTRY_STORAGE_KEY, initialCountry)

    emitPreferenceChange(initialServiceKey, initialCountry)
  }, [])

  const handleServiceChange = (nextServiceKey: string) => {
    const validServiceKey = getServiceByKey(nextServiceKey).key
    const savedCountry = localStorage.getItem(getServiceCountryStorageKey(validServiceKey))
    const nextCountry = getValidCountryForService(validServiceKey, savedCountry || selectedCountry)

    setSelectedServiceKey(validServiceKey)
    setSelectedCountry(nextCountry)

    localStorage.setItem(STREAMING_SERVICE_STORAGE_KEY, validServiceKey)
    localStorage.setItem(getServiceCountryStorageKey(validServiceKey), nextCountry)
    localStorage.setItem(LEGACY_COUNTRY_STORAGE_KEY, nextCountry)

    emitPreferenceChange(validServiceKey, nextCountry)
  }

  const handleCountryChange = (nextCountry: string) => {
    const validCountry = getValidCountryForService(selectedServiceKey, nextCountry)
    setSelectedCountry(validCountry)

    localStorage.setItem(getServiceCountryStorageKey(selectedServiceKey), validCountry)
    localStorage.setItem(LEGACY_COUNTRY_STORAGE_KEY, validCountry)

    emitPreferenceChange(selectedServiceKey, validCountry)
  }

  const selectedService = getServiceByKey(selectedServiceKey)
  const availableCountries = getCountriesForService(selectedServiceKey)

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <Select value={selectedServiceKey} onValueChange={handleServiceChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <div className="flex items-center gap-2">
            <Clapperboard className="h-4 w-4 text-netflix-red" />
            <SelectValue placeholder="Platform" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {STREAMING_SERVICES.map((service) => (
            <SelectItem key={service.key} value={service.key}>
              {service.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCountry} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-netflix-red" />
            <SelectValue placeholder="Country">
              {getCountryByCode(selectedCountry).label}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {availableCountries.map((country) => (
            <SelectItem key={country.value} value={country.value}>
              {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground sm:hidden">
        Showing availability for {selectedService.label} in {getCountryByCode(selectedCountry).label}
      </span>
    </div>
  )
}

function emitPreferenceChange(serviceKey: string, country: string) {
  const service = getServiceByKey(serviceKey)

  window.dispatchEvent(
    new CustomEvent("streamingfilterschange", {
      detail: {
        serviceKey: service.key,
        serviceName: service.label,
        providerId: service.providerId,
        country,
      },
    }),
  )

  // Backward compatibility for existing listeners that still expect country-only events.
  window.dispatchEvent(new CustomEvent("countrychange", { detail: country }))
}
