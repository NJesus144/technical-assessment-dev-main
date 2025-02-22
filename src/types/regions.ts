export interface Polygon {
  coordinates: number[][][]
}

export interface RegionDTO {
  name: string
  polygon: Polygon
  user: string
}

export interface RegionUpdateDTO {
  name?: string
  polygon?: Polygon
}
