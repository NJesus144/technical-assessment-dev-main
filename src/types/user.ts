export interface Coordinates {
  latitude: number
  longitude: number
}

export interface UserDTO {
  name: string
  email: string
  address?: string
  coordinates?: Coordinates
  password: string
}

export interface UserUpdateDTO extends Partial<UserDTO> {}
