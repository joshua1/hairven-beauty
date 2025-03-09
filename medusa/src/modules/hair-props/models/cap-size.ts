import { model } from '@medusajs/framework/utils'
import { InferTypeOf } from '@medusajs/framework/types'
import ProductLength from './product-length'

const CapSize = model.define('capSize', {
  id: model.id().primaryKey(),
  name: model.text(),
  hex_code: model.text(),
  productLength: model.belongsTo(() => ProductLength, {
    mappedBy: 'capSizes',
  }),
})

export type CapSizeModelType = InferTypeOf<typeof CapSize>

export default CapSize
