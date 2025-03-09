import { MedusaService } from '@medusajs/framework/utils'
import ProductLength from './models/product-length'
import CapSize from './models/cap-size'

export default class HairPropsModuleService extends MedusaService({
  ProductLength,
  CapSize,
}) {}
