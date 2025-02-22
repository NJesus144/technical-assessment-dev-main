import { User } from '../models/User'
import { DocumentType } from '@typegoose/typegoose'

export interface IAddress {
  street?: string
  number?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  formattedAddress?: string
}

export interface IUserCreate {
  name: string
  email: string
  password: string
  address?: IAddress
  coordinates?: [number, number]
}

export interface IUser {
  _id: string
  name: string
  email: string
  password: string
  address?: IAddress
  coordinates?: [number, number]
  regions: string[]
  createdAt: Date
  updatedAt: Date
}

export type UserDocument = DocumentType<User>
