import { IAddress } from '../interfaces/user.interface'

export interface IGeoCoordinates {
  lat: number
  lng: number
}

export interface IAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface IGoogleGeocodingResult {
  formatted_address: string
  geometry: {
    location: IGeoCoordinates
  }
  address_components: IAddressComponent[]
}

export interface IGoogleGeocodingResponse {
  results: IGoogleGeocodingResult[]
  status: string
}

export interface IGeoService {
  getAddressFromCoordinates(coordinates: [number, number]): Promise<IAddress>
  getCoordinatesFromAddress(address: string): Promise<IGeoCoordinates>
}

export class GeocodingError extends Error {
  constructor(message: string, public readonly code: string, public readonly originalError?: any) {
    super(message)
    this.name = 'GeocodingError'
  }
}
