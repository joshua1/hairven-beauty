import { model } from '@medusajs/framework/utils'
import { InferTypeOf } from '@medusajs/framework/types'
import Color from './cap-size'

const ProductLength = model.define('productLength', {
  id: model.id().primaryKey(),
  name: model.text(),
  colors: model.hasMany(() => Color),
})

export type ProductLengthModelType = InferTypeOf<typeof ProductLength>

export default ProductLength
