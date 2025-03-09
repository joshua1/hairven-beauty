import { model } from '@medusajs/framework/utils'
import { InferTypeOf } from '@medusajs/framework/types'
import CapSize from './cap-size'

const ProductLength = model.define('productLength', {
  id: model.id().primaryKey(),
  name: model.text(),
  capSizes: model.hasMany(() => CapSize),
})

export type ProductLengthModelType = InferTypeOf<typeof ProductLength>

export default ProductLength
