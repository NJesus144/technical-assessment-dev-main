import { getModelForClass, index, modelOptions, pre, Prop, Ref } from '@typegoose/typegoose'
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses'
import * as mongoose from 'mongoose'
import { User, UserModel } from './User'

class Base extends TimeStamps {
  @Prop({ required: true, default: () => new mongoose.Types.ObjectId().toString() })
  _id!: string
}

class PolygonSchema {
  @Prop({ required: true, enum: ['Polygon'] })
  type!: 'Polygon'

  @Prop({ required: true, type: [[[Number]]] })
  coordinates!: number[][][]
}

@index({ polygon: '2dsphere' })
@pre<Region>('save', async function (next) {
  const region = this

  if (!region._id) {
    region._id = new mongoose.Types.ObjectId().toString()
  }

  if (region.isNew) {
    const user = await UserModel.findOneAndUpdate(
      { _id: region.user },
      { $push: { regions: region._id } },
      { new: true }
    )
    console.log(user)
    if (!user) {
      return next(new Error('User not found'))
    }
  }

  if (region.polygon.coordinates[0].length < 4) {
    return next(
      new Error('A polygon must have at least 4 points, the last one being equal to the first one')
    )
  }

  const firstPoint = region.polygon.coordinates[0][0]
  const lastPoint = region.polygon.coordinates[0][region.polygon.coordinates[0].length - 1]
  if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
    return next(new Error('The polygon must be closed (first and last points must be equal)'))
  }

  next()
})
@modelOptions({ schemaOptions: { validateBeforeSave: false } })
export class Region extends Base {
  @Prop({ required: true })
  name!: string

  @Prop({
    required: true,
    type: () => Object,
    validate: {
      validator: function (v: any) {
        return (
          v.type === 'Polygon' &&
          Array.isArray(v.coordinates) &&
          Array.isArray(v.coordinates[0]) &&
          v.coordinates[0].length >= 4
        )
      },
      message: 'Invalid GeoJSON format for polygon',
    },
  })
  polygon!: PolygonSchema

  @Prop({ ref: () => User, required: true, type: () => String })
  user!: Ref<User>
}

export const RegionModel = getModelForClass(Region)
