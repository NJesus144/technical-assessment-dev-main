import axios from 'axios'
import { logError, logInfo } from '../config/logger'
import {
  GeocodingError,
  IAddressComponent,
  IGeoCoordinates,
  IGoogleGeocodingResponse,
} from '../interfaces/geo.interface'
import { IAddress } from '../interfaces/user.interface'

class GeoLib {
  private readonly apiKey: string
  private readonly geocodingBaseUrl: string
  private readonly axiosInstance

  constructor() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || ''
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY não configurada')
    }

    this.apiKey = apiKey
    this.geocodingBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json'

    this.axiosInstance = axios.create({
      timeout: 5000,
      validateStatus: (status) => status >= 200 && status < 300,
    })
  }

  private extractAddressComponents(components: IAddressComponent[]): IAddress {
    const address: Partial<IAddress> = {}
    const componentMap: { [key: string]: keyof IAddress } = {
      street_number: 'number',
      route: 'street',
      locality: 'city',
      administrative_area_level_1: 'state',
      country: 'country',
      postal_code: 'zipCode',
    }

    for (const component of components) {
      for (const type of component.types) {
        const field = componentMap[type]
        if (field) {
          address[field] =
            type === 'administrative_area_level_1' ? component.short_name : component.long_name
        }
      }
    }

    return address as IAddress
  }

  private validateCoordinates(coordinates: [number, number]): void {
    const [lng, lat] = coordinates

    if (!lat || !lng) {
      throw new GeocodingError('Coordenadas inválidas', 'INVALID_COORDINATES')
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new GeocodingError('Coordenadas fora do intervalo válido', 'COORDINATES_OUT_OF_RANGE')
    }
  }

  private buildAddressString(address: IAddress): string {
    const components = [
      address.number && address.street ? `${address.number} ${address.street}` : address.street,
      address.city,
      address.state,
      address.country,
      address.zipCode,
    ].filter(Boolean)

    if (components.length === 0) {
      throw new GeocodingError('Endereço não possui componentes suficientes', 'INVALID_ADDRESS')
    }

    return components.join(', ')
  }

  public async getAddressFromCoordinates(coordinates: [number, number]): Promise<IAddress> {
    try {
      this.validateCoordinates(coordinates)
      const [lng, lat] = coordinates

      logInfo('Iniciando geocodificação reversa', 'GeoLib', { lat, lng })

      const response = await this.axiosInstance.get(
        `${this.geocodingBaseUrl}?latlng=${lat},${lng}&key=${this.apiKey}`
      )

      if (response.data.status !== 'OK' || !response.data.results[0]) {
        throw new GeocodingError(
          'Não foi possível obter o endereço para as coordenadas fornecidas',
          'NO_RESULTS'
        )
      }

      const result = response.data.results[0]
      const address = this.extractAddressComponents(result.address_components)

      logInfo('Geocodificação reversa concluída com sucesso', 'GeoLib', {
        coordinates,
        address,
      })

      return address
    } catch (error) {
      logError(error as Error, 'GeoLib', {
        action: 'getAddressFromCoordinates',
        coordinates,
      })

      if (error instanceof GeocodingError) throw error

      throw new GeocodingError(
        'Erro ao converter coordenadas em endereço',
        'GEOCODING_ERROR',
        error
      )
    }
  }

  public async getCoordinatesFromAddress(address: IAddress): Promise<IGeoCoordinates> {
    try {
      const addressString = this.buildAddressString(address)

      logInfo('Iniciando geocodificação', 'GeoLib', { address })

      const response = (await this.axiosInstance.get(
        `${this.geocodingBaseUrl}?address=${encodeURIComponent(addressString)}&key=${this.apiKey}`
      )) as { data: IGoogleGeocodingResponse }

      if (response.data.status !== 'OK' || !response.data.results[0]) {
        throw new GeocodingError(
          'Não foi possível obter as coordenadas para o endereço fornecido',
          'NO_RESULTS'
        )
      }

      const { lat, lng } = response.data.results[0].geometry.location

      logInfo('Geocodificação concluída com sucesso', 'GeoLib', {
        address,
        coordinates: { lat, lng },
      })

      return { lat, lng }
    } catch (error) {
      logError(error as Error, 'GeoLib', {
        action: 'getCoordinatesFromAddress',
        address,
      })

      if (error instanceof GeocodingError) throw error

      throw new GeocodingError(
        'Erro ao converter endereço em coordenadas',
        'GEOCODING_ERROR',
        error
      )
    }
  }
}

export default new GeoLib()
