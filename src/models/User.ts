import { Region } from '../models/Region'

import { getModelForClass, pre, Prop, Ref } from '@typegoose/typegoose'
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses'
import * as bcrypt from 'bcrypt'
import * as mongoose from 'mongoose'
import { IAddress, IUser, UserDocument } from '../interfaces/user.interface'
import GeoLib from '../lib/GeoLib'

class Base extends TimeStamps {
  @Prop({ required: true, default: () => new mongoose.Types.ObjectId().toString() })
  _id!: string
}

export class Address implements IAddress {
  @Prop({ required: false })
  street?: string

  @Prop({ required: false })
  number?: string

  @Prop({ required: false })
  city?: string

  @Prop({ required: false })
  state?: string

  @Prop({ required: false })
  country?: string

  @Prop({ required: false })
  zipCode?: string
}

@pre<User>('save', async function (next) {
  const user = this

  if (this.isNew) {
    if (!user.coordinates && !user.address) {
      return next(new Error('Please provide coordinates or address.'))
    }

    if (
      user.isModified('coordinates') &&
      user.isModified('address') &&
      user.address !== undefined
    ) {
      return next(new Error('Please provide only coordinates or address, not both.'))
    }

    if (user.isModified('coordinates')) {
      user.address = await GeoLib.getAddressFromCoordinates(user.coordinates)
    } else if (user.isModified('address')) {
      const { lat, lng } = await GeoLib.getCoordinatesFromAddress(user.address)
      user.coordinates = [lng, lat]
    }
  }

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10)
  }
  next()
})
export class User extends Base {
  @Prop({ required: true })
  name!: string

  @Prop({ required: true, unique: true })
  email!: string

  @Prop({ type: () => Address, required: false })
  address?: Address

  @Prop({ required: false, type: () => [Number] })
  coordinates?: [number, number]

  @Prop({ required: true, minlength: 8, select: false })
  password!: string

  @Prop({ required: true, default: [], ref: 'Region', type: () => String })
  regions!: Ref<Region>[]
}

export const UserModel = getModelForClass(User)

export const toIUser = (user: UserDocument): IUser => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    password: user.password,
    address: user.address,
    coordinates: user.coordinates,
    regions: user.regions.map((region) => region.toString()),
    createdAt: user.createdAt ?? new Date(),
    updatedAt: user.updatedAt ?? new Date(),
  }
}
